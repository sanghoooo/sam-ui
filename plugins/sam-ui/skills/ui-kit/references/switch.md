# Switch

```tsx
import { Switch } from "@/components/ui/switch";
```

An on/off switch: a `<button role="switch" aria-checked>` with a sliding thumb. On, the track takes the
primary color.

| Prop | Meaning |
|---|---|
| `checked` | required; the switch is always controlled |
| `onCheckedChange` | `(checked: boolean) => void`, called with the new value |
| `disabled`, `className`, other button props | passed through |

Give it a name. Either put it in a `<label>` with the text, so clicking the text toggles it too:

```tsx
<label className="flex items-center gap-2 text-[13px]">
  <Switch checked={enabled} onCheckedChange={setEnabled} />
  알림 받기
</label>
```

…or pass `aria-label` when there is no visible text.

The sidebar's 다크 모드 row (`components/layout/theme-toggle.tsx`) is the working example.
