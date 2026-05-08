import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
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
    </div>
  );
}
