# SegmentedControl

```tsx
import { type SegmentOption, SegmentedControl } from "@/components/ui/segmented-control";
```

A one-of-few choice shown as a row of segments on a gray track (client component). Each segment is a native
radio, so arrow keys move the choice and forms see a radio group. The chosen segment's pill slides to a new
choice in 0.2s; reduced motion moves it without the slide.

| Prop | Meaning |
|---|---|
| `label` | the group's accessible name (a hidden `<legend>`); match the visible `Field` label |
| `options` | `readonly { value, label, icon?, disabled? }[]`; `icon` (a lucide icon, or a brand mark as an `<svg>`) is drawn at 14px before the label |
| `value` / `onValueChange` | controlled value; always set both |
| `variant` | `soft` (default): the choice is a raised white pill · `solid`: the choice is filled with the primary color |
| `className` | on the track |

Declare options `as const` and type the state from them, so `value` and `onValueChange` share one literal
type:

```tsx
const BUSINESSES = [
  { label: "전체", value: "all" },
  { label: "AIR", value: "air" },
  { label: "TDS", value: "tds" },
  { label: "MVNO", value: "mvno" },
] as const;

const [business, setBusiness] = useState<(typeof BUSINESSES)[number]["value"]>("all");

<Field label="사업">
  <SegmentedControl label="사업" onValueChange={setBusiness} options={BUSINESSES} value={business} />
</Field>
```

- `soft` suits filters (사업, 채널); `solid` suits a mode or basis the screen is computed by (비교 기준).
- A disabled option stays visible in light gray and can't be chosen.
- Icons go on every option or on none; the label stays, as the icon is hidden from screen readers.
- Labels keep the width of their bold form, so choosing one never shifts the others; keep labels short
  (one or two words).
- Two to five options. More, or long labels, belong in a `Select`.
