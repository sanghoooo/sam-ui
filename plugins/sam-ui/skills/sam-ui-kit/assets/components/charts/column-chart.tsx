"use client";

import { type ReactNode, useId } from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  ErrorBar,
  LabelList,
  Line,
  Rectangle,
  type RectangleProps,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  ChartPlaceholder,
  type ChartSeries,
  ChartTip,
  type ChartTipRow,
  chartAxis,
  chartGrid,
  chartTooltipProps,
  formatCompact,
  formatNumber,
  formatPeriodTick,
  formatSigned,
  hatchPattern,
  INITIAL_DIMENSION,
  seriesColor,
  stepTicks,
  useDotLayer,
  useMounted,
  withoutZero,
} from "./chart-parts";
import { useChartZoom } from "./chart-zoom";
import { ChartZoomControl } from "./chart-zoom-control";

type Row = Record<string, unknown>;

/** A row in progress (a month not yet over) draws its bars at this opacity: it reads as "not closed yet". */
const PARTIAL_OPACITY = 0.4;
/** Series and rows outside a highlight, and sample rows, draw at this opacity. */
const DIM_OPACITY = 0.3;
/** The target line and the line series (총합) are drawn in the foreground color. */
const LINE_COLOR = "var(--foreground)";
/** A blank slot between groups is a row whose x starts with this; it carries the divider and no bar. */
const SEPARATOR = "sep-";
/** Each row of a grouped chart with separators keeps at least this width, so ten labels never collide. */
const SLOT_WIDTH = 56;
/** The chart's right margin; the zoom's drag bounds end there. */
const RIGHT_MARGIN = 8;

/** The note a caller shows beside the 확대/전체 toggle while the outlier zoom clips the taller bars. */
export const OUTLIER_NOTE =
  "확대: 축을 넘는 막대는 끝이 잘립니다 - 값은 툴팁 또는 전체에서 확인";

const num = (row: Row, key: string) => {
  const v = row[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};
const isSeparator = (x: string) => x.startsWith(SEPARATOR);

/**
 * Rows of several groups with a blank `sep-N` row between each pair of groups: the slot keeps the groups apart and
 * carries the dashed divider when the chart gets `separators`.
 */
export function withSeparators(groups: Row[][], xKey = "key"): Row[] {
  return groups.flatMap((group, gi) => [
    ...(gi > 0 ? [{ [xKey]: `${SEPARATOR}${gi}` }] : []),
    ...group,
  ]);
}

/**
 * The 90th percentile of |values| with 20% headroom: the axis range that holds the bulk of the bars when one far past
 * the rest would flatten every other one.
 */
function bulkOf(values: number[]) {
  const sorted = values.map(Math.abs).sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) * 0.9)] ?? 0) * 1.2;
}

/** True when the largest |value| runs 1.5× past the bulk of the others, so an outlier zoom would help. */
export function hasOutlier(values: number[]) {
  if (values.length === 0) return false;
  const max = Math.max(...values.map(Math.abs));
  return max > bulkOf(values) * 1.5;
}

type DotRenderProps = { cx?: number; cy?: number; payload?: Row };

/** How far below the plot top a clipped bar now ends, so its rounded end shows under the axis top. */
const CLIPPED_END = 6;

/**
 * A bar the outlier zoom shortens: its true length doesn't fit, so it ends just under the plot top with its rounded
 * end showing, and a break across its upper part says the length between is left out: a gap in the surface color
 * edged by two wavy lines that run a little past the bar on both sides. Bars that fit draw as usual.
 */
function shortenedBar(plotTop: number, ticks: number[]) {
  return function ShortenedBar(
    props: RectangleProps & { y?: number; value?: unknown },
  ) {
    const y = Number(props.y);
    const height = Number(props.height);
    if (!(y < plotTop - 0.5)) return <Rectangle {...props} />;
    const bottom = y + height;
    const top = plotTop + CLIPPED_END;
    const x = Number(props.x);
    const width = Number(props.width);
    // The scale's pixels per unit, from the bar's full (overflowing) length, place the ticks: the break sits in the
    // top band, between the last two ticks, where the axis itself is broken (its top tick reads the true top).
    const raw = Array.isArray(props.value)
      ? Number(props.value[1]) - Number(props.value[0])
      : Number(props.value);
    const perUnit = raw > 0 ? height / raw : 0;
    const below = ticks.length > 1 ? ticks[ticks.length - 2] : 0;
    const bandBottom = perUnit ? bottom - below * perUnit : bottom;
    const mid = Math.max(top + 8, (plotTop + bandBottom) / 2);
    const from = x - 4;
    const to = x + width + 4;
    const round = (n: number) => Math.round(n * 100) / 100;
    const wave = (offset: number) => {
      const steps = Math.max(8, Math.ceil(to - from));
      return Array.from({ length: steps + 1 }, (_, i) => {
        const t = from + ((to - from) * i) / steps;
        return [
          round(t),
          round(mid + offset + 2 * Math.sin(((t - from) / 8) * Math.PI * 2)),
        ];
      });
    };
    const upper = wave(-3);
    const lower = wave(3);
    const line = (points: number[][]) =>
      `M${points.map((pt) => pt.join(",")).join("L")}`;
    return (
      <g>
        <Rectangle {...props} height={bottom - top} y={top} />
        <path
          d={`${line(upper)}L${[...lower]
            .reverse()
            .map((pt) => pt.join(","))
            .join("L")}Z`}
          fill="var(--chart-surface, var(--card))"
        />
        <path
          d={`${line(upper)}${line(lower)}`}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth={1}
        />
      </g>
    );
  };
}

/**
 * Columns per row: one series, several side by side, or stacked (signed stacks pile the positives up and the
 * negatives down from a zero line). A series' `forecastKey` adds a hatched remainder bar on top of its bar; a `line`
 * series is drawn over the bars, its `forecastKey` the dashed continuation whose hollow dots (forecastFlagKey) carry
 * the range bars (rangeKey). A dotted target line, value labels, a row in progress drawn fainter (fadedKey), sample
 * rows with a dashed outline (sampleKey), a highlighted series or row (the rest dim), blank separator slots between
 * groups, and an outlier zoom that clips the one bar far past the rest. Ctrl + wheel and drag zoom the rows; the
 * tooltip's cursor is a 1px line through the hovered band's center. Nothing animates in: the chart is complete on its
 * first paint.
 */
export function ColumnChart({
  data,
  xKey = "key",
  series,
  signed = false,
  targetKey,
  rangeKey,
  forecastFlagKey,
  fadedKey,
  sampleKey,
  highlight = null,
  highlightRow = null,
  labels = false,
  separators = false,
  maxBarSize = 24,
  barGap,
  barCategoryGap = "30%",
  radius = 3,
  height = 260,
  className,
  zoom: zoomEnabled = true,
  outlierZoom = false,
  format,
  formatY = formatCompact,
  formatX = formatPeriodTick,
  tooltipLabel,
  tooltipExtra,
  label,
}: {
  /** Rows; `xKey` names the category field. */
  data: Row[];
  /** The row field of the x value; "key" by default. */
  xKey?: string;
  /**
   * The bar series: `stack` stacks them, `forecastKey` adds a hatched remainder bar in the same stack, `line` draws
   * the series as a line over the bars and then `forecastKey` is its dashed continuation.
   */
  series: ChartSeries[];
  /** Signed stacks (positives up, negatives down), ticks spanning the negatives and a zero line. */
  signed?: boolean;
  /** The row field of a target, drawn as a dotted foreground line over the bars. */
  targetKey?: string;
  /** The row field of a [low, high] offset pair, drawn as a range bar on the line series' forecast points. */
  rangeKey?: string;
  /** The row field flagging a forecast row: the continuation line gets a hollow dot there. */
  forecastFlagKey?: string;
  /** The row field flagging a row in progress: its bars draw fainter. */
  fadedKey?: string;
  /** The row field flagging a sample row: its bars draw faint with a dashed outline. */
  sampleKey?: string;
  /** A series key kept at full opacity while the other series dim. */
  highlight?: string | null;
  /** A row's x value kept at full opacity while the other rows dim. */
  highlightRow?: string | null;
  /** A value label over every bar. */
  labels?: boolean;
  /** Rows whose x starts with "sep-" (withSeparators) are blank slots with a dashed divider; the chart scrolls sideways. */
  separators?: boolean;
  maxBarSize?: number;
  /** The gap between bars of one row (thin grouped bars: maxBarSize 12, barGap 1). */
  barGap?: number;
  barCategoryGap?: number | string;
  /** The bars' top corner radius. */
  radius?: number;
  height?: number | string;
  /** Merged onto the host. */
  className?: string;
  /** Wheel and drag zoom with its control; the control hides under two rows. */
  zoom?: boolean;
  /** With an outlier among the values (hasOutlier), the y range holds the bulk of the bars and the taller ones clip. */
  outlierZoom?: boolean;
  /** Tooltip and label values; signed values get a leading + by default. */
  format?: (v: number) => string;
  /** Y ticks. */
  formatY?: (v: number) => string;
  /** X ticks (and the tooltip heading). */
  formatX?: (v: string) => string;
  /** The tooltip heading; the x value by default. */
  tooltipLabel?: (row: Row) => ReactNode;
  /** Rendered under the tooltip rows. */
  tooltipExtra?: (row: Row, x: string) => ReactNode;
  /** The figure's aria-label. */
  label?: string;
}) {
  const mounted = useMounted();
  // The hatch pattern ids are unique per chart, so two charts on a page never fill from each other's colors.
  const uid = useId().replace(/\W/g, "");
  const small = typeof height === "number" && height < 160;
  const yWidth = small ? 40 : 44;
  const fmt = format ?? (signed ? formatSigned : formatNumber);
  const colored = series.map((s, i) => ({
    ...s,
    color: s.color ?? (s.line ? LINE_COLOR : seriesColor(i)),
  }));
  const barSeries = colored.filter((s) => !s.line);
  const lineSeries = colored.filter((s) => s.line);
  const hatchId = (key: string) => `${uid}-h-${key}`;

  // The plot's own margins, so the zoom's wheel anchor and drag bounds land on it.
  const zoom = useChartZoom(
    data,
    (row) => String(row[xKey]),
    2,
    yWidth,
    RIGHT_MARGIN,
  );
  const rows = zoomEnabled ? zoom.data : data;
  const showZoom = zoomEnabled && data.length >= 2;

  // The extent of every value: stacked bars summed by sign per row (with their remainders), other bars and the lines
  // (a forecast close with its range) each on their own, for the signed ticks and the outlier bulk.
  let lo = 0;
  let hi = 0;
  const values: number[] = [];
  for (const row of data) {
    let up = 0;
    let down = 0;
    for (const b of barSeries) {
      for (const key of [b.key, b.forecastKey]) {
        if (!key) continue;
        const v = num(row, key);
        if (v == null) continue;
        values.push(v);
        if (b.stack) {
          if (v >= 0) up += v;
          else down += v;
        } else {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    }
    lo = Math.min(lo, down);
    hi = Math.max(hi, up);
    for (const l of lineSeries) {
      for (const key of [l.key, l.forecastKey]) {
        if (!key) continue;
        const v = num(row, key);
        if (v == null) continue;
        const range = rangeKey ? row[rangeKey] : null;
        const [below, above] = Array.isArray(range) ? range : [0, 0];
        lo = Math.min(lo, v - (Number(below) || 0));
        hi = Math.max(hi, v + (Number(above) || 0));
      }
    }
    const t = targetKey ? num(row, targetKey) : null;
    if (t != null) {
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
  }
  // The outlier zoom clamps the range to the bulk of the bars; a bar past it clips at the axis edge.
  const outlier = outlierZoom && hasOutlier(values);
  if (outlier) {
    const bulk = bulkOf(values);
    lo = Math.max(lo, -bulk);
    hi = Math.min(hi, bulk);
  }
  const spanned = signed || outlier ? stepTicks(lo, hi, 0) : null;
  // With the outlier zoom the axis is broken under its top tick, which then reads the tallest value rounded up to the
  // step, so the shortened bar's end means its real size.
  const step = spanned && spanned.length > 1 ? spanned[1] - spanned[0] : 1;
  const trueTop = Math.ceil(Math.max(0, ...values) / step) * step;
  const scaleProps = spanned
    ? {
        allowDataOverflow: outlier,
        domain: [spanned[0], spanned[spanned.length - 1]] as [number, number],
        interval: 0 as const,
        ticks: spanned,
      }
    : {};
  const drawZero = signed || lo < 0;

  // The zoom control rides in the chart's top margin; labels need a little room over the tallest bar.
  const margin = {
    top: showZoom ? 32 : labels ? 18 : 8,
    right: RIGHT_MARGIN,
    bottom: 0,
    left: 0,
  };
  const tick = small
    ? { fontSize: 10, fill: "var(--muted-foreground)" }
    : chartAxis.tick;
  const xOf = (row: Row) => String(row[xKey]);
  const flagged = (row: Row | undefined, key: string | undefined) =>
    key != null && row != null && Boolean(row[key]);
  // A forecast row is one the flag marks; without a flag, every point of the continuation counts.
  const isForecast = (row: Row | undefined) =>
    forecastFlagKey ? flagged(row, forecastFlagKey) : true;

  /** A bar's opacity on a row: in progress, outside the highlight, or full. */
  const opacityOf = (row: Row, key: string, faded: boolean) =>
    faded && flagged(row, fadedKey)
      ? PARTIAL_OPACITY
      : (highlight != null && highlight !== key) ||
          (highlightRow != null && highlightRow !== xOf(row))
        ? DIM_OPACITY
        : 1;
  // `fill` overrides the series color: the forecast remainder keeps its hatch pattern, which a Cell's plain fill would
  // otherwise paint over. A row in progress (fadedKey) draws its remainder plain and faded like its actual, so the
  // whole month reads as one faint bar and only months wholly ahead are hatched.
  const cells = (key: string, color: string, faded: boolean, fill = color) =>
    rows.map((row) => {
      const x = xOf(row);
      if (separators && isSeparator(x))
        return <Cell fill="transparent" key={x} />;
      if (flagged(row, sampleKey))
        return (
          <Cell
            fill={color}
            fillOpacity={DIM_OPACITY}
            key={x}
            stroke={color}
            strokeDasharray="3 2"
          />
        );
      if (fill !== color && flagged(row, fadedKey))
        return (
          <Cell fill={color} fillOpacity={opacityOf(row, key, true)} key={x} />
        );
      return (
        <Cell fill={fill} fillOpacity={opacityOf(row, key, faded)} key={x} />
      );
    });

  // Line dots draw over the tooltip, so it passes under them.
  const { layer, overDot } = useDotLayer();
  const hollowDot = (color: string, r: number) =>
    overDot(({ cx, cy, payload }: DotRenderProps) =>
      isForecast(payload) && cx !== undefined && cy !== undefined ? (
        <circle
          cx={cx}
          cy={cy}
          fill="var(--card)"
          key={xOf(payload ?? {})}
          r={r}
          stroke={color}
          strokeWidth={1.5}
        />
      ) : (
        <g key={xOf(payload ?? {})} />
      ),
    );

  if (!mounted)
    return <ChartPlaceholder className={className} height={height} />;

  const tipRows = (row: Row): ChartTipRow[] => {
    const out: ChartTipRow[] = [];
    for (const b of barSeries) {
      const v = num(row, b.key);
      const rest = b.forecastKey ? num(row, b.forecastKey) : null;
      out.push({
        name: b.name,
        color: b.color,
        square: true,
        value: v == null ? (rest == null ? "데이터 없음" : "-") : fmt(v),
      });
      if (rest != null)
        out.push({
          name: `${b.name} 예측`,
          color: b.color,
          square: true,
          dashed: true,
          value: fmt(rest),
        });
    }
    const t = targetKey ? num(row, targetKey) : null;
    if (t != null)
      out.push({
        name: "목표",
        color: LINE_COLOR,
        dashed: true,
        value: fmt(t),
      });
    for (const l of lineSeries) {
      const v = num(row, l.key);
      out.push({
        name: l.name,
        color: l.color,
        separatorBefore: true,
        value: v == null ? "-" : fmt(v),
      });
      const f =
        l.forecastKey && isForecast(row) ? num(row, l.forecastKey) : null;
      if (f != null) {
        const range = rangeKey ? row[rangeKey] : null;
        const [below, above] = Array.isArray(range) ? range : [null, null];
        out.push({
          name: `${l.name} 예상`,
          color: l.color,
          dashed: true,
          value:
            below != null && above != null
              ? `${fmt(f)} (${fmt(f - Number(below))} ~ ${fmt(f + Number(above))})`
              : fmt(f),
        });
      }
    }
    return out;
  };

  const chart = (
    <div
      className={cn("relative w-full min-w-0", !label && className)}
      ref={zoom.ref}
      style={{
        height,
        // Each row keeps its slot, so the chart scrolls sideways rather than squeezing the labels together.
        minWidth: separators ? data.length * SLOT_WIDTH : undefined,
        ...(zoomEnabled ? zoom.interactionStyle : {}),
      }}
    >
      {showZoom && <ChartZoomControl className="top-0" compact zoom={zoom} />}
      <ResponsiveContainer
        height="100%"
        initialDimension={INITIAL_DIMENSION}
        minHeight={typeof height === "number" ? height : undefined}
        minWidth={100}
        width="100%"
      >
        <ComposedChart
          barCategoryGap={barCategoryGap}
          barGap={barGap}
          data={rows}
          margin={margin}
          stackOffset={signed ? "sign" : undefined}
        >
          {/* The patterns sit in <defs> outside the bar layer, so a hidden layer never takes them with it. */}
          <defs>
            {barSeries
              .filter((b) => b.forecastKey)
              .map((b) => hatchPattern(hatchId(b.key), b.color))}
          </defs>
          {chartGrid}
          <XAxis
            {...chartAxis}
            dataKey={xKey}
            interval={separators ? 0 : undefined}
            tick={tick}
            tickFormatter={(v) =>
              separators && isSeparator(String(v)) ? "" : formatX(String(v))
            }
          />
          <YAxis
            {...chartAxis}
            {...scaleProps}
            tick={tick}
            tickFormatter={
              outlier && spanned
                ? withoutZero((v) =>
                    // The broken axis's top tick reads the true top, rounded up to the step.
                    v === spanned[spanned.length - 1]
                      ? // Spelled out, so it reads as a number next to the ticks under it rather than an
                        // abbreviation.
                        formatNumber(trueTop)
                      : formatY(v),
                  )
                : withoutZero(formatY)
            }
            width={yWidth}
          />
          {separators &&
            rows
              .filter((row) => isSeparator(xOf(row)))
              .map((row) => (
                <ReferenceLine
                  key={xOf(row)}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                  x={xOf(row)}
                />
              ))}
          {drawZero && (
            <ReferenceLine
              stroke="var(--muted-foreground)"
              strokeOpacity={0.6}
              y={0}
            />
          )}
          <Tooltip
            {...chartTooltipProps(margin.top, "center")}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              const x = xOf(row);
              if (separators && isSeparator(x)) return null;
              return (
                <ChartTip
                  dense={small}
                  extra={tooltipExtra?.(row, x)}
                  label={tooltipLabel ? tooltipLabel(row) : formatX(x)}
                  rows={tipRows(row)}
                />
              );
            }}
          />
          {/* Bars first, so the lines draw over them. */}
          {barSeries.flatMap((b) => {
            // A remainder bar piles onto its series: in the shared stack, or in a stack of the two of them.
            const stackId = b.stack
              ? "a"
              : b.forecastKey
                ? `f-${b.key}`
                : undefined;
            return [
              <Bar
                dataKey={b.key}
                fill={b.color}
                isAnimationActive={false}
                key={b.key}
                maxBarSize={maxBarSize}
                radius={stackId ? undefined : [radius, radius, 0, 0]}
                shape={
                  outlier && spanned
                    ? shortenedBar(margin.top, spanned)
                    : undefined
                }
                stackId={stackId}
              >
                {cells(b.key, b.color, true)}
                {labels && (
                  <LabelList
                    dataKey={b.key}
                    formatter={(v: unknown) =>
                      v == null ? "" : fmt(Number(v))
                    }
                    position="top"
                    style={{
                      fill: "var(--foreground)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Bar>,
              ...(b.forecastKey
                ? [
                    <Bar
                      dataKey={b.forecastKey}
                      fill={`url(#${hatchId(b.key)})`}
                      isAnimationActive={false}
                      key={b.forecastKey}
                      maxBarSize={maxBarSize}
                      stackId={stackId}
                    >
                      {cells(b.key, b.color, false, `url(#${hatchId(b.key)})`)}
                    </Bar>,
                  ]
                : []),
            ];
          })}
          {targetKey && (
            <Line
              activeDot={false}
              dataKey={targetKey}
              dot={false}
              isAnimationActive={false}
              stroke={LINE_COLOR}
              strokeDasharray="2 3"
              strokeWidth={1.5}
              type="monotone"
            />
          )}
          {lineSeries.flatMap((l) => [
            <Line
              activeDot={overDot({ r: 4, fill: l.color, strokeWidth: 0 })}
              dataKey={l.key}
              dot={overDot({ r: 3, fill: l.color, strokeWidth: 0 })}
              isAnimationActive={false}
              key={l.key}
              stroke={l.color}
              strokeWidth={1.5}
              type="linear"
            />,
            ...(l.forecastKey
              ? [
                  // The continuation starts at the last actual point (no flag there, so no hollow dot) and carries
                  // the range bars on its forecast points.
                  <Line
                    activeDot={hollowDot(l.color, 4)}
                    dataKey={l.forecastKey}
                    dot={hollowDot(l.color, 3)}
                    isAnimationActive={false}
                    key={l.forecastKey}
                    stroke={l.color}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    type="linear"
                  >
                    {rangeKey && (
                      <ErrorBar
                        dataKey={rangeKey}
                        direction="y"
                        isAnimationActive={false}
                        stroke={l.color}
                        strokeOpacity={0.7}
                        strokeWidth={1}
                        width={6}
                      />
                    )}
                  </Line>,
                ]
              : []),
          ])}
        </ComposedChart>
      </ResponsiveContainer>
      {layer}
    </div>
  );

  // Size containment keeps the chart's min width out of the page's: past it the chart scrolls, not the column.
  const framed = separators ? (
    <div className="overflow-x-auto contain-inline-size">{chart}</div>
  ) : (
    chart
  );
  // A figure only with a name; an unlabelled chart stays a plain box (a labelled frame around it may be the figure).
  return label ? (
    <figure aria-label={label} className={cn("w-full min-w-0", className)}>
      {framed}
    </figure>
  ) : (
    framed
  );
}
