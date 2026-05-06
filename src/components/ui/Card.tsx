import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({ children, className = '', onClick, hoverable }: CardProps) {
  const base = 'bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden';
  const hover = hoverable || onClick ? 'hover:border-stone-500 transition-colors cursor-pointer' : '';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`${base} ${hover} ${className} ${onClick ? 'w-full text-left' : ''}`}>
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-4 border-b border-stone-700 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
      accent
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-stone-800 border-stone-700'
    }`}>
      <div className="text-4xl flex-shrink-0">{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${accent ? 'text-amber-400' : 'text-stone-50'}`}>
          {value}
        </div>
        <div className="text-sm text-stone-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
