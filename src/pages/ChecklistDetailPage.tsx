import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MOCK_CHECKLISTS, MOCK_CHECKLIST_ITEMS, MOCK_CHECKLIST_PROGRESS,
} from '../data/mockData';
import type { ChecklistItemStatus, MasterChecklistItem } from '../types';
import { RarityBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

type StatusFilter = 'all' | 'owned' | 'need' | 'duplicate' | 'favorites' | 'for-sale-trade';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'owned',         label: '✓ Have' },
  { key: 'need',          label: '🔍 Need' },
  { key: 'duplicate',     label: '📋 Dupes' },
  { key: 'favorites',     label: '★ Favorites' },
  { key: 'for-sale-trade', label: '🏷️ Sale/Trade' },
];

// Local state for item statuses (Phase 6: persist to Firestore)
type ItemStatusMap = Record<string, ChecklistItemStatus>;

export default function ChecklistDetailPage() {
  const { checklistId } = useParams<{ checklistId: string }>();

  const checklist = MOCK_CHECKLISTS.find((c) => c.id === checklistId);
  const items = MOCK_CHECKLIST_ITEMS[checklistId ?? ''] ?? [];
  const progress = MOCK_CHECKLIST_PROGRESS.find((p) => p.checklistId === checklistId);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [itemStatuses, setItemStatuses] = useState<ItemStatusMap>(() => {
    // Seed with some demo statuses
    const seed: ItemStatusMap = {};
    if (items[0]) seed[items[0].id] = 'owned';
    if (items[2]) seed[items[2].id] = 'need';
    return seed;
  });

  const [pendingItem, setPendingItem] = useState<MasterChecklistItem | null>(null);
  const [showOwnedModal, setShowOwnedModal] = useState(false);

  const setStatus = (itemId: string, status: ChecklistItemStatus) => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }));
  };

  const handleMarkOwned = (item: MasterChecklistItem) => {
    setPendingItem(item);
    setShowOwnedModal(true);
  };

  const handleOwnedChoice = (addToInventory: boolean) => {
    if (pendingItem) {
      setStatus(pendingItem.id, 'owned');
      if (addToInventory) {
        // Phase 6: Navigate to Add Car with pre-filled checklist data
        console.log('Would add to inventory:', pendingItem.carName);
      }
    }
    setShowOwnedModal(false);
    setPendingItem(null);
  };

  const filteredItems = useMemo(() => {
    let result = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        item.carName.toLowerCase().includes(q) ||
        item.collectorNumber.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((item) => {
        const s = itemStatuses[item.id];
        switch (statusFilter) {
          case 'owned':          return s === 'owned';
          case 'need':           return s === 'need' || !s;
          case 'duplicate':      return s === 'duplicate';
          case 'for-sale-trade': return s === 'for_sale' || s === 'for_trade';
          case 'favorites':      return false; // Phase 6: track favorites
          default:               return true;
        }
      });
    }

    return result;
  }, [items, search, statusFilter, itemStatuses]);

  // Count by status
  const ownedCount   = items.filter((i) => itemStatuses[i.id] === 'owned').length;
  const dupCount     = items.filter((i) => itemStatuses[i.id] === 'duplicate').length;
  const neededCount  = items.length - ownedCount - dupCount;
  const pct          = items.length > 0 ? Math.round((ownedCount / items.length) * 100) : (progress?.completedPercent ?? 0);

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-50 leading-tight mb-1">{checklist.name}</h1>
        <p className="text-stone-400">{checklist.brand} · {checklist.year} · {checklist.category}</p>
      </div>

      {/* Progress section */}
      <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-stone-300 font-semibold">Your Progress</span>
          <span className="text-amber-400 text-2xl font-bold">{pct}%</span>
        </div>
        <div className="bg-stone-700 rounded-full h-4 mb-4">
          <div className="bg-amber-500 h-4 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 text-sm flex-wrap">
          <span className="text-green-400 font-bold">✓ {ownedCount} Have</span>
          <span className="text-stone-400 font-semibold">🔍 {neededCount} Need</span>
          {dupCount > 0 && <span className="text-amber-400 font-semibold">×{dupCount} Duplicates</span>}
          <span className="text-stone-500">{checklist.totalCars} total</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">🔎</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, number, color..."
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
        />
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              statusFilter === f.key
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 border border-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-stone-500 text-sm mb-4">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</p>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No items match"
          description="Try a different filter or search term."
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const status = itemStatuses[item.id] ?? 'need';
            return (
              <ChecklistItemCard
                key={item.id}
                item={item}
                status={status}
                onHave={() => handleMarkOwned(item)}
                onNeed={() => setStatus(item.id, 'need')}
                onDuplicate={() => setStatus(item.id, 'duplicate')}
              />
            );
          })}
        </div>
      )}

      {/* "Do you want to add to inventory?" modal */}
      <Modal
        isOpen={showOwnedModal}
        onClose={() => setShowOwnedModal(false)}
        title="You have this car!"
        size="sm"
      >
        <p className="text-stone-300 mb-2">
          <strong className="text-stone-100">{pendingItem?.carName}</strong>
        </p>
        <p className="text-stone-400 mb-6">
          Do you want to add this car to your inventory too?
        </p>
        <div className="flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={() => handleOwnedChoice(true)}>
            ✓ Yes, Add to My Inventory
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => handleOwnedChoice(false)}>
            Just Mark Owned
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ChecklistItemCard({
  item,
  status,
  onHave,
  onNeed,
  onDuplicate,
}: {
  item: MasterChecklistItem;
  status: ChecklistItemStatus;
  onHave: () => void;
  onNeed: () => void;
  onDuplicate: () => void;
}) {
  const statusColor = {
    owned:     'border-l-green-500 bg-green-500/5',
    need:      'border-l-stone-600',
    duplicate: 'border-l-amber-500 bg-amber-500/5',
    wanted:    'border-l-blue-500 bg-blue-500/5',
    for_sale:  'border-l-teal-500 bg-teal-500/5',
    for_trade: 'border-l-purple-500 bg-purple-500/5',
    skipped:   'border-l-stone-700 opacity-50',
  }[status] ?? 'border-l-stone-600';

  return (
    <div className={`bg-stone-800 border border-stone-700 border-l-4 ${statusColor} rounded-2xl p-4`}>
      <div className="flex items-start gap-3 mb-3">
        {/* Photo placeholder */}
        <div className="w-14 h-14 bg-stone-700 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
          🚗
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-stone-50 text-base leading-tight">{item.carName}</h4>
            {item.collectorNumber && (
              <span className="text-stone-500 text-xs font-mono flex-shrink-0">#{item.collectorNumber}</span>
            )}
          </div>
          <p className="text-stone-400 text-sm mt-0.5">
            {item.brand} · {item.releaseYear}{item.color ? ` · ${item.color}` : ''}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <RarityBadge rarity={item.rarityType} />
            {status === 'owned' && (
              <span className="text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded-full font-bold">
                ✓ Have It
              </span>
            )}
            {status === 'duplicate' && (
              <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                Duplicate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onHave}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            status === 'owned'
              ? 'bg-green-600 text-white'
              : 'bg-stone-700 hover:bg-green-700 hover:text-white text-stone-300'
          }`}
        >
          ✓ I Have It
        </button>
        <button
          onClick={onNeed}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            status === 'need'
              ? 'bg-blue-700 text-white'
              : 'bg-stone-700 hover:bg-blue-700 hover:text-white text-stone-300'
          }`}
        >
          🔍 Need It
        </button>
        <button
          onClick={onDuplicate}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            status === 'duplicate'
              ? 'bg-amber-500 text-stone-900'
              : 'bg-stone-700 hover:bg-amber-600 hover:text-white text-stone-300'
          }`}
        >
          ×2 Duplicate
        </button>
      </div>
    </div>
  );
}
