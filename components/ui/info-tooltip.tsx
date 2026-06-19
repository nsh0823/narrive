import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

export function InfoTooltip({
  label,
  className
}: {
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <span
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
      >
        <Info size={12} />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-normal leading-relaxed text-foreground shadow-lg group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}
