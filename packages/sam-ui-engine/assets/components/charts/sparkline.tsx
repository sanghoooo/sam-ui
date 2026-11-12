/*
 * Sparkline: a trend drawn as one small SVG beside a KPI value, without recharts. The svg stretches to whatever box
 * holds it (preserveAspectRatio none), so the host sets the size: "h-8 w-20 shrink-0" beside a value, or an "h-10"
 * full-width box with a caption. No hooks, so a server component may render it.
 */

/**
 * The host box beside a KPI value: top-aligned (`items-start`) next to the figure, so a sparkline never pushes the
 * value below the other cards' values.
 */
export const SPARK_BOX_CLASS = "h-8 w-20 shrink-0";

export function Sparkline({
  values,
  color = "var(--chart-1)",
  className = "size-full",
  label,
}: {
  /** The series, oldest first; nothing renders under two values. */
  values: number[];
  /** The stroke and the fill (at 15%); a token such as var(--brand-air) or var(--chart-4). */
  color?: string;
  /** On the svg; the default fills the host box. */
  className?: string;
  /** Read by screen readers; without it the svg is decoration (aria-hidden). */
  label?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  // x spans 0..100; y spans 2..30 of the 32-high box (2px of headroom for the stroke). `|| 1` keeps a flat series
  // on the baseline (y 30) instead of dividing by zero.
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 28}`,
    )
    .join(" ");
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      viewBox="0 0 100 32"
    >
      {/* The area under the line, closed along the bottom edge. */}
      <polygon fill={color} fillOpacity={0.15} points={`0,32 ${pts} 100,32`} />
      {/* non-scaling-stroke keeps the line 1.6px however the box is stretched. */}
      <polyline
        fill="none"
        points={pts}
        stroke={color}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
