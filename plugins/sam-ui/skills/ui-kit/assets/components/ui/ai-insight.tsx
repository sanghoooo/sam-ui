// The AI Insight logo: the sparkle and the title. Their light runs on the animate-sparkle-* and
// animate-title-glint-* utilities defined beside the color tokens.

import { cn } from "@/lib/utils";

/** Four-point stars with straight edges and pointed tips, filled: the big one, and the small one at the top right. */
const SPARKLE_STAR = "M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z";
const SPARKLE_SMALL =
  "M20 1L20.7 3.3L23 4L20.7 4.7L20 7L19.3 4.7L17 4L19.3 3.3Z";

/**
 * AI Insight's icon: every 1.75s a band of light, slanted like the italic title, sweeps left to right across
 * the big star, and the small star at the top right twinkles as the band reaches it, just before the same
 * light crosses the words. Both stars rest at 50%. Every moving part is an HTML layer animated by transform
 * or opacity only, so it keeps its pace while the page is busy. Reduced motion shows the resting stars.
 * `still` drops the light and shows the stars at full strength. Alone, it needs an `ai-sparkle-glint`
 * holder for its light.
 */
export function AiSparkle({
  className,
  still = false,
}: {
  className?: string;
  still?: boolean;
}) {
  return (
    <span aria-hidden className={cn("relative inline-block", className)}>
      <svg
        aria-hidden
        className={cn("absolute inset-0 size-full", !still && "opacity-50")}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d={SPARKLE_STAR} />
      </svg>
      {/* The sweep: a band three times the icon's size slides left to right, clipped to the big star's
          outline (SPARKLE_STAR's points as percentages of the 24-unit box). 104deg leans it 14° like the
          synthesized italic. */}
      {!still && (
        <span className="absolute inset-0 [clip-path:polygon(50%_8.333%,58.333%_41.667%,91.667%_50%,58.333%_58.333%,50%_91.667%,41.667%_58.333%,8.333%_50%,41.667%_41.667%)] motion-reduce:hidden">
          <span className="absolute -inset-full animate-sparkle-sweep bg-[linear-gradient(104deg,transparent_43.5%,var(--ai-glint)_49%,var(--ai-glint)_51%,transparent_56.5%)]" />
        </span>
      )}
      {/* The small star's box (x 17–23, y 1–7 of 24): a resting copy at 50% and a lit copy that fades in
          while the pair pops. */}
      <span
        className={cn(
          "absolute top-[4.167%] left-[70.833%] size-1/4",
          !still && "animate-sparkle-pop",
        )}
      >
        <svg
          aria-hidden
          className={cn("absolute inset-0 size-full", !still && "opacity-50")}
          fill="currentColor"
          viewBox="17 1 6 6"
        >
          <path d={SPARKLE_SMALL} />
        </svg>
        {!still && (
          <span className="absolute inset-0 animate-sparkle-flash">
            <svg
              aria-hidden
              className="size-full fill-[var(--ai-glint)]"
              viewBox="17 1 6 6"
            >
              <path d={SPARKLE_SMALL} />
            </svg>
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * The AI Insight title: the sparkle and the words, in bold italic, as one unit 1px apart. The words rest at
 * 50% like the stars, and right after the small star lights, a band of light crosses them: a window over the
 * words slides right while the lit copy inside it slides back by the same distance, so the words hold still
 * and only the band moves. Other words (`text`) glint alike; `as="span"` sets them as a status, not a
 * heading. The stars take the words' color: the text color around the title, or the primary color with
 * `still`, which drops the light and shows both at full strength.
 */
export function AiInsightTitle({
  className,
  text = "AI Insight",
  as: Tag = "h2",
  still = false,
}: {
  className?: string;
  text?: string;
  as?: "h2" | "span";
  still?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "ai-sparkle-glint inline-flex items-center gap-px text-[13px] font-bold italic",
        still && "text-primary",
        className,
      )}
    >
      <AiSparkle className="size-[17px] shrink-0" still={still} />
      <span className="relative inline-block">
        <span className={cn("whitespace-nowrap", !still && "opacity-50")}>
          {text}
        </span>
        {!still && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-3/5 animate-title-glint-window overflow-hidden [mask-image:linear-gradient(104deg,transparent_10%,#000_45%,#000_55%,transparent_90%)] motion-reduce:hidden"
          >
            <span className="absolute top-0 left-0 animate-title-glint-text whitespace-nowrap text-[var(--ai-glint)]">
              {text}
            </span>
          </span>
        )}
      </span>
    </Tag>
  );
}
