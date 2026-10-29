"use client";

import { RotateCw, ZoomIn } from "lucide-react";
import { type PointerEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartZoom } from "./chart-zoom";

/** The thumb's radius: a thumb at an end of the track sits that far in (chart-range in the kit stylesheet). */
const THUMB = 7;

/**
 * A range slider over the loaded rows, above the plot: narrowing it zooms in, moving a thumb pans. Its label reads
 * 확대 until the window moves, then becomes a 초기화 button that restores the full range. Ctrl + wheel and drag on the
 * plot still work and move the thumbs with them; data-chart-zoom-control keeps the plot's drag-to-pan off it. It is
 * anchored right, so the label changing width never moves the slider under a dragging pointer. Charts leave a 24px
 * band above the plot; the control rides 20px above that band's top, or 8px when not raised.
 *
 * The slider is two native range inputs stacked over one drawn track: the input whose thumb is nearer the pointer is
 * raised (z-index) before the pointer goes down, so a drag on either thumb works alike in Firefox and WebKit, which
 * disagree on pseudo-element pointer events. Tab reaches each input and the arrow keys move it one row.
 */
export function ChartZoomControl({
  zoom,
  compact = false,
  raised = !compact,
  inline = false,
  className,
}: {
  zoom: ChartZoom;
  /** Small charts: a shorter slider. */
  compact?: boolean;
  /** Rides 20px above the plot band instead of 8px; off where a legend row sits just above. */
  raised?: boolean;
  /** Laid out in flow, for a slot outside the chart, instead of over the plot. */
  inline?: boolean;
  /** Extra placement classes, e.g. top-0 to sit in a legend row. */
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<"start" | "end">("end");
  if (zoom.length < 2) return null;
  const last = zoom.length - 1;
  // The thumbs keep at least `minimum` rows between them, as the wheel zoom does.
  const gap = Math.min(zoom.minimum, zoom.length) - 1;
  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const travel = Math.max(0, rect.width - THUMB * 2);
    const startX = THUMB + (zoom.start / last) * travel;
    const endX = THUMB + (zoom.end / last) * travel;
    const dStart = Math.abs(x - startX);
    const dEnd = Math.abs(x - endX);
    // Thumbs sitting together: the pointer right of them takes the end, left of them the start.
    setActive(
      dStart === dEnd
        ? x > endX
          ? "end"
          : "start"
        : dStart < dEnd
          ? "start"
          : "end",
    );
  };
  return (
    <div
      className={cn(
        "flex h-6 cursor-default items-center gap-2 text-[11px] text-muted-foreground",
        !inline && "absolute right-3 z-20",
        !inline && (raised ? "-top-5" : "-top-2"),
        className,
      )}
      data-chart-zoom-control
    >
      {zoom.zoomed ? (
        <button
          className="flex cursor-pointer items-center gap-1 rounded-sm font-medium text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          onClick={zoom.reset}
          type="button"
        >
          <RotateCw aria-hidden className="size-3.5" />
          초기화
        </button>
      ) : (
        <span className="flex items-center gap-1">
          <ZoomIn aria-hidden className="size-3.5" />
          확대
        </span>
      )}
      <div
        className={cn(
          "relative flex h-6 items-center",
          compact ? "w-28" : "w-40",
        )}
        onPointerDownCapture={pick}
        onPointerMoveCapture={pick}
        ref={track}
      >
        <span className="absolute inset-x-0 h-1 bg-foreground/15" />
        <span
          className="absolute h-1 rounded-full bg-foreground/45"
          style={{
            left: `${(zoom.start / last) * 100}%`,
            right: `${100 - (zoom.end / last) * 100}%`,
          }}
        />
        <input
          aria-label="표시 시작"
          className={cn(
            "chart-range absolute inset-0 h-6 w-full",
            active === "start" ? "z-10" : "z-0",
          )}
          max={last}
          min={0}
          onChange={(event) =>
            zoom.setRange(
              Math.min(Number(event.target.value), zoom.end - gap),
              zoom.end,
            )
          }
          step={1}
          type="range"
          value={zoom.start}
        />
        <input
          aria-label="표시 끝"
          className={cn(
            "chart-range absolute inset-0 h-6 w-full",
            active === "end" ? "z-10" : "z-0",
          )}
          max={last}
          min={0}
          onChange={(event) =>
            zoom.setRange(
              zoom.start,
              Math.max(Number(event.target.value), zoom.start + gap),
            )
          }
          step={1}
          type="range"
          value={zoom.end}
        />
      </div>
    </div>
  );
}
