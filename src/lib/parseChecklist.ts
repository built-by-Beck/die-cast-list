// Checklist source data may require attribution depending on source license.
// Do not remove attribution fields. Store sourceName, sourceUrl,
// sourceLicense, and sourceAttribution on every imported checklist.

import type { RarityType } from '../types';

// ─── Wiki Markup Cleaner ──────────────────────────────────────────────────────

export function cleanWikiMarkup(raw: string): string {
  let s = raw;
  // [[link|display text]] → display text
  s = s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1');
  // [[link]] → link
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // <font color="...">text</font> → text
  s = s.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');
  // bgcolor="..." (HTML table cell attributes)
  s = s.replace(/bgcolor="[^"]*"/gi, '');
  // style="..." attributes
  s = s.replace(/\bstyle="[^"]*"/gi, '');
  // <br> / <br /> tags
  s = s.replace(/<br\s*\/?>/gi, ' ');
  // All remaining HTML tags
  s = s.replace(/<[^>]+>/g, '');
  // Remove remaining {{ template }} calls (handled separately by extractRarity)
  s = s.replace(/\{\{[^}]+\}\}/g, '');
  // HTML entities
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
  // Collapse whitespace
  return s.replace(/\s+/g, ' ').trim();
}

// ─── Template → Rarity Extractor ─────────────────────────────────────────────

export interface RarityExtractResult {
  rarityType: RarityType;
  tags: string[];       // e.g. ["New Model", "Target"]
  cleaned: string;      // original string with templates removed
}

export function extractRarityFromTemplates(raw: string): RarityExtractResult {
  const tags: string[] = [];
  let rarityType: RarityType = 'Mainline';

  if (/\{\{STH[^}]*\}\}/.test(raw)) {
    rarityType = 'Super Treasure Hunt';
    tags.push('STH');
  } else if (/\{\{TH[^}]*\}\}/.test(raw)) {
    rarityType = 'Treasure Hunt';
    tags.push('TH');
  }

  if (/\{\{NM[^}]*\}\}/.test(raw)) tags.push('New Model');
  if (/\{\{WM[^}]*\}\}/i.test(raw)) tags.push('Walmart/Zamac');
  if (/\{\{KR[^}]*\}\}/i.test(raw)) tags.push('Kroger');
  if (/\{\{TG[^}]*\}\}/i.test(raw)) tags.push('Target');

  const cleaned = raw.replace(/\{\{[^}]+\}\}/g, '').trim();
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
}

const CSV_FIELD_ALIASES: Record<string, keyof NormalizedChecklistItem> = {
  'toy#':             'toyNumber',
  'toy #':            'toyNumber',
  'toynumber':        'toyNumber',
  'toy_number':       'toyNumber',
  'col#':             'collectorNumber',
  'col.#':            'collectorNumber',
  'col #':            'collectorNumber',
  'collectornumber':  'collectorNumber',
  'collector#':       'collectorNumber',
  'collector_number': 'collectorNumber',
  'modelname':        'modelName',
  'model name':       'modelName',
  'model_name':       'modelName',
  'name':             'modelName',
  'car name':         'modelName',
  'carname':          'modelName',
  'seriesname':       'seriesName',
  'series name':      'seriesName',
  'series_name':      'seriesName',
  'series':           'seriesName',
  'seriesnumber':     'seriesNumber',
  'series number':    'seriesNumber',
  'series#':          'seriesNumber',
  'series #':         'seriesNumber',
  'series_number':    'seriesNumber',
  'photourl':         'photoUrl',
  'photo':            'photoUrl',
  'photo url':        'photoUrl',
  'image':            'photoUrl',
  'imageref':         'imageRef',
  'variationlabel':   'variationLabel',
  'variation':        'variationLabel',
  'raritytype':       'rarityType',
  'rarity':           'rarityType',
  'rarity type':      'rarityType',
  'notes':            'notes',
  'sortorder':        'sortOrder',
  'sort_order':       'sortOrder',
  'sort order':       'sortOrder',
  'order':            'sortOrder',
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

    if (alias === 'rarityType') {
      // Don't overwrite rarity if already extracted from template
      if (!mapped.rarityType) mapped.rarityType = val as RarityType;
    } else if (alias === 'sortOrder') {
      mapped.sortOrder = parseInt(val, 10) || sortOrder;
    } else {
      (mapped as Record<string, unknown>)[alias] = val;
    }
  }

  // Extract rarity from templates inside model name or series fields
  if (mapped.modelName) {
    const { rarityType, tags, cleaned } = extractRarityFromTemplates(mapped.modelName);
    mapped.modelName = cleanWikiMarkup(cleaned);
    if (!mapped.rarityType || mapped.rarityType === 'Mainline') mapped.rarityType = rarityType;
    if (tags.length && !mapped.notes) mapped.notes = tags.join(', ');
  }

  if (mapped.seriesName) {
    mapped.seriesName = cleanWikiMarkup(mapped.seriesName);
  }

  const item: NormalizedChecklistItem = {
    toyNumber:            mapped.toyNumber?.trim()        ?? '',
    collectorNumber:      mapped.collectorNumber?.trim()  ?? '',
    modelName:            mapped.modelName?.trim()        ?? '',
    seriesName:           mapped.seriesName?.trim()       ?? '',
    seriesNumber:         mapped.seriesNumber?.trim()     ?? '',
    photoUrl:             mapped.photoUrl?.trim()         ?? '',
    imageRef:             mapped.imageRef?.trim()         ?? '',
    variationLabel:       mapped.variationLabel?.trim()   ?? '',
    rarityType:           mapped.rarityType              ?? 'Mainline',
    notes:                mapped.notes?.trim()            ?? '',
    sortOrder:            mapped.sortOrder               ?? sortOrder,
    normalizedSearchText: '',
  };

  item.normalizedSearchText = [
    item.modelName,
    item.toyNumber,
    item.collectorNumber,
    item.seriesName,
    item.seriesNumber,
    item.variationLabel,
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');

  return item;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
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
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
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
    return { items: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row.' }] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const items: NormalizedChecklistItem[] = [];
  const errors: ParseCSVResult['errors'] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => { raw[h] = values[idx]?.trim() ?? ''; });

    const item = normalizeChecklistItem(raw, i);

    if (!item.modelName) {
      errors.push({ row: i + 1, message: `Row ${i + 1}: modelName is required but missing.` });
      continue;
    }

    items.push(item);
  }

  return { items, errors };
}
