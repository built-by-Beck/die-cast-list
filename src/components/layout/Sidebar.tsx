import { NavLink, useNavigate } from 'react-router-dom';
import { SITE_NAME } from '../../lib/site';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',       label: 'Dashboard',       icon: '📊', end: true },
  { to: '/choose-lists',    label: 'Choose Lists',    icon: '✅', end: true },
  { to: '/my-tracked-lists',label: 'My Tracked Lists',icon: '📚', end: true },
  { to: '/inventory',       label: 'Inventory',       icon: '🚗', end: true },
  { to: '/marketplace-search', label: 'Marketplace Search', icon: '🔎', end: true },
  { to: '/settings',        label: 'Upgrade / Billing', icon: '💳', end: true },
  { to: '/inventory/add',   label: 'Add Car',         icon: '➕', end: true },
  { to: '/duplicates',      label: 'Duplicates',      icon: '📋', end: true },
  { to: '/showcase',        label: 'Showcase',        icon: '⭐', end: true },
  { to: '/wanted',          label: 'Wanted List',     icon: '🔍', end: true },
  { to: '/for-sale-trade',  label: 'For Sale / Trade', icon: '🏷️', end: true },
  { to: '/profile',         label: 'Profile',         icon: '👤', end: true },
];

export default function Sidebar() {
  const { userDoc, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-stone-800 border-r border-stone-700 flex flex-col h-screen sticky top-0">
      {/* Logo / Branding */}
      <div className="p-6 border-b border-stone-700">
        <NavLink to="/dashboard" className="block">
          <div className="text-2xl font-bold text-amber-500 leading-tight">
            🏎️ {SITE_NAME}
          </div>
        </NavLink>
        {userDoc && (
          <div className="text-stone-400 text-sm mt-1.5 truncate">
            {userDoc.displayName || userDoc.email}
            {userDoc.lifetimeAccess && (
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                Lifetime
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-base font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-stone-900 font-semibold'
                  : 'text-stone-300 hover:bg-stone-700 hover:text-stone-50'
              }`
            }
          >
            <span className="text-xl w-7 flex-shrink-0 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Admin link — only for admins */}
        {userDoc?.role === 'admin' && (
          <div className="mt-2 pt-2 border-t border-stone-700">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-base font-medium transition-all ${
                  isActive
                    ? 'bg-red-700 text-white font-semibold'
                    : 'text-red-400 hover:bg-stone-700 hover:text-red-300'
                }`
              }
            >
              <span className="text-xl w-7 flex-shrink-0 text-center">🛡️</span>
              Admin
            </NavLink>
          </div>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-stone-700">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-stone-300 hover:text-stone-100 rounded-xl transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
