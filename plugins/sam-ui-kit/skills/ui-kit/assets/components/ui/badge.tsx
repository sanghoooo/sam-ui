import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-4.5 shrink-0 items-center rounded-full bg-muted px-1.5 text-[10px] leading-none font-semibold text-muted-foreground ring-1 ring-border",
        className,
      )}
      {...props}
    />
  );
}
