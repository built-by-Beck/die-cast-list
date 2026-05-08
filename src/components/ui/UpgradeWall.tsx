interface UpgradeWallProps {
  feature: string;
  requiredPlan: 'basic' | 'premium';
  description?: string;
}

const BASIC_LINK  = import.meta.env.VITE_STRIPE_BASIC_LINK  as string | undefined;
const PREMIUM_LINK = import.meta.env.VITE_STRIPE_PREMIUM_LINK as string | undefined;

export default function UpgradeWall({ feature, requiredPlan, description }: UpgradeWallProps) {
  const hasStripe = Boolean(BASIC_LINK && PREMIUM_LINK);

  const openBasic   = () => BASIC_LINK   && window.open(BASIC_LINK,   '_blank');
  const openPremium = () => PREMIUM_LINK && window.open(PREMIUM_LINK, '_blank');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-6xl mb-5">🔒</div>

      <h2 className="text-2xl font-bold text-stone-100 mb-2">
        {feature} requires {requiredPlan === 'premium' ? 'Pro' : 'Basic'}
      </h2>

      {description && (
        <p className="text-stone-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      )}

      {!hasStripe && (
        <p className="text-stone-600 text-sm mb-6">
          (Stripe not configured — payments unavailable in this environment)
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {requiredPlan === 'basic' ? (
          <>
            <button
              disabled={!hasStripe}
              onClick={openBasic}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-stone-900 font-bold px-5 py-3 rounded-xl transition-colors"
            >
              Upgrade to Basic — $7/mo
            </button>
            <button
              disabled={!hasStripe}
              onClick={openPremium}
              className="flex-1 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 disabled:opacity-40 text-stone-200 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              Go Pro — $22/mo
            </button>
          </>
        ) : (
          <button
            disabled={!hasStripe}
            onClick={openPremium}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-stone-900 font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Upgrade to Pro — $22/mo
          </button>
        )}
      </div>

      <p className="text-stone-600 text-xs mt-6 max-w-xs">
        After payment your account will be activated within 24 hours.
        <br />
        Already paid?{' '}
        <a href="mailto:support@diecastvault.app" className="text-amber-500 hover:underline">
          Contact support
        </a>
        .
      </p>
    </div>
  );
}
