import { RadioTower } from "lucide-react";
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

// Each mark gets its own box so the set reads as one weight: the dense tower and the solid T mark
// (official T BI) take less room, and the wider air wordmark keeps 24px.
const MARK_SIZES: Record<WorkspaceId, string> = {
  air: "size-6",
  mvno: "size-4.5",
  tds: "size-4.25",
};

// The images live in public/, so an app under a basePath must prefix them: <img> doesn't get the basePath
// the way next/link does. Such an app sets NEXT_PUBLIC_BASE_PATH to its basePath.
const IMAGES = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/workspaces`;

/**
 * A workspace's mark in a 32px box: air and TDS load a brand asset per theme
 * (/images/workspaces/{id}-{light,dark}.svg), MVNO draws a base-station glyph instead of a logo. By
 * default CSS follows the page theme; `theme` pins one variant.
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
  const size = MARK_SIZES[id];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center",
        className,
      )}
    >
      {id === "mvno" ? (
        <RadioTower
          className={cn(
            size,
            theme === "light" && "text-[#191f28]",
            theme === "dark" && "text-white",
            !theme && "text-foreground dark:text-white",
          )}
        />
      ) : theme ? (
        <img
          alt=""
          className={cn(size, "object-contain")}
          height={32}
          src={`${IMAGES}/${id}-${theme}.svg`}
          width={32}
        />
      ) : (
        <>
          {/* CSS picks the theme's asset, so it is right before hydration. */}
          <img
            alt=""
            className={cn(size, "object-contain dark:hidden")}
            height={32}
            src={`${IMAGES}/${id}-light.svg`}
            width={32}
          />
          <img
            alt=""
            className={cn(size, "hidden object-contain dark:block")}
            height={32}
            src={`${IMAGES}/${id}-dark.svg`}
            width={32}
          />
        </>
      )}
    </span>
  );
}
