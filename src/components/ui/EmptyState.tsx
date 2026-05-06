import Button from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="text-7xl mb-5">{icon}</div>
      <h3 className="text-2xl font-bold text-stone-200 mb-3">{title}</h3>
      <p className="text-stone-400 text-lg max-w-md leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-8">
          <Button size="lg" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
