# Card, Toolbar, StatePanel

```tsx
import { Card, StatePanel, Toolbar } from "@/components/ui/card";
```

All three take any `<div>` prop; `className` merges and can override.

## Card

A white surface with a border and `rounded-xl`, and no padding of its own: add `p-5` or what the content
needs.

```tsx
<Card className="p-5">…</Card>
```

## Toolbar

A Card holding one row of filters or options: `flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4`. The row
wraps on narrow screens. Put `Field` + control pairs in it (field-select.md), a `MonthStepper` first, and a
초기화 `Button variant="text"` last. Give the selects `className="min-w-48 flex-1"` on their `Field` and
`className="w-full"` on the `Select`, so they share the space that is left.

```tsx
<Toolbar>
  <MonthStepper max="2026-10" min="2025-01" onValueChange={setMonth} value={month} />
  <Field label="사업">
    <SegmentedControl label="사업" onValueChange={setBusiness} options={BUSINESSES} value={business} />
  </Field>
  <Field className="min-w-48 flex-1" htmlFor="filter-channel" label="채널">
    <Select className="w-full" id="filter-channel" onChange={(e) => setChannel(e.target.value)} value={channel}>
      <option value="">선택 없음</option>
      <option value="APP">APP</option>
    </Select>
  </Field>
  <Button onClick={reset} variant="text">초기화</Button>
</Toolbar>
```

At 1440px a toolbar fits about a month stepper, one segmented control and two selects on one line; more than
that wraps.

## StatePanel

The place-holder for content that is loading, empty or failed: a dashed border, centered 13px gray text. It
is an `aria-live="polite"` region, so screen readers hear when its message changes.

```tsx
<StatePanel>불러오는 중…</StatePanel>
<StatePanel>표시할 데이터가 없습니다.</StatePanel>
```

Swap it for the real content once the data is there; don't put the content inside it.
