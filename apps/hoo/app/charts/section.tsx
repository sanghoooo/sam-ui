import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** What a section file exports beside its component: the jump-pill text and the heading. */
export type SectionMeta = { id: string; short: string; title: string };

/**
 * A section description that starts with import paths ("@/components/ui/tabs. 왼쪽 …"), split into the paths and the
 * text after them, so the paths sit on a line of their own without the period. Descriptions that don't start with a
 * path stay whole.
 */
export function splitDescription(description: string) {
  if (!/^(@\/|[\w-]+\/)/.test(description)) return { text: description };
  const end = description.indexOf(". ");
  if (end < 0)
    return /\s/.test(description.replaceAll(", ", ","))
      ? { text: description }
      : { path: description };
  const path = description.slice(0, end);
  // A path list is paths joined by ", "; anything else with a space is a sentence that only begins with a path.
  if (/\s/.test(path.replaceAll(", ", ","))) return { text: description };
  return { path, text: description.slice(end + 2) };
}

/** The import paths on one line, then the description under it. */
export function SectionDescription({ description }: { description: string }) {
  const { path, text } = splitDescription(description);
  return (
    <div className="mt-1 space-y-0.5 break-keep">
      {path && (
        <p className="font-mono text-[11px] text-muted-foreground">{path}</p>
      )}
      {text && <p className="text-[12px] text-muted-foreground">{text}</p>}
    </div>
  );
}

/** One chart kind's section, in the palette's look; `description` starts with the import path. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    // A linked section stops 8px below the header (its height from site-header.tsx), so nothing above shows.
    <Card
      className="scroll-mt-[calc(var(--header-height,57px)+0.5rem)] p-5"
      id={id}
    >
      <h2 className="break-keep text-[15px] font-bold">{title}</h2>
      <div className="mb-4">
        <SectionDescription description={description} />
      </div>
      <div className="space-y-6">{children}</div>
    </Card>
  );
}

/** One example box inside a section: a small heading, an optional legend or control at its right, then the chart. */
export function Demo({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-[12px] font-medium text-muted-foreground">
          {title}
        </h3>
        {legend}
      </div>
      {children}
    </div>
  );
}

/** The spec's name for Demo. */
export const Example = Demo;
