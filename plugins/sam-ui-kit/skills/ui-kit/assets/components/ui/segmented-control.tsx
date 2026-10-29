"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
  /** Accessible name of the group; the visible label usually sits beside it in a Field. */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** soft: the chosen segment is a raised white pill. solid: it is filled with the primary color. */
  variant?: "soft" | "solid";
  className?: string;
};

type Pill = { left: number; width: number };

/**
 * A one-of-many choice as a row of segments. Native radios, so arrow keys move the choice. The chosen
 * segment's pill slides to a new choice: one pill behind the labels, placed on the chosen label's box.
 * Until it is measured (the server render), the chosen label paints its own pill, so the choice shows
 * from the first paint and the pill never flies in. Reduced motion moves it without the slide.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  variant = "soft",
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  const group = useRef<HTMLFieldSetElement>(null);
  const [pill, setPill] = useState<Pill | null>(null);

  // Places the pill on the chosen label, again whenever the group's size changes (the web font
  // arriving, a wrap), so it keeps fitting.
  useLayoutEffect(() => {
    const root = group.current;
    if (!root) return;
    const place = () => {
      const chosen = Array.from(root.querySelectorAll("input"))
        .find((input) => input.value === value)
        ?.closest("label");
      // Fractional pixels (offsetLeft/offsetWidth round to whole ones), from the group's padding edge,
      // where the pill's left: 0 sits.
      const box = chosen?.getBoundingClientRect();
      const next = box
        ? {
            left:
              box.left - root.getBoundingClientRect().left - root.clientLeft,
            width: box.width,
          }
        : null;
      setPill((current) =>
        current &&
        next &&
        current.left === next.left &&
        current.width === next.width
          ? current
          : next,
      );
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value]);

  return (
    <fieldset
      className={cn(
        "relative inline-flex min-w-0 shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5",
        className,
      )}
      ref={group}
    >
      <legend className="sr-only">{label}</legend>
      {pill && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0 rounded-md transition-[translate,width] duration-200 ease-out motion-reduce:transition-none",
            variant === "soft" ? "bg-raised shadow-xs" : "bg-primary",
          )}
          style={{ translate: `${pill.left}px 0`, width: pill.width }}
        />
      )}
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            className={cn(
              "relative inline-flex h-7.5 items-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-ring",
              option.disabled
                ? "cursor-not-allowed text-subtle-foreground"
                : "cursor-pointer text-muted-foreground hover:text-foreground",
              checked &&
                (variant === "soft"
                  ? "font-semibold text-foreground"
                  : "font-semibold text-primary-foreground hover:text-primary-foreground"),
              // Before the pill is measured, the chosen label paints it itself.
              checked &&
                !pill &&
                (variant === "soft" ? "bg-raised shadow-xs" : "bg-primary"),
            )}
            key={option.value}
          >
            <input
              checked={checked}
              className="sr-only"
              disabled={option.disabled}
              name={name}
              onChange={() => onValueChange(option.value)}
              type="radio"
              value={option.value}
            />
            {/* A hidden bold copy holds each label at its chosen width, so choosing one (semibold) never
                shifts the others while the pill slides. */}
            <span className="grid justify-items-center">
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 font-semibold"
              >
                {option.label}
              </span>
              <span className="col-start-1 row-start-1">{option.label}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
