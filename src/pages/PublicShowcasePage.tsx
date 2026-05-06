import { useParams, Link } from 'react-router-dom';
import { MOCK_CARS, MOCK_USER_DOC, MOCK_USER_PROFILE } from '../data/mockData';
import { RarityBadge } from '../components/ui/Badge';

export default function PublicShowcasePage() {
  const { userId } = useParams<{ userId: string }>();

  // Phase 5: Fetch from Firestore using userId
  const isKeiths = userId === MOCK_USER_DOC.uid || userId === 'me';
  const profile = isKeiths ? MOCK_USER_PROFILE : null;
  const owner = isKeiths ? MOCK_USER_DOC : null;

  if (!profile?.publicProfileEnabled && !isKeiths) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-stone-200 mb-2">This showcase is private</h1>
          <p className="text-stone-400">The collector hasn't made their showcase public yet.</p>
          <Link to="/" className="text-amber-400 hover:underline mt-4 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  const showcaseCars = MOCK_CARS
    .filter((c) => c.isShowcase && c.publicVisible)
    .sort((a, b) => (a.showcaseRank ?? 99) - (b.showcaseRank ?? 99));

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Header */}
      <div className="bg-stone-800 border-b border-stone-700 py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-50">{owner?.displayName ?? 'Collector'}'s Showcase</h1>
            {profile?.location && <p className="text-stone-400 text-sm">{profile.location}</p>}
          </div>
          <div className="ml-auto">
            <Link to={`/p/${profile?.publicProfileSlug ?? ''}`} className="text-amber-400 hover:underline text-sm">
              View Full Profile →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-stone-300 mb-6">
          Top {showcaseCars.length} Cars
        </h2>

        {showcaseCars.length === 0 ? (
          <div className="text-center py-16 text-stone-500">No showcase cars yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {showcaseCars.map((car, idx) => (
              <div key={car.id} className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
                <div className="relative bg-stone-700 h-48 flex items-center justify-center">
                  <div className="text-7xl">🚗</div>
                  <div className="absolute top-3 left-3 w-9 h-9 bg-amber-500 text-stone-900 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg">
                    {idx + 1}
                  </div>
                  <div className="absolute top-3 right-3">
                    <RarityBadge rarity={car.rarityType} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-stone-50 leading-tight">{car.name}</h3>
                  <p className="text-stone-400 text-sm mt-0.5">{car.brand} · {car.releaseYear}</p>
                  {car.notes && (
                    <p className="text-stone-400 text-sm mt-2 leading-relaxed line-clamp-3">{car.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12 pt-8 border-t border-stone-800">
          <p className="text-stone-600 text-sm">
            Powered by{' '}
            <Link to="/" className="text-amber-500 hover:underline font-semibold">Collector's Garage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
