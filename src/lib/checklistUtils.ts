import type { ChecklistItemStatus, DuplicateItemStatus, ChecklistProgressItem } from '../types';

// ─── Item Key ────────────────────────────────────────────────────────────────

// collectorNumber alone is NOT a unique key — color variations share the same
// collector number but have different toy numbers. Always use the composite key.
export function getChecklistItemKey(params: {
  checklistId: string;
  toyNumber: string;
  collectorNumber: string;
  modelName: string;
  seriesName: string;
  seriesNumber: string;
  variationLabel?: string;
}): string {
  return [
    params.checklistId,
    params.toyNumber,
    params.collectorNumber,
    params.modelName,
    params.seriesName,
    params.seriesNumber,
    params.variationLabel ?? '',
  ]
    .map((s) => s.toLowerCase().trim().replace(/\s+/g, '-'))
    .join('|');
}

// ─── Quantity State ───────────────────────────────────────────────────────────

export interface QuantityState {
  owned: boolean;
  quantityOwned: number;
  duplicateCount: number;
  status: ChecklistItemStatus;
}

// Single source of truth for all quantity → status derivation.
// Rules from spec:
//   qty = 0 → need
//   qty = 1 → owned
//   qty > 1 → duplicate, duplicateCount = qty - 1
export function calcQuantityState(quantity: number): QuantityState {
  const q = Math.max(0, Math.floor(quantity));
  if (q === 0) return { owned: false, quantityOwned: 0, duplicateCount: 0, status: 'need' };
  if (q === 1) return { owned: true,  quantityOwned: 1, duplicateCount: 0, status: 'owned' };
  return           { owned: true,  quantityOwned: q, duplicateCount: q - 1, status: 'duplicate' };
}

export function incrementQuantity(current: number): QuantityState {
  return calcQuantityState(current + 1);
}

export function decrementQuantity(current: number): QuantityState {
  return calcQuantityState(Math.max(0, current - 1));
}

// ─── Progress Summary ────────────────────────────────────────────────────────

export interface ProgressSummary {
  ownedCount: number;
  neededCount: number;
  duplicateItemCount: number;
  totalDuplicateCount: number;
  completedPercent: number;
}

export function recalculateProgress(
  items: Pick<ChecklistProgressItem, 'quantityOwned'>[],
  totalCars: number,
): ProgressSummary {
  const ownedCount        = items.filter((i) => i.quantityOwned > 0).length;
  const duplicateItemCount = items.filter((i) => i.quantityOwned > 1).length;
  const totalDuplicateCount = items.reduce((s, i) => s + Math.max(0, i.quantityOwned - 1), 0);
  const neededCount       = Math.max(0, totalCars - ownedCount);
  const completedPercent  = totalCars > 0 ? Math.round((ownedCount / totalCars) * 100) : 0;
  return { ownedCount, neededCount, duplicateItemCount, totalDuplicateCount, completedPercent };
}

// ─── Duplicate Status Label ──────────────────────────────────────────────────

export const DUPLICATE_STATUS_LABELS: Record<DuplicateItemStatus, string> = {
  keep:      'Keep',
  sell:      'For Sale',
  trade:     'For Trade',
  give_away: 'Give Away',
  unknown:   'Unknown',
};
