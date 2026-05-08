import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  useTrackedLists,
  useUserChecklistSummaries,
} from "../hooks/useChecklistsFirestore";
import { useInventory } from "../hooks/useInventory";
import { getEffectivePlan } from "../lib/access";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const { trackedLists } = useTrackedLists(user?.uid);
  const { byChecklistId } = useUserChecklistSummaries(user?.uid);
  const { cars } = useInventory();
  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : "free";

  const totals = useMemo(() => {
    const all = Object.values(byChecklistId);
    const owned = all.reduce((sum, row) => sum + row.ownedCount, 0);
    const needed = all.reduce((sum, row) => sum + row.neededCount, 0);
    const duplicates = all.reduce(
      (sum, row) => sum + row.totalDuplicateCount,
      0,
    );
    const percent =
      all.length === 0
        ? 0
        : Math.round(
            all.reduce((sum, row) => sum + row.completedPercent, 0) /
              all.length,
          );
    return { owned, needed, duplicates, percent };
  }, [byChecklistId]);

  return (
    <div className="page-container">
      <h1 className="page-title mb-5">My Vault Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-5">
        {[
          { label: "Total owned cars", value: totals.owned },
          { label: "Total needed cars", value: totals.needed },
          { label: "Total duplicates", value: totals.duplicates },
          { label: "Active tracked lists", value: trackedLists.length },
          { label: "Completion", value: `${totals.percent}%` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-700 bg-stone-800 p-4"
          >
            <p className="text-xs text-stone-500">{card.label}</p>
            <p className="text-2xl font-bold text-stone-100 mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => navigate("/choose-lists")}
          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-stone-900"
        >
          Choose More Lists
        </button>
        <button
          onClick={() => navigate("/inventory")}
          className="rounded-xl bg-stone-700 px-4 py-3 text-sm font-semibold text-stone-200"
        >
          Open My Vault
        </button>
        <button
          onClick={() => navigate("/marketplace-search")}
          className="rounded-xl bg-stone-700 px-4 py-3 text-sm font-semibold text-stone-200"
        >
          Marketplace Search
        </button>
        {effectivePlan !== "premium" && (
          <button
            onClick={() => navigate("/settings")}
            className="rounded-xl bg-stone-700 px-4 py-3 text-sm font-semibold text-stone-200"
          >
            Upgrade to Pro
          </button>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
          Tracked Lists
        </h2>
        {trackedLists.length === 0 ? (
          <div className="rounded-2xl border border-stone-700 bg-stone-800 p-4 text-sm text-stone-400">
            No tracked lists yet. Choose lists to start tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {trackedLists.slice(0, 5).map((list) => {
              const progress = byChecklistId[list.listId];
              return (
                <div
                  key={list.id}
                  className="rounded-2xl border border-stone-700 bg-stone-800 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-100">
                        {list.listTitle}
                      </p>
                      <p className="text-xs text-stone-500">
                        {list.brandName} · {list.year}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-amber-400">
                      {progress?.completedPercent ?? 0}%
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-700">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${progress?.completedPercent ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
          Recently Updated Cars
        </h2>
        {cars.length === 0 ? (
          <div className="rounded-2xl border border-stone-700 bg-stone-800 p-4 text-sm text-stone-400">
            No inventory cars yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cars.slice(0, 6).map((car) => (
              <button
                key={car.id}
                onClick={() => navigate(`/inventory/${car.id}`)}
                className="rounded-2xl border border-stone-700 bg-stone-800 p-3 text-left"
              >
                <p className="font-semibold text-stone-100 truncate">
                  {car.name}
                </p>
                <p className="text-xs text-stone-500">
                  {car.brand} · {car.releaseYear}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
