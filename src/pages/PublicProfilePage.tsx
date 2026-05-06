import { useParams, Link } from 'react-router-dom';
import { MOCK_USER_DOC, MOCK_USER_PROFILE, MOCK_CARS } from '../data/mockData';
import { RarityBadge } from '../components/ui/Badge';

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  // Phase 5: Look up user by publicProfileSlug from Firestore
  const isKeith = slug === MOCK_USER_PROFILE.publicProfileSlug;
  const profile = isKeith ? MOCK_USER_PROFILE : null;
  const owner = isKeith ? MOCK_USER_DOC : null;

  if (!profile || !profile.publicProfileEnabled) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-stone-200 mb-2">Profile not found</h1>
          <p className="text-stone-400">This collector profile is private or doesn't exist.</p>
          <Link to="/" className="text-amber-400 hover:underline mt-4 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  const showcaseCars = MOCK_CARS
    .filter((c) => c.isShowcase && c.publicVisible)
    .sort((a, b) => (a.showcaseRank ?? 99) - (b.showcaseRank ?? 99))
    .slice(0, 4);

  const totalCars = MOCK_CARS.filter((c) => !c.archivedAt).length;
  const thCount   = MOCK_CARS.filter((c) => c.rarityType === 'Treasure Hunt').length;
  const sthCount  = MOCK_CARS.filter((c) => c.rarityType === 'Super Treasure Hunt').length;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Hero / Profile header */}
      <div className="bg-stone-800 border-b border-stone-700 py-10 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 bg-stone-700 rounded-full flex items-center justify-center text-5xl flex-shrink-0">
            👤
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-stone-50">{owner?.displayName}</h1>
            {profile.location && <p className="text-stone-400 mt-1">📍 {profile.location}</p>}
            {profile.yearsCollecting && (
              <p className="text-stone-500 text-sm mt-0.5">Collecting for {profile.yearsCollecting} years</p>
            )}
            {profile.bio && (
              <p className="text-stone-300 mt-3 max-w-xl leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Why I Collect */}
        {profile.whyICollect && (
          <section>
            <h2 className="text-xl font-bold text-stone-200 mb-3">Why I Collect</h2>
            <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5">
              <p className="text-stone-300 leading-relaxed">{profile.whyICollect}</p>
            </div>
          </section>
        )}

        {/* Collector details */}
        <section>
          <h2 className="text-xl font-bold text-stone-200 mb-3">About This Collection</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Favorite Brand',    value: profile.favoriteBrand },
              { label: 'Favorite Era',      value: profile.favoriteEra },
              { label: 'Favorite Car Type', value: profile.favoriteCarType },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label} className="bg-stone-800 border border-stone-700 rounded-2xl p-4">
                <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">{row.label}</div>
                <div className="text-stone-200 font-semibold">{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold text-stone-200 mb-3">Collection Stats</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{totalCars}</div>
              <div className="text-stone-500 text-sm mt-1">Total Cars</div>
            </div>
            <div className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">{thCount}</div>
              <div className="text-stone-500 text-sm mt-1">Treasure Hunts</div>
            </div>
            <div className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{sthCount}</div>
              <div className="text-stone-500 text-sm mt-1">Super THs</div>
            </div>
          </div>
        </section>

        {/* Showcase preview */}
        {showcaseCars.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-stone-200">Showcase</h2>
              <Link to={`/showcase/${owner?.uid}`} className="text-amber-400 hover:underline text-sm">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showcaseCars.map((car, idx) => (
                <div key={car.id} className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
                  <div className="relative bg-stone-700 h-28 flex items-center justify-center text-4xl">
                    🚗
                    <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500 text-stone-900 rounded-full flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-stone-200 text-xs font-semibold leading-tight truncate">{car.name}</p>
                    <RarityBadge rarity={car.rarityType} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="text-center py-8 text-stone-600 text-sm border-t border-stone-800 mt-4">
        Powered by{' '}
        <Link to="/" className="text-amber-500 hover:underline font-semibold">Collector's Garage</Link>
      </footer>
    </div>
  );
}
