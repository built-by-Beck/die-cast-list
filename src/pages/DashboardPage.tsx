import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEffectivePlan } from '../lib/access';
import { MOCK_CARS, MOCK_CHECKLIST_PROGRESS } from '../data/mockData';
import { StatCard } from '../components/ui/Card';

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  path: string;
  accent?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '➕', label: 'Add New Car',     description: 'Log a car to your collection',    path: '/inventory/add', accent: true },
  { icon: '🚗', label: 'My Inventory',    description: 'Browse and manage your cars',      path: '/inventory' },
  { icon: '✅', label: 'Checklists',      description: 'Track set completion',             path: '/checklists' },
  { icon: '⭐', label: 'My Showcase',     description: 'Show off your best cars',          path: '/showcase' },
  { icon: '👤', label: 'My Profile',      description: 'Edit your collector profile',      path: '/profile' },
  { icon: '🔍', label: 'Wanted List',     description: 'Cars you\'re hunting for',         path: '/wanted' },
  { icon: '🏷️', label: 'For Sale / Trade', description: 'Manage duplicates',              path: '/for-sale-trade' },
  { icon: '⚙️', label: 'Settings',        description: 'Preferences & account',           path: '/settings' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userDoc } = useAuth();

  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';

  // Stats derived from mock data (Phase 3: replace with real Firestore queries)
  const cars = MOCK_CARS;
  const totalCars      = cars.length;
  const cardedCars     = cars.filter((c) => c.packageStatus === 'Carded').length;
  const looseCars      = cars.filter((c) => c.packageStatus === 'Loose').length;
  const treasureHunts  = cars.filter((c) => c.rarityType === 'Treasure Hunt').length;
  const superTHs       = cars.filter((c) => c.rarityType === 'Super Treasure Hunt').length;
  const estimatedValue = cars.reduce((sum, c) => sum + (c.estimatedValue ?? 0), 0);
  const duplicates     = cars.filter((c) => c.quantityOwned > 1).length;
  const forSaleTrade   = cars.filter((c) => c.isForSale || c.isForTrade).length;

  const progress = MOCK_CHECKLIST_PROGRESS;
  const bestProgress = progress.reduce((best, p) =>
    p.completedPercent > (best?.completedPercent ?? -1) ? p : best,
    null as typeof progress[0] | null
  );

  const planLabel = userDoc?.lifetimeAccess
    ? '⭐ Lifetime Premium'
    : effectivePlan === 'premium'
    ? '⭐ Premium'
    : effectivePlan === 'basic'
    ? 'Basic'
    : effectivePlan === 'free'
    ? 'Free'
    : 'No active plan';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="page-title mb-1">
            Welcome back, {userDoc?.displayName ?? 'Collector'}!
          </h1>
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <span className="bg-stone-700 px-2.5 py-0.5 rounded-full font-medium text-stone-300">
              {planLabel}
            </span>
            {userDoc?.lifetimeAccess && (
              <span className="text-amber-500 text-xs">Never expires</span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/inventory/add')}
          className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 font-bold px-5 py-3 rounded-xl text-base transition-all"
        >
          ➕ Add a Car
        </button>
      </div>

      {/* Collection Stats */}
      <section className="mb-10">
        <h2 className="section-title">Your Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon="🚗" label="Total Cars"           value={totalCars}    accent />
          <StatCard icon="📦" label="Carded"               value={cardedCars} />
          <StatCard icon="🔓" label="Loose"                value={looseCars} />
          <StatCard icon="🔥" label="Treasure Hunts"       value={treasureHunts} />
          <StatCard icon="⭐" label="Super THs"            value={superTHs} />
          <StatCard icon="💰" label="Est. Value"           value={`$${estimatedValue.toFixed(2)}`} />
          <StatCard icon="📋" label="Duplicates"           value={duplicates} />
          <StatCard icon="🏷️" label="For Sale / Trade"     value={forSaleTrade} />
        </div>

        {/* Checklist highlight */}
        {bestProgress && (
          <div
            className="mt-4 bg-stone-800 border border-stone-700 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-stone-500 transition-colors"
            onClick={() => navigate(`/checklists/${bestProgress.checklistId}`)}
          >
            <div className="text-3xl">✅</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-stone-300 truncate">{bestProgress.checklistName}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 bg-stone-700 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${bestProgress.completedPercent}%` }}
                  />
                </div>
                <span className="text-amber-400 text-sm font-bold whitespace-nowrap">
                  {bestProgress.ownedCount}/{bestProgress.totalCars}
                </span>
              </div>
            </div>
            <div className="text-stone-500 text-sm">→</div>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`rounded-2xl border p-5 text-left transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
                action.accent
                  ? 'bg-amber-500 border-amber-400 hover:bg-amber-400 text-stone-900'
                  : 'bg-stone-800 border-stone-700 hover:border-stone-500 text-stone-100'
              }`}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <div className={`font-bold text-base leading-tight ${action.accent ? 'text-stone-900' : 'text-stone-50'}`}>
                {action.label}
              </div>
              <div className={`text-sm mt-1 leading-snug ${action.accent ? 'text-stone-800' : 'text-stone-400'}`}>
                {action.description}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
