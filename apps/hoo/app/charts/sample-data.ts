/*
 * Deterministic sample data for the /charts page. Everything comes from a seeded generator (mulberry32(7)) and plain
 * string dates, so the static export and the browser agree. Counts are whole numbers (Math.round); rates and deltas
 * keep one decimal (Number(v.toFixed(1))). Sections read these and derive their own values; nothing here formats for
 * the screen (sections use formatNumber/formatCompact/formatSigned).
 */

import { formatNumber } from "@/components/charts/chart-format";
import { addMonths } from "@/components/ui/month-stepper";

/** A small seeded PRNG: the same sequence on every run. */
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

const rng = mulberry32(7);
/** A random number in [-amount, amount). */
const noise = (amount: number) => (rng() - 0.5) * 2 * amount;
const dec1 = (v: number) => Number(v.toFixed(1));

/** Twelve months to 2026-10, as "YYYY-MM". */
export const MONTHS = Array.from({ length: 12 }, (_, i) =>
  addMonths("2026-10", i - 11),
);

const DAYS_IN: Record<string, number> = {
  "2026-08": 31,
  "2026-09": 30,
  "2026-10": 31,
};
const daysOf = (month: string) =>
  Array.from(
    { length: DAYS_IN[month] },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );

/** 2026-08-01 … 2026-10-31 (92 days): the period-flip example's wider row set. */
export const QUARTER_DAYS = [
  ...daysOf("2026-08"),
  ...daysOf("2026-09"),
  ...daysOf("2026-10"),
];
/** 2026-09-01 … 2026-10-31 (61 days): the last two months of QUARTER_DAYS. */
export const DAYS = QUARTER_DAYS.slice(31);
export const TODAY = "2026-10-29";
const TODAY_INDEX = QUARTER_DAYS.indexOf(TODAY);

/**
 * The workspaces, in brand colors, named A, B and C on the page so the samples don't read as real figures. The keys
 * stay the workspace ids the colors come from.
 */
export const WORKSPACE_SERIES = [
  { key: "air", name: "A", color: "var(--brand-air)" },
  { key: "tds", name: "B", color: "var(--brand-tds)" },
  { key: "mvno", name: "C", color: "var(--brand-mvno)" },
] as const;

/** The sales channels, on the categorical chart colors. */
export const CHANNELS = [
  { key: "app", name: "APP", color: "var(--chart-1)" },
  { key: "web", name: "WEB", color: "var(--chart-2)" },
  { key: "call", name: "콜센터", color: "var(--chart-3)" },
  { key: "store", name: "대리점", color: "var(--chart-4)" },
  { key: "partner", name: "제휴", color: "var(--chart-5)" },
] as const;

export type DailyRow = {
  /** "YYYY-MM-DD" */
  key: string;
  air: number | null;
  tds: number | null;
  mvno: number | null;
  /** air's forecast from TODAY (its first value is that day's actual) to the end of the rows. */
  airForecastAvg: number | null;
  airForecastMax: number | null;
  airForecastMin: number | null;
  /** [min, max] of the forecast, from TODAY. */
  airRange: [number, number] | null;
  /** The daily target: 1,800 to September, 2,000 in October. */
  target: number;
  /** True on days whose actual is an estimate (drawn hatched or hollow). */
  est: boolean;
  /** air's 7-day trailing average of net adds, a guide line. */
  netAvg7: number | null;
  /** An index series around 100, for the y-marker example. */
  index100: number | null;
};

function buildDailyRows(days: string[]): DailyRow[] {
  // 2026-08-01 is a Saturday: weekends sell less.
  const weekend = (i: number) => (6 + i) % 7 === 0 || (6 + i) % 7 === 6;
  const nets: number[] = [];
  let index = 100;
  const actuals = days.map((key, i) => {
    const off = weekend(i);
    const air = Math.round(
      1650 + 2.5 * i + 150 * Math.sin(i / 9) + (off ? -350 : 0) + noise(110),
    );
    const tds = Math.round(
      950 + 1.2 * i + 90 * Math.sin(i / 7 + 1) + (off ? -200 : 0) + noise(70),
    );
    const mvno = Math.round(
      420 + 0.8 * i + 40 * Math.sin(i / 11 + 2) + (off ? -90 : 0) + noise(35),
    );
    const churn = Math.round(air * 0.55 + noise(90));
    nets.push(air - churn);
    const window = nets.slice(-7);
    const netAvg7 = Math.round(
      window.reduce((sum, v) => sum + v, 0) / window.length,
    );
    index = dec1(index + noise(1.5) + 0.05);
    return { key, air, tds, mvno, netAvg7, index100: index };
  });
  const todayActual = actuals[TODAY_INDEX].air;
  return days.map((key, i) => {
    const past = i <= TODAY_INDEX;
    const ahead = i - TODAY_INDEX;
    const forecast = ahead >= 0;
    // The forecast starts at the day's actual, then drifts up with a little noise.
    const avg = !forecast
      ? 0
      : ahead === 0
        ? todayActual
        : Math.round(todayActual + 6 * ahead + noise(20));
    const spread = Math.round(Math.sqrt(ahead) * 110);
    return {
      key,
      air: past ? actuals[i].air : null,
      tds: past ? actuals[i].tds : null,
      mvno: past ? actuals[i].mvno : null,
      airForecastAvg: forecast ? avg : null,
      airForecastMax: forecast ? avg + spread : null,
      airForecastMin: forecast ? avg - spread : null,
      airRange: forecast ? [avg - spread, avg + spread] : null,
      target: key.startsWith("2026-10") ? 2000 : 1800,
      est: key === "2026-10-27" || key === "2026-10-28",
      netAvg7: past ? actuals[i].netAvg7 : null,
      index100: past ? actuals[i].index100 : null,
    };
  });
}

/** Daily rows over QUARTER_DAYS; actuals to TODAY, null after, forecasts from TODAY. */
export const quarterRows: DailyRow[] = buildDailyRows(QUARTER_DAYS);
/** The same rows over DAYS (the last 61 of quarterRows). */
export const dailyRows: DailyRow[] = quarterRows.slice(31);

/**
 * The first trend example's rows: 2026-09-01 to 2026-11-17, so TODAY sits about three quarters along and the
 * forecast and its range run on past it. The November days carry the forecast only, drawn from fixed curves (not
 * the shared noise, so the other examples' data stays as it is).
 */
export const forecastRows: DailyRow[] = (() => {
  const last = quarterRows[quarterRows.length - 1];
  const start = quarterRows.findIndex((r) => r.key === TODAY);
  const todayActual = quarterRows[start].airForecastAvg ?? 0;
  const lastAhead = quarterRows.length - 1 - start;
  const november = Array.from({ length: 17 }, (_, i) => {
    const ahead = lastAhead + i + 1;
    const avg = Math.round(
      todayActual + 6 * ahead + 18 * Math.sin(ahead / 2.3),
    );
    const spread = Math.round(Math.sqrt(ahead) * 110);
    return {
      ...last,
      key: `2026-11-${String(i + 1).padStart(2, "0")}`,
      airForecastAvg: avg,
      airForecastMax: avg + spread,
      airForecastMin: avg - spread,
      airRange: [avg - spread, avg + spread] as [number, number],
      est: false,
    };
  });
  return [...dailyRows, ...november];
})();

export type MonthlyRow = {
  /** "YYYY-MM" */
  key: string;
  /** Lines in service; null for 2026-02, to show a gap. */
  lines: number | null;
  target: number;
  net: number;
};

/** Monthly lines, target and net adds over MONTHS. */
export const monthlyRows: MonthlyRow[] = MONTHS.map((key, i) => {
  const lines = Math.round(41000 + 900 * i + noise(600));
  return {
    key,
    lines: key === "2026-02" ? null : lines,
    target: 42000 + 1000 * i,
    net: Math.round(600 + 60 * Math.sin(i / 2) + noise(350)),
  };
});

export type StackedRow = { key: string } & Record<
  (typeof CHANNELS)[number]["key"],
  number
>;

/** Monthly adds by channel over MONTHS. */
export const stackedRows: StackedRow[] = MONTHS.map((key, i) => ({
  key,
  app: Math.round(9000 + 350 * i + noise(500)),
  web: Math.round(6500 + 120 * i + noise(400)),
  call: Math.round(4200 - 40 * i + noise(300)),
  store: Math.round(7800 + 60 * i + noise(450)),
  partner: Math.round(2600 + 90 * i + noise(250)),
}));

export type ComboRow = {
  /** "YY.MM" */
  key: string;
  /** Ports in (positive). */
  inflow: number;
  /** Ports out (negative). */
  outflow: number;
  /** inflow + outflow. */
  net: number;
  /** Market share, one decimal %. */
  share: number;
};

/** Monthly port-in/port-out flows and share over MONTHS. */
export const comboRows: ComboRow[] = MONTHS.map((month, i) => {
  const inflow = Math.round(5200 + 110 * i + noise(600));
  const outflow = -Math.round(4600 + 60 * i + noise(500));
  return {
    key: month,
    inflow,
    outflow,
    net: inflow + outflow,
    share: dec1(21.4 + 0.12 * i + noise(0.4)),
  };
});

export type SourceRow = {
  /** "YYYY-MM" */
  key: string;
  newSub: number;
  mnp: number;
  deviceChange: number;
  /** New subscriptions' share of the month, one decimal %. */
  share: number;
};

/** Monthly adds by source (stacked) with the new-subscription share. */
export const sourceRows: SourceRow[] = MONTHS.map((key, i) => {
  const newSub = Math.round(12000 + 280 * i + noise(700));
  const mnp = Math.round(9500 + 150 * i + noise(600));
  const deviceChange = Math.round(7000 - 50 * i + noise(400));
  return {
    key,
    newSub,
    mnp,
    deviceChange,
    share: dec1((newSub / (newSub + mnp + deviceChange)) * 100),
  };
});

export type ScatterPoint = {
  name: string;
  group: "자사" | "시장";
  /** Monthly fee, 원. */
  x: number;
  /** Net adds in the month. */
  y: number;
  /** Lines in service, for the bubble size. */
  size: number;
  detail: string;
};

const PLAN_NAMES = {
  자사: [
    "라이트 5G",
    "스탠다드 5G",
    "프리미엄 5G",
    "데이터 무제한",
    "시니어",
    "청년",
    "패밀리",
  ],
  시장: [
    "알뜰 15",
    "요고 30",
    "너겟 45",
    "T 베이직",
    "요고 59",
    "너겟 75",
    "T 플러스",
  ],
} as const;

/** Fourteen plans, seven of ours and seven market ones, by fee and net adds. */
export const scatterPoints: ScatterPoint[] = (
  ["자사", "시장"] as const
).flatMap((group) =>
  PLAN_NAMES[group].map((name, i) => {
    const x = Math.round((29000 + 9500 * i + noise(2500)) / 100) * 100;
    const y = Math.round(
      (group === "자사" ? 900 : 650) - 60 * Math.abs(i - 3) + noise(220),
    );
    const size = Math.round(12000 + 3000 * (6 - i) + noise(2500));
    return {
      name,
      group,
      x,
      y,
      size,
      detail: `월 ${formatNumber(x)}원 · 회선 ${formatNumber(size)}`,
    };
  }),
);

export type FlowNode = { id: string; name: string; color: string };
export type FlowLink = { source: string; target: string; value: number };

/** Pathway sources: the channels. */
export const PATHWAY_SOURCES: FlowNode[] = CHANNELS.map(
  ({ key, name, color }) => ({
    id: key,
    name,
    color,
  }),
);
/** Pathway targets: net adds and churn. */
export const PATHWAY_TARGETS: FlowNode[] = [
  { id: "net", name: "순증", color: "var(--chart-2)" },
  { id: "churn", name: "해지", color: "var(--chart-5)" },
];
/** Channel → outcome flows for the Pathway. */
export const PATHWAY_LINKS: FlowLink[] = CHANNELS.flatMap(({ key }, i) => {
  const joined = Math.round(5200 - 700 * i + noise(400));
  const churned = Math.round(joined * (0.32 + 0.05 * i) + noise(120));
  return [
    { source: key, target: "net", value: joined - churned },
    { source: key, target: "churn", value: churned },
  ];
});

export type StagedNode = FlowNode & {
  value: number;
  /** The node's value split by channel (channel id → amount), for the staged pathway's bands. */
  parts?: Record<string, number>;
};
export type StagedColumn = { id: string; title: string; nodes: StagedNode[] };

const stagedJoin = CHANNELS.map(({ key }, i) => ({
  key,
  joined: Math.round(5200 - 700 * i + noise(400)),
}));
const stagedChurn = stagedJoin.map(({ key, joined }, i) => ({
  key,
  churned: Math.round(joined * (0.3 + 0.04 * i) + noise(100)),
}));
const partsOf = (pick: (i: number) => number) =>
  Object.fromEntries(CHANNELS.map(({ key }, i) => [key, pick(i)]));

/** Channels → 가입 → 순증/해지, each later node split by channel. */
export const STAGED_COLUMNS: StagedColumn[] = [
  {
    id: "channel",
    title: "채널",
    nodes: CHANNELS.map(({ key, name, color }, i) => ({
      id: key,
      name,
      color,
      value: stagedJoin[i].joined,
    })),
  },
  {
    id: "join",
    title: "가입",
    nodes: [
      {
        id: "join",
        name: "가입",
        color: "var(--chart-1)",
        value: stagedJoin.reduce((sum, s) => sum + s.joined, 0),
        parts: partsOf((i) => stagedJoin[i].joined),
      },
    ],
  },
  {
    id: "result",
    title: "결과",
    nodes: [
      {
        id: "net",
        name: "순증",
        color: "var(--chart-2)",
        value: stagedJoin.reduce(
          (sum, s, i) => sum + s.joined - stagedChurn[i].churned,
          0,
        ),
        parts: partsOf((i) => stagedJoin[i].joined - stagedChurn[i].churned),
      },
      {
        id: "churn",
        name: "해지",
        color: "var(--chart-5)",
        value: stagedChurn.reduce((sum, s) => sum + s.churned, 0),
        parts: partsOf((i) => stagedChurn[i].churned),
      },
    ],
  },
];

export type Lane = { id: string; name: string; color: string };
export type LaneItem = {
  id: string;
  lane: string;
  /** "YYYY-MM-DD", within DAYS. */
  date: string;
  /** A range item ends here. */
  endDate?: string;
  title: string;
  summary: string;
  href?: string;
  color: string;
};

/** The marker lanes under a timeline. */
export const LANES: Lane[] = [
  { id: "market", name: "시장", color: "var(--chart-4)" },
  { id: "pivot", name: "변곡점", color: "var(--chart-3)" },
  { id: "campaign", name: "캠페인", color: "var(--chart-1)" },
];

/** Six markers over DAYS: one range (the campaign) and one with a link. */
export const LANE_ITEMS: LaneItem[] = [
  {
    id: "m1",
    lane: "market",
    date: "2026-09-04",
    title: "경쟁사 요금제 개편",
    summary: "5G 중간 요금제 2종 신설",
    color: "var(--chart-4)",
  },
  {
    id: "m2",
    lane: "market",
    date: "2026-10-12",
    title: "단말 출시",
    summary: "플래그십 신제품 사전예약 시작",
    href: "/palette",
    color: "var(--chart-4)",
  },
  {
    id: "p1",
    lane: "pivot",
    date: "2026-09-19",
    title: "가입 급증",
    summary: "7일 이동평균 +12%",
    color: "var(--chart-3)",
  },
  {
    id: "p2",
    lane: "pivot",
    date: "2026-10-21",
    title: "해지 급감",
    summary: "7일 이동평균 -9%",
    color: "var(--chart-3)",
  },
  {
    id: "c1",
    lane: "campaign",
    date: "2026-09-08",
    endDate: "2026-09-21",
    title: "추석 프로모션",
    summary: "APP 가입 시 데이터 쿠폰",
    color: "var(--chart-1)",
  },
  {
    id: "c2",
    lane: "campaign",
    date: "2026-10-26",
    title: "제휴 이벤트",
    summary: "카드 제휴 할인 시작",
    color: "var(--chart-1)",
  },
];

export type BarListItem = { name: string; value: number; note?: string };

/** Adds by channel for the bar list, largest first, with a note each. */
export const BAR_LIST: BarListItem[] = CHANNELS.map(({ name }, i) => ({
  name,
  value: Math.round(5200 - 700 * i + noise(400)),
  note: [
    "전월 대비 상승",
    "신규 캠페인",
    "운영 시간 단축",
    "매장 2곳 추가",
    "제휴사 3곳",
  ][i],
})).sort((a, b) => b.value - a.value);

/** Month-over-month deltas by channel, signed. */
export const DELTAS: { name: string; value: number }[] = CHANNELS.map(
  ({ name }, i) => ({
    name,
    value: Math.round([420, 180, -260, 90, -45][i] + noise(60)),
  }),
);
