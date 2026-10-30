"use client";

import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  ChartLegend,
  ChartTip,
  chartAxis,
  chartGrid,
  formatCompact,
  formatNumber,
  INITIAL_DIMENSION,
  type LegendItem,
  seriesColor,
  useDotLayer,
  withoutZero,
} from "./chart-parts";

/** One dot of a ScatterPlot. */
export type ScatterPlotPoint = {
  x: number;
  /** A value, or the row index when the plot has `yCategories`. */
  y: number;
  /** The tooltip title. */
  name: string;
  /** Points sharing a group share one color and legend item. */
  group: string;
  /** The group's color, read from its first point; defaults to the chart colors by group order. */
  color?: string;
  /** The third value, drawn as the dot's area (see `sizeRange`). */
  size?: number;
  /** An extra tooltip row (a plan's conditions, a channel). */
  detail?: string;
};

/** A tick label's rough width in px at 11px: a Hangul syllable about a full em, a space 0.3 em, anything else 0.62. */
function tickTextWidth(text: string) {
  let em = 0;
  for (const ch of text) em += /[가-힣]/.test(ch) ? 1 : ch === " " ? 0.3 : 0.62;
  return em * 11;
}

/**
 * Dots over two numeric axes, one Scatter per group, with an optional third value as the dot size. Reference groups
 * (`faintGroups`) draw fainter so the groups of interest read on top; `yCategories` turns the y axis into labelled rows.
 */
export function ScatterPlot({
  points,
  xLabel,
  yLabel,
  faintGroups,
  yCategories,
  sizeRange = [30, 140],
  height = 260,
  className,
  format = formatNumber,
  formatX = formatCompact,
  formatY = formatCompact,
  detailLabel = "조건",
  label,
}: {
  points: ScatterPlotPoint[];
  /** The x axis label (under the plot) and the tooltip's x row name. */
  xLabel: string;
  /** The tooltip's y row name. */
  yLabel: string;
  /** Groups drawn at 35% opacity (a market or reference group); the others at 90%. */
  faintGroups?: string[];
  /** Row labels for a categorical y: each point's y is its index. */
  yCategories?: string[];
  /** The ZAxis range: the dot area for the smallest and the largest `size`. */
  sizeRange?: [number, number];
  height?: number | string;
  className?: string;
  /** The tooltip's y value. */
  format?: (v: number) => string;
  /** The x ticks and the tooltip's x value. */
  formatX?: (v: number) => string;
  /** The y ticks (ignored with `yCategories`). */
  formatY?: (v: number) => string;
  /** The name of the `detail` row. */
  detailLabel?: string;
  /** Makes the host a figure with this aria-label. */
  label?: string;
}) {
  // Groups in first-seen order; a group's color is its first point's, else the chart color at its index.
  // The points draw over the tooltip, so it passes under them.
  const { layer, overDot } = useDotLayer();
  const groups = [...new Set(points.map((p) => p.group))];
  const colorOf = new Map(
    groups.map((g, i) => [
      g,
      points.find((p) => p.group === g)?.color ?? seriesColor(i),
    ]),
  );
  const legend: LegendItem[] = groups.map((g) => ({
    name: g,
    color: colorOf.get(g) ?? seriesColor(0),
    kind: "square",
  }));
  const rowCount = yCategories?.length ?? 0;
  // A categorical axis is as wide as its longest row label (88px at least), the 14px past it holding the tick gap; a
  // numeric one holds a compact number.
  const yWidth = yCategories
    ? Math.max(88, Math.ceil(Math.max(...yCategories.map(tickTextWidth)) + 14))
    : 44;
  const yValue = (y: number) =>
    yCategories ? (yCategories[y] ?? format(y)) : format(y);
  const hostClass = cn("w-full min-w-0", className);
  const body = (
    <>
      {/* The legend starts at the plot's left edge (the y axis width). */}
      <div style={{ paddingLeft: yWidth }}>
        <ChartLegend items={legend} />
      </div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer
          height="100%"
          initialDimension={INITIAL_DIMENSION}
          width="100%"
        >
          <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
            {chartGrid}
            <XAxis
              {...chartAxis}
              dataKey="x"
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -8,
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
              name={xLabel}
              tickFormatter={(v) => formatX(Number(v))}
              type="number"
            />
            {yCategories ? (
              // Rows sit on whole indices; 0.4 of a row above and below keeps the end rows' dots inside the plot.
              <YAxis
                {...chartAxis}
                dataKey="y"
                domain={[-0.4, rowCount - 0.6]}
                name={yLabel}
                // No-break spaces, so recharts never wraps a row label at its spaces.
                tickFormatter={(v) =>
                  (yCategories[Number(v)] ?? "").replaceAll(" ", "\u00a0")
                }
                ticks={yCategories.map((_, i) => i)}
                type="number"
                width={yWidth}
              />
            ) : (
              <YAxis
                {...chartAxis}
                dataKey="y"
                name={yLabel}
                tickFormatter={withoutZero(formatY)}
                type="number"
                width={yWidth}
              />
            )}
            <ZAxis dataKey="size" range={sizeRange} />
            {groups.map((g) => (
              <Scatter
                data={points.filter((p) => p.group === g)}
                fill={colorOf.get(g)}
                fillOpacity={faintGroups?.includes(g) ? 0.35 : 0.9}
                isAnimationActive={false}
                key={g}
                name={g}
                // recharts sizes a point by its area (ZAxis range): a circle of the same area, in the layer.
                shape={overDot(
                  (p: { cx?: number; cy?: number; size?: number }) =>
                    p.cx == null || p.cy == null ? (
                      <g />
                    ) : (
                      <circle
                        cx={p.cx}
                        cy={p.cy}
                        fill={colorOf.get(g)}
                        fillOpacity={faintGroups?.includes(g) ? 0.35 : 0.9}
                        r={Math.sqrt((p.size ?? 64) / Math.PI)}
                      />
                    ),
                )}
              />
            ))}
            <Tooltip
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as ScatterPlotPoint | undefined;
                return active && p ? (
                  <ChartTip
                    dense
                    label={p.name}
                    rows={[
                      { name: xLabel, value: formatX(p.x) },
                      { name: yLabel, value: yValue(p.y) },
                      ...(p.detail
                        ? [{ name: detailLabel, value: p.detail }]
                        : []),
                    ]}
                  />
                ) : null;
              }}
              cursor={{ strokeDasharray: "3 3" }}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
        {layer}
      </div>
    </>
  );
  // A figure only with a name; an unlabelled chart stays a plain box (a labelled frame around it may be the figure).
  return label ? (
    <figure aria-label={label} className={hostClass}>
      {body}
    </figure>
  ) : (
    <div className={hostClass}>{body}</div>
  );
}
