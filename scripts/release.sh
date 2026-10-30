#!/usr/bin/env bash
# Releases the sam-ui plugin: sets its version, validates it, and builds dist/sam-ui-<version>.zip for PCs
# that can't reach GitHub.
#
#   pnpm release <version>     e.g. pnpm release 0.2.0
set -euo pipefail
cd "$(dirname "$0")/.."

version="${1:?usage: pnpm release <version>, e.g. 0.2.0}"
# Claude Code reads the first, Codex the second (it prefers .codex-plugin), and Gemini CLI the third;
# kit.mjs also carries VERSION for a standalone `gemini skills install`.
manifests=(
  plugins/sam-ui/.claude-plugin/plugin.json
  plugins/sam-ui/.codex-plugin/plugin.json
  plugins/sam-ui/gemini-extension.json
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
node -e '
const fs = require("fs");
const [file, version] = process.argv.slice(1);
const text = fs.readFileSync(file, "utf8");
const pattern = /^const VERSION = "[^"]*";/m;
if (!pattern.test(text)) throw new Error(`no VERSION in ${file}`);
fs.writeFileSync(file, text.replace(pattern, `const VERSION = "${version}";`));
' plugins/sam-ui/skills/sam-ui-kit/scripts/kit.mjs "$version"
echo "sam-ui version: $version"

# The zip is a local sam-plugins marketplace that lists only this plugin by a relative path, so it installs
# as sam-ui@sam-plugins like the online one.
root=$(pwd)
stage=$(mktemp -d)
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
find "$stage" -name .DS_Store -delete

# claude is often only bundled with the VS Code extension, not on PATH.
claude_bin=$(command -v claude ||
  ls -d "$HOME"/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | tail -1 ||
  true)
if [[ -n "$claude_bin" ]]; then
  "$claude_bin" plugin validate ./plugins/sam-ui --strict
  "$claude_bin" plugin validate "$stage/sam-plugins"
else
  echo "claude CLI not found: plugin validate skipped" >&2
fi

rm -f "dist/sam-ui-$version.zip"
(cd "$stage" && zip -qr "$root/dist/sam-ui-$version.zip" sam-plugins)
rm -rf "$stage"

echo "built dist/sam-ui-$version.zip"
echo "next: commit, tag v$version and merge to the default branch."
