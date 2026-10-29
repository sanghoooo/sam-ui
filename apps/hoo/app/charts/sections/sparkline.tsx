import { AlertTriangle } from "lucide-react";
import { formatNumber } from "@/components/charts/chart-format";
import { SPARK_BOX_CLASS, Sparkline } from "@/components/charts/sparkline";
import { Card } from "@/components/ui/card";
import { dailyRows, TODAY, WORKSPACE_SERIES } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "sparkline",
  short: "스파크라인",
  title: "스파크라인",
};

/** The last 30 days of actuals to TODAY, per workspace. */
const RECENT = dailyRows.filter((r) => r.key <= TODAY).slice(-30);
const TILES = WORKSPACE_SERIES.map((s) => {
  const values = RECENT.map((r) => r[s.key]).filter(
    (v): v is number => v !== null,
  );
  return { ...s, values, value: values[values.length - 1] };
});

/** Monthly unit prices this year (천원) and the price being entered now, past the range. */
const PRICE_HISTORY = [
  120, 125, 118, 130, 135, 128, 140, 138, 145, 150, 142, 155,
];
const PRICE_INPUT = 170;
const PRICE_MIN = Math.min(...PRICE_HISTORY);
const PRICE_MAX = Math.max(...PRICE_HISTORY);
const OUT_OF_RANGE = PRICE_INPUT < PRICE_MIN || PRICE_INPUT > PRICE_MAX;

export default function SparklineSection() {
  return (
    <Section
      description="@/components/charts/sparkline. 최근 30일 추이를 KPI 옆 작은 상자에 그립니다. recharts 없이 SVG 한 장이며, 상자 크기에 맞춰 늘어납니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="KPI 타일">
        <div className="grid gap-3 sm:grid-cols-3">
          {TILES.map((t) => (
            <Card className="p-4" key={t.key}>
              <p className="text-[12px] font-medium text-muted-foreground">
                {t.name} 가입
              </p>
              {/* Top-aligned, so the spark never pushes the value below the other tiles' values. */}
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="text-[22px] leading-8 font-bold tabular-nums">
                  {formatNumber(t.value)}
                  <span className="ml-1 text-[12px] font-medium text-muted-foreground">
                    건
                  </span>
                </p>
                <div className={SPARK_BOX_CLASS}>
                  <Sparkline color={t.color} values={t.values} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                최근 30일 · {RECENT[0].key.slice(5).replace("-", ".")}~
                {TODAY.slice(5).replace("-", ".")}
              </p>
            </Card>
          ))}
        </div>
      </Demo>

      <Demo title="넓은 상자 · 경고">
        <div className="rounded-xl border border-border bg-muted/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold">MNP · 2026 단가 이력</p>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              최소 {PRICE_MIN}천원 · 최대 {PRICE_MAX}천원 · 현재 입력{" "}
              {PRICE_INPUT}천원
            </span>
          </div>
          <div className="mt-2 h-10">
            <Sparkline
              color="var(--chart-4)"
              label="2026년 월별 단가 추이"
              values={PRICE_HISTORY}
            />
          </div>
          {OUT_OF_RANGE && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-chart-3">
              <AlertTriangle aria-hidden className="size-3.5" />
              입력 단가가 올해 적용된 범위({PRICE_MIN}~{PRICE_MAX}천원)를
              벗어납니다.
            </p>
          )}
        </div>
      </Demo>
    </Section>
  );
}
