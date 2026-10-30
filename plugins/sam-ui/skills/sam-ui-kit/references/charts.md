# Charts

```tsx
import { TrendChart } from "@/components/charts/trend-chart";
import { ColumnChart, hasOutlier, OUTLIER_NOTE, withSeparators } from "@/components/charts/column-chart";
import { StackedArea } from "@/components/charts/stacked-area";
import { ComboChart } from "@/components/charts/combo-chart";
import { ShareChart } from "@/components/charts/share-chart";
import { BarList } from "@/components/charts/bar-list";
import { SPARK_BOX_CLASS, Sparkline } from "@/components/charts/sparkline";
import { ScatterPlot } from "@/components/charts/scatter-plot";
import { Pathway } from "@/components/charts/pathway";
import { StagedPathway } from "@/components/charts/staged-pathway";
import { ChartLanes } from "@/components/charts/chart-lanes";
import { ChartBox, ChartLegend, ChartTip } from "@/components/charts/chart-parts";
import { formatCompact, formatNumber, formatSigned, seriesColor } from "@/components/charts/chart-format";
import { useChartZoom } from "@/components/charts/chart-zoom";
import { ChartZoomControl } from "@/components/charts/chart-zoom-control";
import { ChartBrush } from "@/components/charts/chart-brush";
```

The kit's charts are built on recharts 3.x (`recharts` 3.7 or later; setup step 2 installs it). They share
one look: no entry animation, a frosted tooltip pinned to the top of the plot that follows the cursor line in
the primary color, hover dots drawn above the tooltip, y ranges rounded to 1·2·5 steps, Korean date ticks,
dashed or hatched forecasts, and Ctrl + wheel / drag zoom with a slider control. Every chart file except
`chart-format.ts` is a client component. The series colors are the `--chart-1` … `--chart-5` tokens
(`seriesColor(i)`), and the workspace colors (`var(--brand-air)` …) fit the same `color` props.

Every chart takes `label`, the figure's aria-label; inside a `ChartBox` leave it off (the box is the figure).
Every x axis reads dates as the trend charts do: daily rows as "9월 1일" with the year under the first
(`koDayAxis(keys)` in `chart-parts.tsx`), months as "10월". No chart labels the 0 of its value axis: the baseline's grid line marks it (`withoutZero(format)` in
`chart-format.ts` does this for a hand-built y axis).
A `ChartSeries` is `{ key, name, color?, groupKey?, stack?, dashed?, dotted?, line?, forecastKey?,
estimatedKey?, separatorBefore?, endLabel? }` (`chart-format.ts`); each chart reads the parts it supports.

## TrendChart

```tsx
import { TrendChart } from "@/components/charts/trend-chart";
```

A daily or monthly trend: areas by default, lines, or bars (`kind="bar"`), with forecasts, ranges, targets,
reference lines and shaded windows, the 오늘 line, the period-switch flip and annotation lanes underneath.
Rows are in x order and the `xKey` field holds `"YYYY-MM-DD"` (or `"YYYY-MM"` with `monthly`).

| Prop | Meaning |
|---|---|
| `data` | `Record<string, unknown>[]`, rows in x order; the zoom slices them |
| `xKey` | the category field (default `key`); the zoom, the ticks, `today` and the lanes read it |
| `series` | `ChartSeries[]`: areas by default; `line` (no fill), `dashed`, `dotted`, `stack`, `forecastKey` (a dashed continuation), `estimatedKey` (hollow dots / hatched bars / "(추정)"), `groupKey`, `separatorBefore`, `endLabel` (a haloed value at the last row) |
| `kind` | `"area"` (default) or `"bar"`: bars per series, forecasts fainter, estimated ones hatched |
| `curve` | `"monotone"` (default) or `"linear"` |
| `today` | the row key of 오늘: a primary line, rows after it count as the future (전망 badge in the tooltip), today-aware date ticks; monthly charts snap it to its month |
| `todayLabel` | `"text"` (default: a 2px line with bold 오늘 on top) or `"chip"` (a 1.5px line under a primary chip "오늘 MM-DD") |
| `targetKey` / `targetLabel` | the row field of the target (dotted stepAfter line); `targetLabel` names it on the y axis (목표) and draws solid per-level segments |
| `targetSeries` | `ChartSeries[]`, extra long-dashed target lines with a haloed "<name> <value>" at their end |
| `projectionGroups` | `{ key?, name, color?, maxKey, avgKey, minKey, separatorBefore?, endLabel? }[]`: a forecast trio per series (Avg dashed 2px, Max/Min fainter), one tooltip row with a 최소 ~ 최대 sub-line; in bar kind `avgKey` feeds fainter forecast bars |
| `projectionBands` | `{ key, name, color?, dataKey }[]`: `dataKey` holds `[low, high]` per row, drawn as a faint range area named "<name> 예측 범위" |
| `forecastRange` | `false` hides the Max/Min lines, the band and the tooltip range (default `true`) |
| `rangeLabel` | names the shaded range (예측 범위(80%)): a swatch after the legend and the tooltip's "최소 N ~ 최대 M" line |
| `band` | the row field of an uncertainty band drawn as a primary area |
| `guides` | `{ name, color?, valueKey, tip?: (row) => string \| null }[]`: dashed reference lines under the series; `tip` adds rows to the actuals-only tooltip |
| `windows` | `{ from, to, color?, label? }[]`: shaded spans (a one-day window still shows as a 6px band) |
| `markers` | `{ x, color?, label? }[]`: dashed vertical lines |
| `yMarkers` | `{ y, color?, label?, dasharray? }[]`: horizontal lines whose values become y ticks (an index's 100, a baseline) |
| `yDomain` | `[number, number]` (kept while zooming; from 0 rounded up, or from a low end other than 0 in round steps, so lines far above 0 keep their shape) or `"auto"` (the data's min..max with 0 inside, for signed or around-100 series); default 0-based rounding |
| `selectedRange` / `rangeLabels` / `showRangeStartLine` | primary shading over `{ start, end }` with a dashed line at each end in view; `rangeLabels` = `[left of the start line (default 조회 시작), right of it]` |
| `showShading` | `false` drops the area fills, windows, bands (a lines-only look) |
| `highlight` | a series key kept at full strength while every other series dims |
| `height` / `fill` | plot height (default 260) or a CSS length such as `"clamp(400px,46dvh,680px)"`; `fill` grows into a flex column with `height` as the minimum |
| `legend` | a `ChartLegend` band above the plot |
| `showChartKey` / `showChartKeyRow` | the ━ 실적 ┈ Max ╌ Avg ┈ Min ┄ 목표 key row, today-aware date ticks and a tooltip grouped by series; `showChartKeyRow={false}` drops only the row |
| `koDays` | Korean two-row x ticks ("N일" with "M월" under the month turn, every 2nd, 3rd, 5th … day where the plot is too narrow for one a day; "M월 D일" / "YYYY년" over long spans) and a Korean tooltip date |
| `monthly` | `"YYYY-MM"` keys: "N월" ticks, today snapped to its month, linear target lines |
| `dots` | lines with a dot at every point and a gap at a null, no fill (the monthly-line look) |
| `yEndsOnly` | keep ticks and grid lines only at 0 and the top (plus the named target and `yMarkers`) |
| `tightRight` | the plot ends 8px from the right edge instead of 12px (for a ChartBox) |
| `unit` / `format` / `formatY` / `formatX` | tooltip suffix; tooltip values (`formatNumber`), y ticks (`formatCompact`), x ticks when neither `koDays` nor `monthly` (`formatMonthDay`, "yy.mm.dd" across years) |
| `denseTooltip` / `actualsOnlyTooltip` / `tooltipExtra` | the dense tooltip; the simple tooltip (target, "<series> 실적" rows, guide tips); a node under the rows `(row, x) => ReactNode` |
| `zoom` / `zoomSlot` / `zoomResetKey` | zoom on by default; `zoomSlot` renders the control into an element (`null` waits for it); `zoomResetKey` restarts the zoom when it changes |
| `flip` | animate a change of the rows' extent as a zoom (default `true`) |
| `estimateNote` | the footnote while an estimated day is in view: "빈 점은 추정값 - <note>" (bars: 빗금은 추정값) |
| `lanes` | `(ctx) => ReactNode` rendered under the x labels inside the wrapper; `ctx` = `{ data, ticks, xKey, left, right, onMarkerHover }`, meant for `<ChartLanes {...ctx} … />` |
| `className` / `label` | on the outer wrapper; the figure's aria-label |

```tsx
const SERIES = [
  { key: "air", name: "air", color: "var(--brand-air)", estimatedKey: "est" },
  { key: "tds", name: "TDS", color: "var(--brand-tds)", estimatedKey: "est" },
];

<TrendChart
  data={rows}
  koDays
  label="사업별 일간 가입 추이"
  legend
  projectionBands={[{ key: "air", name: "air", dataKey: "airRange" }]}
  projectionGroups={[{ key: "air", name: "air", maxKey: "airMax", avgKey: "airAvg", minKey: "airMin", endLabel: true }]}
  rangeLabel="예측 범위(80%)"
  series={SERIES}
  targetKey="target"
  targetLabel="목표"
  today="2026-10-29"
  unit="회선"
/>
```

- Forecast fields are `null` before `today` and the actuals `null` after it; at `today` both hold the day's
  value so the dashed continuation starts on the line.
- A period switch that keeps the same rows (a filter that drops none) needs `zoomResetKey` to reset the zoom
  and run the flip.

## ColumnChart

```tsx
import { ColumnChart, hasOutlier, OUTLIER_NOTE, withSeparators } from "@/components/charts/column-chart";
```

Columns per row: one series, grouped, or stacked (`stack`; `signed` piles positives up and negatives down
from a zero line). A bar's `forecastKey` adds a hatched remainder bar on top of it (plain and faded, like its actual, on a row in
progress, `fadedKey`); a `line` series is drawn
over the bars and its `forecastKey` is the dashed continuation that carries hollow dots and range bars.

| Prop | Meaning |
|---|---|
| `data` / `xKey` | rows; the category field (default `key`) |
| `series` | `ChartSeries[]`: `stack`, `forecastKey` (hatched remainder), `line` (a line over the bars, 총합) |
| `signed` | signed stacks, ticks spanning the negatives, a zero line |
| `targetKey` | a dotted foreground target line over the bars |
| `rangeKey` | a `[low, high]` offset pair per row, drawn as a range bar on the line series' forecast points |
| `forecastFlagKey` | a row flag: the continuation line gets a hollow dot there |
| `fadedKey` / `sampleKey` | row flags: a month in progress draws fainter; a sample row draws faint with a dashed outline |
| `highlight` / `highlightRow` | a series key, or a row's x value, kept at full opacity while the rest dim |
| `labels` | a value label over every bar |
| `separators` | rows whose x starts with `sep-` are blank slots with a dashed divider; build them with `withSeparators(groups, xKey?)` |
| `maxBarSize` / `barGap` / `barCategoryGap` / `radius` | defaults 24 / recharts' / `"30%"` / 3 (thin grouped bars: `maxBarSize={12} barGap={1}`); stacked bars keep square tops |
| `height` / `className` | default 260; small cards pass 120 |
| `zoom` | wheel and drag zoom with its control (hidden under two rows); default `true` |
| `outlierZoom` | with an outlier among the values (`hasOutlier(values)`) the y range holds the bulk of the bars and a taller bar ends just under the plot top with its rounded
end showing and a break in the axis's top band (two wavy lines running past its sides) for the length left out, and the top
tick reads the tallest value rounded up to the step; the caller offers the 확대/전체 toggle and shows `OUTLIER_NOTE` |
| `format` / `formatY` / `formatX` | tooltip and label values (`formatNumber`, `formatSigned` when `signed`); y ticks (`formatCompact`); x labels |
| `tooltipLabel` / `tooltipExtra` | the tooltip heading `(row) => ReactNode` (default the x value); a node under the rows |
| `label` | the figure's aria-label |

```tsx
<ColumnChart
  data={withSeparators([airRows, tdsRows])}
  format={(v) => formatSigned(v)}
  label="월별 순증"
  separators
  series={[
    { key: "newSub", name: "신규", stack: true },
    { key: "churn", name: "해지", stack: true },
    { key: "net", name: "순증", line: true, forecastKey: "netForecast" },
  ]}
  signed
/>
```

## StackedArea

```tsx
import { StackedArea } from "@/components/charts/stacked-area";
```

Stacked areas, counts or shares (`percent` stacks every row to 100%).

| Prop | Meaning |
|---|---|
| `data` / `xKey` / `series` | rows with one numeric field per series; the x field (default `key`); `ChartSeries[]` (color defaults to `seriesColor(i)`) |
| `percent` | 100% stacking: y ticks and tooltip shares in percent |
| `fillOpacity` | default 0.55; 0.25 for the lighter card look |
| `hideYAxis` | the compact card variant: no y axis, 9px x ticks |
| `legend` | a legend row above the plot |
| `zoom` | default `true` |
| `height` / `className` | default 260 |
| `format` / `formatY` / `formatX` | tooltip values; y ticks; x labels (`"YYYY-MM-DD"` shortens to `"MM-DD"`) |
| `tooltipExtra` / `label` | a node under the rows; the figure's aria-label |

```tsx
<StackedArea data={rows} label="채널별 가입 비중" legend percent series={CHANNELS} />
```

## ComboChart

```tsx
import { ComboChart } from "@/components/charts/combo-chart";
```

Bars and lines on one plot, with an optional right axis (a share line in %) or one shared scale.

| Prop | Meaning |
|---|---|
| `data` / `xKey` | rows; the x field |
| `bars` | `(ChartSeries & { axis?: "left" \| "right" })[]`; `stack` stacks them |
| `lines` | `(ChartSeries & { axis?, dots? })[]`; `dashed` for a dashed line, `dots` for a small dot at every point |
| `rightAxis` | `{ format?, domain?, ticks?, percent?, width? }`; `percent` is a fixed 0–100 axis with "25%" ticks |
| `sharedScale` | both axes on one nice scale with headroom, so a bar and a line of the same size meet |
| `zeroLine` | a line at y = 0 on the bars' axis; on by default when any value is negative |
| `targetKey` / `fadedKey` | a dotted target line; rows in progress draw fainter |
| `legend` | squares for bars, lines for lines |
| `height` / `className` / `zoom` | default 260; zoom on by default |
| `format` / `formatY` / `formatX` | tooltip values; left ticks; x labels |
| `tooltipLabel` / `tooltipExtra` / `label` | heading; a node under the rows; the figure's aria-label |

```tsx
<ComboChart
  bars={[{ key: "inflow", name: "유입" }, { key: "outflow", name: "유출", color: "var(--chart-5)" }]}
  data={rows}
  label="유입 · 유출과 순증 비중"
  legend
  lines={[{ key: "share", name: "순증 비중", axis: "right", color: "var(--chart-3)" }]}
  rightAxis={{ percent: true }}
/>
```

## ShareChart

```tsx
import { ShareChart } from "@/components/charts/share-chart";
```

Shares of a whole under one name, its kinds picked by `kind`: `"ring"`, a ring with a figure in the hole (a KPI
share); `"pie"`, a full pie of a composition, with an optional side list; `"treemap"`, boxes sized by share and
labelled with their names and shares where they fit (a stock-map look), for more parts than a pie can hold. Every
kind's tooltip gives a part's value and share.

| Prop | Meaning |
|---|---|
| `kind` | `"ring"`, `"pie"` or `"treemap"` |
| `data` | `{ name, value, color? }[]`; the rest part of a share ring is `{ name: "나머지", value: Math.max(0, total - part), color: "var(--muted)" }`, a treemap's `{ name: "기타", value, color: "var(--muted-foreground)" }` |
| `center` / `sub` | ring: the big figure in the hole; a small muted caption under it |
| `size` | ring, pie: width = height in px (default 148) |
| `legend` | ring, pie: a side list of color dots, names and shares; it goes under the shape when the box is too narrow for both |
| `height` | treemap: px (default 240); the width fills the parent |
| `color` | treemap: the boxes' hue (default `var(--chart-1)`); a part's `color` overrides it |
| `format` / `label` | the tooltip's value; the figure's aria-label |

- **ring, pie:** the parts take seriesColor(index) unless they carry a `color`. The ring's parts are 2° apart with no
  edge, the pie's 1.5° apart with card-colored gaps. When every value is 0 the ring is muted with "-" in the hole.
- **treemap:** the boxes are laid out largest first, tinted in one hue with the larger ones darker, 2px apart; a hover
  darkens a box. A box too small for its name shows the share only, a sliver nothing. Parts of 0 or less are left
  out; when nothing is left the box is muted with "-" in it.

```tsx
<ShareChart center="62.5%" data={[{ name: "온라인", value: 625 }, { name: "나머지", value: 375, color: "var(--muted)" }]} kind="ring" label="온라인 비중" sub="온라인 비중" />
<ShareChart data={CHANNEL_DATA} kind="pie" label="채널별 가입 구성" legend size={260} />
<ShareChart data={PLAN_DATA} height={160} kind="treemap" label="요금제별 회선 비중" />
```

## BarList

```tsx
import { BarList } from "@/components/charts/bar-list";
```

A ranked list of label · bar · value rows (no recharts; renders on the server too). The rows share one grid, so
the values right-align in one column and every bar ends at the same x, whatever the values' widths.

| Prop | Meaning |
|---|---|
| `items` | `{ label: ReactNode, value, color?, tag?: ReactNode, note?: ReactNode }[]`; the bar is primary by default, `tag` (a badge) sits right of the label, `note` after the value |
| `format` | default `formatNumber`; `formatSigned` for deltas |
| `labelWidth` | the label column's cap (default `"7.5rem"`) |
| `label` | aria-label on the `<ul>` |

```tsx
<BarList format={(v) => formatSigned(v)} items={DELTAS} label="채널별 순증 변화" />
```

## Sparkline

```tsx
import { SPARK_BOX_CLASS, Sparkline } from "@/components/charts/sparkline";
```

A plain SVG line with a 15% fill beside a KPI; nothing renders under two values. Put it in a sized box:
`SPARK_BOX_CLASS` is `h-8 w-20 shrink-0`.

| Prop | Meaning |
|---|---|
| `values` | `number[]`, oldest first |
| `color` | stroke and fill (default `var(--chart-1)`) |
| `className` | on the svg (default `size-full`) |
| `label` | aria-label; without it the svg is decoration (`aria-hidden`) |

```tsx
<div className={SPARK_BOX_CLASS}><Sparkline color="var(--brand-air)" values={last30} /></div>
```

## ScatterPlot

```tsx
import { ScatterPlot } from "@/components/charts/scatter-plot";
```

Points by two values, one color per group, a third value as the dot's area.

| Prop | Meaning |
|---|---|
| `points` | `{ x, y, name, group, color?, size?, detail? }[]`; groups keep first-seen order, color from the group's first point |
| `xLabel` / `yLabel` | the x axis label and the tooltip's row names (required) |
| `faintGroups` | groups drawn at 35% (a market or reference group) |
| `yCategories` | row labels for a categorical y: each point's `y` is its index |
| `sizeRange` | the ZAxis range (default `[30, 140]`) |
| `height` / `className` | default 260 |
| `format` / `formatX` / `formatY` | tooltip y; x ticks; y ticks |
| `detailLabel` / `label` | the `detail` row's name (default 조건); the figure's aria-label |

```tsx
<ScatterPlot faintGroups={["시장"]} label="요금제별 순증" points={POINTS} xLabel="월 요금" yLabel="순증" />
```

## Pathway, StagedPathway

```tsx
import { Pathway, type PathwayLink, type PathwayNode } from "@/components/charts/pathway";
import { StagedPathway } from "@/components/charts/staged-pathway";
```

Flows between columns (a Sankey): `Pathway` has two columns, `StagedPathway` two or more. Hovering, focusing
or tapping a node highlights its paths. `label` is required on both because the node labels are buttons.
`staged-pathway.tsx` exports its own `PathwayNode`/`PathwayLink`, with `color` required; import the types
from the file you draw with.

| Prop | Meaning |
|---|---|
| `sources` / `targets` (Pathway) | `PathwayNode[]`: `{ id, label, color?, detail?: ReactNode, tintLabel?, traceLabel? }`; color defaults to `seriesColor(index)` |
| `columns` (StagedPathway) | `PathwayNode[][]`, stages left to right (at least two); middle and last columns honor `tintLabel`, last-column nodes may give `traceLabel(origin)` |
| `links` | `{ source, target, value, color?, parts? }[]`; a link goes to the next column, `value <= 0` is dropped, color defaults to the source's; `parts` splits a later flow by first-column node so hovering one traces its share |
| `height` | default 220 (`Pathway`: `max(200, rows * 34)`; `StagedPathway`: `max(200, rows * 20 + 100)`) |
| `sourceLabelWidth` / `targetLabelWidth` (Pathway) | caps 220 / 128 |
| `onActiveChange` (Pathway) | `(id) => void`, a source id when its path is active |
| `label` | the figure's aria-label (required) |

```tsx
<Pathway label="채널별 순증 · 해지" links={LINKS} sources={CHANNELS} targets={OUTCOMES} />
<StagedPathway columns={[CHANNELS, JOINS, OUTCOMES]} height={240} label="채널 → 가입 → 결과" links={STAGED_LINKS} />
```

## ChartLanes

```tsx
import { type ChartLane, ChartLanes, type ChartMarker } from "@/components/charts/chart-lanes";
```

Annotation lanes under a `TrendChart`: a marker per dated item, a band for a range, and a list that opens on
hover or focus while the chart draws that date's line. Render it through the chart's `lanes` function so it
follows the zoom and fades with the period flip.

| Prop | Meaning |
|---|---|
| `lanes` | `{ id, label, color? }[]`, lane order and labels |
| `items` | `ChartMarker[]`: `{ id, lane, date, endDate?, title, badge?, summary?, details?, color, outline?, href?, icon? }` |
| `data` / `xKey` / `ticks` / `left` / `right` / `onMarkerHover` | from the chart's `lanes` context: spread `ctx` |
| `onActiveItems` | `(items, open) => void`, the open list's items; feed the ranges back into the chart's `windows` |
| `linkLabel` | the item link's text (default 상세보기 →) |

```tsx
const [windows, setWindows] = useState<TrendWindow[]>([]);

<TrendChart
  data={rows}
  koDays
  lanes={(ctx) => (
    <ChartLanes
      {...ctx}
      items={MARKERS}
      lanes={LANES}
      onActiveItems={(items, open) =>
        setWindows(open ? items.filter((i) => i.endDate).map((i) => ({ from: i.date, to: i.endDate as string, color: i.color, label: i.title })) : [])
      }
    />
  )}
  series={SERIES}
  today={today}
  windows={windows}
/>
```

## Common parts

```tsx
import { ChartBox, ChartLegend, ChartTip, useDotLayer, useMounted } from "@/components/charts/chart-parts";
import { formatCompact, formatDateKo, formatNumber, formatSigned, seriesColor } from "@/components/charts/chart-format";
import { useChartZoom, useZoomFlip } from "@/components/charts/chart-zoom";
import { ChartZoomControl } from "@/components/charts/chart-zoom-control";
import { ChartBrush } from "@/components/charts/chart-brush";
```

`chart-format.ts` has no React or recharts in it, so a server component can format with it: `formatNumber(v,
decimals?)` (ko-KR grouping, fixed decimals), `formatSigned` (a leading +), `formatCompact` (1.5만, 1.2억),
`parseCompact`, `formatDateKo` ("2026년 10월 1일"), `formatMonthDay` ("10.01"), `roundTicks(max)`,
`stepTicks(lo, hi, keep?)` (1·2·5 steps spanning signed values), `formatPeriodTick` ("2026-10" → "10월",
"2026-10-01" → "10월 1일", the default x format), `withoutZero(format)` (a y tick formatter
that leaves 0 blank), `seriesColor(i)` and the `ChartSeries` type.
`chart-parts.tsx` re-exports it for client code.

| Part | Props |
|---|---|
| `ChartTip` | `label` (bold heading), `rows: { color?, name, value, dashed?, dotted?, square?, separatorBefore? }[]`, `dense?`, `extra?` (under the rows): the frosted tooltip surface, for a custom recharts `content` |
| `ChartLegend` | `items: { name, color, kind?: "line" \| "dashed" \| "dotted" \| "square" \| "hatched" \| "range" }[]` (line by default), `className?` |
| `ChartBox` | `legend?`, `control?` (a node at the right of the legend row), `notes?: string[]`, `height` (required), `children` (one recharts chart), `className?`, `label?`: the card frame for a chart built from recharts primitives |
| `useChartZoom(rows, key, minimum?, left?, right?, resetKey?)` | returns `{ ref, interactionStyle, data, rows, zoomed, start, end, length, minimum, setRange, reset }`; bind `ref` to the plot's host and spread `interactionStyle` |
| `ChartZoomControl` | `{ zoom, compact?, raised?, inline?, className? }`: the 확대 slider and 초기화 button; hidden under two rows |
| `ChartBrush` | `{ zoom, rows, xKey?, valueKey, color?, label? }`: a strip over the whole range bound to the same zoom, an alternative to the slider |
| `useZoomFlip(host, overlay, source, visible, key, options?)` | animates a change of the rows' extent as a zoom (the kit charts call it for you) |
| `useMounted()` / `ChartPlaceholder` | render a same-height placeholder until mounted so a small chart never jumps |
| `useDotLayer()` | `{ layer, overDot(style) }`: the overlay the hover dots are portaled into, above the tooltip |

| Token | Use | Light | Dark |
|---|---|---|---|
| `--chart-1` | first series, default of `Sparkline`/`ChartBrush` | `#3b82f6` | `#60a5fa` |
| `--chart-2` | second series | `#10b981` | `#34d399` |
| `--chart-3` | third series | `#f59e0b` | `#fbbf24` |
| `--chart-4` | fourth series | `#8b5cf6` | `#a78bfa` |
| `--chart-5` | fifth series | `#f43f5e` | `#fb7185` |

```tsx
<ChartBox height={220} label="월별 가입" legend={[{ kind: "square", color: "var(--chart-1)", name: "가입" }]} notes={["10월은 진행 중"]}>
  <BarChart data={rows}>…</BarChart>
</ChartBox>
```

## Pitfalls

- Every chart file but `chart-format.ts` is a client component: render one from a client file, or wrap it.
  Function props (`format`, `tooltipExtra`) can't cross from a server component.
- recharts needs a sized box: give `height` (a number, or a CSS length such as `"clamp(400px,46dvh,680px)"`),
  or `fill` on a `TrendChart` inside a flex column. The charts pass `initialDimension` 1×1 and the small ones
  render a same-height placeholder until mounted, so nothing jumps.
- Hydration: compute `today`, keys and values outside render, never `Date.now()` in it; the formats are ko-KR
  with fixed decimals, so the server and the browser print the same text.
- Keys must sort in time order (`"YYYY-MM-DD"`, `"YYYY-MM"`): the zoom, `today` and the flip compare them as
  strings.
- The frame around a chart must not have `backdrop-filter`, or the frosted tooltip loses its blur.
- Inside a `ChartBox` give the chart no `label`: the box is the one figure.
- The lanes go through `TrendChart`'s `lanes` render function, not beside the chart, so they follow the zoom
  and fade with the period flip.
- A `ChartBrush` and a `ChartZoomControl` bound to the same `useChartZoom` stay in step; use one or the other
  per chart.
- Nothing needs a server: the charts work in a static export.

## Updating

The charts are kit files, so `kit.mjs update` brings new versions. A project that installed 0.6 or earlier
sees `components/charts/*` under `added`: install `recharts` (3.7 or later) before the next build, since Next
type-checks the copied files whether or not a screen draws a chart yet. A design system that keeps its own
tokens must add `--chart-1` … `--chart-5` (and the `--color-chart-N` mappings in `@theme inline`).
