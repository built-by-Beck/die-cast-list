import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { DuplicateItemStatus } from '../types';
import { DUPLICATE_STATUS_LABELS } from '../lib/checklistUtils';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  fetchChecklistWithItems,
  persistSingleProgressItem,
  syncProgressSummaryFromFirestore,
} from '../lib/checklistProgressFirestore';

interface DuplicateRow {
  checklistId: string;
  checklistName: string;
  progressItemId: string;
  masterItemId: string;
  toyNumber: string;
  collectorNumber: string;
  modelName: string;
  seriesName: string;
  seriesNumber: string;
  quantityOwned: number;
  duplicateStatus: DuplicateItemStatus;
  isFavorite: boolean;
}

const STATUS_COLORS: Record<DuplicateItemStatus, string> = {
  keep:      'bg-stone-600 text-stone-200',
  sell:      'bg-green-700 text-green-100',
  trade:     'bg-blue-700 text-blue-200',
  give_away: 'bg-purple-700 text-purple-200',
  unknown:   'bg-stone-700 text-stone-500',
};

const FB = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

export default function DuplicatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateRow[]>([]);

  useEffect(() => {
    if (!FB || !user) {
      setDuplicates([]);
      return;
    }

    let unsub: Unsubscribe | undefined;
    const q = query(
      collectionGroup(db, 'progressItems'),
      where('ownerUid', '==', user.uid),
      where('quantityOwned', '>', 1)
    );

    unsub = onSnapshot(q, (snap) => {
      const rows: DuplicateRow[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          checklistId: data.checklistId as string,
          checklistName: (data.checklistName as string) ?? 'Checklist',
          progressItemId: d.id,
          masterItemId: (data.masterItemId as string) ?? d.id,
          toyNumber: (data.toyNumber as string) ?? '',
          collectorNumber: (data.collectorNumber as string) ?? '',
          modelName: (data.modelName as string) ?? '',
          seriesName: (data.seriesName as string) ?? '',
          seriesNumber: (data.seriesNumber as string) ?? '',
          quantityOwned: (data.quantityOwned as number) ?? 0,
          duplicateStatus: (data.duplicateStatus as DuplicateItemStatus) ?? 'unknown',
          isFavorite: Boolean(data.isFavorite),
        };
      });
      setDuplicates(rows);
    });

    return () => unsub?.();
  }, [user?.uid]);

  const grouped = useMemo(() => {
    const groups: Record<string, { checklistName: string; rows: DuplicateRow[] }> = {};
    for (const row of duplicates) {
      if (!groups[row.checklistId]) {
        groups[row.checklistId] = { checklistName: row.checklistName, rows: [] };
      }
      groups[row.checklistId].rows.push(row);
    }
    return groups;
  }, [duplicates]);

  const totalExtras = duplicates.reduce((s, d) => s + (d.quantityOwned - 1), 0);

  const handleDecrement = async (dup: DuplicateRow) => {
    if (!user) return;
    const bundle = await fetchChecklistWithItems(db, dup.checklistId);
    if (!bundle) return;
    const masterItem = bundle.items.find((i) => i.id === dup.masterItemId);
    if (!masterItem) return;
    const newQty = dup.quantityOwned - 1;
    await persistSingleProgressItem(
      db,
      user.uid,
      bundle.checklist,
      masterItem,
      newQty,
      dup.duplicateStatus,
      dup.isFavorite,
    );
    await syncProgressSummaryFromFirestore(db, user.uid, bundle.checklist, bundle.items);
  };

  const handleStatusChange = async (dup: DuplicateRow, status: DuplicateItemStatus) => {
    if (!user) return;
    const bundle = await fetchChecklistWithItems(db, dup.checklistId);
    if (!bundle) return;
    const masterItem = bundle.items.find((i) => i.id === dup.masterItemId);
    if (!masterItem) return;
    await persistSingleProgressItem(
      db,
      user.uid,
      bundle.checklist,
      masterItem,
      dup.quantityOwned,
      status,
      dup.isFavorite,
    );
    await syncProgressSummaryFromFirestore(db, user.uid, bundle.checklist, bundle.items);
  };

  if (!FB || !user) {
    return (
      <div className="page-container">
        <h1 className="page-title">Duplicates</h1>
        <p className="text-stone-400">Sign in with Firebase configured to track duplicates.</p>
      </div>
    );
  }

  if (duplicates.length === 0) {
    return (
      <div className="page-container">
        <h1 className="page-title">Duplicates</h1>
        <EmptyState
          icon="📋"
          title="No duplicates yet!"
          description="When you own more than one of the same car on a checklist, extras show up here. You can mark them for sale, trade, or give away."
          actionLabel="Go to Checklists"
          onAction={() => navigate('/checklists')}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title mb-0">Duplicates</h1>
        <div className="text-right">
          <div className="text-3xl font-black text-amber-400">{totalExtras}</div>
          <div className="text-xs text-stone-500">extra cars</div>
        </div>
      </div>
      <p className="text-stone-400 text-sm mb-6">
        Cars you own more than one of. Mark extras for sale, trade, or give away.
      </p>

      {Object.entries(grouped).map(([clId, group]) => (
        <div key={clId} className="mb-8">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Link to={`/checklists/${clId}`} className="hover:text-amber-400 transition-colors">
              {group.checklistName}
            </Link>
            <span className="text-stone-600 font-normal normal-case">
              — {group.rows.length} {group.rows.length === 1 ? 'duplicate' : 'duplicates'}
            </span>
          </h2>

          <div className="space-y-3">
            {group.rows.map((dup) => (
              <DuplicateCard
                key={`${dup.checklistId}-${dup.masterItemId}`}
                dup={dup}
                onDecrement={() => void handleDecrement(dup)}
                onStatusChange={(s) => void handleStatusChange(dup, s)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DuplicateCard({
  dup,
  onDecrement,
  onStatusChange,
}: {
  dup: DuplicateRow;
  onDecrement: () => void;
  onStatusChange: (status: DuplicateItemStatus) => void;
}) {
  const extraCount = dup.quantityOwned - 1;

  return (
    <div className="bg-stone-800 border border-stone-700 border-l-4 border-l-amber-500 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-stone-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          🚗
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-stone-50 text-base leading-tight">{dup.modelName}</h4>
          <p className="text-stone-500 text-xs mt-0.5">
            {dup.seriesName}{dup.seriesNumber ? ` · ${dup.seriesNumber}` : ''}
          </p>
          <div className="flex gap-3 mt-1 text-xs">
            {dup.toyNumber       && <span className="font-mono text-stone-600">Toy #{dup.toyNumber}</span>}
            {dup.collectorNumber && <span className="font-mono text-stone-700">{dup.collectorNumber}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-black text-amber-400">{dup.quantityOwned}</div>
          <div className="text-xs text-stone-500">owned</div>
          <div className="text-xs text-amber-600 font-semibold">
            {extraCount} extra{extraCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['keep', 'sell', 'trade', 'give_away'] as DuplicateItemStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusChange(s)}
            className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold transition-all ${
              dup.duplicateStatus === s
                ? STATUS_COLORS[s]
                : 'bg-stone-700 text-stone-500 hover:bg-stone-600 hover:text-stone-300'
            }`}
          >
            {DUPLICATE_STATUS_LABELS[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={onDecrement}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-stone-700 hover:bg-red-900/50 text-stone-400 hover:text-red-400 transition-all"
          title="Remove one duplicate"
        >
          −1
        </button>
      </div>
    </div>
  );
}
