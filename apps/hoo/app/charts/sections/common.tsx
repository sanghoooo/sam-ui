"use client";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartBrush } from "@/components/charts/chart-brush";
import {
  ChartBox,
  ChartLegend,
  ChartTip,
  type ChartTipRow,
  chartAxis,
  chartGrid,
  chartTooltipProps,
  formatCompact,
  formatDateKo,
  formatMonthDay,
  formatNumber,
  formatPeriodTick,
  formatSigned,
  type LegendItem,
} from "@/components/charts/chart-parts";
import { useChartZoom } from "@/components/charts/chart-zoom";
import { ChartZoomControl } from "@/components/charts/chart-zoom-control";
import { subscribeToTheme } from "@/lib/theme";
import {
  CHANNELS,
  dailyRows,
  quarterRows,
  type StackedRow,
  stackedRows,
  TODAY,
} from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "common",
  short: "공통",
  title: "공통 · 툴팁 · 범례 · 색 · 확대",
};

/** The last day of the sample quarter: a forecast-only day, two days past TODAY. */
const FORECAST_DAY = "2026-10-31";
const forecastRow =
  quarterRows.find((r) => r.key === FORECAST_DAY) ??
  quarterRows[quarterRows.length - 1];
const todayRow = quarterRows.find((r) => r.key === TODAY) ?? quarterRows[0];
/** The latest month of the stacked sample, for the bar rows and the dense tip. */
const octoberRow = stackedRows[stackedRows.length - 1];

/** The roomy tip: line rows (a forecast with its range, a guide line), then the target, then bar rows. */
const ROOMY_ROWS: ChartTipRow[] = [
  {
    name: "A",
    color: "var(--brand-air)",
    dashed: true,
    value: (
      <span className="flex flex-col items-end leading-tight">
        <span>{formatNumber(forecastRow.airForecastAvg ?? 0)}</span>
        <span className="text-[10px] font-normal text-muted-foreground">
          최소 {formatNumber(forecastRow.airForecastMin ?? 0)} ~ 최대{" "}
          {formatNumber(forecastRow.airForecastMax ?? 0)}
        </span>
      </span>
    ),
  },
  {
    name: "순증 7일 평균",
    color: "var(--chart-2)",
    dotted: true,
    value: formatNumber(todayRow.netAvg7 ?? 0),
  },
  {
    name: "목표",
    color: "var(--foreground)",
    dashed: true,
    separatorBefore: true,
    value: formatNumber(forecastRow.target),
  },
  {
    name: "APP (막대)",
    color: "var(--chart-1)",
    square: true,
    separatorBefore: true,
    value: formatNumber(octoberRow.app),
  },
  {
    name: "APP 전망 (막대)",
    color: "var(--chart-1)",
    square: true,
    dashed: true,
    value: formatNumber(Math.round(octoberRow.app * 1.04)),
  },
];

/** The dense tip: every channel of one month as bars, and their total as a line. */
const DENSE_ROWS: ChartTipRow[] = [
  ...CHANNELS.map(({ key, name, color }) => ({
    name,
    color,
    square: true,
    value: formatNumber(octoberRow[key]),
  })),
  {
    name: "합계",
    color: "var(--foreground)",
    value: formatNumber(
      CHANNELS.reduce((sum, { key }) => sum + octoberRow[key], 0),
    ),
  },
];

/** One of each swatch kind. */
const LEGEND_KINDS: LegendItem[] = [
  { name: "실적 (line)", color: "var(--chart-1)", kind: "line" },
  { name: "전망 (dashed)", color: "var(--chart-1)", kind: "dashed" },
  { name: "7일 평균 (dotted)", color: "var(--chart-2)", kind: "dotted" },
  { name: "가입 (square)", color: "var(--chart-3)", kind: "square" },
  { name: "추정 (hatched)", color: "var(--chart-3)", kind: "hatched" },
  { name: "전망 범위 (range)", color: "var(--chart-1)", kind: "range" },
];

/** Each formatter on a telling input: the call and what it prints. */
const FORMAT_SAMPLES: { call: string; result: string }[] = [
  { call: "formatNumber(1234567.891)", result: formatNumber(1234567.891) },
  { call: "formatNumber(21.456, 2)", result: formatNumber(21.456, 2) },
  { call: "formatSigned(420)", result: formatSigned(420) },
  { call: "formatSigned(-260)", result: formatSigned(-260) },
  { call: "formatSigned(0.25, 1)", result: formatSigned(0.25, 1) },
  { call: "formatCompact(123456789)", result: formatCompact(123456789) },
  { call: "formatCompact(15000)", result: formatCompact(15000) },
  { call: "formatCompact(-2120000)", result: formatCompact(-2120000) },
  { call: "formatCompact(980)", result: formatCompact(980) },
  { call: 'formatDateKo("2026-10-01")', result: formatDateKo("2026-10-01") },
  {
    call: 'formatMonthDay("2026-10-01")',
    result: formatMonthDay("2026-10-01"),
  },
];

/** The series color tokens, in order, with the hue each holds (styles/ui-kit.css). */
const CHART_COLORS = [
  { token: "chart-1", use: "시리즈 1 · 파랑" },
  { token: "chart-2", use: "시리즈 2 · 에메랄드" },
  { token: "chart-3", use: "시리즈 3 · 앰버" },
  { token: "chart-4", use: "시리즈 4 · 바이올렛" },
  { token: "chart-5", use: "시리즈 5 · 로즈" },
];

/** The box's legend: the channels as bars. */
const BOX_LEGEND: LegendItem[] = CHANNELS.map(({ name, color }) => ({
  name,
  color,
  kind: "square",
}));

/** The 30 days to TODAY, every one with an actual, for the standalone control and the brush. */
const LAST_30 = dailyRows.filter((r) => r.air !== null).slice(-30);

/** The gap over the box's plot; its tooltip pins to it. */
const BOX_PLOT_TOP = 8;

/** A CSS variable's current value on <html>, updated when the theme switches. */
function useCssVar(name: string) {
  return useSyncExternalStore(
    subscribeToTheme,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => "",
  );
}

/**
 * A chart color's row, as the palette's: the current theme's chip, the token, its use and its current value, and
 * beside it the same chip under `.dark`, so the dark value shows while the page is light.
 */
function ChartSwatch({ token, use }: { token: string; use: string }) {
  const value = useCssVar(`--${token}`);
  return (
    <li className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-lg border border-border"
        style={{ background: `var(--${token})` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[12px]">{token}</span>
        <span className="block text-[11px] text-muted-foreground">{use}</span>
        <span className="block font-mono text-[10px] text-muted-foreground">
          {value}
        </span>
      </span>
      <span className="dark flex shrink-0 items-center gap-1.5 rounded-lg bg-card p-1.5 pr-2 ring-1 ring-border">
        <span
          className="size-5 rounded-md"
          style={{ background: `var(--${token})` }}
        />
        <span className="text-[10px] text-muted-foreground">다크</span>
      </span>
    </li>
  );
}

export default function CommonSection() {
  // The box's slider is its only zoom (ChartBox has no host ref for wheel and drag), over the twelve months.
  const boxZoom = useChartZoom(stackedRows, (r) => r.key, 4, 44, 8);
  // The standalone control and the brush share this window over thirty days.
  const zoom30 = useChartZoom(LAST_30, (r) => r.key, 7, 0, 0);
  const shown = zoom30.end - zoom30.start + 1;
  return (
    <Section
      description="@/components/charts/chart-parts, chart-format, chart-zoom, chart-zoom-control, chart-brush. 모든 차트가 함께 쓰는 부품입니다. 툴팁은 토스트와 같은 반투명 유리 면이고, 범례는 HTML이라 차트가 커져도 크기가 그대로입니다. 시리즈 색은 --chart-1 ~ --chart-5이고, 확대는 불러온 행 위의 범위 슬라이더나 브러시 띠로 합니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="ChartTip · 범례 스와치 · 포맷">
        <div className="relative isolate overflow-hidden rounded-md bg-muted/40 p-4">
          {/* Faint bars behind the tips, so the frosted blur has something to blur. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 bottom-0 flex h-full items-end gap-1 opacity-60"
          >
            {stackedRows.map((row, i) => (
              <span
                className="min-w-0 flex-1 rounded-t-sm"
                key={row.key}
                style={{
                  height: `${30 + ((i * 37) % 60)}%`,
                  background: CHANNELS[i % CHANNELS.length].color,
                  opacity: 0.35,
                }}
              />
            ))}
          </div>
          <div className="relative flex flex-wrap items-start gap-4">
            <ChartTip
              label={
                <>
                  {formatDateKo(FORECAST_DAY)}
                  <span className="ml-1.5 rounded bg-muted px-1 py-px align-middle text-[10px] font-medium text-muted-foreground">
                    전망
                  </span>
                </>
              }
              rows={ROOMY_ROWS}
            />
            <ChartTip dense label={octoberRow.key} rows={DENSE_ROWS} />
            <ChartTip
              dense
              extra={
                <span className="text-[10px] text-muted-foreground">
                  extra: 행 아래의 자리
                </span>
              }
              label={formatMonthDay(TODAY)}
              rows={[
                {
                  name: "A",
                  color: "var(--brand-air)",
                  value: formatNumber(todayRow.air ?? 0),
                },
                {
                  name: "B",
                  color: "var(--brand-tds)",
                  value: formatNumber(todayRow.tds ?? 0),
                },
              ]}
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            ChartLegend · 스와치 종류
          </p>
          <ChartLegend items={LEGEND_KINDS} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            chart-format · 서버 컴포넌트에서도 같은 함수
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {FORMAT_SAMPLES.map(({ call, result }) => (
              <li
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px]"
                key={call}
              >
                <code className="font-mono text-muted-foreground">{call}</code>
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
                <span className="font-semibold tabular-nums">{result}</span>
              </li>
            ))}
          </ul>
        </div>
      </Demo>

      <Demo title="--chart-N 색">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {CHART_COLORS.map(({ token, use }) => (
            <ChartSwatch key={token} token={token} use={use} />
          ))}
        </ul>
        <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
          <li>
            색을 주지 않은 시리즈는 순서대로 이 색을 받습니다 (seriesColor).
          </li>
          <li>큰 칩은 현재 테마의 값, 작은 칩은 다크 값입니다.</li>
        </ul>
      </Demo>

      <Demo title="ChartBox · 확대 컨트롤 · 브러시">
        <ChartBox
          control={<ChartZoomControl inline zoom={boxZoom} />}
          height={220}
          label="채널별 월간 가입"
          legend={BOX_LEGEND}
          notes={[
            "범례는 플롯의 왼쪽 끝(y축 44px)에서, 컨트롤은 오른쪽 여백 8px에서 끝납니다.",
            "슬라이더가 12개월 중 보이는 범위를 정합니다 (최소 4개월).",
          ]}
        >
          <AreaChart
            data={boxZoom.data}
            margin={{ top: BOX_PLOT_TOP, right: 8, bottom: 0, left: 0 }}
          >
            {chartGrid}
            <XAxis
              {...chartAxis}
              dataKey="key"
              tickFormatter={(v) => formatPeriodTick(String(v))}
            />
            <YAxis
              {...chartAxis}
              tickFormatter={(v) => formatCompact(Number(v))}
              width={44}
            />
            {CHANNELS.map(({ key, name, color }) => (
              <Area
                dataKey={key}
                fill={color}
                fillOpacity={0.55}
                isAnimationActive={false}
                key={key}
                name={name}
                stackId="s"
                stroke={color}
                type="monotone"
              />
            ))}
            <Tooltip
              {...chartTooltipProps(BOX_PLOT_TOP)}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as StackedRow;
                return (
                  <ChartTip
                    label={String(label)}
                    rows={CHANNELS.map(({ key, name, color }) => ({
                      name,
                      color,
                      square: true,
                      value: formatNumber(row[key]),
                    }))}
                  />
                );
              }}
            />
          </AreaChart>
        </ChartBox>
        <div className="rounded-md border border-border p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ChartZoomControl compact inline zoom={zoom30} />
            <p className="text-[11px] text-muted-foreground tabular-nums">
              start {zoom30.start} · end {zoom30.end} · {shown}/{zoom30.length}
              행 · {formatMonthDay(LAST_30[zoom30.start].key)} ~{" "}
              {formatMonthDay(LAST_30[zoom30.end].key)}
            </p>
          </div>
          <ChartBrush rows={LAST_30} valueKey="air" zoom={zoom30} />
        </div>
      </Demo>
    </Section>
  );
}
