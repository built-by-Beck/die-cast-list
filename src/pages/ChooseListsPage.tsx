import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEffectivePlan, getPlanLimits } from '../lib/access';
import { trackChecklist, usePublicMasterChecklists, useTrackedLists } from '../hooks/useChecklistsFirestore';

function inferListType(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('super treasure')) return 'Super Treasure Hunts';
  if (c.includes('treasure')) return 'Treasure Hunts';
  if (c.includes('premium') || c.includes('car culture') || c.includes('team transport') || c.includes('boulevard')) return 'Premium';
  if (c.includes('series')) return 'By Series';
  if (c.includes('mainline')) return 'Mainline';
  if (c.includes('theme')) return 'Themed assortment';
  return 'Other';
}

export default function ChooseListsPage() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const { checklists, loading, usingDraftFallback } = usePublicMasterChecklists();
  const { trackedLists } = useTrackedLists(user?.uid);

  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';
  const limits = userDoc ? getPlanLimits(effectivePlan) : getPlanLimits('free');
  const canTrackMore = trackedLists.length < limits.maxTrackedLists;

  const [brandFilter, setBrandFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => checklists.filter((list) => {
    const listType = inferListType(list.category);
    if (brandFilter !== 'all' && (list.brandId ?? 'hot-wheels') !== brandFilter) return false;
    if (yearFilter !== 'all' && String(list.year) !== yearFilter) return false;
    if (categoryFilter !== 'all' && list.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && listType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return list.name.toLowerCase().includes(q);
    }
    return true;
  }), [brandFilter, categoryFilter, checklists, search, typeFilter, yearFilter]);

  const trackedSet = useMemo(() => new Set(trackedLists.map((list) => list.listId)), [trackedLists]);
  const years = useMemo(() => [...new Set(checklists.map((list) => list.year))].sort((a, b) => b - a), [checklists]);
  const categories = useMemo(() => [...new Set(checklists.map((list) => list.category))].sort(), [checklists]);

  const onTrack = async (checklistId: string) => {
    if (!user?.uid) return;
    const checklist = checklists.find((cl) => cl.id === checklistId);
    if (!checklist) return;
    if (!canTrackMore && !trackedSet.has(checklistId)) {
      if (effectivePlan === 'basic') {
        setError('Basic includes 1 tracked list. Upgrade to Pro to track up to 25 lists, unlock series filtering, and use buy/sell/trade tracking.');
      } else {
        setError('You are tracking 25 of 25 lists. Remove a list before adding another.');
      }
      return;
    }
    setError('');
    await trackChecklist(user.uid, checklist);
  };

  return (
    <div className="page-container">
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="page-title mb-1">Choose Lists</h1>
          <p className="text-stone-400 text-sm">Track {trackedLists.length} of {limits.maxTrackedLists} lists</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-amber-700 bg-amber-900/30 px-4 py-3 text-sm text-amber-200">{error}</div>}
      {usingDraftFallback && (
        <div className="mb-4 rounded-xl border border-blue-700 bg-blue-900/20 px-4 py-3 text-sm text-blue-200">
          No published lists were found yet. Showing available draft lists so you can start tracking.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-5">
        <select aria-label="Filter by brand" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200">
          <option value="all">Brand</option>
          <option value="hot-wheels">Hot Wheels</option>
        </select>
        <select aria-label="Filter by year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200">
          <option value="all">Year</option>
          {years.map((year) => <option key={year} value={String(year)}>{year}</option>)}
        </select>
        <select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200">
          <option value="all">Category</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select aria-label="Filter by list type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200">
          <option value="all">Type</option>
          <option>Mainline</option>
          <option>By Series</option>
          <option>Premium</option>
          <option>Treasure Hunts</option>
          <option>Super Treasure Hunts</option>
          <option>Themed assortment</option>
          <option>Other</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-500" placeholder="Search list name" />
      </div>

      {loading ? (
        <p className="text-stone-400">Loading lists...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((list) => {
            const isTracking = trackedSet.has(list.id);
            const disabled = !isTracking && !canTrackMore;
            return (
              <div key={list.id} className="rounded-2xl border border-stone-700 bg-stone-800 p-5">
                <p className="text-xs text-stone-500 mb-2">Hot Wheels · {list.year}</p>
                <h3 className="text-lg font-bold text-stone-100">{list.name}</h3>
                <p className="text-sm text-stone-400 mt-1">{list.category} · {list.totalCars} items</p>
                <p className="text-xs text-stone-500 mt-1">Type: {inferListType(list.category)}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => void onTrack(list.id)}
                    disabled={disabled}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${isTracking ? 'bg-green-700 text-green-100' : disabled ? 'bg-stone-700 text-stone-500' : 'bg-amber-500 text-stone-900'}`}
                  >
                    {isTracking ? 'Tracking' : disabled ? (effectivePlan === 'basic' ? 'Upgrade Required' : 'Limit Reached') : 'Track List'}
                  </button>
                  <button onClick={() => navigate(`/checklists/${list.id}`)} className="rounded-xl bg-stone-700 px-3 py-2 text-sm text-stone-200">
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
