"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { seriesColor } from "./chart-format";

export type PathwayNode = {
  id: string;
  label: string;
  /** Defaults to seriesColor(index) within its column. */
  color?: string;
  /** Figures shown beside the label, right-aligned. */
  detail?: ReactNode;
  /** Writes the label in the node color, tying a total to its bar. Targets only. */
  tintLabel?: boolean;
  /** StagedPathway: its label while a first-column node is hovered, for that node's share. */
  traceLabel?: (origin: string) => ReactNode;
};

export type PathwayLink = {
  source: string;
  target: string;
  value: number;
  /** Band color. Defaults to the source node color. */
  color?: string;
  /**
   * StagedPathway, a later stage's flow: its split by first-column node (each one's share, summing to `value`), so
   * hovering one traces its path on through this flow.
   */
  parts?: Record<string, number>;
};

type PathwayHover = { side: "source" | "target"; id: string };

/** Spread label centers so rows keep at least `min` px apart inside [top, bottom]. */
export function spreadLabels(
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

/**
 * Two-column pathway (Sankey) chart. Sources on the left are sized by their outgoing links and targets on the right
 * by their incoming links, and every band keeps one thickness end to end. Hovering or focusing a node highlights its
 * paths.
 */
export function Pathway({
  sources,
  targets,
  links,
  height = 220,
  sourceLabelWidth = 220,
  targetLabelWidth = 128,
  label,
  onActiveChange,
}: {
  sources: PathwayNode[];
  targets: PathwayNode[];
  links: PathwayLink[];
  height?: number;
  sourceLabelWidth?: number;
  targetLabelWidth?: number;
  /** The figure's accessible name; required because the labels are buttons. */
  label: string;
  /** Called with a source id when its path is hovered, focused, or tapped. */
  onActiveChange?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Width comes from a ResizeObserver, so the server and the first client render draw an empty figure of `height`.
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<PathwayHover | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const NODE = 10;
  const PAD = 4;
  // Node colors by id; a node without one takes the series color of its position in its column.
  const colorOf = new Map(
    sources.map((n, i) => [n.id, n.color ?? seriesColor(i)] as const),
  );
  const targetColorOf = new Map(
    targets.map((n, i) => [n.id, n.color ?? seriesColor(i)] as const),
  );
  const sourceIds = new Set(sources.map((n) => n.id));
  const targetIds = new Set(targets.map((n) => n.id));
  const flows = links.filter(
    (l) => l.value > 0 && sourceIds.has(l.source) && targetIds.has(l.target),
  );
  const sum = (list: PathwayLink[]) => list.reduce((s, l) => s + l.value, 0);
  const total = sum(flows);

  const leftW = Math.min(sourceLabelWidth, Math.max(120, width * 0.4));
  const rightW = Math.min(targetLabelWidth, Math.max(84, width * 0.22));
  const x0 = leftW;
  const x1 = Math.max(x0 + NODE + 40, width - rightW - NODE);
  const inner = height - PAD * 2;
  const gap =
    sources.length > 1 ? Math.min(12, (inner * 0.3) / (sources.length - 1)) : 0;
  const k = total > 0 ? (inner - gap * (sources.length - 1)) / total : 0;

  const sourceBox = new Map<string, { y: number; h: number }>();
  let sy = PAD;
  for (const n of sources) {
    const h = sum(flows.filter((l) => l.source === n.id)) * k;
    sourceBox.set(n.id, { y: sy, h });
    sy += h + gap;
  }
  // Targets take a fixed gap and sit vertically centered.
  const targetGap = 24;
  const targetHeights = targets.map(
    (t) => sum(flows.filter((l) => l.target === t.id)) * k,
  );
  const targetSpan =
    targetHeights.reduce((a, b) => a + b, 0) +
    targetGap * Math.max(0, targets.length - 1);
  const targetBox = new Map<string, { y: number; h: number }>();
  let ty = PAD + Math.max(0, (inner - targetSpan) / 2);
  targets.forEach((t, i) => {
    targetBox.set(t.id, { y: ty, h: targetHeights[i] });
    ty += targetHeights[i] + targetGap;
  });

  // Stack bands by source order, then target order, so they never cross inside a node.
  const rank = (id: string, list: PathwayNode[]) =>
    list.findIndex((n) => n.id === id);
  const sourceCursor = new Map([...sourceBox].map(([id, box]) => [id, box.y]));
  const targetCursor = new Map([...targetBox].map(([id, box]) => [id, box.y]));
  const bands = [...flows]
    .sort(
      (a, b) =>
        rank(a.source, sources) - rank(b.source, sources) ||
        rank(a.target, targets) - rank(b.target, targets),
    )
    .map((l) => {
      const h = l.value * k;
      const from = sourceCursor.get(l.source) ?? 0;
      const to = targetCursor.get(l.target) ?? 0;
      sourceCursor.set(l.source, from + h);
      targetCursor.set(l.target, to + h);
      return { ...l, h, from, to };
    });
  const xa = x0 + NODE;
  const xb = x1;
  // Control points at the horizontal middle: an S-curve that leaves and arrives flat.
  const xm = (xa + xb) / 2;
  const bandPath = (b: { h: number; from: number; to: number }) =>
    `M${xa},${b.from}C${xm},${b.from} ${xm},${b.to} ${xb},${b.to}L${xb},${b.to + b.h}C${xm},${b.to + b.h} ${xm},${b.from + b.h} ${xa},${b.from + b.h}Z`;

  const lit = (l: PathwayLink) =>
    !hover ||
    (hover.side === "source" ? l.source === hover.id : l.target === hover.id);
  /** Band strength: 0.32 at rest, 0.62 for the hovered flows, 0.07 for the rest while hovering. */
  const bandOpacity = (isLit: boolean) =>
    hover ? (isLit ? 0.62 : 0.07) : 0.32;
  const nodeLit = (side: "source" | "target", id: string) =>
    !hover ||
    (hover.side === side
      ? hover.id === id
      : flows.some((l) =>
          side === "source"
            ? l.source === id && l.target === hover.id
            : l.target === id && l.source === hover.id,
        ));
  // One delegated handler on the figure: every node, band and label carries a data attribute.
  const pick = (el: EventTarget | null): PathwayHover | null => {
    const hit =
      el instanceof Element
        ? el.closest("[data-pathway-source],[data-pathway-target]")
        : null;
    const source = hit?.getAttribute("data-pathway-source");
    if (source) return { side: "source", id: source };
    const target = hit?.getAttribute("data-pathway-target");
    return target ? { side: "target", id: target } : null;
  };
  const show = (next: PathwayHover | null) => {
    if (next?.side === hover?.side && next?.id === hover?.id) return;
    setHover(next);
    if (next?.side === "source") onActiveChange?.(next.id);
  };

  const leftYs = spreadLabels(
    sources.map((n) => {
      const box = sourceBox.get(n.id);
      return box ? box.y + box.h / 2 : 0;
    }),
    20,
    10,
    height - 10,
  );
  const rightYs = spreadLabels(
    targets.map((t) => {
      const box = targetBox.get(t.id);
      return box ? box.y + box.h / 2 : 0;
    }),
    36,
    18,
    height - 18,
  );

  return (
    <figure
      aria-label={label}
      // A pointer over every hover target (bands, nodes, labels).
      className="relative w-full select-none **:data-pathway-source:cursor-pointer **:data-pathway-target:cursor-pointer"
      onBlur={(event) => {
        // Focus moving between the figure's own buttons keeps the highlight.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setHover(null);
      }}
      onFocus={(event) => show(pick(event.target))}
      onMouseLeave={() => setHover(null)}
      onMouseOver={(event) => show(pick(event.target))}
      ref={ref}
      style={{ height }}
    >
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
            {bands.map((b) => (
              <path
                className="transition-[fill-opacity] duration-150 motion-reduce:transition-none"
                d={bandPath(b)}
                data-pathway-source={b.source}
                fill={b.color ?? colorOf.get(b.source)}
                fillOpacity={bandOpacity(lit(b))}
                key={`${b.source}:${b.target}`}
              />
            ))}
            {/* Each source bar is split by its bands, in their colors and strength, so it shows where its flows
                start (e.g. the churn share in its own color). */}
            {bands.map((b) => (
              <rect
                className="transition-opacity duration-150 motion-reduce:transition-none"
                data-pathway-source={b.source}
                fill={b.color ?? colorOf.get(b.source)}
                height={b.h}
                key={`${b.source}:${b.target}`}
                opacity={bandOpacity(lit(b))}
                width={NODE}
                x={x0}
                y={b.from}
              />
            ))}
            {/* A source without flows keeps a 1px mark. */}
            {sources.map((n) => {
              const box = sourceBox.get(n.id);
              if (!box || box.h >= 1) return null;
              return (
                <rect
                  className="transition-opacity duration-150 motion-reduce:transition-none"
                  data-pathway-source={n.id}
                  fill={colorOf.get(n.id)}
                  height={1}
                  key={n.id}
                  opacity={bandOpacity(nodeLit("source", n.id))}
                  width={NODE}
                  x={x0}
                  y={box.y}
                />
              );
            })}
            {targets.map((t) => {
              const box = targetBox.get(t.id);
              if (!box) return null;
              return (
                <rect
                  className="transition-opacity duration-150 motion-reduce:transition-none"
                  data-pathway-target={t.id}
                  fill={targetColorOf.get(t.id)}
                  height={Math.max(box.h, 1)}
                  key={t.id}
                  opacity={nodeLit("target", t.id) ? 1 : 0.35}
                  rx={1}
                  width={NODE}
                  x={x1}
                  y={box.y}
                />
              );
            })}
          </svg>
          {/* Labels are HTML buttons over the SVG: they keep their text size, truncate, and take keyboard focus. */}
          {sources.map((n, i) => (
            <button
              className={cn(
                "absolute left-0 flex h-5 -translate-y-1/2 items-center gap-2 rounded-sm pr-1 text-left text-[12px] outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none",
                !nodeLit("source", n.id) && "opacity-45",
              )}
              data-pathway-source={n.id}
              key={n.id}
              // A tap on touch screens, where there is no hover.
              onClick={() => show({ side: "source", id: n.id })}
              style={{ top: leftYs[i], width: leftW - 12 }}
              title={n.label}
              type="button"
            >
              <span className="min-w-0 flex-1 truncate">{n.label}</span>
              {n.detail && (
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                  {n.detail}
                </span>
              )}
            </button>
          ))}
          {targets.map((t, i) => (
            <button
              className={cn(
                "absolute -translate-y-1/2 rounded-sm text-left outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none",
                !nodeLit("target", t.id) && "opacity-45",
              )}
              data-pathway-target={t.id}
              key={t.id}
              onClick={() => show({ side: "target", id: t.id })}
              style={{
                top: rightYs[i],
                left: x1 + NODE + 8,
                width: rightW - 8,
              }}
              type="button"
            >
              <span
                className="block truncate text-[12px] font-semibold"
                style={
                  t.tintLabel ? { color: targetColorOf.get(t.id) } : undefined
                }
              >
                {t.label}
              </span>
              {t.detail && (
                <span className="block truncate text-[11px] text-muted-foreground tabular-nums">
                  {t.detail}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </figure>
  );
}
