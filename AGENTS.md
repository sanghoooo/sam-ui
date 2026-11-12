# sam-ui

- This repo holds SAM UI: the npm package `sam-ui-engine` (`packages/sam-ui-engine`: the kit's files and
  `scripts/kit.mjs`, its `sam-ui-engine` command) and the Claude Code / Codex / Gemini CLI plugin `sam-ui`
  (`plugins/sam-ui`: the `sam-ui-kit` skill and its references), whose skill runs that package with npx at the
  plugin's version. The marketplace `sam-plugins` is its own repo (github.com/sanghoooo/sam-plugins) and lists the
  plugin with a `git-subdir` source at `plugins/sam-ui` on the default branch, so a release here needs no change
  there. The kit carries no brand logos: `WorkspaceLogo` draws glyphs.
- The kit's source is `packages/sam-ui-engine/assets/` and nowhere else. `apps/hoo` reads it through the
  `@/components/*` and `@/lib/*` aliases and `@source`; never copy kit files into the app.
- Kit files are copied into other projects, so their comments must not point at paths outside the kit.
- When a component's API or behavior changes, update its file in `plugins/sam-ui/skills/sam-ui-kit/references/` (and `SKILL.md` if
  setup or rules change), and show the change on `/palette` (`apps/hoo/app/palette/palette-demo.tsx`). A chart
  (`components/charts/*`) is shown the same way on `/charts` (`apps/hoo/app/charts/`, one file per kind under
  `sections/`, listed in `charts-demo.tsx`), with its reference in `references/charts.md`.
  In `apps/hoo`, the intro at `/`, the header, the palette and the charts page are in Korean.
- Keep the kit working with Next.js Cache Components: the Sidebar stays in its `<Suspense>` boundary, and the
  placeholder page (`references/layout.md`) uses no `dynamicParams`/`dynamic`/`revalidate` segment config.
- `packages/sam-ui-engine/scripts/kit.mjs` installs, updates and checks the kit in projects through their `sam-ui.json` manifest (the version, and per file the hash of the kit version the project's copy is based on). It never overwrites a project's change without a per-file `--take` (or `update --force`), keeps an unmerged file on its old base so every update lists it, refuses to downgrade a project or to run while Claude Code, Codex or Gemini CLI has a newer `sam-ui` plugin installed (it prints that version's npx command), and hashes text with LF line endings. Keep `tests/kit.test.mjs` passing (`pnpm test`) and extend it when kit.mjs changes. The starter (`lib/nav.ts`) is copied once and then belongs to the project; update reports (`compare`) a starter the kit changed, and (`unused`) one the kit dropped, once, and writes it only to put a missing one back or when it is named with `--take`.
- Use pnpm. Run `pnpm check` (Biome's lint, formatting and import order, as CI does), `pnpm test` and `pnpm build`
  after changes; `pnpm dev` serves http://localhost:3102.
- `.github/workflows/pages.yml` publishes `apps/hoo` from main to GitHub Pages (https://sanghoooo.github.io/sam-ui/) as a
  static export under `/sam-ui` (`PAGES=1`, `NEXT_PUBLIC_BASE_PATH`), so the site uses nothing that needs a server, and a
  kit file that links to `public/` by a plain URL prefixes it with `NEXT_PUBLIC_BASE_PATH`.
- Release with `pnpm release <version>`: it sets the version of the package, the plugin manifests and the npx commands
  in the docs. Publish the package (`cd packages/sam-ui-engine && npm publish`) before the release reaches main, because the
  skill's commands run that exact version from npm; a plugin change reaches installs only when the version goes up.
- The plugin directory takes from an organization it hasn't verified only Markdown, text, JSON, YAML and
  PNG/JPEG/GIF/WebP/ICO files (nothing that starts with `#!`, no package manager configuration, UTF-8 text without NUL
  bytes), and publishes a version only once its scan has read every file whole. So `plugins/sam-ui` holds no code (it
  goes in `packages/sam-ui-engine`), and its text files keep their lines under 1,000 characters and embed no base64 data.
  `tests/plugin.test.mjs` (part of `pnpm test`) checks this, and that the plugin, the package and the docs' npx
  commands carry one version.
- Consult the Next.js docs in `node_modules/next/dist/docs/` before changing Next.js APIs or configuration.
