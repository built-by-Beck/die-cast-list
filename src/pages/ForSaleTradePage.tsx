import { useNavigate } from 'react-router-dom';
import { MOCK_CARS } from '../data/mockData';
import { RarityBadge, PackageBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function ForSaleTradePage() {
  const navigate = useNavigate();

  const forSale  = MOCK_CARS.filter((c) => c.isForSale  && !c.archivedAt);
  const forTrade = MOCK_CARS.filter((c) => c.isForTrade && !c.archivedAt);

  return (
    <div className="page-container">
      <h1 className="page-title">For Sale &amp; Trade</h1>
      <p className="text-stone-400 mb-6">
        Manage the cars you want to sell or trade. Mark any car as "For Sale" or "For Trade"
        from its detail page.
      </p>

      {forSale.length === 0 && forTrade.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="Nothing for sale or trade yet"
          description="Open any car in your inventory and mark it as For Sale or For Trade to see it here."
          actionLabel="Go to Inventory"
          onAction={() => navigate('/inventory')}
        />
      ) : (
        <>
          {forSale.length > 0 && (
            <section className="mb-8">
              <h2 className="section-title">For Sale ({forSale.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {forSale.map((car) => (
                  <SaleTradeCard
                    key={car.id}
                    car={car}
                    type="sale"
                    onView={() => navigate(`/inventory/${car.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {forTrade.length > 0 && (
            <section>
              <h2 className="section-title">For Trade ({forTrade.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {forTrade.map((car) => (
                  <SaleTradeCard
                    key={car.id}
                    car={car}
                    type="trade"
                    onView={() => navigate(`/inventory/${car.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SaleTradeCard({
  car,
  type,
  onView,
}: {
  car: (typeof MOCK_CARS)[number];
  type: 'sale' | 'trade';
  onView: () => void;
}) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl p-4 flex gap-4 hover:border-stone-500 transition-colors">
      <div className="w-16 h-16 bg-stone-700 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
        🚗
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-stone-50 text-base leading-tight">{car.name}</h3>
        <p className="text-stone-400 text-sm mt-0.5">{car.brand} · {car.releaseYear}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <RarityBadge rarity={car.rarityType} />
          <PackageBadge status={car.packageStatus} />
        </div>
        {type === 'sale' && car.askingPrice != null && (
          <p className="text-green-400 font-bold text-sm mt-1.5">Asking ${car.askingPrice.toFixed(2)}</p>
        )}
        {type === 'trade' && car.tradeNotes && (
          <p className="text-stone-400 text-sm mt-1.5 line-clamp-2">{car.tradeNotes}</p>
        )}
        <Button size="sm" variant="secondary" className="mt-3" onClick={onView}>
          View Car
        </Button>
      </div>
    </div>
  );
}
