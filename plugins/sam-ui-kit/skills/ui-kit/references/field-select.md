# Field and Select

```tsx
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
```

## Field

A 12px gray label in front of a control, in one row.

| Prop | Meaning |
|---|---|
| `label` | the visible text |
| `htmlFor` | the id of the input or select it names. With it the label is a real `<label>`, so clicking it focuses the control and screen readers read it |
| `className` | sizing of the pair, e.g. `min-w-48 flex-1` in a toolbar |
| `children` | the control |

Without `htmlFor` the label is visual only (`aria-hidden`). That is right for a `SegmentedControl` or `Tabs`,
which carry their own accessible name through their `label` prop; give that prop the same text.

```tsx
<Field label="사업">
  <SegmentedControl label="사업" … />
</Field>
<Field htmlFor="compare-scope" label="비교 범위">
  <Select className="w-36" id="compare-scope" …>…</Select>
</Field>
```

## Select

A native `<select>` with the field look: 34px tall, 13px text, a chevron, `rounded-lg` with the input border.
Native, so it has the platform's keyboard support and its own dark dropdown in dark mode.

- `className` goes to the wrapper and sets the width: `w-full` (in a flex field), `w-36`, `w-28` …
- Every other prop (`id`, `value`, `onChange`, `disabled`, `defaultValue`) goes to the `<select>`.
- An option with `value=""` shows its text in gray, so use it for "no filter":
  `<option value="">선택 없음</option>`.

```tsx
<Select className="w-full" id="filter-plan" onChange={(e) => setPlan(e.target.value)} value={plan}>
  <option value="">선택 없음</option>
  {PLANS.map((p) => (
    <option key={p} value={p}>{p}</option>
  ))}
</Select>
```

Prefer a `SegmentedControl` when there are two to five short choices that should all stay visible.
