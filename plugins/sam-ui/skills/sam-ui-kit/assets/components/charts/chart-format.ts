/*
 * Pure chart helpers: constants, number and date formatting, tick rounding and the series descriptor. No React, no
 * recharts, no "use client", so server components (a page, a KPI card) import them freely; chart-parts.tsx re-exports
 * them for client code.
 */

/**
 * Spread as ResponsiveContainer's initialDimension on every chart: the server and the first client render lay out a
 * 1x1 box, so nothing jumps when ResizeObserver reports the real size.
 */
export const INITIAL_DIMENSION = { height: 1, width: 1 } as const;

/** Spread onto every XAxis and YAxis: no axis or tick lines, small muted labels (small charts override tick). */
export const chartAxis = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
} as const;

/**
 * An x tick for a period key in the trend charts' style: "2026-10" → "10월", "2026-10-01" → "10월 1일"; any other
 * label as it is. The default x format of the charts that take `formatX`.
 */
export function formatPeriodTick(v: string) {
  if (/^\d{4}-\d{2}$/.test(v)) return `${Number(v.slice(5, 7))}월`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v))
    return `${Number(v.slice(5, 7))}월 ${Number(v.slice(8, 10))}일`;
  return v;
}

/**
 * A y axis tick formatter that leaves 0 unlabeled: every chart's value axis starts at its baseline without a "0", the
 * grid line alone marking it.
 */
export function withoutZero(format: (v: number) => string) {
  return (v: unknown) => (Number(v) === 0 ? "" : format(Number(v)));
}

/**
 * A number rounded to `decimals` with ko-KR grouping, the fraction digits fixed so the server and the browser print the
 * same string. The default `format` of every chart.
 */
export function formatNumber(v: number, decimals = 0) {
  const factor = 10 ** decimals;
  // `|| 0` turns a rounded -0 into 0, so a tiny negative never prints "-0".
  const rounded = Math.round(v * factor) / factor || 0;
  return rounded.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** formatNumber with a leading + on positive values, for deltas and signed bars. */
export function formatSigned(v: number, decimals = 0) {
  return `${v > 0 ? "+" : ""}${formatNumber(v, decimals)}`;
}

/** A part's share of the total as "62.5", "0.0" when the total is 0; the share charts print it with a "%". */
export function shareOf(value: number, total: number) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
}

/**
 * Axis shortening: 120,000,000 → 1.2억, 15,000 → 1.5만 (a trailing .0 dropped, ko-KR grouping above 만), smaller values
 * as formatNumber; a minus sign is kept. The default `formatY` of the cartesian charts, since a 44px axis cannot hold
 * "1,200,000". parseCompact reads it back.
 */
export function formatCompact(v: number) {
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e8) return `${s}${(a / 1e8).toFixed(1)}억`;
  if (a >= 1e4) {
    const man = Number((a / 1e4).toFixed(1));
    return `${s}${man.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만`;
  }
  return `${s}${formatNumber(a)}`;
}

/** The inverse of formatCompact (억 and 만 scaled back); NaN when the text holds no number. */
export function parseCompact(text: string) {
  const digits = text.replace(/[^\d.-]/g, "");
  if (!digits) return Number.NaN;
  const n = Number(digits);
  return text.includes("억") ? n * 1e8 : text.includes("만") ? n * 1e4 : n;
}

/** "2026-10-01" → "2026년 10월 1일", from the string alone: no Date parsing, so no timezone can shift the day. */
export function formatDateKo(ymd: string) {
  return `${Number(ymd.slice(0, 4))}년 ${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8, 10))}일`;
}

/** "2026-10-01" → "10.01", from the string alone. */
export function formatMonthDay(ymd: string) {
  return ymd.slice(5, 10).replace("-", ".");
}

/**
 * Round y ticks from 0 up past `max` (100, 200, 300…): a 1·2·5 step for about five of them, the top rounded up to one,
 * so a fixed y range never ends on its raw maximum. Callers pass max > 0.
 */
export function roundTicks(max: number) {
  const raw = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ??
    10 * magnitude;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

/**
 * Ticks over lo..hi at the smallest 1·2·5 step that spans min(lo, keep)..max(hi, keep) in at most seven intervals,
 * from the step under the low end to the step over the high end, so `keep` (0 for signed data, 100 for an index) is
 * always a tick inside the range.
 */
export function stepTicks(lo: number, hi: number, keep = 0) {
  const min = Math.min(lo, keep);
  const max = Math.max(hi, keep);
  const span = max - min;
  const raw = span > 0 && Number.isFinite(span) ? span / 7 : 1;
  let magnitude = 10 ** Math.floor(Math.log10(raw));
  for (let guard = 0; guard < 12; guard++) {
    for (const m of [1, 2, 5]) {
      const step = m * magnitude;
      const first = Math.floor(min / step);
      const last = Math.ceil(max / step);
      if (last - first <= 7) {
        // Rounding each tick to the step's decimals keeps 0.1 steps from drifting (0.30000000000000004).
        const decimals = Math.max(0, -Math.floor(Math.log10(step)));
        return Array.from({ length: last - first + 1 }, (_, i) =>
          Number(((first + i) * step).toFixed(decimals)),
        );
      }
    }
    magnitude *= 10;
  }
  return [min, max];
}

/** The default series color by position: the five --chart-N tokens, cycling. */
export function seriesColor(index: number) {
  return `var(--chart-${(index % 5) + 1})`;
}

/** The series descriptor every chart consumes; `color` defaults to seriesColor(i). */
export type ChartSeries = {
  /** The row field. */
  key: string;
  /** The legend and tooltip name. */
  name: string;
  color?: string;
  /** Series sharing a groupKey stack together; others overlay. */
  groupKey?: string;
  stack?: boolean;
  dashed?: boolean;
  dotted?: boolean;
  /** Drawn as a line over the bars (combo charts). */
  line?: boolean;
  /** The row field of the forecast continuing this series past the actuals (dashed, fainter). */
  forecastKey?: string;
  /** The row field flagging an estimated value: a hollow dot on lines, a hatched bar on bars, "(추정)" in the tip. */
  estimatedKey?: string;
  /** A divider above this row in the tooltip. */
  separatorBefore?: boolean;
  /** The name written at the line's last point. */
  endLabel?: boolean;
};
