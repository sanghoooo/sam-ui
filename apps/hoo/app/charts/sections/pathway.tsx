"use client";

import { useState } from "react";
import { formatNumber } from "@/components/charts/chart-format";
import {
  Pathway,
  type PathwayLink,
  type PathwayNode,
} from "@/components/charts/pathway";
import {
  PATHWAY_LINKS,
  PATHWAY_SOURCES,
  PATHWAY_TARGETS,
} from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "pathway",
  short: "흐름",
  title: "흐름 (2단)",
};

const sumOf = (pick: (l: PathwayLink) => boolean) =>
  PATHWAY_LINKS.filter(pick).reduce((sum, l) => sum + l.value, 0);

/** Each channel: its total adds, with the net share in brackets. */
const SOURCES: PathwayNode[] = PATHWAY_SOURCES.map(({ id, name, color }) => {
  const joined = sumOf((l) => l.source === id);
  const net = sumOf((l) => l.source === id && l.target === "net");
  return {
    id,
    label: name,
    color,
    detail: `${formatNumber(joined)} (순증 ${formatNumber(net)})`,
  };
});

/** 순증 and 해지, each labeled in its own color with its total. */
const TARGETS: PathwayNode[] = PATHWAY_TARGETS.map(({ id, name, color }) => ({
  id,
  label: name,
  color,
  tintLabel: true,
  detail: formatNumber(sumOf((l) => l.target === id)),
}));

/** Bands take the target's color (net adds in chart-2, churn in chart-5), not the channel's. */
const TARGET_COLOR = new Map(PATHWAY_TARGETS.map((t) => [t.id, t.color]));
const LINKS: PathwayLink[] = PATHWAY_LINKS.map((l) => ({
  ...l,
  color: TARGET_COLOR.get(l.target),
}));

const NAME_OF = new Map(PATHWAY_SOURCES.map((s) => [s.id, s.name]));

export default function PathwaySection() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Section
      description="@/components/charts/pathway. 채널에서 순증 · 해지로 흐르는 두 단 흐름도입니다. 띠는 두께를 끝까지 유지하고, 노드나 레이블에 마우스를 올리거나 포커스를 주면 그 경로만 밝아집니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="채널 → 순증 · 해지">
        <Pathway
          height={Math.max(200, SOURCES.length * 34)}
          label="채널별 순증과 해지 흐름"
          links={LINKS}
          onActiveChange={setActive}
          sources={SOURCES}
          targets={TARGETS}
        />
        <p className="text-[11px] text-muted-foreground">
          {active
            ? `onActiveChange: ${NAME_OF.get(active) ?? active} 채널의 경로를 보고 있습니다.`
            : "onActiveChange: 채널에 마우스를 올리거나 포커스를 주면 그 채널 id가 전달됩니다."}
        </p>
      </Demo>
    </Section>
  );
}
