import type { CSSProperties, ReactNode } from "react";
import { formatNumber } from "./chart-format";

export type BarListItem = {
  label: ReactNode;
  value: number;
  /** The bar color; defaults to the primary color. */
  color?: string;
  /** Sits after the value: a badge, a delta, a hint. */
  note?: ReactNode;
};

/**
 * A ranked list of label · bar · value rows, in HTML rather than SVG so it reads at any width. Each bar's width is
 * its share of the largest absolute value, so negative rows still get a bar; a sign-aware color or note is the
 * caller's (pass `color` by sign and formatSigned as `format`).
 */
export function BarList({
  items,
  format = (v: number) => formatNumber(v),
  labelWidth = "7.5rem",
  label,
}: {
  items: BarListItem[];
  /** How a value prints; formatSigned for deltas. */
  format?: (v: number) => string;
  /** The label column's cap; longer labels truncate. */
  labelWidth?: string;
  /** aria-label on the list. */
  label?: string;
}) {
  // Floor 1 so an all-zero list never divides by zero.
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <ul
      aria-label={label}
      className="space-y-2"
      style={{ "--bar-list-label": labelWidth } as CSSProperties}
    >
      {items.map((i, n) => (
        <li
          className="grid grid-cols-[minmax(0,var(--bar-list-label))_1fr_auto] items-center gap-2 text-[12px]"
          key={n}
        >
          <span className="truncate">{i.label}</span>
          <span className="relative h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${(Math.abs(i.value) / max) * 100}%`,
                background: i.color ?? "var(--primary)",
              }}
            />
          </span>
          <span className="flex items-center gap-1.5 text-right tabular-nums">
            {format(i.value)}
            {i.note}
          </span>
        </li>
      ))}
    </ul>
  );
}
