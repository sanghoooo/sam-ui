import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type NavLink = { label: string; href: string; badge?: string };
/**
 * A collapsible group. `icon` sits before the label in a 24px box, as a React node built without JSX: a
 * lucide icon (`createElement(Database)`, drawn at 16px) or a workspace mark
 * (`createElement(WorkspaceLogo, { id: "air", className: "size-6" })`). Give every group one, or none.
 */
export type NavGroup = {
  label: string;
  items: NavLink[];
  badge?: string;
  icon?: ReactNode;
};
export type FooterLink = NavLink & { icon: LucideIcon };

/**
 * The top of the sidebar, linking to `href`. A text `label` is a section title with a home icon beside it.
 * Any other React node, such as the project's brand, heads the sidebar instead and links home as a whole.
 * This file stays .ts, so build it without JSX: `label: createElement(Brand)`.
 */
export type NavHome = { label: ReactNode; href: string };

/** The top of the sidebar, here a section title, and the menu's home. */
export const NAV_HOME: NavHome = { label: "대시보드", href: "/overview" };

/** Sidebar groups. A starting point: put the project's menu here. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "현황",
    items: [{ label: "개요", href: "/overview" }],
  },
];

/**
 * Icon links at the bottom of the sidebar, above the 다크 모드 switch; none to start with. Each is a lucide
 * icon and a link: `{ label: "문의", href: "/support", icon: MessageSquareText }`.
 */
export const NAV_FOOTER: FooterLink[] = [];

/**
 * Pages with their own route folder. Every other page in PAGES is a placeholder ([...slug]); add a
 * page's href here when it gets its folder.
 */
export const BUILT_PAGES = new Set<string>();

/** Every page the sidebar and the header link to, with the title its header shows. */
export const PAGES: NavLink[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...NAV_FOOTER.map(({ label, href }) => ({ label, href })),
  { label: "매뉴얼", href: "/manual" },
];

export function findPage(href: string) {
  return PAGES.find((page) => page.href === href);
}
