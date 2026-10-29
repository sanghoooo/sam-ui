"use client";

import type { ReactNode } from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  ChartLegend,
  ChartPlaceholder,
  type ChartSeries,
  ChartTip,
  type ChartTipRow,
  chartAxis,
  chartGrid,
  chartTooltipProps,
  formatCompact,
  formatNumber,
  formatSigned,
  INITIAL_DIMENSION,
  type LegendItem,
  seriesColor,
  stepTicks,
  useDotLayer,
  useMounted,
} from "./chart-parts";
import { useChartZoom } from "./chart-zoom";
import { ChartZoomControl } from "./chart-zoom-control";

type Row = Record<string, unknown>;
type AxisSide = "left" | "right";

/** A bar series of the combo chart; `stack` bars pile onto one stack. */
export type ComboBar = ChartSeries & { axis?: AxisSide };
/** A line series of the combo chart; `dots` draws a small dot at every point. */
export type ComboLine = ChartSeries & { axis?: AxisSide; dots?: boolean };
/** The right y axis; `percent` is a fixed 0–100 axis with "25%" ticks. */
export type ComboRightAxis = {
  format?: (v: number) => string;
  domain?: [number, number];
  ticks?: number[];
  percent?: boolean;
  width?: number;
};

/** The left y axis is 44px wide: the compact formatter fits "1.5만" and "-21.2만" in it. */
const LEFT_WIDTH = 44;
/** The chart's right margin; the plot ends there, or at the right axis when there is one. */
const RIGHT_MARGIN = 4;
/** Bars share the plot with lines at this opacity, so a line crossing them stays readable. */
const BARS_WITH_LINES = 0.55;
/** A row in progress (a month not yet over) draws its bars fainter. */
const FADED = 0.4;
const PERCENT_TICKS = [0, 25, 50, 75, 100];
/** The share line and the target line are drawn in the foreground color, apart from the series colors. */
const FOREGROUND = "var(--foreground)";

const num = (row: Row, key: string) => {
  const v = row[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

/**
 * One nice scale for both axes: the step is the first of 1 · 1.25 · 1.5 · 2 · 2.5 · 5 · 10 at the maximum's magnitude
 * that holds max × 1.12 / 4, the headroom keeping a maximal line off the plot's top edge; five ticks from 0 to
 * step × 4.
 */
function sharedTicks(max: number) {
  const rawStep = (Math.max(1, max) * 1.12) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factor =
    [1, 1.25, 1.5, 2, 2.5, 5, 10].find((f) => f >= rawStep / magnitude) ?? 10;
  const step = Math.max(1, Math.ceil(factor * magnitude));
  return Array.from({ length: 5 }, (_, i) => i * step);
}

/**
 * Bars and lines on one plot, each series on the left or the right y axis. Signed bars (a net flow) get a 0 line and
 * ticks spanning the negatives; a line on a `percent` right axis is the thin share line with dots, in the foreground
 * color unless the series names one. Ctrl + wheel and drag zoom the rows (the control above the plot at the right), a
 * legend row sits above the plot at the left, and the hover dots are drawn above the tooltip. Nothing animates in:
 * the chart is complete on its first paint.
 */
export function ComboChart({
  data,
  xKey = "key",
  bars = [],
  lines = [],
  rightAxis,
  sharedScale = false,
  zeroLine,
  targetKey,
  fadedKey,
  legend = false,
  height = 260,
  className,
  zoom: zoomEnabled = true,
  format = formatNumber,
  formatY = formatCompact,
  formatX = (v) => v,
  tooltipLabel,
  tooltipExtra,
  label,
}: {
  /** Rows with `xKey`. */
  data: Row[];
  /** The row field of the x value; "key" by default. */
  xKey?: string;
  bars?: ComboBar[];
  lines?: ComboLine[];
  rightAxis?: ComboRightAxis;
  /** Both axes on one nice scale, so a bar and a line of the same size meet. */
  sharedScale?: boolean;
  /** A line at y = 0 on the bars' axis; on by default when any value is negative. */
  zeroLine?: boolean;
  /** The row field of a target, drawn as a dotted foreground line on the bars' axis. */
  targetKey?: string;
  /** The row field flagging a row in progress: its bars draw fainter. */
  fadedKey?: string;
  /** A legend row above the plot: squares for bars, lines for lines. */
  legend?: boolean;
  height?: number | string;
  /** Merged onto the host. */
  className?: string;
  /** Wheel and drag zoom with its control; the control hides under two rows. */
  zoom?: boolean;
  /** Tooltip values. */
  format?: (v: number) => string;
  /** Left axis ticks (and right axis ticks without their own format). */
  formatY?: (v: number) => string;
  /** X ticks. */
  formatX?: (v: string) => string;
  /** The tooltip heading; the x value by default. */
  tooltipLabel?: (row: Row) => ReactNode;
  /** Rendered under the tooltip rows. */
  tooltipExtra?: (row: Row, x: string) => ReactNode;
  /** The figure's aria-label. */
  label?: string;
}) {
  const mounted = useMounted();
  const { layer, overDot } = useDotLayer();
  const percent = rightAxis?.percent ?? false;
  const isShare = (l: ComboLine) => percent && (l.axis ?? "left") === "right";
  const barSeries = bars.map((b, i) => ({
    ...b,
    color: b.color ?? seriesColor(i),
    axis: b.axis ?? "left",
  }));
  // A share line is a guide over the bars, so it takes the foreground color rather than the next series color.
  const lineSeries = lines.map((l, i) => ({
    ...l,
    color: l.color ?? (isShare(l) ? FOREGROUND : seriesColor(bars.length + i)),
    axis: l.axis ?? "left",
  }));
  const stacked = barSeries.some((b) => b.stack);
  // The bars' axis: the side most bars sit on (the 0 line and the signed ticks go there).
  const rightBars = barSeries.filter((b) => b.axis === "right").length;
  const barsAxis: AxisSide =
    rightBars > barSeries.length - rightBars ? "right" : "left";
  const hasRight =
    rightAxis != null ||
    barSeries.some((b) => b.axis === "right") ||
    lineSeries.some((l) => l.axis === "right");
  const rightWidth = rightAxis?.width ?? (percent ? 36 : 52);
  // The plot's own margins, so the zoom's wheel anchor and drag bounds land on it.
  const zoom = useChartZoom(
    data,
    (row) => String(row[xKey]),
    2,
    LEFT_WIDTH,
    RIGHT_MARGIN + (hasRight ? rightWidth : 0),
  );
  const rows = zoomEnabled ? zoom.data : data;
  const showZoom = zoomEnabled && data.length >= 2;

  // The extent of every value (stacked bars summed by sign per row), for the signed ticks and the shared scale.
  let lo = 0;
  let hi = 0;
  let barLo = 0;
  let barHi = 0;
  for (const row of data) {
    let up = 0;
    let down = 0;
    for (const b of barSeries) {
      const v = num(row, b.key);
      if (v == null) continue;
      if (b.stack) {
        if (v >= 0) up += v;
        else down += v;
      } else {
        barLo = Math.min(barLo, v);
        barHi = Math.max(barHi, v);
      }
    }
    barLo = Math.min(barLo, down);
    barHi = Math.max(barHi, up);
    for (const l of lineSeries) {
      const v = num(row, l.key);
      if (v == null || isShare(l)) continue;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const t = targetKey ? num(row, targetKey) : null;
    if (t != null) {
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
  }
  lo = Math.min(lo, barLo);
  hi = Math.max(hi, barHi);
  const signedBars = barLo < 0;
  const signed = lo < 0;
  const drawZero = zeroLine ?? signed;

  // Signed data: 1·2·5 ticks spanning the negatives (stepTicks keeping 0) on the bars' axis, every one drawn. A
  // shared scale puts the same ticks on both axes, with allowDataOverflow so a value past the headroom clips instead
  // of stretching the scale.
  const spanned =
    sharedScale && signed
      ? stepTicks(lo, hi, 0)
      : sharedScale
        ? sharedTicks(hi)
        : signedBars
          ? stepTicks(barLo, barHi, 0)
          : null;
  const scaleProps = (side: AxisSide) =>
    spanned && (sharedScale || side === barsAxis)
      ? {
          allowDataOverflow: sharedScale,
          domain: [spanned[0], spanned[spanned.length - 1]] as [number, number],
          interval: 0 as const,
          ticks: spanned,
        }
      : {};
  const rightProps = percent
    ? {
        domain: rightAxis?.domain ?? ([0, 100] as [number, number]),
        interval: 0 as const,
        ticks: rightAxis?.ticks ?? PERCENT_TICKS,
      }
    : {
        ...scaleProps("right"),
        ...(rightAxis?.domain ? { domain: rightAxis.domain } : {}),
        ...(rightAxis?.ticks
          ? { ticks: rightAxis.ticks, interval: 0 as const }
          : {}),
      };
  const formatRight =
    rightAxis?.format ?? (percent ? (v: number) => `${v}%` : formatY);

  // The legend row and the zoom control sit in the chart's top margin, 8px over the plot.
  const topBand = legend || showZoom;
  const margin = {
    top: topBand ? 32 : 12,
    right: RIGHT_MARGIN,
    bottom: 0,
    left: 0,
  };
  const barOpacity = lineSeries.length ? BARS_WITH_LINES : 1;

  const legendItems: LegendItem[] = [
    ...barSeries.map(
      (b): LegendItem => ({ name: b.name, color: b.color, kind: "square" }),
    ),
    ...lineSeries.map(
      (l): LegendItem => ({
        name: l.name,
        color: l.color,
        kind: l.dashed ? "dashed" : l.dotted ? "dotted" : "line",
      }),
    ),
    ...(targetKey
      ? [{ name: "목표", color: FOREGROUND, kind: "dotted" } as LegendItem]
      : []),
  ];

  if (!mounted)
    return <ChartPlaceholder className={className} height={height} />;

  const tipRows = (row: Row): ChartTipRow[] => {
    const value = (v: number | null, l?: ComboLine) =>
      v == null
        ? "-"
        : l && isShare(l)
          ? `${v.toFixed(1)}%`
          : !l && signedBars
            ? formatSigned(v)
            : format(v);
    const barRows = barSeries.map(
      (b): ChartTipRow => ({
        name: b.name,
        color: b.color,
        square: true,
        value: value(num(row, b.key)),
      }),
    );
    const total = barSeries
      .filter((b) => b.stack)
      .reduce((sum, b) => sum + (num(row, b.key) ?? 0), 0);
    const totalRow: ChartTipRow[] = stacked
      ? [{ name: "합계", separatorBefore: true, value: value(total) }]
      : [];
    const lineRows = lineSeries.map(
      (l): ChartTipRow => ({
        name: l.name,
        color: l.color,
        dashed: l.dashed,
        dotted: l.dotted,
        value: value(num(row, l.key), l),
      }),
    );
    const targetRow: ChartTipRow[] = targetKey
      ? [
          {
            name: "목표",
            color: FOREGROUND,
            dotted: true,
            value: value(num(row, targetKey)),
          },
        ]
      : [];
    return [...barRows, ...totalRow, ...lineRows, ...targetRow];
  };

  // The zoom hook's ref wants the plot's own box, so the host is this div; a label wraps it in a figure.
  const body = (
    <div
      className={cn("relative w-full min-w-0", !label && className)}
      ref={zoom.ref}
      style={{ height, ...zoom.interactionStyle }}
    >
      {legend && legendItems.length > 0 && (
        <ChartLegend
          className="absolute top-0 left-[44px]"
          items={legendItems}
        />
      )}
      {showZoom && <ChartZoomControl className="top-0" compact zoom={zoom} />}
      <ResponsiveContainer
        height="100%"
        initialDimension={INITIAL_DIMENSION}
        minHeight={typeof height === "number" ? height : undefined}
        minWidth={100}
        width="100%"
      >
        <ComposedChart data={rows} margin={margin}>
          {chartGrid}
          <XAxis
            {...chartAxis}
            dataKey={xKey}
            tickFormatter={(v) => formatX(String(v))}
          />
          <YAxis
            {...chartAxis}
            {...scaleProps("left")}
            tickFormatter={formatY}
            width={LEFT_WIDTH}
            yAxisId="left"
          />
          {hasRight && (
            <YAxis
              {...chartAxis}
              {...rightProps}
              orientation="right"
              tickFormatter={formatRight}
              width={rightWidth}
              yAxisId="right"
            />
          )}
          <Tooltip
            {...chartTooltipProps(margin.top, "band")}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              const x = String(row[xKey]);
              return (
                <ChartTip
                  extra={tooltipExtra?.(row, x)}
                  label={tooltipLabel ? tooltipLabel(row) : x}
                  rows={tipRows(row)}
                />
              );
            }}
          />
          {drawZero && (
            <ReferenceLine stroke="var(--border)" y={0} yAxisId={barsAxis} />
          )}
          {barSeries.map((b, i) => {
            // A stack is rounded once, at its top series; other bars each at their own top.
            const topOfStack =
              !b.stack || barSeries.findLastIndex((s) => s.stack) === i;
            return (
              <Bar
                dataKey={b.key}
                fill={b.color}
                fillOpacity={barOpacity}
                isAnimationActive={false}
                key={b.key}
                maxBarSize={28}
                radius={topOfStack ? [3, 3, 0, 0] : undefined}
                stackId={b.stack ? "b" : undefined}
                yAxisId={b.axis}
              >
                {fadedKey &&
                  rows.map((row) => (
                    <Cell
                      fillOpacity={row[fadedKey] ? FADED : barOpacity}
                      key={String(row[xKey])}
                    />
                  ))}
              </Bar>
            );
          })}
          {lineSeries.map((l) => {
            const share = isShare(l);
            const dots = l.dots ?? share;
            return (
              <Line
                activeDot={overDot({ r: 4, fill: l.color, strokeWidth: 0 })}
                dataKey={l.key}
                dot={dots ? { r: 2.5, fill: l.color, strokeWidth: 0 } : false}
                isAnimationActive={false}
                key={l.key}
                stroke={l.color}
                strokeDasharray={
                  l.dashed ? "4 4" : l.dotted ? "2 3" : undefined
                }
                strokeWidth={share ? 1.5 : 2}
                type={share ? "linear" : "monotone"}
                yAxisId={l.axis}
              />
            );
          })}
          {targetKey && (
            <Line
              activeDot={false}
              dataKey={targetKey}
              dot={false}
              isAnimationActive={false}
              stroke={FOREGROUND}
              strokeDasharray="2 3"
              strokeWidth={1.5}
              type="linear"
              yAxisId={barsAxis}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {layer}
    </div>
  );
  // A figure only with a name; an unlabelled chart stays a plain box (a labelled frame around it may be the figure).
  return label ? (
    <figure aria-label={label} className={cn("w-full min-w-0", className)}>
      {body}
    </figure>
  ) : (
    body
  );
}
