// Checks the folder the plugin directory scans, plugins/sam-ui, and that the plugin, the package and the docs
// name one version. From an organization it hasn't verified, the directory refuses a version holding any file
// that isn't Markdown, text, JSON, YAML or a PNG, JPEG, GIF, WebP or ICO image, starts with #!, is a package
// manager's configuration, or is text that isn't UTF-8 or holds a NUL byte. It also publishes a version only
// once its scan has read every file whole, so text keeps its lines short and carries no base64 data.
// Run with `pnpm test`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const PLUGIN = repo("plugins/sam-ui");
const TEXT = /\.(md|markdown|txt|json|ya?ml)$/i;
// The bytes each allowed image starts with (WebP: RIFF, then WEBP at offset 8).
const IMAGES = {
  png: [[0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]],
  jpg: [[0, [0xff, 0xd8, 0xff]]],
  jpeg: [[0, [0xff, 0xd8, 0xff]]],
  gif: [[0, [0x47, 0x49, 0x46, 0x38]]],
  webp: [
    [0, [0x52, 0x49, 0x46, 0x46]],
    [8, [0x57, 0x45, 0x42, 0x50]],
  ],
  ico: [[0, [0x00, 0x00, 0x01, 0x00]]],
};
const PACKAGE_CONFIG = new Set([
  ".npmrc",
  ".yarnrc",
  ".yarnrc.yml",
  "bunfig.toml",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "yarn.lock",
]);
const MAX_LINE = 1000;
const utf8 = new TextDecoder("utf-8", { fatal: true });

const problems = [];
let checked = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const rel = path.relative(PLUGIN, file);
    if (entry.name === ".DS_Store") continue;
    if (entry.isSymbolicLink()) {
      problems.push(`${rel} is a symlink; the directory takes regular files`);
      continue;
    }
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    checked++;
    const data = fs.readFileSync(file);
    const ext = path.extname(entry.name).slice(1).toLowerCase();
    if (PACKAGE_CONFIG.has(entry.name.toLowerCase()))
      problems.push(`${rel} is a package manager's configuration`);
    else if (IMAGES[ext]) {
      const ok = IMAGES[ext].every(([at, bytes]) =>
        bytes.every((byte, i) => data[at + i] === byte),
      );
      if (!ok) problems.push(`${rel} isn't a ${ext.toUpperCase()} image`);
    } else if (!TEXT.test(entry.name))
      problems.push(
        `${rel}: the directory takes only Markdown, text, JSON, YAML and PNG/JPEG/GIF/WebP/ICO files; code goes in packages/sam-ui-engine`,
      );
    else {
      let text = "";
      try {
        text = utf8.decode(data);
      } catch {
        problems.push(`${rel} isn't UTF-8 text`);
        continue;
      }
      if (text.includes("\0")) problems.push(`${rel} holds a NUL byte`);
      if (text.startsWith("#!")) problems.push(`${rel} starts with #!`);
      text.split("\n").forEach((line, i) => {
        if (line.length > MAX_LINE)
          problems.push(
            `${rel}:${i + 1} is ${line.length} characters long (at most ${MAX_LINE})`,
          );
      });
      if (/data:[\w.+-]+\/[\w.+-]+;base64,/i.test(text))
        problems.push(`${rel} embeds base64 data`);
    }
  }
}
walk(PLUGIN);

// One version: the plugin's manifests, the package, and every command or file name in the docs that runs or
// installs the package (pnpm release sets them all).
const versionOf = (rel) =>
  JSON.parse(fs.readFileSync(repo(rel), "utf8")).version;
const pkg = JSON.parse(
  fs.readFileSync(repo("packages/sam-ui-engine/package.json"), "utf8"),
);
const versions = {
  "plugins/sam-ui/.claude-plugin/plugin.json": versionOf(
    "plugins/sam-ui/.claude-plugin/plugin.json",
  ),
  "plugins/sam-ui/.codex-plugin/plugin.json": versionOf(
    "plugins/sam-ui/.codex-plugin/plugin.json",
  ),
  "plugins/sam-ui/gemini-extension.json": versionOf(
    "plugins/sam-ui/gemini-extension.json",
  ),
};
for (const [rel, version] of Object.entries(versions))
  if (version !== pkg.version)
    problems.push(
      `${rel} has version ${version}, the package ${pkg.version}: pnpm release sets both`,
    );
const literal = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tgz = pkg.name.replace(/^@/, "").replace("/", "-");
for (const rel of [
  "plugins/sam-ui/skills/sam-ui-kit/SKILL.md",
  "plugins/sam-ui/README.md",
  "docs/offline-install.md",
]) {
  const text = fs.readFileSync(repo(rel), "utf8");
  const named = [
    ...text.matchAll(new RegExp(`${literal(pkg.name)}@(\\d[\\w.+-]*\\d)`, "g")),
    ...text.matchAll(
      new RegExp(`${literal(tgz)}-(\\d[\\w.+-]*\\d)\\.tgz`, "g"),
    ),
  ].map((match) => match[1]);
  if (!named.length) problems.push(`${rel} names no version of ${pkg.name}`);
  for (const version of new Set(named))
    if (version !== pkg.version)
      problems.push(
        `${rel} runs or installs ${pkg.name} ${version}, not the package's ${pkg.version}`,
      );
}

// Agent skills cap a description at 1,024 characters.
const skill = fs.readFileSync(
  repo("plugins/sam-ui/skills/sam-ui-kit/SKILL.md"),
  "utf8",
);
const description = skill
  .match(/^description: >-\n((?: {2}.*\n)+)/m)?.[1]
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .join(" ");
if (!description) problems.push("SKILL.md has no folded description");
else if (description.length > 1024)
  problems.push(
    `SKILL.md's description is ${description.length} characters (at most 1,024)`,
  );

for (const problem of problems) console.log(`  FAIL: ${problem}`);
console.log(`plugin: ${checked} files checked, ${problems.length} failed`);
process.exit(problems.length ? 1 : 0);
