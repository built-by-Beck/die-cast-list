import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MOCK_CHECKLISTS,
  MOCK_CHECKLIST_ITEMS,
  MOCK_CHECKLIST_PROGRESS_ITEMS,
} from '../data/mockData';
import type { MasterChecklistItem } from '../types';
import { calcQuantityState, recalculateProgress } from '../lib/checklistUtils';
import { RarityBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

type StatusFilter = 'all' | 'need' | 'owned' | 'duplicate' | 'favorites';
type SortKey = 'sortOrder' | 'toyNumber' | 'collectorNumber' | 'modelName';
type ViewMode = 'table' | 'cards';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'owned',     label: '✓ Have' },
  { key: 'need',      label: '🔍 Need' },
  { key: 'duplicate', label: '× Dupes' },
  { key: 'favorites', label: '★ Faves' },
];

export default function ChecklistDetailPage() {
  const { checklistId } = useParams<{ checklistId: string }>();

  const checklist   = MOCK_CHECKLISTS.find((c) => c.id === checklistId);
  const items       = MOCK_CHECKLIST_ITEMS[checklistId ?? ''] ?? [];
  const seedItems   = MOCK_CHECKLIST_PROGRESS_ITEMS[checklistId ?? ''] ?? [];

  const [quantityMap, setQuantityMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(seedItems.map((pi) => [pi.masterItemId, pi.quantityOwned]))
  );
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(seedItems.filter((pi) => pi.isFavorite).map((pi) => [pi.masterItemId, true]))
  );

  const [seriesFilter, setSeriesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch]             = useState('');
  const [sort, setSort]                 = useState<SortKey>('sortOrder');
  const [viewMode, setViewMode]         = useState<ViewMode>('table');

  const uniqueSeries = useMemo(
    () => [...new Set(items.map((i) => i.seriesName))].filter(Boolean),
    [items]
  );

  const progress = useMemo(() => {
    const all = items.map((i) => ({ quantityOwned: quantityMap[i.id] ?? 0 }));
    return recalculateProgress(all, items.length);
  }, [items, quantityMap]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (seriesFilter) {
      result = result.filter((i) => i.seriesName === seriesFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((i) => {
        const qty = quantityMap[i.id] ?? 0;
        if (statusFilter === 'need')      return qty === 0;
        if (statusFilter === 'owned')     return qty === 1;
        if (statusFilter === 'duplicate') return qty > 1;
        if (statusFilter === 'favorites') return favoritesMap[i.id] ?? false;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.normalizedSearchText.includes(q.replace(/[^a-z0-9\s]/g, '')) ||
          i.modelName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === 'toyNumber')       return a.toyNumber.localeCompare(b.toyNumber);
      if (sort === 'collectorNumber') return a.collectorNumber.localeCompare(b.collectorNumber);
      if (sort === 'modelName')       return a.modelName.localeCompare(b.modelName);
      return a.sortOrder - b.sortOrder;
    });

    return result;
  }, [items, seriesFilter, statusFilter, search, sort, quantityMap, favoritesMap]);

  const handleIncrement = useCallback((itemId: string) => {
    setQuantityMap((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  }, []);

  const handleDecrement = useCallback((itemId: string) => {
    setQuantityMap((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1) }));
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setFavoritesMap((prev) => ({ ...prev, [itemId]: !(prev[itemId] ?? false) }));
  }, []);

  if (!checklist) {
    return (
      <div className="page-container text-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-stone-200 mb-3">Checklist not found</h1>
        <Link to="/checklists" className="text-amber-400 hover:underline">Back to Checklists</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
        <Link to="/checklists" className="hover:text-stone-300 transition-colors">Checklists</Link>
        <span>›</span>
        <span className="text-stone-400 truncate">{checklist.name}</span>
      </div>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-stone-50 leading-tight">{checklist.name}</h1>
        <p className="text-stone-400 mt-1">{checklist.brand} · {checklist.year} · {checklist.category}</p>
        {checklist.sourceAttribution && (
          <p className="text-xs text-stone-600 mt-1">
            {checklist.sourceAttribution}
            {checklist.sourceUrl && (
              <> ·{' '}
                <a
                  href={checklist.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-stone-500"
                >
                  {checklist.sourceName}
                </a>
              </>
            )}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-stone-300 font-semibold text-lg">Your Progress</span>
          <span className="text-amber-400 text-3xl font-bold">{progress.completedPercent}%</span>
        </div>
        <div className="bg-stone-700 rounded-full h-4 mb-4">
          <div
            className="bg-amber-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress.completedPercent}%` }}
          />
        </div>
        <div className="flex gap-5 text-sm flex-wrap">
          <span className="text-green-400 font-bold">✓ {progress.ownedCount} Have</span>
          <span className="text-stone-400 font-semibold">🔍 {progress.neededCount} Need</span>
          {progress.duplicateItemCount > 0 && (
            <span className="text-amber-400 font-semibold">
              📋 {progress.duplicateItemCount} Dupes ({progress.totalDuplicateCount} extras)
            </span>
          )}
          <span className="text-stone-600">of {items.length} cars</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Search + Sort + View toggle */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none">🔎</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cars..."
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-xl pl-11 pr-4 py-2.5 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-stone-800 border border-stone-700 text-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="sortOrder">Sort: #</option>
            <option value="toyNumber">Sort: Toy #</option>
            <option value="collectorNumber">Sort: Col.#</option>
            <option value="modelName">Sort: Name A–Z</option>
          </select>
          {/* View toggle — desktop only */}
          <div className="hidden md:flex bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`px-3 py-2.5 text-sm font-bold transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card view"
              className={`px-3 py-2.5 text-sm font-bold transition-colors ${
                viewMode === 'cards' ? 'bg-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ⊞
            </button>
          </div>
        </div>

        {/* Series filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSeriesFilter('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              seriesFilter === ''
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'
            }`}
          >
            All Series
          </button>
          {uniqueSeries.map((s) => (
            <button
              key={s}
              onClick={() => setSeriesFilter(seriesFilter === s ? '' : s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                seriesFilter === s
                  ? 'bg-amber-500 text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === f.key
                  ? 'bg-stone-500 text-stone-100'
                  : 'bg-stone-800 text-stone-500 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-stone-600 text-xs mb-3">
        {filteredItems.length} of {items.length} cars
      </p>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No items match"
          description="Try clearing the series or status filter, or search for something else."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={viewMode === 'table' ? 'hidden md:block' : 'hidden'}>
            <ChecklistTable
              items={filteredItems}
              quantityMap={quantityMap}
              favoritesMap={favoritesMap}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onToggleFavorite={toggleFavorite}
            />
          </div>

          {/* Cards (mobile always, desktop when card mode selected) */}
          <div className={`${viewMode === 'table' ? 'block md:hidden' : 'block'} space-y-3`}>
            {filteredItems.map((item) => (
              <ChecklistItemCard
                key={item.id}
                item={item}
                quantity={quantityMap[item.id] ?? 0}
                isFavorite={favoritesMap[item.id] ?? false}
                onIncrement={() => handleIncrement(item.id)}
                onDecrement={() => handleDecrement(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function ChecklistTable({
  items,
  quantityMap,
  favoritesMap,
  onIncrement,
  onDecrement,
  onToggleFavorite,
}: {
  items: MasterChecklistItem[];
  quantityMap: Record<string, number>;
  favoritesMap: Record<string, boolean>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[740px]">
          <thead>
            <tr className="border-b border-stone-700 text-left text-stone-400 text-xs font-semibold uppercase tracking-wide bg-stone-900/50">
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Toy #</th>
              <th className="px-4 py-3">Col.#</th>
              <th className="px-4 py-3 w-12"></th>
              <th className="px-4 py-3">Model Name</th>
              <th className="px-4 py-3">Series</th>
              <th className="px-4 py-3">Ser.#</th>
              <th className="px-4 py-3">Rarity</th>
              <th className="px-4 py-3">★</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty    = quantityMap[item.id] ?? 0;
              const { status } = calcQuantityState(qty);
              const isFav  = favoritesMap[item.id] ?? false;

              const rowBg =
                status === 'owned'
                  ? 'bg-green-500/5'
                  : status === 'duplicate'
                  ? 'bg-amber-500/5'
                  : idx % 2 !== 0
                  ? 'bg-stone-700/10'
                  : '';

              const leftBorder =
                status === 'owned'
                  ? 'border-l-2 border-l-green-500'
                  : status === 'duplicate'
                  ? 'border-l-2 border-l-amber-500'
                  : 'border-l-2 border-l-transparent';

              return (
                <tr
                  key={item.id}
                  className={`border-b border-stone-700/50 hover:bg-stone-700/30 transition-colors ${rowBg} ${leftBorder}`}
                >
                  {/* Qty controls */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDecrement(item.id)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-red-900/60 disabled:opacity-25 text-stone-300 font-bold text-base leading-none flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className={`w-7 text-center font-bold text-sm ${
                        qty === 0 ? 'text-stone-600' : qty === 1 ? 'text-green-400' : 'text-amber-400'
                      }`}>
                        {qty}
                      </span>
                      <button
                        onClick={() => onIncrement(item.id)}
                        className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-green-700 text-stone-300 hover:text-white font-bold text-base leading-none flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  {/* Toy # */}
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-stone-400 text-xs">{item.toyNumber || '—'}</span>
                  </td>
                  {/* Col.# */}
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-stone-500 text-xs">{item.collectorNumber || '—'}</span>
                  </td>
                  {/* Photo */}
                  <td className="px-4 py-2.5">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-stone-700" />
                    ) : (
                      <div className="w-10 h-10 bg-stone-700/50 rounded-lg flex items-center justify-center text-base">🚗</div>
                    )}
                  </td>
                  {/* Model Name */}
                  <td className="px-4 py-2.5 max-w-[220px]">
                    <div className="font-semibold text-stone-100 leading-tight truncate">{item.modelName}</div>
                    {item.variationLabel && (
                      <div className="text-xs text-stone-500 truncate mt-0.5">{item.variationLabel}</div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-stone-600 italic mt-0.5">{item.notes}</div>
                    )}
                  </td>
                  {/* Series */}
                  <td className="px-4 py-2.5">
                    <span className="text-stone-400 text-xs whitespace-nowrap">{item.seriesName}</span>
                  </td>
                  {/* Series # */}
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-stone-500 text-xs">{item.seriesNumber || '—'}</span>
                  </td>
                  {/* Rarity */}
                  <td className="px-4 py-2.5">
                    <RarityBadge rarity={item.rarityType} />
                  </td>
                  {/* Favorite */}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`text-xl transition-colors ${
                        isFav ? 'text-amber-400' : 'text-stone-700 hover:text-stone-500'
                      }`}
                    >
                      ★
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function ChecklistItemCard({
  item,
  quantity,
  isFavorite,
  onIncrement,
  onDecrement,
  onToggleFavorite,
}: {
  item: MasterChecklistItem;
  quantity: number;
  isFavorite: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleFavorite: () => void;
}) {
  const { status } = calcQuantityState(quantity);

  const borderColor = status === 'owned' ? 'border-l-green-500' : status === 'duplicate' ? 'border-l-amber-500' : 'border-l-stone-600';
  const bgColor     = status === 'owned' ? 'bg-green-500/5'    : status === 'duplicate' ? 'bg-amber-500/5'    : '';

  return (
    <div className={`bg-stone-800 border border-stone-700 border-l-4 ${borderColor} ${bgColor} rounded-2xl p-4`}>
      <div className="flex gap-3">
        {/* Photo */}
        <div className="flex-shrink-0">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" className="w-16 h-16 object-contain rounded-xl bg-stone-700" />
          ) : (
            <div className="w-16 h-16 bg-stone-700 rounded-xl flex items-center justify-center text-2xl">🚗</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + favorite */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-bold text-stone-50 text-base leading-tight truncate">{item.modelName}</h4>
              {item.variationLabel && <p className="text-stone-500 text-xs">{item.variationLabel}</p>}
            </div>
            <button
              onClick={onToggleFavorite}
              className={`text-xl flex-shrink-0 transition-colors ${isFavorite ? 'text-amber-400' : 'text-stone-700 hover:text-stone-500'}`}
            >
              ★
            </button>
          </div>

          {/* Numbers row */}
          <div className="flex gap-3 mt-1 text-xs">
            {item.toyNumber      && <span className="font-mono text-stone-500">Toy #{item.toyNumber}</span>}
            {item.collectorNumber && <span className="font-mono text-stone-600">{item.collectorNumber}</span>}
          </div>

          {/* Series */}
          <p className="text-stone-500 text-xs mt-0.5">
            {item.seriesName}{item.seriesNumber ? ` · ${item.seriesNumber}` : ''}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <RarityBadge rarity={item.rarityType} />
            {item.notes && (
              <span className="text-xs text-stone-600 italic">{item.notes}</span>
            )}
            {status === 'owned' && (
              <span className="text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded-full font-bold">✓ Have</span>
            )}
            {status === 'duplicate' && (
              <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                ×{quantity} ({quantity - 1} extra)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* +/- controls */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-700/50">
        <span className="text-stone-400 text-sm font-medium">
          {status === 'need' ? '🔍 Need it' : status === 'owned' ? '✓ Have it' : `📋 Have ${quantity}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrement}
            disabled={quantity === 0}
            className="w-11 h-11 rounded-xl bg-stone-700 hover:bg-red-900/60 disabled:opacity-25 text-stone-300 font-bold text-2xl flex items-center justify-center transition-colors"
          >
            −
          </button>
          <span className={`w-10 text-center text-2xl font-black ${
            quantity === 0 ? 'text-stone-600' : quantity === 1 ? 'text-green-400' : 'text-amber-400'
          }`}>
            {quantity}
          </span>
          <button
            onClick={onIncrement}
            className="w-11 h-11 rounded-xl bg-stone-700 hover:bg-green-700 text-stone-300 hover:text-white font-bold text-2xl flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
