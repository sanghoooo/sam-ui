# MonthStepper

```tsx
import { addMonths, MonthStepper } from "@/components/ui/month-stepper";
```

◀ 기준월 [YYYY-MM ▾] ▶: a month select between previous/next round buttons (client component). The select
lists every month from `max` back to `min`, newest first; ◀ is disabled at `min` and ▶ at `max`.

| Prop | Meaning |
|---|---|
| `value` / `onValueChange` | the month as `"YYYY-MM"` |
| `min`, `max` | `"YYYY-MM"` bounds |
| `label` | the visible label, a real `<label>` for the select; default `기준월` |
| `className` | on the row |

```tsx
const [month, setMonth] = useState("2026-10");
<MonthStepper max="2026-10" min="2025-01" onValueChange={setMonth} value={month} />
```

`addMonths("2026-10", -1)` returns `"2026-09"`. It is plain arithmetic, with no `Date` or locale, so the
server and the browser always agree. Do month math with it rather than `new Date()`.

Pass `min`/`max` from the data's real range; a fixed default month (not today's date) keeps server and
browser renders identical.
