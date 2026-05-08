import { useAuth } from "../contexts/AuthContext";
import { getEffectivePlan } from "../lib/access";
import UpgradeWall from "../components/ui/UpgradeWall";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { docToMarketplaceIntent } from "../lib/firestoreConverters";
import type { MarketplaceIntent } from "../types";

export default function MarketplaceSearchPage() {
  const { userDoc } = useAuth();
  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : "free";
  const [rows, setRows] = useState<MarketplaceIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (effectivePlan !== "premium") {
    return (
      <UpgradeWall
        feature="Marketplace Search"
        requiredPlan="premium"
        description="Marketplace Search is a Pro feature. Upgrade to Pro to find collectors buying, selling, and trading the cars you need."
      />
    );
  }

  useEffect(() => {
    const q = query(
      collection(db, "marketplaceIntents"),
      where("isActive", "==", true),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => docToMarketplaceIntent(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (brandFilter !== "all" && row.brandId !== brandFilter) return false;
        if (yearFilter !== "all" && String(row.year) !== yearFilter)
          return false;
        if (listFilter !== "all" && row.listId !== listFilter) return false;
        if (seriesFilter !== "all" && row.seriesName !== seriesFilter)
          return false;
        if (intentFilter !== "all" && row.intentType !== intentFilter)
          return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            row.modelName.toLowerCase().includes(q) ||
            row.toyNumber.toLowerCase().includes(q) ||
            row.collectionNumber.toLowerCase().includes(q) ||
            row.seriesName.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [
      rows,
      brandFilter,
      yearFilter,
      listFilter,
      seriesFilter,
      intentFilter,
      search,
    ],
  );

  const years = useMemo(
    () => [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a),
    [rows],
  );
  const lists = useMemo(
    () => [...new Map(rows.map((r) => [r.listId, r.listTitle])).entries()],
    [rows],
  );
  const series = useMemo(
    () => [...new Set(rows.map((r) => r.seriesName).filter(Boolean))].sort(),
    [rows],
  );

  return (
    <div className="page-container">
      <h1 className="page-title mb-2">Marketplace Search</h1>
      <p className="text-stone-400 mb-4">
        Find collectors buying, selling, and trading specific cars through
        active public intents.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-4">
        <select
          aria-label="Filter by brand"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200"
        >
          <option value="all">All brands</option>
          <option value="hot-wheels">Hot Wheels</option>
          <option value="matchbox">Matchbox</option>
          <option value="m2-machines">M2 Machines</option>
          <option value="johnny-lightning">Johnny Lightning</option>
          <option value="greenlight">GreenLight</option>
          <option value="auto-world">Auto World</option>
          <option value="mini-gt">Mini GT</option>
        </select>
        <select
          aria-label="Filter by year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200"
        >
          <option value="all">All years</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by list"
          value={listFilter}
          onChange={(e) => setListFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200"
        >
          <option value="all">All lists</option>
          {lists.map(([listId, listTitle]) => (
            <option key={listId} value={listId}>
              {listTitle}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by series"
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200"
        >
          <option value="all">All series</option>
          {series.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by intent type"
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200"
        >
          <option value="all">All intents</option>
          <option value="looking_to_buy">Looking to buy</option>
          <option value="looking_to_trade_for">Looking to trade for</option>
          <option value="available_for_sale">Available for sale</option>
          <option value="available_for_trade">Available for trade</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search model, toy #, collection #, series"
          className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-500"
        />
      </div>

      {loading ? (
        <p className="text-stone-400">Loading marketplace intents...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-700 bg-stone-800 p-6 text-stone-400">
          No active public intents matched your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-stone-700 bg-stone-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-100">
                    {row.modelName}
                  </p>
                  <p className="text-xs text-stone-500">
                    {row.seriesName || "—"} · Toy #{row.toyNumber || "—"} ·
                    Col.#{row.collectionNumber || "—"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {row.listTitle} · {row.year}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Collector: {row.memberDisplayName}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-300">
                  {row.intentType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-400">
                <span>Qty: {row.quantity}</span>
                <button className="rounded-lg bg-stone-700 px-2 py-1 text-stone-200">
                  Message (coming soon)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
