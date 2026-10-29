"use client";

import { type KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type TabsProps<T extends string> = {
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** id of the tabpanel the tabs control. Each tab's id is `${panelId}-tab-${value}`. */
  panelId: string;
  className?: string;
};

/** Pill tabs. Left/right arrow keys select the previous/next enabled tab. */
export function Tabs<T extends string>({
  label,
  items,
  value,
  onValueChange,
  panelId,
  className,
}: TabsProps<T>) {
  const tabs = useRef(new Map<T, HTMLButtonElement>());

  function step(event: KeyboardEvent, from: T) {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const enabled = items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.value === from);
    const next = enabled[(index + delta + enabled.length) % enabled.length];
    onValueChange(next.value);
    tabs.current.get(next.value)?.focus();
  }

  return (
    <div
      aria-label={label}
      className={cn("inline-flex flex-wrap items-center gap-1", className)}
      role="tablist"
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            aria-controls={panelId}
            aria-selected={selected}
            className={cn(
              "h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              selected
                ? "bg-raised text-foreground shadow-xs ring-1 ring-border"
                : item.disabled
                  ? "cursor-not-allowed text-subtle-foreground"
                  : "cursor-pointer text-foreground/70 hover:text-foreground",
            )}
            disabled={item.disabled}
            id={`${panelId}-tab-${item.value}`}
            key={item.value}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => step(event, item.value)}
            ref={(node) => {
              if (node) tabs.current.set(item.value, node);
              else tabs.current.delete(item.value);
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
