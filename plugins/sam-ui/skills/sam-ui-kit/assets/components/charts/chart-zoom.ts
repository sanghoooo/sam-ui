"use client";

import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { parseCompact } from "./chart-format";

/** Index window, anchored at the pointer; never requests data outside the loaded series. */
export function zoomWindow(
  start: number,
  end: number,
  length: number,
  anchor: number,
  direction: number,
  minimum = 7,
) {
  if (length < 2) return { start: 0, end: Math.max(0, length - 1) };
  const count = end - start + 1;
  const nextCount = Math.min(
    length,
    Math.max(
      Math.min(minimum, length),
      direction < 0 ? Math.floor(count / 1.2) : Math.ceil(count * 1.2),
    ),
  );
  const ratio = Math.max(0, Math.min(1, anchor));
  // The row under the pointer stays under it.
  const at = start + (count - 1) * ratio;
  const nextStart = Math.max(
    0,
    Math.min(length - nextCount, Math.round(at - (nextCount - 1) * ratio)),
  );
  return { start: nextStart, end: nextStart + nextCount - 1 };
}

/** Positive offset moves to later samples without changing the visible span. */
export function panWindow(
  start: number,
  end: number,
  length: number,
  offset: number,
) {
  const span = end - start;
  const nextStart = Math.max(
    0,
    Math.min(Math.max(0, length - span - 1), start + Math.round(offset)),
  );
  return { start: nextStart, end: nextStart + span };
}

type Window = { identity: string; start: number; end: number };

/**
 * Wheel and drag zoom over `rows`: ctrl + wheel over the plot zooms around the pointer, dragging a zoomed plot pans.
 * `left` and `right` are the plot's margins inside the host (the y axis width and the chart's right margin), so wheel
 * anchors and drag bounds land on the plot. `resetKey` starts the zoom over whenever it changes, as a new extent of
 * rows does: for a switch that may keep the same rows (a filter that drops none).
 */
export function useChartZoom<T>(
  rows: T[],
  key: (row: T) => string,
  minimum = 7,
  left = 44,
  right = 12,
  resetKey = "",
) {
  const identity = `${resetKey}|${rows.length}:${rows.length ? key(rows[0]) : ""}:${rows.length ? key(rows[rows.length - 1]) : ""}`;
  const [view, setWindow] = useState<Window | null>(null);
  // A new identity drops the old zoom, so coming back to it (월간 → 분기 → 월간) doesn't bring the zoom back.
  if (view && view.identity !== identity) setWindow(null);
  const current =
    view?.identity === identity ? view : { start: 0, end: rows.length - 1 };
  const [dragging, setDragging] = useState(false);
  // The DOM listeners are bound once; they read the latest config from here.
  const latest = useRef({
    identity,
    length: rows.length,
    minimum,
    left,
    right,
    ...current,
  });
  useLayoutEffect(() => {
    latest.current = {
      identity,
      length: rows.length,
      minimum,
      left,
      right,
      ...current,
    };
  });
  const detach = useRef<(() => void) | null>(null);
  const ref = useCallback((element: HTMLDivElement | null) => {
    detach.current?.();
    detach.current = null;
    if (!element) return;
    let delta = 0;
    let drag: {
      pointer: number;
      x: number;
      width: number;
      start: number;
      end: number;
      identity: string;
    } | null = null;
    let suppressClick = false;
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType !== "mouse") return;
      if (
        (event.target as Element).closest(
          "button,a,input,select,textarea,[role=button],[data-chart-zoom-control]",
        )
      )
        return;
      suppressClick = false;
      const config = latest.current;
      if (config.length < 2 || config.end - config.start + 1 >= config.length)
        return;
      const rect = element.getBoundingClientRect();
      if (
        event.clientX < rect.left + config.left ||
        event.clientX > rect.right - config.right
      )
        return;
      drag = {
        pointer: event.pointerId,
        x: event.clientX,
        width: Math.max(1, rect.width - config.left - config.right),
        start: config.start,
        end: config.end,
        identity: config.identity,
      };
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (
        !drag ||
        event.pointerId !== drag.pointer ||
        drag.identity !== latest.current.identity
      )
        return;
      const dx = event.clientX - drag.x;
      // A 4px dead zone keeps a click from turning into a pan.
      if (Math.abs(dx) < 4 && !suppressClick) return;
      event.preventDefault();
      suppressClick = true;
      setDragging(true);
      const next = panWindow(
        drag.start,
        drag.end,
        latest.current.length,
        (-dx / drag.width) * (drag.end - drag.start),
      );
      setWindow({ identity: drag.identity, ...next });
    };
    const finish = () => {
      const pointer = drag?.pointer;
      drag = null;
      setDragging(false);
      if (pointer !== undefined && element.hasPointerCapture(pointer))
        element.releasePointerCapture(pointer);
    };
    // The click that ends a drag is swallowed in the capture phase (detail 0 is a keyboard click).
    const click = (event: MouseEvent) => {
      if (!suppressClick || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey || event.deltaY === 0) return;
      if (drag) finish();
      const config = latest.current;
      if (config.length < 2) return;
      event.preventDefault();
      event.stopPropagation();
      // Line and page deltas scaled to pixels; small deltas accumulate until a step, a sign change resets them.
      const amount =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      if (Math.sign(amount) !== Math.sign(delta)) delta = 0;
      delta += amount;
      if (Math.abs(delta) < 35) return;
      const direction = Math.sign(delta);
      delta = 0;
      const rect = element.getBoundingClientRect();
      const anchor =
        (event.clientX - rect.left - config.left) /
        Math.max(1, rect.width - config.left - config.right);
      setWindow((previous) => {
        const base =
          previous?.identity === config.identity
            ? previous
            : { start: 0, end: config.length - 1 };
        return {
          identity: config.identity,
          ...zoomWindow(
            base.start,
            base.end,
            config.length,
            anchor,
            direction,
            config.minimum,
          ),
        };
      });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", finish);
    element.addEventListener("lostpointercapture", finish);
    element.addEventListener("click", click, true);
    detach.current = () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", finish);
      element.removeEventListener("pointercancel", finish);
      element.removeEventListener("lostpointercapture", finish);
      element.removeEventListener("click", click, true);
      if (drag && element.hasPointerCapture(drag.pointer))
        element.releasePointerCapture(drag.pointer);
    };
  }, []);
  const zoomed = current.start !== 0 || current.end !== rows.length - 1;
  return {
    /** The plot host's ref: the listeners bind to it. */
    ref,
    /** Spread into the host's style: a grab cursor and no text selection while zoomed. */
    interactionStyle: {
      cursor: zoomed ? (dragging ? "grabbing" : "grab") : undefined,
      userSelect: zoomed ? "none" : undefined,
    } as CSSProperties,
    /** The rows in view. */
    data: rows.slice(current.start, current.end + 1),
    rows,
    zoomed,
    start: current.start,
    end: current.end,
    length: rows.length,
    minimum,
    /** Shows rows start..end, as the range slider sets them. */
    setRange: (start: number, end: number) =>
      setWindow({ identity, start, end }),
    reset: () => setWindow(null),
  };
}

export type ChartZoom = ReturnType<typeof useChartZoom>;

/**
 * Plot layers a period zoom animates; the grid, axes and labels stay put. Data layers follow the values (x and y);
 * reference layers (the selected range's shading, the 오늘 line) span the plot's height, so they move along x only.
 */
const DATA_LAYERS = ".recharts-area, .recharts-line, .recharts-bar";
const REF_LAYERS = ".recharts-reference-area, .recharts-reference-line";

function cloneLayers(svg: SVGSVGElement, selector: string) {
  return [...svg.querySelectorAll(selector)].map((layer) => {
    const copy = layer.cloneNode(true) as Element;
    // Our clip replaces recharts' (a clip-path would move with the transform), and strokes keep their width.
    for (const el of [copy, ...copy.querySelectorAll("*")]) {
      el.removeAttribute("clip-path");
      if (el.tagName === "path" || el.tagName === "line")
        el.setAttribute("vector-effect", "non-scaling-stroke");
    }
    for (const text of copy.querySelectorAll("text")) text.remove();
    return copy;
  });
}

/** The y domain's top: the highest tick label's value (the axes start at 0), read through `parseY`. */
function domainTop(svg: SVGSVGElement, parseY: (text: string) => number) {
  const values = [
    ...svg.querySelectorAll(
      ".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value",
    ),
  ]
    .map((t) => parseY(t.textContent ?? ""))
    .filter((v) => Number.isFinite(v));
  return values.length ? Math.max(...values) : 0;
}

type Snapshot = {
  extent: string;
  keys: string[];
  data: Element[];
  refs: Element[];
  top: number;
  d: string;
};

/**
 * Animates a period switch as a zoom without re-rendering the chart per frame. The chart renders the new rows once;
 * for `duration` ms an overlay shows clones of the old and new plot layers, transformed so each date keeps its x
 * and each value its height while the view moves from the old range to the new one, so the old view stretches or
 * shrinks into the new one. The real layers and the axis and reference labels hide until it ends (the [data-zooming]
 * rules in the kit stylesheet). Only a change of the source's extent animates; zoom and pan stay immediate. Expects a
 * y domain from 0 and a point x scale over the visible rows, or a band scale (`band`, as bars make it). The y domain's
 * top comes from `yTop` when given, else from the tick labels through `parseY` (formatCompact's shape by default).
 */
export function useZoomFlip<T>(
  host: RefObject<HTMLElement | null>,
  overlay: RefObject<SVGSVGElement | null>,
  source: T[],
  visible: T[],
  key: (row: T) => string,
  {
    band = false,
    duration = 450,
    yTop,
    parseY = parseCompact,
  }: {
    band?: boolean;
    duration?: number;
    yTop?: number;
    parseY?: (text: string) => number;
  } = {},
) {
  const extent = `${source.length}:${source.length ? key(source[0]) : ""}:${source.length ? key(source[source.length - 1]) : ""}`;
  const keys = visible.map(key);
  // useId instead of a random id, so the server and the browser agree and two charts never share a clip.
  const clipId = `zoom-flip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const shown = useRef<{
    extent: string;
    keys: string[];
    top: number | undefined;
  } | null>(null);
  const snapshot = useRef<Snapshot | null>(null);
  // The old view, cloned during the render that brings the new rows: the commit may redraw the chart before any
  // effect runs. Reading the DOM here is safe; the render only copies it into a ref and never sets state from it, so
  // a repeated render (StrictMode, the React Compiler) gets the same result. A switch made while a zoom still runs
  // cuts to the new view instead: the real layers already hold the last target, not what is on screen.
  if (
    shown.current &&
    shown.current.extent !== extent &&
    snapshot.current?.extent !== extent
  ) {
    const svg = host.current?.querySelector<SVGSVGElement>(
      "svg.recharts-surface",
    );
    const busy = host.current?.parentElement?.hasAttribute("data-zooming");
    snapshot.current =
      svg && !busy
        ? {
            extent,
            keys: shown.current.keys,
            data: cloneLayers(svg, DATA_LAYERS),
            refs: cloneLayers(svg, REF_LAYERS),
            top: shown.current.top ?? domainTop(svg, parseY),
            d: svg.querySelector(".recharts-curve")?.getAttribute("d") ?? "",
          }
        : { extent, keys: [], data: [], refs: [], top: 0, d: "" };
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: keys, yTop and parseY are read on the render that changes the extent only; re-running on them would cancel a running zoom on any re-render, and zoom or pan alone must not animate
  useLayoutEffect(() => {
    const before = snapshot.current;
    const root = host.current;
    const layer = overlay.current;
    const svg = root?.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!before || before.extent !== extent || !root || !layer || !svg) return;
    // data-zooming goes on the chart's outer wrapper, so it also reaches lanes drawn beside the plot.
    const scope = root.parentElement ?? root;
    snapshot.current = null;
    const toKeys = keys;
    if (
      before.keys.length < 2 ||
      toKeys.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ns = "http://www.w3.org/2000/svg";
    const make = (tag: string) => document.createElementNS(ns, tag);
    // Hold the old view while recharts draws the new rows.
    layer.setAttribute("width", svg.getAttribute("width") ?? "0");
    layer.setAttribute("height", svg.getAttribute("height") ?? "0");
    const grid = (
      svg.querySelector(".recharts-cartesian-grid") as SVGGraphicsElement | null
    )?.getBBox();
    if (!grid || grid.width <= 0) return;
    const defs = make("defs");
    const clip = make("clipPath");
    clip.setAttribute("id", clipId);
    const rect = make("rect");
    rect.setAttribute("x", String(grid.x));
    rect.setAttribute("y", String(grid.y - 2));
    rect.setAttribute("width", String(grid.width));
    rect.setAttribute("height", String(grid.height + 4));
    clip.append(rect);
    defs.append(clip);
    const clipped = make("g");
    clipped.setAttribute("clip-path", `url(#${clipId})`);
    const oldRefs = make("g") as SVGGElement;
    oldRefs.append(...before.refs);
    const oldGroup = make("g") as SVGGElement;
    oldGroup.append(...before.data);
    clipped.append(oldRefs, oldGroup);
    layer.replaceChildren(defs, clipped);
    scope.setAttribute("data-zooming", "");
    let raf = 0;
    let timer = 0;
    let frames = 0;
    const start = () => {
      // Union of both rows by key: the old view's dates and the new view's dates share one index (ISO keys sort in
      // time order).
      const union = [...new Set([...before.keys, ...toKeys])].sort();
      const index = new Map(union.map((k, i) => [k, i]));
      // Row u's x: o + (u − first)·w, with w the step and o the first row's x (a band's middle under bars).
      const wA =
        grid.width / (band ? before.keys.length : before.keys.length - 1);
      const wB = grid.width / (band ? toKeys.length : toKeys.length - 1);
      const oA = grid.x + (band ? wA / 2 : 0);
      const oB = grid.x + (band ? wB / 2 : 0);
      const shift = (index.get(toKeys[0])! - index.get(before.keys[0])!) * wA;
      // New content → old view: x' = m·x + c, y' = s·y + t around the plot's bottom (value 0).
      const m = wA / wB;
      const c = oA + shift - m * oB;
      const top = yTop ?? domainTop(svg, parseY);
      const s = before.top > 0 && top > 0 ? top / before.top : 1;
      const bottom = grid.y + grid.height;
      const t = bottom * (1 - s);
      if (s !== 1) scope.setAttribute("data-zooming", "y");
      const newRefs = make("g") as SVGGElement;
      newRefs.append(...cloneLayers(svg, REF_LAYERS));
      const newGroup = make("g") as SVGGElement;
      newGroup.append(...cloneLayers(svg, DATA_LAYERS));
      clipped.insertBefore(newRefs, oldRefs);
      clipped.insertBefore(newGroup, oldRefs);
      const groups = [newRefs, newGroup, oldRefs, oldGroup];
      for (const g of groups) g.style.transformOrigin = "0 0";
      // Start: the new view drawn where the old one stood. End: the old view drawn where the new one stands.
      newRefs.style.transform = `matrix(${m}, 0, 0, 1, ${c}, 0)`;
      newGroup.style.transform = `matrix(${m}, 0, 0, ${s}, ${c}, ${t})`;
      oldRefs.style.transform = "none";
      oldGroup.style.transform = "none";
      // A forced reflow, so the transitions start from these transforms.
      layer.getBoundingClientRect();
      const ease = `${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      for (const g of [newRefs, newGroup])
        g.style.transition = `transform ${ease}`;
      for (const g of [oldRefs, oldGroup])
        g.style.transition = `transform ${ease}, opacity ${duration}ms ease-out`;
      newRefs.style.transform = "none";
      newGroup.style.transform = "none";
      oldRefs.style.transform = `matrix(${1 / m}, 0, 0, 1, ${-c / m}, 0)`;
      oldGroup.style.transform = `matrix(${1 / m}, 0, 0, ${1 / s}, ${-c / m}, ${-t / s})`;
      oldRefs.style.opacity = "0";
      oldGroup.style.opacity = "0";
      timer = window.setTimeout(() => {
        layer.replaceChildren();
        scope.removeAttribute("data-zooming");
      }, duration + 40);
    };
    // Wait for recharts to draw the new rows (a few frames at most), then animate.
    const wait = () => {
      const d = svg.querySelector(".recharts-curve")?.getAttribute("d") ?? "";
      if ((d === before.d || !d) && frames++ < 10)
        raf = requestAnimationFrame(wait);
      else start();
    };
    raf = requestAnimationFrame(wait);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      layer.replaceChildren();
      scope.removeAttribute("data-zooming");
    };
  }, [extent, band, duration, host, overlay]);
  useLayoutEffect(() => {
    shown.current = { extent, keys, top: yTop };
  });
}
