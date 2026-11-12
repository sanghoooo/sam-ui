"use client";

import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  type TooltipProps,
  usePlotArea,
  type XAxisTickContentProps,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INITIAL_DIMENSION } from "./chart-format";

// The pure helpers live in chart-format.ts (importable from server components); client code may import either module.
export * from "./chart-format";

/** Rendered as {chartGrid} by every cartesian chart: horizontal dotted lines only. */
export const chartGrid = (
  <CartesianGrid
    stroke="var(--border)"
    strokeDasharray="3 4"
    vertical={false}
  />
);

/** One row of a ChartTip. */
export type ChartTipRow = {
  color?: string;
  name: string;
  value: ReactNode;
  /** A dashed line's swatch. */
  dashed?: boolean;
  /** A dotted line's swatch. */
  dotted?: boolean;
  /** A bar series: a square swatch, fainter when dashed (a forecast bar). */
  square?: boolean;
  separatorBefore?: boolean;
};

/** One swatch of a ChartLegend. */
export type LegendItem = {
  name: string;
  color: string;
  kind?: "line" | "dashed" | "dotted" | "square" | "hatched" | "range";
};

/**
 * The tooltip body: a frosted surface (a faint card fill and a backdrop blur, no edge lines), a bold label over a
 * divider, then name/value rows, all in the text color so they read over the blurred plot. `extra` renders under
 * the rows inside the box. Pure render, no hooks.
 */
export function ChartTip({
  label,
  rows,
  dense = false,
  extra,
}: {
  label: ReactNode;
  rows: ChartTipRow[];
  /** Tight padding and row spacing, the box only as wide as its rows, and no group dividers. */
  dense?: boolean;
  extra?: ReactNode;
}) {
  return (
    // The kit has no popover token, so the fill is the card's (the nearest surface token) at 10%, 25% in dark where
    // the blurred plot behind it is darker and the fill must lift the text off it a little more.
    <div
      className={cn(
        "z-50 max-w-sm rounded-none bg-card/10 text-foreground text-xs backdrop-blur-md sm:max-w-md dark:bg-card/25",
        dense ? "px-2.5 py-2" : "p-3",
        dense ? undefined : "min-w-44",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-border/60 border-b",
          dense ? "mb-1.5 pb-1" : "mb-2 pb-1.5",
        )}
      >
        <p className="font-bold text-[13px] text-foreground">{label}</p>
      </div>
      <ul className={dense ? "space-y-0.5" : "space-y-1"}>
        {rows.map((r, index) => (
          <li
            className={cn(
              "flex items-center justify-between text-[11px]",
              dense ? "gap-3" : "gap-4",
              // Group dividers only in the roomy layout; the dense rows run together.
              !dense &&
                r.separatorBefore &&
                index > 0 &&
                "mt-2 border-border/70 border-t pt-2",
            )}
            key={`${r.name}-${index}`}
          >
            <span className="flex items-center gap-1.5 text-foreground">
              <span
                className={cn(
                  "inline-block",
                  // A square takes the line swatch's 12px (8px plus 2px each side), so the values line up.
                  r.square
                    ? "mx-0.5 size-2 rounded-[2px]"
                    : cn(
                        "h-0.5 w-3",
                        r.dashed && "border-t-2 border-dashed bg-transparent",
                        r.dotted && "border-t-2 border-dotted bg-transparent",
                      ),
                )}
                style={
                  r.square
                    ? { background: r.color, opacity: r.dashed ? 0.45 : 1 }
                    : r.dashed || r.dotted
                      ? { borderColor: r.color }
                      : { background: r.color }
                }
              />
              {r.name}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      {extra != null && (
        <div className="mt-2.5 border-border/70 border-t pt-2">{extra}</div>
      )}
    </div>
  );
}

type TipProps = TooltipProps<number, string>;

/**
 * Spread onto every <Tooltip>: the tip follows the cursor without easing, its edge 1px beside the cursor line (clear of
 * the stroke, so the frosted box never covers it) and pinned to the plot top, so it neither slides in nor bounces.
 * `line` is the primary-colored cursor line, `band` the muted hover band of bar charts, `center` a line through the
 * band's middle (CenterCursor).
 */
export function chartTooltipProps(
  plotTop: number,
  cursor: "line" | "band" | "center" = "line",
): Pick<TipProps, "isAnimationActive" | "offset" | "position" | "cursor"> {
  return {
    isAnimationActive: false,
    offset: 1,
    position: { y: plotTop },
    cursor:
      cursor === "line" ? (
        { stroke: "var(--primary)", strokeWidth: 1 }
      ) : cursor === "band" ? (
        { fill: "var(--muted)", fillOpacity: 0.5 }
      ) : (
        <CenterCursor />
      ),
  };
}

/**
 * A cursor line for band charts: through the hovered band's middle (or between the two points recharts gives a line
 * cursor), and nothing over a slot whose payload is empty (a blank separator between groups).
 */
export function CenterCursor({
  points,
  payload,
  x,
  y,
  width,
  height,
}: {
  points?: { x: number; y: number }[];
  payload?: unknown[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  if (!payload?.length) return null;
  const line =
    points && points.length >= 2
      ? { x1: points[0].x, y1: points[0].y, x2: points[1].x, y2: points[1].y }
      : {
          x1: (x ?? 0) + (width ?? 0) / 2,
          y1: y ?? 0,
          x2: (x ?? 0) + (width ?? 0) / 2,
          y2: (y ?? 0) + (height ?? 0),
        };
  return (
    <line
      className="recharts-tooltip-cursor"
      pointerEvents="none"
      stroke="var(--primary)"
      strokeWidth={1}
      {...line}
    />
  );
}

/** A legend swatch; HTML, so it keeps its size as the chart scales. */
function LegendSwatch({ color, kind = "line" }: LegendItem) {
  switch (kind) {
    case "dashed":
    case "dotted":
      return (
        <span
          className={cn(
            "w-3.5 border-t-2",
            kind === "dashed" ? "border-dashed" : "border-dotted",
          )}
          style={{ borderColor: color }}
        />
      );
    case "square":
      return (
        <span className="size-2 rounded-[2px]" style={{ background: color }} />
      );
    case "hatched":
      return (
        <span
          className="size-2 rounded-[2px]"
          style={{
            background: `repeating-linear-gradient(135deg, ${color} 0 1.5px, color-mix(in srgb, ${color} 18%, transparent) 1.5px 3.5px)`,
          }}
        />
      );
    case "range":
      return (
        <span className="h-2 w-3.5 rounded-[2px] bg-muted-foreground/25" />
      );
    default:
      return (
        <span
          className="h-0.5 w-3.5 rounded-full"
          style={{ background: color }}
        />
      );
  }
}

/** The legend row over a chart. */
export function ChartLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-6 flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => (
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
          key={`${item.kind ?? "line"}-${item.name}`}
        >
          <LegendSwatch {...item} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

/**
 * The chart frame: a card with one 24px top row (the legend from the plot's left edge, a control ending at the plot's
 * right margin), the chart at `height` in a ResponsiveContainer, and notes under it. `label` makes it a figure; the
 * chart inside then needs no label of its own.
 */
export function ChartBox({
  legend,
  control,
  notes,
  height,
  children,
  className,
  label,
}: {
  legend?: LegendItem[];
  control?: ReactNode;
  notes?: string[];
  height: number | string;
  /** One recharts chart (ResponsiveContainer's single child). */
  children: ReactElement;
  className?: string;
  label?: string;
}) {
  const hasRow = (legend && legend.length > 0) || control != null;
  return (
    // --chart-surface is the color the zoom control's thumbs are ringed in, so they read as a gap on this card.
    <Card
      aria-label={label}
      className={cn("p-5 [--chart-surface:var(--card)]", className)}
      role={label ? "figure" : undefined}
    >
      {hasRow && (
        <div className="flex h-6 items-center justify-between gap-3 pr-2 pl-[44px]">
          {legend && legend.length > 0 ? (
            <ChartLegend items={legend} />
          ) : (
            <span />
          )}
          {control}
        </div>
      )}
      <div className="relative w-full min-w-0" style={{ height }}>
        <ResponsiveContainer
          height="100%"
          initialDimension={INITIAL_DIMENSION}
          width="100%"
        >
          {children}
        </ResponsiveContainer>
      </div>
      {notes && notes.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-[44px] text-[10px] text-muted-foreground">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** False on the server and the first client render, true after the first effect. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/**
 * What a small chart renders until mounted: a same-height box, so the server markup never holds a mis-measured chart
 * and the layout height stays stable.
 */
export function ChartPlaceholder({
  height,
  className,
}: {
  height: number | string;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full min-w-0 rounded-md bg-muted/10", className)}
      style={{ height }}
    />
  );
}

type DotStyle = {
  r?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
};
type DotProps = {
  cx?: number;
  cy?: number;
  r?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
};

/**
 * Line dots above the tooltip: recharts draws dots in the chart's SVG, under the HTML tooltip, which then hides the
 * dots it passes over. overDot(spec) is a `dot` or `activeDot` renderer that portals the dot into `layer`, an SVG
 * stacked over the tooltip, so the tooltip always sits under the line dots. `spec` is a dot style or a render function
 * (for dots drawn on some points only); before mount (and on the server) the dot renders inline. The host is
 * position:relative and renders `layer` after its ResponsiveContainer.
 */
export function useDotLayer() {
  const ref = useRef<SVGSVGElement>(null);
  const layer = (
    <svg
      aria-hidden
      // Above ChartTip's z-50, so the tooltip passes under the dots.
      className="pointer-events-none absolute top-0 left-0 z-[60] overflow-visible"
      ref={ref}
    />
  );
  const overDot = useCallback(
    <P extends DotProps>(spec: DotStyle | ((props: P) => ReactElement) = {}) =>
      (props: P) => {
        // A point without a value (a gap) gets no dot, as recharts' own dots do.
        if (
          typeof spec !== "function" &&
          (props.cx == null || props.cy == null)
        )
          return <g />;
        const dot =
          typeof spec === "function" ? (
            spec(props)
          ) : (
            <circle
              cx={props.cx}
              cy={props.cy}
              fill={spec.fill ?? props.fill}
              fillOpacity={spec.fillOpacity}
              r={spec.r ?? props.r}
              stroke={spec.stroke ?? props.stroke}
              strokeWidth={spec.strokeWidth ?? props.strokeWidth}
            />
          );
        return ref.current ? createPortal(dot, ref.current) : dot;
      },
    [],
  );
  return { layer, overDot };
}

/**
 * The hatched fill of an estimated or forecast bar: the bar's own color striped at 45° over a fainter tint of it (70%),
 * on the user space so the stripes run on unbroken from bar to bar. Place it in <defs> outside the bar layer: a period
 * flip hides that layer (visibility, which the tiles would inherit) while its clones still fill from this by id.
 */
export function hatchPattern(id: string, color: string) {
  return (
    <pattern
      height={4}
      id={id}
      key={id}
      patternTransform="rotate(45)"
      patternUnits="userSpaceOnUse"
      width={4}
    >
      <rect fill={color} fillOpacity={0.7} height={4} width={4} />
      <rect fill={color} height={4} width={2} />
    </pattern>
  );
}

/**
 * A ReferenceLine's line on a bar chart's band axis, moved onto its bar's drawn center. recharts floors a bar's slot
 * (the band less barCategoryGap's 10% each side) to whole pixels before centering the bar in it, which leaves every bar
 * up to half a pixel left of the band center the line marks: plain to see with 4px bars under a 2px line.
 */
export function BarCenteredLine({
  bars,
  ...line
}: SVGProps<SVGLineElement> & { bars: number }) {
  const plot = usePlotArea();
  const slot = plot ? (plot.width / bars) * 0.8 : 0;
  const shift = slot > 1 ? (slot - Math.floor(slot)) / 2 : 0;
  return (
    <line
      {...line}
      className="recharts-reference-line-line"
      x1={Number(line.x1) - shift}
      x2={Number(line.x2) - shift}
    />
  );
}

/**
 * A ReferenceArea shape with a minimum width, centred on the original rect, so a one-day window on a point scale still
 * shows as a band.
 */
export function minWidthRect(min = 6) {
  return function MinWidthRect(props: ComponentProps<typeof Rectangle>) {
    const width = Math.max(min, props.width ?? 0);
    return (
      <Rectangle
        {...props}
        width={width}
        x={(props.x ?? 0) - (width - (props.width ?? 0)) / 2}
      />
    );
  };
}

/**
 * Today's marker with a label chip on top ("오늘 10-29"), spanning from the chip down to `bottom`; a ReferenceLine
 * shape with x = p.x1 and bottom = p.y2.
 */
export function TodayLine({
  x,
  bottom,
  label,
}: {
  x: number;
  bottom: number;
  label: string;
}) {
  return (
    <g aria-label={label} pointerEvents="none">
      <line
        stroke="var(--primary)"
        strokeWidth={1.5}
        x1={x}
        x2={x}
        y1={14}
        y2={bottom}
      />
      <rect
        fill="var(--primary)"
        height={15}
        rx={4}
        width={60}
        x={x - 30}
        y={0}
      />
      <text
        fill="var(--primary-foreground)"
        fontSize={10.5}
        fontWeight={700}
        textAnchor="middle"
        x={x}
        y={11}
      >
        {label}
      </text>
    </g>
  );
}

/** The steps a daily axis may label at (every day, every 2nd, … every 15th), and the room a "30일" label needs. */
const DAY_STEPS = [1, 2, 3, 5, 7, 10, 15];
const DAY_LABEL_ROOM = 26;

/**
 * Korean two-row x ticks. Up to 60 rows label every row ("N일", the bare number where a band is under 22px) with the
 * month under the row where it turns; where the plot is too narrow for a label a day, every 2nd, 3rd, 5th … row from
 * the first is labelled instead, the month under the first labelled row of each. Longer spans tick the first of each
 * month as "M월 D일" with the year under the row where it turns. `ticks` are the keys the axis draws, so each tick can
 * compare itself with the one before it.
 */
function makeKoTick(ticks: string[], everyDay: boolean) {
  return function KoTick(props: XAxisTickContentProps) {
    const d = String(props.payload.value);
    // recharts hands each tick the axis width and the tick count, so the step follows the plot's width.
    const room =
      Number(props.width ?? 0) / Math.max(1, props.visibleTicksCount - 1);
    // Without a width to go by (room 0), every row keeps its label.
    const step =
      everyDay && room > 0
        ? (DAY_STEPS.find((n) => n * room >= DAY_LABEL_ROOM) ?? 30)
        : 1;
    if (props.index % step !== 0) return <g />;
    const prev = props.index >= step ? ticks[props.index - step] : undefined;
    const month = Number(d.slice(5, 7));
    const day = Number(d.slice(8, 10));
    const band = 2 * (props.payload.offset ?? 0);
    const top = everyDay
      ? `${day}${band > 0 && band < 22 ? "" : "일"}`
      : `${month}월 ${day}일`;
    const turns =
      !prev ||
      (everyDay
        ? prev.slice(5, 7) !== d.slice(5, 7)
        : prev.slice(0, 4) !== d.slice(0, 4));
    return (
      <g>
        <text
          className="recharts-cartesian-axis-tick-value"
          dy="0.71em"
          fill="var(--muted-foreground)"
          fontSize={everyDay ? 10 : 11}
          textAnchor="middle"
          x={props.x}
          y={props.y}
        >
          {top}
        </text>
        {turns && (
          <text
            dy="1.95em"
            fill="var(--muted-foreground)"
            fillOpacity={0.75}
            fontSize={10}
            textAnchor="middle"
            x={props.x}
            y={props.y}
          >
            {everyDay ? `${month}월` : `${d.slice(0, 4)}년`}
          </text>
        )}
      </g>
    );
  };
}

/**
 * The x axis of daily rows ("YYYY-MM-DD" keys) in the trend charts' Korean style: up to 60 rows tick every day,
 * longer spans the first of each month. Spread the result on XAxis as `ticks`, `tick`, `height` and `interval={0}`.
 */
export function koDayAxis(keys: string[]) {
  const everyDay = keys.length <= 60;
  const ticks = everyDay ? keys : keys.filter((key) => key.endsWith("-01"));
  return { ticks, tick: makeKoTick(ticks, everyDay), height: 34 };
}
