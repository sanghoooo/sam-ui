"use client";

import { useState } from "react";
import { formatSigned } from "@/components/charts/chart-format";
import { ChartLegend, type LegendItem } from "@/components/charts/chart-parts";
import {
  ColumnChart,
  hasOutlier,
  OUTLIER_NOTE,
} from "@/components/charts/column-chart";
import { addMonths } from "@/components/ui/month-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MONTHS, monthlyRows, WORKSPACE_SERIES } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "column",
  short: "막대",
  title: "막대",
};

/** A small seeded PRNG (the same as sample-data's, on its own seed so this file's rows never shift that file's). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(13);
const noise = (amount: number) => (rng() - 0.5) * 2 * amount;

/** "2026-03" → "26.03" */
/** "2026-10" → "2026년 10월", as the trend charts' tooltips read a month. */
const monthTick = (key: string) =>
  `${key.slice(0, 4)}년 ${Number(key.slice(5, 7))}월`;
const CURRENT = MONTHS[MONTHS.length - 1];

/**
 * The monthly lines with the current month flagged as in progress, and a target set inside the bars (about three
 * quarters of their height), so its dotted line runs across them rather than along their tops.
 */
const linesRows = monthlyRows.map((row, i) => ({
  ...row,
  partial: row.key === CURRENT,
  target: 34000 + 800 * i,
}));

/**
 * Monthly net adds per workspace over MONTHS: the first month a sample (read off a report), one month's air far past
 * the rest (a campaign), and the current month in progress.
 */
const OUTLIER_MONTH = MONTHS[6];
const groupRows = MONTHS.map((key, i) => ({
  key,
  air:
    key === OUTLIER_MONTH
      ? 38000
      : Math.round(4200 + 220 * i + 900 * Math.sin(i / 2) + noise(700)),
  tds: Math.round(2600 + 90 * i + 500 * Math.sin(i / 3 + 1) + noise(450)),
  mvno: Math.round(-900 + 160 * i + 300 * Math.sin(i / 2 + 2) + noise(350)),
  sample: i === 0,
  partial: key === CURRENT,
}));
const groupValues = groupRows.flatMap((r) => [r.air, r.tds, r.mvno]);
const GROUP_OUTLIER = hasOutlier(groupValues);

const HIGHLIGHT_OPTIONS = [
  { value: "all", label: "전체" },
  ...WORKSPACE_SERIES.map(({ key, name }) => ({ value: key, label: name })),
] as const;
type Highlight = (typeof HIGHLIGHT_OPTIONS)[number]["value"];

const SCALE_OPTIONS = [
  { value: "zoom", label: "확대" },
  { value: "all", label: "전체" },
] as const;
type Scale = (typeof SCALE_OPTIONS)[number]["value"];

/**
 * Signed net adds per workspace over MONTHS plus two months ahead: the months to the one before the current are
 * closed, the current one is in progress (its actual so far plus a forecast remainder), and the two ahead are forecast
 * only. The 합계 line runs over the actuals; its dashed continuation starts at the last closed month and carries the
 * expected closes with a [below, above] range.
 */
const AHEAD = [addMonths(CURRENT, 1), addMonths(CURRENT, 2)];
const NET_MONTHS = [...MONTHS, ...AHEAD];
const netRows = NET_MONTHS.map((key, i) => {
  const closed = i < MONTHS.length - 1;
  const partial = key === CURRENT;
  const forecast = !closed;
  // The month's full net adds, then split into the actual so far and the remainder.
  const full = {
    air: Math.round(3200 + 140 * i + 700 * Math.sin(i / 2) + noise(500)),
    tds: Math.round(-400 + 60 * i + 600 * Math.sin(i / 3 + 2) + noise(400)),
    mvno: Math.round(1100 - 90 * i + 350 * Math.sin(i / 2 + 1) + noise(300)),
  };
  const done = closed ? 1 : partial ? 0.9 : 0;
  const part = (v: number) => Math.round(v * done);
  const rest = (v: number) => v - Math.round(v * done);
  const actual = {
    air: done > 0 ? part(full.air) : null,
    tds: done > 0 ? part(full.tds) : null,
    mvno: done > 0 ? part(full.mvno) : null,
  };
  const remainder = {
    airRest: forecast ? rest(full.air) : null,
    tdsRest: forecast ? rest(full.tds) : null,
    mvnoRest: forecast ? rest(full.mvno) : null,
  };
  const total =
    done > 0 ? part(full.air) + part(full.tds) + part(full.mvno) : null;
  const close = full.air + full.tds + full.mvno;
  // The continuation starts at the last closed month (its actual total, no flag) and runs over the forecast closes.
  const ahead = i - (MONTHS.length - 2);
  const connector = i === MONTHS.length - 2;
  return {
    key,
    ...actual,
    ...remainder,
    total,
    totalForecast: connector ? total : forecast ? close : null,
    forecast,
    totalRange: forecast ? [260 * ahead, 320 * ahead] : null,
    partial,
  };
});

const NET_SERIES = [
  {
    key: "air",
    name: "A",
    color: "var(--brand-air)",
    stack: true,
    forecastKey: "airRest",
  },
  {
    key: "tds",
    name: "B",
    color: "var(--brand-tds)",
    stack: true,
    forecastKey: "tdsRest",
  },
  {
    key: "mvno",
    name: "C",
    color: "var(--brand-mvno)",
    stack: true,
    forecastKey: "mvnoRest",
  },
  { key: "total", name: "합계", line: true, forecastKey: "totalForecast" },
];

const WORKSPACE_LEGEND: LegendItem[] = WORKSPACE_SERIES.map(
  ({ name, color }) => ({ name, color, kind: "square" }),
);
const NET_LEGEND: LegendItem[] = [
  ...WORKSPACE_LEGEND,
  { name: "예측", color: "var(--muted-foreground)", kind: "hatched" },
  { name: "합계", color: "var(--foreground)", kind: "line" },
  { name: "합계 예상", color: "var(--foreground)", kind: "dashed" },
  { name: "80% 범위", color: "var(--foreground)", kind: "range" },
];

const netLabel = (row: Record<string, unknown>) => {
  const tick = monthTick(String(row.key));
  return row.partial
    ? `${tick} · 진행 중`
    : row.forecast
      ? `${tick} · 예측`
      : tick;
};

export default function ColumnSection() {
  const [highlight, setHighlight] = useState<Highlight>("all");
  const [scale, setScale] = useState<Scale>("zoom");
  const zoomed = GROUP_OUTLIER && scale === "zoom";
  return (
    <Section
      description="@/components/charts/column-chart. 월별 막대와 점선 목표, 그룹 막대, 부호별 누적 막대입니다. 진행 중인 달은 옅게, 예측인 달은 빗금으로, 합계 선의 예상 마감은 빈 점과 범위 막대로 표시합니다. 툴팁 커서는 막대 가운데를 지나는 1px 선입니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo
        legend={
          <ChartLegend
            items={[
              { name: "회선", color: "var(--brand-air)", kind: "square" },
              { name: "목표", color: "var(--foreground)", kind: "dotted" },
            ]}
          />
        }
        title="월별 막대 · 목표"
      >
        <ColumnChart
          data={linesRows}
          fadedKey="partial"
          height={160}
          label="월별 회선과 목표"
          labels
          series={[{ key: "lines", name: "회선", color: "var(--brand-air)" }]}
          targetKey="target"
          tooltipExtra={(row) => (
            <span className="text-[11px] text-muted-foreground">
              순증{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatSigned(Number(row.net))}
              </span>
            </span>
          )}
          tooltipLabel={(row) =>
            row.partial
              ? `${monthTick(String(row.key))} · 진행 중`
              : monthTick(String(row.key))
          }
          zoom={false}
        />
        <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-muted-foreground">
          <li>{monthTick(CURRENT)}은 진행 중입니다.</li>
          <li>2026년 2월은 값이 없어 비어 있습니다.</li>
        </ul>
      </Demo>

      <Demo
        legend={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ChartLegend items={WORKSPACE_LEGEND} />
            <SegmentedControl
              label="강조할 워크스페이스"
              onValueChange={setHighlight}
              options={HIGHLIGHT_OPTIONS}
              value={highlight}
            />
            {GROUP_OUTLIER && (
              <SegmentedControl
                label="세로축 범위"
                onValueChange={setScale}
                options={SCALE_OPTIONS}
                value={scale}
              />
            )}
          </div>
        }
        title="그룹 막대 · 강조 · 이상치 확대"
      >
        <ColumnChart
          barGap={1}
          data={groupRows}
          fadedKey="partial"
          highlight={highlight === "all" ? null : highlight}
          label="워크스페이스별 월간 순증"
          maxBarSize={12}
          outlierZoom={zoomed}
          sampleKey="sample"
          series={WORKSPACE_SERIES.map((s) => ({ ...s }))}
          signed
          tooltipLabel={netLabel}
          zoom={false}
        />
        <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-muted-foreground">
          <li>{monthTick(MONTHS[0])}은 리포트에서 읽은 샘플 - 점선 테두리.</li>
          <li>{monthTick(CURRENT)}은 진행 중입니다.</li>
          <li>
            {monthTick(OUTLIER_MONTH)}의 A는 캠페인으로 다른 달의 몇 배
            (hasOutlier) - 확대/전체로 세로축을 바꿉니다.
          </li>
          {zoomed && <li>{OUTLIER_NOTE}</li>}
        </ul>
      </Demo>

      <Demo
        legend={<ChartLegend items={NET_LEGEND} />}
        title="부호 누적 · 예측 빗금 · 합계 범위"
      >
        <ColumnChart
          data={netRows}
          fadedKey="partial"
          forecastFlagKey="forecast"
          label="워크스페이스별 순증 기여와 합계 예측"
          maxBarSize={36}
          rangeKey="totalRange"
          series={NET_SERIES}
          signed
          tooltipLabel={netLabel}
          zoom={false}
        />
        <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-muted-foreground">
          <li>
            막대가 0 위면 늘어난 워크스페이스, 아래면 줄어든 워크스페이스입니다.
          </li>
          <li>{monthTick(CURRENT)}은 진행 중이라 흐린 막대로 그립니다.</li>
          <li>
            {monthTick(AHEAD[0])} · {monthTick(AHEAD[1])}은 전부 예측이라
            빗금으로 그립니다.
          </li>
          <li>빈 점은 예상 마감, 세로 막대는 80% 범위입니다.</li>
        </ul>
      </Demo>
    </Section>
  );
}
