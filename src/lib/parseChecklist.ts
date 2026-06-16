// Checklist source data may require attribution depending on source license.
// Do not remove attribution fields. Store sourceName, sourceUrl,
// sourceLicense, and sourceAttribution on every imported checklist.

import type { RarityType } from "../types";

// ─── Wiki Markup Cleaner ──────────────────────────────────────────────────────

export function cleanWikiMarkup(raw: string): string {
  let s = raw;
  // [[link|display text]] → display text
  s = s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1");
  // [[link]] → link
  s = s.replace(/\[\[([^\]]+)\]\]/g, "$1");
  // <font color="...">text</font> → text
  s = s.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, "$1");
  // bgcolor="..." (HTML table cell attributes)
  s = s.replace(/bgcolor="[^"]*"/gi, "");
  // style="..." attributes
  s = s.replace(/\bstyle="[^"]*"/gi, "");
  // <br> / <br /> tags
  s = s.replace(/<br\s*\/?>/gi, " ");
  // All remaining HTML tags
  s = s.replace(/<[^>]+>/g, "");
  // Remove remaining {{ template }} calls (handled separately by extractRarity)
  s = s.replace(/\{\{[^}]+\}\}/g, "");
  // HTML entities
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "");
  // Collapse whitespace
  return s.replace(/\s+/g, " ").trim();
}

// ─── Template → Rarity Extractor ─────────────────────────────────────────────

export interface RarityExtractResult {
  rarityType: RarityType;
  tags: string[]; // e.g. ["New Model", "Target"]
  cleaned: string; // original string with templates removed
}

export function extractRarityFromTemplates(raw: string): RarityExtractResult {
  const tags: string[] = [];
  let rarityType: RarityType = "Mainline";

  if (/\{\{STH[^}]*\}\}/.test(raw)) {
    rarityType = "Super Treasure Hunt";
    tags.push("STH");
  } else if (/\{\{TH[^}]*\}\}/.test(raw)) {
    rarityType = "Treasure Hunt";
    tags.push("TH");
  }

  if (/\{\{NM[^}]*\}\}/.test(raw)) tags.push("New Model");
  if (/\{\{WM[^}]*\}\}/i.test(raw)) tags.push("Walmart/Zamac");
  if (/\{\{KR[^}]*\}\}/i.test(raw)) tags.push("Kroger");
  if (/\{\{TG[^}]*\}\}/i.test(raw)) tags.push("Target");

  const cleaned = raw.replace(/\{\{[^}]+\}\}/g, "").trim();
  return { rarityType, tags, cleaned };
}

// ─── Normalized Item ──────────────────────────────────────────────────────────

export interface NormalizedChecklistItem {
  toyNumber: string;
  collectorNumber: string;
  modelName: string;
  seriesName: string;
  seriesNumber: string;
  photoUrl: string;
  imageRef: string;
  variationLabel: string;
  rarityType: RarityType;
  notes: string;
  sortOrder: number;
  normalizedSearchText: string;
  // Auto-detected import metadata (optional, backward-compatible).
  tags?: string[];
  isTreasureHunt?: boolean;
  isSuperTreasureHunt?: boolean;
  isExclusive?: boolean;
  exclusiveStore?: string | null;
}

const CSV_FIELD_ALIASES: Record<string, keyof NormalizedChecklistItem> = {
  "toy#": "toyNumber",
  "toy #": "toyNumber",
  toynumber: "toyNumber",
  toy_number: "toyNumber",
  "col#": "collectorNumber",
  "col.#": "collectorNumber",
  "col #": "collectorNumber",
  collectornumber: "collectorNumber",
  "collector#": "collectorNumber",
  collector_number: "collectorNumber",
  modelname: "modelName",
  "model name": "modelName",
  model_name: "modelName",
  name: "modelName",
  "car name": "modelName",
  carname: "modelName",
  seriesname: "seriesName",
  "series name": "seriesName",
  series_name: "seriesName",
  series: "seriesName",
  seriesnumber: "seriesNumber",
  "series number": "seriesNumber",
  "series#": "seriesNumber",
  "series #": "seriesNumber",
  series_number: "seriesNumber",
  photourl: "photoUrl",
  photo: "photoUrl",
  "photo url": "photoUrl",
  image: "photoUrl",
  imageref: "imageRef",
  variationlabel: "variationLabel",
  variation: "variationLabel",
  raritytype: "rarityType",
  rarity: "rarityType",
  "rarity type": "rarityType",
  notes: "notes",
  sortorder: "sortOrder",
  sort_order: "sortOrder",
  "sort order": "sortOrder",
  order: "sortOrder",
};

export function normalizeChecklistItem(
  raw: Record<string, string>,
  sortOrder = 0,
): NormalizedChecklistItem {
  const mapped: Partial<NormalizedChecklistItem> = {};

  for (const [rawKey, rawVal] of Object.entries(raw)) {
    const alias = CSV_FIELD_ALIASES[rawKey.toLowerCase().trim()];
    if (!alias) continue;
    const val = rawVal.trim();

    if (alias === "rarityType") {
      // Don't overwrite rarity if already extracted from template
      if (!mapped.rarityType) mapped.rarityType = val as RarityType;
    } else if (alias === "sortOrder") {
      mapped.sortOrder = parseInt(val, 10) || sortOrder;
    } else {
      (mapped as Record<string, unknown>)[alias] = val;
    }
  }

  // Extract rarity from templates inside model name or series fields
  if (mapped.modelName) {
    const { rarityType, tags, cleaned } = extractRarityFromTemplates(
      mapped.modelName,
    );
    mapped.modelName = cleanWikiMarkup(cleaned);
    if (!mapped.rarityType || mapped.rarityType === "Mainline")
      mapped.rarityType = rarityType;
    if (tags.length && !mapped.notes) mapped.notes = tags.join(", ");
  }

  if (mapped.seriesName) {
    mapped.seriesName = cleanWikiMarkup(mapped.seriesName);
  }

  const item: NormalizedChecklistItem = {
    toyNumber: mapped.toyNumber?.trim() ?? "",
    collectorNumber: mapped.collectorNumber?.trim() ?? "",
    modelName: mapped.modelName?.trim() ?? "",
    seriesName: mapped.seriesName?.trim() ?? "",
    seriesNumber: mapped.seriesNumber?.trim() ?? "",
    photoUrl: mapped.photoUrl?.trim() ?? "",
    imageRef: mapped.imageRef?.trim() ?? "",
    variationLabel: mapped.variationLabel?.trim() ?? "",
    rarityType: mapped.rarityType ?? "Mainline",
    notes: mapped.notes?.trim() ?? "",
    sortOrder: mapped.sortOrder ?? sortOrder,
    normalizedSearchText: "",
  };

  item.normalizedSearchText = [
    item.modelName,
    item.toyNumber,
    item.collectorNumber,
    item.seriesName,
    item.seriesNumber,
    item.variationLabel,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");

  return item;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export interface ParseCSVResult {
  items: NormalizedChecklistItem[];
  errors: { row: number; message: string }[];
}

export function parseChecklistCsv(csv: string): ParseCSVResult {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      items: [],
      errors: [
        {
          row: 0,
          message: "CSV must have a header row and at least one data row.",
        },
      ],
    };
  }

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, ""),
  );
  const items: NormalizedChecklistItem[] = [];
  const errors: ParseCSVResult["errors"] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx]?.trim() ?? "";
    });

    const item = normalizeChecklistItem(raw, i);

    if (!item.modelName) {
      errors.push({
        row: i + 1,
        message: `Row ${i + 1}: modelName is required but missing.`,
      });
      continue;
    }

    items.push(item);
  }

  return { items, errors };
}

function splitWikiInlineCells(line: string): string[] {
  const trimmed = line.replace(/^(\||!)+/, "").trim();
  return trimmed.split(/\|\||!!/).map((part) => part.trim());
}

function extractVariant(modelName: string): {
  cleanModelName: string;
  variantLabel: string;
} {
  const m = modelName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { cleanModelName: modelName, variantLabel: "" };
  const variant = m[2];
  if (/(color|zamac|edition|variant|th|sth|new model)/i.test(variant)) {
    return { cleanModelName: m[1].trim(), variantLabel: variant.trim() };
  }
  return { cleanModelName: modelName, variantLabel: "" };
}

// ─── Fandom HTML Image URL Helpers ───────────────────────────────────────────

function cleanFandomImageUrl(url: string): string {
  if (!url || url.startsWith('data:')) return '';
  // Remove Fandom CDN thumbnail path segments and query strings
  // e.g. /scale-to-width-down/100, /window-crop/..., ?cb=...&path-prefix=en
  return url
    .replace(/\/scale-to-width-down\/\d+/i, '')
    .replace(/\/window-crop\/[^?#]*/i, '')
    .replace(/[?#].*$/, '');
}

function getImgSrc(img: Element): string {
  for (const attr of ['src', 'data-src', 'data-lazy-src', 'data-original']) {
    const val = img.getAttribute(attr) ?? '';
    if (val && !val.startsWith('data:')) return cleanFandomImageUrl(val);
  }
  return '';
}

// ─── HTML Source Parser ───────────────────────────────────────────────────────
// Parses rendered HTML (Ctrl+U page source) from hotwheels.fandom.com.
// Extracts car data and actual CDN image URLs from wikitable elements.

export function parseChecklistHtml(html: string): ParseCSVResult {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');
  const items: NormalizedChecklistItem[] = [];
  const errors: ParseCSVResult['errors'] = [];

  let tables = Array.from(doc.querySelectorAll('table.wikitable'));
  if (tables.length === 0) {
    tables = Array.from(doc.querySelectorAll('table.sortable'));
  }
  if (tables.length === 0) {
    return {
      items: [],
      errors: [{ row: 0, message: 'No checklist tables found. Paste the full page source from hotwheels.fandom.com (Ctrl+U → Ctrl+A → Ctrl+C).' }],
    };
  }

  let rowCounter = 0;

  for (const table of tables) {
    const allRows = Array.from(
      table.querySelectorAll(':scope > tbody > tr, :scope > tr'),
    );
    if (allRows.length < 2) continue;

    // Find the first row with ≥2 <th> cells as the header
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(allRows.length, 5); i++) {
      if (allRows[i].querySelectorAll('th').length >= 2) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) continue;

    const headers = Array.from(allRows[headerRowIdx].querySelectorAll('th')).map(
      (th) => th.textContent?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '',
    );

    const findCol = (...tests: RegExp[]): number => {
      for (const re of tests) {
        const idx = headers.findIndex((h) => re.test(h));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const cols = {
      toyNumber: findCol(/toy\s*#/, /toy num/),
      collectorNumber: findCol(/col\.?\s*#/, /collector/),
      modelName: findCol(/model name/, /model/, /^name$/),
      seriesName: findCol(/^series$/, /series name/),
      seriesNumber: findCol(/series\s*#/, /series num/),
      photo: findCol(/photo/, /image/, /^img$/, /^pic$/),
    };

    if (cols.modelName === -1) continue;

    for (let r = headerRowIdx + 1; r < allRows.length; r++) {
      const cells = Array.from(allRows[r].querySelectorAll('td'));
      if (cells.length < 2) continue;

      const getText = (idx: number): string =>
        idx >= 0 && idx < cells.length ? (cells[idx].textContent?.trim() ?? '') : '';

      const rawModelName = getText(cols.modelName);
      if (!rawModelName) continue;

      let photoUrl = '';
      if (cols.photo >= 0 && cols.photo < cells.length) {
        const imgEl = cells[cols.photo].querySelector('img');
        if (imgEl) photoUrl = getImgSrc(imgEl);
      }

      rowCounter++;
      const item = normalizeChecklistItem(
        {
          'toy #': getText(cols.toyNumber),
          'col.#': getText(cols.collectorNumber),
          'model name': rawModelName,
          series: getText(cols.seriesName),
          'series #': getText(cols.seriesNumber),
          photo: photoUrl,
        },
        rowCounter,
      );

      if (!item.modelName) {
        errors.push({ row: rowCounter, message: `Row ${rowCounter}: model name missing.` });
        continue;
      }
      items.push(item);
    }
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push({
      row: 0,
      message: 'No car rows found in the HTML tables. Verify you pasted the correct page source.',
    });
  }

  return { items, errors };
}

export function parseChecklistMediaWiki(source: string): ParseCSVResult {
  const lines = source.split(/\r?\n/);
  const items: NormalizedChecklistItem[] = [];
  const errors: { row: number; message: string }[] = [];
  let currentSeriesHeading = "";
  let rowCounter = 1;
  let pendingRowCells: string[] = [];

  const flushRow = (rowLine: number) => {
    if (pendingRowCells.length < 3) {
      pendingRowCells = [];
      return;
    }
    if (/toy\s*#|model\s*name|series\s*#/i.test(pendingRowCells.join(" "))) {
      pendingRowCells = [];
      return;
    }

    const rawModel = cleanWikiMarkup(pendingRowCells[2] ?? "");
    if (!rawModel) {
      errors.push({
        row: rowLine,
        message: `Row ${rowLine}: model name missing.`,
      });
      pendingRowCells = [];
      return;
    }

    const rarityExtract = extractRarityFromTemplates(rawModel);
    const variantExtract = extractVariant(rarityExtract.cleaned || rawModel);
    const seriesName =
      cleanWikiMarkup(pendingRowCells[3] ?? "") || currentSeriesHeading;
    const photoRaw = pendingRowCells[5] ?? "";
    const imageRefMatch = photoRaw.match(/File:([^|\]]+)/i);
    const imageRef = imageRefMatch
      ? cleanWikiMarkup(imageRefMatch[1])
      : cleanWikiMarkup(photoRaw);

    const item: NormalizedChecklistItem = normalizeChecklistItem(
      {
        "toy #": cleanWikiMarkup(pendingRowCells[0] ?? ""),
        "col.#": cleanWikiMarkup(pendingRowCells[1] ?? ""),
        "model name": variantExtract.cleanModelName,
        series: seriesName,
        "series #": cleanWikiMarkup(pendingRowCells[4] ?? ""),
        photo: "",
        imageRef,
        variation: variantExtract.variantLabel,
        notes: rarityExtract.tags.join(", "),
      },
      rowCounter++,
    );
    items.push(item);
    pendingRowCells = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const heading = line.match(/^==+\s*(.*?)\s*==+$/);
    if (heading) {
      flushRow(i + 1);
      currentSeriesHeading = cleanWikiMarkup(heading[1]);
      continue;
    }

    if (line.startsWith("|-")) {
      flushRow(i + 1);
      continue;
    }

    if (line.startsWith("|}")) {
      flushRow(i + 1);
      continue;
    }

    if (!(line.startsWith("|") || line.startsWith("!"))) continue;
    const cells = splitWikiInlineCells(line);
    if (cells.length === 0) continue;
    pendingRowCells.push(...cells);
  }
  flushRow(lines.length + 1);

  return { items, errors };
}
