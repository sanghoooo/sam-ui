"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  Treemap as RechartsTreemap,
  ResponsiveContainer,
  Tooltip,
  type TreemapNode,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  ChartTip,
  formatNumber,
  INITIAL_DIMENSION,
  seriesColor,
  shareOf,
} from "./chart-parts";

/**
 * One part of the whole; `color` defaults to seriesColor(index) on a ring or pie, and to the chart's `color` on a
 * treemap. A "rest" part is usually var(--muted) on a ring and var(--muted-foreground) on a treemap.
 */
export type SharePart = { name: string; value: number; color?: string };

/** ShareChart's kinds: a ring with a figure in the hole, a full pie, or boxes sized by share. */
export type ShareKind = "ring" | "pie" | "treemap";

/**
 * Shares of a whole under one name, in three kinds: "ring", a ring with a figure in the hole (a KPI share); "pie", a
 * full pie of a composition; "treemap", boxes sized by share and labelled where they fit (a stock-map look), for more
 * parts than a pie can hold. Every kind's tooltip gives a part's value and share, and none animates in.
 */
export function ShareChart({
  kind,
  data,
  center,
  sub,
  size = 148,
  legend = false,
  height = 240,
  color = "var(--chart-1)",
  format = formatNumber,
  label,
}: {
  kind: ShareKind;
  data: SharePart[];
  /** ring: the big figure in the hole. */
  center?: ReactNode;
  /** ring: a small muted caption under the figure. */
  sub?: string;
  /** ring, pie: width and height in px. */
  size?: number;
  /** ring, pie: a side list of color dots, names and shares. */
  legend?: boolean;
  /** treemap: height in px; the width fills the parent. */
  height?: number;
  /** treemap: the boxes' hue; a part's own `color` overrides it. */
  color?: string;
  /** The tooltip's value. */
  format?: (v: number) => string;
  /** The figure's aria-label. */
  label?: string;
}) {
  return kind === "treemap" ? (
    <Treemap
      color={color}
      data={data}
      format={format}
      height={height}
      label={label}
    />
  ) : (
    <Donut
      center={center}
      data={data}
      format={format}
      label={label}
      legend={legend}
      pie={kind === "pie"}
      size={size}
      sub={sub}
    />
  );
}

/** Every kind's tooltip: the part's value and its share of the whole. */
function ShareTip({
  name,
  value,
  share,
  format,
}: {
  name: string;
  value: number;
  share: string;
  format: (v: number) => string;
}) {
  return (
    <ChartTip
      dense
      label={name}
      rows={[
        { name: "값", value: format(value) },
        { name: "비중", value: `${share}%` },
      ]}
    />
  );
}

/**
 * The ring and the pie. The parts are spaced 2° apart (1.5° on the pie, whose gaps are card-colored strokes). When
 * every value is 0 the ring is drawn in the muted color with "-" in the hole.
 */
function Donut({
  data,
  center,
  sub,
  size,
  pie,
  format,
  legend,
  label,
}: {
  data: SharePart[];
  center?: ReactNode;
  sub?: string;
  size: number;
  pie: boolean;
  format: (v: number) => string;
  legend: boolean;
  label?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const empty = total <= 0;
  const slices = data.map((d, i) => ({
    ...d,
    color: d.color ?? seriesColor(i),
  }));
  // The empty ring is one muted slice, so the shape still shows where the data will go.
  const drawn = empty
    ? [{ name: "", value: 1, color: "var(--muted)" }]
    : slices;

  const ring = (
    // A fixed box, so the ring never shrinks in a flex row of KPI tiles.
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer
        height="100%"
        initialDimension={INITIAL_DIMENSION}
        width="100%"
      >
        <PieChart>
          {pie ? (
            <Pie
              data={drawn}
              dataKey="value"
              innerRadius={0}
              isAnimationActive={false}
              outerRadius="100%"
              paddingAngle={1.5}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {drawn.map((d) => (
                <Cell fill={d.color} key={d.name} />
              ))}
            </Pie>
          ) : (
            <Pie
              cornerRadius={4}
              data={drawn}
              dataKey="value"
              innerRadius="70%"
              isAnimationActive={false}
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {drawn.map((d) => (
                <Cell fill={d.color} key={d.name} />
              ))}
            </Pie>
          )}
          {!empty && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const value = Number(payload[0].value);
                return (
                  <ShareTip
                    format={format}
                    name={String(payload[0].name)}
                    share={shareOf(value, total)}
                    value={value}
                  />
                );
              }}
              isAnimationActive={false}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {(empty || center != null || sub) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums">
            {empty ? "-" : center}
          </span>
          {sub && (
            <span className="text-[10px] text-muted-foreground">{sub}</span>
          )}
        </div>
      )}
    </div>
  );

  // A labelled chart is a figure; an unlabelled one is a plain box (a KPI tile names it already).
  const Wrapper = label ? "figure" : "div";

  if (!legend) {
    return label ? (
      <Wrapper aria-label={label} className="inline-block">
        {ring}
      </Wrapper>
    ) : (
      ring
    );
  }

  return (
    // The list sits beside the ring while both fit its box (the list 9rem to 190px wide), else under it.
    <Wrapper
      aria-label={label}
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
    >
      {ring}
      <ul className="min-w-36 max-w-[190px] flex-1 space-y-3">
        {slices.map((d) => (
          <li className="flex items-center gap-2.5 text-sm" key={d.name}>
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: d.color }}
            />
            <span className="flex-1">{d.name}</span>
            <span className="font-semibold tabular-nums">
              {shareOf(d.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

/** What a laid-out treemap box carries besides recharts' geometry. */
type Box = SharePart & { color: string; strength: number; share: string };

/** The gap between treemap boxes in px, taken half from each side that meets another box. */
const GAP = 2;

/** A box's fill opacity over the surface, from a box near 0 up to the largest box, so a larger share reads darker. */
const STRENGTH_MIN = 0.16;
const STRENGTH_MAX = 0.55;

/**
 * One laid-out box: its tinted rectangle, then its name and share where they fit (two lines in a box 40px tall, one in
 * a shorter one, the name only where more than a letter of it shows, nothing in a sliver, whose tooltip still names
 * it). recharts hands the root (depth 0) here too; it draws nothing, so the gaps never catch the pointer.
 */
function renderBox(node: TreemapNode) {
  if (node.depth === 0) return <g />;
  const box = node as TreemapNode & Box;
  const { root } = node;
  // Inset only the sides that meet another box, so the outer boxes still reach the chart's edges.
  const half = GAP / 2;
  const left = node.x > root.x + 0.5 ? half : 0;
  const top = node.y > root.y + 0.5 ? half : 0;
  const right = node.x + node.width < root.x + root.width - 0.5 ? half : 0;
  const bottom = node.y + node.height < root.y + root.height - 0.5 ? half : 0;
  const x = node.x + left;
  const y = node.y + top;
  const width = Math.max(0, node.width - left - right);
  const height = Math.max(0, node.height - top - bottom);
  const large = width >= 96 && height >= 64;
  const tall = height >= 40;
  const named = width >= (tall ? 52 : 64);
  const labelled = width >= 36 && height >= 22;
  return (
    <g>
      {/* data-recharts-item-index lets recharts find the box under a touch; a hover darkens it a step. */}
      <rect
        className="[fill-opacity:var(--strength)] hover:[fill-opacity:calc(var(--strength)+0.12)]"
        data-recharts-item-index={node.tooltipIndex}
        fill={box.color}
        height={height}
        rx={Math.min(4, width / 2, height / 2)}
        style={{ "--strength": box.strength } as CSSProperties}
        width={width}
        x={x}
        y={y}
      />
      {labelled && (
        // The labels let the pointer through to the box, so its hover and tooltip work over the text too.
        <foreignObject
          className="pointer-events-none"
          height={height}
          width={width}
          x={x}
          y={y}
        >
          <div
            className={cn(
              "flex h-full overflow-hidden text-foreground",
              tall ? "flex-col" : "items-start gap-1",
              large ? "gap-0.5 p-2.5" : named ? "p-1.5" : "p-1",
            )}
          >
            {named && (
              <span
                className={cn(
                  "min-w-0 truncate",
                  large ? "text-[12px] leading-4" : "text-[11px] leading-3.5",
                )}
              >
                {box.name}
              </span>
            )}
            <span
              className={cn(
                "shrink-0 font-semibold tabular-nums",
                large
                  ? "text-[18px] leading-6"
                  : tall && named
                    ? "text-[13px] leading-4"
                    : "text-[11px] leading-3.5",
              )}
            >
              {box.share}%
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

/**
 * The treemap: boxes laid out largest first, tinted in one hue with the larger ones darker, 2px apart. Parts of 0 or
 * less are left out; when nothing is left the box is muted with "-" in it.
 */
function Treemap({
  data,
  color,
  height,
  format,
  label,
}: {
  data: SharePart[];
  color: string;
  height: number;
  format: (v: number) => string;
  label?: string;
}) {
  const shown = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = shown.reduce((sum, d) => sum + d.value, 0);
  const largest = shown[0]?.value ?? 0;
  const boxes: Box[] = shown.map((d) => ({
    ...d,
    color: d.color ?? color,
    strength:
      STRENGTH_MIN + (STRENGTH_MAX - STRENGTH_MIN) * (d.value / largest),
    share: shareOf(d.value, total),
  }));

  // A labelled chart is a figure; an unlabelled one is a plain box (a card's title names it already).
  const Wrapper = label ? "figure" : "div";

  return (
    <Wrapper aria-label={label} className="w-full" style={{ height }}>
      {total > 0 ? (
        <ResponsiveContainer
          height="100%"
          initialDimension={INITIAL_DIMENSION}
          width="100%"
        >
          <RechartsTreemap
            content={renderBox}
            data={boxes}
            isAnimationActive={false}
          >
            <Tooltip
              content={({ active, payload }) => {
                const box = payload?.[0]?.payload as Box | undefined;
                if (!active || !box) return null;
                return (
                  <ShareTip
                    format={format}
                    name={box.name}
                    share={box.share}
                    value={box.value}
                  />
                );
              }}
              isAnimationActive={false}
            />
          </RechartsTreemap>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-sm bg-muted font-semibold text-lg text-muted-foreground">
          -
        </div>
      )}
    </Wrapper>
  );
}
