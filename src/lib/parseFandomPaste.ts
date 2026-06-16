// Beginner-friendly parser for table data copy-pasted from Hot Wheels Fandom
// pages (e.g. hotwheels.fandom.com/wiki/List_of_2022_Hot_Wheels).
//
// Non-technical admins copy a rendered table and paste it here. The copied text
// is messy: cells may be tab-separated on one line, or each cell may land on its
// own line, with blank lines and stray labels (Treasure Hunt, New for 2022,
// store-exclusive badges, etc.) mixed in. We treat a toy-number token (HCT05,
// HCX22, HJP28, ...) as the start of a new row and accumulate everything until
// the next toy number.

import type { RarityType } from "../types";
import {
  cleanWikiMarkup,
  normalizeChecklistItem,
  type NormalizedChecklistItem,
  type ParseCSVResult,
} from "./parseChecklist";

// ─── Toy number detection ─────────────────────────────────────────────────────
// Hot Wheels mainline toy numbers look like 2-4 letters followed by 2-4 digits
// (HCT05, HCX22, HCV09, HCY10, HJP28). A pure number is NOT treated as a toy
// number, because that is usually the collector number column.
const TOY_NUMBER_RE = /^[A-Z]{2,4}\d{2,4}$/;

function firstToken(cell: string): string {
  return cell.trim().split(/\s+/)[0] ?? "";
}

export function looksLikeToyNumber(cell: string): boolean {
  return TOY_NUMBER_RE.test(firstToken(cell).toUpperCase());
}

// ─── Tag / rarity detection ───────────────────────────────────────────────────

export interface FandomTagInfo {
  tags: string[];
  isTreasureHunt: boolean;
  isSuperTreasureHunt: boolean;
  isExclusive: boolean;
  exclusiveStore: string | null;
  rarityType: RarityType;
}

const STORE_PATTERNS: { re: RegExp; name: string }[] = [
  { re: /target/i, name: "Target" },
  { re: /walmart/i, name: "Walmart" },
  { re: /kroger/i, name: "Kroger" },
  { re: /dollar\s*general/i, name: "Dollar General" },
  { re: /best\s*buy/i, name: "Best Buy" },
  { re: /walgreens/i, name: "Walgreens" },
];

/**
 * Detect Treasure Hunt / Super Treasure Hunt status, store exclusives, and other
 * collector tags from anywhere in a row's combined text. Case-sensitive checks
 * are used for the bare "TH"/"STH" tokens so model names like "5th Gear" are not
 * mistaken for Treasure Hunts.
 */
export function detectFandomTags(rowText: string, year?: number): FandomTagInfo {
  const raw = rowText;
  const tags: string[] = [];
  let isTreasureHunt = false;
  let isSuperTreasureHunt = false;
  let isExclusive = false;
  let exclusiveStore: string | null = null;
  let rarityType: RarityType = "Mainline";

  const isSuper =
    /super\s*treasure\s*hunt/i.test(raw) ||
    /\$\s*th\b/i.test(raw) ||
    /(^|\s)STH(\s|$)/.test(raw);
  const isTh =
    /treasure\s*hunt/i.test(raw) || /(^|\s)TH(\s|$)/.test(raw);

  if (isSuper) {
    isSuperTreasureHunt = true;
    rarityType = "Super Treasure Hunt";
    tags.push("Super Treasure Hunt");
  } else if (isTh) {
    isTreasureHunt = true;
    rarityType = "Treasure Hunt";
    tags.push("Treasure Hunt");
  }

  const newFor = raw.match(/new\s*for\s*(\d{4})/i);
  if (newFor) tags.push(`New for ${newFor[1]}`);
  else if (year && /new\s*for\b/i.test(raw)) tags.push(`New for ${year}`);

  for (const { re, name } of STORE_PATTERNS) {
    if (re.test(raw)) {
      isExclusive = true;
      exclusiveStore = name;
      tags.push(`${name} Exclusive`);
      break;
    }
  }

  if (/red\s*edition/i.test(raw)) tags.push("Red Edition");
  if (/zamac/i.test(raw)) tags.push("Zamac");
  if (/ryu'?s\s*rides/i.test(raw)) tags.push("Ryu's Rides");

  return {
    tags: Array.from(new Set(tags)),
    isTreasureHunt,
    isSuperTreasureHunt,
    isExclusive,
    exclusiveStore,
    rarityType,
  };
}

/** Remove detected label phrases so the Series column stays clean. */
export function stripDetectedLabels(text: string): string {
  return text
    .replace(/super\s*treasure\s*hunt/gi, "")
    .replace(/treasure\s*hunt/gi, "")
    .replace(/\$\s*th\b/gi, "")
    .replace(/(^|\s)S?TH(\s|$)/g, " ")
    .replace(/new\s*for\s*\d{4}/gi, "")
    .replace(
      /(target|walmart|kroger|dollar\s*general|best\s*buy|walgreens)(\s*exclusive)?/gi,
      "",
    )
    .replace(/red\s*edition/gi, "")
    .replace(/zamac/gi, "")
    .replace(/ryu'?s\s*rides/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Photo cell detection ─────────────────────────────────────────────────────

function findPhotoCell(cells: string[]): string {
  for (const cell of cells) {
    const m = cell.match(/(https?:\/\/\S+\.(?:png|jpe?g|gif|webp)\S*)/i);
    if (m) return m[1];
    const file = cell.match(/File:([^\s|\]]+\.(?:png|jpe?g|gif|webp))/i);
    if (file) return file[1];
  }
  return "";
}

// ─── Enrichment for items produced by the existing parsers ────────────────────

export function enrichWithTags(
  item: NormalizedChecklistItem,
  year?: number,
): NormalizedChecklistItem {
  const rowText = [item.modelName, item.seriesName, item.variationLabel, item.notes]
    .filter(Boolean)
    .join(" ");
  const t = detectFandomTags(rowText, year);
  const tags = Array.from(new Set([...(item.tags ?? []), ...t.tags]));
  return {
    ...item,
    rarityType:
      item.rarityType && item.rarityType !== "Mainline"
        ? item.rarityType
        : t.rarityType,
    tags,
    isTreasureHunt: Boolean(item.isTreasureHunt) || t.isTreasureHunt,
    isSuperTreasureHunt:
      Boolean(item.isSuperTreasureHunt) || t.isSuperTreasureHunt,
    isExclusive: Boolean(item.isExclusive) || t.isExclusive,
    exclusiveStore: item.exclusiveStore ?? t.exclusiveStore,
    notes: item.notes || tags.join(", "),
  };
}

export function enrichItemsWithTags(
  items: NormalizedChecklistItem[],
  year?: number,
): NormalizedChecklistItem[] {
  return items.map((i) => enrichWithTags(i, year));
}

// ─── Import statistics (shared by all import methods) ─────────────────────────

export interface ImportStats {
  valid: number;
  treasureHunts: number;
  superTreasureHunts: number;
  exclusives: number;
  missingPhotos: number;
}

export function computeImportStats(
  items: NormalizedChecklistItem[],
): ImportStats {
  return {
    valid: items.length,
    treasureHunts: items.filter((i) => i.isTreasureHunt).length,
    superTreasureHunts: items.filter((i) => i.isSuperTreasureHunt).length,
    exclusives: items.filter((i) => i.isExclusive).length,
    missingPhotos: items.filter((i) => !i.photoUrl && !i.imageRef).length,
  };
}

// ─── Main paste parser ────────────────────────────────────────────────────────

export function parseFandomPaste(text: string, year?: number): ParseCSVResult {
  const items: NormalizedChecklistItem[] = [];
  const errors: ParseCSVResult["errors"] = [];

  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  let buffer: string[] = [];
  let bufferStartLine = 0;
  let sortOrder = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const cells = buffer;
    const startLine = bufferStartLine;
    buffer = [];

    const toyNumber = firstToken(cells[0] ?? "");
    const rowText = cells.join(" ");
    const tagInfo = detectFandomTags(rowText, year);

    const collectorNumber = (cells[1] ?? "").trim();
    const modelName = cleanWikiMarkup(cells[2] ?? "");
    const seriesRaw = cleanWikiMarkup(cells[3] ?? "");
    const series = stripDetectedLabels(seriesRaw);
    const seriesNumber = (cells[4] ?? "").trim();
    const photo = findPhotoCell(cells);

    if (!modelName) {
      errors.push({
        row: startLine,
        message: `A row near line ${startLine} was skipped because it had no car name.`,
      });
      return;
    }

    const base = normalizeChecklistItem(
      {
        "toy #": toyNumber,
        "col.#": collectorNumber,
        "model name": modelName,
        series,
        "series #": seriesNumber,
        photo,
      },
      sortOrder++,
    );

    const tags = Array.from(new Set([...(base.tags ?? []), ...tagInfo.tags]));
    items.push({
      ...base,
      rarityType:
        tagInfo.rarityType !== "Mainline" ? tagInfo.rarityType : base.rarityType,
      tags,
      isTreasureHunt: tagInfo.isTreasureHunt,
      isSuperTreasureHunt: tagInfo.isSuperTreasureHunt,
      isExclusive: tagInfo.isExclusive,
      exclusiveStore: tagInfo.exclusiveStore,
      notes: base.notes || tags.join(", "),
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = line
      .split("\t")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length === 0) continue;

    if (looksLikeToyNumber(cells[0])) {
      flush();
      buffer = cells;
      bufferStartLine = i + 1;
    } else if (buffer.length > 0) {
      buffer.push(...cells);
    }
    // Lines before the first toy number (titles, headers) are ignored.
  }
  flush();

  if (items.length === 0 && errors.length === 0) {
    errors.push({
      row: 0,
      message:
        "No cars found. Try copying the table starting with the Toy # column.",
    });
  }

  return { items, errors };
}
