import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A native select with the field look. An option with value "" (선택 없음) shows in gray. */
export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className={cn("relative inline-flex min-w-0", className)}>
      <select
        className="h-8.5 w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg border border-input bg-card pr-9 pl-3 text-[13px] text-foreground transition-colors hover:border-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 [&:has(option[value='']:checked)]:text-muted-foreground"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}
