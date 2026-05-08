import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEffectivePlan, getPlanLimits } from '../lib/access';
import { RarityBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import UpgradeWall from '../components/ui/UpgradeWall';
import { useInventory } from '../hooks/useInventory';

export default function ShowcasePage() {
  const navigate = useNavigate();
  const { userDoc, user } = useAuth();
  const { cars, loading } = useInventory();

  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';
  const limits = getPlanLimits(effectivePlan);
  const maxShowcase = limits.maxShowcaseCars;

  if (effectivePlan === 'free' || effectivePlan === 'none') {
    return (
      <UpgradeWall
        feature="Showcase"
        requiredPlan="basic"
        description="Show off your Top 10 to other collectors. Upgrade to Pro for a Top 25 showcase."
      />
    );
  }

  const showcaseCars = cars
    .filter((c) => c.isShowcase && !c.archivedAt)
    .sort((a, b) => (a.showcaseRank ?? 99) - (b.showcaseRank ?? 99))
    .slice(0, maxShowcase);

  const [editMode, setEditMode] = useState(false);

  if (loading || !user) {
    return (
      <div className="page-container">
        <h1 className="page-title mb-1">My Showcase</h1>
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-1">My Showcase</h1>
          <p className="text-stone-400 text-sm">
            {showcaseCars.length} / {maxShowcase} spots filled
            {effectivePlan === 'basic' && (
              <span className="ml-2 text-amber-500 text-xs font-semibold">
                (Upgrade to Pro for Top 25)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
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
            type="button"
            onClick={() => navigate(`/showcase/${user.uid}`)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-stone-700 hover:bg-stone-600 text-stone-300 transition-all"
          >
            🌐 Public View
          </button>
        </div>
      </div>

      {editMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 text-amber-300 text-sm">
          <strong>Edit Mode:</strong> Open a car in your inventory and use the Showcase toggle to add or remove it from your showcase rank.
          Drag-and-drop reordering can be added in a future update.
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
              <div className="relative bg-stone-700 h-48 flex items-center justify-center">
                {car.primaryPhotoUrl ? (
                  <img src={car.primaryPhotoUrl} alt={car.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-7xl">🚗</div>
                )}
                <div className="absolute top-3 left-3 w-9 h-9 bg-amber-500 text-stone-900 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg">
                  {idx + 1}
                </div>
                <div className="absolute top-3 right-3">
                  <RarityBadge rarity={car.rarityType} />
                </div>
              </div>

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

          {Array.from({ length: Math.max(0, Math.min(3, maxShowcase - showcaseCars.length)) }).map((_, i) => (
            <button
              type="button"
              key={`empty-${String(i)}`}
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
