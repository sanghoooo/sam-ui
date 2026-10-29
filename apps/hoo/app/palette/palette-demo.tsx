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
  { token: "background", use: "Page background" },
  { token: "foreground", use: "Body text" },
  { token: "card", use: "Cards, header" },
  { token: "sidebar", use: "Sidebar" },
  { token: "raised", use: "Chosen segment or tab" },
  { token: "muted", use: "Tracks, hovers" },
  { token: "muted-foreground", use: "Labels, secondary text" },
  { token: "subtle-foreground", use: "Disabled text" },
  { token: "border", use: "Borders" },
  { token: "input", use: "Input borders" },
  { token: "primary", use: "Accent" },
  { token: "primary-foreground", use: "Text on accent" },
  { token: "ring", use: "Focus ring" },
];

/** The carriers' sub-brand colors (MVNO host networks), beside the workspaces'. */
const CARRIERS = [
  { token: "brand-skt", use: "SKT · T world" },
  { token: "brand-kt", use: "KT · Yogo" },
  { token: "brand-lgu", use: "LG U+ · nerget" },
];

/** The workspaces' full names, in English. */
const WORKSPACE_NAMES = {
  air: "air · unlocked phones, direct",
  tds: "T Direct Shop",
  mvno: "MVNOs on SKT's network",
} as const;

const TYPE_SAMPLE = "The quick brown fox jumps over the lazy dog 0123";

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
    use: "Page title 22px",
  },
  { className: "text-[15px] font-bold", use: "Section title 15px" },
  { className: "text-[14px] font-semibold", use: "Menu group 14px" },
  { className: "text-[14px]", use: "Body 14px" },
  { className: "text-[13px]", use: "Controls 13px" },
  {
    className: "text-[12px] font-medium text-muted-foreground",
    use: "Labels 12px",
  },
  { className: "text-[10px] text-muted-foreground", use: "Captions 10px" },
];

const BUTTON_VARIANTS: ButtonVariant[] = [
  "outline",
  "primary",
  "ghost",
  "text",
];

const SECTIONS = [
  { id: "insight", title: "AI Insight" },
  { id: "workspace", title: "Workspace logos · colors" },
  { id: "colors", title: "Colors" },
  { id: "font", title: "Font" },
  { id: "type", title: "Type" },
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
      <nav aria-label="Palette contents" className="flex flex-wrap gap-1.5">
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
        description="@/components/ui/ai-insight. The AI Insight logo: every 1.75s a light sweeps the big star, the small star twinkles, then the light crosses the words. It holds still with reduced motion."
        id="insight"
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <AiInsightTitle as="span" /> Title
          </span>
          <span className="flex items-center gap-2">
            <AiInsightTitle as="span" still /> Still (still)
          </span>
          <span className="flex items-center gap-2">
            <span className="ai-sparkle-glint inline-flex">
              <AiSparkle className="size-6" />
            </span>
            Icon (AiSparkle)
          </span>
        </div>
      </Section>

      <Section
        description="@/components/layout/workspace-logo. Each workspace's mark and brand color. air and TDS load an SVG per theme and MVNO draws a base-station icon. Use the colors as bg-brand-air, and soft fills at /14."
        id="workspace"
      >
        <ul className="grid gap-3 lg:grid-cols-3">
          {WORKSPACES.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </ul>
        <p className="mt-5 text-[12px] font-medium text-muted-foreground">
          Carrier (host network) colors · TDS shares SKT&apos;s, and dark mode
          lifts them for contrast
        </p>
        <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {CARRIERS.map(({ token, use }) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </ul>
      </Section>

      <Section
        description="The tokens in styles/ui-kit.css. Turn on the dark mode switch at the top right to see their dark values."
        id="colors"
      >
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {COLORS.map(({ token, use }) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </ul>
      </Section>

      <Section
        description="@/lib/fonts. Pretendard 1.3.9, a variable font with weights 45 to 920 under the SIL Open Font License (lib/fonts/OFL.txt). next/font/local loads it as --font-pretendard, which the tokens' --font-sans reads."
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
              Variable weight: <span className="font-mono">{weight}</span>
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
        description="Pretendard. Titles wrap instead of being cut short."
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
        description="@/components/ui/button. variant (outline · primary · ghost · text) and size (sm · md · icon · icon-sm). Links take buttonClass()."
        id="button"
      >
        <div className="space-y-3">
          {BUTTON_VARIANTS.map((variant) => (
            <div className="flex flex-wrap items-center gap-2" key={variant}>
              <span className="w-16 font-mono text-[12px] text-muted-foreground">
                {variant}
              </span>
              <Button size="sm" variant={variant}>
                Small
              </Button>
              <Button variant={variant}>Default</Button>
              <Button disabled variant={variant}>
                Disabled
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[12px] text-muted-foreground">
              icon
            </span>
            <Button aria-label="Back" size="icon">
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Previous month"
              className="rounded-full"
              size="icon-sm"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Next month"
              className="rounded-full"
              size="icon-sm"
            >
              <ChevronRight />
            </Button>
            <ManualButton label="Manual" />
          </div>
        </div>
      </Section>

      <Section description="@/components/ui/badge" id="badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>NEW</Badge>
          <Badge>TBD</Badge>
          <Badge>Sample</Badge>
        </div>
      </Section>

      <Section
        description="@/components/ui/select, @/components/ui/field. An empty choice (None) shows in gray."
        id="select"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Field htmlFor="palette-select-empty" label="Empty">
            <Select className="w-40" defaultValue="" id="palette-select-empty">
              <option value="">None</option>
              <option value="app">APP</option>
            </Select>
          </Field>
          <Field htmlFor="palette-select-value" label="Chosen">
            <Select
              className="w-40"
              defaultValue="app"
              id="palette-select-value"
            >
              <option value="">None</option>
              <option value="app">APP</option>
            </Select>
          </Field>
          <Field htmlFor="palette-select-disabled" label="Disabled">
            <Select
              className="w-40"
              defaultValue=""
              disabled
              id="palette-select-disabled"
            >
              <option value="">None</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section
        description="@/components/ui/segmented-control. soft marks the choice with a white pill, solid with the accent color. Arrow keys move the choice."
        id="segmented"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Field label="soft">
            <SegmentedControl
              label="Business"
              onValueChange={setBusiness}
              options={[
                { label: "All", value: "all" },
                { label: "AIR", value: "air" },
                { label: "TDS", value: "tds" },
                { label: "MVNO", value: "mvno" },
              ]}
              value={business}
            />
          </Field>
          <Field label="solid">
            <SegmentedControl
              label="Compare with"
              onValueChange={setBasis}
              options={[
                { label: "Last month", value: "mom" },
                { label: "Last year", value: "yoy" },
                { label: "Target", value: "target" },
              ]}
              value={basis}
              variant="solid"
            />
          </Field>
          <Field label="with a disabled option">
            <SegmentedControl
              label="Compare by"
              onValueChange={setUnit}
              options={[
                { disabled: true, label: "Person", value: "person" },
                { label: "Team", value: "team" },
                { label: "Org", value: "org" },
              ]}
              value={unit}
              variant="solid"
            />
          </Field>
        </div>
      </Section>

      <Section
        description="@/components/ui/tabs. The left and right arrow keys move between tabs, skipping disabled ones."
        id="tabs"
      >
        <Tabs
          items={[
            { label: "Overview", value: "overview" },
            { label: "Revenue", value: "revenue" },
            { label: "Cost", value: "cost" },
            { disabled: true, label: "Profit", value: "profit" },
            { disabled: true, label: "Forecast", value: "forecast" },
          ]}
          label="View"
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
          Selected tab: <span className="font-mono">{tab}</span>
        </div>
      </Section>

      <Section
        description="@/components/ui/month-stepper. The previous and next buttons turn off at the first and last month (here 2026-08 to 2026-10)."
        id="month"
      >
        <MonthStepper
          label="Month"
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
            On
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={off} onCheckedChange={setOff} />
            Off
          </label>
          <label className="flex items-center gap-2 text-muted-foreground">
            <Switch checked disabled />
            Disabled (on)
          </label>
          <label className="flex items-center gap-2 text-muted-foreground">
            <Switch checked={false} disabled />
            Disabled (off)
          </label>
        </div>
      </Section>

      <Section
        description="@/components/ui/card. Toolbar holds a row of filters; StatePanel stands in while loading or when empty."
        id="card"
      >
        <div className="space-y-3">
          <Toolbar>
            <MonthStepper
              label="Month"
              max="2026-10"
              min="2025-01"
              onValueChange={setToolbarMonth}
              value={toolbarMonth}
            />
            <Field label="Channel">
              <SegmentedControl
                label="Channel"
                onValueChange={setChannel}
                options={[
                  { label: "All", value: "all" },
                  { label: "Retail", value: "retail" },
                  { label: "Wholesale", value: "wholesale" },
                ]}
                value={channel}
              />
            </Field>
            <Field
              className="min-w-48 flex-1"
              htmlFor="palette-owner"
              label="Owner"
            >
              <Select className="w-full" defaultValue="" id="palette-owner">
                <option value="">None</option>
              </Select>
            </Field>
            <Button variant="text">Reset</Button>
          </Toolbar>
          <StatePanel>Loading…</StatePanel>
          <StatePanel>No data to show.</StatePanel>
          <Card className="p-5 text-[13px]">
            Card: a plain surface with a border and rounded corners
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
        <span className="ml-2 text-[12px] font-normal text-muted-foreground">
          {WORKSPACE_NAMES[workspace.id]}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-2 rounded-lg border border-[#e3e7ec] bg-white py-1.5 pr-3 pl-1.5">
          <WorkspaceLogo id={workspace.id} theme="light" />
          <span className="text-[11px] text-[#6b7684]">Light</span>
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-[#252b34] bg-[#12151b] py-1.5 pr-3 pl-1.5">
          <WorkspaceLogo id={workspace.id} theme="dark" />
          <span className="text-[11px] text-[#9aa3af]">Dark</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="h-10 w-14 shrink-0 rounded-lg"
          style={{ background: workspace.color }}
          title="Solid"
        />
        <span
          className="h-10 w-14 shrink-0 rounded-lg"
          style={{
            background: `color-mix(in oklab, ${workspace.color} 14%, transparent)`,
          }}
          title="Soft fill /14"
        />
        <span className="min-w-0 text-[11px] leading-snug">
          <span className="block font-mono">brand-{workspace.id}</span>
          <span className="block font-mono text-muted-foreground">{value}</span>
          <span className="block text-muted-foreground">
            Solid · soft fill /14
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
    <Card className="scroll-mt-20 p-5" id={id}>
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
