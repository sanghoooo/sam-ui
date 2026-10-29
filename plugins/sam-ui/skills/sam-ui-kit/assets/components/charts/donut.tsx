"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  ChartTip,
  formatNumber,
  INITIAL_DIMENSION,
  seriesColor,
} from "./chart-parts";

/** One slice; `color` defaults to seriesColor(index). A "rest" slice is usually var(--muted). */
export type DonutSlice = { name: string; value: number; color?: string };

/** A slice's share of the total as "62.5". */
function shareOf(value: number, total: number) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
}

/**
 * A ring with a figure in the hole (a KPI share), or a full pie of a composition (`pie`) with an optional side list
 * of shares (`legend`). The slices are spaced 2° apart (1.5° on the pie, whose gaps are card-colored strokes) and never
 * animate in. When every value is 0 the ring is drawn in the muted color with "-" in the hole.
 */
export function Donut({
  data,
  center,
  sub,
  size = 148,
  pie = false,
  format = formatNumber,
  legend = false,
  label,
}: {
  data: DonutSlice[];
  /** The big figure in the hole. */
  center?: ReactNode;
  /** A small muted caption under the figure. */
  sub?: string;
  /** Width and height in px. */
  size?: number;
  /** A full pie instead of a ring: no hole, card-colored gaps. */
  pie?: boolean;
  /** The tooltip's value. */
  format?: (v: number) => string;
  /** A side list of color dots, names and shares. */
  legend?: boolean;
  /** The figure's aria-label. */
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
              outerRadius="85%"
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
                  <ChartTip
                    dense
                    label={String(payload[0].name)}
                    rows={[
                      { name: "값", value: format(value) },
                      { name: "비중", value: `${shareOf(value, total)}%` },
                    ]}
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
    <Wrapper
      aria-label={label}
      className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_190px]"
    >
      <div className="flex justify-center">{ring}</div>
      <ul className="space-y-3">
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
