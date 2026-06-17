import { useMemo, useState, type ReactNode } from "react";
import {
  doc,
  collection,
  writeBatch,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { MasterChecklist } from "../../types";
import {
  parseChecklistCsv,
  parseChecklistMediaWiki,
  parseChecklistHtml,
  type NormalizedChecklistItem,
  type ParseCSVResult,
} from "../../lib/parseChecklist";
import {
  parseFandomPaste,
  enrichItemsWithTags,
  computeImportStats,
} from "../../lib/parseFandomPaste";
import { normalizedToMasterItem } from "../../lib/firestoreConverters";
import { resolveChecklistItemPhotoUrl } from "../../lib/checklistItemPhoto";
import { db, functions, httpsCallable } from "../../lib/firebase";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

type ImportMethod = "paste" | "url" | "advanced";
type AdvancedMode = "csv" | "wiki" | "html";
type DedupeStrategy = "skip" | "update" | "import-anyway";

interface ImportCarsModalProps {
  checklist: MasterChecklist | null;
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

// Keep in sync with AdminChecklistsPage so generated IDs match for dedupe.
const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function buildStableItemId(
  checklist: MasterChecklist,
  toyNumber: string,
  collectorNumber: string,
  modelName: string,
  variationLabel: string,
) {
  const year = String(checklist.year);
  const toy = toSlug(toyNumber || "no-toy");
  const col = toSlug(collectorNumber || "no-col");
  const model = toSlug(modelName || "unknown-model");
  const variant = toSlug(variationLabel || "");
  return [
    toSlug(checklist.brandId ?? checklist.brand),
    year,
    col,
    toy,
    model,
    variant,
  ]
    .filter(Boolean)
    .join("-");
}

const inputClass =
  "w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-600";

export default function ImportCarsModal({
  checklist,
  isOpen,
  onClose,
  onImported,
}: ImportCarsModalProps) {
  const [method, setMethod] = useState<ImportMethod>("paste");
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("csv");

  const [pasteText, setPasteText] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [advancedText, setAdvancedText] = useState("");

  const [phase, setPhase] = useState<"input" | "preview" | "done">("input");
  const [rows, setRows] = useState<NormalizedChecklistItem[]>([]);
  const [problemCount, setProblemCount] = useState(0);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
  const [dedupe, setDedupe] = useState<DedupeStrategy>("skip");

  const [loading, setLoading] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [friendlyError, setFriendlyError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const resetAll = () => {
    setMethod("paste");
    setAdvancedMode("csv");
    setPasteText("");
    setUrlValue("");
    setAdvancedText("");
    setPhase("input");
    setRows([]);
    setProblemCount(0);
    setExistingIds(new Set());
    setDedupe("skip");
    setLoading(false);
    setBusyMessage("");
    setFriendlyError("");
    setImportedCount(0);
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const stats = useMemo(() => computeImportStats(rows), [rows]);

  const duplicateCount = useMemo(() => {
    if (!checklist || existingIds.size === 0) return 0;
    return rows.filter((r) =>
      existingIds.has(
        buildStableItemId(
          checklist,
          r.toyNumber,
          r.collectorNumber,
          r.modelName,
          r.variationLabel,
        ),
      ),
    ).length;
  }, [rows, existingIds, checklist]);

  const enterPreview = async (result: ParseCSVResult) => {
    if (!checklist) return;
    if (result.items.length === 0) {
      const msg = result.errors[0]?.message ?? "";
      // Surface a friendly message; never raw technical errors.
      setFriendlyError(
        /no cars found|no checklist|no car rows|copying the table/i.test(msg)
          ? msg
          : "No cars found. Try copying the table starting with the Toy # column.",
      );
      return;
    }
    setFriendlyError("");
    setRows(result.items);
    setProblemCount(result.errors.length);

    // Load existing item IDs for duplicate detection.
    try {
      const snap = await getDocs(
        collection(db, "checklists", checklist.id, "items"),
      );
      setExistingIds(new Set(snap.docs.map((d) => d.id)));
    } catch {
      setExistingIds(new Set());
    }
    setPhase("preview");
  };

  const handleFindCars = async () => {
    if (!checklist || !pasteText.trim()) return;
    setLoading(true);
    setFriendlyError("");
    try {
      const result = parseFandomPaste(pasteText, checklist.year);
      await enterPreview(result);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedParse = async () => {
    if (!checklist || !advancedText.trim()) return;
    setLoading(true);
    setFriendlyError("");
    try {
      const raw =
        advancedMode === "csv"
          ? parseChecklistCsv(advancedText)
          : advancedMode === "wiki"
            ? parseChecklistMediaWiki(advancedText)
            : parseChecklistHtml(advancedText);
      const result: ParseCSVResult = {
        items: enrichItemsWithTags(raw.items, checklist.year),
        errors: raw.errors,
      };
      await enterPreview(result);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlFetch = async () => {
    if (!checklist || !urlValue.trim()) return;
    if (!functions) {
      setFriendlyError(
        "Online import is not available right now. Please use Paste from Fandom instead.",
      );
      return;
    }
    setLoading(true);
    setBusyMessage("Fetching the page… this can take a few seconds.");
    setFriendlyError("");
    try {
      const fn = httpsCallable<{ url: string }, { html: string }>(
        functions,
        "fetchFandomChecklistHtml",
      );
      const res = await fn({ url: urlValue.trim() });
      const raw = parseChecklistHtml(res.data.html);
      const result: ParseCSVResult = {
        items: enrichItemsWithTags(raw.items, checklist.year),
        errors: raw.errors,
      };
      await enterPreview(result);
    } catch {
      setFriendlyError(
        "We couldn't read that page. Double-check the link, or copy the table and use Paste from Fandom instead.",
      );
    } finally {
      setLoading(false);
      setBusyMessage("");
    }
  };

  const updateRow = (
    index: number,
    field: keyof NormalizedChecklistItem,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const runImport = async () => {
    if (!checklist || rows.length === 0) return;
    setLoading(true);
    setBusyMessage("Saving cars…");
    try {
      const checklistRef = doc(db, "checklists", checklist.id);
      const itemsCol = collection(db, "checklists", checklist.id, "items");
      const seriesSet = new Set<string>(checklist.uniqueSeries ?? []);
      const brandId =
        checklist.brandId ?? checklist.brand.toLowerCase().replace(/\s+/g, "-");

      let batch = writeBatch(db);
      let ops = 0;
      let written = 0;
      const flush = async () => {
        if (ops === 0) return;
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      };

      for (const row of rows) {
        const baseId = buildStableItemId(
          checklist,
          row.toyNumber,
          row.collectorNumber,
          row.modelName,
          row.variationLabel,
        );
        const isDup = existingIds.has(baseId);

        if (isDup && dedupe === "skip") continue;

        let itemId = baseId;
        if (isDup && dedupe === "import-anyway") {
          // Force a brand-new record rather than overwriting the existing one.
          itemId = `${baseId}-copy-${Date.now().toString(36)}-${written}`;
        }

        const itemRef = doc(itemsCol, itemId);
        const data: Record<string, unknown> = {
          ...normalizedToMasterItem(itemId, row),
          brandId,
          year: checklist.year,
          updatedAt: serverTimestamp(),
        };
        if (!isDup || dedupe === "import-anyway") {
          data.createdAt = serverTimestamp();
        }
        batch.set(itemRef, data, { merge: true });
        if (row.seriesName) seriesSet.add(row.seriesName);
        written++;
        ops++;
        if (ops >= 450) await flush();
      }
      await flush();

      const updatedItems = await getDocs(itemsCol);
      await updateDoc(checklistRef, {
        brandId,
        brandName: checklist.brandName ?? checklist.brand,
        totalCars: updatedItems.size,
        uniqueSeries: [...seriesSet],
        updatedAt: serverTimestamp(),
      });

      setImportedCount(written);
      setPhase("done");
      onImported?.();
    } catch {
      setFriendlyError(
        "Something went wrong while saving. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
      setBusyMessage("");
    }
  };

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
      active
        ? "bg-amber-500 text-stone-900"
        : "bg-stone-700 text-stone-400 hover:bg-stone-600"
    }`;

  const isDupRow = (r: NormalizedChecklistItem) =>
    checklist
      ? existingIds.has(
          buildStableItemId(
            checklist,
            r.toyNumber,
            r.collectorNumber,
            r.modelName,
            r.variationLabel,
          ),
        )
      : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Import Cars${checklist ? ` — ${checklist.name}` : ""}`}
      size="xl"
    >
      {phase === "done" ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-stone-100 font-bold text-lg mb-1">
            Added {importedCount} {importedCount === 1 ? "car" : "cars"}!
          </p>
          <p className="text-stone-400 text-sm mb-2">
            They were saved to{" "}
            <strong className="text-stone-200">{checklist?.name}</strong>.
          </p>
          {stats.missingPhotos > 0 && (
            <p className="text-stone-500 text-sm mb-4">
              Some photos could not be imported. You can add them later.
            </p>
          )}
          <Button onClick={close}>Done</Button>
        </div>
      ) : phase === "preview" ? (
        <div className="space-y-4">
          {/* Plain-language summary */}
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4">
            <p className="text-stone-100 font-semibold">
              We found {stats.valid} {stats.valid === 1 ? "car" : "cars"}.
              {problemCount > 0
                ? ` ${problemCount} ${problemCount === 1 ? "row needs" : "rows need"} review.`
                : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              <Stat label="Treasure Hunts" value={stats.treasureHunts} />
              <Stat
                label="Super Treasure Hunts"
                value={stats.superTreasureHunts}
              />
              <Stat label="Store Exclusives" value={stats.exclusives} />
              <Stat label="Missing Photos" value={stats.missingPhotos} />
              <Stat label="Already In List" value={duplicateCount} />
              <Stat label="Total Rows" value={rows.length} />
            </div>
          </div>

          {/* Duplicate handling */}
          {duplicateCount > 0 && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 space-y-2">
              <p className="text-amber-200 text-sm font-semibold">
                {duplicateCount}{" "}
                {duplicateCount === 1 ? "car is" : "cars are"} already in this
                list. What would you like to do?
              </p>
              {(
                [
                  ["skip", "Skip them (only add new cars)"],
                  ["update", "Update the existing cars with this info"],
                  ["import-anyway", "Add them anyway as separate entries"],
                ] as [DedupeStrategy, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="dedupe"
                    checked={dedupe === value}
                    onChange={() => setDedupe(value)}
                    className="accent-amber-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          {/* Editable preview table */}
          <div className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto lg:overflow-x-visible overflow-x-auto">
              <table className="w-full table-fixed text-xs min-w-[720px] lg:min-w-0">
                <colgroup>
                  <col className="w-14" />
                  <col className="w-16" />
                  <col className="w-16" />
                  <col />
                  <col className="w-28" />
                  <col className="w-16" />
                  <col className="w-10" />
                </colgroup>
                <thead>
                  <tr className="border-b border-stone-700 text-left text-stone-400 text-[10px] uppercase tracking-wide bg-stone-800/80">
                    <th className="px-2 py-2">Photo</th>
                    <th className="px-2 py-2">Toy #</th>
                    <th className="px-2 py-2">Col. #</th>
                    <th className="px-2 py-2">Model Name</th>
                    <th className="px-2 py-2">Series</th>
                    <th className="px-2 py-2">Ser. #</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const photoSrc = resolveChecklistItemPhotoUrl(
                      row.photoUrl,
                      row.imageRef,
                    );
                    return (
                      <tr
                        key={i}
                        className="border-b border-stone-800 align-top hover:bg-stone-800/40"
                      >
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-center gap-1">
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt={row.modelName}
                                className="w-10 h-10 object-contain rounded-md bg-stone-700"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-stone-700/50 rounded-md flex items-center justify-center text-base">
                                🚗
                              </div>
                            )}
                            <input
                              value={row.photoUrl}
                              onChange={(e) =>
                                updateRow(i, "photoUrl", e.target.value)
                              }
                              placeholder="Image URL"
                              className={`${inputClass} text-[10px] px-1 py-1`}
                              aria-label={`Photo URL for row ${i + 1}`}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.toyNumber}
                            onChange={(e) =>
                              updateRow(i, "toyNumber", e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Toy number row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.collectorNumber}
                            onChange={(e) =>
                              updateRow(i, "collectorNumber", e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Collector number row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.modelName}
                            onChange={(e) =>
                              updateRow(i, "modelName", e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Model name row ${i + 1}`}
                          />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {row.isSuperTreasureHunt && (
                              <Badge color="purple">$TH</Badge>
                            )}
                            {row.isTreasureHunt && !row.isSuperTreasureHunt && (
                              <Badge color="green">TH</Badge>
                            )}
                            {row.isExclusive && (
                              <Badge color="blue">
                                {row.exclusiveStore ?? "Exclusive"}
                              </Badge>
                            )}
                            {isDupRow(row) && (
                              <Badge color="amber">Dup</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.seriesName}
                            onChange={(e) =>
                              updateRow(i, "seriesName", e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Series row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.seriesNumber}
                            onChange={(e) =>
                              updateRow(i, "seriesNumber", e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Series number row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeRow(i)}
                            className="text-stone-500 hover:text-red-400 text-xs"
                            aria-label="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {friendlyError && (
            <p className="text-sm text-red-400">{friendlyError}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setPhase("input");
                setRows([]);
              }}
            >
              Back
            </Button>
            <Button
              fullWidth
              onClick={() => void runImport()}
              loading={loading}
              disabled={rows.length === 0}
            >
              {busyMessage || `Import ${rows.length} Cars`}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Method tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMethod("paste")}
              className={tabClass(method === "paste")}
            >
              Paste from Fandom
            </button>
            <button
              onClick={() => setMethod("url")}
              className={tabClass(method === "url")}
            >
              Fandom URL Import
            </button>
            <button
              onClick={() => setMethod("advanced")}
              className={tabClass(method === "advanced")}
            >
              Advanced Import
            </button>
          </div>

          {method === "paste" && (
            <>
              <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-sm text-stone-400 leading-relaxed">
                <p className="text-stone-200 font-semibold mb-1">
                  How to copy from Hot Wheels Fandom
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open the list page (for example a "List of 2022 Hot Wheels" page).</li>
                  <li>Click and drag to select the whole table, starting at the Toy # column.</li>
                  <li>Copy it (Ctrl+C), then paste it in the box below.</li>
                </ol>
              </div>
              <textarea
                aria-label="Paste Fandom table"
                rows={9}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the copied table here…"
                className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-600 resize-none"
              />
              {friendlyError && (
                <p className="text-sm text-red-400">{friendlyError}</p>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={close}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={() => void handleFindCars()}
                  loading={loading}
                  disabled={!pasteText.trim()}
                >
                  Find Cars
                </Button>
              </div>
            </>
          )}

          {method === "url" && (
            <>
              <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-sm text-stone-400 leading-relaxed">
                <p className="text-stone-200 font-semibold mb-1">
                  Import straight from a link
                </p>
                <p>
                  Paste the web address of a Hot Wheels Fandom list page. We'll
                  read the table for you, including photos when available.
                </p>
              </div>
              <input
                aria-label="Fandom page URL"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://hotwheels.fandom.com/wiki/List_of_2022_Hot_Wheels"
                className={inputClass}
              />
              {busyMessage && (
                <p className="text-xs text-stone-500">{busyMessage}</p>
              )}
              {friendlyError && (
                <p className="text-sm text-red-400">{friendlyError}</p>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={close}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={() => void handleUrlFetch()}
                  loading={loading}
                  disabled={!urlValue.trim()}
                >
                  Fetch &amp; Preview
                </Button>
              </div>
            </>
          )}

          {method === "advanced" && (
            <>
              <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-xs text-stone-400 leading-relaxed">
                <p className="text-stone-300 font-semibold mb-2">
                  Advanced import (for spreadsheet or wiki source)
                </p>
                <div className="flex gap-2 flex-wrap mb-2">
                  <button
                    onClick={() => setAdvancedMode("csv")}
                    className={tabClass(advancedMode === "csv")}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setAdvancedMode("wiki")}
                    className={tabClass(advancedMode === "wiki")}
                  >
                    MediaWiki
                  </button>
                  <button
                    onClick={() => setAdvancedMode("html")}
                    className={tabClass(advancedMode === "html")}
                  >
                    HTML Source
                  </button>
                </div>
                <p>
                  Expected columns:{" "}
                  <code className="text-amber-400">
                    Toy #, Col.#, Model Name, Series, Series #, Photo
                  </code>
                </p>
              </div>
              <textarea
                aria-label="Advanced import source"
                rows={8}
                value={advancedText}
                onChange={(e) => setAdvancedText(e.target.value)}
                placeholder={
                  advancedMode === "csv"
                    ? "Toy #,Col.#,Model Name,Series,Series #,Photo"
                    : advancedMode === "wiki"
                      ? "Paste MediaWiki source (Edit → Source editor)"
                      : "Paste full HTML page source (Ctrl+U → Ctrl+A → Ctrl+C)"
                }
                className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder-stone-700 resize-none"
              />
              {friendlyError && (
                <p className="text-sm text-red-400">{friendlyError}</p>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={close}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={() => void handleAdvancedParse()}
                  loading={loading}
                  disabled={!advancedText.trim()}
                >
                  Preview
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg py-2">
      <div className="text-lg font-black text-stone-100">{value}</div>
      <div className="text-stone-500">{label}</div>
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: ReactNode;
  color: "green" | "purple" | "blue" | "amber" | "stone";
}) {
  const colors: Record<string, string> = {
    green: "bg-green-700/40 text-green-300",
    purple: "bg-purple-700/40 text-purple-200",
    blue: "bg-blue-700/40 text-blue-200",
    amber: "bg-amber-700/40 text-amber-200",
    stone: "bg-stone-700 text-stone-400",
  };
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors[color]}`}
    >
      {children}
    </span>
  );
}
