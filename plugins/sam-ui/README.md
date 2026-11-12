# SAM UI

A React 19 + Tailwind CSS 4 dashboard kit, with a skill that installs it into a project and builds screens with
it. Screens Claude, Codex or Gemini makes later use the same components and rules, so they look like the ones
already there. The plugin holds the skill and its references only; the kit's files come from the npm package
[`sam-ui-engine`](https://www.npmjs.com/package/sam-ui-engine).

## What's in the kit

- **Components:** button, badge, card, toolbar, state panel, field, select, segmented control, tabs, month
  stepper, switch, and the AI Insight title for AI-written summaries.
- **Charts** (recharts): trend (areas, lines, bars with forecasts and targets), column, stacked area, combo,
  share (ring, pie, treemap), bar list, sparkline, scatter, flow (Sankey) and annotation lanes, sharing one tooltip,
  zoom and series colors.
- **App shell** for the Next.js App Router: a collapsible sidebar with a starter menu, a page header and a back
  button.
- **Light and dark tokens:** every color has a dark value, so screens follow the theme without `dark:` classes.
- **Workspaces:** air, TDS and MVNO marks (glyphs, no brand logos) and brand colors.
- **Font:** Pretendard, loaded from jsDelivr.

## Install

In Claude Code:

```
/plugin marketplace add https://github.com/sanghoooo/sam-plugins.git
/plugin install sam-ui@sam-plugins
```

In the Claude app, open **+** beside the prompt box, choose **Add plugins**, find **SAM UI** and add it. The app
lists plugins only from marketplaces already added and has no screen for adding one, so if SAM UI isn't
there, run `claude plugin marketplace add https://github.com/sanghoooo/sam-plugins.git` in a terminal first.

In Codex (the CLI or the ChatGPT desktop app; the IDE extension has no plugins), run these in a terminal, then
start a new session (a new chat in the desktop app). Running the second one again brings in a newer release.

```
codex plugin marketplace add sanghoooo/sam-plugins
codex plugin add sam-ui@sam-plugins
```

In Gemini CLI, run this in a terminal, then start a new session (or run `/skills reload`). Running it again brings in a
newer release.

```
gemini skills install https://github.com/sanghoooo/sam-ui.git --path plugins/sam-ui/skills/sam-ui-kit
```

## Use

Ask Claude, Codex or Gemini in a project:

- **"Install the SAM UI kit"** ("SAM UI 킷 설치해줘"): it copies the components, wires up the tokens and the
  app shell, and records every file in `sam-ui.json`.
- **Describe a screen:** it builds the screen from the kit's components, in light and dark.
- **"Update the SAM UI kit"**: only files the project left alone change; the ones it edited are listed, not
  overwritten.

The components work in any React app with an `@/*` path alias; the app shell needs the Next.js App Router.

## What it runs

To install, update or check the kit, the skill runs one command in the project, with your agent's usual
permission prompt:

```
npx --yes sam-ui-engine@0.7.0 install <src-root>
```

(`update` and `check` the same way.) npx downloads that exact version of the package from the npm registry
into its cache; it needs Node 18 or later and has no dependencies. The command copies the kit's files into
the project and writes `sam-ui.json` there, and writes nothing outside the project. It makes no network
requests and sends nothing anywhere. To tell whether a newer `sam-ui` plugin is installed, it reads the plugin
folders of Claude Code (`~/.claude/plugins`), Codex (`~/.codex/plugins/cache`) and Gemini CLI (`~/.gemini`).
Building screens afterwards needs `lucide-react`, `clsx`, `tailwind-merge` and `recharts`, which the skill
installs with the project's package manager.

## Links

- Site and palette (Korean): https://sanghoooo.github.io/sam-ui/
- Source: https://github.com/sanghoooo/sam-ui
- Package: https://www.npmjs.com/package/sam-ui-engine
- Issues and support: https://github.com/sanghoooo/sam-ui/issues

## License

The code and docs are MIT. Pretendard is under the SIL Open Font License 1.1. Product and company names such as
air, T다이렉트샵, SKT, KT and LG U+ are trademarks of their owners, used only to name them.
