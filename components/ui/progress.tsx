import { cn } from "@/lib/utils";

export function Progress({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
    >
      <div
        className="progress-fill-animated h-full rounded-full bg-primary"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
