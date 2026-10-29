"use client";

import { FileChartColumn, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import {
  WORKSPACES,
  type WorkspaceId,
  WorkspaceLogo,
} from "@/components/layout/workspace-logo";
import { AiInsightTitle } from "@/components/ui/ai-insight";
import { Card, Toolbar } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { addMonths, MonthStepper } from "@/components/ui/month-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Business = "all" | WorkspaceId;
type Metric = "orders" | "revenue";

const BUSINESSES = [
  { label: "전체", value: "all" },
  { label: "AIR", value: "air" },
  { label: "TDS", value: "tds" },
  { label: "MVNO", value: "mvno" },
] as const;

const METRICS = [
  { label: "주문", value: "orders" },
  { label: "매출", value: "revenue" },
] as const;

const MONTHS = { min: "2025-06", max: "2026-10" };
const SPAN = 6;
const PANEL = "preview-metric-panel";

// Made-up numbers for the preview: each workspace's orders follow a seasonal wave and a slow climb,
// at a price per order in won.
const SAMPLE: Record<
  WorkspaceId,
  { orders: number; price: number; phase: number }
> = {
  air: { orders: 1840, price: 61000, phase: 0.4 },
  tds: { orders: 1520, price: 48000, phase: 0.9 },
  mvno: { orders: 930, price: 33000, phase: 1.3 },
};

const monthNumber = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return year * 12 + m - (2025 * 12 + 1);
};
const monthName = (month: string) => `${Number(month.slice(5))}월`;
const fullMonth = (month: string) =>
  `${month.slice(0, 4)}년 ${monthName(month)}`;

function ordersOf(id: WorkspaceId, month: string) {
  const { orders, phase } = SAMPLE[id];
  const i = monthNumber(month);
  return Math.round(
    orders * (1 + 0.16 * Math.sin(i * 0.8 + phase) + 0.015 * i),
  );
}

function sampleValue(business: Business, metric: Metric, month: string) {
  const ids = business === "all" ? WORKSPACES.map((w) => w.id) : [business];
  return ids.reduce((sum, id) => {
    const orders = ordersOf(id, month);
    return sum + (metric === "orders" ? orders : orders * SAMPLE[id].price);
  }, 0);
}

const compact = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const whole = new Intl.NumberFormat("ko-KR");

/** Revenue as 2.5억 원, orders as 5,025건; short drops the unit, for ticks and caps. */
function format(metric: Metric, value: number, short = false) {
  if (metric === "revenue")
    return short ? compact.format(value) : `${compact.format(value)} 원`;
  return short ? whole.format(value) : `${whole.format(value)}건`;
}

/** A round top for the axis: 4,512 -> 5,000. */
function niceMax(value: number) {
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
}

/** The hero's product shot: a small dashboard built from the kit's own components, with sample data. */
export function HeroPreview() {
  const [month, setMonth] = useState(MONTHS.max);
  const [business, setBusiness] = useState<Business>("all");
  const [metric, setMetric] = useState<Metric>("orders");

  const previous = addMonths(month, -1);
  const color =
    business === "all"
      ? "var(--primary)"
      : (WORKSPACES.find((w) => w.id === business)?.color ?? "var(--primary)");
  const name = BUSINESSES.find((b) => b.value === business)?.label ?? "전체";

  const orders = sampleValue(business, "orders", month);
  const revenue = sampleValue(business, "revenue", month);
  const tiles = [
    {
      label: "주문",
      value: `${whole.format(orders)}건`,
      now: orders,
      before: sampleValue(business, "orders", previous),
    },
    {
      label: "매출",
      value: `${compact.format(revenue)} 원`,
      now: revenue,
      before: sampleValue(business, "revenue", previous),
    },
    {
      label: "객단가",
      value: `${whole.format(Math.round(revenue / orders))}원`,
      now: revenue / orders,
      before:
        sampleValue(business, "revenue", previous) /
        sampleValue(business, "orders", previous),
    },
  ];

  const change = (now: number, before: number) =>
    ((now - before) / before) * 100;
  const metricChange = change(
    sampleValue(business, metric, month),
    sampleValue(business, metric, previous),
  );
  const metricLabel = metric === "orders" ? "주문" : "매출";

  return (
    <Card className="overflow-hidden shadow-[0_24px_60px_-28px_rgb(0_0_0/0.35)]">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="ml-2 truncate text-[12px] text-muted-foreground">
          현황 · 예시 데이터
        </span>
      </div>

      <div className="flex">
        <aside className="hidden w-48 shrink-0 border-r border-border bg-sidebar p-3 md:block">
          <p className="px-2 pb-1.5 text-[11px] font-medium text-muted-foreground">
            워크스페이스
          </p>
          <ul className="space-y-0.5">
            {WORKSPACES.map((workspace) => (
              <li key={workspace.id}>
                <button
                  aria-pressed={business === workspace.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] transition-colors hover:bg-muted",
                    business === workspace.id && "bg-muted font-semibold",
                  )}
                  onClick={() => setBusiness(workspace.id)}
                  type="button"
                >
                  <WorkspaceLogo id={workspace.id} />
                  {workspace.name}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-2 pb-1.5 text-[11px] font-medium text-muted-foreground">
            메뉴
          </p>
          <ul className="space-y-0.5 text-[13px]">
            <li className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5 font-semibold">
              <LayoutDashboard className="size-4" /> 현황
            </li>
            <li className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
              <FileChartColumn className="size-4" /> 리포트
            </li>
            <li className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
              <Settings className="size-4" /> 설정
            </li>
          </ul>
        </aside>

        <div className="min-w-0 flex-1 space-y-3 bg-background p-3 sm:p-4">
          <Toolbar>
            <MonthStepper
              max={MONTHS.max}
              min={MONTHS.min}
              onValueChange={setMonth}
              value={month}
            />
            <Field label="사업">
              <SegmentedControl
                label="사업"
                onValueChange={setBusiness}
                options={BUSINESSES}
                value={business}
              />
            </Field>
          </Toolbar>

          <ul className="grid gap-3 sm:grid-cols-3">
            {tiles.map((tile) => {
              const delta = change(tile.now, tile.before);
              return (
                <li key={tile.label}>
                  <Card className="p-4">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {tile.label}
                    </p>
                    <p className="mt-1 text-[24px] font-semibold tracking-tight">
                      {tile.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                      </span>{" "}
                      {monthName(previous)} 대비
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[14px] font-semibold">
                월별 {metricLabel} · {name}
              </h3>
              <Tabs
                items={METRICS}
                label="지표"
                onValueChange={setMetric}
                panelId={PANEL}
                value={metric}
              />
            </div>
            <div
              aria-labelledby={`${PANEL}-tab-${metric}`}
              id={PANEL}
              role="tabpanel"
            >
              <ColumnChart
                color={color}
                metric={metric}
                months={Array.from({ length: SPAN }, (_, k) =>
                  addMonths(month, k - SPAN + 1),
                )}
                valueAt={(m) => sampleValue(business, metric, m)}
              />
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-[12px] text-muted-foreground">
                <AiInsightTitle as="span" />
                <span>
                  {business === "all" ? "전체 워크스페이스" : name}의{" "}
                  {metricLabel}이 {monthName(previous)}보다{" "}
                  {Math.abs(metricChange).toFixed(1)}%{" "}
                  {metricChange >= 0 ? "늘었습니다" : "줄었습니다"}.
                </span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}

/** One series of monthly columns: hairline grid, the latest value on its cap, a tooltip per column. */
function ColumnChart({
  months,
  valueAt,
  metric,
  color,
}: {
  months: string[];
  valueAt: (month: string) => number;
  metric: Metric;
  color: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const values = months.map(valueAt);
  const top = niceMax(Math.max(...values));
  const ticks = [top, top / 2, 0];
  const last = months.length - 1;

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <div className="flex h-44 w-9 shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums">
          {ticks.map((tick) => (
            <span key={tick}>{format(metric, tick, true)}</span>
          ))}
        </div>
        <div className="relative h-44 flex-1">
          {ticks.map((tick, i) => (
            <div
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              key={tick}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 grid grid-cols-6">
            {months.map((m, k) => {
              const height = (values[k] / top) * 100;
              const showTip = active === k;
              return (
                <button
                  aria-label={`${fullMonth(m)}: ${format(metric, values[k])}`}
                  className="group relative flex h-full items-end justify-center outline-none"
                  key={m}
                  onBlur={() => setActive(null)}
                  onFocus={() => setActive(k)}
                  onPointerEnter={() => setActive(k)}
                  onPointerLeave={() => setActive(null)}
                  type="button"
                >
                  <span
                    className={cn(
                      "w-3/5 max-w-6 rounded-t-[4px] transition-opacity",
                      active !== null && !showTip && "opacity-45",
                      "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring",
                    )}
                    style={{ background: color, height: `${height}%` }}
                  />
                  {(showTip || (active === null && k === last)) && (
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap",
                        showTip
                          ? "rounded-md border border-border bg-card px-2 py-1 text-left shadow-md"
                          : "text-[11px] font-semibold",
                      )}
                      style={{ bottom: `calc(${height}% + 6px)` }}
                    >
                      {showTip ? (
                        <>
                          <span className="block text-[12px] font-semibold">
                            {format(metric, values[k])}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span
                              className="h-0.5 w-3 rounded-full"
                              style={{ background: color }}
                            />
                            {fullMonth(m)}
                          </span>
                        </>
                      ) : (
                        format(metric, values[k], true)
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-11 grid grid-cols-6 pt-1.5 text-center text-[11px] text-muted-foreground">
        {months.map((m) => (
          <span key={m}>{monthName(m)}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>월별 {metric === "orders" ? "주문" : "매출"}</caption>
        <tbody>
          {months.map((m, k) => (
            <tr key={m}>
              <th scope="row">{m}</th>
              <td>{format(metric, values[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
