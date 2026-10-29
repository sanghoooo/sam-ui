import { formatNumber } from "@/components/charts/chart-format";
import { Donut } from "@/components/charts/donut";
import { CHANNELS, stackedRows } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "donut",
  short: "도넛",
  title: "도넛",
};

/** Online (APP + WEB) lines of all lines: a 62% share, the rest in the muted color. */
const TOTAL = 50000;
const ONLINE = 31000;
const SHARE_DATA = [
  { name: "온라인", value: ONLINE, color: "var(--brand-air)" },
  { name: "그 외", value: Math.max(0, TOTAL - ONLINE), color: "var(--muted)" },
];
const SHARE_CENTER = `${formatNumber((ONLINE / TOTAL) * 100)}%`;

/** The latest month's adds by channel, colors left to --chart-N. */
const latest = stackedRows[stackedRows.length - 1];
const CHANNEL_DATA = CHANNELS.map(({ key, name }) => ({
  name,
  value: latest[key],
}));

export default function DonutSection() {
  return (
    <Section
      description="@/components/charts/donut. 가운데 수치를 둔 링과 채널 구성 파이입니다. 조각 사이는 2°씩 비우고 테두리는 없습니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="비중 링 (KPI)">
        <div className="flex flex-wrap items-center gap-8">
          <Donut
            center={SHARE_CENTER}
            data={SHARE_DATA}
            label="온라인 비중 86px"
            size={86}
            sub="온라인 비중"
          />
          <Donut
            center={SHARE_CENTER}
            data={SHARE_DATA}
            label="온라인 비중 148px"
            size={148}
            sub="온라인 비중"
          />
        </div>
      </Demo>
      <Demo title="구성 파이 + 목록">
        <Donut
          data={CHANNEL_DATA}
          label={`${latest.key} 채널별 가입 구성`}
          legend
          pie
          size={260}
        />
      </Demo>
    </Section>
  );
}
