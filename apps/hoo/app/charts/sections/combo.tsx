import { formatSigned } from "@/components/charts/chart-format";
import { ComboChart } from "@/components/charts/combo-chart";
import { comboRows, sourceRows } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "combo",
  short: "막대 + 선",
  title: "막대 + 선",
};

/**
 * Port-in and port-out as two positive lines (the shared rows keep the outflow negative for the net), the net as a
 * signed bar; the last month is still running, so its bar draws fainter.
 */
const PORTING_ROWS = comboRows.map((r, i) => ({
  key: r.key,
  inflow: r.inflow,
  outflow: Math.abs(r.outflow),
  net: r.net,
  partial: i === comboRows.length - 1,
}));

const PORTING_LINES = [
  { key: "inflow", name: "유입", color: "var(--chart-1)" },
  { key: "outflow", name: "유출", color: "var(--chart-5)" },
];
const PORTING_BARS = [
  {
    key: "net",
    name: "순이동",
    color: "var(--chart-4)",
    axis: "right" as const,
  },
];

/** "2026-10" → "2026년 10월". */
const monthLabel = (key: string) =>
  `${key.slice(0, 4)}년 ${Number(key.slice(5, 7))}월`;

const SOURCE_BARS = [
  { key: "newSub", name: "신규 가입", color: "var(--chart-1)", stack: true },
  { key: "mnp", name: "번호이동", color: "var(--chart-4)", stack: true },
  {
    key: "deviceChange",
    name: "기기변경",
    color: "var(--chart-3)",
    stack: true,
  },
];
const SOURCE_LINES = [
  { key: "share", name: "신규 비중", axis: "right" as const },
];

export default function ComboSection() {
  return (
    <Section
      description="@/components/charts/combo-chart. 막대와 선을 한 플롯에 두고 왼쪽 · 오른쪽 축을 나눕니다. 순이동처럼 음수가 있으면 0선을 긋고, 비중 선은 오른쪽 % 축에 올립니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="유입 · 유출 선 + 순이동 막대 (오른쪽 축)">
        <ComboChart
          bars={PORTING_BARS}
          data={PORTING_ROWS}
          fadedKey="partial"
          label="월별 번호이동 유입 · 유출 · 순이동"
          legend
          lines={PORTING_LINES}
          rightAxis={{ format: (v) => formatSigned(v) }}
          tooltipLabel={(row) =>
            `${monthLabel(String(row.key))}${row.partial ? " (진행 중)" : ""}`
          }
          zeroLine
          zoom={false}
        />
      </Demo>
      <Demo title="누적 막대 + 비중 선 (% 축)">
        <ComboChart
          bars={SOURCE_BARS}
          data={sourceRows}
          label="월별 가입 유형별 건수와 신규 비중"
          legend
          lines={SOURCE_LINES}
          rightAxis={{ percent: true }}
          tooltipLabel={(row) => monthLabel(String(row.key))}
          zoom={false}
        />
      </Demo>
    </Section>
  );
}
