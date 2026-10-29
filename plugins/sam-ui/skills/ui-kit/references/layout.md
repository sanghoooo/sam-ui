# Layout: shell, header, menu, theme, workspace logos (Next.js App Router)

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
Cache Components on (`cacheComponents: true`, which recent create-next-app templates turn on), a route with
a dynamic param would otherwise fail the build. Keep that boundary if you change the shell.

Below `lg` the sidebar is a drawer: `SidebarTrigger` (already inside `PageHeader`) opens it, and a backdrop
click, Escape or following a link closes it. From `lg` up it stays in place, sticky and full height.
`useSidebar()` (`sidebar-context.tsx`) returns `{ open, setOpen }`.

The home page goes in the group too: `app/(main)/page.tsx` redirecting to the menu's home (remove
`app/page.tsx`), so `/`, the menu's home link and the back button's fallback all land inside the shell.

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
| `back` | show the ◀ back button (history back, or `/` when the page was opened directly). Pass `false` on pages reached from the menu | `true` |

`ManualButton({ href = "/manual", label = "매뉴얼" })` is an outline link button with a dark "?" disc.

## Menu (`lib/nav.ts`, `components/layout/sidebar.tsx`)

`lib/nav.ts` ships with a starter menu to replace with the project's: the section title 대시보드 (home
`/overview`), one group 현황 with 개요, and 문의, 피드백 and UI 팔레트 at the bottom.

```ts
type NavLink = { label: string; href: string; badge?: string };
type NavGroup = { label: string; items: NavLink[]; badge?: string; icon?: ReactNode };
type NavHome = { label: ReactNode; href: string };
```

- `NAV_HOME`: the top of the sidebar and the menu's home (`href`). A text `label` is the section title
  over the groups, with a home icon linking to `href`. Any other React node, such as the project's brand
  (a logo, the product name, the unit), heads the sidebar above the menu with a bottom border, and the
  whole header links to `href`. `lib/nav.ts` has no JSX, so pass a component through `createElement`:

  ```ts
  import { createElement } from "react";
  import { Brand } from "@/components/brand"; // the project's own component

  export const NAV_HOME: NavHome = { label: createElement(Brand), href: "/home" };
  ```
- `NAV_GROUPS`: collapsible groups. A group opens while it holds the current page, until the user toggles
  it. The current link (matched by exact pathname) gets a gray pill, semibold text and a short dark bar on
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
  switch.
- `PAGES` lists every linked page with its header title, and `BUILT_PAGES` those with their own route
  folder. The optional placeholder (`templates/placeholder-page.tsx` copied to
  `app/(main)/[...slug]/page.tsx`) serves every other page in `PAGES` with "준비 중인 화면입니다", so the
  whole menu works before its screens exist. When a screen gets its own folder, add its href to
  `BUILT_PAGES`.

## Workspace logos (`components/layout/workspace-logo.tsx`)

```tsx
<WorkspaceLogo id="air" />              {/* follows the page theme */}
<WorkspaceLogo id="tds" theme="dark" /> {/* pins one variant */}
```

`WorkspaceLogo` draws a workspace's mark in a 32px box: air and TDS load a light or dark SVG
(`/images/workspaces/{id}-{light,dark}.svg`, switched by CSS so it is right before hydration), and MVNO
draws lucide's `RadioTower`. The marks are sized so the set reads at one weight (air 24px, MVNO 18px, TDS
17px).

An app served under a `basePath` sets `NEXT_PUBLIC_BASE_PATH` to the same path, because a plain `<img>`
doesn't get the basePath the way `next/link` does; the logos put it before `/images/…`. Reading the
basePath from that variable keeps the two in step:

```js
// next.config.mjs, with NEXT_PUBLIC_BASE_PATH=/admin in .env
export default { basePath: process.env.NEXT_PUBLIC_BASE_PATH };
```

`WORKSPACES` lists `{ id, name, full, color }`: air ("air"), TDS ("T다이렉트샵") and
MVNO ("SKT망 알뜰폰"). `color` is the brand color as a CSS variable (`var(--brand-air)` …), ready for
inline styles and chart props.

## Theme (`lib/theme.ts`, `components/layout/theme-toggle.tsx`, `components/layout/theme-script.tsx`)

Light is the default. The sidebar's 다크 모드 switch puts `.dark` on `<html>` and stores
`"dark"`/`"light"` in `localStorage["sam-ui-theme"]` (`THEME_STORAGE_KEY`). `<ThemeScript />` in the root
layout's `<head>` puts `THEME_SCRIPT` into the server HTML, which restores the choice before the first
paint, so there is no flash of light. It renders nothing in the browser: a `<script>` React creates there
never runs, and React warns about it.
`ThemeToggle({ label = "다크 모드" })` is that switch row; it works outside the sidebar too.

A client component that must know the theme subscribes to the class:

```tsx
const dark = useSyncExternalStore(
  subscribeToTheme,
  () => document.documentElement.classList.contains("dark"),
  () => false, // the server renders light
);
```

Most screens never need this, because the tokens switch on their own (tokens.md).

## Font (`lib/fonts.ts`)

Pretendard (variable woff2, SIL Open Font License in `lib/fonts/OFL.txt`) through `next/font/local`, as the
`--font-pretendard` variable that the tokens' `--font-sans` reads. Put `pretendard.variable` on `<html>`.
Outside Next.js, load the woff2 with an `@font-face` named `Pretendard` and set `--font-pretendard:
"Pretendard"`.
