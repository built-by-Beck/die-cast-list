import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WantedItem } from '../types';

const FB = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

function tsToDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  return v instanceof Date ? v : new Date();
}

export function useWantedList(uid: string | undefined) {
  const [items, setItems] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(Boolean(uid && FB));

  useEffect(() => {
    if (!FB || !uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'usr', uid, 'wanted'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: WantedItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name as string,
          brand: data.brand,
          releaseYear: data.releaseYear ?? null,
          series: data.series ?? '',
          maxPrice: data.maxPrice ?? null,
          priority: data.priority ?? 'medium',
          notes: data.notes ?? '',
          found: Boolean(data.found),
          createdAt: tsToDate(data.createdAt),
          updatedAt: tsToDate(data.updatedAt),
        };
      });
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const addWanted = async (data: Omit<WantedItem, 'id' | 'found' | 'createdAt' | 'updatedAt'>) => {
    if (!uid) throw new Error('Not signed in');
    await addDoc(collection(db, 'usr', uid, 'wanted'), {
      ...data,
      found: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const markFound = async (id: string) => {
    if (!uid) throw new Error('Not signed in');
    await updateDoc(doc(db, 'usr', uid, 'wanted', id), {
      found: true,
      updatedAt: serverTimestamp(),
    });
  };

  return { items, loading, addWanted, markFound };
}
