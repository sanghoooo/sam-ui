"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/** A node of a StagedPathway column. */
export type PathwayNode = {
  id: string;
  label: string;
  color: string;
  /** Figures shown beside the label, right-aligned. */
  detail?: ReactNode;
  /** Writes the label in the node color, tying a total to its bar. Middle and last columns only. */
  tintLabel?: boolean;
  /** Last column: its label while a first-column node is hovered, for that node's share (e.g. one channel's 순증). */
  traceLabel?: (origin: string) => ReactNode;
};

/** A flow from a node to one in the next column. */
export type PathwayLink = {
  source: string;
  target: string;
  value: number;
  /** Band color. Defaults to the source node color. */
  color?: string;
  /**
   * A later stage's flow: its split by first-column node (each one's share, summing to `value`), so hovering one traces
   * its path on through this flow.
   */
  parts?: Record<string, number>;
};

/** Spread label centers so rows keep at least `min` px apart inside [top, bottom]. */
function spreadLabels(
  centers: number[],
  min: number,
  top: number,
  bottom: number,
) {
  const ys = centers.map((c) => Math.min(Math.max(c, top), bottom));
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + min);
  for (let i = ys.length - 1; i >= 0; i--) {
    const limit = i === ys.length - 1 ? bottom : ys[i + 1] - min;
    if (ys[i] > limit) ys[i] = limit;
  }
  return ys;
}

const NODE = 10;
const PAD = 4;
/** Room above (and, to stay centered, below) a middle column's node for its label. */
const LABEL = 20;
/**
 * Band strength at rest. A flow under THIN px is drawn as a line at least 1px wide at LINE instead, so a flow of 1
 * still shows, and a thin one no fainter than a thinner one.
 */
const BAND = 0.32;
const LINE = 0.5;
const THIN = 2;
/** The first column's least room per node, gap included: one label line. */
const ROW = 20;

/**
 * A pathway (Sankey) over several stages, left to right, e.g. channels into 가입, which splits into 순증 and 해지. Links
 * run from one column to the next. A node is as tall as the larger of its inflow and outflow, every column centered on
 * one scale, so a band keeps its thickness end to end. The first column gives each node at least a label's height
 * (ROW), so its labels sit level with their bars however small the flow. Its labels sit left of its bars, each name
 * at the left edge and its detail against the bars; the last column's sit right of theirs; a middle column's centered
 * above its node, haloed in the card's color to read over the bands. The side label columns are as wide as their widest
 * label (measured), so the chart runs edge to edge. Hovering, focusing or tapping a node lights the bands that touch
 * it; a first-column node's also traces its share on through the later flows that carry `parts`, a band of its own
 * inside each (its place set by the column's order, so the shares tile the flow), and their end nodes show its figures
 * (`traceLabel`).
 */
export function StagedPathway({
  columns,
  links,
  height = 220,
  label,
}: {
  /** Nodes per stage, left to right (at least two). */
  columns: PathwayNode[][];
  /** From a node to one in the next column; others are dropped. */
  links: PathwayLink[];
  /** Callers with a channel per first-column row use max(200, rows * 20 + 100). */
  height?: number;
  /** The figure's aria-label. */
  label: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  // The node whose paths are lit, from a hover, a focus or a tap.
  const [hover, setHover] = useState<string | null>(null);
  // The widest first- and last-column labels, from a hidden copy laid out at their natural width.
  const measure = useRef<HTMLDivElement>(null);
  const [labelWidths, setLabelWidths] = useState<{
    left: number;
    right: number;
  } | null>(null);
  // After every render: the labels may change with the data. Equal values keep the old state, so it cannot loop.
  useLayoutEffect(() => {
    const [left, right] = Array.from(
      measure.current?.children ?? [],
    ) as HTMLElement[];
    if (!left || !right) return;
    // Rounded up: offsetWidth rounds down, which would cut the widest label by a fraction of a pixel.
    const next = {
      left: Math.ceil(left.getBoundingClientRect().width),
      right: Math.ceil(right.getBoundingClientRect().width),
    };
    setLabelWidths((prev) =>
      prev?.left === next.left && prev?.right === next.right ? prev : next,
    );
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const last = columns.length - 1;
  const columnOf = new Map(
    columns.flatMap((list, c) => list.map((n) => [n.id, c] as const)),
  );
  const rankOf = new Map(
    columns.flatMap((list) => list.map((n, i) => [n.id, i] as const)),
  );
  const flows = links.filter((l) => {
    const from = columnOf.get(l.source);
    return (
      l.value > 0 && from !== undefined && columnOf.get(l.target) === from + 1
    );
  });
  const sum = (list: PathwayLink[]) => list.reduce((s, l) => s + l.value, 0);
  const size = (id: string) =>
    Math.max(
      sum(flows.filter((l) => l.target === id)),
      sum(flows.filter((l) => l.source === id)),
    );
  const total = sum(flows);

  const inner = height - PAD * 2;
  // The first column's gaps shrink with its node count (a two-column pathway's sources), the others' are fixed.
  const gapOf = (c: number) =>
    c > 0
      ? 24
      : columns[0].length > 1
        ? Math.min(12, (inner * 0.3) / (columns[0].length - 1))
        : 0;
  // The first column's slot per node: its bar, or a label line less the gap when the bar is thinner.
  const slot = (id: string, scale: number) =>
    Math.max(size(id) * scale, ROW - gapOf(0));
  const span0 = (scale: number) =>
    columns[0].reduce((s, n) => s + slot(n.id, scale), 0) +
    gapOf(0) * Math.max(0, columns[0].length - 1);
  // One scale for every band: the tightest column decides, a middle column keeping room for its label. The first
  // column's span grows with the scale only through its larger bars, so its scale is found by bisection.
  const fits0 = (() => {
    let lo = 0;
    let hi =
      inner /
      Math.max(
        1,
        columns[0].reduce((s, n) => s + size(n.id), 0),
      );
    if (span0(hi) <= inner) return hi;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (span0(mid) <= inner) lo = mid;
      else hi = mid;
    }
    return lo;
  })();
  const k = Math.min(
    fits0,
    ...columns.slice(1).map((list, i) => {
      const c = i + 1;
      const flow = list.reduce((s, n) => s + size(n.id), 0);
      const room =
        inner -
        gapOf(c) * Math.max(0, list.length - 1) -
        (c < last ? LABEL * 2 : 0);
      return flow > 0 ? Math.max(0, room) / flow : Number.POSITIVE_INFINITY;
    }),
  );
  // Each side column takes its widest label plus the gap to the bars, so no label is ever cut short.
  const leftW = (labelWidths?.left ?? 104) + 12;
  const rightW = (labelWidths?.right ?? 64) + 8;
  const x0 = leftW;
  const x1 = Math.max(x0 + (NODE + 24) * last, width - rightW - NODE);
  const box = new Map<string, { x: number; y: number; h: number }>();
  columns.forEach((list, c) => {
    const x = last > 0 ? x0 + ((x1 - x0) * c) / last : x0;
    const gap = gapOf(c);
    // A first-column bar sits centered in its slot.
    const room = (id: string) => (c === 0 ? slot(id, k) : size(id) * k);
    const span =
      list.reduce((s, n) => s + room(n.id), 0) +
      gap * Math.max(0, list.length - 1);
    let y = PAD + Math.max(0, (inner - span) / 2);
    for (const n of list) {
      const h = size(n.id) * k;
      box.set(n.id, { x, y: y + (room(n.id) - h) / 2, h });
      y += room(n.id) + gap;
    }
  });
  // Stack bands by source order, then target order, so they never cross inside a node.
  const out = new Map([...box].map(([id, b]) => [id, b.y]));
  const into = new Map([...box].map(([id, b]) => [id, b.y]));
  const bands = [...flows]
    .sort(
      (a, b) =>
        (rankOf.get(a.source) ?? 0) - (rankOf.get(b.source) ?? 0) ||
        (rankOf.get(a.target) ?? 0) - (rankOf.get(b.target) ?? 0),
    )
    .map((l) => {
      const h = l.value * k;
      const from = out.get(l.source) ?? 0;
      const to = into.get(l.target) ?? 0;
      out.set(l.source, from + h);
      into.set(l.target, to + h);
      const xa = (box.get(l.source)?.x ?? 0) + NODE;
      const xb = box.get(l.target)?.x ?? 0;
      return { ...l, h, from, to, xa, xb };
    });
  const bandPath = (b: (typeof bands)[number]) => {
    const xm = (b.xa + b.xb) / 2;
    return `M${b.xa},${b.from}C${xm},${b.from} ${xm},${b.to} ${b.xb},${b.to}L${b.xb},${b.to + b.h}C${xm},${b.to + b.h} ${xm},${b.from + b.h} ${b.xa},${b.from + b.h}Z`;
  };
  /** A thin flow's line, along its band's middle. */
  const linePath = (b: (typeof bands)[number]) => {
    const xm = (b.xa + b.xb) / 2;
    const y0 = b.from + b.h / 2;
    const y1 = b.to + b.h / 2;
    return `M${b.xa},${y0}C${xm},${y0} ${xm},${y1} ${b.xb},${y1}`;
  };
  const colorOf = new Map(columns.flat().map((n) => [n.id, n.color]));
  // A first-column node hovered: its share of each later flow that splits by them, in that flow's band.
  const origin = hover !== null && columnOf.get(hover) === 0 ? hover : null;
  const order0 = columns[0].map((n) => n.id);
  const traces = origin
    ? bands.flatMap((b) => {
        const share = b.parts?.[origin] ?? 0;
        if (!b.parts || share <= 0) return [];
        const before = order0
          .slice(0, order0.indexOf(origin))
          .reduce((s, id) => s + (b.parts?.[id] ?? 0), 0);
        return [
          {
            ...b,
            from: b.from + before * k,
            to: b.to + before * k,
            h: share * k,
          },
        ];
      })
    : [];
  const traced = (id: string) =>
    traces.some((t) => t.source === id || t.target === id);
  const lit = (l: PathwayLink) =>
    !hover || l.source === hover || l.target === hover;
  /** Band strength: BAND (LINE for a thin flow) at rest, stronger for the hovered flows, faint for the rest. */
  const strength = (l: PathwayLink, thin: boolean) =>
    !hover
      ? thin
        ? LINE
        : BAND
      : lit(l)
        ? thin
          ? 0.85
          : 0.62
        : thin
          ? 0.12
          : 0.07;
  const nodeLit = (id: string) =>
    !hover ||
    hover === id ||
    traced(id) ||
    flows.some(
      (l) =>
        (l.source === hover && l.target === id) ||
        (l.target === hover && l.source === id),
    );
  const nodeOf = (el: EventTarget | null) =>
    el instanceof Element
      ? (el.closest("[data-pathway-node]")?.getAttribute("data-pathway-node") ??
        null)
      : null;
  const fade = "transition-opacity duration-150 motion-reduce:transition-none";
  const labelYs = (list: PathwayNode[], min: number, edge: number) =>
    spreadLabels(
      list.map((n) => {
        const b = box.get(n.id);
        return b ? b.y + b.h / 2 : 0;
      }),
      min,
      edge,
      height - edge,
    );
  const leftYs = labelYs(columns[0], 20, 10);
  const rightYs = labelYs(
    columns[last],
    columns[last].some((n) => n.detail) ? 36 : 20,
    10,
  );

  return (
    <figure
      aria-label={label}
      className="relative w-full select-none **:data-pathway-node:cursor-pointer"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setHover(null);
      }}
      onFocus={(event) => setHover(nodeOf(event.target))}
      onMouseLeave={() => setHover(null)}
      onMouseOver={(event) => setHover(nodeOf(event.target))}
      ref={ref}
      style={{ height }}
    >
      {/* The measuring copy: each side's labels in their own type, at their natural width. */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0"
        ref={measure}
      >
        <div className="w-max">
          {columns[0].map((n) => (
            <div
              className="flex items-center gap-1.5 pr-1 text-[12px]"
              key={n.id}
            >
              <span>{n.label}</span>
              {n.detail && (
                <span className="flex items-center gap-1.5 tabular-nums">
                  {n.detail}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="w-max">
          {columns[last].map((n) => (
            <div key={n.id}>
              <span className="block text-[12px] font-semibold tabular-nums">
                {n.label}
              </span>
              {n.detail && (
                <span className="block text-[11px] tabular-nums">
                  {n.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {width > 0 && total === 0 && (
        <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
          표시할 흐름이 없습니다
        </p>
      )}
      {width > 0 && total > 0 && (
        <>
          <svg
            aria-hidden="true"
            className="absolute inset-0 overflow-visible"
            height={height}
            width={width}
          >
            {bands.map((b) =>
              b.h < THIN ? (
                <path
                  className="transition-[stroke-opacity] duration-150 motion-reduce:transition-none"
                  d={linePath(b)}
                  data-pathway-node={b.source}
                  fill="none"
                  key={`${b.source}:${b.target}`}
                  stroke={b.color ?? colorOf.get(b.source)}
                  strokeOpacity={strength(b, true)}
                  strokeWidth={Math.max(b.h, 1)}
                />
              ) : (
                <path
                  className="transition-[fill-opacity] duration-150 motion-reduce:transition-none"
                  d={bandPath(b)}
                  data-pathway-node={b.source}
                  fill={b.color ?? colorOf.get(b.source)}
                  fillOpacity={strength(b, false)}
                  key={`${b.source}:${b.target}`}
                />
              ),
            )}
            {/* A hovered first-column node's shares of the later flows, lit inside their faded bands. */}
            {traces.map((t) =>
              t.h < THIN ? (
                <path
                  d={linePath(t)}
                  fill="none"
                  key={`trace:${t.source}:${t.target}`}
                  pointerEvents="none"
                  stroke={t.color ?? colorOf.get(t.source)}
                  strokeOpacity={0.85}
                  strokeWidth={Math.max(t.h, 1)}
                />
              ) : (
                <path
                  d={bandPath(t)}
                  fill={t.color ?? colorOf.get(t.source)}
                  fillOpacity={0.62}
                  key={`trace:${t.source}:${t.target}`}
                  pointerEvents="none"
                />
              ),
            )}
            {/* The first column's bars split by their bands, in their colors and strength; a thin flow's at least a
                pixel, at its line's strength. */}
            {bands
              .filter((b) => columnOf.get(b.source) === 0)
              .map((b) => (
                <rect
                  className={fade}
                  data-pathway-node={b.source}
                  fill={b.color ?? colorOf.get(b.source)}
                  height={Math.max(b.h, 1)}
                  key={`${b.source}:${b.target}`}
                  opacity={strength(b, b.h < THIN)}
                  width={NODE}
                  x={b.xa - NODE}
                  y={b.h < 1 ? b.from + b.h / 2 - 0.5 : b.from}
                />
              ))}
            {/* The later columns' bars, solid in their node colors. */}
            {columns.slice(1).flatMap((list) =>
              list.map((n) => {
                const b = box.get(n.id);
                if (!b) return null;
                return (
                  <rect
                    className={fade}
                    data-pathway-node={n.id}
                    fill={n.color}
                    height={Math.max(b.h, 1)}
                    key={n.id}
                    opacity={nodeLit(n.id) ? 1 : 0.35}
                    rx={1}
                    width={NODE}
                    x={b.x}
                    y={b.y}
                  />
                );
              }),
            )}
          </svg>
          {/* Labels are buttons: focusing or tapping one lights its paths. */}
          {columns[0].map((n, i) => (
            <button
              className={cn(
                "absolute left-0 flex h-5 -translate-y-1/2 items-center justify-between gap-1.5 rounded-sm pr-1 text-left text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                fade,
                !nodeLit(n.id) && "opacity-45",
              )}
              data-pathway-node={n.id}
              key={n.id}
              onClick={() => setHover(n.id)}
              style={{ top: leftYs[i], width: leftW - 12 }}
              type="button"
            >
              <span className="whitespace-nowrap">{n.label}</span>
              {n.detail && (
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                  {n.detail}
                </span>
              )}
            </button>
          ))}
          {/* A middle column's labels over their nodes, haloed in the card's color where a band runs under them. */}
          {columns.slice(1, last).flatMap((list) =>
            list.map((n) => {
              const b = box.get(n.id);
              if (!b) return null;
              return (
                <button
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-full rounded-sm pb-1.5 text-[12px] font-semibold whitespace-nowrap text-foreground tabular-nums outline-none [text-shadow:0_0_2px_var(--card),0_0_4px_var(--card),0_0_6px_var(--card)] focus-visible:ring-2 focus-visible:ring-ring/50",
                    fade,
                    !nodeLit(n.id) && "opacity-45",
                  )}
                  data-pathway-node={n.id}
                  key={n.id}
                  onClick={() => setHover(n.id)}
                  style={{
                    left: b.x + NODE / 2,
                    top: b.y,
                    ...(n.tintLabel ? { color: n.color } : {}),
                  }}
                  type="button"
                >
                  {n.label}
                </button>
              );
            }),
          )}
          {columns[last].map((n, i) => (
            <button
              className={cn(
                "absolute -translate-y-1/2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                fade,
                !nodeLit(n.id) && "opacity-45",
              )}
              data-pathway-node={n.id}
              key={n.id}
              onClick={() => setHover(n.id)}
              style={{
                top: rightYs[i],
                left: x1 + NODE + 8,
                width: rightW - 8,
              }}
              type="button"
            >
              <span
                className="block text-[12px] font-semibold whitespace-nowrap tabular-nums"
                style={n.tintLabel ? { color: n.color } : undefined}
              >
                {origin && n.traceLabel && traced(n.id)
                  ? n.traceLabel(origin)
                  : n.label}
              </span>
              {n.detail && (
                <span className="block text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
                  {n.detail}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </figure>
  );
}
