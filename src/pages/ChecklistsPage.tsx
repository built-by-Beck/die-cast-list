import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CHECKLISTS, MOCK_CHECKLIST_PROGRESS } from '../data/mockData';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

type Tab = 'browse' | 'my-lists';

export default function ChecklistsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');

  const myProgressIds = new Set(MOCK_CHECKLIST_PROGRESS.map((p) => p.checklistId));

  const browseChecklists = MOCK_CHECKLISTS.filter((cl) => {
    if (!cl.isPublic) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cl.name.toLowerCase().includes(q) || cl.brand.toLowerCase().includes(q);
  });

  const myChecklists = MOCK_CHECKLIST_PROGRESS;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">Checklists</h1>
        <Button variant="secondary" onClick={() => navigate('/checklists/new')}>
          ➕ Custom Checklist
        </Button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '✅', label: 'Active Lists', value: myChecklists.length },
          { icon: '🚗', label: 'Cars I Have', value: myChecklists.reduce((s, p) => s + p.ownedCount, 0) },
          { icon: '🔍', label: 'Cars I Need', value: myChecklists.reduce((s, p) => s + p.neededCount, 0) },
          { icon: '📋', label: 'Duplicates', value: myChecklists.reduce((s, p) => s + p.duplicateCount, 0) },
        ].map((s) => (
          <div key={s.label} className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-stone-50">{s.value}</div>
            <div className="text-stone-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-800 border border-stone-700 rounded-2xl p-1 mb-6">
        {([['browse', '🔎 Browse Checklists'], ['my-lists', '📋 My Active Lists']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-base font-semibold rounded-xl transition-all ${
              tab === key
                ? 'bg-amber-500 text-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-lg">🔎</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search checklists by name or brand..."
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
            />
          </div>

          {browseChecklists.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No checklists found"
              description="Try a different search term, or come back soon — more checklists are added regularly."
            />
          ) : (
            <div className="space-y-3">
              {browseChecklists.map((cl) => {
                const progress = MOCK_CHECKLIST_PROGRESS.find((p) => p.checklistId === cl.id);
                const isTracking = myProgressIds.has(cl.id);
                return (
                  <div
                    key={cl.id}
                    className="bg-stone-800 border border-stone-700 rounded-2xl p-5 hover:border-stone-500 transition-colors cursor-pointer"
                    onClick={() => navigate(`/checklists/${cl.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-stone-50 leading-tight">{cl.name}</h3>
                        <p className="text-stone-400 text-sm mt-0.5">{cl.brand} · {cl.year} · {cl.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-stone-400 text-sm font-medium">{cl.totalCars} cars</span>
                        {isTracking && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                            Tracking
                          </span>
                        )}
                      </div>
                    </div>

                    {progress ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-stone-700 rounded-full h-2.5">
                          <div
                            className="bg-amber-500 h-2.5 rounded-full"
                            style={{ width: `${progress.completedPercent}%` }}
                          />
                        </div>
                        <span className="text-amber-400 text-sm font-bold whitespace-nowrap">
                          {progress.ownedCount}/{progress.totalCars} ({progress.completedPercent}%)
                        </span>
                      </div>
                    ) : (
                      <p className="text-stone-500 text-sm">Not started — tap to start tracking</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* My Active Lists tab */}
      {tab === 'my-lists' && (
        <>
          {myChecklists.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No active checklists yet"
              description="Browse the available checklists and start tracking a set you're collecting!"
              actionLabel="Browse Checklists"
              onAction={() => setTab('browse')}
            />
          ) : (
            <div className="space-y-3">
              {myChecklists.map((progress) => {
                const cl = MOCK_CHECKLISTS.find((c) => c.id === progress.checklistId);
                return (
                  <div
                    key={progress.id}
                    className="bg-stone-800 border border-stone-700 rounded-2xl p-5 hover:border-stone-500 transition-colors cursor-pointer"
                    onClick={() => navigate(`/checklists/${progress.checklistId}`)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-stone-50">{progress.checklistName}</h3>
                        {cl && <p className="text-stone-400 text-sm mt-0.5">{cl.brand} · {cl.year}</p>}
                      </div>
                      <span className="text-2xl font-bold text-amber-400 flex-shrink-0">
                        {progress.completedPercent}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-stone-700 rounded-full h-3 mb-3">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all"
                        style={{ width: `${progress.completedPercent}%` }}
                      />
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400 font-semibold">✓ {progress.ownedCount} Have</span>
                      <span className="text-stone-400 font-semibold">🔍 {progress.neededCount} Need</span>
                      {progress.duplicateCount > 0 && (
                        <span className="text-amber-400 font-semibold">×{progress.duplicateCount} Dupes</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
