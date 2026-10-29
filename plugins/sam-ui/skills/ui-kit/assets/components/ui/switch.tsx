import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  ComponentProps<"button">,
  "onChange" | "role" | "type"
> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/** An on/off switch (WAI-ARIA switch). Inside a <label>, clicking the label text toggles it too. */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className,
      )}
      onClick={() => onCheckedChange?.(!checked)}
      role="switch"
      type="button"
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0.5 size-4 rounded-full bg-white shadow-xs transition-transform",
          checked && "translate-x-4 dark:bg-primary-foreground",
        )}
      />
    </button>
  );
}
