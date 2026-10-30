import { StackedArea } from "@/components/charts/stacked-area";
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

/** Daily adds by channel over DAYS (the shared data stacks channels by month only). */
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
  };
});

const CHANNEL_SERIES = CHANNELS.map(({ key, name, color }) => ({
  key,
  name,
  color,
}));

export default function StackedSection() {
  return (
    <Section
      description="@/components/charts/stacked-area. 채널별 가입을 누적 영역으로, 또는 100% 기준으로 그립니다. 확대 · 축소는 맨 아래 공통 영역에서 봅니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      {/* The two side by side on wide screens, one under the other on narrow ones. */}
      <div className="grid gap-6 md:grid-cols-2">
        <Demo title="누적 (값)">
          <StackedArea
            data={dailyChannelRows}
            label="채널별 일간 가입"
            legend
            series={CHANNEL_SERIES}
            zoom={false}
          />
        </Demo>
        <Demo title="누적 (100%)">
          <StackedArea
            data={dailyChannelRows}
            label="채널별 가입 비중"
            legend
            percent
            series={CHANNEL_SERIES}
            zoom={false}
          />
        </Demo>
      </div>
    </Section>
  );
}
