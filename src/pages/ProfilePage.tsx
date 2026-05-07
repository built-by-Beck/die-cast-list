import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BRANDS } from '../types';
import Button from '../components/ui/Button';

type ProfileForm = {
  displayName: string;
  bio: string;
  whyICollect: string;
  yearsCollecting: string;
  favoriteBrand: string;
  favoriteEra: string;
  favoriteCarType: string;
  location: string;
  publicProfileEnabled: boolean;
};

function sanitizeText(text: string): string {
  // Strip any HTML tags to prevent XSS in public text
  return text.replace(/<[^>]*>/g, '').slice(0, 1000);
}

export default function ProfilePage() {
  const { userDoc } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    displayName: userDoc?.displayName ?? '',
    bio: '',
    whyICollect: '',
    yearsCollecting: '',
    favoriteBrand: '',
    favoriteEra: '',
    favoriteCarType: '',
    location: '',
    publicProfileEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Phase 5: Save to Firestore here, with sanitized text
    const sanitized = {
      ...form,
      bio: sanitizeText(form.bio),
      whyICollect: sanitizeText(form.whyICollect),
    };
    console.log('Would save profile:', sanitized);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputClass = 'w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600';
  const labelClass = 'block text-sm font-semibold text-stone-300 mb-1.5';

  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title">My Profile</h1>

      {success && (
        <div className="bg-green-700 text-white rounded-xl px-5 py-4 mb-6 text-base font-semibold text-center">
          ✓ Profile saved!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile photo placeholder */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-stone-200 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-stone-700 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
              👤
            </div>
            <div>
              <p className="text-stone-400 text-sm">Photo upload coming in Phase 4.</p>
              <p className="text-stone-600 text-xs mt-1">You can also use a Google profile photo.</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-stone-200">About You</h2>

          <div>
            <label htmlFor="displayName" className={labelClass}>Display Name *</label>
            <input
              id="displayName" type="text" required maxLength={50}
              value={form.displayName} onChange={(e) => set('displayName', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>Location <span className="text-stone-600 font-normal">(optional)</span></label>
            <input
              id="location" type="text" maxLength={100}
              value={form.location} onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Columbus, Ohio"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="bio" className={labelClass}>Short Bio <span className="text-stone-600 font-normal">(no HTML)</span></label>
            <textarea
              id="bio" rows={3} maxLength={500}
              value={form.bio} onChange={(e) => set('bio', e.target.value)}
              placeholder="Tell other collectors a little about yourself..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-stone-600 text-xs mt-1">{form.bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="whyICollect" className={labelClass}>Why I Collect <span className="text-stone-600 font-normal">(no HTML)</span></label>
            <textarea
              id="whyICollect" rows={3} maxLength={500}
              value={form.whyICollect} onChange={(e) => set('whyICollect', e.target.value)}
              placeholder="What got you into collecting? What keeps you going?"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Collector details */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-stone-200">Collector Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yearsCollecting" className={labelClass}>Years Collecting</label>
              <input
                id="yearsCollecting" type="text" maxLength={20}
                value={form.yearsCollecting} onChange={(e) => set('yearsCollecting', e.target.value)}
                placeholder="e.g. 10, 25, 50+"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="favoriteBrand" className={labelClass}>Favorite Brand</label>
              <select
                id="favoriteBrand"
                value={form.favoriteBrand}
                onChange={(e) => set('favoriteBrand', e.target.value)}
                className={inputClass}
              >
                <option value="">— Select —</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="favoriteEra" className={labelClass}>Favorite Era</label>
              <input
                id="favoriteEra" type="text" maxLength={50}
                value={form.favoriteEra} onChange={(e) => set('favoriteEra', e.target.value)}
                placeholder="e.g. 1960s–70s muscle cars"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="favoriteCarType" className={labelClass}>Favorite Car Type</label>
              <input
                id="favoriteCarType" type="text" maxLength={50}
                value={form.favoriteCarType} onChange={(e) => set('favoriteCarType', e.target.value)}
                placeholder="e.g. American muscle"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-stone-200 mb-4">Privacy</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <div
              className={`mt-0.5 w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                form.publicProfileEnabled ? 'bg-amber-500' : 'bg-stone-600'
              }`}
              onClick={() => set('publicProfileEnabled', !form.publicProfileEnabled)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                form.publicProfileEnabled ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
              }`} />
            </div>
            <div>
              <span className="text-stone-200 font-semibold block">Public Profile</span>
              <span className="text-stone-500 text-sm">
                Allow others to view your profile and showcase at a public URL.
              </span>
            </div>
          </label>

          {form.publicProfileEnabled && (
            <div className="mt-3 bg-stone-900 rounded-xl px-4 py-3 text-stone-400 text-sm">
              Your public URL will be set when you save your profile. (Phase 5)
            </div>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth loading={saving}>
          Save Profile
        </Button>
      </form>
    </div>
  );
}
