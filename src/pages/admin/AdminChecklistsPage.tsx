import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_CHECKLISTS } from '../../data/mockData';
import type { MasterChecklist, Brand, ChecklistCategory } from '../../types';
import { BRANDS, CHECKLIST_CATEGORIES } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';

export default function AdminChecklistsPage() {
  const [checklists, setChecklists] = useState<MasterChecklist[]>(MOCK_CHECKLISTS);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterChecklist | null>(null);
  const [form, setForm] = useState({
    name: '', brand: 'Hot Wheels' as Brand, year: String(new Date().getFullYear()),
    category: 'Mainline' as ChecklistCategory, description: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCl: MasterChecklist = {
      id: `cl-${Date.now()}`,
      name: form.name,
      brand: form.brand,
      year: Number(form.year),
      category: form.category,
      description: form.description,
      totalCars: 0,
      isPublic: false,
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChecklists((prev) => [newCl, ...prev]);
    setShowCreate(false);
    setForm({ name: '', brand: 'Hot Wheels', year: String(new Date().getFullYear()), category: 'Mainline', description: '' });
  };

  const togglePublish = (id: string) =>
    setChecklists((prev) =>
      prev.map((cl) => cl.id === id ? { ...cl, isPublic: !cl.isPublic, updatedAt: new Date() } : cl)
    );

  const handleDelete = () => {
    if (!deleteTarget) return;
    setChecklists((prev) => prev.filter((cl) => cl.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const inputClass = 'w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600';

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
        <Link to="/admin" className="hover:text-stone-300 transition-colors">Admin</Link>
        <span>›</span>
        <span className="text-stone-400">Checklists</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title mb-0">Master Checklists</h1>
        <Button onClick={() => setShowCreate(true)}>➕ Create Checklist</Button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-amber-300 text-sm">
        <strong>Phase 7:</strong> Creating/editing checklists will save to Firestore via a secure Cloud Function.
        CSV import is planned for a later phase.
      </div>

      {/* Checklists table */}
      <div className="space-y-3">
        {checklists.map((cl) => (
          <div key={cl.id} className="bg-stone-800 border border-stone-700 rounded-2xl p-5 hover:border-stone-500 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-stone-50 text-lg">{cl.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    cl.isPublic ? 'bg-green-700 text-green-200' : 'bg-stone-700 text-stone-400'
                  }`}>
                    {cl.isPublic ? '✓ Published' : '● Draft'}
                  </span>
                </div>
                <p className="text-stone-400 text-sm">
                  {cl.brand} · {cl.year} · {cl.category} · {cl.totalCars} cars
                </p>
                {cl.description && <p className="text-stone-500 text-sm mt-1">{cl.description}</p>}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(cl.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    cl.isPublic
                      ? 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                      : 'bg-green-700 hover:bg-green-600 text-white'
                  }`}
                >
                  {cl.isPublic ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => setDeleteTarget(cl)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-700 hover:bg-red-900/50 text-stone-400 hover:text-red-400 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>

            {cl.totalCars === 0 && (
              <div className="mt-3 border-t border-stone-700 pt-3 flex gap-3">
                <button className="text-xs text-stone-500 hover:text-amber-400 transition-colors font-medium">
                  ➕ Add items manually
                </button>
                <button className="text-xs text-stone-500 hover:text-amber-400 transition-colors font-medium">
                  📄 Import CSV (Phase 7)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Master Checklist" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Checklist Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2025 Hot Wheels Mainline"
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Brand *</label>
              <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as Brand })} className={inputClass}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Year *</label>
              <input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ChecklistCategory })} className={inputClass}>
              {CHECKLIST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" fullWidth>Create Checklist</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Checklist?"
        message={`Delete "${deleteTarget?.name}"? This will remove it for all users who are tracking it. This cannot be undone.`}
        confirmLabel="Delete Forever"
        confirmVariant="danger"
      />
    </div>
  );
}
