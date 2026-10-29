#!/usr/bin/env bash
# Releases the sam-ui-kit plugin: sets its version, validates the plugin and the marketplace, and builds
# dist/sam-ui-<version>.zip for PCs that can't reach the repository.
#
#   pnpm release <version>     e.g. pnpm release 0.2.0
set -euo pipefail
cd "$(dirname "$0")/.."

version="${1:?usage: pnpm release <version>, e.g. 0.2.0}"
manifest=plugins/sam-ui-kit/.claude-plugin/plugin.json

node -e '
const fs = require("fs");
const [file, version] = process.argv.slice(1);
// Replace only the version, so the file keeps the formatting Biome gives it.
const text = fs.readFileSync(file, "utf8");
const pattern = /"version": "[^"]*"/;
if (!pattern.test(text)) throw new Error(`no "version" in ${file}`);
fs.writeFileSync(file, text.replace(pattern, `"version": "${version}"`));
' "$manifest" "$version"
echo "sam-ui-kit version: $version"

# claude is often only bundled with the VS Code extension, not on PATH.
claude_bin=$(command -v claude ||
  ls -d "$HOME"/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | tail -1 ||
  true)
if [[ -n "$claude_bin" ]]; then
  "$claude_bin" plugin validate ./plugins/sam-ui-kit --strict
  "$claude_bin" plugin validate .
else
  echo "claude CLI not found: plugin validate skipped" >&2
fi

root=$(pwd)
stage=$(mktemp -d)
mkdir -p "$stage/sam-ui" dist
cp -R .claude-plugin plugins "$stage/sam-ui/"
cp docs/offline-install.md "$stage/sam-ui/README.md"
find "$stage" -name .DS_Store -delete
rm -f "dist/sam-ui-$version.zip"
(cd "$stage" && zip -qr "$root/dist/sam-ui-$version.zip" sam-ui)
rm -rf "$stage"

echo "built dist/sam-ui-$version.zip"
echo "next: commit, tag v$version and merge to the default branch."
