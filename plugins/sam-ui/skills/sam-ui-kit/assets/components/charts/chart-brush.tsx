"use client";

import { Area, AreaChart, Brush, ResponsiveContainer } from "recharts";
import { INITIAL_DIMENSION } from "./chart-format";
import type { ChartZoom } from "./chart-zoom";

/**
 * A brush strip under a chart: the whole row set as a faint area with two travellers over it, bound to the same zoom
 * as the chart's slider, wheel and drag, so moving either moves the other. The alternative to ChartZoomControl where
 * the reader should see the whole period while choosing a window of it. The travellers keep `zoom.minimum` rows
 * between them through setRange's clamp in the control; here recharts' own minimum (one row) applies, and the chart
 * follows whatever window the brush reports.
 */
export function ChartBrush({
  zoom,
  rows,
  xKey = "key",
  valueKey,
  color = "var(--chart-1)",
  label = "전체 기간 탐색",
}: {
  zoom: ChartZoom;
  /** Every row the zoom runs over (zoom.rows), in order. */
  rows: Record<string, unknown>[];
  /** The row field of the x label; "key" by default. */
  xKey?: string;
  /** The row field drawn as the strip's area. */
  valueKey: string;
  /** The area's stroke and fill; the first series color by default. */
  color?: string;
  /** The fieldset's accessible name. */
  label?: string;
}) {
  if (rows.length < 2) return null;
  return (
    <fieldset aria-label={label} className="mt-2 border-border border-t pt-2">
      <div className="h-9 w-full">
        <ResponsiveContainer
          height="100%"
          initialDimension={INITIAL_DIMENSION}
          width="100%"
        >
          <AreaChart
            data={rows}
            margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
          >
            <Brush
              ariaLabel="조회 기간 선택"
              dataKey={xKey}
              endIndex={zoom.end}
              fill="var(--muted)"
              height={32}
              onChange={({ startIndex, endIndex }) => {
                // recharts reports the window on every drag frame, the unchanged one included.
                if (startIndex === undefined || endIndex === undefined) return;
                if (startIndex === zoom.start && endIndex === zoom.end) return;
                zoom.setRange(startIndex, endIndex);
              }}
              startIndex={zoom.start}
              stroke="var(--muted-foreground)"
              // The strip has no room for labels; the travellers alone show where the window is.
              tickFormatter={() => ""}
              travellerWidth={8}
              y={2}
            >
              <AreaChart>
                <Area
                  dataKey={valueKey}
                  dot={false}
                  fill={color}
                  fillOpacity={0.15}
                  isAnimationActive={false}
                  stroke={color}
                  type="monotone"
                />
              </AreaChart>
            </Brush>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </fieldset>
  );
}
