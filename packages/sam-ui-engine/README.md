# sam-ui-engine

SAM UI is a small React 19 + Tailwind CSS 4 kit for dashboard screens: a sidebar app shell for the Next.js App
Router, filter toolbars, segmented controls, tabs, a month stepper, a switch, charts (recharts), and light and
dark tokens. This package carries the kit's source files and `sam-ui-engine`, the command that copies them into a
project and keeps them up to date.

The `sam-ui` plugin for Claude Code, Codex and Gemini CLI runs this command for you and builds screens with the
kit: https://github.com/sanghoooo/sam-ui

## Use

```sh
npx sam-ui-engine install <src-root>   # copy the kit into a project and write sam-ui.json
npx sam-ui-engine update <src-root>    # bring in a newer kit, keeping the project's own changes
npx sam-ui-engine check <src-root>     # list the kit files that differ from the installed version
npx sam-ui-engine --version
```

`<src-root>` is the folder the project's `@/` alias points at: the project root, or `src/`. The command writes
`sam-ui.json` at the project root with the kit's version and a hash per file, so an update can tell the files
the project left alone from the ones it changed. A file that needs a decision is listed with the command to
run, `--take <path>` (the kit's version) or `--keep <path>` (the project's).

It needs Node 18 or later and has no dependencies. It writes only inside the project, makes no network
requests, and reads the plugin folders of Claude Code (`~/.claude/plugins`), Codex (`~/.codex/plugins/cache`)
and Gemini CLI (`~/.gemini`) only to see whether a newer `sam-ui` plugin is installed. The kit itself needs
`lucide-react`, `clsx`, `tailwind-merge` and `recharts` 3.7 or later in the project.

## License

MIT
