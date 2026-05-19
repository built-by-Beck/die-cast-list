import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canUseAI, getEffectivePlan, getPlanLimits } from '../lib/access';
import { trackChecklist, usePublicMasterChecklists, useTrackedLists } from '../hooks/useChecklistsFirestore';
import { functions, httpsCallable } from '../lib/firebase';
import { BRANDS, CHECKLIST_CATEGORIES } from '../types';
import type { Brand, ChecklistCategory } from '../types';

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
  const aiEnabled = userDoc ? canUseAI(userDoc) : false;

  // AI wiki import state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiForm, setAiForm] = useState({
    wikiUrl: '',
    name: `${new Date().getFullYear()} Hot Wheels Mainline`,
    year: new Date().getFullYear(),
    brand: 'Hot Wheels' as Brand,
    category: 'Mainline' as ChecklistCategory,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ totalCars: number; name: string; note: string } | null>(null);
  const [aiError, setAiError] = useState('');

  const runAiImport = async () => {
    if (!functions) return;
    setAiError('');
    setAiResult(null);
    setAiLoading(true);
    try {
      const fn = httpsCallable<typeof aiForm, { totalCars: number; name: string; note: string }>(
        functions,
        'importChecklistFromWiki',
      );
      const res = await fn(aiForm);
      setAiResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import failed — check the URL and try again.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

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

      {/* AI Wiki Import */}
      {!aiEnabled ? (
        <div className="mb-5 rounded-2xl border border-stone-700 bg-stone-800/60 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-stone-200 font-semibold text-sm">AI List Import</p>
            <p className="text-stone-500 text-xs mt-0.5">Let AI pull any checklist straight from the Hot Wheels Wiki. Pro only.</p>
          </div>
          <button
            onClick={() => setShowAiPanel(true)}
            className="flex-shrink-0 rounded-xl bg-stone-700 border border-stone-600 px-3 py-2 text-xs font-semibold text-stone-400 cursor-default"
            disabled
          >
            🔒 Pro feature
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-amber-700/50 bg-amber-900/10 p-4">
          <button
            onClick={() => setShowAiPanel((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-amber-300 font-semibold text-sm">✨ AI List Import</p>
              <p className="text-stone-400 text-xs mt-0.5">Paste a wiki URL — AI fetches and structures the checklist automatically.</p>
            </div>
            <span className="text-stone-500 text-xs">{showAiPanel ? '▲ Hide' : '▼ Open'}</span>
          </button>

          {showAiPanel && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Wiki URL</label>
                <input
                  value={aiForm.wikiUrl}
                  onChange={(e) => setAiForm((f) => ({ ...f, wikiUrl: e.target.value }))}
                  placeholder="https://hotwheels.fandom.com/wiki/2024_Hot_Wheels"
                  className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">List Name</label>
                  <input
                    value={aiForm.name}
                    onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={aiForm.year}
                    onChange={(e) => setAiForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Brand</label>
                  <select
                    value={aiForm.brand}
                    onChange={(e) => setAiForm((f) => ({ ...f, brand: e.target.value as Brand }))}
                    className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-sm text-stone-200"
                  >
                    {BRANDS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Category</label>
                  <select
                    value={aiForm.category}
                    onChange={(e) => setAiForm((f) => ({ ...f, category: e.target.value as ChecklistCategory }))}
                    className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-sm text-stone-200"
                  >
                    {CHECKLIST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {aiError && (
                <p className="text-red-400 text-xs rounded-lg border border-red-800 bg-red-900/20 px-3 py-2">{aiError}</p>
              )}
              {aiResult && (
                <p className="text-green-400 text-xs rounded-lg border border-green-800 bg-green-900/20 px-3 py-2">
                  Imported <strong>{aiResult.totalCars} cars</strong> as "{aiResult.name}". {aiResult.note}
                </p>
              )}

              <button
                onClick={() => void runAiImport()}
                disabled={aiLoading || !aiForm.wikiUrl.trim()}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-900 font-bold py-2.5 text-sm transition-colors"
              >
                {aiLoading ? 'Importing… this may take 30–60 seconds' : '✨ Import from Wiki'}
              </button>
            </div>
          )}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-700 bg-stone-800 p-6">
          <p className="text-stone-300 font-semibold mb-2">No lists are available yet.</p>
          <p className="text-stone-400 text-sm mb-3">
            Admin needs to import list data first. Quick path:
            hotwheels.fandom.com/wiki, then open target list, edit source, copy source, and paste into Admin Checklists quick import.
          </p>
          <button
            onClick={() => navigate('/admin/checklists')}
            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-stone-900"
          >
            Open Admin Import
          </button>
        </div>
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
