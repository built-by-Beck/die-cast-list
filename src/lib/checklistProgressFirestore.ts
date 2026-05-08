import {
  doc,
  writeBatch,
  serverTimestamp,
  deleteDoc,
  setDoc,
  collection,
  getDoc,
  getDocs,
  query,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import type {
  ChecklistPublicIntentStatus,
  DuplicateItemStatus,
  MarketplaceIntentType,
  MasterChecklist,
  MasterChecklistItem,
} from "../types";
import {
  calcQuantityState,
  recalculateProgress,
  type ProgressSummary,
} from "./checklistUtils";
import { docToMasterChecklist, docToMasterItem } from "./firestoreConverters";

export function progressSummaryRef(
  db: Firestore,
  uid: string,
  checklistId: string,
) {
  return doc(db, "usr", uid, "checklistProgress", checklistId);
}

export function progressItemRef(
  db: Firestore,
  uid: string,
  checklistId: string,
  masterItemId: string,
) {
  return doc(
    db,
    "usr",
    uid,
    "checklistProgress",
    checklistId,
    "progressItems",
    masterItemId,
  );
}

function buildProgressItemPayload(
  uid: string,
  checklist: MasterChecklist,
  masterItem: MasterChecklistItem,
  quantityOwned: number,
  duplicateStatus: DuplicateItemStatus,
  isFavorite: boolean,
  publicIntentStatus: ChecklistPublicIntentStatus,
): Record<string, unknown> {
  const qs = calcQuantityState(quantityOwned);
  return {
    ownerUid: uid,
    checklistId: checklist.id,
    checklistName: checklist.name,
    masterItemId: masterItem.id,
    masterChecklistId: checklist.id,
    id: masterItem.id,
    toyNumber: masterItem.toyNumber,
    collectorNumber: masterItem.collectorNumber,
    modelName: masterItem.modelName,
    seriesName: masterItem.seriesName,
    seriesNumber: masterItem.seriesNumber,
    brandId:
      checklist.brandId ?? checklist.brand.toLowerCase().replace(/\s+/g, "-"),
    status: qs.status,
    privateOwnershipStatus: qs.quantityOwned > 0 ? "owned" : "not_owned",
    publicIntentStatus,
    owned: qs.owned,
    quantityOwned: qs.quantityOwned,
    duplicateCount: qs.duplicateCount,
    duplicateStatus,
    isFavorite,
    isWanted: false,
    isForSale: false,
    isForTrade: false,
    userNotes: "",
    linkedInventoryCarId: null,
    updatedAt: serverTimestamp(),
  };
}

function toMarketplaceIntentType(
  value: ChecklistPublicIntentStatus,
): MarketplaceIntentType | null {
  if (
    value === "looking_to_buy" ||
    value === "looking_to_trade_for" ||
    value === "available_for_sale" ||
    value === "available_for_trade"
  ) {
    return value;
  }
  return null;
}

function marketplaceIntentRef(
  db: Firestore,
  uid: string,
  checklistId: string,
  masterItemId: string,
) {
  return doc(db, "marketplaceIntents", `${uid}_${checklistId}_${masterItemId}`);
}

function buildSummaryPayload(
  checklist: MasterChecklist,
  s: ProgressSummary,
): Record<string, unknown> {
  return {
    checklistId: checklist.id,
    checklistName: checklist.name,
    brand: checklist.brand,
    year: checklist.year,
    totalCars: checklist.totalCars,
    ownedCount: s.ownedCount,
    neededCount: s.neededCount,
    duplicateItemCount: s.duplicateItemCount,
    totalDuplicateCount: s.totalDuplicateCount,
    completedPercent: s.completedPercent,
    lastOpenedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Persist all progress items implied by maps + summary. Items chunked to stay under batch limits. */
export async function persistChecklistProgressState(
  db: Firestore,
  uid: string,
  checklist: MasterChecklist,
  masterItems: MasterChecklistItem[],
  quantityMap: Record<string, number>,
  favoritesMap: Record<string, boolean>,
  duplicateStatusMap: Record<string, DuplicateItemStatus>,
  publicIntentStatusMap: Record<string, ChecklistPublicIntentStatus>,
  allowPublicIntents: boolean = true,
  memberDisplayName: string = "Collector",
): Promise<void> {
  const qtyRows = masterItems.map((mi) => ({
    quantityOwned: quantityMap[mi.id] ?? 0,
  }));
  const summary = recalculateProgress(qtyRows, masterItems.length);

  const MAX_OPS = 450;
  let batch = writeBatch(db);
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const mi of masterItems) {
    const qty = quantityMap[mi.id] ?? 0;
    const fav = favoritesMap[mi.id] ?? false;
    const dupSt = duplicateStatusMap[mi.id] ?? "unknown";
    const publicIntentStatus = allowPublicIntents
      ? (publicIntentStatusMap[mi.id] ?? "none")
      : "none";
    const intentType = toMarketplaceIntentType(publicIntentStatus);
    const itemRef = progressItemRef(db, uid, checklist.id, mi.id);

    if (qty === 0 && !fav) {
      batch.delete(itemRef);
    } else {
      batch.set(
        itemRef,
        buildProgressItemPayload(
          uid,
          checklist,
          mi,
          qty,
          dupSt,
          fav,
          publicIntentStatus,
        ),
        { merge: true },
      );
    }
    const intentRef = marketplaceIntentRef(db, uid, checklist.id, mi.id);
    if (intentType) {
      batch.set(
        intentRef,
        {
          intentId: `${uid}_${checklist.id}_${mi.id}`,
          userId: uid,
          memberDisplayName,
          brandId:
            checklist.brandId ??
            checklist.brand.toLowerCase().replace(/\s+/g, "-"),
          year: checklist.year,
          listId: checklist.id,
          listTitle: checklist.name,
          itemId: mi.id,
          modelName: mi.modelName,
          toyNumber: mi.toyNumber,
          collectionNumber: mi.collectorNumber,
          seriesName: mi.seriesName,
          intentType,
          quantity: Math.max(1, qty),
          condition: null,
          askingPrice: null,
          tradeNotesPublic: "",
          locationPublicText: null,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      batch.delete(intentRef);
    }
    ops++;
    if (ops >= MAX_OPS) await flush();
  }

  if (ops > 0) await flush();

  await setDoc(
    progressSummaryRef(db, uid, checklist.id),
    buildSummaryPayload(checklist, summary),
    { merge: true },
  );
}

/** Recompute checklist summary totals from progress item docs + master list (source of truth for totals). */
export async function syncProgressSummaryFromFirestore(
  db: Firestore,
  uid: string,
  checklist: MasterChecklist,
  masterItems: MasterChecklistItem[],
): Promise<void> {
  const snap = await getDocs(
    collection(
      db,
      "usr",
      uid,
      "checklistProgress",
      checklist.id,
      "progressItems",
    ),
  );
  const qtyById: Record<string, number> = {};
  snap.forEach((d) => {
    qtyById[d.id] = (d.data().quantityOwned as number) ?? 0;
  });
  const qtyRows = masterItems.map((mi) => ({
    quantityOwned: qtyById[mi.id] ?? 0,
  }));
  const summary = recalculateProgress(qtyRows, masterItems.length);
  await setDoc(
    progressSummaryRef(db, uid, checklist.id),
    buildSummaryPayload(checklist, summary),
    { merge: true },
  );
}

export async function fetchChecklistWithItems(
  db: Firestore,
  checklistId: string,
): Promise<{
  checklist: MasterChecklist;
  items: MasterChecklistItem[];
} | null> {
  const clRef = doc(db, "checklists", checklistId);
  const clSnap = await getDoc(clRef);
  if (!clSnap.exists()) return null;
  const checklist = docToMasterChecklist(clSnap.id, clSnap.data());
  const iq = query(
    collection(db, "checklists", checklistId, "items"),
    orderBy("sortOrder", "asc"),
  );
  const itemSnap = await getDocs(iq);
  const items = itemSnap.docs.map((d) => docToMasterItem(d.id, d.data()));
  return { checklist, items };
}

export async function persistSingleProgressItem(
  db: Firestore,
  uid: string,
  checklist: MasterChecklist,
  masterItem: MasterChecklistItem,
  quantityOwned: number,
  duplicateStatus: DuplicateItemStatus,
  isFavorite: boolean,
  publicIntentStatus: ChecklistPublicIntentStatus = "none",
  allowPublicIntents: boolean = true,
  memberDisplayName: string = "Collector",
): Promise<void> {
  const ref = progressItemRef(db, uid, checklist.id, masterItem.id);
  if (quantityOwned === 0 && !isFavorite) {
    await deleteDoc(ref);
  } else {
    await setDoc(
      ref,
      buildProgressItemPayload(
        uid,
        checklist,
        masterItem,
        quantityOwned,
        duplicateStatus,
        isFavorite,
        allowPublicIntents ? publicIntentStatus : "none",
      ),
      { merge: true },
    );
  }
  const intentRef = marketplaceIntentRef(db, uid, checklist.id, masterItem.id);
  const intentType = toMarketplaceIntentType(publicIntentStatus);
  if (allowPublicIntents && intentType) {
    await setDoc(
      intentRef,
      {
        intentId: `${uid}_${checklist.id}_${masterItem.id}`,
        userId: uid,
        memberDisplayName,
        brandId:
          checklist.brandId ??
          checklist.brand.toLowerCase().replace(/\s+/g, "-"),
        year: checklist.year,
        listId: checklist.id,
        listTitle: checklist.name,
        itemId: masterItem.id,
        modelName: masterItem.modelName,
        toyNumber: masterItem.toyNumber,
        collectionNumber: masterItem.collectorNumber,
        seriesName: masterItem.seriesName,
        intentType,
        quantity: Math.max(1, quantityOwned),
        condition: null,
        askingPrice: null,
        tradeNotesPublic: "",
        locationPublicText: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await deleteDoc(intentRef);
  }
}
