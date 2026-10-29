import { StackedArea } from "@/components/charts/stacked-area";
import { Card } from "@/components/ui/card";
import { CHANNELS, DAYS } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "stacked",
  short: "누적 영역",
  title: "누적 영역",
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

const rng = mulberry32(11);
const noise = (amount: number) => (rng() - 0.5) * 2 * amount;

/** Daily adds by channel over DAYS (the shared data stacks channels by month only), plus the card's two line kinds. */
const dailyChannelRows = DAYS.map((key, i) => {
  // 2026-09-01 is a Tuesday: weekends sell less.
  const day = (i + 2) % 7;
  const off = day === 0 || day === 6;
  const app = Math.round(
    330 + 2.4 * i + 35 * Math.sin(i / 6) + (off ? -90 : 0) + noise(30),
  );
  const web = Math.round(
    240 + 1.1 * i + 25 * Math.sin(i / 8 + 1) + (off ? -60 : 0) + noise(24),
  );
  const call = Math.round(
    150 - 0.6 * i + 15 * Math.sin(i / 5 + 2) + (off ? -70 : 0) + noise(18),
  );
  const store = Math.round(
    280 + 0.5 * i + 20 * Math.sin(i / 9 + 3) + (off ? -40 : 0) + noise(26),
  );
  const partner = Math.round(
    95 + 0.9 * i + 12 * Math.sin(i / 7 + 4) + (off ? -20 : 0) + noise(14),
  );
  return {
    key,
    app,
    web,
    call,
    store,
    partner,
    newLines: Math.round((app + web) * 0.62 + noise(20)),
    transfers: Math.round((call + store + partner) * 0.48 + noise(16)),
  };
});

const CHANNEL_SERIES = CHANNELS.map(({ key, name, color }) => ({
  key,
  name,
  color,
}));

const LINE_SERIES = [
  { key: "newLines", name: "010 신규", color: "var(--chart-1)" },
  { key: "transfers", name: "번호이동", color: "var(--chart-2)" },
];

export default function StackedSection() {
  return (
    <Section
      description="@/components/charts/stacked-area. 채널별 가입을 누적 영역으로, 또는 100% 기준으로 그립니다. 오른쪽 위의 작은 슬라이더와 Ctrl + 휠로 확대합니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="누적 (값)">
        <StackedArea
          data={dailyChannelRows}
          label="채널별 일간 가입"
          legend
          series={CHANNEL_SERIES}
        />
      </Demo>
      <Demo title="누적 (100%) · 카드 축약형">
        <div className="grid gap-4 md:grid-cols-2">
          <StackedArea
            data={dailyChannelRows}
            label="채널별 가입 비중"
            legend
            percent
            series={CHANNEL_SERIES}
          />
          <Card className="min-w-0 p-4">
            <h4 className="text-[13px] font-semibold">
              회선 성장 · 010 신규 / 번호이동
            </h4>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              y축 없이 카드에 맞춘 축약형
            </p>
            <StackedArea
              className="mt-3"
              data={dailyChannelRows}
              fillOpacity={0.25}
              height={128}
              hideYAxis
              label="회선 성장"
              series={LINE_SERIES}
              zoom={false}
            />
          </Card>
        </div>
      </Demo>
    </Section>
  );
}
