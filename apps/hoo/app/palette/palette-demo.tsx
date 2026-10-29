"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useState, useSyncExternalStore } from "react";
import { ManualButton } from "@/components/layout/page-header";
import { WORKSPACES, WorkspaceLogo } from "@/components/layout/workspace-logo";
import { AiInsightTitle, AiSparkle } from "@/components/ui/ai-insight";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Card, StatePanel, Toolbar } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MonthStepper } from "@/components/ui/month-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { subscribeToTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** The color tokens in styles/ui-kit.css. Swatches follow the current theme. */
const COLORS = [
  { token: "background", use: "페이지 배경" },
  { token: "foreground", use: "본문 글자" },
  { token: "card", use: "카드, 헤더" },
  { token: "sidebar", use: "사이드바" },
  { token: "raised", use: "선택한 세그먼트나 탭" },
  { token: "muted", use: "트랙, 호버" },
  { token: "muted-foreground", use: "레이블, 보조 글자" },
  { token: "subtle-foreground", use: "비활성 글자" },
  { token: "border", use: "테두리" },
  { token: "input", use: "입력 테두리" },
  { token: "primary", use: "강조" },
  { token: "primary-foreground", use: "강조 위 글자" },
  { token: "ring", use: "포커스 링" },
];

/** The carriers' sub-brand colors (MVNO host networks), beside the workspaces'. */
const CARRIERS = [
  { token: "brand-skt", use: "SKT · T world" },
  { token: "brand-kt", use: "KT · 요고" },
  { token: "brand-lgu", use: "LG U+ · 너겟" },
];

const TYPE_SAMPLE = "다시 불 붙여 무지개빛의 불 0123";

/** Glyph rows for the font specimen. */
const GLYPHS = [
  "가나다라마바사 아자차카타파하 한글 대시보드",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789 ₩ $ % & @ # · → ▲ ▼",
];

/** The weights the kit's classes use. */
const WEIGHTS = [
  { className: "font-normal", name: "Regular", weight: 400 },
  { className: "font-medium", name: "Medium", weight: 500 },
  { className: "font-semibold", name: "Semibold", weight: 600 },
  { className: "font-bold", name: "Bold", weight: 700 },
  { className: "font-extrabold", name: "Extrabold", weight: 800 },
];
const WEIGHT_RANGE = { max: 920, min: 45 };

const TYPE_SCALE = [
  {
    className: "text-[22px] font-bold tracking-tight",
    use: "페이지 제목 22px",
  },
  { className: "text-[15px] font-bold", use: "섹션 제목 15px" },
  { className: "text-[14px] font-semibold", use: "메뉴 그룹 14px" },
  { className: "text-[14px]", use: "본문 14px" },
  { className: "text-[13px]", use: "컨트롤 13px" },
  {
    className: "text-[12px] font-medium text-muted-foreground",
    use: "레이블 12px",
  },
  { className: "text-[10px] text-muted-foreground", use: "캡션 10px" },
];

const BUTTON_VARIANTS: ButtonVariant[] = [
  "outline",
  "primary",
  "ghost",
  "text",
];

const SECTIONS = [
  { id: "insight", title: "AI Insight" },
  { id: "workspace", title: "워크스페이스 로고 · 색" },
  { id: "colors", title: "색" },
  { id: "font", title: "글꼴" },
  { id: "type", title: "글자 크기" },
  { id: "button", title: "Button" },
  { id: "badge", title: "Badge" },
  { id: "select", title: "Select · Field" },
  { id: "segmented", title: "SegmentedControl" },
  { id: "tabs", title: "Tabs" },
  { id: "month", title: "MonthStepper" },
  { id: "switch", title: "Switch" },
  { id: "card", title: "Card · Toolbar · StatePanel" },
];

const titleOf = (id: string) =>
  SECTIONS.find((section) => section.id === id)?.title ?? id;

/** Every component in components/ui, in each variant and state, for checking both themes. */
export function PaletteDemo() {
  const [business, setBusiness] = useState<"all" | "air" | "tds" | "mvno">(
    "air",
  );
  const [basis, setBasis] = useState<"mom" | "yoy" | "target">("mom");
  const [unit, setUnit] = useState<"person" | "team" | "org">("team");
  const [tab, setTab] = useState<
    "overview" | "revenue" | "cost" | "profit" | "forecast"
  >("overview");
  const [month, setMonth] = useState("2026-10");
  const [toolbarMonth, setToolbarMonth] = useState("2026-10");
  const [channel, setChannel] = useState<"all" | "retail" | "wholesale">(
    "wholesale",
  );
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const [weight, setWeight] = useState(600);
  const fontStack = useCssVar("--font-pretendard");

  return (
    <div className="space-y-4">
      <nav aria-label="팔레트 목차" className="flex flex-wrap gap-1.5">
        {SECTIONS.map((section) => (
          <a
            className="rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            href={`#${section.id}`}
            key={section.id}
          >
            {section.title}
          </a>
        ))}
      </nav>

      <Section
        description="@/components/ui/ai-insight. AI Insight 로고입니다. 1.75초마다 빛이 큰 별을 훑고 작은 별이 반짝인 뒤, 같은 빛이 글자를 지나갑니다. 움직임 줄이기 설정에서는 멈춰 있습니다."
        id="insight"
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <AiInsightTitle as="span" /> 제목
          </span>
          <span className="flex items-center gap-2">
            <AiInsightTitle as="span" still /> 정지 (still)
          </span>
          <span className="flex items-center gap-2">
            <AiInsightTitle as="span" className="text-[17px]" />
            크기 조절 (text-[17px])
          </span>
          <span className="flex items-center gap-2">
            <span className="ai-sparkle-glint inline-flex">
              <AiSparkle className="size-6" />
            </span>
            아이콘 (AiSparkle)
          </span>
        </div>
      </Section>

      <Section
        description="@/components/layout/workspace-logo. 워크스페이스마다의 마크와 브랜드 색입니다. air와 TDS는 테마마다 SVG를 불러오고(basePath 아래에서는 앞에 NEXT_PUBLIC_BASE_PATH를 붙입니다), MVNO는 기지국 아이콘을 그립니다. 색은 bg-brand-air처럼 쓰고, 옅은 채움은 /14로 씁니다."
        id="workspace"
      >
        <ul className="grid gap-3 lg:grid-cols-3">
          {WORKSPACES.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </ul>
        <p className="mt-5 text-[12px] font-medium text-muted-foreground">
          통신사(망 제공사) 색 · TDS는 SKT의 색을 함께 쓰고, 다크 모드에서는
          대비를 위해 밝아집니다
        </p>
        <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {CARRIERS.map(({ token, use }) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </ul>
      </Section>

      <Section
        description="styles/ui-kit.css의 토큰입니다. 오른쪽 위의 다크 모드 스위치를 켜면 다크 값을 볼 수 있습니다."
        id="colors"
      >
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {COLORS.map(({ token, use }) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </ul>
      </Section>

      <Section
        description="styles/ui-kit.css. Pretendard 1.3.9는 굵기 45~920의 가변 글꼴로, SIL Open Font License를 따릅니다. ui-kit.css의 @font-face가 jsDelivr에서 불러오고, 토큰의 --font-sans가 --font-pretendard로 이를 읽습니다."
        id="font"
      >
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="min-w-0">
            <p className="break-keep text-[44px] leading-none font-bold tracking-tight">
              Pretendard 프리텐다드
            </p>
            <ul className="mt-5 space-y-1.5 text-[18px] break-keep [overflow-wrap:anywhere]">
              {GLYPHS.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[11px] break-all text-muted-foreground">
              --font-pretendard: {fontStack || "…"}
            </p>
          </div>
          <div>
            <ul className="space-y-2">
              {WEIGHTS.map(({ className, name, weight: value }) => (
                <li className="flex items-baseline gap-4" key={name}>
                  <span className="w-28 shrink-0 text-[11px] text-muted-foreground">
                    {name} {value}
                    <span className="block font-mono">{className}</span>
                  </span>
                  <span className={cn("text-[20px]", className)}>
                    Aa 가나 123
                  </span>
                </li>
              ))}
            </ul>
            <label className="mt-5 block text-[12px] font-medium text-muted-foreground">
              가변 굵기: <span className="font-mono">{weight}</span>
              <input
                className="mt-2 block w-full accent-primary"
                max={WEIGHT_RANGE.max}
                min={WEIGHT_RANGE.min}
                onChange={(event) => setWeight(Number(event.target.value))}
                type="range"
                value={weight}
              />
            </label>
            <p
              className="mt-2 break-keep text-[28px] leading-tight"
              style={{ fontWeight: weight }}
            >
              대시보드 Dashboard
            </p>
          </div>
        </div>
      </Section>

      <Section
        description="Pretendard. 제목은 잘리지 않고 줄을 바꿉니다."
        id="type"
      >
        <ul className="space-y-2">
          {TYPE_SCALE.map(({ className, use }) => (
            <li className="flex items-baseline gap-4" key={use}>
              <span className="w-32 shrink-0 text-[11px] text-muted-foreground">
                {use}
              </span>
              <span className={className}>{TYPE_SAMPLE}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        description="@/components/ui/button. variant(outline · primary · ghost · text)와 size(sm · md · icon · icon-sm)를 고릅니다. 링크에는 buttonClass()를 씁니다."
        id="button"
      >
        <div className="space-y-3">
          {BUTTON_VARIANTS.map((variant) => (
            <div className="flex flex-wrap items-center gap-2" key={variant}>
              <span className="w-16 font-mono text-[12px] text-muted-foreground">
                {variant}
              </span>
              <Button size="sm" variant={variant}>
                작게
              </Button>
              <Button variant={variant}>기본</Button>
              <Button disabled variant={variant}>
                비활성
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[12px] text-muted-foreground">
              icon
            </span>
            <Button aria-label="뒤로" size="icon">
              <ChevronLeft />
            </Button>
            <Button
              aria-label="이전 달"
              className="rounded-full"
              size="icon-sm"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="다음 달"
              className="rounded-full"
              size="icon-sm"
            >
              <ChevronRight />
            </Button>
            <ManualButton />
          </div>
        </div>
      </Section>

      <Section description="@/components/ui/badge" id="badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>NEW</Badge>
          <Badge>TBD</Badge>
          <Badge>샘플</Badge>
        </div>
      </Section>

      <Section
        description="@/components/ui/select, @/components/ui/field. 빈 선택(없음)은 회색으로 보입니다."
        id="select"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Field htmlFor="palette-select-empty" label="빈 값">
            <Select className="w-40" defaultValue="" id="palette-select-empty">
              <option value="">없음</option>
              <option value="app">APP</option>
            </Select>
          </Field>
          <Field htmlFor="palette-select-value" label="선택됨">
            <Select
              className="w-40"
              defaultValue="app"
              id="palette-select-value"
            >
              <option value="">없음</option>
              <option value="app">APP</option>
            </Select>
          </Field>
          <Field htmlFor="palette-select-disabled" label="비활성">
            <Select
              className="w-40"
              defaultValue=""
              disabled
              id="palette-select-disabled"
            >
              <option value="">없음</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section
        description="@/components/ui/segmented-control. soft는 선택한 항목을 흰 알약으로, solid는 강조 색으로 표시합니다. 화살표 키로 선택을 옮깁니다."
        id="segmented"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Field label="soft">
            <SegmentedControl
              label="사업"
              onValueChange={setBusiness}
              options={[
                { label: "전체", value: "all" },
                { label: "AIR", value: "air" },
                { label: "TDS", value: "tds" },
                { label: "MVNO", value: "mvno" },
              ]}
              value={business}
            />
          </Field>
          <Field label="solid">
            <SegmentedControl
              label="비교 기준"
              onValueChange={setBasis}
              options={[
                { label: "전월", value: "mom" },
                { label: "전년", value: "yoy" },
                { label: "목표", value: "target" },
              ]}
              value={basis}
              variant="solid"
            />
          </Field>
          <Field label="비활성 옵션 포함">
            <SegmentedControl
              label="비교 단위"
              onValueChange={setUnit}
              options={[
                { disabled: true, label: "개인", value: "person" },
                { label: "팀", value: "team" },
                { label: "조직", value: "org" },
              ]}
              value={unit}
              variant="solid"
            />
          </Field>
        </div>
      </Section>

      <Section
        description="@/components/ui/tabs. 왼쪽 · 오른쪽 화살표 키로 탭을 옮기고, 비활성 탭은 건너뜁니다."
        id="tabs"
      >
        <Tabs
          items={[
            { label: "개요", value: "overview" },
            { label: "매출", value: "revenue" },
            { label: "비용", value: "cost" },
            { disabled: true, label: "이익", value: "profit" },
            { disabled: true, label: "전망", value: "forecast" },
          ]}
          label="보기"
          onValueChange={setTab}
          panelId="palette-tab-panel"
          value={tab}
        />
        <div
          aria-labelledby={`palette-tab-panel-tab-${tab}`}
          className="mt-3 text-[13px] text-muted-foreground"
          id="palette-tab-panel"
          role="tabpanel"
        >
          선택한 탭: <span className="font-mono">{tab}</span>
        </div>
      </Section>

      <Section
        description="@/components/ui/month-stepper. 이전 · 다음 버튼은 첫 달과 마지막 달에서 꺼집니다(여기서는 2026-08~2026-10)."
        id="month"
      >
        <MonthStepper
          max="2026-10"
          min="2026-08"
          onValueChange={setMonth}
          value={month}
        />
      </Section>

      <Section description="@/components/ui/switch" id="switch">
        <div className="flex flex-wrap items-center gap-6 text-[13px]">
          <label className="flex items-center gap-2">
            <Switch checked={on} onCheckedChange={setOn} />
            켜짐
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={off} onCheckedChange={setOff} />
            꺼짐
          </label>
          <label className="flex items-center gap-2 text-muted-foreground">
            <Switch checked disabled />
            비활성 (켜짐)
          </label>
          <label className="flex items-center gap-2 text-muted-foreground">
            <Switch checked={false} disabled />
            비활성 (꺼짐)
          </label>
        </div>
      </Section>

      <Section
        description="@/components/ui/card. Toolbar는 필터를 한 줄로 담고, StatePanel은 불러오는 중이거나 비어 있을 때 대신 보입니다."
        id="card"
      >
        <div className="space-y-3">
          <Toolbar>
            <MonthStepper
              max="2026-10"
              min="2025-01"
              onValueChange={setToolbarMonth}
              value={toolbarMonth}
            />
            <Field label="채널">
              <SegmentedControl
                label="채널"
                onValueChange={setChannel}
                options={[
                  { label: "전체", value: "all" },
                  { label: "소매", value: "retail" },
                  { label: "도매", value: "wholesale" },
                ]}
                value={channel}
              />
            </Field>
            <Field
              className="min-w-48 flex-1"
              htmlFor="palette-owner"
              label="담당자"
            >
              <Select className="w-full" defaultValue="" id="palette-owner">
                <option value="">없음</option>
              </Select>
            </Field>
            <Button variant="text">초기화</Button>
          </Toolbar>
          <StatePanel>불러오는 중…</StatePanel>
          <StatePanel>표시할 데이터가 없습니다.</StatePanel>
          <Card className="p-5 text-[13px]">
            Card: 테두리와 둥근 모서리를 가진 기본 면
          </Card>
        </div>
      </Section>
    </div>
  );
}

/** A CSS variable's current value on <html>, updated when the theme switches. */
function useCssVar(name: string) {
  return useSyncExternalStore(
    subscribeToTheme,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => "",
  );
}

/** A color token's swatch, name, use and current value. */
function Swatch({ token, use }: { token: string; use: string }) {
  const value = useCssVar(`--${token}`);
  return (
    <li className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-lg border border-border"
        style={{ background: `var(--${token})` }}
      />
      <span className="min-w-0">
        <span className="block font-mono text-[12px]">{token}</span>
        <span className="block text-[11px] text-muted-foreground">{use}</span>
        <span className="block font-mono text-[10px] text-muted-foreground">
          {value}
        </span>
      </span>
    </li>
  );
}

/** A workspace's mark on light and dark surfaces, and its brand color solid and as a 14% soft fill. */
function WorkspaceCard({
  workspace,
}: {
  workspace: (typeof WORKSPACES)[number];
}) {
  const value = useCssVar(`--brand-${workspace.id}`);
  return (
    <li className="rounded-xl border border-border p-4">
      <p className="break-keep text-[14px] font-semibold">
        {workspace.name}
        {/* air's full name is its short one, so it isn't said twice. */}
        {workspace.full !== workspace.name && (
          <span className="ml-2 text-[12px] font-normal text-muted-foreground">
            {workspace.full}
          </span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-2 rounded-lg border border-[#e3e7ec] bg-white py-1.5 pr-3 pl-1.5">
          <WorkspaceLogo id={workspace.id} theme="light" />
          <span className="text-[11px] text-[#6b7684]">라이트</span>
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-[#252b34] bg-[#12151b] py-1.5 pr-3 pl-1.5">
          <WorkspaceLogo id={workspace.id} theme="dark" />
          <span className="text-[11px] text-[#9aa3af]">다크</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="h-10 w-14 shrink-0 rounded-lg"
          style={{ background: workspace.color }}
          title="단색"
        />
        <span
          className="h-10 w-14 shrink-0 rounded-lg"
          style={{
            background: `color-mix(in oklab, ${workspace.color} 14%, transparent)`,
          }}
          title="옅은 채움 /14"
        />
        <span className="min-w-0 text-[11px] leading-snug">
          <span className="block font-mono">brand-{workspace.id}</span>
          <span className="block font-mono text-muted-foreground">{value}</span>
          <span className="block text-muted-foreground">
            단색 · 옅은 채움 /14
          </span>
        </span>
      </div>
    </li>
  );
}

function Section({
  id,
  description,
  children,
}: {
  id: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    // A linked section stops 8px below the header (its height from site-header.tsx), so nothing above shows.
    <Card
      className="scroll-mt-[calc(var(--header-height,57px)+0.5rem)] p-5"
      id={id}
    >
      <h2 className="break-keep text-[15px] font-bold">{titleOf(id)}</h2>
      {description && (
        <p className="mt-1 break-keep text-[12px] text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
