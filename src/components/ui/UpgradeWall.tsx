import { useState } from 'react';
import PlanImageCard from './PlanImageCard';
import basicPlanImage from '../../../media/die-cast-vault-basic.png';
import proPlanImage from '../../../media/die-cast-vault-pro.png';
import { SUPPORT_EMAIL } from '../../lib/site';
import { formatCheckoutError, startStripeCheckout } from '../../lib/billing';
import { firebaseApp } from '../../lib/firebase';

interface UpgradeWallProps {
  feature: string;
  requiredPlan: 'basic' | 'premium';
  description?: string;
}

export default function UpgradeWall({ feature, requiredPlan, description }: UpgradeWallProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'basic' | 'premium' | null>(null);

  const canCheckout = Boolean(firebaseApp);

  const runCheckout = async (plan: 'basic' | 'premium') => {
    setError(null);
    setLoading(plan);
    try {
      await startStripeCheckout(plan);
    } catch (e: unknown) {
      setError(formatCheckoutError(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-6xl mb-5">🔒</div>

      <h2 className="text-2xl font-bold text-stone-100 mb-2">
        {feature} requires {requiredPlan === 'premium' ? 'Pro' : 'Basic'}
      </h2>

      {description && (
        <p className="text-stone-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      )}

      {!canCheckout && (
        <p className="text-stone-600 text-sm mb-6">
          (Billing unavailable — Firebase is not configured in this environment)
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4 max-w-md" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-5">
        <PlanImageCard
          src={basicPlanImage}
          alt="Die Cast Vault Basic plan"
          label="Basic"
          highlighted={requiredPlan === 'basic'}
        />
        <PlanImageCard
          src={proPlanImage}
          alt="Die Cast Vault Pro plan"
          label="Pro"
          highlighted={requiredPlan === 'premium'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {requiredPlan === 'basic' ? (
          <>
            <button
              type="button"
              disabled={!canCheckout || loading !== null}
              onClick={() => void runCheckout('basic')}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-stone-900 font-bold px-5 py-3 rounded-xl transition-colors"
            >
              {loading === 'basic' ? 'Opening checkout…' : 'Upgrade to Basic — $7/mo'}
            </button>
            <button
              type="button"
              disabled={!canCheckout || loading !== null}
              onClick={() => void runCheckout('premium')}
              className="flex-1 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 disabled:opacity-40 text-stone-200 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              {loading === 'premium' ? 'Opening checkout…' : 'Go Pro — $22/mo'}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={!canCheckout || loading !== null}
            onClick={() => void runCheckout('premium')}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-stone-900 font-bold px-5 py-3 rounded-xl transition-colors"
          >
            {loading === 'premium' ? 'Opening checkout…' : 'Upgrade to Pro — $22/mo'}
          </button>
        )}
      </div>

      <p className="text-stone-600 text-xs mt-6 max-w-xs">
        Your plan updates automatically after checkout.
        <br />
        Already paid?{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-500 hover:underline">
          Contact support
        </a>
        .
      </p>
    </div>
  );
}
