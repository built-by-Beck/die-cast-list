interface PlanImageCardProps {
  src: string;
  alt: string;
  label: string;
  highlighted?: boolean;
}

/** Plan badge image — object-contain so on-image text stays visible. */
export default function PlanImageCard({
  src,
  alt,
  label,
  highlighted = false,
}: PlanImageCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border bg-stone-900/70 p-3 sm:p-4 ${
        highlighted ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-stone-700'
      }`}
    >
      <div className="flex min-h-[7.5rem] sm:min-h-[8.5rem] items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="max-h-32 sm:max-h-36 w-full object-contain"
        />
      </div>
      <p
        className={`mt-2 text-center text-xs font-semibold uppercase tracking-wide ${
          highlighted ? 'text-amber-400' : 'text-stone-500'
        }`}
      >
        {label}
        {highlighted ? ' · Your plan' : ''}
      </p>
    </div>
  );
}
