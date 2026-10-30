# SAM UI

A React 19 + Tailwind CSS 4 dashboard kit, with a skill that installs it into a project and builds screens with
it. Screens Claude or Codex makes later use the same components and rules, so they look like the ones already
there.

## What's in the kit

- **Components:** button, badge, card, toolbar, state panel, field, select, segmented control, tabs, month
  stepper, switch, and the AI Insight title for AI-written summaries.
- **Charts** (recharts): trend (areas, lines, bars with forecasts and targets), column, stacked area, combo,
  share (ring, pie, treemap), bar list, sparkline, scatter, flow (Sankey) and annotation lanes, sharing one tooltip,
  zoom and series colors.
- **App shell** for the Next.js App Router: a collapsible sidebar with a starter menu, a page header and a back
  button.
- **Light and dark tokens:** every color has a dark value, so screens follow the theme without `dark:` classes.
- **Workspaces:** the air, TDS and MVNO logos and brand colors.
- **Font:** Pretendard, loaded from jsDelivr.

## Install

In Claude Code:

```
/plugin marketplace add https://github.com/sanghoooo/sam-plugins.git
/plugin install sam-ui@sam-plugins
```

In the Claude app, open **+** beside the prompt box, choose **Add plugins**, find **SAM UI** and add it.

In Codex (the CLI or the ChatGPT desktop app; the IDE extension has no plugins), run these in a terminal, then
start a new session (a new chat in the desktop app). Running the second one again brings in a newer release.

```
codex plugin marketplace add sanghoooo/sam-plugins
codex plugin add sam-ui@sam-plugins
```

## Use

Ask Claude or Codex in a project:

- **"Install the SAM UI kit"** ("SAM UI 킷 설치해줘"): it copies the components, wires up the tokens and the
  app shell, and records every file in `sam-ui.json`.
- **Describe a screen:** it builds the screen from the kit's components, in light and dark.
- **"Update the SAM UI kit"**: only files the project left alone change; the ones it edited are listed, not
  overwritten.

The components work in any React app with an `@/*` path alias; the app shell needs the Next.js App Router.

## Links

- Site and palette (Korean): https://sanghoooo.github.io/sam-ui/
- Source: https://github.com/sanghoooo/sam-ui

## License

The code and docs are MIT. The air and T logos are trademarks of their owners and aren't covered by the
license. Pretendard is under the SIL Open Font License 1.1.
