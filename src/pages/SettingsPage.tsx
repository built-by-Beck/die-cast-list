import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEffectivePlan, getPlanLimits } from '../lib/access';
import Button from '../components/ui/Button';
import PlanImageCard from '../components/ui/PlanImageCard';
import basicPlanImage from '../../media/die-cast-vault-basic.png';
import proPlanImage from '../../media/die-cast-vault-pro.png';
import { formatCheckoutError, startStripeCheckout } from '../lib/billing';
import { firebaseApp } from '../lib/firebase';

export default function SettingsPage() {
  const { userDoc, logout } = useAuth();

  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';
  const limits = getPlanLimits(effectivePlan);

  const [simpleChecklistMode, setSimpleChecklistMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<'basic' | 'premium' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const canCheckout = Boolean(firebaseApp);

  const handleCheckout = async (plan: 'basic' | 'premium') => {
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      await startStripeCheckout(plan);
    } catch (e: unknown) {
      setCheckoutError(formatCheckoutError(e));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Phase 2: Save to Firestore users/{uid}/settings/main
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const planLabel = userDoc?.lifetimeAccess
    ? 'Lifetime Pro'
    : effectivePlan === 'premium' ? 'Pro'
    : effectivePlan === 'basic' ? 'Basic'
    : effectivePlan === 'free' ? 'Free'
    : 'No active plan';

  return (
    <div className="page-container max-w-3xl">
      <h1 className="page-title">Settings</h1>

      {success && (
        <div className="bg-green-700 text-white rounded-xl px-5 py-4 mb-6 text-base font-semibold text-center">
          ✓ Settings saved!
        </div>
      )}

      {/* Account info */}
      <section className="bg-stone-800 border border-stone-700 rounded-2xl p-6 mb-5">
        <h2 className="section-title">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-stone-400">Email</span>
            <span className="text-stone-200 font-medium">{userDoc?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-400">Plan</span>
            <span className="text-amber-400 font-bold">{planLabel}</span>
          </div>
          {userDoc?.lifetimeAccess && (
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Access Reason</span>
              <span className="text-stone-300 text-xs max-w-xs text-right">{userDoc.lifetimeAccessReason}</span>
            </div>
          )}
        </div>
      </section>

      {/* Plan limits */}
      <section className="bg-stone-800 border border-stone-700 rounded-2xl p-6 mb-5">
        <h2 className="section-title">Your Plan Limits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <PlanImageCard
            src={basicPlanImage}
            alt="Die Cast Vault Basic plan"
            label="Basic"
            highlighted={effectivePlan === 'basic'}
          />
          <PlanImageCard
            src={proPlanImage}
            alt="Die Cast Vault Pro plan"
            label="Pro"
            highlighted={effectivePlan === 'premium' || Boolean(userDoc?.lifetimeAccess)}
          />
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Max Cars',            value: limits.maxCars },
            { label: 'Photos per Car',      value: limits.maxPhotosPerCar },
            { label: 'Showcase Cars',       value: `Top ${limits.maxShowcaseCars}` },
            { label: 'Custom Checklists',   value: limits.maxCustomChecklists === 999_999 ? 'Unlimited' : limits.maxCustomChecklists },
            { label: 'Tracked Lists',       value: limits.maxTrackedLists },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-stone-400">{row.label}</span>
              <span className="text-stone-200 font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
        {checkoutError && (
          <p className="text-red-400 text-sm mt-3 text-center" role="alert">
            {checkoutError}
          </p>
        )}

        {(effectivePlan === 'free' || effectivePlan === 'none') && !userDoc?.lifetimeAccess && (
          <>
            <Button
              className="mt-4"
              fullWidth
              onClick={() => void handleCheckout('basic')}
              disabled={!canCheckout || checkoutLoading !== null}
              loading={checkoutLoading === 'basic'}
            >
              Upgrade to Basic — $7/mo
            </Button>
            <Button
              className="mt-2"
              variant="secondary"
              fullWidth
              onClick={() => void handleCheckout('premium')}
              disabled={!canCheckout || checkoutLoading !== null}
              loading={checkoutLoading === 'premium'}
            >
              Go Pro — $22/mo
            </Button>
          </>
        )}
        {effectivePlan === 'basic' && !userDoc?.lifetimeAccess && (
          <Button
            className="mt-4"
            fullWidth
            onClick={() => void handleCheckout('premium')}
            disabled={!canCheckout || checkoutLoading !== null}
            loading={checkoutLoading === 'premium'}
          >
            Upgrade to Pro — $22/mo
          </Button>
        )}
        {(effectivePlan === 'premium' || userDoc?.lifetimeAccess) && (
          <p className="text-green-400 text-sm text-center mt-4">
            You're on the highest plan. Thank you!
          </p>
        )}
      </section>

      {/* App settings */}
      <section className="bg-stone-800 border border-stone-700 rounded-2xl p-6 mb-5">
        <h2 className="section-title">App Preferences</h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <div
            className={`mt-0.5 w-12 h-6 rounded-full transition-all flex-shrink-0 ${
              simpleChecklistMode ? 'bg-amber-500' : 'bg-stone-600'
            }`}
            onClick={() => setSimpleChecklistMode(!simpleChecklistMode)}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
              simpleChecklistMode ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
            }`} />
          </div>
          <div>
            <span className="text-stone-200 font-semibold block">Simple Checklist Mode</span>
            <span className="text-stone-500 text-sm">
              Only show Have / Need / Duplicate buttons on checklists — hides less-used options.
            </span>
          </div>
        </label>

        <Button className="mt-5" fullWidth loading={saving} onClick={handleSave}>
          Save Settings
        </Button>
      </section>

      {/* Danger zone */}
      <section className="bg-stone-800 border border-red-900/40 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-red-400 mb-3">Account Actions</h2>
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="text-stone-500 hover:text-red-400" onClick={() => logout()}>
            Sign Out of This Device
          </Button>
        </div>
        <p className="text-stone-700 text-xs mt-3">
          To delete your account, contact support. Your data will be removed within 30 days.
        </p>
      </section>
    </div>
  );
}
