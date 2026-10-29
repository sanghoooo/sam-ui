"use client";

import {
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** One lane under the plot, in order; `color` is the lane's own swatch (markers keep their item's color). */
export type ChartLane = { id: string; label: string; color?: string };

/** A dated item on a lane; one with `endDate` is a range, drawn as a band from its marker to its end. */
export type ChartMarker = {
  id: string;
  /** A ChartLane id. */
  lane: string;
  /** "YYYY-MM-DD", or whatever the chart's rows hold under xKey. */
  date: string;
  endDate?: string;
  title: string;
  badge?: string;
  summary?: string;
  /** Extra lines the list shows under the summary. */
  details?: string[];
  color: string;
  /** An outlined marker, apart from the filled ones. */
  outline?: boolean;
  href?: string;
  /** What the marker holds; a small round dot when unset. */
  icon?: ReactNode;
};

/** The default inset of the tracks: the chart's y axis width and its right margin. */
const TRACK_LEFT = 44;
const TRACK_RIGHT = 12;
/** The list's width, so it can be kept inside the track on either end. */
const PANEL_WIDTH = 300;
const OPEN_DELAY = 100;
const CLOSE_DELAY = 180;

/**
 * Annotation lanes under a chart's plot, below its x labels: a track per lane, the plot's width, with a round marker
 * on each date that has items (a count badge when several) and a band under a range item. Hovering or focusing a
 * marker opens its list downward, off the plot, and `onMarkerHover` lets the chart draw that date's line meanwhile;
 * `onActiveItems` hands the open items to the caller (to shade their period, say). Marked data-zoom-fade, so a
 * period flip hides it with the plot and fades it back in.
 */
export function ChartLanes({
  lanes,
  items,
  data,
  xKey = "key",
  ticks,
  onMarkerHover,
  onActiveItems,
  left = TRACK_LEFT,
  right = TRACK_RIGHT,
  linkLabel = "상세보기 →",
}: {
  lanes: ChartLane[];
  items: ChartMarker[];
  /** The chart's rows in view: bounds what shows and positions the markers by index. */
  data: Record<string, unknown>[];
  xKey?: string;
  /** The x axis's tick days, marked again on each lane's track. */
  ticks?: string[];
  /** A marker's list opened or closed: the chart draws that date's line through the plot meanwhile. */
  onMarkerHover?: (date: string, color: string, open: boolean) => void;
  /** The open list's items; a close fires only for the items that are currently open. */
  onActiveItems?: (items: ChartMarker[], open: boolean) => void;
  /** The tracks' left inset: the chart's y axis width. */
  left?: number;
  /** The tracks' right inset: the chart's right margin. */
  right?: number;
  /** The item link's text. */
  linkLabel?: string;
}) {
  const first = String(data[0]?.[xKey] ?? "");
  const last = String(data.at(-1)?.[xKey] ?? "");
  const position = (date: string) => {
    const index = data.findIndex((row) => row[xKey] === date);
    return (Math.max(0, index) / Math.max(1, data.length - 1)) * 100;
  };
  // Which marker's list is open, so a close that arrives after another marker opened (the close delay outlasts the
  // open delay when the pointer moves straight from one to the next) does not clear the newer one's items.
  const activeKey = useRef<string | null>(null);
  const activate = (key: string, group: ChartMarker[], open: boolean) => {
    if (open) {
      activeKey.current = key;
      onActiveItems?.(group, true);
    } else if (activeKey.current === key) {
      activeKey.current = null;
      onActiveItems?.(group, false);
    }
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; the lanes hold none, and its box would set them apart from the plot
    <div
      aria-label="타임라인 어노테이션"
      className="mt-3 min-w-0 space-y-1"
      data-zoom-fade
      role="group"
    >
      {lanes.map((lane) => {
        const groups = new Map<string, ChartMarker[]>();
        for (const item of items) {
          if (
            item.lane !== lane.id ||
            !first ||
            item.date > last ||
            (item.endDate ?? item.date) < first
          )
            continue;
          // A range that began before the rows in view stands on the first row.
          const date = item.date < first ? first : item.date;
          groups.set(date, [...(groups.get(date) ?? []), item]);
        }
        // Outlined-only markers first, so the filled ones draw over them where they touch.
        const outlinedOnly = (group: ChartMarker[]) =>
          Number(group.every((a) => a.outline));
        const ordered = Array.from(groups).sort(
          ([, a], [, b]) => outlinedOnly(b) - outlinedOnly(a),
        );
        return (
          // A lane: its name ending 8px left of the plot as the y axis's labels do (a longer one runs further left),
          // on the line of its track, which runs the plot's width under its markers.
          <div className="relative h-7" key={lane.id}>
            <span className="absolute top-1/2 left-0 flex w-9 -translate-y-1/2 justify-end text-[11px] whitespace-nowrap text-muted-foreground">
              {lane.label}
            </span>
            <LaneTrack left={left} right={right}>
              {(track) => (
                <>
                  {/* 1px in the chart grid's own line color. */}
                  <div className="absolute inset-x-0 top-3 border-t border-border" />
                  {/* The x axis's ticks on the track, across its line, under the markers, so a marker reads
                      against its day. */}
                  {ticks?.map((day) => (
                    <span
                      aria-hidden
                      // 2px over the 1px line (at 12px) and 2px under it, centered on it.
                      className="pointer-events-none absolute top-[10px] h-[5px] w-px -translate-x-1/2 bg-border"
                      key={day}
                      style={{ left: `${position(day)}%` }}
                    />
                  ))}
                  {ordered.map(([date, group]) => {
                    const key = `${lane.id}:${date}`;
                    const end = group.reduce(
                      (latest, a) =>
                        (a.endDate ?? a.date) > latest
                          ? (a.endDate ?? a.date)
                          : latest,
                      date,
                    );
                    const color = group[0].color;
                    return (
                      <LaneMarker
                        color={color}
                        items={group}
                        key={key}
                        laneLabel={lane.label}
                        linkLabel={linkLabel}
                        onOpenChange={(open) => {
                          onMarkerHover?.(date, color, open);
                          activate(key, group, open);
                        }}
                        outlined={group.every((a) => a.outline)}
                        position={position(date)}
                        rangeWidth={
                          end > date
                            ? position(end > last ? last : end) - position(date)
                            : 0
                        }
                        track={track}
                      />
                    );
                  })}
                </>
              )}
            </LaneTrack>
          </div>
        );
      })}
    </div>
  );
}

/** A lane's track box; it hands its element to the markers, which keep their lists inside its width. */
function LaneTrack({
  left,
  right,
  children,
}: {
  left: number;
  right: number;
  children: (track: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      className="absolute top-1/2 h-6 -translate-y-1/2"
      ref={ref}
      style={{ left, right }}
    >
      {children(ref)}
    </div>
  );
}

/** A date's marker on a track, its range band, and the list that opens under it. */
function LaneMarker({
  items,
  laneLabel,
  color,
  outlined,
  position,
  rangeWidth,
  track,
  linkLabel,
  onOpenChange,
}: {
  items: ChartMarker[];
  laneLabel: string;
  color: string;
  outlined: boolean;
  /** The marker's place on the track, in percent. */
  position: number;
  /** The range band's width in percent; 0 for none. */
  rangeWidth: number;
  track: RefObject<HTMLDivElement | null>;
  linkLabel: string;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const headerId = `${id}-header`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpenState] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  // The latest callback, so a timer bound on an earlier render reports to the caller's current handler.
  const latest = useRef(onOpenChange);
  latest.current = onOpenChange;
  const isOpen = useRef(false);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };
  const setOpen = useCallback((next: boolean) => {
    if (isOpen.current === next) return;
    isOpen.current = next;
    setOpenState(next);
    latest.current(next);
  }, []);
  const openSoon = () => {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY);
  };
  const closeSoon = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };
  const stay = () => clearTimers();
  // A pending open or close dies with the marker (a period flip drops the rows it stood on).
  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  // Keep the list inside the track: centered under its marker, but no further left than the track's start and no
  // further right than its end. Always downward, never flipped up over the plot.
  useLayoutEffect(() => {
    if (!open) return;
    const width = track.current?.clientWidth ?? 0;
    const panelWidth = panel.current?.offsetWidth || PANEL_WIDTH;
    const markerX = (position / 100) * width;
    setPanelLeft(
      Math.min(
        Math.max(markerX - panelWidth / 2, 0),
        Math.max(0, width - panelWidth),
      ),
    );
  }, [open, position, track]);

  // A click anywhere outside the marker and its list closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (trigger.current?.contains(target) || panel.current?.contains(target))
      )
        return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen]);

  // Focus leaving both the trigger and the list closes it; moving between them (Tab onto the link) keeps it open.
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (
      next &&
      (trigger.current?.contains(next) || panel.current?.contains(next))
    )
      return;
    clearTimers();
    setOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    clearTimers();
    setOpen(false);
    trigger.current?.focus();
  };
  // The marker and its list sit over the chart's hover area: a pointer moving on them must not move the chart's
  // tooltip cursor.
  const stopMove = (event: ReactPointerEvent) => event.stopPropagation();

  const description = `${laneLabel} · ${items.length}건\n${items
    .map(
      (a) =>
        `${a.date}${a.endDate ? ` ~ ${a.endDate}` : ""} · ${a.title}${a.summary ? `\n${a.summary}` : ""}`,
    )
    .join("\n")}`;

  return (
    <>
      {rangeWidth > 0 && (
        <div
          className="pointer-events-none absolute top-[11px] h-[3px] rounded-full opacity-50"
          style={{
            left: `${position}%`,
            width: `${rangeWidth}%`,
            background: color,
          }}
        />
      )}
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={description}
        className="absolute top-[2px] flex size-5 -translate-x-1/2 items-center justify-center rounded-full p-0 transition-[filter,box-shadow,opacity] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring"
        onBlur={onBlur}
        onFocus={() => {
          clearTimers();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onPointerEnter={openSoon}
        onPointerLeave={closeSoon}
        onPointerMove={stopMove}
        ref={trigger}
        style={{
          left: `${position}%`,
          ...(outlined
            ? {
                background: "var(--card)",
                color,
                boxShadow: `inset 0 0 0 2px ${color}`,
              }
            : // The icon in white: the marker colors are saturated, so white reads on them in both themes.
              { background: color, color: "white" }),
        }}
        type="button"
      >
        {items[0].icon ?? (
          <span aria-hidden className="size-2 rounded-full bg-current" />
        )}
        {items.length > 1 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-border bg-background px-0.5 text-[9px] font-semibold text-foreground">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        // The frosted surface of the chart's tooltip, with a denser fill (80%) because the list sits over page
        // content, not the plot, where 10% would leave it unreadable.
        // biome-ignore lint/a11y/useSemanticElements: the list holds no form controls; a group named by its header is what a screen reader should hear
        <div
          aria-labelledby={headerId}
          className="absolute top-7 z-50 flex w-[300px] max-w-[calc(100vw-2rem)] flex-col rounded-md border-r border-b border-foreground/12 bg-card/80 text-left backdrop-blur-md"
          id={panelId}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onPointerEnter={stay}
          onPointerLeave={closeSoon}
          onPointerMove={stopMove}
          ref={panel}
          role="group"
          style={{ left: panelLeft }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold"
              id={headerId}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: color }}
              />
              {laneLabel}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {items.length}건
            </span>
          </div>
          <div className="max-h-64 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border [scrollbar-width:thin]">
            {items.map((item) => (
              <article className="space-y-1.5 px-3 py-2.5" key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[11px] font-semibold leading-4">
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {item.date}
                  {item.endDate && ` ~ ${item.endDate}`}
                </p>
                {item.summary && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                )}
                {item.details?.map((line) => (
                  <p
                    className="text-[10px] leading-4 tabular-nums text-muted-foreground"
                    key={line}
                  >
                    {line}
                  </p>
                ))}
                {item.href && (
                  <div className="flex justify-end pt-1">
                    <a
                      className="rounded px-1.5 py-1 text-[11px] font-medium text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      href={item.href}
                    >
                      {linkLabel}
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
