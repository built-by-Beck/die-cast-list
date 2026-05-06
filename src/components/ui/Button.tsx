import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:   'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 focus-visible:outline-amber-500',
    secondary: 'bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-stone-100',
    danger:    'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white focus-visible:outline-red-500',
    ghost:     'bg-transparent hover:bg-stone-700 active:bg-stone-800 text-stone-300 hover:text-stone-100',
    success:   'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white focus-visible:outline-green-500',
  };

  const sizes = {
    sm:  'text-sm px-3 py-1.5',
    md:  'text-base px-5 py-2.5',
    lg:  'text-lg px-6 py-3',
    xl:  'text-xl px-8 py-4',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Large action card button used on Dashboard
interface ActionCardProps {
  icon: string;
  label: string;
  description?: string;
  onClick?: () => void;
  to?: string;
  color?: string;
}

export function ActionCard({ icon, label, description, onClick, color = 'bg-stone-800' }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${color} hover:bg-stone-700 active:scale-95 border border-stone-700 rounded-2xl p-6 text-left w-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-lg font-bold text-stone-50">{label}</div>
      {description && <div className="text-sm text-stone-400 mt-1">{description}</div>}
    </button>
  );
}
