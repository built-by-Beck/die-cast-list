import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_CHECKLISTS } from '../../data/mockData';
import type { MasterChecklist, Brand, ChecklistCategory } from '../../types';
import { BRANDS, CHECKLIST_CATEGORIES } from '../../types';
import { parseChecklistCsv } from '../../lib/parseChecklist';
import type { ParseCSVResult } from '../../lib/parseChecklist';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';

export default function AdminChecklistsPage() {
  const [checklists, setChecklists] = useState<MasterChecklist[]>(MOCK_CHECKLISTS);
  const [showCreate, setShowCreate]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterChecklist | null>(null);
  const [form, setForm] = useState({
    name: '',
    brand: 'Hot Wheels' as Brand,
    year: String(new Date().getFullYear()),
    category: 'Mainline' as ChecklistCategory,
    description: '',
  });

  // CSV Import state
  const [importTarget, setImportTarget]  = useState<MasterChecklist | null>(null);
  const [csvText, setCsvText]            = useState('');
  const [parseResult, setParseResult]    = useState<ParseCSVResult | null>(null);
  const [importDone, setImportDone]      = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCl: MasterChecklist = {
      id:               `cl-${Date.now()}`,
      name:             form.name,
      brand:            form.brand,
      year:             Number(form.year),
      category:         form.category,
      description:      form.description,
      sourceName:       '',
      sourceUrl:        '',
      sourceLicense:    '',
      sourceAttribution: '',
      totalCars:        0,
      uniqueSeries:     [],
      isPublic:         false,
      createdBy:        'admin',
      createdAt:        new Date(),
      updatedAt:        new Date(),
      archivedAt:       null,
    };
    setChecklists((prev) => [newCl, ...prev]);
    setShowCreate(false);
    setForm({ name: '', brand: 'Hot Wheels', year: String(new Date().getFullYear()), category: 'Mainline', description: '' });
  };

  const togglePublish = (id: string) =>
    setChecklists((prev) =>
      prev.map((cl) => (cl.id === id ? { ...cl, isPublic: !cl.isPublic, updatedAt: new Date() } : cl))
    );

  const handleDelete = () => {
    if (!deleteTarget) return;
    setChecklists((prev) => prev.filter((cl) => cl.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const openImport = (cl: MasterChecklist) => {
    setImportTarget(cl);
    setCsvText('');
    setParseResult(null);
    setImportDone(false);
  };

  const handleParse = () => {
    if (!csvText.trim()) return;
    setParseResult(parseChecklistCsv(csvText));
  };

  const handleImport = () => {
    if (!importTarget || !parseResult) return;
    const count = parseResult.items.length;
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === importTarget.id
          ? { ...cl, totalCars: cl.totalCars + count, updatedAt: new Date() }
          : cl
      )
    );
    setImportDone(true);
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

      {/* Checklist cards */}
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
                {cl.sourceAttribution && (
                  <p className="text-stone-600 text-xs mt-1 italic">{cl.sourceAttribution}</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button
                  onClick={() => openImport(cl)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-700 hover:bg-amber-600 hover:text-stone-900 text-stone-300 transition-all"
                >
                  📄 CSV
                </button>
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
          </div>
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Master Checklist" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Checklist Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2025 Hot Wheels Mainline"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Brand *</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value as Brand })}
                className={inputClass}
              >
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-1.5">Year *</label>
              <input
                required
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ChecklistCategory })}
              className={inputClass}
            >
              {CHECKLIST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" fullWidth>Create Checklist</Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import modal */}
      <Modal
        isOpen={Boolean(importTarget)}
        onClose={() => { setImportTarget(null); setParseResult(null); }}
        title={`Import CSV — ${importTarget?.name ?? ''}`}
        size="lg"
      >
        {importDone ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-stone-200 font-semibold text-lg mb-1">
              {parseResult?.items.length ?? 0} items imported!
            </p>
            <p className="text-stone-500 text-sm mb-6">
              Items have been added to <strong className="text-stone-300">{importTarget?.name}</strong>.
            </p>
            <Button onClick={() => { setImportTarget(null); setParseResult(null); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-xs text-stone-400 leading-relaxed">
              <p className="font-semibold text-stone-300 mb-1">CSV format — required header row:</p>
              <code className="text-amber-400">Toy #, Col.#, Model Name, Series, Series #, Rarity</code>
              <p className="mt-2">Supports wiki markup: <code className="text-stone-300">{'{{TH}}'}</code>, <code className="text-stone-300">{'{{STH}}'}</code>, <code className="text-stone-300">{'[[link|text]]'}</code></p>
            </div>

            {/* Textarea */}
            {!parseResult && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-300 mb-1.5">Paste CSV data</label>
                  <textarea
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={'Toy #,Col.#,Model Name,Series,Series #,Rarity\n001,1/250,"\'69 Camaro Z/28",HW Dream Garage,1/4,Mainline'}
                    className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder-stone-700 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => { setImportTarget(null); }}
                  >
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleParse} disabled={!csvText.trim()}>
                    Parse CSV
                  </Button>
                </div>
              </>
            )}

            {/* Parse results */}
            {parseResult && (
              <>
                {/* Summary */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-green-400">{parseResult.items.length}</div>
                    <div className="text-xs text-stone-400">valid rows</div>
                  </div>
                  {parseResult.errors.length > 0 && (
                    <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-red-400">{parseResult.errors.length}</div>
                      <div className="text-xs text-stone-400">errors</div>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 max-h-24 overflow-y-auto">
                    {parseResult.errors.map((err) => (
                      <p key={err.row} className="text-red-400 text-xs">{err.message}</p>
                    ))}
                  </div>
                )}

                {/* Preview table */}
                {parseResult.items.length > 0 && (
                  <div className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                    <p className="text-xs text-stone-500 px-3 py-2 border-b border-stone-700">
                      Preview (first {Math.min(5, parseResult.items.length)} of {parseResult.items.length} rows)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="text-stone-500 text-left border-b border-stone-700">
                            <th className="px-3 py-2">Toy #</th>
                            <th className="px-3 py-2">Col.#</th>
                            <th className="px-3 py-2">Model Name</th>
                            <th className="px-3 py-2">Series</th>
                            <th className="px-3 py-2">Ser.#</th>
                            <th className="px-3 py-2">Rarity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.items.slice(0, 5).map((item, i) => (
                            <tr key={i} className="border-b border-stone-800 hover:bg-stone-800/50">
                              <td className="px-3 py-1.5 font-mono text-stone-400">{item.toyNumber || '—'}</td>
                              <td className="px-3 py-1.5 font-mono text-stone-500">{item.collectorNumber || '—'}</td>
                              <td className="px-3 py-1.5 text-stone-200 font-medium">{item.modelName}</td>
                              <td className="px-3 py-1.5 text-stone-400">{item.seriesName}</td>
                              <td className="px-3 py-1.5 font-mono text-stone-500">{item.seriesNumber || '—'}</td>
                              <td className="px-3 py-1.5 text-stone-400">{item.rarityType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setParseResult(null)}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleImport}
                    disabled={parseResult.items.length === 0}
                  >
                    Import {parseResult.items.length} Items
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
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
