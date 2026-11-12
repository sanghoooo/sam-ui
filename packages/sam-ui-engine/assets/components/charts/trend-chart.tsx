"use client";

import {
  type ComponentProps,
  Fragment,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  DefaultZIndexes,
  LabelList,
  Line,
  type Rectangle,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useYAxisDomain,
  XAxis,
  YAxis,
  ZIndexLayer,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  BarCenteredLine,
  ChartLegend,
  ChartPlaceholder,
  type ChartSeries,
  ChartTip,
  type ChartTipRow,
  chartAxis,
  chartGrid,
  chartTooltipProps,
  formatCompact,
  formatDateKo,
  formatMonthDay,
  formatNumber,
  hatchPattern,
  INITIAL_DIMENSION,
  koDayAxis,
  type LegendItem,
  minWidthRect,
  roundTicks,
  seriesColor,
  stepTicks,
  TodayLine,
  useDotLayer,
  useMounted,
} from "./chart-parts";
import { useChartZoom, useZoomFlip } from "./chart-zoom";
import { ChartZoomControl } from "./chart-zoom-control";

type Row = Record<string, unknown>;

/**
 * A reference line drawn under the series (a 7-day moving average, say): a dashed line as thick as the series, read
 * from a row field. `tip` adds the day's numbers to the actuals-only tooltip.
 */
export type ChartGuide = {
  name: string;
  color?: string;
  valueKey: string;
  tip?: (row: Row) => string | null;
};

/** A forecast trio for one series: Avg dashed, Max and Min fainter; `key` names the series it continues. */
export type ProjectionGroup = {
  key?: string;
  name: string;
  color?: string;
  maxKey: string;
  avgKey: string;
  minKey: string;
  separatorBefore?: boolean;
  /** A dot and a haloed "<name> <value>" at the last Avg row. */
  endLabel?: boolean;
};

/** The shaded range of a projection: `dataKey` holds [low, high] per row. */
export type ProjectionBand = {
  key: string;
  name: string;
  color?: string;
  dataKey: string;
};

/** A shaded span of rows (a campaign, a policy window); one day still shows as a 6px band. */
export type TrendWindow = {
  from: string;
  to: string;
  color?: string;
  label?: string;
};

/** A dashed vertical line at a row. */
export type TrendMarker = { x: string; color?: string; label?: string };

/** A horizontal reference line (an index's 100, a baseline); its value becomes a y tick. */
export type TrendYMarker = {
  y: number;
  color?: string;
  label?: string;
  dasharray?: string;
};

/** What the `lanes` render function receives: the zoomed rows, the x ticks, the plot insets and the hover wiring. */
export type TrendLanesContext = {
  data: Row[];
  ticks?: string[];
  xKey: string;
  left: number;
  right: number;
  onMarkerHover: (date: string, color: string, open: boolean) => void;
};

/** The y axis width; the zoom hook takes it as the plot's left edge. */
const Y_AXIS_WIDTH = 44;
const MUTED = "var(--muted-foreground)";
const EMPTY: Row[] = [];
/** A ReferenceArea shape at least 6px wide, so a one-day window on a point scale still shows. */
const MinRect = minWidthRect(6);

/** Ticks over lo..hi with 0 always inside (signed or around-100 series). */
const spanTicks = (lo: number, hi: number) => stepTicks(lo, hi, 0);
const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isEstimated = (s: ChartSeries, row: Row) =>
  Boolean(s.estimatedKey && row[s.estimatedKey]);

/** Two decimals keep the paths short without moving a bar by a visible amount. */
const px = (n: number) => Math.round(n * 100) / 100;

type BandBar = {
  key: string;
  color: string;
  /** The row field of the forecast drawn fainter where no actual stands (today has both, so only its actual shows). */
  forecastKey?: string;
  /** The row field flagging an estimated actual, which is drawn hatched. */
  estimatedKey?: string;
  opacity: number;
  forecastOpacity: number;
};

/**
 * A bar chart's bars as one path per series and kind (actuals, estimated ones hatched, then forecasts fainter), in
 * place of recharts' <Bar>, which renders every day as components of its own: some 2,000 for a year, which stalls a
 * period switch. The geometry is recharts' (a band per row; a slot of the band less barCategoryGap's 10% each side,
 * floored to whole pixels; bars at most 12px, centered in it, top corners rounded 2px), so the axis labels, the 오늘
 * line and the tooltip cursor stand where they did. Series overlay in order, each still reaching its own value, with
 * the part a later bar covers left out of the bar under it; the y scale is the axis's own. The hatch patterns sit in
 * the chart's <defs>, outside this layer: a period flip hides the layer (visibility, which the tiles would inherit)
 * while its clones still fill from them by id.
 */
function BandBars({ data, bars }: { data: Row[]; bars: BandBar[] }) {
  const plot = usePlotArea();
  const domain = useYAxisDomain();
  if (!plot || !num(domain?.[0]) || !num(domain[1])) return null;
  const low = domain[0];
  const high = domain[1];
  const y = (v: number) =>
    plot.y + plot.height * (1 - (v - low) / (high - low || 1));
  const band = plot.width / Math.max(1, data.length);
  const room = band * 0.8;
  const slot = room > 1 ? Math.floor(room) : room;
  const width = Math.min(slot, 12);
  const inset = band * 0.1 + (slot - width) / 2;
  const base = y(Math.max(low, 0));
  const amount = (v: unknown) => (num(v) && v > 0 ? v : 0);
  const estimated = (b: BandBar, row: Row) =>
    Boolean(b.estimatedKey && row[b.estimatedKey]);
  // The value a bar stands at on a row: its actual, else its forecast.
  const drawn = (b: BandBar, row: Row) =>
    amount(
      row[b.key] != null ? row[b.key] : b.forecastKey && row[b.forecastKey],
    );
  // A bar clears the bars it overlays, so its own color shows (and the plot between a hatched bar's stripes), not the
  // bar under it. One dimmed under a highlighted bar doesn't: the highlighted bar keeps its full height.
  const clears = (over: BandBar, under: BandBar) =>
    over.opacity >= under.opacity;
  // A bar's floor on a row: the top of the tallest bar clearing it there, else the axis.
  const floor = (k: number, row: Row) =>
    bars
      .slice(k + 1)
      .reduce(
        (top, b) => (clears(b, bars[k]) ? Math.max(top, drawn(b, row)) : top),
        0,
      );
  // A clearing bar's top is square where a bar it cleared goes on above it, the two meeting flush as stacked bars do.
  const capped = (k: number, row: Row) =>
    bars
      .slice(0, k)
      .some((b) => clears(bars[k], b) && drawn(b, row) > drawn(bars[k], row));
  // Each row's bar from its floor to its value, top corners rounded unless square.
  const path = (
    value: (row: Row) => unknown,
    floorOf: (row: Row) => number,
    square: (row: Row) => boolean,
  ) => {
    let d = "";
    data.forEach((row, i) => {
      const v = value(row);
      const from = floorOf(row);
      if (!num(v) || !(v > from)) return;
      const bottom = from > 0 ? y(Math.max(low, from)) : base;
      const top = y(v);
      const r = square(row) ? 0 : Math.min(2, width / 2, bottom - top);
      const x = plot.x + i * band + inset;
      d += `M${px(x)},${px(bottom)}V${px(top + r)}A${px(r)},${px(r)} 0 0 1 ${px(x + r)},${px(top)}H${px(x + width - r)}A${px(r)},${px(r)} 0 0 1 ${px(x + width)},${px(top + r)}V${px(bottom)}Z`;
    });
    return d;
  };
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.bar}>
      <g className="recharts-layer recharts-bar">
        {bars.map((b, k) => (
          <Fragment key={b.key}>
            <path
              d={path(
                (row) => (estimated(b, row) ? null : row[b.key]),
                (row) => floor(k, row),
                (row) => capped(k, row),
              )}
              fill={b.color}
              fillOpacity={b.opacity}
            />
            {b.estimatedKey && (
              // The path's opacity dims the hatching with the rest when another series is highlighted.
              <path
                d={path(
                  (row) => (estimated(b, row) ? row[b.key] : null),
                  (row) => floor(k, row),
                  (row) => capped(k, row),
                )}
                fill={`url(#h-${b.key})`}
                fillOpacity={b.opacity}
              />
            )}
            {b.forecastKey && (
              <path
                d={path(
                  (row) =>
                    row[b.key] == null ? row[b.forecastKey as string] : null,
                  (row) => floor(k, row),
                  (row) => capped(k, row),
                )}
                fill={b.color}
                fillOpacity={b.forecastOpacity}
              />
            )}
          </Fragment>
        ))}
      </g>
    </ZIndexLayer>
  );
}

/** A label haloed in the background color, so it stays legible over lines and bands. */
function HaloText({
  x,
  y,
  text,
  color,
  anchor,
  fontSize,
  fontWeight,
  baseline,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  anchor: "start" | "end";
  fontSize: number;
  fontWeight: number;
  baseline?: "central";
}) {
  return (
    <text
      dominantBaseline={baseline}
      fill={color}
      fontSize={fontSize}
      fontWeight={fontWeight}
      paintOrder="stroke"
      stroke="var(--background)"
      strokeWidth={3}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {text}
    </text>
  );
}

/**
 * The chip variant of the 오늘 line as a ReferenceLine shape; on a bar chart it moves onto the bar's drawn center, as
 * BarCenteredLine does for the text variant.
 */
function TodayChip({
  bars,
  x,
  bottom,
  label,
}: {
  bars?: number;
  x: number;
  bottom: number;
  label: string;
}) {
  const plot = usePlotArea();
  const slot = plot && bars ? (plot.width / bars) * 0.8 : 0;
  const shift = slot > 1 ? (slot - Math.floor(slot)) / 2 : 0;
  return <TodayLine bottom={bottom} label={label} x={x - shift} />;
}

type LabelBox = {
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
};
type RectProps = ComponentProps<typeof Rectangle>;
type TipRow = ChartTipRow & { groupKey?: string };

/**
 * Daily or monthly trends as areas, lines or bars: actual series with per-series forecasts (dashed continuations or
 * Avg/Max/Min projection groups with a shaded range), a target line named on the y axis, guides under the series,
 * shaded windows, vertical and horizontal markers, a selected range and the 오늘 line. The tooltip follows the cursor
 * line without easing, pinned to the plot's top, with the hover dots drawn above it. Ctrl + wheel zooms around the
 * pointer, dragging a zoomed plot pans, and the control above the plot does the same; a period switch zooms the old
 * view into the new range. Nothing animates in: the chart is complete on its first paint. Row keys are ISO dates
 * ("YYYY-MM-DD") or months ("YYYY-MM"), which sort in time order as strings.
 */
export function TrendChart({
  data: sourceData,
  xKey = "key",
  series: seriesIn,
  kind = "area",
  curve = "monotone",
  today,
  todayLabel = "text",
  targetKey,
  targetLabel,
  targetSeries: targetSeriesIn = [],
  projectionGroups: groupsIn = [],
  projectionBands: bandsIn = [],
  forecastRange = true,
  rangeLabel,
  band,
  guides: guidesIn = [],
  windows = [],
  markers = [],
  yMarkers = [],
  yDomain,
  selectedRange,
  rangeLabels,
  showRangeStartLine = true,
  showShading,
  highlight = null,
  height = 260,
  fill = false,
  className,
  legend = false,
  showChartKey = false,
  showChartKeyRow = true,
  koDays = false,
  monthly = false,
  dots = false,
  yEndsOnly = false,
  tightRight = false,
  unit = "",
  format = formatNumber,
  formatY = formatCompact,
  formatX = formatMonthDay,
  denseTooltip = false,
  actualsOnlyTooltip = false,
  tooltipExtra,
  zoom: zoomOn = true,
  zoomSlot,
  zoomResetKey,
  flip = true,
  estimateNote,
  lanes,
  label,
}: {
  /** Rows in x order: the `xKey` field (an ISO date or month) plus the series fields; the zoom slices them. */
  data: Row[];
  /** The category field; "key" by default. */
  xKey?: string;
  /** The actual series: areas by default, `line` without fill, `dashed`, `dotted`, `stack`, `forecastKey`, … */
  series: ChartSeries[];
  /** bar draws every non-line series as bars (forecasts fainter, estimated ones hatched). */
  kind?: "area" | "bar";
  /** How lines join the points: monotone curves, or linear segments that meet each value exactly. */
  curve?: "monotone" | "linear";
  /** The row key of 오늘: its line, the tooltip's 전망 badge after it and the today-aware date ticks. */
  today?: string;
  /** text: a 2px line with 오늘 on top; chip: a 1.5px line under a primary chip reading "오늘 MM-DD". */
  todayLabel?: "text" | "chip";
  /** The row field of the target line (dotted stepAfter; solid per-level segments when `targetLabel` is set). */
  targetKey?: string;
  /** Names the target on the y axis (e.g. 목표) at the value where its line starts in view. */
  targetLabel?: string;
  /** Extra long-dashed target lines, each with a haloed "<name> <value>" at its end. */
  targetSeries?: ChartSeries[];
  projectionGroups?: ProjectionGroup[];
  projectionBands?: ProjectionBand[];
  /** false hides the projections' Max/Min lines, the band between them and the tooltip's range. */
  forecastRange?: boolean;
  /** Names the shaded range (e.g. 예측 범위(80%)): a swatch after the legend and the tooltip's range line. */
  rangeLabel?: string;
  /** The row field of an uncertainty band drawn as a primary area. */
  band?: string;
  /** Reference lines under the series (see ChartGuide). */
  guides?: ChartGuide[];
  windows?: TrendWindow[];
  markers?: TrendMarker[];
  yMarkers?: TrendYMarker[];
  /**
   * A fixed y range, so zooming keeps it: from 0 rounded up, or, with a low end other than 0, from that low end in round
   * steps. "auto" spans the data's min..max with 0 inside.
   */
  yDomain?: [number, number] | "auto";
  /** Primary shading over these rows, with a dashed line at each end in view. */
  selectedRange?: { start: string; end: string };
  /** Labels the selected range's start: the first just left of it, the second at the top of the shading. */
  rangeLabels?: [string, string];
  showRangeStartLine?: boolean;
  /** Area fills, windows, the band and the projection bands; off for a lines-only look. */
  showShading?: boolean;
  /** A series key kept at full strength; every other series dims. */
  highlight?: string | null;
  /** The plot's height, or a CSS length; the minimum with `fill`. */
  height?: number | string;
  /** Grows to fill its flex parent, keeping height as the minimum. */
  fill?: boolean;
  /** Merged onto the outer wrapper. */
  className?: string;
  /** Names the series (a swatch each) in the band above the plot. */
  legend?: boolean;
  /** The ━ 실적 ┈ Max ╌ Avg ┈ Min key row, today-aware date ticks and the tooltip grouped by series. */
  showChartKey?: boolean;
  /** false drops only showChartKey's key row; its date ticks and grouped tooltip stay. */
  showChartKeyRow?: boolean;
  /** Korean two-row x ticks and a Korean tooltip date. */
  koDays?: boolean;
  /** "YYYY-MM" keys: ticks as "N월", today snapped to its month, targets linear. */
  monthly?: boolean;
  /** Lines with a dot at every point and a gap at a null, no fill. */
  dots?: boolean;
  /** Only the floor and the top of the y range keep a tick and a grid line (plus the named target's and yMarkers'). */
  yEndsOnly?: boolean;
  /** The plot ends 8px short of the box's right edge instead of 12px, the zoom control's right end with it. */
  tightRight?: boolean;
  /** The tooltip's value suffix. */
  unit?: string;
  /** Tooltip values. */
  format?: (v: number) => string;
  /** Y ticks. */
  formatY?: (v: number) => string;
  /** X ticks when neither koDays nor monthly; "yy.mm.dd" when the rows span years. */
  formatX?: (key: string) => string;
  /** The tooltip's dense layout: tight spacing for a few short rows. */
  denseTooltip?: boolean;
  /** The simple tooltip: the target, then "<series> 실적" rows, then the guides' tips. */
  actualsOnlyTooltip?: boolean;
  /** Rendered under the tooltip's rows. */
  tooltipExtra?: (row: Row, x: string) => ReactNode;
  /** Ctrl + wheel and drag zoom with the control; false renders no control and binds no listeners. */
  zoom?: boolean;
  /**
   * Renders the zoom control into this element (a section header's actions, say) instead of over the plot. Null
   * while that element mounts: the control waits for it rather than flashing over the plot first.
   */
  zoomSlot?: HTMLElement | null;
  /** Starts the zoom over whenever it changes (a period or filter switch), even when the rows stay the same. */
  zoomResetKey?: string;
  /** Animates a change of the rows' extent as a zoom from the old view into the new range. */
  flip?: boolean;
  /** The footnote under an estimated day in view: "빈 점은 추정값 - <note>" (bars: 빗금은 추정값). */
  estimateNote?: string;
  /** Lanes rendered under the x labels, inside the wrapper, with the zoomed rows and the hover wiring. */
  lanes?: (ctx: TrendLanesContext) => ReactNode;
  /** The figure's aria-label. */
  label?: string;
}) {
  const keyOf = (row: Row) => String(row[xKey]);
  const right = tightRight ? 8 : 12;
  const series = seriesIn.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColor(i),
  }));
  const colorOf = (key: string, fallback: string) =>
    series.find((s) => s.key === key)?.color ?? fallback;
  const projectionGroups = groupsIn.map((g, i) => ({
    ...g,
    color: g.color ?? colorOf(g.key ?? g.name, seriesColor(i)),
  }));
  const projectionBands = bandsIn.map((b, i) => ({
    ...b,
    color: b.color ?? colorOf(b.key, seriesColor(i)),
  }));
  const targetSeries = targetSeriesIn.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColor(series.length + i),
  }));
  const guides = guidesIn.map((g) => ({ ...g, color: g.color ?? MUTED }));
  const shading = showShading ?? true;
  // The MonthlyLineChart look: lines with dots, unless the caller asked for the fills in so many words.
  const dotLines = dots && showShading !== true;

  const zoom = useChartZoom(
    sourceData,
    keyOf,
    7,
    Y_AXIS_WIDTH,
    right,
    zoomResetKey,
  );
  const data = zoomOn ? zoom.data : sourceData;
  const mounted = useMounted();
  const { layer, overDot } = useDotLayer();
  // A period switch zooms the old view into the new range instead of cutting to it.
  const host = useRef<HTMLDivElement | null>(null);
  const overlay = useRef<SVGSVGElement | null>(null);
  const zoomRef = zoom.ref;
  const hostRef = useCallback(
    (element: HTMLDivElement | null) => {
      host.current = element;
      zoomRef(zoomOn ? element : null);
    },
    [zoomRef, zoomOn],
  );
  // The lane marker whose list is open: its date is drawn through the plot in the marker's color.
  const [laneHover, setLaneHover] = useState<{
    date: string;
    color: string;
  } | null>(null);

  /** Series with an estimated day in view. */
  const estimatedSeries = new Set(
    series
      .filter((s) => data.some((row) => isEstimated(s, row)))
      .map((s) => s.key),
  );
  const keyRow = showChartKey && showChartKeyRow;
  // With a legend or the key row, that row holds the zoom control at its right, with a clear gap down to the plot;
  // the 오늘 label, over its line's top end, sits in that gap well under the control.
  const plotTop = keyRow ? 52 : legend ? 52 : dots ? 34 : 32;
  const firstKey = keyOf(data[0] ?? {});
  const lastKey = keyOf(data[data.length - 1] ?? {});
  // Zoom can pan the selected range out of view; its shading and labels draw only while it overlaps the rows.
  const rangeShown =
    !!selectedRange &&
    selectedRange.start <= lastKey &&
    selectedRange.end >= firstKey;
  // Row of the range start (0 when it lies before the window). Each label beside it needs about 8% of the plot's
  // width, or it would spill into the axis gutter or past the right edge.
  const startAt = selectedRange
    ? data.findIndex((row) => keyOf(row) >= selectedRange.start)
    : -1;
  // The range's ends as rows on the axis, the first at or after its start and the last at or before its end: rows
  // left out (business days only) can drop the exact days, and recharts places these only on a category it has.
  const rangeStartKey = keyOf(data[Math.max(0, startAt)] ?? {});
  let rangeEnd = data.length - 1;
  while (
    selectedRange &&
    rangeEnd > 0 &&
    keyOf(data[rangeEnd]) > selectedRange.end
  )
    rangeEnd--;
  const rangeEndKey = keyOf(data[rangeEnd] ?? {});
  const span = Math.max(1, data.length - 1);
  const roomBefore = startAt / span >= 0.08;
  const roomAfter = startAt >= 0 && (data.length - 1 - startAt) / span >= 0.08;
  // Monthly rows snap 오늘 to its month key.
  const todayMarker = today ? (monthly ? today.slice(0, 7) : today) : undefined;
  const todayIndex = todayMarker
    ? data.findIndex((row) => keyOf(row) === todayMarker)
    : -1;
  const spansYears = firstKey.slice(0, 4) !== lastKey.slice(0, 4);
  // Bar mode's bar series, in order: the first sets the slot, the rest overlay it.
  const barKeys =
    kind === "bar" ? series.filter((s) => !s.line).map((s) => s.key) : [];
  const groupOf = (key: string) =>
    projectionGroups.find((g) => (g.key ?? g.name) === key);

  // Today-aware date ticks: about six, with today's kept and the ones crowding it dropped.
  const tickStep = Math.max(1, Math.ceil(data.length / 6));
  const dateTicks =
    showChartKey && todayIndex >= 0
      ? data
          .filter(
            (_, index) =>
              index === todayIndex ||
              (index % tickStep === 0 &&
                Math.abs(index - todayIndex) >= tickStep / 2),
          )
          .map(keyOf)
      : undefined;

  // The y range. Bars draw outside recharts (BandBars), so a bar chart's range is set here from the tallest bar in
  // view; an end label needs 12% of headroom so it never clips; "auto" spans the values with 0 inside.
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  let barTop = 0;
  const valueKeys = [
    ...series.flatMap((s) => [s.key, s.forecastKey ?? []].flat()),
    ...projectionGroups.flatMap((g) => [g.maxKey, g.avgKey, g.minKey]),
    ...targetSeries.map((s) => s.key),
    ...(targetKey ? [targetKey] : []),
  ];
  const rangeKeys = [
    ...projectionBands.map((b) => b.dataKey),
    ...(band ? [band] : []),
  ];
  for (const row of data) {
    for (const k of valueKeys) {
      const v = row[k];
      if (!num(v)) continue;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    for (const k of rangeKeys) {
      const v = row[k];
      if (!Array.isArray(v)) continue;
      for (const edge of v) {
        if (!num(edge)) continue;
        lo = Math.min(lo, edge);
        hi = Math.max(hi, edge);
      }
    }
    for (const s of series) {
      if (s.line || kind !== "bar") continue;
      const avgKey = groupOf(s.key)?.avgKey;
      for (const v of [row[s.key], avgKey ? row[avgKey] : null])
        if (num(v) && v > barTop) barTop = v;
    }
  }
  for (const m of yMarkers) {
    lo = Math.min(lo, m.y);
    hi = Math.max(hi, m.y);
  }
  if (lo > hi) {
    lo = 0;
    hi = 0;
  }
  const hasEndLabel =
    series.some((s) => s.endLabel) || projectionGroups.some((g) => g.endLabel);
  const headroom = hasEndLabel ? 1.12 : 1;
  let roundY: number[] | undefined;
  if (yDomain === "auto") roundY = spanTicks(lo, hi > 0 ? hi * headroom : hi);
  else if (yDomain && yDomain[0] !== 0)
    // A low end other than 0 starts the axis there, so lines far above 0 keep their shape.
    roundY = stepTicks(yDomain[0], yDomain[1] * headroom, yDomain[0]);
  else if (yDomain)
    roundY = yDomain[1] > 0 ? roundTicks(yDomain[1] * headroom) : undefined;
  else if (kind === "bar")
    roundY = barTop > 0 ? roundTicks(barTop * headroom) : undefined;
  else if (hasEndLabel && hi > 0) roundY = roundTicks(hi * headroom);
  if (roundY) {
    // A y marker outside the round range extends it by whole steps.
    const step = roundY.length > 1 ? roundY[1] - roundY[0] : 1;
    for (const m of yMarkers) {
      while (m.y > roundY[roundY.length - 1])
        roundY.push(roundY[roundY.length - 1] + step);
      while (m.y < roundY[0]) roundY.unshift(roundY[0] - step);
    }
  }
  const yMin = roundY?.[0] ?? 0;
  const yMax = roundY?.[roundY.length - 1];
  // A named target gets its own tick, labelled, at the value where its line starts (the left end of the view).
  const targetAt =
    targetLabel && targetKey && yMax !== undefined
      ? data
          .map((row) => row[targetKey])
          .find((v): v is number => num(v) && v <= yMax)
      : undefined;
  // The named target's levels in view, as runs of one value; each run reaches the first row of the next.
  const targetRuns: { from: string; to: string; value: number }[] = [];
  if (targetLabel && targetKey)
    for (const row of data) {
      const v = row[targetKey];
      if (!num(v)) continue;
      const key = keyOf(row);
      const run = targetRuns[targetRuns.length - 1];
      if (run) run.to = key;
      if (run?.value !== v) targetRuns.push({ from: key, to: key, value: v });
    }
  const markerYs = yMarkers.map((m) => m.y);
  const yTicks =
    roundY &&
    [
      ...new Set([
        ...(yEndsOnly ? [yMin, yMax as number] : roundY),
        ...(targetAt === undefined ? [] : [targetAt]),
        ...markerYs,
      ]),
    ].sort((a, b) => a - b);

  // koDays needs the ticks up front, to compare each with the one before it. A window of up to 60 rows is labeled
  // row by row, the month on a second line where it turns; longer spans mark only the first of each month, the year
  // on the second line.
  const koAxis = koDays && !monthly ? koDayAxis(data.map(keyOf)) : undefined;
  const xTicks = koAxis ? koAxis.ticks : dateTicks;
  const koTick = koAxis?.tick;

  // The last row with a value, for the end labels.
  const lastValueAt = (key: string) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i][key];
      if (num(v)) return { x: keyOf(data[i]), y: v };
    }
    return null;
  };
  const endLabels = [
    ...series.flatMap((s) => {
      if (!s.endLabel) return [];
      const at =
        (s.forecastKey && lastValueAt(s.forecastKey)) || lastValueAt(s.key);
      return at ? [{ ...at, name: s.name, color: s.color }] : [];
    }),
    ...projectionGroups.flatMap((g) => {
      if (!g.endLabel) return [];
      const at = lastValueAt(g.avgKey);
      return at ? [{ ...at, name: g.name, color: g.color }] : [];
    }),
  ];
  const endLabelContent =
    (text: string, color: string) =>
    ({ viewBox }: LabelBox) => (
      <HaloText
        anchor="start"
        baseline="central"
        color={color}
        fontSize={11}
        fontWeight={700}
        text={text}
        x={(viewBox?.x ?? 0) + (viewBox?.width ?? 0) + 10}
        y={(viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2}
      />
    );

  useZoomFlip(host, overlay, flip ? sourceData : EMPTY, data, keyOf, {
    band: kind === "bar",
    yTop: yMax,
  });

  // Small charts and the dots look render a placeholder until mounted, so the server markup never holds a
  // mis-measured chart; the compact zoom control goes with them.
  const small = dots || (typeof height === "number" && height < 200);
  if (small && !mounted)
    return (
      <ChartPlaceholder
        className={cn(fill && "flex-1", className)}
        height={height}
      />
    );

  const legendItems: LegendItem[] = [
    ...series.map(
      (s): LegendItem => ({
        name: s.name,
        color: s.color,
        kind:
          kind === "bar" && !s.line
            ? "square"
            : s.dashed
              ? "dashed"
              : s.dotted
                ? "dotted"
                : "line",
      }),
    ),
    ...(rangeLabel && forecastRange && projectionBands.length > 0
      ? [{ name: rangeLabel, color: MUTED, kind: "range" } as LegendItem]
      : []),
  ];
  const onMarkerHover = (date: string, color: string, open: boolean) =>
    setLaneHover((current) =>
      open ? { date, color } : current?.date === date ? null : current,
    );
  const laneLine = (color: string) =>
    kind === "bar" ? (
      <BarCenteredLine bars={data.length} stroke={color} />
    ) : undefined;
  const value = (v: unknown) => `${format(Number(v))}${unit}`;
  // A labelled chart is a figure; an unlabelled one is a plain box (a ChartBox or a card names it already).
  const Wrapper = label ? "figure" : "div";

  return (
    <Wrapper
      aria-label={label}
      className={cn(fill && "flex min-h-0 flex-1 flex-col", className)}
    >
      <div
        className={cn("relative", fill && "flex-1")}
        ref={hostRef}
        style={{
          ...(fill ? { minHeight: height } : { height }),
          ...zoom.interactionStyle,
        }}
      >
        {zoomOn &&
          (zoomSlot === undefined ? (
            <ChartZoomControl
              className={cn(legend && "top-0", tightRight && "right-2")}
              compact={small}
              zoom={zoom}
            />
          ) : (
            zoomSlot &&
            createPortal(<ChartZoomControl inline zoom={zoom} />, zoomSlot)
          ))}
        {legend && (
          <ChartLegend
            className="absolute top-0 left-12 z-10"
            items={legendItems}
          />
        )}
        {keyRow && (
          <div className="pointer-events-none absolute -top-2 left-12 z-10 flex h-6 items-center gap-3 text-[10px] text-muted-foreground">
            <span>━ 실적</span>
            {projectionGroups.length > 0 && (
              <>
                <span>┈ Max</span>
                <span>╌ Avg</span>
                <span>┈ Min</span>
              </>
            )}
            {targetSeries.length > 0 && <span>┄ 목표</span>}
          </div>
        )}
        <ResponsiveContainer
          height="100%"
          initialDimension={INITIAL_DIMENSION}
          minHeight={small && typeof height === "number" ? height : undefined}
          minWidth={small ? 100 : undefined}
          width="100%"
        >
          <ComposedChart
            data={data}
            margin={{ top: plotTop, right, bottom: 0, left: 0 }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  id={`g-${s.key}`}
                  key={s.key}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
              {kind === "bar" &&
                series
                  .filter((s) => !s.line && s.estimatedKey)
                  .map((s) => hatchPattern(`h-${s.key}`, s.color))}
            </defs>
            {yEndsOnly && yMax !== undefined ? (
              <CartesianGrid
                horizontalValues={[yMin, yMax, ...markerYs]}
                stroke="var(--border)"
                strokeDasharray="3 4"
                vertical={false}
              />
            ) : (
              chartGrid
            )}
            <XAxis
              {...chartAxis}
              dataKey={xKey}
              height={koTick ? 34 : undefined}
              interval={xTicks ? 0 : undefined}
              minTickGap={28}
              tick={koTick ?? chartAxis.tick}
              tickFormatter={(v) =>
                monthly
                  ? `${Number(String(v).slice(5, 7))}월`
                  : spansYears
                    ? String(v).slice(2).replaceAll("-", ".")
                    : formatX(String(v))
              }
              ticks={xTicks}
            />
            <YAxis
              {...chartAxis}
              domain={yMax !== undefined ? [yMin, yMax] : undefined}
              // Every chosen tick stays: the formatter below blanks a round tick next to the target's name, so
              // recharts' crowding check must not also drop the target's tick, leaving the axis without a label.
              interval={yTicks ? 0 : undefined}
              tickFormatter={(v) => {
                const n = Number(v);
                if (n === targetAt) return targetLabel ?? "";
                // The baseline goes unlabeled, as on every kit chart (withoutZero).
                if (n === 0) return "";
                // A round tick right next to the target's name would overlap it.
                if (
                  targetAt !== undefined &&
                  yMax &&
                  Math.abs(n - targetAt) < yMax * 0.06
                )
                  return "";
                return formatY(n);
              }}
              ticks={yTicks}
              width={Y_AXIS_WIDTH}
            />
            {shading &&
              windows.map((w) => {
                const color = w.color ?? "var(--primary)";
                return (
                  <ReferenceArea
                    fill={color}
                    fillOpacity={0.09}
                    ifOverflow="hidden"
                    key={`${w.from}${w.label}`}
                    label={
                      w.label
                        ? {
                            value: w.label,
                            position: "insideTopLeft",
                            fontSize: 10,
                            fill: color,
                          }
                        : undefined
                    }
                    shape={MinRect}
                    x1={w.from}
                    x2={w.to}
                  />
                );
              })}
            {selectedRange && rangeShown && (
              <ReferenceArea
                fill="var(--primary)"
                fillOpacity={0.07}
                ifOverflow="hidden"
                label={
                  rangeLabels && roomAfter && startAt <= 0
                    ? {
                        value: rangeLabels[1],
                        position: "insideTopLeft",
                        fontSize: 10,
                        fill: MUTED,
                      }
                    : undefined
                }
                // Bars span whole bands, so recharts runs the shading band edge to band edge; a range boundary in
                // view moves in half a band instead, to the bar's middle where the start and 오늘 lines stand.
                shape={
                  kind === "bar"
                    ? (props: RectProps) => {
                        const bands = data.filter((row) => {
                          const key = keyOf(row);
                          return key >= rangeStartKey && key <= rangeEndKey;
                        }).length;
                        const half =
                          (props.width ?? 0) / Math.max(1, bands) / 2;
                        const left = selectedRange.start >= firstKey ? half : 0;
                        const trim = selectedRange.end <= lastKey ? half : 0;
                        return (
                          <MinRect
                            {...props}
                            fill="var(--primary)"
                            fillOpacity={0.07}
                            width={Math.max(
                              0,
                              (props.width ?? 0) - left - trim,
                            )}
                            x={(props.x ?? 0) + left}
                          />
                        );
                      }
                    : MinRect
                }
                stroke="none"
                x1={rangeStartKey}
                x2={rangeEndKey}
              />
            )}
            {selectedRange &&
              rangeShown &&
              startAt > 0 &&
              (showRangeStartLine || rangeLabels) && (
                <ReferenceLine
                  label={
                    roomBefore
                      ? {
                          value: rangeLabels?.[0] ?? "조회 시작",
                          position: "insideTopRight",
                          fontSize: 10,
                          fill: MUTED,
                        }
                      : undefined
                  }
                  stroke={showRangeStartLine ? "var(--primary)" : "none"}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  x={rangeStartKey}
                />
              )}
            {/* The range's end, when it falls before the last row, closes the shading with the same dashed line. */}
            {selectedRange &&
              rangeShown &&
              rangeEnd < data.length - 1 &&
              showRangeStartLine && (
                <ReferenceLine
                  stroke="var(--primary)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  x={rangeEndKey}
                />
              )}
            {/* With the start in view, the current period's label sits right of the same line, mirroring the first
                label (under bars the line is mid-band while the shading starts at the band's edge, so its own label
                would collide). */}
            {selectedRange &&
              rangeShown &&
              startAt > 0 &&
              rangeLabels &&
              roomAfter && (
                <ReferenceLine
                  label={{
                    value: rangeLabels[1],
                    position: "insideTopLeft",
                    fontSize: 10,
                    fill: MUTED,
                  }}
                  stroke="none"
                  x={rangeStartKey}
                />
              )}
            {shading && band && (
              <Area
                activeDot={false}
                dataKey={band}
                fill="var(--primary)"
                fillOpacity={
                  highlight ? (highlight === band ? 0.18 : 0.025) : 0.12
                }
                isAnimationActive={false}
                stroke="none"
                type={curve}
              />
            )}
            {shading &&
              forecastRange &&
              projectionBands.map((projectionBand) => {
                const emphasized =
                  !highlight || highlight === projectionBand.key;
                return (
                  <Area
                    activeDot={false}
                    connectNulls
                    dataKey={projectionBand.dataKey}
                    fill={projectionBand.color}
                    fillOpacity={highlight ? (emphasized ? 0.22 : 0.025) : 0.1}
                    isAnimationActive={false}
                    key={`projection-band-${projectionBand.key}`}
                    name={`${projectionBand.name} 예측 범위`}
                    stroke="none"
                    type={curve}
                  />
                );
              })}
            {kind === "bar" && (
              <BandBars
                bars={series
                  .filter((s) => !s.line)
                  .map((s) => {
                    const emphasized = !highlight || highlight === s.key;
                    // Actuals in the series' own color, solid, as the legend shows it.
                    return {
                      key: s.key,
                      color: s.color,
                      forecastKey: groupOf(s.key)?.avgKey,
                      estimatedKey: s.estimatedKey,
                      opacity: emphasized ? 1 : 0.12,
                      forecastOpacity: emphasized ? 0.35 : 0.08,
                    };
                  })}
                data={data}
              />
            )}
            {guides.map((g) => (
              // As thick as the series' own lines, with the same hover dot, so it reads as their companion.
              <Line
                activeDot={overDot({ r: 3 })}
                connectNulls
                dataKey={g.valueKey}
                dot={false}
                isAnimationActive={false}
                key={`guide-${g.valueKey}`}
                legendType="none"
                stroke={g.color}
                strokeDasharray="6 4"
                strokeWidth={2}
                tooltipType="none"
                type={curve}
              />
            ))}
            {barKeys.length > 0 && (
              // Draws nothing, but a <Bar> keeps recharts' automatic band scale, which centers the x labels and the
              // tooltip cursor on each band (naming scale="band" instead puts them at the band's start).
              <Bar
                dataKey={barKeys[0]}
                hide
                isAnimationActive={false}
                legendType="none"
                tooltipType="none"
              />
            )}
            {kind === "bar" && series.every((s) => !s.line) && (
              // The tooltip reads its row off a graphical item; with every bar in BandBars, an unseen line stands in.
              <Line
                activeDot={false}
                dataKey={barKeys[0]}
                dot={false}
                isAnimationActive={false}
                legendType="none"
                stroke="none"
              />
            )}
            {series.map((s) => {
              const emphasized = !highlight || highlight === s.key;
              const dasharray = s.dashed
                ? "5 4"
                : s.dotted
                  ? "0.1 4.5"
                  : undefined;
              if (kind === "bar" && s.line) {
                // A line layer, above the bars (an Area would sit under them).
                return (
                  <Line
                    activeDot={false}
                    connectNulls
                    dataKey={s.key}
                    dot={false}
                    isAnimationActive={false}
                    key={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeDasharray={dasharray}
                    strokeLinecap={s.dotted ? "round" : undefined}
                    strokeOpacity={emphasized ? 1 : 0.14}
                    strokeWidth={highlight && emphasized ? 3.2 : 2}
                    type={curve}
                  />
                );
              }
              // Bar series draw in BandBars, above.
              if (kind === "bar") return null;
              if (dotLines)
                // The dots look: a line with a dot at every point, a gap at a null, the hover dot inline.
                return (
                  <Line
                    activeDot={overDot({
                      r: 5,
                      fill: s.color,
                      strokeWidth: 2,
                      stroke: "var(--background)",
                    })}
                    connectNulls={false}
                    dataKey={s.key}
                    dot={overDot({
                      r: 3.5,
                      fill: s.color,
                      strokeWidth: 1.5,
                      stroke: "var(--background)",
                    })}
                    isAnimationActive={false}
                    key={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeDasharray={dasharray}
                    strokeLinecap={s.dotted ? "round" : undefined}
                    strokeOpacity={emphasized ? 1 : 0.14}
                    strokeWidth={highlight && emphasized ? 3.2 : 2.5}
                    type={curve}
                  />
                );
              return (
                <Area
                  activeDot={
                    emphasized ? overDot({ r: highlight ? 4 : 3 }) : false
                  }
                  connectNulls={!dots}
                  dataKey={s.key}
                  // Hollow dots on estimated days; undefined keeps the default (no dots).
                  dot={
                    estimatedSeries.has(s.key)
                      ? overDot(
                          ({
                            cx,
                            cy,
                            payload,
                          }: {
                            cx?: number;
                            cy?: number;
                            payload?: Row;
                          }) =>
                            cx != null &&
                            cy != null &&
                            payload != null &&
                            isEstimated(s, payload) ? (
                              <circle
                                cx={cx}
                                cy={cy}
                                fill="var(--background)"
                                r={2.5}
                                stroke={s.color}
                                strokeOpacity={emphasized ? 1 : 0.14}
                                strokeWidth={1.5}
                              />
                            ) : (
                              <g />
                            ),
                        )
                      : undefined
                  }
                  fill={shading && !s.line ? `url(#g-${s.key})` : "none"}
                  fillOpacity={emphasized ? 1 : 0.08}
                  isAnimationActive={false}
                  key={s.key}
                  name={s.name}
                  stackId={s.stack ? "a" : undefined}
                  stroke={s.color}
                  strokeDasharray={dasharray}
                  strokeLinecap={s.dotted ? "round" : undefined}
                  strokeOpacity={emphasized ? 1 : 0.14}
                  strokeWidth={highlight && emphasized ? 3.2 : 2}
                  type={curve}
                />
              );
            })}
            {/* Each series' forecast, dashed on from its actuals. */}
            {series.map((s) => {
              const emphasized = !highlight || highlight === s.key;
              return s.forecastKey ? (
                <Line
                  activeDot={kind === "bar" ? false : overDot()}
                  connectNulls
                  dataKey={s.forecastKey}
                  dot={false}
                  isAnimationActive={false}
                  key={`fc-${s.forecastKey}`}
                  name={`${s.name} (전망)`}
                  stroke={s.color}
                  strokeDasharray="4 4"
                  strokeOpacity={emphasized ? 1 : 0.14}
                  strokeWidth={highlight && emphasized ? 3 : 1.8}
                  type={curve}
                />
              ) : null;
            })}
            {projectionGroups.flatMap((group) => {
              const groupKey = group.key ?? group.name;
              // A bar series' projection draws as its fainter bars.
              if (kind === "bar" && barKeys.includes(groupKey)) return [];
              const emphasized = !highlight || highlight === groupKey;
              const opacity = emphasized ? 1 : 0.12;
              const edgeOpacity = emphasized ? 0.6 : 0.08;
              const edgeWidth = highlight && emphasized ? 2 : 1.3;
              const avgLine = (
                <Line
                  activeDot={overDot()}
                  connectNulls
                  dataKey={group.avgKey}
                  dot={false}
                  isAnimationActive={false}
                  key={`${group.name}-avg`}
                  name={`${group.name} · Avg`}
                  stroke={group.color}
                  strokeDasharray="5 4"
                  strokeOpacity={opacity}
                  strokeWidth={highlight && emphasized ? 3 : 2}
                  type={curve}
                />
              );
              // A bar chart shades a line's range where it has a projection band, without the Max/Min lines on it.
              const banded =
                kind === "bar" &&
                projectionBands.some((b) => b.key === groupKey);
              if (!forecastRange || banded) return [avgLine];
              return [
                <Line
                  activeDot={overDot()}
                  connectNulls
                  dataKey={group.maxKey}
                  dot={false}
                  isAnimationActive={false}
                  key={`${group.name}-max`}
                  name={`${group.name} · Max`}
                  stroke={group.color}
                  strokeDasharray="2 3"
                  strokeOpacity={edgeOpacity}
                  strokeWidth={edgeWidth}
                  type={curve}
                />,
                avgLine,
                <Line
                  activeDot={overDot()}
                  connectNulls
                  dataKey={group.minKey}
                  dot={false}
                  isAnimationActive={false}
                  key={`${group.name}-min`}
                  name={`${group.name} · Min`}
                  stroke={group.color}
                  strokeDasharray="1 4"
                  strokeOpacity={edgeOpacity}
                  strokeWidth={edgeWidth}
                  type={curve}
                />,
              ];
            })}
            {targetSeries.map((s) => (
              <Line
                activeDot={overDot()}
                connectNulls
                dataKey={s.key}
                dot={false}
                isAnimationActive={false}
                key={`target-${s.key}`}
                name={s.name}
                stroke={s.color}
                strokeDasharray="8 4"
                strokeWidth={2.5}
                type={monthly ? "linear" : "stepAfter"}
                zIndex={2000}
              >
                <LabelList
                  content={({ x, y, index, value }) =>
                    index === data.length - 1 && value != null ? (
                      <HaloText
                        anchor="end"
                        color={s.color}
                        fontSize={10}
                        fontWeight={600}
                        text={`${s.name} ${format(Number(value))}`}
                        x={Number(x) - 4}
                        y={Number(y) - 7}
                      />
                    ) : null
                  }
                  dataKey={s.key}
                  fill={s.color}
                  fontSize={10}
                  position="insideTopRight"
                />
              </Line>
            ))}
            {targetKey &&
              (targetLabel ? (
                // A named target's levels as separate horizontal segments, each running on to where the next level
                // starts, so a month's change shows as a step with no riser between the two.
                [
                  ...targetRuns.map((run) => (
                    <ReferenceLine
                      ifOverflow="hidden"
                      key={`target-${run.from}`}
                      segment={[
                        { x: run.from, y: run.value },
                        { x: run.to, y: run.value },
                      ]}
                      stroke="var(--foreground)"
                      strokeOpacity={0.55}
                      strokeWidth={1.5}
                    />
                  )),
                  // An unstroked line over the same values, for the hover dot the other lines show: filled in the
                  // target line's own gray, with the same ring as theirs.
                  <Line
                    activeDot={overDot({
                      r: 3,
                      fill: "var(--foreground)",
                      fillOpacity: 0.55,
                    })}
                    dataKey={targetKey}
                    dot={false}
                    isAnimationActive={false}
                    key="target-dot"
                    legendType="none"
                    stroke="none"
                    tooltipType="none"
                  />,
                ]
              ) : (
                <Line
                  activeDot={overDot({ r: 3, fill: "var(--foreground)" })}
                  dataKey={targetKey}
                  dot={false}
                  isAnimationActive={false}
                  stroke="var(--foreground)"
                  strokeDasharray="2 4"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  type={monthly ? "linear" : "stepAfter"}
                />
              ))}
            {endLabels.map((e) => (
              // The end callout: a ringed dot at the last forecast value with a haloed "<name> <value>" to its right.
              <ReferenceDot
                fill={e.color}
                ifOverflow="discard"
                key={`end-${e.name}`}
                label={endLabelContent(`${e.name} ${format(e.y)}`, e.color)}
                r={4}
                // Over the tooltip, as the line dots are.
                shape={overDot({
                  r: 4,
                  fill: e.color,
                  stroke: "var(--background)",
                  strokeWidth: 2,
                })}
                stroke="var(--background)"
                strokeWidth={2}
                x={e.x}
                y={e.y}
              />
            ))}
            {yMarkers.map((m) => (
              <ReferenceLine
                ifOverflow="hidden"
                key={`y-${m.y}${m.label}`}
                label={
                  m.label
                    ? {
                        value: m.label,
                        position: "insideTopRight",
                        fontSize: 10,
                        fill: m.color ?? MUTED,
                      }
                    : undefined
                }
                stroke={m.color ?? MUTED}
                strokeDasharray={m.dasharray ?? "4 3"}
                y={m.y}
              />
            ))}
            {markers.map((m) => {
              const color = m.color ?? MUTED;
              return (
                <ReferenceLine
                  key={`${m.x}${m.label}`}
                  label={
                    m.label
                      ? {
                          value: m.label,
                          position: "top",
                          fontSize: 10,
                          fill: color,
                        }
                      : undefined
                  }
                  stroke={color}
                  strokeDasharray="3 3"
                  strokeOpacity={0.8}
                  x={m.x}
                />
              );
            })}
            {laneHover && (
              <ReferenceLine
                ifOverflow="hidden"
                shape={laneLine(laneHover.color)}
                stroke={laneHover.color}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                x={laneHover.date}
                zIndex={2900}
              />
            )}
            {todayMarker &&
              todayIndex >= 0 &&
              (todayLabel === "chip" ? (
                <ReferenceLine
                  shape={(p: { x1?: number; y2?: number }) => (
                    <TodayChip
                      bars={kind === "bar" ? data.length : undefined}
                      bottom={p.y2 ?? 0}
                      label={`오늘 ${today?.slice(5) ?? ""}`}
                      x={p.x1 ?? 0}
                    />
                  )}
                  x={todayMarker}
                  zIndex={3000}
                />
              ) : (
                <ReferenceLine
                  label={{
                    value: "오늘",
                    position: "top",
                    offset: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    fill: "var(--primary)",
                  }}
                  shape={laneLine("var(--primary)")}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  x={todayMarker}
                  zIndex={3000}
                />
              ))}
            <Tooltip
              {...chartTooltipProps(plotTop)}
              content={({ active, payload, label: tipLabel }) => {
                if (!active || !payload?.length) return null;
                const strLabel = String(tipLabel);
                // koDays charts read their dates in Korean in the tooltip too: 2026년 12월 1일.
                const shownLabel =
                  koDays && !monthly ? formatDateKo(strLabel) : strLabel;
                const p = payload[0].payload as Row;
                if (actualsOnlyTooltip)
                  return (
                    <ChartTip
                      dense={denseTooltip}
                      extra={tooltipExtra?.(p, strLabel)}
                      label={strLabel}
                      rows={[
                        // The day's target first, as the line it is drawn with.
                        ...(targetKey
                          ? [
                              {
                                name: targetLabel ?? "목표",
                                color: "var(--foreground)",
                                value:
                                  p[targetKey] == null
                                    ? "-"
                                    : value(p[targetKey]),
                              },
                            ]
                          : []),
                        ...series.map((s) => ({
                          name: `${s.name} 실적`,
                          color: s.color,
                          value:
                            p[s.key] == null
                              ? "-"
                              : `${value(p[s.key])}${isEstimated(s, p) ? " (추정)" : ""}`,
                        })),
                        ...guides.flatMap((g) => {
                          const tip = g.tip?.(p);
                          return tip
                            ? [
                                {
                                  name: g.name,
                                  color: g.color,
                                  dashed: true,
                                  value: tip,
                                },
                              ]
                            : [];
                        }),
                      ]}
                    />
                  );
                const isFuture = today ? strLabel > today : false;
                const rows: TipRow[] = [];
                if (!isFuture) {
                  // Past or today: the actual values.
                  for (const s of series) {
                    const val = p[s.key];
                    // No actual yet (today, say) but its projection's forecast: that row below stands in for a "-".
                    const group = groupOf(s.key);
                    if (val == null && group && p[group.avgKey] != null)
                      continue;
                    rows.push({
                      name: s.name,
                      groupKey: s.key,
                      color: s.color,
                      separatorBefore: s.separatorBefore,
                      value:
                        val == null
                          ? "-"
                          : `${value(val)}${isEstimated(s, p) ? " (추정)" : ""}`,
                    });
                  }
                } else {
                  // Future dates: each series' forecast; a series with a projection group gets its forecast from
                  // that group's row instead.
                  for (const s of series) {
                    if (groupOf(s.key)) continue;
                    const fcVal = p[s.forecastKey ?? s.key];
                    if (fcVal != null)
                      rows.push({
                        groupKey: s.key,
                        name: s.name,
                        color: s.color,
                        dashed: true,
                        separatorBefore: s.separatorBefore,
                        value: value(fcVal),
                      });
                  }
                }
                // One row per projection group: the Avg forecast, with its 최소 ~ 최대 range beneath. Up to today the
                // actual row stands in for it (at today the forecast starts from that same value).
                for (const group of projectionGroups) {
                  const groupKey = group.key ?? group.name;
                  const maxVal = p[group.maxKey];
                  const avgVal = p[group.avgKey];
                  const minVal = p[group.minKey];
                  if (avgVal == null || (!isFuture && p[groupKey] != null))
                    continue;
                  const spread =
                    forecastRange &&
                    maxVal != null &&
                    minVal != null &&
                    Number(maxVal) !== Number(minVal);
                  rows.push({
                    groupKey,
                    name: group.name,
                    color: group.color,
                    dashed: true,
                    separatorBefore: group.separatorBefore,
                    value: (
                      <span className="flex flex-col items-end leading-tight">
                        <span>{value(avgVal)}</span>
                        {spread && (
                          <span className="text-[10px] font-normal text-foreground/80">
                            {rangeLabel ? `${rangeLabel} ` : ""}최소{" "}
                            {format(Number(minVal))} ~ 최대{" "}
                            {format(Number(maxVal))}
                          </span>
                        )}
                      </span>
                    ),
                  });
                }
                for (const s of targetSeries)
                  if (p[s.key] != null)
                    rows.push({
                      groupKey: s.groupKey,
                      name: s.name,
                      color: s.color,
                      dashed: true,
                      value: value(p[s.key]),
                    });
                if (targetKey && p[targetKey] != null)
                  rows.push({
                    name: "목표",
                    color: "var(--foreground)",
                    dashed: true,
                    value: value(p[targetKey]),
                  });
                for (const m of yMarkers)
                  if (m.label)
                    rows.push({
                      name: m.label,
                      color: m.color ?? MUTED,
                      dotted: true,
                      value: value(m.y),
                    });
                // Bar series (and their forecast bars) take square swatches, as in the legend.
                for (const row of rows)
                  row.square = barKeys.includes(row.groupKey ?? "");
                const tooltipRows = showChartKey
                  ? [...series.map((s) => s.key), undefined]
                      .flatMap((key) =>
                        rows.filter((row) => row.groupKey === key),
                      )
                      .map((row, index, ordered) => ({
                        ...row,
                        separatorBefore:
                          index > 0 &&
                          row.groupKey !== ordered[index - 1].groupKey,
                      }))
                  : rows;
                return (
                  <ChartTip
                    dense={denseTooltip}
                    extra={tooltipExtra?.(p, strLabel)}
                    label={
                      isFuture ? (
                        <>
                          {shownLabel}
                          <span className="ml-1.5 rounded bg-muted px-1 py-px align-middle text-[10px] font-medium text-foreground">
                            전망
                          </span>
                        </>
                      ) : (
                        shownLabel
                      )
                    }
                    rows={tooltipRows}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* useZoomFlip draws a period switch's zoom here, over the plot; empty otherwise. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          ref={overlay}
        />
        {layer}
      </div>
      {estimatedSeries.size > 0 && estimateNote && (
        // A footnote under the chart, small and muted: what marks an estimate, then how it comes about. The text
        // starts on the y axis line (the axis's 44px), the bullet hanging left of it.
        <ul className="mt-3 list-disc pl-[44px] text-[10px] text-muted-foreground">
          <li>
            {kind === "bar" ? "빗금은 추정값" : "빈 점은 추정값"} -{" "}
            {estimateNote}
          </li>
        </ul>
      )}
      {/* The lanes sit under the plot, below its x labels, so the chart's top row stays the legend and zoom. */}
      {lanes?.({
        data,
        ticks: xTicks,
        xKey,
        left: Y_AXIS_WIDTH,
        right,
        onMarkerHover,
      })}
    </Wrapper>
  );
}
