#!/usr/bin/env bash
# Releases sam-ui: sets the version of the npm package (packages/sam-ui-engine) and of the plugin, and the npx
# commands in the docs that run it, validates the plugin, and builds dist/sam-ui-<version>.zip, with the
# package as a file, for PCs that can't reach GitHub or npm.
#
#   pnpm release <version>     e.g. pnpm release 0.2.0
set -euo pipefail
cd "$(dirname "$0")/.."

version="${1:?usage: pnpm release <version>, e.g. 0.2.0}"
# x.y.z only (the tag is v<version>, so a "v" here would double it), and never below the current version:
# kit.mjs refuses a plugin older than a project's kit. The same version again is fine, to redo a release.
if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "version must look like 0.2.0, got $version" >&2
  exit 2
fi
node -e '
const [current, next] = [process.argv[1], process.argv[2]].map((v) => v.split(".").map(Number));
for (let i = 0; i < 3; i++) {
  if (next[i] !== current[i]) {
    if (next[i] < current[i]) {
      console.error(`version ${process.argv[2]} is below the current ${process.argv[1]}`);
      process.exit(2);
    }
    break;
  }
}
' "$(node -p 'require("./plugins/sam-ui/.claude-plugin/plugin.json").version')" "$version"
# Claude Code reads the first, Codex the second (it prefers .codex-plugin), Gemini CLI the third, and npm the
# package's.
manifests=(
  plugins/sam-ui/.claude-plugin/plugin.json
  plugins/sam-ui/.codex-plugin/plugin.json
  plugins/sam-ui/gemini-extension.json
  packages/sam-ui-engine/package.json
)

for manifest in "${manifests[@]}"; do
  node -e '
const fs = require("fs");
const [file, version] = process.argv.slice(1);
// Replace only the version, so the file keeps the formatting Biome gives it.
const text = fs.readFileSync(file, "utf8");
const pattern = /"version": "[^"]*"/;
if (!pattern.test(text)) throw new Error(`no "version" in ${file}`);
fs.writeFileSync(file, text.replace(pattern, `"version": "${version}"`));
' "$manifest" "$version"
done
# The skill's commands run this exact version of the package (<name>@<version>), and the offline guide names
# the package's file (<name without @, / as ->-<version>.tgz, as npm pack writes it).
name=$(node -p 'require("./packages/sam-ui-engine/package.json").name')
docs=(
  plugins/sam-ui/skills/sam-ui-kit/SKILL.md
  plugins/sam-ui/README.md
  docs/offline-install.md
)
for doc in "${docs[@]}"; do
  node -e '
const fs = require("fs");
const [file, name, version] = process.argv.slice(1);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tgz = name.replace(/^@/, "").replace("/", "-");
const text = fs
  .readFileSync(file, "utf8")
  .replace(new RegExp(`${escape(name)}@\\d[\\w.+-]*\\d`, "g"), `${name}@${version}`)
  .replace(new RegExp(`${escape(tgz)}-\\d[\\w.+-]*\\d\\.tgz`, "g"), `${tgz}-${version}.tgz`);
fs.writeFileSync(file, text);
' "$doc" "$name" "$version"
done
echo "sam-ui version: $version"

# The zip is a local sam-plugins marketplace that lists only this plugin by a relative path, so it installs
# as sam-ui@sam-plugins like the online one, with the package beside it as npm pack writes it (the offline
# guide installs it with npm install -g).
root=$(pwd)
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/sam-plugins/.claude-plugin" dist
cp -R plugins "$stage/sam-plugins/"
cat >"$stage/sam-plugins/.claude-plugin/marketplace.json" <<'EOF'
{
  "name": "sam-plugins",
  "owner": { "name": "sanghoooo" },
  "description": "sanghoooo's Claude Code / Codex / Gemini CLI plugins (offline copy with sam-ui).",
  "plugins": [
    {
      "name": "sam-ui",
      "source": "./plugins/sam-ui",
      "description": "SAM UI: install a React + Tailwind CSS 4 dashboard kit with charts into a project and build screens with it."
    }
  ]
}
EOF
cp docs/offline-install.md "$stage/sam-plugins/README.md"
(cd packages/sam-ui-engine && npm pack --silent --pack-destination "$stage/sam-plugins" >/dev/null)
find "$stage" -name .DS_Store -delete

# claude is often only bundled with the VS Code extension, not on PATH; of several versions, the newest.
claude_bin=$(command -v claude ||
  ls -d "$HOME"/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null |
  sort -V | tail -1 ||
  true)
if [[ -n "$claude_bin" ]]; then
  "$claude_bin" plugin validate ./plugins/sam-ui --strict
  "$claude_bin" plugin validate "$stage/sam-plugins"
else
  echo "claude CLI not found: plugin validate skipped" >&2
fi

rm -f "dist/sam-ui-$version.zip"
(cd "$stage" && zip -qr "$root/dist/sam-ui-$version.zip" sam-plugins)

echo "built dist/sam-ui-$version.zip"
echo "next: commit and tag v$version, publish the package (cd packages/sam-ui-engine && npm publish), then merge to"
echo "the default branch: the skill's commands run $name@$version from npm, so it must be there first."
