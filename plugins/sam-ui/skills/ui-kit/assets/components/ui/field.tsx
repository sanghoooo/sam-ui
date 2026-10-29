import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const LABEL = "shrink-0 text-[12px] font-medium text-muted-foreground";

/**
 * A small gray label in front of a filter control. Give it htmlFor for a single input or select;
 * without it the label is visual only, for controls that carry their own name (a segmented group).
 */
export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {htmlFor ? (
        <label className={LABEL} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span aria-hidden className={LABEL}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
