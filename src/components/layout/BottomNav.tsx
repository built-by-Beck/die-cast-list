import { NavLink, useNavigate } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  isAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/checklists',    label: 'Lists',      icon: '✅' },
  { to: '/inventory',     label: 'Inventory',  icon: '🚗', end: true },
  { to: '/inventory/add', label: 'Add Car',    icon: '➕', end: true, isAction: true },
  { to: '/showcase',      label: 'Showcase',   icon: '⭐', end: true },
  { to: '/profile',       label: 'Profile',    icon: '👤', end: true },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bg-stone-800 border-t border-stone-700 flex justify-around items-end h-16 px-1 pb-1">
      {NAV_ITEMS.map((item) =>
        item.isAction ? (
          // Center "Add Car" button — larger and accented
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            aria-label={item.label}
            className="flex flex-col items-center gap-0.5 -mt-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 rounded-2xl px-4 py-2 shadow-lg font-bold transition-all"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
