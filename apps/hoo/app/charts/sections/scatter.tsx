"use client";

import { formatNumber } from "@/components/charts/chart-format";
import {
  ScatterPlot,
  type ScatterPlotPoint,
} from "@/components/charts/scatter-plot";
import { scatterPoints } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "scatter",
  short: "산점도",
  title: "산점도",
};

const won = (v: number) => `${formatNumber(v)}원`;

/** Ours in the first chart color; the market, the reference group, in the muted foreground. */
const planPoints: ScatterPlotPoint[] = scatterPoints.map((p) => ({
  ...p,
  color: p.group === "자사" ? "var(--chart-1)" : "var(--muted-foreground)",
}));

/** The data buckets of the categorical example, in row order. */
const BUCKETS = [
  "7GB 이하",
  "7GB ~ 20GB",
  "20GB ~ 50GB",
  "50GB ~ 100GB",
  "100GB 이상",
  "매일 추가",
  "무제한",
];

const SOURCES = [
  { name: "공식몰", color: "var(--chart-1)" },
  { name: "제휴몰", color: "var(--chart-3)" },
  { name: "비교 사이트", color: "var(--chart-2)" },
];

/** Two offers per source in every bucket, the fee rising with the bucket and differing a little by source. */
const bucketPoints: ScatterPlotPoint[] = SOURCES.flatMap((source, si) =>
  BUCKETS.flatMap((bucket, bi) =>
    [0, 1].map((k) => {
      // Deterministic spread: a few hundred won from the source and the offer, so points in a row do not stack.
      const x =
        19000 +
        8000 * bi +
        1700 * si +
        3100 * k +
        ((bi * 7 + si * 3) % 5) * 400;
      return {
        name: `${source.name} ${bucket} ${k === 0 ? "A" : "B"}`,
        group: source.name,
        color: source.color,
        x,
        y: bi,
        detail: k === 0 ? "통화 무제한" : "통화 300분",
      };
    }),
  ),
);

export default function ScatterSection() {
  return (
    <Section
      description="@/components/charts/scatter-plot. 요금과 가입 같은 두 값으로 점을 찍고, 크기로 세 번째 값을 보입니다. 기준 집단은 옅게 그려 자사 점이 위에 읽힙니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="자사 · 시장 분포">
        <ScatterPlot
          detailLabel="조건"
          faintGroups={["시장"]}
          formatX={won}
          label="요금제별 월 요금과 순증, 크기는 회선 수"
          points={planPoints}
          xLabel="월 요금"
          yLabel="순증"
        />
      </Demo>
      <Demo title="구간별 (범주 y)">
        <ScatterPlot
          faintGroups={["비교 사이트"]}
          formatX={won}
          label="데이터 구간별 월 요금 분포, 판매처 3곳"
          points={bucketPoints}
          xLabel="월 요금"
          yCategories={BUCKETS}
          yLabel="데이터 구간"
        />
      </Demo>
    </Section>
  );
}
