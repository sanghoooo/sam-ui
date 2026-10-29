# Tabs

```tsx
import { type TabItem, Tabs } from "@/components/ui/tabs";
```

Pill tabs that switch what one panel shows (client component): the selected tab is a raised white pill with
a hairline ring, the others 70% text, disabled ones light gray. They follow the WAI-ARIA tabs pattern:
left/right arrow keys select the previous/next enabled tab and move focus to it, skipping disabled ones.

| Prop | Meaning |
|---|---|
| `label` | the tablist's accessible name |
| `items` | `readonly { value, label, disabled? }[]` |
| `value` / `onValueChange` | controlled selection |
| `panelId` | id of the panel the tabs control; each tab's id is the panel's id, then `tab` and the tab's value, joined by `-` |
| `className` | on the tablist |

You render the panel yourself, labelled by the selected tab:

```tsx
const METRICS = [
  { label: "방문", value: "visits" },
  { label: "주문", value: "orders" },
  { disabled: true, label: "매출", value: "revenue" },
] as const;
const [metric, setMetric] = useState<(typeof METRICS)[number]["value"]>("visits");

<div className="flex flex-wrap items-center gap-3">
  <span aria-hidden className="text-[12px] font-medium text-muted-foreground">지표</span>
  <Tabs items={METRICS} label="지표" onValueChange={setMetric} panelId="metric-panel" value={metric} />
</div>
<div aria-labelledby={"metric-panel-tab-" + metric} id="metric-panel" role="tabpanel">
  …
</div>
```

- Use Tabs to switch content; use a `SegmentedControl` to set a filter or option that the content follows.
- `panelId` must be unique on the page.
