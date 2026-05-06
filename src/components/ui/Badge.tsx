import type { RarityType, PackageStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center font-bold rounded-full uppercase tracking-wide';
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1' };
  const variants = {
    default:  'bg-stone-600 text-stone-200',
    success:  'bg-green-700 text-green-100',
    warning:  'bg-amber-500 text-stone-900',
    danger:   'bg-red-600 text-white',
    info:     'bg-blue-600 text-white',
    purple:   'bg-purple-600 text-white',
    teal:     'bg-teal-600 text-white',
  };
  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

const RARITY_BADGE_MAP: Record<RarityType, { label: string; className: string }> = {
  'Regular':           { label: 'Regular',  className: 'bg-stone-600 text-stone-200' },
  'Mainline':          { label: 'Mainline', className: 'bg-blue-700 text-white' },
  'Premium':           { label: 'Premium',  className: 'bg-purple-600 text-white' },
  'Treasure Hunt':     { label: '🔥 TH',    className: 'bg-orange-500 text-white' },
  'Super Treasure Hunt': { label: '⭐ STH', className: 'bg-yellow-400 text-stone-900' },
  'Redline':           { label: 'Redline',  className: 'bg-red-600 text-white' },
  'Chase':             { label: 'Chase',    className: 'bg-green-600 text-white' },
  'Limited Edition':   { label: 'Limited',  className: 'bg-teal-600 text-white' },
  'Custom':            { label: 'Custom',   className: 'bg-pink-600 text-white' },
  'Unknown':           { label: '?',        className: 'bg-stone-600 text-stone-300' },
};

export function RarityBadge({ rarity }: { rarity: RarityType }) {
  const config = RARITY_BADGE_MAP[rarity];
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PackageBadge({ status }: { status: PackageStatus }) {
  const isCarded = status === 'Carded' || status === 'Opened but saved package' || status === 'Damaged package';
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
      isCarded ? 'bg-blue-800 text-blue-200' : 'bg-amber-800 text-amber-200'
    }`}>
      {isCarded ? '📦 Carded' : '🔓 Loose'}
    </span>
  );
}

export function DuplicateBadge({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-rose-700 text-white uppercase tracking-wide">
      ×{count} Dupes
    </span>
  );
}

export function FavoriteBadge() {
  return <span title="Favorite" className="text-amber-400 text-lg">★</span>;
}
