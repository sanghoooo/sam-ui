# Button

```tsx
import { Button, buttonClass } from "@/components/ui/button";
```

A `<button>` with the kit's variants and sizes. Its `type` defaults to `"button"` (pass `type="submit"`
inside a form), so it never submits a form by accident.

| Prop | Values | Default |
|---|---|---|
| `variant` | `outline`: white, bordered · `primary`: filled with the primary color · `ghost`: no border, gray text; hovered, a white raised pill with a hairline ring, so it stays quiet on gray, white or translucent surfaces · `text`: plain text button, e.g. 초기화 | `outline` |
| `size` | `sm`: 28px, 12px text · `md`: 32px, 13px text · `icon`: 32px square · `icon-sm`: 28px square | `md` |
| `className`, any `<button>` prop | merged with `cn`, so it can override the defaults | |

Icons inside a button get `size-4` on their own. `disabled` fades it to 40% and ignores the pointer.

```tsx
<Button>저장</Button>
<Button variant="primary">등록</Button>
<Button onClick={reset} variant="text">초기화</Button>
<Button aria-label="뒤로" size="icon">
  <ChevronLeft />
</Button>
<Button aria-label="다음 달" className="rounded-full" size="icon-sm">
  <ChevronRight />
</Button>
```

A link that should look like a button keeps its `<a>` and takes `buttonClass`:

```tsx
<Link className={buttonClass({ variant: "outline" })} href="/manual">
  매뉴얼
</Link>
```

- An icon-only button needs an `aria-label`; screen readers have nothing else to read.
- Use `primary` for the one main action of a view, not for every button.
