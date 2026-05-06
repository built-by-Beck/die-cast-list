import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const { isMockMode } = useAuth();

  return (
    <div className="flex min-h-screen bg-stone-900">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dev mode banner */}
        {isMockMode && (
          <div className="bg-amber-500 text-stone-900 text-center text-sm font-semibold py-2 px-4">
            🔧 Development Mode — Using mock data. Create a{' '}
            <code className="font-mono bg-amber-600/30 px-1 rounded">.env</code> file with your Firebase config to connect.
          </div>
        )}

        {/* Page content — pad bottom on mobile for the bottom nav */}
        <main className="flex-1 pb-20 lg:pb-0 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
