import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { RarityBadge, PackageBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { fetchCarById, useInventory } from '../hooks/useInventory';
import type { Car } from '../types';

export default function CarDetailPage() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { archiveCar } = useInventory();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!carId) return;

    if (!user) return;

    fetchCarById(user.uid, carId)
      .then((found) => {
        setCar(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [carId, user?.uid]);

  const handleArchive = async () => {
    if (!carId) return;
    setArchiving(true);
    try {
      await archiveCar(carId);
      navigate('/inventory');
    } catch {
      setArchiving(false);
      setShowArchive(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">🚗</div>
          <p className="text-stone-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="page-container text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-stone-200 mb-3">Car not found</h1>
        <p className="text-stone-400 mb-6">This car may have been archived or doesn't exist.</p>
        <Button onClick={() => navigate('/inventory')}>Back to Inventory</Button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-5">
        <Link to="/inventory" className="hover:text-stone-300 transition-colors">Inventory</Link>
        <span>›</span>
        <span className="text-stone-400 truncate">{car.name}</span>
      </div>

      {/* Photo gallery placeholder */}
      <div className="bg-stone-700 rounded-2xl h-56 sm:h-72 flex items-center justify-center mb-6 relative overflow-hidden">
        {car.primaryPhotoUrl ? (
          <img src={car.primaryPhotoUrl} alt={car.name} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center">
            <div className="text-8xl mb-2">🚗</div>
            <p className="text-stone-500 text-sm">No photo yet</p>
          </div>
        )}
        {car.isFavorite && (
          <div className="absolute top-3 right-3 text-amber-400 text-2xl">★</div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-stone-50 leading-tight">{car.name}</h1>
          <p className="text-stone-400 text-lg mt-1">{car.brand} · {car.releaseYear}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 pt-1">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/inventory/${car.id}/edit`)}>
            ✏️ Edit
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <RarityBadge rarity={car.rarityType} />
        <PackageBadge status={car.packageStatus} />
        {car.quantityOwned > 1 && (
          <span className="text-xs bg-rose-700 text-white px-2 py-0.5 rounded-full font-bold uppercase">
            ×{car.quantityOwned} Owned
          </span>
        )}
        {car.isShowcase && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/30">
            ⭐ Showcase #{car.showcaseRank}
          </span>
        )}
        {car.isForSale && (
          <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded-full font-bold uppercase">
            For Sale
          </span>
        )}
        {car.isForTrade && (
          <span className="text-xs bg-blue-700 text-white px-2 py-0.5 rounded-full font-bold uppercase">
            For Trade
          </span>
        )}
        {!car.publicVisible && (
          <span className="text-xs bg-stone-600 text-stone-300 px-2 py-0.5 rounded-full font-bold uppercase">
            🔒 Private
          </span>
        )}
      </div>

      {/* Info sections */}
      <div className="space-y-4">
        <InfoSection title="Car Details">
          <InfoRow label="Series / Set" value={car.series || car.setName || '—'} />
          <InfoRow label="Color" value={car.color || '—'} />
          <InfoRow label="Condition" value={car.condition} />
          <InfoRow label="Scale" value={car.scale || '—'} />
          <InfoRow label="Manufacturer" value={car.manufacturer || '—'} />
        </InfoSection>

        {car.notes && (
          <InfoSection title="Collector Notes">
            <p className="text-stone-300 leading-relaxed">{car.notes}</p>
          </InfoSection>
        )}

        <InfoSection title="Purchase & Value">
          <InfoRow
            label="Purchase Price"
            value={car.purchasePrice != null ? `$${car.purchasePrice.toFixed(2)}` : '—'}
          />
          <InfoRow
            label="Estimated Value"
            value={car.estimatedValue != null ? `$${car.estimatedValue.toFixed(2)}` : '—'}
            accent={car.estimatedValue != null}
          />
        </InfoSection>

        {car.storageLocation && (
          <InfoSection title="Storage">
            <InfoRow label="Location" value={car.storageLocation} />
          </InfoSection>
        )}

        {(car.isForSale || car.isForTrade) && (
          <InfoSection title="Sale / Trade Status">
            {car.isForSale && (
              <InfoRow
                label="For Sale"
                value={car.askingPrice != null ? `Asking $${car.askingPrice.toFixed(2)}` : 'Yes'}
                accent
              />
            )}
            {car.isForTrade && (
              <InfoRow label="For Trade" value={car.tradeNotes || 'Yes'} />
            )}
          </InfoSection>
        )}

        {car.sourceChecklistId && (
          <InfoSection title="Checklist">
            <p className="text-stone-400 text-sm">
              Added from a checklist.{' '}
              <Link to={`/checklists/${car.sourceChecklistId}`} className="text-amber-400 hover:underline">
                View Checklist →
              </Link>
            </p>
          </InfoSection>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-stone-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchive(true)}
          className="text-stone-500 hover:text-red-400"
        >
          Archive this car
        </Button>
        <p className="text-stone-600 text-xs mt-1">
          Archiving removes it from your main inventory but keeps the record.
        </p>
      </div>

      <ConfirmModal
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={handleArchive}
        title="Archive This Car?"
        message={`"${car.name}" will be removed from your active inventory but kept in your records. You can restore it later.`}
        confirmLabel="Archive It"
        confirmVariant="danger"
        loading={archiving}
      />
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-stone-400 text-sm flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${accent ? 'text-amber-400 font-bold' : 'text-stone-200'}`}>
        {value}
      </span>
    </div>
  );
}
