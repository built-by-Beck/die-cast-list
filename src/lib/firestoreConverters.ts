import type { DocumentData } from 'firebase/firestore';
import type { Car, MarketplaceIntent, MasterChecklist, MasterChecklistItem } from '../types';
import type { NormalizedChecklistItem } from './parseChecklist';

export function docToCar(id: string, data: DocumentData): Car {
  return { id, ...data } as Car;
}

export function docToMasterChecklist(id: string, data: DocumentData): MasterChecklist {
  return { id, ...data } as MasterChecklist;
}

export function docToMasterItem(id: string, data: DocumentData): MasterChecklistItem {
  return { id, ...data } as MasterChecklistItem;
}

export function docToMarketplaceIntent(id: string, data: DocumentData): MarketplaceIntent {
  return { id, ...data } as MarketplaceIntent;
}

export function normalizedToMasterItem(
  id: string,
  n: NormalizedChecklistItem,
): Omit<MasterChecklistItem, 'createdAt' | 'updatedAt'> {
  return {
    id,
    toyNumber: n.toyNumber,
    collectorNumber: n.collectorNumber,
    modelName: n.modelName,
    seriesName: n.seriesName,
    seriesNumber: n.seriesNumber,
    photoUrl: n.photoUrl || null,
    imageRef: n.imageRef || null,
    variationLabel: n.variationLabel,
    rarityType: n.rarityType,
    notes: n.notes,
    sortOrder: n.sortOrder,
    normalizedSearchText: n.normalizedSearchText,
    tags: n.tags ?? [],
    isTreasureHunt: n.isTreasureHunt ?? false,
    isSuperTreasureHunt: n.isSuperTreasureHunt ?? false,
    isExclusive: n.isExclusive ?? false,
    exclusiveStore: n.exclusiveStore ?? null,
  };
}
