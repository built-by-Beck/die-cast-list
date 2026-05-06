import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MOCK_CARS } from '../data/mockData';
import {
  BRANDS, PACKAGE_STATUSES, CONDITIONS, RARITY_TYPES, DUPLICATE_STATUSES,
  type Brand, type PackageStatus, type Condition, type RarityType, type DuplicateStatus,
} from '../types';
import Button from '../components/ui/Button';

interface CarFormData {
  name: string;
  brand: Brand;
  releaseYear: string;
  series: string;
  color: string;
  packageStatus: PackageStatus;
  condition: Condition;
  quantityOwned: string;
  notes: string;
  // More Details
  manufacturer: string;
  scale: string;
  rarityType: RarityType;
  storageLocation: string;
  purchasePrice: string;
  estimatedValue: string;
  duplicateStatus: DuplicateStatus | '';
  isFavorite: boolean;
  isShowcase: boolean;
  showcaseRank: string;
  isForSale: boolean;
  askingPrice: string;
  isForTrade: boolean;
  tradeNotes: string;
  isWanted: boolean;
  publicVisible: boolean;
}

const DEFAULT_FORM: CarFormData = {
  name: '',
  brand: 'Hot Wheels',
  releaseYear: String(new Date().getFullYear()),
  series: '',
  color: '',
  packageStatus: 'Carded',
  condition: 'Mint carded',
  quantityOwned: '1',
  notes: '',
  manufacturer: '',
  scale: '1:64',
  rarityType: 'Mainline',
  storageLocation: '',
  purchasePrice: '',
  estimatedValue: '',
  duplicateStatus: '',
  isFavorite: false,
  isShowcase: false,
  showcaseRank: '',
  isForSale: false,
  askingPrice: '',
  isForTrade: false,
  tradeNotes: '',
  isWanted: false,
  publicVisible: true,
};

function carToForm(car: (typeof MOCK_CARS)[number]): CarFormData {
  return {
    name: car.name,
    brand: car.brand,
    releaseYear: String(car.releaseYear),
    series: car.series,
    color: car.color,
    packageStatus: car.packageStatus,
    condition: car.condition,
    quantityOwned: String(car.quantityOwned),
    notes: car.notes,
    manufacturer: car.manufacturer,
    scale: car.scale,
    rarityType: car.rarityType,
    storageLocation: car.storageLocation,
    purchasePrice: car.purchasePrice != null ? String(car.purchasePrice) : '',
    estimatedValue: car.estimatedValue != null ? String(car.estimatedValue) : '',
    duplicateStatus: car.duplicateStatus ?? '',
    isFavorite: car.isFavorite,
    isShowcase: car.isShowcase,
    showcaseRank: car.showcaseRank != null ? String(car.showcaseRank) : '',
    isForSale: car.isForSale,
    askingPrice: car.askingPrice != null ? String(car.askingPrice) : '',
    isForTrade: car.isForTrade,
    tradeNotes: car.tradeNotes,
    isWanted: car.isWanted,
    publicVisible: car.publicVisible,
  };
}

export default function AddEditCarPage() {
  const navigate = useNavigate();
  const { carId } = useParams<{ carId: string }>();
  const isEdit = Boolean(carId);

  const existingCar = isEdit ? MOCK_CARS.find((c) => c.id === carId) : undefined;

  const [form, setForm] = useState<CarFormData>(
    existingCar ? carToForm(existingCar) : DEFAULT_FORM
  );
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof CarFormData>(key: K, value: CarFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Phase 3: Save to Firestore here
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => navigate('/inventory'), 1200);
  };

  const inputClass =
    'w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600';
  const labelClass = 'block text-sm font-semibold text-stone-300 mb-1.5';
  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-stone-400 hover:text-stone-200 text-2xl transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="page-title mb-0">
          {isEdit ? `Edit: ${existingCar?.name ?? 'Car'}` : 'Add a Car'}
        </h1>
      </div>

      {success && (
        <div className="bg-green-700 text-white rounded-xl px-5 py-4 mb-6 text-base font-semibold text-center">
          🎉 {isEdit ? 'Changes saved!' : 'Car added to your garage!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-stone-200 mb-1">Basic Info</h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>Car Name / Model *</label>
            <input
              id="name" type="text" required
              value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. '69 Camaro Z/28"
              className={inputClass}
            />
          </div>

          {/* Brand + Year */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className={labelClass}>Brand *</label>
              <select id="brand" value={form.brand} onChange={(e) => set('brand', e.target.value as Brand)} className={selectClass}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="releaseYear" className={labelClass}>Year Released *</label>
              <input
                id="releaseYear" type="number" required
                min="1950" max={new Date().getFullYear() + 2}
                value={form.releaseYear} onChange={(e) => set('releaseYear', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Series + Color */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="series" className={labelClass}>Series / Set</label>
              <input
                id="series" type="text"
                value={form.series} onChange={(e) => set('series', e.target.value)}
                placeholder="e.g. Car Culture"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="color" className={labelClass}>Color</label>
              <input
                id="color" type="text"
                value={form.color} onChange={(e) => set('color', e.target.value)}
                placeholder="e.g. Grabber Blue"
                className={inputClass}
              />
            </div>
          </div>

          {/* Package + Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="packageStatus" className={labelClass}>Package Status *</label>
              <select id="packageStatus" value={form.packageStatus} onChange={(e) => set('packageStatus', e.target.value as PackageStatus)} className={selectClass}>
                {PACKAGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="condition" className={labelClass}>Condition *</label>
              <select id="condition" value={form.condition} onChange={(e) => set('condition', e.target.value as Condition)} className={selectClass}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="max-w-xs">
            <label htmlFor="quantityOwned" className={labelClass}>Quantity Owned *</label>
            <input
              id="quantityOwned" type="number" required
              min="1" max="999"
              value={form.quantityOwned} onChange={(e) => set('quantityOwned', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className={labelClass}>Notes</label>
            <textarea
              id="notes" rows={3}
              value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Where you found it, what makes it special, etc."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* More Details toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="w-full bg-stone-800 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 rounded-2xl py-4 px-6 text-base font-semibold transition-all flex items-center justify-between"
        >
          <span>{showMore ? '▲ Hide Details' : '▼ More Details'}</span>
          <span className="text-stone-600 text-sm font-normal">Rarity, value, sale status, storage...</span>
        </button>

        {showMore && (
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-stone-200 mb-1">More Details</h2>

            {/* Manufacturer + Scale */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="manufacturer" className={labelClass}>Manufacturer</label>
                <input
                  id="manufacturer" type="text"
                  value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)}
                  placeholder="e.g. Mattel"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="scale" className={labelClass}>Scale</label>
                <input
                  id="scale" type="text"
                  value={form.scale} onChange={(e) => set('scale', e.target.value)}
                  placeholder="e.g. 1:64"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Rarity + Storage */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rarityType" className={labelClass}>Rarity Type</label>
                <select id="rarityType" value={form.rarityType} onChange={(e) => set('rarityType', e.target.value as RarityType)} className={selectClass}>
                  {RARITY_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="storageLocation" className={labelClass}>Storage Location</label>
                <input
                  id="storageLocation" type="text"
                  value={form.storageLocation} onChange={(e) => set('storageLocation', e.target.value)}
                  placeholder="e.g. Shelf A, Bin 3"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Purchase + Value */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchasePrice" className={labelClass}>Purchase Price ($)</label>
                <input
                  id="purchasePrice" type="number" step="0.01" min="0"
                  value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)}
                  placeholder="1.29"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="estimatedValue" className={labelClass}>Estimated Value ($)</label>
                <input
                  id="estimatedValue" type="number" step="0.01" min="0"
                  value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)}
                  placeholder="8.00"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Duplicate status */}
            {Number(form.quantityOwned) > 1 && (
              <div>
                <label htmlFor="duplicateStatus" className={labelClass}>Duplicate Status</label>
                <select id="duplicateStatus" value={form.duplicateStatus} onChange={(e) => set('duplicateStatus', e.target.value as DuplicateStatus | '')} className={selectClass}>
                  <option value="">— Select —</option>
                  {DUPLICATE_STATUSES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Status Toggles</h3>

              {([
                ['isFavorite',  '★ Mark as Favorite'],
                ['isShowcase',  '⭐ Include in Showcase'],
                ['isWanted',    '🔍 Mark as Wanted'],
                ['isForSale',   '🏷️ Mark For Sale'],
                ['isForTrade',  '🔄 Mark For Trade'],
                ['publicVisible', '🌐 Public Visibility'],
              ] as [keyof CarFormData, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                      form[key] ? 'bg-amber-500' : 'bg-stone-600'
                    }`}
                    onClick={() => set(key, !form[key] as CarFormData[typeof key])}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                      form[key] ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <span className="text-stone-300 group-hover:text-stone-100 transition-colors">{label}</span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked as CarFormData[typeof key])}
                  />
                </label>
              ))}
            </div>

            {/* For sale price */}
            {form.isForSale && (
              <div>
                <label htmlFor="askingPrice" className={labelClass}>Asking Price ($)</label>
                <input
                  id="askingPrice" type="number" step="0.01" min="0"
                  value={form.askingPrice} onChange={(e) => set('askingPrice', e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Trade notes */}
            {form.isForTrade && (
              <div>
                <label htmlFor="tradeNotes" className={labelClass}>Trade Notes</label>
                <textarea
                  id="tradeNotes" rows={2}
                  value={form.tradeNotes} onChange={(e) => set('tradeNotes', e.target.value)}
                  placeholder="What you're looking for in trade..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}

            {/* Showcase rank */}
            {form.isShowcase && (
              <div className="max-w-xs">
                <label htmlFor="showcaseRank" className={labelClass}>Showcase Rank</label>
                <input
                  id="showcaseRank" type="number" min="1" max="25"
                  value={form.showcaseRank} onChange={(e) => set('showcaseRank', e.target.value)}
                  placeholder="1 = top spot"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}

        {/* Photo upload placeholder */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-stone-200 mb-3">Photos</h2>
          <div className="border-2 border-dashed border-stone-600 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-stone-400 font-medium">Photo upload coming in Phase 4</p>
            <p className="text-stone-600 text-sm mt-1">You'll be able to add up to 5 photos per car</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={saving} className="flex-1">
            {isEdit ? 'Save Changes' : 'Add to My Garage'}
          </Button>
        </div>
      </form>
    </div>
  );
}
