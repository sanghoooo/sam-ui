import { formatNumber } from "@/components/charts/chart-format";
import { ShareChart } from "@/components/charts/share-chart";
import { CHANNELS, stackedRows } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "share",
  short: "비중",
  title: "비중",
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

/** Lines by plan, more parts than a pie can hold; the small plans folded into 기타 in the muted color. */
const PLAN_DATA = [
  { name: "5G 무제한", value: 18200 },
  { name: "5G 100GB", value: 12400 },
  { name: "LTE 무제한", value: 9800 },
  { name: "5G 30GB", value: 7600 },
  { name: "LTE 10GB", value: 5400 },
  { name: "청소년", value: 3900 },
  { name: "시니어", value: 3100 },
  { name: "LTE 3GB", value: 2300 },
  { name: "데이터 쉐어링", value: 1500 },
  { name: "기타", value: 900, color: "var(--muted-foreground)" },
];

export default function ShareSection() {
  return (
    <Section
      description="@/components/charts/share-chart. 비중은 ShareChart 하나를 kind로 나눠 그립니다. ring은 가운데 수치를 둔 링, pie는 구성 파이, treemap은 항목이 많은 구성을 네모칸 크기로 보여 주는 트리맵입니다. 링 조각 사이는 2°씩 비우고 테두리는 없습니다. 트리맵 칸은 비중이 클수록 진하고, 들어갈 자리가 있으면 이름과 비중을 적습니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      {/* The three in equal columns of one row on wide screens; on medium ones the treemap takes the row under the two. */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Demo title="비중 링 · ring">
          <div className="flex justify-center">
            <ShareChart
              center={SHARE_CENTER}
              data={SHARE_DATA}
              kind="ring"
              label="온라인 비중"
              size={160}
              sub="온라인 비중"
            />
          </div>
        </Demo>
        <Demo title="구성 파이 + 목록 · pie">
          <ShareChart
            data={CHANNEL_DATA}
            kind="pie"
            label={`${latest.key} 채널별 가입 구성`}
            legend
            size={160}
          />
        </Demo>
        <div className="md:col-span-2 lg:col-span-1">
          <Demo title="네모칸 비중 · treemap">
            <ShareChart
              data={PLAN_DATA}
              height={160}
              kind="treemap"
              label="요금제별 회선 비중"
            />
          </Demo>
        </div>
      </div>
    </Section>
  );
}
