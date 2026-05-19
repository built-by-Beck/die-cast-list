import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AIChatPanel from '../ui/AIChatPanel';
import { useAuth } from '../../contexts/AuthContext';
import { canUseAI, getEffectivePlan } from '../../lib/access';

function LockedAIButton() {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="fixed bottom-24 right-4 z-50 lg:bottom-6">
      <button
        onClick={() => setShowTip((v) => !v)}
        aria-label="AI assistant — Pro feature"
        className="w-14 h-14 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-2xl text-stone-500 shadow-xl"
      >
        ✨
      </button>
      {showTip && (
        <div className="absolute bottom-16 right-0 w-56 rounded-2xl border border-amber-700/50 bg-stone-900 shadow-2xl p-4">
          <p className="text-sm font-bold text-amber-300 mb-1">Pro Feature</p>
          <p className="text-xs text-stone-400 mb-3">
            The AI assistant is available on the Pro plan. It can find and track lists for you, answer billing questions, and more.
          </p>
          <a
            href="/settings"
            className="block text-center text-xs rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-2 transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, userDoc } = useAuth();
  const isPro = userDoc ? canUseAI(userDoc) : false;
  const isLoggedIn = Boolean(user);
  const plan = userDoc ? getEffectivePlan(userDoc) : null;

  return (
    <div className="flex min-h-screen bg-stone-900">
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 lg:pb-0 overflow-auto">
          <Outlet />
        </main>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>

      {isLoggedIn && isPro && <AIChatPanel />}
      {isLoggedIn && !isPro && plan !== null && <LockedAIButton />}
    </div>
  );
}
