"use client";

import { useState } from "react";
import {
  type ChartLane,
  ChartLanes,
  type ChartMarker,
} from "@/components/charts/chart-lanes";
import { TrendChart } from "@/components/charts/trend-chart";
import { dailyRows, LANE_ITEMS, LANES, TODAY } from "../sample-data";
import { Demo, Section, type SectionMeta } from "../section";

export const SECTION: SectionMeta = {
  id: "lanes",
  short: "레인",
  title: "어노테이션 레인",
};

/** The static export serves the site under a base path on Pages, so a plain link carries it. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const CHART_LANES: ChartLane[] = LANES.map(({ id, name, color }) => ({
  id,
  label: name,
  color,
}));

/**
 * The shared markers, plus the shapes they lack: a second item on 2026-10-12 (a count badge), an outlined turning
 * point candidate, and a badge and detail lines on the campaign range.
 */
const MARKERS: ChartMarker[] = [
  ...LANE_ITEMS.map(
    (item): ChartMarker => ({
      ...item,
      href: item.href && `${BASE_PATH}${item.href}`,
      ...(item.id === "c1"
        ? {
            badge: "종료",
            details: ["채널 APP · WEB", "순증 +1,240회선 · ROI 1.8"],
          }
        : {}),
    }),
  ),
  {
    id: "m3",
    lane: "market",
    date: "2026-10-12",
    title: "경쟁사 보조금 확대",
    summary: "플래그십 공시지원금 상향",
    color: "var(--chart-4)",
  },
  {
    id: "p3",
    lane: "pivot",
    date: "2026-10-05",
    title: "추세 전환 후보",
    badge: "후보",
    summary: "7일 이동평균 -4%, 기준(±5%) 미달",
    color: "var(--chart-3)",
    outline: true,
  },
];

const SERIES = [{ key: "air", name: "A", color: "var(--brand-air)" }];

type Window = { from: string; to: string; color: string; label?: string };

export default function LanesSection() {
  // The open list's range items, shaded on the plot while the list is open.
  const [windows, setWindows] = useState<Window[]>([]);
  return (
    <Section
      description="@/components/charts/chart-lanes. 플롯 아래 x 레이블 밑에 두는 어노테이션 레인입니다. 날짜마다 둥근 마커가 서고 기간 항목은 띠로 이어지며, 마커에 마우스를 올리거나 포커스를 주면 목록이 아래로 열리고 차트에는 그 날짜의 선이 그어집니다. 열린 항목의 기간은 플롯에 음영으로 표시되고, 기간을 바꾸면 플롯과 함께 사라졌다 다시 나타납니다."
      id={SECTION.id}
      title={SECTION.title}
    >
      <Demo title="TrendChart + 레인 3개">
        <TrendChart
          data={dailyRows}
          koDays
          lanes={(ctx) => (
            <ChartLanes
              {...ctx}
              items={MARKERS}
              lanes={CHART_LANES}
              onActiveItems={(items, open) =>
                setWindows(
                  open
                    ? items
                        .filter((item) => item.endDate)
                        .map((item) => ({
                          from: item.date,
                          to: item.endDate as string,
                          color: item.color,
                          label: item.title,
                        }))
                    : [],
                )
              }
            />
          )}
          series={SERIES}
          today={TODAY}
          windows={windows}
          zoom={false}
        />
      </Demo>
    </Section>
  );
}
