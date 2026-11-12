# Layout: shell, header, menu, placeholder page, theme, workspace marks (Next.js App Router)

## AppShell (`components/layout/app-shell.tsx`)

Wrap the pages in it from a route-group layout, so routes outside the group (an API or health route, a
login page) stay bare:

```tsx
// app/(main)/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

It lays out the sidebar on the left and the main column; each page renders its own `PageHeader` and
`<main>`. The sidebar sits in its own `<Suspense>` boundary, because it reads the pathname: with Next.js
Cache Components on (`cacheComponents: true` with `partialPrefetching: true`, which create-next-app 16.4
turns on together; set both if you turn it on by hand, or every build warns), a route with a dynamic param
would otherwise fail the build. Keep that boundary if you change the shell.

Below `lg` the sidebar is a drawer: `SidebarTrigger` (already inside `PageHeader`) opens it and moves focus
into it, and a backdrop click, Escape or following a link closes it, with focus back where it was. From `lg`
up it stays in place, sticky and full height. `useSidebar()` (`sidebar-context.tsx`) returns
`{ open, setOpen }`.

The home page goes in the group too: `app/(main)/page.tsx` redirecting to the menu's home (delete
`app/page.tsx`: Next.js serves it in place of the redirect without a word), so `/`, the menu's home link and
the back button's fallback all land inside the shell.

```tsx
// app/(main)/page.tsx
import { redirect } from "next/navigation";
import { NAV_HOME } from "@/lib/nav";

export default function Home() {
  redirect(NAV_HOME.href);
}
```

## PageHeader (`components/layout/page-header.tsx`)

```tsx
<PageHeader actions={<ManualButton />} back={false} title="현황" />
```

| Prop | Meaning | Default |
|---|---|---|
| `title` | 22px bold; wraps, never truncates | |
| `actions` | right-aligned nodes: `ManualButton`, a primary `Button` … | |
| `back` | show the ◀ back button (history back, or `/` when the page was opened directly). Set it to `false` on pages reached from the menu | `true` |

`ManualButton({ href = "/manual", label = "매뉴얼" })` is an outline link button with a dark "?" disc.

## Menu (`lib/nav.ts`, `components/layout/sidebar.tsx`)

`lib/nav.ts` ships with a starter menu to replace with the project's: the section title 대시보드 (home
`/overview`) and one group 현황 with 개요; the bottom holds only the 다크 모드 switch.

```ts
type NavLink = { label: string; href: string; badge?: string };
type NavGroup = { label: string; items: NavLink[]; badge?: string; icon?: ReactNode };
type NavHome = { label: ReactNode; href: string };
```

- `NAV_HOME`: the top of the sidebar and the menu's home (`href`). A text `label` is the section title
  over the groups, with a home icon linking to `href`. Any other React node, such as the project's brand
  (a logo, the product name, the unit), heads the sidebar above the menu with a bottom border, and the
  whole header links to `href`. `lib/nav.ts` has no JSX, so make the element with `createElement`:

  ```ts
  import { createElement } from "react";
  import { Brand } from "@/components/brand"; // the project's own component

  export const NAV_HOME: NavHome = { label: createElement(Brand), href: "/home" };
  ```
- `NAV_GROUPS`: collapsible groups. A group opens while it holds the current page, until the user toggles
  it. The current link (its href equals the pathname, a trailing slash aside, so `trailingSlash: true`
  works too) gets a gray pill, semibold text and a short dark bar on
  the group's guide line. A `badge` shows a `Badge` after the label. An `icon` sits before the label in a
  24px box, and the group's guide line moves under its center. Give every group one, or none, so the
  labels line up. A lucide icon is drawn at 16px in the muted color; a workspace mark takes the box's
  size:

  ```ts
  import { Database } from "lucide-react";
  import { createElement } from "react";
  import { WorkspaceLogo } from "@/components/layout/workspace-logo";

  { label: "AIR", icon: createElement(WorkspaceLogo, { id: "air", className: "size-6" }), items: [/* … */] },
  { label: "데이터", icon: createElement(Database), items: [/* … */] },
  ```
- `NAV_FOOTER`: icon links at the bottom (`{ label, href, icon }`, lucide icons), above the 다크 모드
  switch; empty in the starter.
- `PAGES` lists every linked page with its header title, and `BUILT_PAGES` those with their own route
  folder. The optional placeholder page (below, written to `app/(main)/[...slug]/page.tsx`) serves every
  other page in `PAGES` with "준비 중인 화면입니다", so the whole menu works before its screens exist. Its
  headers have no back button (they are menu pages), except `/manual`'s, which is opened from a page's 매뉴얼
  button. When a screen gets its own folder, add its href to `BUILT_PAGES`; once every page has one, delete
  the placeholder, since a Cache Components build rejects its then empty `generateStaticParams`.

## Placeholder page

Written once into the project, then the project's own; it isn't a kit file, so update never touches it. It
needs Next.js 15.5 or later for the generated `PageProps` type, and has no `dynamicParams` or other segment
config, which Cache Components rejects:

```tsx
// app/(main)/[...slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManualButton, PageHeader } from "@/components/layout/page-header";
import { StatePanel } from "@/components/ui/card";
import { BUILT_PAGES, findPage, PAGES } from "@/lib/nav";

// Every sidebar and header link resolves here until its screen is built (BUILT_PAGES). Other paths get
// notFound() below; no `dynamicParams = false`, which Next.js Cache Components rejects. Once every page
// has its own folder, delete this file: an empty generateStaticParams fails a Cache Components build.
export function generateStaticParams() {
  return PAGES.filter((page) => !BUILT_PAGES.has(page.href)).map((page) => ({
    slug: page.href.slice(1).split("/"),
  }));
}

async function pageFor(params: PageProps<"/[...slug]">["params"]) {
  const { slug } = await params;
  return findPage(`/${slug.join("/")}`);
}

export async function generateMetadata({
  params,
}: PageProps<"/[...slug]">): Promise<Metadata> {
  const page = await pageFor(params);
  return { title: page?.label };
}

export default async function PlaceholderPage({
  params,
}: PageProps<"/[...slug]">) {
  const page = await pageFor(params);
  if (!page) notFound();
  // The manual is opened from a page's 매뉴얼 button, so it goes back there; menu pages have no back button.
  const manual = page.href === "/manual";
  return (
    <>
      <PageHeader
        actions={manual ? undefined : <ManualButton />}
        back={manual}
        title={page.label}
      />
      <main className="flex-1 p-4 lg:p-6">
        <StatePanel>준비 중인 화면입니다.</StatePanel>
      </main>
    </>
  );
}
```

## Workspace marks (`components/layout/workspace-logo.tsx`)

```tsx
<WorkspaceLogo id="air" />              {/* follows the page theme */}
<WorkspaceLogo id="tds" theme="dark" /> {/* pins one variant */}
```

`WorkspaceLogo` draws a workspace's mark in a 32px box: an 18px lucide glyph in the text color, `Wind` for
air, `Store` for TDS and `RadioTower` for MVNO. The kit carries no brand logos; a project with the right to
show one draws it in a component of its own. A mark follows the page theme; `theme` pins the light or the
dark color, for a mark on a surface of the other theme.

`WORKSPACES` lists `{ id, name, full, color }`: air ("air"), TDS ("T다이렉트샵") and
MVNO ("SKT망 알뜰폰"). `color` is the brand color as a CSS variable (`var(--brand-air)` …), ready for
inline styles and chart props.

## Theme (`lib/theme.ts`, `components/layout/theme-toggle.tsx`, `components/layout/theme-script.tsx`)

Light is the default. The sidebar's 다크 모드 switch puts `.dark` on `<html>` and stores
`"dark"`/`"light"` in `localStorage["sam-ui-theme"]` (`THEME_STORAGE_ITEM`). `<ThemeScript />` in the root
layout's `<head>` puts `THEME_SCRIPT` into the server HTML, which restores the choice before the first
paint, so there is no flash of light. It renders nothing in the browser: a `<script>` React creates there
never runs, and React warns about it.
`ThemeToggle({ label = "다크 모드", className })` is that switch row; it works outside the sidebar too, and
`className` merges onto the row (another hover fill on a translucent header, say).

A client component that must know the theme subscribes to the class:

```tsx
const dark = useSyncExternalStore(
  subscribeToTheme,
  () => document.documentElement.classList.contains("dark"),
  () => false, // the server renders light
);
```

Most screens never need this, because the tokens switch on their own (tokens.md).

## Font

Pretendard 1.3.9 (variable, SIL Open Font License) loads from jsDelivr through an `@font-face` in
`styles/ui-kit.css`, which also sets `--font-pretendard: "Pretendard Variable"` for the tokens' `--font-sans`.
Nothing goes in the root layout, and it works outside Next.js too. Without the network the stack falls back to
the system font; to serve the file yourself, point the `@font-face` `src` at your copy.

`lib/fonts.ts` only keeps `pretendard.variable`, now empty, for root layouts from before 0.5.6 that put it on
`<html>`; drop that import and class when you next edit the layout.
