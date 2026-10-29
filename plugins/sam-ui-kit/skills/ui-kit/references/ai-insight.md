# AI Insight logo

```tsx
import { AiInsightTitle, AiSparkle } from "@/components/ui/ai-insight";
```

The AI Insight mark: a four-point sparkle and the words in bold italic. Every 1.75s a slanted
band of light sweeps the big star, the small star twinkles, and the same light crosses the words. The
keyframes are in `styles/ui-kit.css` (`animate-sparkle-*`, `animate-title-glint-*`).

## AiInsightTitle

| Prop | Meaning | Default |
|---|---|---|
| `text` | the words | `AI Insight` |
| `as` | `h2` for a section heading, `span` for inline use | `h2` |
| `still` | no light; the stars and words show in the primary color at full strength | `false` |
| `className` | on the wrapper; text size comes from here (13px by default) | |

```tsx
<AiInsightTitle />                     {/* a panel heading */}
<AiInsightTitle as="span" still />     {/* a static mark, e.g. in a list */}
```

The stars take the words' color: the text color around the title (set `text-*` on it or its parent), or
the primary color with `still`. At rest the animated title shows its stars and words at 50%, so the light
reads against them; `still` is for places where motion would distract.

## AiSparkle

The star alone. Its light needs an `ai-sparkle-glint` holder, and like the title it takes the text color
around it:

```tsx
<span className="ai-sparkle-glint inline-flex">
  <AiSparkle className="size-6" />
</span>
```

Reduced motion shows the resting stars.
