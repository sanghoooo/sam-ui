"use client";

import { useState } from "react";
import { formatNumber } from "@/components/charts/chart-format";
import { TrendChart } from "@/components/charts/trend-chart";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  dailyRows,
  monthlyRows,
  quarterRows,
  TODAY,
  WORKSPACE_SERIES,
} from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "trend",
  short: "선/추이",
  title: "선 · 추이",
};

/** The three workspaces, each flagging the estimated days. */
const SERIES = WORKSPACE_SERIES.map((s) => ({ ...s, estimatedKey: "est" }));
const AIR_PROJECTION = {
  key: "air",
  name: "air",
  maxKey: "airForecastMax",
  avgKey: "airForecastAvg",
  minKey: "airForecastMin",
};
const AIR_BAND = { key: "air", name: "air", dataKey: "airRange" };
const ESTIMATE_NOTE =
  "리포트가 없는 날의 가입을 다음 리포트 구간에 고르게 나눈 값";

const PERIODS = [
  { value: "month", label: "월간" },
  { value: "quarter", label: "분기" },
] as const;
const HIGHLIGHTS = [
  { value: "all", label: "전체" },
  ...WORKSPACE_SERIES.map((s) => ({ value: s.key, label: s.name })),
] as const;

type Period = (typeof PERIODS)[number]["value"];
type Highlight = (typeof HIGHLIGHTS)[number]["value"];

function BarDemo() {
  const [period, setPeriod] = useState<Period>("month");
  const [highlight, setHighlight] = useState<Highlight>("all");
  return (
    <Demo
      legend={
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="강조할 사업"
            onValueChange={setHighlight}
            options={HIGHLIGHTS}
            value={highlight}
          />
          <SegmentedControl
            label="기간"
            onValueChange={setPeriod}
            options={PERIODS}
            value={period}
          />
        </div>
      }
      title="막대 · 빗금 추정 · 기간 전환 줌"
    >
      <TrendChart
        data={period === "month" ? dailyRows : quarterRows}
        estimateNote={ESTIMATE_NOTE}
        highlight={highlight === "all" ? null : highlight}
        kind="bar"
        koDays
        label="사업별 일간 가입 막대"
        legend
        projectionGroups={[AIR_PROJECTION]}
        series={SERIES}
        today={TODAY}
        todayLabel="chip"
        unit="회선"
        // The period flip animates even though both row sets end on the same day.
        zoomResetKey={period}
      />
    </Demo>
  );
}

export default function TrendSection() {
  return (
    <Section
      description="@/components/charts/trend-chart. 일별 · 월별 추이를 영역, 선, 막대로 그립니다. 툴팁은 커서 선을 따라 움직이고 플롯 위에 고정되며, 호버 점은 툴팁 위에 그려집니다. Ctrl + 휠로 확대하고 드래그로 옮기며, 기간을 바꾸면 이전 보기가 새 범위로 줌됩니다. 전망은 점선, 범위는 띠, 추정값은 빈 점이나 빗금으로 표시합니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="영역 · 전망과 범위 · 오늘">
        <TrendChart
          data={dailyRows}
          estimateNote={ESTIMATE_NOTE}
          guides={[
            {
              name: "7일 평균 순증",
              color: "var(--chart-5)",
              valueKey: "netAvg7",
              tip: (row) =>
                row.netAvg7 == null
                  ? null
                  : `${formatNumber(Number(row.netAvg7))}회선`,
            },
          ]}
          height={300}
          koDays
          label="사업별 일간 가입 추이"
          legend
          projectionBands={[AIR_BAND]}
          projectionGroups={[{ ...AIR_PROJECTION, endLabel: true }]}
          rangeLabel="예측 범위(80%)"
          rangeLabels={["지난 달", "이번 달"]}
          selectedRange={{ start: "2026-10-01", end: "2026-10-31" }}
          series={SERIES}
          targetKey="target"
          targetLabel="목표"
          today={TODAY}
          unit="회선"
          windows={[
            {
              from: "2026-10-12",
              to: "2026-10-12",
              color: "var(--chart-4)",
              label: "단말 출시",
            },
          ]}
        />
      </Demo>
      <BarDemo />
      <Demo title="월별 점 · 지수 기준선">
        <div className="grid gap-4 md:grid-cols-2">
          <TrendChart
            data={monthlyRows}
            denseTooltip
            dots
            height={180}
            label="월별 가입 회선과 목표"
            monthly
            series={[
              { key: "lines", name: "가입 회선", color: "var(--chart-1)" },
            ]}
            targetSeries={[
              { key: "target", name: "목표", color: "var(--chart-3)" },
            ]}
            unit="회선"
          />
          <TrendChart
            actualsOnlyTooltip
            data={dailyRows}
            format={(v) => formatNumber(v, 1)}
            height={180}
            hideZeroTick
            label="가입 지수 추이"
            series={[
              { key: "index100", name: "가입 지수", color: "var(--chart-2)" },
            ]}
            today={TODAY}
            yDomain="auto"
            yMarkers={[{ y: 100, label: "기준 100" }]}
          />
        </div>
      </Demo>
    </Section>
  );
}
