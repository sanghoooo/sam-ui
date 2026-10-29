# sam-ui

- This repo holds SAM UI and the Claude Code plugin `sam-ui` that installs it. The marketplace
  `sam-plugins` is its own repo (github.com/sanghoooo/sam-plugins) and lists the plugin with a `git-subdir`
  source at `plugins/sam-ui` on the default branch, so a release here needs no change there. The kit carries the
  air/TDS business logos.
- The kit's source is `plugins/sam-ui/skills/ui-kit/assets/` and nowhere else. `apps/hoo` reads it through the
  `@/components/*` and `@/lib/*` aliases and `@source`; never copy kit files into the app.
- Kit files are copied into other projects, so their comments must not point at paths outside the kit.
- When a component's API or behavior changes, update its file in `skills/ui-kit/references/` (and `SKILL.md` if
  setup or rules change), and show the change on `/palette` (`apps/hoo/app/palette/palette-demo.tsx`).
  In `apps/hoo`, the intro at `/` and the header are in Korean; the palette is in English.
- Keep the kit working with Next.js Cache Components: the Sidebar stays in its `<Suspense>` boundary, and route
  templates use no `dynamicParams`/`dynamic`/`revalidate` segment config.
- `skills/ui-kit/scripts/kit.mjs` installs, updates and checks the kit in projects through their `sam-ui.json` manifest (the version, and per file the hash of the kit version the project's copy is based on). It never overwrites a project's change without a per-file `--take` (or `update --force`), keeps an unmerged file on its old base so every update lists it, refuses to downgrade a project or to run while Claude Code has a newer `sam-ui@sam-plugins` installed, and hashes text with LF line endings. Keep `tests/kit.test.mjs` passing (`pnpm test`) and extend it when kit.mjs changes. The starter (`lib/nav.ts`) is copied once and then belongs to the project; update reports (`compare`) a starter the kit changed, and (`unused`) one the kit dropped, once, and never writes it.
- Use pnpm. Run `pnpm lint`, `pnpm test` and `pnpm build` after changes; `pnpm dev` serves http://localhost:3102.
- `.github/workflows/pages.yml` publishes `apps/hoo` from main to GitHub Pages (https://sanghoooo.github.io/sam-ui/) as a
  static export under `/sam-ui` (`PAGES=1`, `NEXT_PUBLIC_BASE_PATH`), so the site uses nothing that needs a server, and a
  kit file that links to `public/` by a plain URL prefixes it with `NEXT_PUBLIC_BASE_PATH`.
- Release with `pnpm release <version>`; a plugin change reaches installs only when the version goes up.
- Consult the Next.js docs in `node_modules/next/dist/docs/` before changing Next.js APIs or configuration.
