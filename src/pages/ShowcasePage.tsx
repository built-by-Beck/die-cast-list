import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEffectivePlan, getPlanLimits } from '../lib/access';
import { MOCK_CARS } from '../data/mockData';
import { RarityBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function ShowcasePage() {
  const navigate = useNavigate();
  const { userDoc } = useAuth();

  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'none';
  const limits = getPlanLimits(effectivePlan);
  const maxShowcase = limits.maxShowcaseCars;

  const showcaseCars = MOCK_CARS
    .filter((c) => c.isShowcase && !c.archivedAt)
    .sort((a, b) => (a.showcaseRank ?? 99) - (b.showcaseRank ?? 99))
    .slice(0, maxShowcase);

  const [editMode, setEditMode] = useState(false);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-1">My Showcase</h1>
          <p className="text-stone-400 text-sm">
            {showcaseCars.length} / {maxShowcase} spots filled
            {effectivePlan === 'basic' && (
              <span className="ml-2 text-amber-500 text-xs font-semibold">
                (Upgrade to Premium for Top 25)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              editMode
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
            }`}
          >
            {editMode ? '✓ Done Editing' : '✏️ Edit Showcase'}
          </button>
          <button
            onClick={() => navigate(`/showcase/${userDoc?.uid ?? 'me'}`)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-stone-700 hover:bg-stone-600 text-stone-300 transition-all"
          >
            🌐 Public View
          </button>
        </div>
      </div>

      {editMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 text-amber-300 text-sm">
          <strong>Edit Mode:</strong> Tap any car in your inventory to add it to the showcase, or drag to reorder.
          In Phase 5, showcase management will be fully interactive.
        </div>
      )}

      {showcaseCars.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="Your showcase is empty"
          description="Go to a car's detail page and turn on the Showcase toggle to feature it here."
          actionLabel="Browse My Inventory"
          onAction={() => navigate('/inventory')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {showcaseCars.map((car, idx) => (
            <div
              key={car.id}
              className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/inventory/${car.id}`)}
            >
              {/* Photo */}
              <div className="relative bg-stone-700 h-48 flex items-center justify-center">
                {car.primaryPhotoUrl ? (
                  <img src={car.primaryPhotoUrl} alt={car.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-7xl">🚗</div>
                )}
                {/* Rank badge */}
                <div className="absolute top-3 left-3 w-9 h-9 bg-amber-500 text-stone-900 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg">
                  {idx + 1}
                </div>
                <div className="absolute top-3 right-3">
                  <RarityBadge rarity={car.rarityType} />
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-stone-50 group-hover:text-amber-400 transition-colors leading-tight">
                  {car.name}
                </h3>
                <p className="text-stone-400 text-sm mt-0.5">{car.brand} · {car.releaseYear}</p>
                {car.estimatedValue != null && (
                  <p className="text-amber-400 text-sm font-bold mt-1">
                    Est. ${car.estimatedValue.toFixed(2)}
                  </p>
                )}
                {car.notes && (
                  <p className="text-stone-500 text-sm mt-2 leading-relaxed line-clamp-2">{car.notes}</p>
                )}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, Math.min(3, maxShowcase - showcaseCars.length)) }).map((_, i) => (
            <button
              key={`empty-${i}`}
              onClick={() => navigate('/inventory')}
              className="bg-stone-800/50 border-2 border-dashed border-stone-700 rounded-2xl h-48 flex flex-col items-center justify-center text-stone-600 hover:border-amber-500/40 hover:text-stone-400 transition-all"
            >
              <span className="text-3xl mb-2">➕</span>
              <span className="text-sm font-medium">Add a car</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
