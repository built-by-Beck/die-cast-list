import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { docToMasterChecklist, docToMasterItem } from '../lib/firestoreConverters';
import type { ChecklistProgress, MasterChecklist, MasterChecklistItem, UserTrackedList } from '../types';

const FB = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

function docToProgress(id: string, data: DocumentData): ChecklistProgress {
  return { id, ...data } as ChecklistProgress;
}

/** Published master checklists (browse). */
export function usePublicMasterChecklists() {
  const [checklists, setChecklists] = useState<MasterChecklist[]>([]);
  const [loading, setLoading] = useState(FB);
  const [error, setError] = useState<string | null>(null);
  const [usingDraftFallback, setUsingDraftFallback] = useState(false);

  useEffect(() => {
    if (!FB) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'checklists'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => docToMasterChecklist(d.id, d.data()))
          .filter((cl) => !cl.archivedAt);
        rows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
        const publicRows = rows.filter((cl) => cl.isPublic);
        // If nothing is published yet, fall back to drafts so users can still track lists.
        const visibleRows = publicRows.length > 0 ? publicRows : rows;
        setChecklists(visibleRows);
        setUsingDraftFallback(publicRows.length === 0 && rows.length > 0);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Public checklists:', err);
        setError('Could not load checklists.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { checklists, loading, error, usingDraftFallback };
}

/** All master checklists (admin). */
export function useAllMasterChecklists() {
  const [checklists, setChecklists] = useState<MasterChecklist[]>([]);
  const [loading, setLoading] = useState(FB);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FB) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'checklists'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => docToMasterChecklist(d.id, d.data()));
        rows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
        setChecklists(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Admin checklists:', err);
        setError('Could not load checklists.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { checklists, loading, error };
}

/** Per-checklist summary docs for the signed-in user (stats on list page). */
export function useUserChecklistSummaries(uid: string | undefined) {
  const [byChecklistId, setByChecklistId] = useState<Record<string, ChecklistProgress>>({});
  const [loading, setLoading] = useState(Boolean(uid && FB));

  useEffect(() => {
    if (!FB || !uid) {
      setByChecklistId({});
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'usr', uid, 'checklistProgress'),
      (snap) => {
        const next: Record<string, ChecklistProgress> = {};
        snap.docs.forEach((d) => {
          next[d.id] = docToProgress(d.id, d.data());
        });
        setByChecklistId(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [uid]);

  return { byChecklistId, loading };
}

/** One checklist header + ordered items. */
export function useMasterChecklistDetail(checklistId: string | undefined) {
  const [checklist, setChecklist] = useState<MasterChecklist | null>(null);
  const [items, setItems] = useState<MasterChecklistItem[]>([]);
  const [loading, setLoading] = useState(Boolean(checklistId && FB));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FB || !checklistId) {
      setChecklist(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const cref = doc(db, 'checklists', checklistId);
    const unsubCl = onSnapshot(
      cref,
      (snap) => {
        if (!snap.exists()) {
          setChecklist(null);
          setItems([]);
          setLoading(false);
          return;
        }
        setChecklist(docToMasterChecklist(snap.id, snap.data()));
      },
      (err) => {
        console.error(err);
        setError('Could not load checklist.');
        setLoading(false);
      }
    );

    const iq = query(
      collection(db, 'checklists', checklistId, 'items'),
      orderBy('sortOrder', 'asc')
    );
    const unsubItems = onSnapshot(
      iq,
      (snap) => {
        setItems(snap.docs.map((d) => docToMasterItem(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError('Could not load checklist items.');
        setLoading(false);
      }
    );

    return () => {
      unsubCl();
      unsubItems();
    };
  }, [checklistId]);

  return { checklist, items, loading, error };
}

/** Single checklist fetch (non-reactive) — e.g. duplicates handler. */
export async function getMasterChecklistMeta(checklistId: string): Promise<MasterChecklist | null> {
  if (!FB) return null;
  const snap = await getDoc(doc(db, 'checklists', checklistId));
  if (!snap.exists()) return null;
  return docToMasterChecklist(snap.id, snap.data());
}

function docToTrackedList(id: string, data: DocumentData): UserTrackedList {
  return { id, ...data } as UserTrackedList;
}

export function useTrackedLists(uid: string | undefined) {
  const [trackedLists, setTrackedLists] = useState<UserTrackedList[]>([]);
  const [loading, setLoading] = useState(Boolean(uid && FB));

  useEffect(() => {
    if (!FB || !uid) {
      setTrackedLists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'usr', uid, 'trackedLists'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrackedLists(snap.docs.map((d) => docToTrackedList(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  return { trackedLists, loading };
}

export async function trackChecklist(uid: string, checklist: MasterChecklist): Promise<void> {
  await setDoc(
    doc(db, 'usr', uid, 'trackedLists', checklist.id),
    {
      userId: uid,
      listId: checklist.id,
      brandId: checklist.brandId ?? checklist.brand.toLowerCase().replace(/\s+/g, '-'),
      brandName: checklist.brandName ?? checklist.brand,
      listTitle: checklist.name,
      year: checklist.year,
      category: checklist.category,
      listType: checklist.category,
      itemCount: checklist.totalCars,
      pinned: false,
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function untrackChecklist(uid: string, checklistId: string): Promise<void> {
  await deleteDoc(doc(db, 'usr', uid, 'trackedLists', checklistId));
}
