# Tokens, type, dark mode

All in `styles/ui-kit.css`. Raw values live on `:root` (light) and `.dark`; `@theme inline` maps each to a
Tailwind color, so `bg-card`, `text-muted-foreground`, `border-input` … switch with the theme. The `dark:`
variant matches `.dark` on `<html>`.

## Colors

| Token (Tailwind) | Use | Light | Dark |
|---|---|---|---|
| `background` | page | #f4f6f9 | #0e1116 |
| `foreground` | body text | #191f28 | #e6e9ee |
| `card` | cards, header | #ffffff | #161a21 |
| `sidebar` | sidebar | #ffffff | #12151b |
| `raised` | chosen segment or tab pill | #ffffff | #2a303a |
| `muted` | tracks, hovers, the current menu item | #f0f2f5 | #1e232b |
| `muted-foreground` | labels, secondary text | #6b7684 | #9aa3af |
| `subtle-foreground` | disabled text | #a7afba | #5d6672 |
| `border` | borders (the default border color) | #e3e7ec | #252b34 |
| `input` | select and input borders, the off switch | #d9dee6 | #323945 |
| `primary` | main action, solid segment, on switch | #1f2a44 | #e6e9ee |
| `primary-foreground` | text on primary | #ffffff | #12151b |
| `ring` | focus outline | #4c6ef5 | #7c93ff |

To retheme, change the values; to add a token, add it to `:root` and `.dark` and map it in `@theme inline`
(`--color-name: var(--name);`).

## Workspace brand colors

| Token | For | Light | Dark |
|---|---|---|---|
| `brand-air` | air (its logo's highlight) | #005fff | same |
| `brand-tds` | TDS, which shares SKT T world's indigo | #3617ce | #5456fe |
| `brand-mvno` | MVNO, a deep gray | #4e5968 | #8b95a1 |
| `brand-skt` | SKT, T world (MVNO host network) | #3617ce | #5456fe |
| `brand-kt` | KT, 요고 | #00cbb3 | same |
| `brand-lgu` | LG U+, nerget | #ff2e98 | same |

Dark lifts TDS/SKT and MVNO because their light values sink into the dark cards. Use the brand color for a
workspace's series, swatch or bar, and its 14% tint for a soft fill: `bg-brand-air`, `text-brand-tds`,
`bg-brand-mvno/14`. Inline styles and chart props use the CSS variables (`var(--brand-air)`) or
`WORKSPACES[i].color` (layout.md).

## Type

Pretendard (from jsDelivr, through `ui-kit.css`), 14px body.

| Use | Classes |
|---|---|
| Page title | `text-[22px] font-bold tracking-tight` |
| Section title | `text-[15px] font-bold` |
| Menu group | `text-[14px] font-semibold` |
| Body | `text-[14px]` |
| Controls | `text-[13px]` |
| Labels | `text-[12px] font-medium text-muted-foreground` |
| Captions | `text-[10px]`–`text-[11px] text-muted-foreground` |

## Effects

`ai-sparkle-glint`, `animate-sparkle-sweep|pop|flash` and `animate-title-glint-window|text` drive the AI
Insight logo (ai-insight.md). They animate transform and opacity only and stop under reduced motion.
