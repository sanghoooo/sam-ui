---
name: sam-ui-kit
description: >-
  Install and use SAM UI, a small React + Tailwind CSS 4 component set for dashboards:
  a white sidebar with collapsible groups, a gray page, white bordered cards, filter toolbars,
  sliding-pill segmented controls, pill tabs, month steppers, switches, light and dark themes, an
  animated AI Insight logo, and charts (trend, column, stacked area, combo, ring, pie, treemap,
  bar list, sparkline, scatter, flow, lanes). It bundles the sources, the tokens CSS, a Next.js app
  shell with a starter menu, the air/TDS/MVNO logos and brand colors, and a script that installs,
  updates and checks the kit in a project. Use it when someone wants this kit or this look in a
  project: setting it up ("SAM UI 킷 설치해줘", "UI 킷 설치해줘"), bringing in a newer kit
  ("SAM UI 킷 업데이트해줘"), or building screens with its components once installed (filters, tabs,
  selects, segmented choices, loading or empty states, dark mode, the sidebar menu, workspace logos
  or colors, charts), even when they don't name a component.
---

# SAM UI

A small kit of React components for dashboard screens: Tailwind CSS 4, `lucide-react` icons, no other UI
library; the charts use recharts. The look is a white sidebar with collapsible groups, a gray page, white bordered cards, a filter
toolbar of segmented choices and selects, and pill tabs. Light is the default theme; dark is an option.

The kit's files live in `${CLAUDE_SKILL_DIR}/assets`, mirroring where they go in a project:
`components/ui/*` (the components), `components/charts/*` (the charts), `components/layout/*` (the
Next.js app shell and the workspace logos), `lib/*` (helpers, the sidebar menu), `styles/ui-kit.css` (the
tokens, workspace brand colors and chart series colors included) and `public/images/*` (the air/TDS logos).

All file work goes through one script, `${CLAUDE_SKILL_DIR}/scripts/kit.mjs` (Node, no dependencies):
`install`, `update` and `check`, each given `<src-root>`, the folder the project's `@/` alias points at
(see `tsconfig.json` `paths`: the project root, or `src/`; in a monorepo, the app's folder such as
`apps/web`, never the workspace root). It records what it installed in `sam-ui.json` at the project root:
the kit version and, per kit file, a hash of the kit version the project's copy is based on, so later
updates can tell files the project left alone from files it changed. A file that needs a decision is named
on the command line, as the script prints it: `--take <path>` puts the kit's version in place, `--keep
<path>` keeps the project's. `lib/nav.ts`, the menu, is a starter: copied once, then the project's own.
Update and check never write it; update says when the kit changed it.

## Is it installed?

Look for `sam-ui.json` at the project root (in a monorepo, in the app's folder). If it is there, skip to
"Building screens" (or "Updating the kit"). If the kit's files are there without it (copied by hand or by
an older kit), run `install`: it adopts the files that match the kit and lists the ones that differ. A
`components/ui` from another kit under the same names (shadcn's, Lumi UI's) is not this kit: don't install
over it unless the user asks.

## Setting it up

Requirements: React 19, Tailwind CSS 4 and an `@/*` path alias. The components work in any React app; the
app shell (`components/layout/*`) needs the Next.js App Router.

1. **Copy the files.** Run `node ${CLAUDE_SKILL_DIR}/scripts/kit.mjs install <src-root>`; the images go to
   the project root's `public/`. An app with a `basePath` also sets `NEXT_PUBLIC_BASE_PATH` to it, or the
   workspace logos miss their images (`${CLAUDE_SKILL_DIR}/references/layout.md`). If any file already
   exists with other content, it writes nothing, lists those as `differs` and exits 1. Decide each with the
   user, then run install again with `--take <path>` (the kit's version replaces the project's) or
   `--keep <path>` (the project's stays, as a local change).
   A differing `lib/utils.ts` that already exports `cn` (shadcn's does) is a `--keep`. Differing components
   mean the project already has a kit with the same file names (shadcn has button, badge, card, select,
   switch, tabs …): stop and ask the user, because the two kits can't share those files. An existing
   `lib/nav.ts` stays (`kept`, as the project's starter) unless named with `--take`; the kit's sidebar
   imports it, so it must export what the kit's version does.
2. **Install the dependencies** with the project's package manager: `lucide-react clsx tailwind-merge
   recharts` (recharts 3.7 or later; the charts use its 3.x APIs).
3. **Import the tokens.** In the global stylesheet, right after `@import "tailwindcss";`, add
   `@import "<relative path>/styles/ui-kit.css";`.
   - Remove create-next-app's boilerplate from that stylesheet: its `--background`/`--foreground`
     variables, the `@media (prefers-color-scheme: dark)` block, the `@theme inline` font mapping and the
     `body` font. Remove the Geist font from the root layout too. Left in, the OS dark setting flips some
     colors while the kit's theme stays light, and Geist replaces Pretendard.
   - If the project has a real design system with the same token names (shadcn's `--background`,
     `--card`, `--sidebar`, `--muted`, `--border`, `--input`, `--primary`, `--ring` …), ask whether to keep
     its values. Keeping them means deleting the overlapping lines from the copied `ui-kit.css`; the
     kit-only tokens (`--raised`, `--subtle-foreground`) and the animations stay.
   - Tailwind finds the kit's classes on its own when the files sit under the project root. In a monorepo,
     or with `source(…)` on the Tailwind import, add `@source` lines for `components/` and `lib/`.
4. **Next.js root layout.** Add the theme script, so a saved dark choice applies before the first paint
   (the font comes with `ui-kit.css`):

   ```tsx
   import { ThemeScript } from "@/components/layout/theme-script";

   <html lang="ko" suppressHydrationWarning>
     <head>
       <ThemeScript />
     </head>
     <body>{children}</body>
   </html>
   ```

   `ThemeScript` puts `THEME_SCRIPT` (`lib/theme.ts`) into the server HTML only. Don't inline it as a plain
   `<script>`: when the root layout mounts again in the browser (a Fast Refresh in dev), React warns
   "Encountered a script tag while rendering React component". Nor through `next/script`
   `beforeInteractive`, which runs an inline script only after the page's JavaScript loads, so a dark
   choice shows light first.

   If the project already uses `next-themes` with `attribute="class"`, keep it and skip `ThemeScript`.
   In `components/layout/theme-toggle.tsx`, read and set the theme through it instead:
   `const { resolvedTheme, setTheme } = useTheme();` then
   `<Switch checked={resolvedTheme === "dark"} onCheckedChange={(on) => setTheme(on ? "dark" : "light")} />`.
5. **App shell (optional).** Wrap the pages in `AppShell` from a route-group layout
   (`app/(main)/layout.tsx`; see `${CLAUDE_SKILL_DIR}/references/layout.md`). Its menu is a starter
   (`lib/nav.ts`: 대시보드 with 현황 › 개요, and only the 다크 모드 switch at the bottom). Ask what the
   project's menu should be and put it in `lib/nav.ts`. A brand (logo, product name) goes in
   `NAV_HOME.label` as a React node, `createElement(Brand)`: it then heads the sidebar and links home.
   A group's `icon` (a lucide icon or a `WorkspaceLogo`) goes before its label the same way
   (`${CLAUDE_SKILL_DIR}/references/layout.md`, Menu).
   - **Home page:** the menu's home is `NAV_HOME.href` (`/overview` in the starter). Make `/` redirect there
     with `app/(main)/page.tsx`
     (`redirect(NAV_HOME.href)`) and remove `app/page.tsx`. Never keep both: they are the same route and the
     build fails. The back button falls back to `/`, so `/` must lead into the shell.
   - **Menu pages:** each menu link needs a page. Build the ones the user asks for; for the rest, copy
     `${CLAUDE_SKILL_DIR}/templates/placeholder-page.tsx` to `app/(main)/[...slug]/page.tsx`. It serves
     every link in `PAGES` with its title and "준비 중인 화면입니다". List the pages that have their own
     folder in `BUILT_PAGES`, so the placeholder skips them. Drop menu entries the project will never have.
6. **Check.** Run the project's lint, type check and build. Open a page in light, then turn on 다크 모드
   in the sidebar footer and look again. With no browser at hand, at least check the built HTML for the
   theme script and the kit's markup. Commit the kit's files together with `sam-ui.json`.

## Updating the kit

A newer kit arrives with the plugin, so update the plugin first, then the project:

1. **The plugin.** The user (or you, if allowed) updates it: in a session `/plugin marketplace update
   sam-plugins`, then `/reload-plugins`; in a terminal `claude plugin marketplace update sam-plugins` and
   `claude plugin update sam-ui@sam-plugins`, then a restart. The paths in this skill still point at the
   version that was loaded, so invoke the skill again after the update. If you don't, kit.mjs refuses to
   run while Claude Code has a newer sam-ui than its own, and prints the newer script's command to run
   instead; decide any `--take`/`--keep` again from that script's output.
2. **The project.** Run `node ${CLAUDE_SKILL_DIR}/scripts/kit.mjs update <src-root>`. Per file it reports:
   - `added` (new in the kit, or a missing kit file put back), `updated` (the project had not changed it),
     `removed` (dropped from the kit, unchanged here);
   - `local` (changed here, the kit's version did not change; left alone);
   - `compare` (a starter the kit changed; the project's is kept), `unused` (a starter the kit dropped,
     such as 0.2.0's `components/layout/brand.tsx`: the kit's files no longer import it; left alone);
   - `kept` (named with `--keep`);
   - `merge` (changed here and in the kit), `differs` (new in the kit, but the project has its own file
     there) and `left` (dropped from the kit but changed here): left alone, exit 1, and listed again by every
     update until decided.

   It refuses (exit 1, nothing changed) when the project's kit is newer than the plugin's: update the
   plugin. Under each `merge`, `differs` and `compare` line, `kit:` gives the kit's version of the file.

   If the report lists `components/charts/*` under `added` (a project that installed 0.6 or earlier),
   install `recharts` (3.7 or later) before the next build: the files are copied whether or not the project
   draws charts, and Next type-checks them.
3. **merge:** compare the project's file with the kit's version (`kit:`), bring the kit's change in
   and show the user, then record it with `update <src-root> --keep <path>`. If the user would rather drop
   the project's change, `--take <path>` takes the kit's version.
4. **differs:** ask the user. Rename the project's file and update again to add the kit's, or use
   `--take <path>` (the kit's replaces it) or `--keep <path>` (it stays, as a local change of the kit's file).
5. **left:** `--keep <path>` keeps it as the project's own file, `--take <path>` deletes it.
6. **compare:** show the user what the kit changed against the kit's version (`kit:`) and bring
   over what they want; the project's own menu stays. A starter is reported only on the update that
   brings the kit's change.
   **unused:** tell the user the kit no longer uses it. Delete it, or keep it if the project's own files
   still import it (a project that keeps its brand in a changed sidebar does).
7. If the root layout inlines `<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />` (kits
   before 0.3.3), replace it with `<ThemeScript />` from `@/components/layout/theme-script` (setup step 4).
8. Lint, type check and build, look at the screens, and commit the kit's files with `sam-ui.json`.

`update --force` takes the kit's version of every kit file the project changed (`merge` and `local`) and
deletes the changed files the kit dropped; it leaves starters and `differs` files alone, and a file named
with `--keep <path>` stays as it is. Use it only when the user wants every local change gone; for one file,
use `--take <path>`.

`node ${CLAUDE_SKILL_DIR}/scripts/kit.mjs check <src-root>` lists kit files that differ from the installed
version (`changed`, `missing`, and `merge`, `left` or `differs` files still waiting for a decision; exit 1
when any do) and says when the plugin carries a newer or an older kit. Kit changes belong in the kit
repository (sam-ui), not in a project's copies: a local change has to be merged by hand on every
update.

## Building screens

Read a component's reference file before you first use it in a task: each gives the import, the props,
an example and the pitfalls.

| Need | Component | Reference |
|---|---|---|
| Buttons, icon buttons, a link styled as a button | `Button`, `buttonClass` (`@/components/ui/button`) | `${CLAUDE_SKILL_DIR}/references/button.md` |
| A small status label | `Badge` (`@/components/ui/badge`) | `${CLAUDE_SKILL_DIR}/references/badge.md` |
| A bordered surface, a filter row, a loading or empty state | `Card`, `Toolbar`, `StatePanel` (`@/components/ui/card`) | `${CLAUDE_SKILL_DIR}/references/card.md` |
| A gray label before a control; native selects | `Field`, `Select` | `${CLAUDE_SKILL_DIR}/references/field-select.md` |
| A one-of-few choice | `SegmentedControl` | `${CLAUDE_SKILL_DIR}/references/segmented-control.md` |
| Switching what one panel shows | `Tabs` | `${CLAUDE_SKILL_DIR}/references/tabs.md` |
| ◀ 기준월 [YYYY-MM] ▶ | `MonthStepper`, `addMonths` | `${CLAUDE_SKILL_DIR}/references/month-stepper.md` |
| An on/off setting | `Switch` | `${CLAUDE_SKILL_DIR}/references/switch.md` |
| The AI Insight sparkle and title | `AiInsightTitle`, `AiSparkle` | `${CLAUDE_SKILL_DIR}/references/ai-insight.md` |
| A daily/monthly trend: areas, lines or bars with forecasts, bands, targets, y markers, 오늘, zoom | `TrendChart` (`@/components/charts/trend-chart`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Column bars: monthly, grouped, signed stacks, hatched forecast, labels, target, outlier zoom | `ColumnChart`, `withSeparators`, `hasOutlier` (`@/components/charts/column-chart`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Stacked areas, also 100% | `StackedArea` (`@/components/charts/stacked-area`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Bars and lines on two axes, a share line in % | `ComboChart` (`@/components/charts/combo-chart`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Shares of a whole: a ring with a figure in the hole, a composition pie, boxes sized by share (a stock-map look) | `ShareChart` with `kind` `ring`, `pie`, `treemap` (`@/components/charts/share-chart`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| A ranked list of label · bar · value | `BarList` (`@/components/charts/bar-list`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| A sparkline beside a KPI | `Sparkline` (`@/components/charts/sparkline`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Points by two values, bubble size for a third | `ScatterPlot` (`@/components/charts/scatter-plot`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Flows between columns (Sankey), two or more stages | `Pathway`, `StagedPathway` (`@/components/charts/pathway`, `staged-pathway`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Annotation lanes under a trend chart | `ChartLanes` (`@/components/charts/chart-lanes`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Chart frame, tooltip, legend, series colors, number/date formats (server-safe), zoom slider or brush, pitfalls | `ChartBox`, `ChartTip`, `ChartLegend`, `formatNumber`, `useChartZoom`, `ChartZoomControl`, `ChartBrush` (`@/components/charts/chart-parts`, `chart-format`, `chart-zoom`, `chart-zoom-control`, `chart-brush`) | `${CLAUDE_SKILL_DIR}/references/charts.md` |
| Page shell, header, menu, theme switch, air/TDS/MVNO logos | `components/layout/*`, `lib/nav.ts` | `${CLAUDE_SKILL_DIR}/references/layout.md` |
| Colors, workspace brand colors, type sizes, dark mode | `styles/ui-kit.css` | `${CLAUDE_SKILL_DIR}/references/tokens.md` |

Join classes with `cn` from `@/lib/utils` (clsx + tailwind-merge), so a caller's `className` overrides a
component's defaults.

A screen with the shell is a `PageHeader` and then `<main className="flex-1 space-y-4 p-4 lg:p-6">`. Give
pages reached from the menu `back={false}`; keep the back button on detail pages opened from another
screen.

A typical controls block (a client component beside a server `page.tsx`): a `Toolbar` with a
`MonthStepper`, `Field` + `SegmentedControl` and `Field` + `Select` pairs and a 초기화
`Button variant="text"` last (it resets the filters, not the tabs); a small label with `Tabs`; a second
`Toolbar` for comparison options; and the `role="tabpanel"` the tabs point at, which holds the content,
or a `StatePanel` inside it while the content loads.

```tsx
<PageHeader back={false} title="현황" />
<main className="flex-1 space-y-4 p-4 lg:p-6">
  <Toolbar>
    <MonthStepper max="2026-10" min="2025-01" onValueChange={setMonth} value={month} />
    <Field label="사업">
      <SegmentedControl label="사업" onValueChange={setBusiness} options={BUSINESSES} value={business} />
    </Field>
    <Field className="min-w-48 flex-1" htmlFor="channel" label="채널">
      <Select className="w-full" id="channel" onChange={(e) => setChannel(e.target.value)} value={channel}>
        <option value="">선택 없음</option>
      </Select>
    </Field>
    <Button onClick={reset} variant="text">초기화</Button>
  </Toolbar>
  <div className="flex flex-wrap items-center gap-3">
    <span aria-hidden className="text-[12px] font-medium text-muted-foreground">지표</span>
    <Tabs items={METRICS} label="지표" onValueChange={setMetric} panelId="metric-panel" value={metric} />
  </div>
  <div aria-labelledby={"metric-panel-tab-" + metric} id="metric-panel" role="tabpanel">
    <StatePanel>불러오는 중…</StatePanel>
  </div>
</main>
```

## Style rules

They keep screens matching the kit's look and readable in both themes.

- **Tokens, not raw colors:** `bg-background` (page), `bg-card` (cards, header), `bg-sidebar`, `bg-muted`
  (tracks, hovers), `text-foreground`, `text-muted-foreground` (labels), `text-subtle-foreground`
  (disabled), `border-border`, `border-input`, `bg-primary`/`text-primary-foreground`, `outline-ring`.
  Each has a dark value, so a screen built from them needs no `dark:` classes.
- **Workspace colors:** `bg-brand-air`, `bg-brand-tds`, `bg-brand-mvno` (carriers: `brand-skt`,
  `brand-kt`, `brand-lgu`); soft fills take `/14`.
- **Type scale:** page title 22px bold, section title 15px bold, menu group 14px semibold, body 14px,
  controls 13px, labels 12px medium `text-muted-foreground`, captions 10–11px.
- **Shapes:** cards `rounded-xl border`; controls `rounded-lg`/`rounded-md`, 28–34px tall; content
  `p-4 lg:p-6` with `space-y-4` between blocks.
- **Titles never truncate:** page and section titles wrap (`break-keep`); only subtitles may `truncate`.
- **Same output on server and browser:** format dates and numbers with plain string math or fixed locale
  options, not locale-dependent defaults, or hydration breaks.
- **Real controls:** `<button type="button">`, the framework's link for navigation, native inputs; an
  icon-only button gets an `aria-label`.

A page that shows every component in each variant and state (a "palette") is the easiest way for a team to
review the kit in both themes; offer to add one when the kit is first installed.
