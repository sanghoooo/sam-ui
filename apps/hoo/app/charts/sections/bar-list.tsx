import { BarList } from "@/components/charts/bar-list";
import { formatSigned } from "@/components/charts/chart-format";
import { Badge } from "@/components/ui/badge";
import { BAR_LIST, CHANNELS, DELTAS } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "bar-list",
  short: "가로 막대 목록",
  title: "가로 막대 목록",
};

/** Each channel keeps its chart color even after BAR_LIST sorted the rows by value. */
const channelColor = (name: string) =>
  CHANNELS.find((c) => c.name === name)?.color ?? "var(--primary)";

export default function BarListSection() {
  return (
    <Section
      description="@/components/charts/bar-list. 레이블 · 막대 · 값 한 줄씩의 순위 목록입니다. 막대 너비는 가장 큰 절댓값에 대한 비율이라, 음수 행도 막대를 갖습니다. 색과 비고는 호출하는 쪽이 정합니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="채널별 가입">
        <BarList
          items={BAR_LIST.map((row, i) => ({
            label: row.name,
            value: row.value,
            color: channelColor(row.name),
            tag: i === 0 ? <Badge>{row.note}</Badge> : undefined,
          }))}
          label="채널별 가입"
        />
      </Demo>
      <Demo title="증감 (부호)">
        <BarList
          format={(v) => formatSigned(v, 1)}
          items={DELTAS.map((row) => ({
            label: row.name,
            value: row.value,
            color: row.value >= 0 ? "var(--chart-2)" : "var(--chart-5)",
          }))}
          label="채널별 전월 대비 증감"
          labelWidth="5rem"
        />
      </Demo>
    </Section>
  );
}
