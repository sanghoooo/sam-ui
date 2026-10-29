import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** What a section file exports beside its component: the jump-pill text and the heading. */
export type SectionMeta = { id: string; short: string; title: string };

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
      <p className="mt-1 mb-4 break-keep text-[12px] text-muted-foreground">
        {description}
      </p>
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
