"use client";

import { ChevronRight, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  NAV_FOOTER,
  NAV_GROUPS,
  NAV_HOME,
  type NavGroup,
  type NavLink,
} from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const { open, setOpen } = useSidebar();
  const close = () => setOpen(false);
  // A text label is a section title over the menu; any other node (a brand) heads the sidebar.
  const title = typeof NAV_HOME.label === "string" ? NAV_HOME.label : null;
  return (
    <>
      {open && (
        <button
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
          type="button"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
        id="app-sidebar"
      >
        {title === null && (
          <Link
            className="block border-b border-border px-5 pt-5 pb-4"
            href={NAV_HOME.href}
            onClick={close}
          >
            {NAV_HOME.label}
          </Link>
        )}
        <nav aria-label="주 메뉴" className="flex-1 overflow-y-auto px-3 py-4">
          {title !== null && (
            <div className="flex items-center gap-1 px-3 pb-2">
              <span className="text-[15px] font-bold">{title}</span>
              <Link
                aria-label="홈"
                className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                href={NAV_HOME.href}
                onClick={close}
              >
                <House className="size-3.5" />
              </Link>
            </div>
          )}
          <ul className="space-y-0.5">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup
                group={group}
                key={group.label}
                onNavigate={close}
              />
            ))}
          </ul>
        </nav>
        <div className="space-y-0.5 px-3 pt-2 pb-4">
          {NAV_FOOTER.map(({ label, href, icon: Icon }) => (
            <Link
              className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href={href}
              key={href}
              onClick={close}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

function SidebarGroup({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const listId = useId();
  // Open while it holds the current page, until the user toggles it.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const expanded =
    toggled ?? group.items.some((item) => item.href === pathname);
  return (
    <li>
      <button
        aria-controls={listId}
        aria-expanded={expanded}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-[14px] font-semibold transition-colors hover:bg-muted",
          group.icon && "px-2",
        )}
        onClick={() => setToggled(!expanded)}
        type="button"
      >
        {group.icon && (
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4"
          >
            {group.icon}
          </span>
        )}
        <span className="flex-1">{group.label}</span>
        {group.badge && <Badge>{group.badge}</Badge>}
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
      </button>
      <ul
        className={cn(
          "my-1 ml-4 space-y-0.5 border-l border-border pl-2",
          // Under an icon, the guide line runs below its center (px-2 plus half of 24px).
          group.icon && "ml-5",
        )}
        hidden={!expanded}
        id={listId}
      >
        {group.items.map((item) => (
          <SidebarLink
            current={item.href === pathname}
            item={item}
            key={item.href}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </li>
  );
}

function SidebarLink({
  item,
  current,
  onNavigate,
}: {
  item: NavLink;
  current: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        aria-current={current ? "page" : undefined}
        className={cn(
          "relative flex min-h-8 items-center gap-2 rounded-md px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          // The current page also marks the group's guide line with a short dark bar.
          current &&
            "bg-muted font-semibold text-foreground before:absolute before:inset-y-1.5 before:-left-[9.5px] before:w-0.5 before:rounded-full before:bg-foreground",
        )}
        href={item.href}
        onClick={onNavigate}
      >
        <span className="flex-1 break-keep">{item.label}</span>
        {item.badge && <Badge>{item.badge}</Badge>}
      </Link>
    </li>
  );
}
