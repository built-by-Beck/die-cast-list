import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { canAddCar, getEffectivePlan, getPlanLimits } from '../lib/access';
import type { Car } from '../types';
import { docToCar } from '../lib/firestoreConverters';

export type CarInput = Omit<Car, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>;

export function useInventory() {
  const { user, userDoc } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCars([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'usr', user.uid, 'cars'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => docToCar(d.id, d.data()));
        setCars(all.filter((c) => !c.archivedAt));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Inventory load error:', err);
        setError('Failed to load inventory. Check your connection and try again.');
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const addCar = async (data: CarInput): Promise<string> => {
    if (!user || !userDoc) throw new Error('Not authenticated');
    if (!canAddCar(userDoc, cars.length)) {
      const limits = getPlanLimits(getEffectivePlan(userDoc));
      throw new Error(
        `You've reached your ${limits.maxCars}-car limit. Upgrade your plan to add more.`
      );
    }
    const ref = await addDoc(collection(db, 'usr', user.uid, 'cars'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archivedAt: null,
    });
    return ref.id;
  };

  const updateCar = async (
    carId: string,
    data: Partial<Omit<Car, 'id' | 'createdAt' | 'archivedAt'>>
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'usr', user.uid, 'cars', carId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const archiveCar = async (carId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'usr', user.uid, 'cars', carId), {
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return { cars, loading, error, addCar, updateCar, archiveCar };
}

export async function fetchCarById(uid: string, carId: string): Promise<Car | null> {
  const snap = await getDoc(doc(db, 'usr', uid, 'cars', carId));
  if (!snap.exists()) return null;
  return docToCar(snap.id, snap.data());
}
