"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
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
  chartAxis,
  chartGrid,
  chartTooltipProps,
  formatCompact,
  formatNumber,
  formatPeriodTick,
  INITIAL_DIMENSION,
  koDayAxis,
  seriesColor,
  useDotLayer,
  useMounted,
  withoutZero,
} from "./chart-parts";
import { useChartZoom } from "./chart-zoom";
import { ChartZoomControl } from "./chart-zoom-control";

/** The y axis width; the zoom hook takes it as the plot's left edge. */
const Y_AXIS_WIDTH = 40;
/** The chart's right margin; the zoom hook takes it as the plot's right edge. */
const RIGHT_MARGIN = 8;

/**
 * Stacked areas, one per series, as counts or (`percent`) as shares of each row's total (stackOffset "expand"). Ctrl +
 * wheel over the plot zooms around the pointer, dragging a zoomed plot pans, and a compact range slider at the top
 * right does the same (`zoom`). The tooltip lists every series from the hovered row, so a series at 0 still shows.
 * `hideYAxis` is the compact card variant: no y axis, smaller x ticks and a tighter top margin.
 */
export function StackedArea({
  data: sourceData,
  xKey = "key",
  series,
  percent = false,
  height = 260,
  className,
  fillOpacity = 0.55,
  hideYAxis = false,
  zoom: zoomOn = true,
  format = formatNumber,
  formatY = formatCompact,
  formatX,
  legend = false,
  tooltipExtra,
  label,
}: {
  /** Rows with `xKey` and one numeric field per series. */
  data: Record<string, unknown>[];
  /** The row field of the x label; "key" by default. */
  xKey?: string;
  series: ChartSeries[];
  /** Each row stacked to 100%: y ticks and tooltip shares in percent. */
  percent?: boolean;
  height?: number | string;
  className?: string;
  /** 0.55 by default; 0.25 for the lighter card look. */
  fillOpacity?: number;
  /** The compact card variant: no y axis, 9px x ticks, a 4px top margin. */
  hideYAxis?: boolean;
  /** Wheel/drag zoom with its slider; on by default. */
  zoom?: boolean;
  /** Tooltip values. */
  format?: (v: number) => string;
  /** Y ticks (counts only; percent mode prints shares). */
  formatY?: (v: number) => string;
  /**
   * X ticks. By default daily rows take the trend charts' Korean ticks ("9월 1일" with the year under it) and months
   * read "10월".
   */
  formatX?: (v: string) => string;
  /** A legend row above the plot. */
  legend?: boolean;
  /** Rendered under the tooltip's rows. */
  tooltipExtra?: (row: Record<string, unknown>, x: string) => ReactNode;
  /** The figure's aria-label. */
  label?: string;
}) {
  const mounted = useMounted();
  // Hover dots draw over the tooltip, so it passes under them.
  const { layer, overDot } = useDotLayer();
  // The hook runs even with zoom off (hooks are unconditional); its ref and control are then simply not used.
  const zoom = useChartZoom(
    sourceData,
    (row) => String(row[xKey]),
    7,
    hideYAxis ? 0 : Y_AXIS_WIDTH,
    RIGHT_MARGIN,
  );
  const data = zoomOn ? zoom.data : sourceData;
  const colors = series.map((s, i) => s.color ?? seriesColor(i));
  const keys = data.map((row) => String(row[xKey]));
  const koAxis =
    !formatX && !hideYAxis && keys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
      ? koDayAxis(keys)
      : undefined;
  // The zoom control rides in the top margin; without it the plot needs only a little room above its top tick.
  const top = zoomOn ? 32 : hideYAxis ? 4 : 8;
  const legendRow = legend ? (
    <ChartLegend
      className={hideYAxis ? "px-2" : "pr-2 pl-10"}
      items={series.map((s, i) => ({ name: s.name, color: colors[i] }))}
    />
  ) : null;
  // The host is a named figure only when it has a name; without one it stays a plain, unlabeled box.
  const figure = label ? { role: "figure", "aria-label": label } : undefined;
  return (
    <div {...figure} className={cn("w-full min-w-0", className)}>
      {legendRow}
      {mounted ? (
        <div
          className="relative"
          ref={zoomOn ? zoom.ref : undefined}
          style={{ height, ...(zoomOn ? zoom.interactionStyle : undefined) }}
        >
          {zoomOn && <ChartZoomControl compact zoom={zoom} />}
          <ResponsiveContainer
            height="100%"
            initialDimension={INITIAL_DIMENSION}
            minHeight={typeof height === "number" ? height : undefined}
            minWidth={100}
            width="100%"
          >
            <AreaChart
              data={data}
              margin={{ top, right: RIGHT_MARGIN, bottom: 0, left: 0 }}
              stackOffset={percent ? "expand" : undefined}
            >
              {chartGrid}
              <XAxis
                {...chartAxis}
                dataKey={xKey}
                minTickGap={hideYAxis ? 40 : 24}
                tick={
                  hideYAxis
                    ? { ...chartAxis.tick, fontSize: 9 }
                    : chartAxis.tick
                }
                tickFormatter={(v) => (formatX ?? formatPeriodTick)(String(v))}
                // Daily rows take the trend charts' Korean ticks, unless the caller formats them or the card is small.
                {...(koAxis ? { ...koAxis, interval: 0 } : {})}
              />
              {!hideYAxis && (
                <YAxis
                  {...chartAxis}
                  tickFormatter={withoutZero((v) =>
                    percent ? `${Math.round(v * 100)}%` : formatY(v),
                  )}
                  width={Y_AXIS_WIDTH}
                />
              )}
              {series.map((s, i) => (
                <Area
                  activeDot={overDot()}
                  dataKey={s.key}
                  fill={colors[i]}
                  fillOpacity={fillOpacity}
                  isAnimationActive={false}
                  key={s.key}
                  name={s.name}
                  stackId="s"
                  stroke={colors[i]}
                  type="monotone"
                />
              ))}
              <Tooltip
                {...chartTooltipProps(top)}
                content={({ active, payload, label: x }) => {
                  if (!active || !payload?.length) return null;
                  // The hovered row itself, so a series at 0 (which recharts may leave out of payload) still lists.
                  const row = payload[0].payload as Record<string, unknown>;
                  const values = series.map((s) => Number(row[s.key] ?? 0));
                  const total = values.reduce((sum, v) => sum + v, 0);
                  return (
                    <ChartTip
                      extra={tooltipExtra?.(row, String(x))}
                      label={String(x)}
                      rows={series.map((s, i) => ({
                        name: s.name,
                        color: colors[i],
                        value:
                          percent && total > 0
                            ? `${format(values[i])} (${Math.round((values[i] / total) * 100)}%)`
                            : format(values[i]),
                      }))}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {layer}
        </div>
      ) : (
        <ChartPlaceholder height={height} />
      )}
    </div>
  );
}
