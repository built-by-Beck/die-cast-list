import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicMasterChecklists, useUserChecklistSummaries } from '../hooks/useChecklistsFirestore';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import type { MasterChecklist, ChecklistProgress } from '../types';

export default function ChecklistsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checklists: publishedChecklists, loading: listsLoading, usingDraftFallback } = usePublicMasterChecklists();
  const { byChecklistId: progressById } = useUserChecklistSummaries(user?.uid);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const totalStats = useMemo(() => {
    const summaries = Object.values(progressById);
    return {
      active: summaries.filter((s) => s.ownedCount > 0).length,
      have: summaries.reduce((s, p) => s + p.ownedCount, 0),
      need: summaries.reduce((s, p) => s + p.neededCount, 0),
      dupes: summaries.reduce((s, p) => s + p.duplicateItemCount, 0),
    };
  }, [progressById]);

  const allYears = useMemo(
    () =>
      [...new Set(publishedChecklists.map((cl) => cl.year))].sort((a, b) => b - a),
    [publishedChecklists]
  );

  const filtered = useMemo(() => {
    return publishedChecklists.filter((cl) => {
      if (selectedYear && cl.year !== selectedYear) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          cl.name.toLowerCase().includes(q) ||
          cl.brand.toLowerCase().includes(q) ||
          cl.category.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
  }, [publishedChecklists, selectedYear, search]);

  const groups = useMemo(() => {
    if (selectedYear) {
      return [{ year: selectedYear, checklists: filtered }];
    }
    const byYear: Record<number, MasterChecklist[]> = {};
    for (const cl of filtered) {
      if (!byYear[cl.year]) byYear[cl.year] = [];
      byYear[cl.year].push(cl);
    }
    return allYears
      .filter((y) => byYear[y]?.length)
      .map((y) => ({ year: y, checklists: byYear[y] }));
  }, [selectedYear, filtered, allYears]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">Checklists</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/choose-lists')}>
            Choose Lists
          </Button>
          <Button variant="secondary" onClick={() => navigate('/my-tracked-lists')}>
            My Tracked Lists
          </Button>
        </div>
      </div>

      {listsLoading ? (
        <p className="text-stone-400 mb-8">Loading checklists...</p>
      ) : publishedChecklists.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No checklists published yet"
          description="Admin must import list data first (HotWheels wiki source import is available in Admin Checklists)."
        />
      ) : (
        <>
      {usingDraftFallback && (
        <div className="mb-4 rounded-xl border border-blue-700 bg-blue-900/20 px-4 py-3 text-sm text-blue-200">
          No published checklists were found yet. Showing available draft lists.
        </div>
      )}
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '✅', label: 'Active Lists', value: totalStats.active },
          { icon: '🚗', label: 'Cars I Have',  value: totalStats.have },
          { icon: '🔍', label: 'Cars I Need',  value: totalStats.need },
          { icon: '📋', label: 'Duplicates',   value: totalStats.dupes },
        ].map((s) => (
          <div key={s.label} className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-stone-50">{s.value}</div>
            <div className="text-stone-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Year selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedYear(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            selectedYear === null
              ? 'bg-amber-500 text-stone-900'
              : 'bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200'
          }`}
        >
          All Years
        </button>
        {allYears.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(selectedYear === year ? null : year)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedYear === year
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-lg pointer-events-none">
          🔎
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search checklists by name, brand, or category..."
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
        />
      </div>

      {/* Checklist groups */}
      {groups.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No checklists found"
          description="Try a different year or search term."
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ year, checklists }) => (
            <div key={year}>
              {!selectedYear && (
                <h2 className="text-stone-400 font-bold text-sm uppercase tracking-wider mb-3 px-1">
                  {year}
                </h2>
              )}
              <div className="space-y-3">
                {checklists.map((cl) => (
                  <ChecklistCard
                    key={cl.id}
                    checklist={cl}
                    progress={progressById[cl.id]}
                    onClick={() => navigate(`/checklists/${cl.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

function ChecklistCard({
  checklist,
  progress,
  onClick,
}: {
  checklist: MasterChecklist;
  progress: ChecklistProgress | undefined;
  onClick: () => void;
}) {
  const isTracking = !!progress;

  return (
    <div
      className="bg-stone-800 border border-stone-700 rounded-2xl p-5 hover:border-stone-500 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-stone-50 leading-tight">{checklist.name}</h3>
          <p className="text-stone-400 text-sm mt-0.5">
            {checklist.brand} · {checklist.category} · {checklist.totalCars} cars
          </p>
        </div>
        <div className="flex-shrink-0">
          {isTracking ? (
            <span className="text-2xl font-bold text-amber-400">{progress.completedPercent}%</span>
          ) : (
            <span className="text-xs text-stone-500 bg-stone-700/60 px-2.5 py-1 rounded-lg">
              Not started
            </span>
          )}
        </div>
      </div>

      {isTracking ? (
        <>
          <div className="bg-stone-700 rounded-full h-2.5 mb-3">
            <div
              className="bg-amber-500 h-2.5 rounded-full"
              style={{ width: `${progress.completedPercent}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-green-400 font-semibold">✓ {progress.ownedCount} Have</span>
            <span className="text-stone-400 font-semibold">🔍 {progress.neededCount} Need</span>
            {progress.duplicateItemCount > 0 && (
              <span className="text-amber-400 font-semibold">
                ×{progress.duplicateItemCount} Dupes
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-stone-500 text-sm">Tap to view and start tracking this set</p>
      )}
    </div>
  );
}
