import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card", className)}
      {...props}
    />
  );
}

/** A card holding a row of filters or options; the row wraps on narrow screens. */
export function Toolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

/** A loading, empty or error message in place of content. Screen readers announce changes to it. */
export function StatePanel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-8 text-center text-[13px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
