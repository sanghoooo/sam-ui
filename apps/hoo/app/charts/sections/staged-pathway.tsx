"use client";

import { formatNumber } from "@/components/charts/chart-format";
import {
  type PathwayLink,
  type PathwayNode,
  StagedPathway,
} from "@/components/charts/staged-pathway";
import { CHANNELS } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "staged-pathway",
  short: "흐름 (다단)",
  title: "흐름 (다단)",
};

// Fixed figures rather than the shared STAGED_COLUMNS: the last channel is tiny (3 joins, 1 churn) so its flow draws as
// the 1px line, and the shared data has no such channel.
const JOINED: Record<string, number> = {
  app: 5230,
  web: 3870,
  call: 2610,
  store: 1420,
  partner: 3,
};
const CHURNED: Record<string, number> = {
  app: 1570,
  web: 1320,
  call: 990,
  store: 610,
  partner: 1,
};
const NET_COLOR = "var(--chart-2)";
const CHURN_COLOR = "var(--chart-5)";

const netParts = Object.fromEntries(
  CHANNELS.map(({ key }) => [key, JOINED[key] - CHURNED[key]]),
);
const churnParts = Object.fromEntries(
  CHANNELS.map(({ key }) => [key, CHURNED[key]]),
);
const joinedTotal = CHANNELS.reduce((sum, { key }) => sum + JOINED[key], 0);
const churnTotal = CHANNELS.reduce((sum, { key }) => sum + CHURNED[key], 0);
const netTotal = joinedTotal - churnTotal;

const COLUMNS: PathwayNode[][] = [
  CHANNELS.map(({ key, name, color }) => ({
    id: key,
    label: name,
    color,
    detail: (
      <span className="text-foreground">{formatNumber(JOINED[key])}</span>
    ),
  })),
  // The 가입 total over its bar, in its color, haloed to read over the bands.
  [
    {
      id: "join",
      label: `가입 ${formatNumber(joinedTotal)}`,
      color: "var(--chart-1)",
      tintLabel: true,
    },
  ],
  [
    {
      id: "net",
      label: `순증 ${formatNumber(netTotal)}`,
      color: NET_COLOR,
      tintLabel: true,
      // A hovered channel's own.
      traceLabel: (id) => `순증 ${formatNumber(netParts[id] ?? 0)}`,
    },
    {
      id: "churn",
      label: `해지 ${formatNumber(churnTotal)}`,
      color: CHURN_COLOR,
      tintLabel: true,
      traceLabel: (id) => `해지 ${formatNumber(churnParts[id] ?? 0)}`,
    },
  ],
];

const LINKS: PathwayLink[] = [
  ...CHANNELS.map(({ key }) => ({
    source: key,
    target: "join",
    value: JOINED[key],
  })),
  {
    source: "join",
    target: "net",
    value: netTotal,
    color: NET_COLOR,
    parts: netParts,
  },
  {
    source: "join",
    target: "churn",
    value: churnTotal,
    color: CHURN_COLOR,
    parts: churnParts,
  },
];

export default function StagedPathwaySection() {
  return (
    <Section
      description="@/components/charts/staged-pathway. 채널 → 가입 → 순증 · 해지의 세 단 흐름도입니다. 첫 열의 채널에 마우스를 올리면 그 채널의 몫이 뒤쪽 흐름 안에서 밝게 이어지고, 끝 레이블이 그 채널의 수치로 바뀝니다. 가는 흐름은 1px 선으로라도 보입니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="채널 → 가입 → 순증 · 해지">
        <StagedPathway
          columns={COLUMNS}
          // A label line per channel and room for the larger bands.
          height={Math.max(200, CHANNELS.length * 20 + 100)}
          label={`채널별 가입 경로. 가입 ${formatNumber(joinedTotal)}회선 중 순증 ${formatNumber(netTotal)}회선, 해지 ${formatNumber(churnTotal)}회선`}
          links={LINKS}
        />
      </Demo>
    </Section>
  );
}
