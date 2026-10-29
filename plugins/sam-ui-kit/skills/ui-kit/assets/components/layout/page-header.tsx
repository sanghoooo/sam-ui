import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./sidebar-context";

/** The page's top bar: back button, title and actions on the right. */
export function PageHeader({
  title,
  actions,
  back = true,
}: {
  title: string;
  actions?: ReactNode;
  back?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-15 items-center gap-3 border-b border-border bg-card px-4 py-2.5 lg:px-6">
      <SidebarTrigger />
      {back && <BackButton />}
      {/* Titles wrap instead of truncating. */}
      <h1 className="break-keep text-[22px] leading-tight font-bold tracking-tight">
        {title}
      </h1>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/** An outline link button with a dark "?" disc, for a page's manual or help. */
export function ManualButton({
  href = "/manual",
  label = "매뉴얼",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link className={buttonClass()} href={href}>
      <span
        aria-hidden
        className="grid size-4 place-items-center rounded-full bg-foreground text-[10px] leading-none font-bold text-card"
      >
        ?
      </span>
      {label}
    </Link>
  );
}
