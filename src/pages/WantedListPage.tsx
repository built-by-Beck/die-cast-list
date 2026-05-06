import { useState } from 'react';
import { BRANDS, type Brand, type WantedPriority } from '../types';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import type { WantedItem } from '../types';

const MOCK_WANTED: WantedItem[] = [
  {
    id: 'w1',
    name: "'70 Chevelle SS Super Treasure Hunt",
    brand: 'Hot Wheels',
    releaseYear: 2025,
    series: 'Super Treasure Hunts',
    maxPrice: 25.00,
    priority: 'high',
    notes: 'Looking for the red one specifically.',
    found: false,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'w2',
    name: 'Porsche 356 Speedster',
    brand: 'Hot Wheels',
    releaseYear: 2024,
    series: 'Car Culture',
    maxPrice: 10.00,
    priority: 'medium',
    notes: '',
    found: false,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
  },
];

const PRIORITY_COLORS: Record<WantedPriority, string> = {
  high:   'bg-red-700 text-white',
  medium: 'bg-amber-600 text-white',
  low:    'bg-stone-600 text-stone-200',
};

export default function WantedListPage() {
  const [items, setItems] = useState<WantedItem[]>(MOCK_WANTED);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: 'Hot Wheels' as Brand, releaseYear: '',
    series: '', maxPrice: '', priority: 'medium' as WantedPriority, notes: '',
  });

  const pending = items.filter((i) => !i.found);
  const found   = items.filter((i) => i.found);

  const markFound = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, found: true, updatedAt: new Date() } : i));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: WantedItem = {
      id: `w${Date.now()}`,
      name: form.name,
      brand: form.brand,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
      series: form.series,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
      priority: form.priority,
      notes: form.notes,
      found: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems((prev) => [newItem, ...prev]);
    setShowForm(false);
    setForm({ name: '', brand: 'Hot Wheels', releaseYear: '', series: '', maxPrice: '', priority: 'medium', notes: '' });
  };

  const inputClass = 'w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600';

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">Wanted List</h1>
        <Button onClick={() => setShowForm(true)}>➕ Add to Wanted</Button>
      </div>

      <p className="text-stone-400 mb-6">
        Track cars you're hunting so you know exactly what to look for at the store.
      </p>

      {/* Pending */}
      {pending.length === 0 && found.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nothing on your list yet"
          description="Add cars you're hunting so you'll remember what to look for."
          actionLabel="Add to Wanted List"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="section-title">Still Looking ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((item) => (
                  <WantedCard key={item.id} item={item} onFound={() => markFound(item.id)} />
                ))}
              </div>
            </section>
          )}

          {found.length > 0 && (
            <section>
              <h2 className="section-title text-stone-500">Found! ({found.length})</h2>
              <div className="space-y-3 opacity-60">
                {found.map((item) => (
                  <WantedCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Add Wanted Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add to Wanted List" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Car Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. '70 Chevelle SS STH"
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Brand</label>
              <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as Brand })} className={inputClass}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Year</label>
              <input type="number" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
                placeholder="2025" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Max Price ($)</label>
              <input type="number" step="0.01" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                placeholder="25.00" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WantedPriority })} className={inputClass}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Specific color, variant, where to look..."
              className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" fullWidth>Add to List</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function WantedCard({ item, onFound }: { item: WantedItem; onFound?: () => void }) {
  return (
    <div className={`bg-stone-800 border border-stone-700 rounded-2xl p-4 ${item.found ? '' : 'hover:border-stone-500'} transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-base leading-tight ${item.found ? 'line-through text-stone-500' : 'text-stone-50'}`}>
              {item.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_COLORS[item.priority]}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-stone-400 text-sm mt-0.5">
            {item.brand}{item.releaseYear ? ` · ${item.releaseYear}` : ''}{item.series ? ` · ${item.series}` : ''}
          </p>
          {item.maxPrice != null && (
            <p className="text-stone-500 text-sm mt-0.5">Max price: ${item.maxPrice.toFixed(2)}</p>
          )}
          {item.notes && <p className="text-stone-500 text-sm mt-1">{item.notes}</p>}
        </div>

        {!item.found && onFound && (
          <button
            onClick={onFound}
            className="flex-shrink-0 bg-green-700 hover:bg-green-600 text-white font-bold px-3 py-2 rounded-xl text-sm transition-colors"
          >
            ✓ Found It!
          </button>
        )}
        {item.found && (
          <span className="text-green-400 font-bold text-sm flex-shrink-0">✓ Found!</span>
        )}
      </div>
    </div>
  );
}
