import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTrackedLists, untrackChecklist, useUserChecklistSummaries } from '../hooks/useChecklistsFirestore';
import { getEffectivePlan, getPlanLimits } from '../lib/access';

export default function TrackedListsPage() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const { trackedLists, loading } = useTrackedLists(user?.uid);
  const { byChecklistId } = useUserChecklistSummaries(user?.uid);
  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';
  const limits = getPlanLimits(effectivePlan);

  const cards = useMemo(
    () => trackedLists.map((list) => ({ list, progress: byChecklistId[list.listId] })),
    [trackedLists, byChecklistId],
  );

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="page-title mb-1">My Tracked Lists</h1>
        <p className="text-sm text-stone-400">Tracking {trackedLists.length} of {limits.maxTrackedLists}</p>
      </div>

      {loading ? (
        <p className="text-stone-400">Loading tracked lists...</p>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-stone-700 bg-stone-800 p-6 text-stone-400">
          You are not tracking any lists yet. Go to Choose Lists to start.
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(({ list, progress }) => (
            <div key={list.id} className="rounded-2xl border border-stone-700 bg-stone-800 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-100">{list.listTitle}</h3>
                  <p className="text-sm text-stone-400">{list.brandName} · {list.year}</p>
                  <p className="text-xs text-stone-500 mt-1">{list.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">{progress?.completedPercent ?? 0}%</p>
                  <p className="text-xs text-stone-500">complete</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-700">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: `${progress?.completedPercent ?? 0}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="text-green-400">Owned: {progress?.ownedCount ?? 0}</span>
                <span className="text-stone-300">Needed: {progress?.neededCount ?? 0}</span>
                <span className="text-amber-400">Duplicates: {progress?.duplicateItemCount ?? 0}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => navigate(`/checklists/${list.listId}`)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-stone-900">
                  Open
                </button>
                <button
                  onClick={() => user?.uid && void untrackChecklist(user.uid, list.listId)}
                  className="rounded-xl bg-stone-700 px-3 py-2 text-sm text-stone-200"
                >
                  Remove Tracking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
