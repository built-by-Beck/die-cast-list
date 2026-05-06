import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CARS } from '../data/mockData';
import type { Car, RarityType } from '../types';
import { RarityBadge, PackageBadge, DuplicateBadge, FavoriteBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

type FilterKey =
  | 'all' | 'favorites' | 'showcase' | 'treasure-hunts' | 'super-th'
  | 'premium' | 'mainline' | 'loose' | 'carded' | 'for-sale' | 'for-trade'
  | 'wanted' | 'duplicates';

type SortKey =
  | 'name' | 'year' | 'brand' | 'series' | 'condition'
  | 'value' | 'date-added' | 'favorites' | 'package' | 'rarity';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'favorites',     label: '★ Favorites' },
  { key: 'showcase',      label: '⭐ Showcase' },
  { key: 'treasure-hunts',label: '🔥 Treasure Hunts' },
  { key: 'super-th',      label: '⭐ Super THs' },
  { key: 'premium',       label: '💎 Premium' },
  { key: 'mainline',      label: 'Mainline' },
  { key: 'carded',        label: '📦 Carded' },
  { key: 'loose',         label: '🔓 Loose' },
  { key: 'for-sale',      label: '🏷️ For Sale' },
  { key: 'for-trade',     label: '🔄 For Trade' },
  { key: 'wanted',        label: '🔍 Wanted' },
  { key: 'duplicates',    label: '📋 Duplicates' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date-added', label: 'Date Added' },
  { key: 'name',       label: 'Name / Model' },
  { key: 'year',       label: 'Year' },
  { key: 'brand',      label: 'Brand' },
  { key: 'series',     label: 'Series' },
  { key: 'condition',  label: 'Condition' },
  { key: 'value',      label: 'Estimated Value' },
  { key: 'favorites',  label: 'Favorites First' },
  { key: 'package',    label: 'Carded / Loose' },
  { key: 'rarity',     label: 'Rarity' },
];

function applyFilter(cars: Car[], filter: FilterKey): Car[] {
  const rarityMap: Partial<Record<FilterKey, RarityType>> = {
    'treasure-hunts': 'Treasure Hunt',
    'super-th':       'Super Treasure Hunt',
    'premium':        'Premium',
    'mainline':       'Mainline',
  };

  switch (filter) {
    case 'all':        return cars;
    case 'favorites':  return cars.filter((c) => c.isFavorite);
    case 'showcase':   return cars.filter((c) => c.isShowcase);
    case 'carded':     return cars.filter((c) => c.packageStatus === 'Carded' || c.packageStatus === 'Damaged package' || c.packageStatus === 'Opened but saved package');
    case 'loose':      return cars.filter((c) => c.packageStatus === 'Loose');
    case 'for-sale':   return cars.filter((c) => c.isForSale);
    case 'for-trade':  return cars.filter((c) => c.isForTrade);
    case 'wanted':     return cars.filter((c) => c.isWanted);
    case 'duplicates': return cars.filter((c) => c.quantityOwned > 1);
    default: {
      const rarity = rarityMap[filter];
      return rarity ? cars.filter((c) => c.rarityType === rarity) : cars;
    }
  }
}

function applySort(cars: Car[], sort: SortKey): Car[] {
  return [...cars].sort((a, b) => {
    switch (sort) {
      case 'name':      return a.name.localeCompare(b.name);
      case 'year':      return b.releaseYear - a.releaseYear;
      case 'brand':     return a.brand.localeCompare(b.brand);
      case 'series':    return a.series.localeCompare(b.series);
      case 'condition': return a.condition.localeCompare(b.condition);
      case 'value':     return (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0);
      case 'favorites': return Number(b.isFavorite) - Number(a.isFavorite);
      case 'package':   return a.packageStatus.localeCompare(b.packageStatus);
      case 'rarity': {
        const order: RarityType[] = ['Super Treasure Hunt','Treasure Hunt','Chase','Limited Edition','Premium','Mainline','Redline','Custom','Regular','Unknown'];
        return order.indexOf(a.rarityType) - order.indexOf(b.rarityType);
      }
      default: return 0; // date-added: keep original order
    }
  });
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date-added');

  const filtered = useMemo(() => {
    let cars = MOCK_CARS.filter((c) => !c.archivedAt); // exclude archived
    cars = applyFilter(cars, activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      cars = cars.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.series.toLowerCase().includes(q) ||
        c.color.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.storageLocation.toLowerCase().includes(q) ||
        String(c.releaseYear).includes(q)
      );
    }
    return applySort(cars, sortBy);
  }, [search, activeFilter, sortBy]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">My Inventory</h1>
        <button
          onClick={() => navigate('/inventory/add')}
          className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 py-3 rounded-xl text-base transition-all"
        >
          ➕ Add Car
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-lg">🔎</span>
        <input
          type="search"
          placeholder="Search by name, brand, series, year, color, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter buttons — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeFilter === f.key
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 border border-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <span className="text-stone-400 text-sm font-medium">
          {filtered.length} car{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-stone-500 text-sm sr-only">Sort by</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-stone-800 border border-stone-700 text-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState
          icon="🚗"
          title={search ? 'No cars match your search' : 'Your garage is empty'}
          description={
            search
              ? 'Try a different search term or clear the search.'
              : 'Add your first car and start building your collection!'
          }
          actionLabel={search ? undefined : 'Add Your First Car'}
          onAction={search ? undefined : () => navigate('/inventory/add')}
        />
      )}

      {/* Car grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((car) => (
            <CarCard key={car.id} car={car} onView={() => navigate(`/inventory/${car.id}`)} onEdit={() => navigate(`/inventory/${car.id}/edit`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarCard({ car, onView, onEdit }: { car: Car; onView: () => void; onEdit: () => void }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden hover:border-stone-500 transition-colors">
      {/* Photo placeholder */}
      <div
        className="relative bg-stone-700 h-40 flex items-center justify-center cursor-pointer"
        onClick={onView}
      >
        {car.primaryPhotoUrl ? (
          <img src={car.primaryPhotoUrl} alt={car.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl">🚗</div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <RarityBadge rarity={car.rarityType} />
        </div>
        {car.isFavorite && (
          <div className="absolute top-2 right-2">
            <FavoriteBadge />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className="font-bold text-stone-50 text-base leading-tight cursor-pointer hover:text-amber-400 transition-colors"
            onClick={onView}
          >
            {car.name}
          </div>
          <DuplicateBadge count={car.quantityOwned} />
        </div>

        <div className="space-y-1 text-sm text-stone-400 mb-3">
          <div>{car.brand} · {car.releaseYear}</div>
          {car.series && <div className="truncate">{car.series}</div>}
          <div className="flex items-center gap-2 flex-wrap">
            <PackageBadge status={car.packageStatus} />
            {car.isForSale && (
              <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full font-semibold">
                For Sale {car.askingPrice ? `$${car.askingPrice}` : ''}
              </span>
            )}
            {car.isForTrade && (
              <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-semibold">
                For Trade
              </span>
            )}
          </div>
        </div>

        {car.estimatedValue != null && (
          <div className="text-amber-400 font-bold text-sm mb-3">
            Est. ${car.estimatedValue.toFixed(2)}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold rounded-xl py-2 text-sm transition-colors"
          >
            View Details
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold rounded-xl py-2 text-sm transition-colors border border-amber-500/30"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
