import { useState } from "react";
import { Link } from "react-router-dom";
import {
  doc,
  collection,
  writeBatch,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import type { MasterChecklist, Brand, ChecklistCategory } from "../../types";
import { BRANDS, CHECKLIST_CATEGORIES } from "../../types";
import { parseChecklistCsv, parseChecklistMediaWiki, parseChecklistHtml } from "../../lib/parseChecklist";
import type { ParseCSVResult } from "../../lib/parseChecklist";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { ConfirmModal } from "../../components/ui/Modal";
import { db, functions, httpsCallable } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useAllMasterChecklists } from "../../hooks/useChecklistsFirestore";
import { normalizedToMasterItem } from "../../lib/firestoreConverters";

export default function AdminChecklistsPage() {
  const { user } = useAuth();
  const { checklists, loading } = useAllMasterChecklists();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterChecklist | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    brand: "Hot Wheels" as Brand,
    year: String(new Date().getFullYear()),
    category: "Mainline" as ChecklistCategory,
    description: "",
  });

  // CSV Import state
  const [importTarget, setImportTarget] = useState<MasterChecklist | null>(
    null,
  );
  const [csvText, setCsvText] = useState("");
  const [parseResult, setParseResult] = useState<ParseCSVResult | null>(null);
  const [importDone, setImportDone] = useState(false);
  const [sourceMode, setSourceMode] = useState<"csv" | "wiki" | "html">("csv");
  const [quickSourceMode, setQuickSourceMode] = useState<"wiki" | "html">("wiki");
  const [quickImportLoading, setQuickImportLoading] = useState(false);
  const [quickImportError, setQuickImportError] = useState("");
  const [quickImportSuccess, setQuickImportSuccess] = useState("");
  const [quickImportForm, setQuickImportForm] = useState({
    name: `${new Date().getFullYear()} Hot Wheels Mainline`,
    brand: "Hot Wheels" as Brand,
    year: String(new Date().getFullYear()),
    category: "Mainline" as ChecklistCategory,
    sourceUrl: "",
    wikiSource: "",
  });

  // AI URL import state
  const [aiUrlForm, setAiUrlForm] = useState({
    wikiUrl: "",
    name: `${new Date().getFullYear()} Hot Wheels Mainline`,
    brand: "Hot Wheels" as Brand,
    year: String(new Date().getFullYear()),
    category: "Mainline" as ChecklistCategory,
  });
  const [aiUrlLoading, setAiUrlLoading] = useState(false);
  const [aiUrlError, setAiUrlError] = useState("");
  const [aiUrlSuccess, setAiUrlSuccess] = useState("");

  const handleAiUrlImport = async () => {
    if (!user || !functions) return;
    setAiUrlError("");
    setAiUrlSuccess("");
    if (!aiUrlForm.wikiUrl.trim()) {
      setAiUrlError("Paste a wiki URL first.");
      return;
    }
    setAiUrlLoading(true);
    try {
      type AdminImportInput = { wikiUrl: string; name: string; brand: string; year: number; category: string };
      const fn = httpsCallable<AdminImportInput, { totalCars: number; name: string; note: string }>(
        functions,
        "importChecklistAdmin",
      );
      const res = await fn({ ...aiUrlForm, year: Number(aiUrlForm.year) });
      setAiUrlSuccess(
        `Created "${res.data.name}" with ${res.data.totalCars} cars. ${res.data.note}`,
      );
      setAiUrlForm((prev) => ({ ...prev, wikiUrl: "" }));
    } catch (e: unknown) {
      setAiUrlError(
        e instanceof Error ? e.message : "Import failed — check the URL and try again.",
      );
    } finally {
      setAiUrlLoading(false);
    }
  };

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const buildStableItemId = (
    checklist: MasterChecklist,
    toyNumber: string,
    collectorNumber: string,
    modelName: string,
    variationLabel: string,
  ) => {
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
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const ref = doc(collection(db, "checklists"));
    await setDoc(ref, {
      name: form.name,
      brandId: form.brand.toLowerCase().replace(/\s+/g, "-"),
      brandName: form.brand,
      brand: form.brand,
      year: Number(form.year),
      category: form.category,
      description: form.description,
      sourceName: "",
      sourceUrl: "",
      sourceLicense: "",
      sourceAttribution: "",
      totalCars: 0,
      uniqueSeries: [],
      isPublic: false,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archivedAt: null,
    });
    setShowCreate(false);
    setForm({
      name: "",
      brand: "Hot Wheels",
      year: String(new Date().getFullYear()),
      category: "Mainline",
      description: "",
    });
  };

  const togglePublish = async (id: string) => {
    const cl = checklists.find((c) => c.id === id);
    if (!cl) return;
    await updateDoc(doc(db, "checklists", id), {
      isPublic: !cl.isPublic,
      updatedAt: serverTimestamp(),
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const checklistId = deleteTarget.id;
    const itemsSnap = await getDocs(
      collection(db, "checklists", checklistId, "items"),
    );
    let batch = writeBatch(db);
    let n = 0;
    for (const d of itemsSnap.docs) {
      batch.delete(d.ref);
      n++;
      if (n >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        n = 0;
      }
    }
    if (n > 0) await batch.commit();
    await deleteDoc(doc(db, "checklists", checklistId));
    setDeleteTarget(null);
  };

  const openImport = (cl: MasterChecklist) => {
    setImportTarget(cl);
    setCsvText("");
    setParseResult(null);
    setImportDone(false);
  };

  const handleParse = () => {
    if (!csvText.trim()) return;
    setParseResult(
      sourceMode === "csv"
        ? parseChecklistCsv(csvText)
        : sourceMode === "wiki"
          ? parseChecklistMediaWiki(csvText)
          : parseChecklistHtml(csvText),
    );
  };

  const handleImport = async () => {
    if (!importTarget || !parseResult || parseResult.items.length === 0) return;

    const checklistRef = doc(db, "checklists", importTarget.id);
    const itemsCol = collection(db, "checklists", importTarget.id, "items");

    const seriesSet = new Set<string>();
    (importTarget.uniqueSeries ?? []).forEach((s) => seriesSet.add(s));

    let batch = writeBatch(db);
    let ops = 0;

    const flush = async () => {
      if (ops === 0) return;
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    };

    for (const norm of parseResult.items) {
      const itemRef = doc(
        itemsCol,
        buildStableItemId(
          importTarget,
          norm.toyNumber,
          norm.collectorNumber,
          norm.modelName,
          norm.variationLabel,
        ),
      );
      batch.set(
        itemRef,
        {
          ...normalizedToMasterItem(itemRef.id, norm),
          brandId:
            importTarget.brandId ??
            importTarget.brand.toLowerCase().replace(/\s+/g, "-"),
          year: importTarget.year,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (norm.seriesName) seriesSet.add(norm.seriesName);
      ops++;
      if (ops >= 450) await flush();
    }

    if (ops > 0) await flush();

    const updatedItems = await getDocs(itemsCol);
    await updateDoc(checklistRef, {
      brandId:
        importTarget.brandId ??
        importTarget.brand.toLowerCase().replace(/\s+/g, "-"),
      brandName: importTarget.brandName ?? importTarget.brand,
      totalCars: updatedItems.size,
      uniqueSeries: [...seriesSet],
      updatedAt: serverTimestamp(),
    });

    setImportDone(true);
  };

  const importParsedItems = async (
    checklist: MasterChecklist,
    parsed: ParseCSVResult,
  ) => {
    const checklistRef = doc(db, "checklists", checklist.id);
    const itemsCol = collection(db, "checklists", checklist.id, "items");

    const seriesSet = new Set<string>();
    (checklist.uniqueSeries ?? []).forEach((s) => seriesSet.add(s));

    let batch = writeBatch(db);
    let ops = 0;
    const flush = async () => {
      if (ops === 0) return;
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    };

    for (const norm of parsed.items) {
      const itemRef = doc(
        itemsCol,
        buildStableItemId(
          checklist,
          norm.toyNumber,
          norm.collectorNumber,
          norm.modelName,
          norm.variationLabel,
        ),
      );
      batch.set(
        itemRef,
        {
          ...normalizedToMasterItem(itemRef.id, norm),
          brandId:
            checklist.brandId ?? checklist.brand.toLowerCase().replace(/\s+/g, "-"),
          year: checklist.year,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (norm.seriesName) seriesSet.add(norm.seriesName);
      ops++;
      if (ops >= 450) await flush();
    }

    if (ops > 0) await flush();

    const updatedItems = await getDocs(itemsCol);
    await updateDoc(checklistRef, {
      brandId: checklist.brandId ?? checklist.brand.toLowerCase().replace(/\s+/g, "-"),
      brandName: checklist.brandName ?? checklist.brand,
      totalCars: updatedItems.size,
      uniqueSeries: [...seriesSet],
      updatedAt: serverTimestamp(),
    });
  };

  const handleQuickWikiImport = async () => {
    if (!user) return;
    setQuickImportError("");
    setQuickImportSuccess("");
    if (!quickImportForm.wikiSource.trim()) {
      setQuickImportError("Paste wiki source first.");
      return;
    }

    setQuickImportLoading(true);
    try {
      const parsed = quickSourceMode === "wiki"
      ? parseChecklistMediaWiki(quickImportForm.wikiSource)
      : parseChecklistHtml(quickImportForm.wikiSource);
      if (parsed.items.length === 0) {
        setQuickImportError(
          `No list items were parsed. ${parsed.errors[0]?.message ?? "Check your source and try again."}`,
        );
        setQuickImportLoading(false);
        return;
      }

      const checklistRef = doc(collection(db, "checklists"));
      const checklist: MasterChecklist = {
        id: checklistRef.id,
        name: quickImportForm.name.trim(),
        brand: quickImportForm.brand,
        brandId: quickImportForm.brand.toLowerCase().replace(/\s+/g, "-"),
        brandName: quickImportForm.brand,
        year: Number(quickImportForm.year),
        category: quickImportForm.category,
        description: "",
        sourceName: "HotWheels Wiki",
        sourceUrl: quickImportForm.sourceUrl.trim(),
        sourceLicense: "",
        sourceAttribution: quickSourceMode === "wiki"
          ? "Imported from user-pasted HotWheels wiki source"
          : "Imported from user-pasted HotWheels HTML page source",
        totalCars: 0,
        uniqueSeries: [],
        isPublic: false,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        archivedAt: null,
      };

      await setDoc(checklistRef, {
        ...checklist,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await importParsedItems(checklist, parsed);
      setQuickImportSuccess(
        `Created "${checklist.name}" and imported ${parsed.items.length} items. Publish it when ready.`,
      );
      setQuickImportForm((prev) => ({ ...prev, wikiSource: "" }));
    } catch (err) {
      setQuickImportError(
        err instanceof Error ? err.message : "Quick import failed.",
      );
    } finally {
      setQuickImportLoading(false);
    }
  };

  const inputClass =
    "w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600";

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
        <Link to="/admin" className="hover:text-stone-300 transition-colors">
          Admin
        </Link>
        <span>›</span>
        <span className="text-stone-400">Checklists</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">Master Checklists</h1>
        <Button onClick={() => setShowCreate(true)}>➕ Create Checklist</Button>
      </div>

      {/* AI URL Import section */}
      <section className="bg-stone-900 border border-amber-700/50 rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-bold text-amber-300 mb-1">
          ✨ AI Import from URL
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Paste any Hot Wheels or Matchbox wiki URL — AI fetches and parses the list automatically. No copy-paste required.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            value={aiUrlForm.name}
            onChange={(e) => setAiUrlForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="List title (e.g. 2026 Hot Wheels Mainline)"
            className={inputClass}
          />
          <input
            value={aiUrlForm.year}
            onChange={(e) => setAiUrlForm((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="Year"
            className={inputClass}
          />
          <select
            value={aiUrlForm.brand}
            onChange={(e) => setAiUrlForm((prev) => ({ ...prev, brand: e.target.value as Brand }))}
            className={inputClass}
          >
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={aiUrlForm.category}
            onChange={(e) => setAiUrlForm((prev) => ({ ...prev, category: e.target.value as ChecklistCategory }))}
            className={inputClass}
          >
            {CHECKLIST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input
          value={aiUrlForm.wikiUrl}
          onChange={(e) => setAiUrlForm((prev) => ({ ...prev, wikiUrl: e.target.value }))}
          placeholder="https://hotwheels.fandom.com/wiki/2026_Hot_Wheels"
          className={`${inputClass} mb-3`}
        />
        {aiUrlError && <p className="mb-3 text-sm text-red-400">{aiUrlError}</p>}
        {aiUrlSuccess && <p className="mb-3 text-sm text-green-400">{aiUrlSuccess}</p>}
        <Button
          onClick={() => void handleAiUrlImport()}
          loading={aiUrlLoading}
          disabled={!aiUrlForm.wikiUrl.trim() || aiUrlLoading}
        >
          ✨ Import from URL
        </Button>
        {aiUrlLoading && (
          <p className="mt-2 text-xs text-stone-500">This may take 30–60 seconds while AI parses the page…</p>
        )}
      </section>

      <section className="bg-stone-800 border border-stone-700 rounded-2xl p-5 mb-6">
        <h2 className="text-lg font-bold text-stone-100 mb-2">
          Quick Import From HotWheels Wiki
        </h2>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setQuickSourceMode("wiki")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${quickSourceMode === "wiki" ? "bg-amber-500 text-stone-900" : "bg-stone-700 text-stone-400 hover:bg-stone-600"}`}
          >
            Wiki Source
          </button>
          <button
            onClick={() => setQuickSourceMode("html")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${quickSourceMode === "html" ? "bg-amber-500 text-stone-900" : "bg-stone-700 text-stone-400 hover:bg-stone-600"}`}
          >
            HTML Source (with images)
          </button>
        </div>
        <p className="text-stone-400 text-sm mb-4">
          {quickSourceMode === "wiki"
            ? "Go to hotwheels.fandom.com/wiki, open the list page, click Edit → Source editor, select all, copy, and paste it here. Car names and numbers are captured; images are stored as file references only."
            : "Go to hotwheels.fandom.com/wiki, open the list page, press Ctrl+U to view page source, press Ctrl+A to select all, Ctrl+C to copy, and paste it here. This captures actual image URLs from the page."}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            value={quickImportForm.name}
            onChange={(e) =>
              setQuickImportForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="List title (e.g. 2026 Hot Wheels Mainline)"
            className={inputClass}
          />
          <input
            value={quickImportForm.year}
            onChange={(e) =>
              setQuickImportForm((prev) => ({ ...prev, year: e.target.value }))
            }
            placeholder="Year"
            className={inputClass}
          />
          <select
            value={quickImportForm.brand}
            onChange={(e) =>
              setQuickImportForm((prev) => ({
                ...prev,
                brand: e.target.value as Brand,
              }))
            }
            className={inputClass}
          >
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={quickImportForm.category}
            onChange={(e) =>
              setQuickImportForm((prev) => ({
                ...prev,
                category: e.target.value as ChecklistCategory,
              }))
            }
            className={inputClass}
          >
            {CHECKLIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          value={quickImportForm.sourceUrl}
          onChange={(e) =>
            setQuickImportForm((prev) => ({ ...prev, sourceUrl: e.target.value }))
          }
          placeholder="Optional source URL"
          className={`${inputClass} mb-3`}
        />
        <textarea
          value={quickImportForm.wikiSource}
          onChange={(e) =>
            setQuickImportForm((prev) => ({ ...prev, wikiSource: e.target.value }))
          }
          rows={8}
          placeholder={
            quickSourceMode === "wiki"
              ? "Paste MediaWiki source here (from Edit → Source editor)"
              : "Paste full HTML page source here (from Ctrl+U → Ctrl+A → Ctrl+C)"
          }
          className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder-stone-700 resize-none"
        />
        {quickImportError && (
          <p className="mt-3 text-sm text-red-400">{quickImportError}</p>
        )}
        {quickImportSuccess && (
          <p className="mt-3 text-sm text-green-400">{quickImportSuccess}</p>
        )}
        <div className="mt-4">
          <Button
            onClick={() => void handleQuickWikiImport()}
            loading={quickImportLoading}
            disabled={!quickImportForm.wikiSource.trim()}
          >
            {quickSourceMode === "html" ? "Create List + Import HTML (with images)" : "Create List + Import Source"}
          </Button>
        </div>
      </section>

      {loading ? (
        <p className="text-stone-400">Loading checklists...</p>
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => (
            <div
              key={cl.id}
              className="bg-stone-800 border border-stone-700 rounded-2xl p-5 hover:border-stone-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-stone-50 text-lg">
                      {cl.name}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        cl.isPublic
                          ? "bg-green-700 text-green-200"
                          : "bg-stone-700 text-stone-400"
                      }`}
                    >
                      {cl.isPublic ? "✓ Published" : "● Draft"}
                    </span>
                  </div>
                  <p className="text-stone-400 text-sm">
                    {cl.brand} · {cl.year} · {cl.category} · {cl.totalCars} cars
                  </p>
                  {cl.description && (
                    <p className="text-stone-500 text-sm mt-1">
                      {cl.description}
                    </p>
                  )}
                  {cl.sourceAttribution && (
                    <p className="text-stone-600 text-xs mt-1 italic">
                      {cl.sourceAttribution}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => openImport(cl)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-700 hover:bg-amber-600 hover:text-stone-900 text-stone-300 transition-all"
                  >
                    📄 CSV
                  </button>
                  <button
                    onClick={() => togglePublish(cl.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      cl.isPublic
                        ? "bg-stone-700 hover:bg-stone-600 text-stone-300"
                        : "bg-green-700 hover:bg-green-600 text-white"
                    }`}
                  >
                    {cl.isPublic ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cl)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-700 hover:bg-red-900/50 text-stone-400 hover:text-red-400 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Master Checklist"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">
              Checklist Name *
            </label>
            <input
              aria-label="Checklist name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2025 Hot Wheels Mainline"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">
                Brand *
              </label>
              <select
                aria-label="Select checklist brand"
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value as Brand })
                }
                className={inputClass}
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">
                Year *
              </label>
              <input
                aria-label="Checklist year"
                required
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">
              Category *
            </label>
            <select
              aria-label="Select checklist category"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ChecklistCategory,
                })
              }
              className={inputClass}
            >
              {CHECKLIST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">
              Description
            </label>
            <textarea
              aria-label="Checklist description"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth>
              Create Checklist
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import modal */}
      <Modal
        isOpen={Boolean(importTarget)}
        onClose={() => {
          setImportTarget(null);
          setParseResult(null);
        }}
        title={`Import CSV — ${importTarget?.name ?? ""}`}
        size="lg"
      >
        {importDone ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-stone-200 font-semibold text-lg mb-1">
              {parseResult?.items.length ?? 0} items imported!
            </p>
            <p className="text-stone-500 text-sm mb-6">
              Items have been added to{" "}
              <strong className="text-stone-300">{importTarget?.name}</strong>.
            </p>
            <Button
              onClick={() => {
                setImportTarget(null);
                setParseResult(null);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-xs text-stone-400 leading-relaxed">
              <p className="font-semibold text-stone-300 mb-1">Import source</p>
              <div className="mb-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => setSourceMode("csv")}
                  className={`rounded-lg px-2 py-1 ${sourceMode === "csv" ? "bg-amber-500 text-stone-900" : "bg-stone-800 text-stone-400"}`}
                >
                  CSV
                </button>
                <button
                  onClick={() => setSourceMode("wiki")}
                  className={`rounded-lg px-2 py-1 ${sourceMode === "wiki" ? "bg-amber-500 text-stone-900" : "bg-stone-800 text-stone-400"}`}
                >
                  MediaWiki
                </button>
                <button
                  onClick={() => setSourceMode("html")}
                  className={`rounded-lg px-2 py-1 ${sourceMode === "html" ? "bg-amber-500 text-stone-900" : "bg-stone-800 text-stone-400"}`}
                >
                  HTML Source
                </button>
              </div>
              {sourceMode === "html" && (
                <p className="text-xs text-stone-400 mb-1">
                  On hotwheels.fandom.com, press <kbd className="bg-stone-700 px-1 rounded">Ctrl+U</kbd> to view page source, then <kbd className="bg-stone-700 px-1 rounded">Ctrl+A</kbd> + <kbd className="bg-stone-700 px-1 rounded">Ctrl+C</kbd> to copy, then paste below. Images will be captured.
                </p>
              )}
              <p className="font-semibold text-stone-300 mb-1">
                Expected columns:
              </p>
              <code className="text-amber-400">
                Toy #, Col.#, Model Name, Series, Series #, Photo
              </code>
              <p className="mt-2">
                Supports wiki markup and template tags such as{" "}
                <code className="text-stone-300">{"{{TH}}"}</code>,{" "}
                <code className="text-stone-300">{"{{STH}}"}</code>,{" "}
                <code className="text-stone-300">{"[[link|text]]"}</code>.
              </p>
            </div>

            {/* Textarea */}
            {!parseResult && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-300 mb-1.5">
                    {sourceMode === "csv" ? "Paste CSV data" : sourceMode === "wiki" ? "Paste MediaWiki source" : "Paste HTML page source"}
                  </label>
                  <textarea
                    aria-label="Paste import source"
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={
                      sourceMode === "csv"
                        ? 'Toy #,Col.#,Model Name,Series,Series #,Photo\n001,1/250,"\'69 Camaro Z/28",HW Dream Garage,1/4,File:camaro.jpg'
                        : sourceMode === "wiki"
                          ? '{| class="wikitable"\n|-\n! Toy # !! Col.# !! Model Name !! Series !! Series # !! Photo\n|-\n| 001 || 1/250 || \'69 Camaro Z/28 || HW Dream Garage || 1/4 || [[File:camaro.jpg]]'
                          : "Paste the full HTML page source here (Ctrl+U → Ctrl+A → Ctrl+C from hotwheels.fandom.com)"
                    }
                    className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder-stone-700 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setImportTarget(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleParse}
                    disabled={!csvText.trim()}
                  >
                    {sourceMode === "csv" ? "Parse CSV" : sourceMode === "wiki" ? "Parse Wiki Source" : "Parse HTML Source"}
                  </Button>
                </div>
              </>
            )}

            {/* Parse results */}
            {parseResult && (
              <>
                {/* Summary */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-green-400">
                      {parseResult.items.length}
                    </div>
                    <div className="text-xs text-stone-400">valid rows</div>
                  </div>
                  {parseResult.errors.length > 0 && (
                    <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-red-400">
                        {parseResult.errors.length}
                      </div>
                      <div className="text-xs text-stone-400">errors</div>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 max-h-24 overflow-y-auto">
                    {parseResult.errors.map((err) => (
                      <p key={err.row} className="text-red-400 text-xs">
                        {err.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Preview table */}
                {parseResult.items.length > 0 && (
                  <div className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                    <p className="text-xs text-stone-500 px-3 py-2 border-b border-stone-700">
                      Preview (first {Math.min(5, parseResult.items.length)} of{" "}
                      {parseResult.items.length} rows)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="text-stone-500 text-left border-b border-stone-700">
                            {sourceMode === "html" && <th className="px-3 py-2">Photo</th>}
                            <th className="px-3 py-2">Toy #</th>
                            <th className="px-3 py-2">Col.#</th>
                            <th className="px-3 py-2">Model Name</th>
                            <th className="px-3 py-2">Series</th>
                            <th className="px-3 py-2">Ser.#</th>
                            <th className="px-3 py-2">Rarity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.items.slice(0, 5).map((item, i) => (
                            <tr
                              key={i}
                              className="border-b border-stone-800 hover:bg-stone-800/50"
                            >
                              {sourceMode === "html" && (
                                <td className="px-3 py-1.5">
                                  {item.photoUrl ? (
                                    <img
                                      src={item.photoUrl}
                                      alt={item.modelName}
                                      className="h-8 w-12 object-contain rounded"
                                    />
                                  ) : (
                                    <span className="text-stone-600">—</span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-1.5 font-mono text-stone-400">
                                {item.toyNumber || "—"}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-stone-500">
                                {item.collectorNumber || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-stone-200 font-medium">
                                {item.modelName}
                              </td>
                              <td className="px-3 py-1.5 text-stone-400">
                                {item.seriesName}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-stone-500">
                                {item.seriesNumber || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-stone-400">
                                {item.rarityType}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setParseResult(null)}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleImport}
                    disabled={parseResult.items.length === 0}
                  >
                    Import {parseResult.items.length} Items
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Checklist?"
        message={`Delete "${deleteTarget?.name}"? This will remove it for all users who are tracking it. This cannot be undone.`}
        confirmLabel="Delete Forever"
        confirmVariant="danger"
      />
    </div>
  );
}
