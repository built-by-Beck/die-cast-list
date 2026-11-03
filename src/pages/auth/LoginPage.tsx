import { useState, useEffect, type FormEvent } from 'react';
import { SITE_NAME } from '../../lib/site';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import collectorShelfImage from '../../../media/keith-diecast-hero.png';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Button from '../../components/ui/Button';
import {
  CHECKOUT_ENABLED,
  checkoutPlanLabel,
  formatCheckoutError,
  parseCheckoutPlan,
  startStripeCheckout,
  stashPendingCheckoutPlan,
  takePendingCheckoutPlan,
  type CheckoutPlan,
} from '../../lib/billing';

type Mode = 'signin' | 'register';

const FIREBASE_CONFIGURED = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with that email or password.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email — sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

async function bootstrapUserDoc(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // already bootstrapped (e.g. returning Google user)
  await setDoc(ref, {
    uid,
    email,
    displayName,
    photoURL,
    role: 'user',
    plan: 'none',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    lifetimeAccess: false,
    lifetimeAccessReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('signin');
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
    const plan = parseCheckoutPlan(searchParams.get('plan'));
    if (CHECKOUT_ENABLED && plan) setSelectedPlan(plan);
  }, [searchParams]);

  const completeAuthFlow = async () => {
    const plan = selectedPlan ?? takePendingCheckoutPlan();
    if (CHECKOUT_ENABLED && plan) {
      try {
        await startStripeCheckout(plan);
        return;
      } catch (err: unknown) {
        setError(formatCheckoutError(err));
        navigate('/dashboard');
        return;
      }
    }
    navigate('/dashboard');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await bootstrapUserDoc(result.user.uid, result.user.email!, displayName, null);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await completeAuthFlow();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg = getAuthErrorMessage(code);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      if (selectedPlan) stashPendingCheckoutPlan(selectedPlan);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const u = result.user;
      await bootstrapUserDoc(u.uid, u.email!, u.displayName ?? '', u.photoURL);
      await completeAuthFlow();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg = getAuthErrorMessage(code);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address above first.'); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getAuthErrorMessage(code) || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Dev mode — no Firebase env configured
  if (!FIREBASE_CONFIGURED) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🏎️</div>
          <h1 className="text-2xl font-bold text-stone-50 mb-2">{SITE_NAME}</h1>
          <p className="text-stone-400 text-sm mb-6 leading-relaxed">
            Firebase is not configured. Add your <code className="font-mono text-amber-400">VITE_FIREBASE_*</code>{' '}
            variables to a <code className="font-mono text-amber-400">.env</code> file so you can sign in and load your real collection.
          </p>
          <Button size="lg" fullWidth variant="secondary" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  // Password reset sent confirmation
  if (resetSent) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">Check your inbox</h2>
          <p className="text-stone-400 text-sm mb-6">
            We sent a password reset link to <strong className="text-stone-200">{email}</strong>.
          </p>
          <Button fullWidth variant="secondary" onClick={() => { setResetSent(false); setShowReset(false); }}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col lg:flex-row">
      {/* Collector showcase — desktop side panel, mobile banner */}
      <div className="relative lg:w-[45%] xl:w-1/2 min-h-[220px] sm:min-h-[280px] lg:min-h-screen shrink-0">
        <img
          src={collectorShelfImage}
          alt="Premium diecast cars on collector shelves"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-900 via-stone-900/70 to-stone-900/20" />
        <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 lg:p-12">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Keith&apos;s Collection
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-50 leading-tight max-w-md">
            Every car. Every checklist. One place.
          </h2>
          <p className="text-stone-300 text-sm sm:text-base mt-3 max-w-sm leading-relaxed">
            Sign in to track your lists, inventory your finds, and build your showcase.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 lg:py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-2xl font-bold text-amber-500">{SITE_NAME}</div>
          </Link>
          <p className="text-stone-400 mt-2">
            {mode === 'signin'
              ? 'Welcome back, collector!'
              : selectedPlan
                ? `Create your account, then continue to ${checkoutPlanLabel(selectedPlan)} checkout.`
                : 'Start your vault today.'}
          </p>
          {mode === 'register' && selectedPlan && (
            <p className="text-amber-400 text-sm font-semibold mt-2">
              {checkoutPlanLabel(selectedPlan)} plan — ${selectedPlan === 'premium' ? '22' : '7'}/mo after signup
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-7">
          {/* Mode toggle */}
          <div className="flex bg-stone-900 rounded-xl p-1 mb-6">
            {(['signin', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setShowReset(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-amber-500 text-stone-900'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={showReset ? handlePasswordReset : handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5" htmlFor="displayName">
                  Your Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Keith"
                  className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
              />
            </div>

            {!showReset && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-stone-300" htmlFor="password">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setError(''); }}
                      className="text-xs text-stone-500 hover:text-amber-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                  className="w-full bg-stone-900 border border-stone-600 text-stone-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 placeholder-stone-600"
                />
              </div>
            )}

            {showReset && (
              <p className="text-stone-400 text-sm">
                Enter your email above and we'll send you a reset link.
              </p>
            )}

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              {showReset
                ? 'Send Reset Email'
                : mode === 'signin'
                ? 'Sign In'
                : selectedPlan
                  ? `Create Account & Pay for ${checkoutPlanLabel(selectedPlan)}`
                  : 'Create Account'}
            </Button>

            {showReset && (
              <button
                type="button"
                onClick={() => { setShowReset(false); setError(''); }}
                className="w-full text-center text-stone-500 text-sm hover:text-stone-300 transition-colors mt-1"
              >
                Back to sign in
              </button>
            )}
          </form>

          {!showReset && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-stone-700" />
                <span className="text-stone-600 text-sm">or</span>
                <div className="flex-1 h-px bg-stone-700" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-stone-200 font-semibold rounded-xl py-3 px-4 transition-colors text-base disabled:opacity-50"
                onClick={handleGoogle}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        <p className="text-center text-stone-600 text-sm mt-6">
          <Link to="/" className="hover:text-stone-400 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
