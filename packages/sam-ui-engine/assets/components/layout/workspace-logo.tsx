import { type LucideIcon, RadioTower, Store, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The workspaces: short name, full name and brand color (the --brand-* tokens; Tailwind bg-brand-air
 * etc., soft fills at /14).
 */
export const WORKSPACES = [
  { id: "air", name: "air", full: "air", color: "var(--brand-air)" },
  { id: "tds", name: "TDS", full: "T다이렉트샵", color: "var(--brand-tds)" },
  {
    id: "mvno",
    name: "MVNO",
    full: "SKT망 알뜰폰",
    color: "var(--brand-mvno)",
  },
] as const;

export type WorkspaceId = (typeof WORKSPACES)[number]["id"];

// The kit carries no brand logos: each workspace gets a glyph.
const GLYPHS: Record<WorkspaceId, LucideIcon> = {
  air: Wind,
  tds: Store,
  mvno: RadioTower,
};

/**
 * A workspace's mark in a 32px box: an 18px glyph in the text color (air a wind, TDS a store, MVNO a base
 * station). By default it follows the page theme; `theme` pins one variant.
 */
export function WorkspaceLogo({
  id,
  theme,
  className,
}: {
  id: WorkspaceId;
  theme?: "light" | "dark";
  className?: string;
}) {
  const Glyph = GLYPHS[id];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center",
        className,
      )}
    >
      <Glyph
        className={cn(
          "size-4.5",
          // A pinned mark doesn't follow the page theme: light uses the light --foreground value, dark is
          // white.
          theme === "light" && "text-[#191f28]",
          theme === "dark" && "text-white",
          !theme && "text-foreground dark:text-white",
        )}
      />
    </span>
  );
}
