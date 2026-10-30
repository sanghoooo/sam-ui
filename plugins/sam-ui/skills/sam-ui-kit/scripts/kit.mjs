#!/usr/bin/env node
// SAM UI: copies the kit's files (../assets) into a project and keeps them up to date.
//
//   node kit.mjs install <src-root> [--take <path>]... [--keep <path>]...
//   node kit.mjs update  <src-root> [--take <path>]... [--keep <path>]... [--force]
//   node kit.mjs check   <src-root>
//
// <src-root> is the folder the project's "@/" alias points at: the project root, or src/. Files under
// assets/public go to the project root's public/ instead. The project root (the folder with
// package.json: <src-root> or its parent) gets sam-ui.json, the manifest: the kit version, and for each
// kit file the hash of the kit's version the project's copy is based on, so an update can tell files the
// project left alone from files it changed. Starters are hashed too, so update can say when the kit
// changed one.
//
// A file that needs a decision is named with --take or --keep (as printed, or relative to <src-root>).
// --take puts the kit's version in place; for a changed file the kit dropped, it deletes the file.
// --keep keeps the project's version: a local change on top of the current kit, or, for a file the kit
// dropped, the project's own. update --force takes the kit's version of every kit file the project
// changed. Exit codes: 0 done, 1 something needs attention (see the output), 2 bad usage.
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(import.meta.url);
const here = path.dirname(script);
const assets = path.resolve(here, "../assets");
const pluginRoot = path.resolve(here, "../../..");
const MANIFEST = "sam-ui.json";
// Fallback version when only the skill folder is installed (`gemini skills install`); set by scripts/release.sh.
const VERSION = "0.6.0";
// Installed once as a starting point, then the project's own: update and check never write them, and
// update reports ("compare") the ones the kit changed since the manifest was written.
const STARTERS = ["lib/nav.ts"];

function usage(problem) {
  if (problem) console.error(problem);
  console.error(
    "usage: node kit.mjs install|update|check <src-root> [--take <path>]... [--keep <path>]... [--force (update only)]",
  );
  process.exit(2);
}

const [command, ...args] = process.argv.slice(2);
const takeArgs = [];
const keepArgs = [];
const positional = [];
let force = false;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const eq = arg.startsWith("--") ? arg.indexOf("=") : -1;
  const flag = eq > 0 ? arg.slice(0, eq) : arg;
  if (arg === "--force") force = true;
  else if (flag === "--take" || flag === "--keep") {
    const value = eq > 0 ? arg.slice(eq + 1) : args[++i];
    if (!value || value.startsWith("-")) usage(`${flag} needs a path.`);
    (flag === "--take" ? takeArgs : keepArgs).push(value);
  } else if (arg.startsWith("-")) usage(`Unknown option ${arg}.`);
  else positional.push(arg);
}
if (!["install", "update", "check"].includes(command)) usage();
if (positional.length !== 1)
  usage(
    positional.length
      ? `One <src-root> only, got: ${positional.join(" ")}`
      : "Missing <src-root>.",
  );
if (force && command === "install")
  usage(
    "install has no --force: name each differing file with --take <path> (the kit's version) or --keep <path> (the project's).",
  );
if (command === "check" && (force || takeArgs.length || keepArgs.length))
  usage("check takes no options.");
const srcArg = positional[0];

const srcRoot = path.resolve(srcArg);
const projectRoot = [srcRoot, path.dirname(srcRoot)].find((dir) =>
  fs.existsSync(path.join(dir, "package.json")),
);
if (!projectRoot) {
  console.error(
    `No package.json in ${srcRoot} or its parent: give the folder the project's "@/" alias points at.`,
  );
  process.exit(2);
}
const manifestPath = path.join(projectRoot, MANIFEST);
const srcRel =
  path.relative(projectRoot, srcRoot).split(path.sep).join("/") || ".";
const pluginManifest = path.join(pluginRoot, ".claude-plugin/plugin.json");
const kitRoot = fs.existsSync(pluginManifest)
  ? pluginRoot
  : path.resolve(here, "..");
const kitVersion = fs.existsSync(pluginManifest)
  ? readJson(pluginManifest)?.version
  : VERSION;
if (!kitVersion) {
  console.error(`No version in ${pluginManifest}.`);
  process.exit(2);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function readScriptVersion(file) {
  try {
    return fs
      .readFileSync(file, "utf8")
      .match(/^const VERSION = "([^"]+)";/m)?.[1];
  } catch {
    return null;
  }
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
// The hashes a file's content may be recorded under, its own hash first. Text files (no NUL byte) hash
// with LF line endings, so a CRLF checkout (Windows, git autocrlf) still matches the kit. sam-ui 0.2.0
// hashed raw bytes, so its manifests may hold the raw or the CRLF form.
function hashesOf(file) {
  const data = fs.readFileSync(file);
  if (data.includes(0)) return [sha256(data)];
  const lf = data.toString("latin1").replace(/\r\n/g, "\n");
  return [
    sha256(Buffer.from(lf, "latin1")),
    sha256(data),
    sha256(Buffer.from(lf.replace(/\n/g, "\r\n"), "latin1")),
  ];
}
const hashOf = (file) => hashesOf(file)[0];
// Whether a file is the version a manifest hash was taken of.
const matches = (file, hash) => Boolean(hash) && hashesOf(file).includes(hash);

const asset = (rel) => path.join(assets, ...rel.split("/"));
const target = (rel) =>
  path.join(
    rel.startsWith("public/") ? projectRoot : srcRoot,
    ...rel.split("/"),
  );
// How a file is named in the output: relative to the project root.
const shown = (rel) =>
  path.relative(projectRoot, target(rel)).split(path.sep).join("/");

function kitFiles(dir = assets, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory())
      out.push(...kitFiles(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

function copy(rel) {
  fs.mkdirSync(path.dirname(target(rel)), { recursive: true });
  fs.copyFileSync(asset(rel), target(rel));
}

function compareVersions(a, b) {
  const parts = (v) =>
    String(v)
      .split(".")
      .map((n) => Number.parseInt(n, 10) || 0);
  const [pa, pb] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

// The plugin's id in Claude Code. It was sam-ui-kit@sam-ui in 0.4 and sam-ui@hoo-plugins in 0.5.0 and 0.5.1;
// those ids stopped there, so they never count. Up to 0.3.5 it was this one, older than any kit reading it.
const PLUGIN_ID = "sam-ui@sam-plugins";

// The installs of sam-ui that cover this project, as { installPath, version, agent }: Claude Code's (user
// scope, or project scope for this folder or one above it), Codex's (user-wide, a folder per version in
// its plugin cache, $CODEX_HOME/plugins/cache/<marketplace>/<plugin>/<version>) and Gemini CLI's (user-wide,
// under $GEMINI_CLI_HOME/.gemini/skills/sam-ui-kit or .gemini/extensions/sam-ui).
function installs() {
  const found = [];
  const config =
    process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  const installed = readJson(
    path.join(config, "plugins/installed_plugins.json"),
  );
  const coversProject = (entry) => {
    if (entry.scope !== "project" && entry.scope !== "local") return true;
    if (!entry.projectPath) return false;
    const rel = path.relative(entry.projectPath, projectRoot);
    return !rel.startsWith("..") && !path.isAbsolute(rel);
  };
  for (const [id, entries] of Object.entries(installed?.plugins ?? {})) {
    if (id !== PLUGIN_ID) continue;
    for (const entry of [entries].flat())
      if (entry?.installPath && coversProject(entry))
        found.push({ ...entry, agent: "Claude Code" });
  }
  const [name, marketplace] = PLUGIN_ID.split("@");
  const cache = path.join(
    process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
    "plugins/cache",
    marketplace,
    name,
  );
  let versions = [];
  try {
    versions = fs.readdirSync(cache);
  } catch {}
  for (const folder of versions) {
    const installPath = path.join(cache, folder);
    const version = readJson(
      path.join(installPath, ".claude-plugin/plugin.json"),
    )?.version;
    if (version) found.push({ installPath, version, agent: "Codex" });
  }
  const gemini = path.join(
    process.env.GEMINI_CLI_HOME || os.homedir(),
    ".gemini",
  );
  const geminiExt = path.join(gemini, "extensions", name);
  const extVersion =
    readJson(path.join(geminiExt, "gemini-extension.json"))?.version ??
    readJson(path.join(geminiExt, ".claude-plugin/plugin.json"))?.version;
  if (extVersion)
    found.push({
      installPath: geminiExt,
      version: extVersion,
      agent: "Gemini CLI",
    });
  const geminiSkill = path.join(gemini, "skills/sam-ui-kit");
  const skillVersion = readScriptVersion(
    path.join(geminiSkill, "scripts/kit.mjs"),
  );
  if (skillVersion)
    found.push({
      installPath: geminiSkill,
      version: skillVersion,
      agent: "Gemini CLI",
    });
  return found;
}

// A sam-ui newer than this copy that Claude Code, Codex or Gemini CLI has installed for this project. After a
// plugin update, a session can still hold the old version's path (Codex deletes the old version's folder).
function newerInstalled() {
  let newest = null;
  for (const entry of installs()) {
    if (!fs.existsSync(entry.installPath)) continue;
    if (compareVersions(entry.version, newest?.version ?? kitVersion) > 0)
      newest = entry;
  }
  if (!newest) return null;
  // The skill's folder is sam-ui-kit (at installPath directly for `gemini skills install`, or under skills/);
  // it was ui-kit before, so an install from then has its script there.
  const scripts = [
    path.join(newest.installPath, "scripts/kit.mjs"),
    ...["sam-ui-kit", "ui-kit"].map((skill) =>
      path.join(newest.installPath, "skills", skill, "scripts/kit.mjs"),
    ),
  ];
  return {
    version: newest.version,
    agent: newest.agent,
    script: scripts.find((file) => fs.existsSync(file)) ?? scripts[1],
  };
}

function refuseIfNewerInstalled() {
  const newer = newerInstalled();
  if (!newer) return;
  console.error(
    `This is sam-ui ${kitVersion} (${kitRoot}), but ${newer.agent} has sam-ui ${newer.version} installed. Run that one, and decide any --take/--keep again from its output (the newer kit may change those files):\n  node ${newer.script} ${command} ${srcArg}`,
  );
  process.exit(1);
}

// The package globs of a pnpm-workspace.yaml (block or flow list under `packages:`).
function pnpmWorkspacePackages(dir) {
  let text = "";
  try {
    text = fs.readFileSync(path.join(dir, "pnpm-workspace.yaml"), "utf8");
  } catch {
    return [];
  }
  const unquote = (s) => s.trim().replace(/^['"]|['"]$/g, "");
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((line) => /^packages\s*:/.test(line));
  if (at < 0) return [];
  const flow = lines[at].match(/^packages\s*:\s*\[(.*)\]/);
  if (flow) return flow[1].split(",").map(unquote).filter(Boolean);
  const globs = [];
  for (const line of lines.slice(at + 1)) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    const item = line.match(/^\s*-\s+([^#]+)/);
    if (!item) break;
    globs.push(unquote(item[1]));
  }
  return globs;
}

// A monorepo root: its workspace lists packages other than itself. create-next-app writes a
// pnpm-workspace.yaml into a single app too (settings only, or packages: ["."]).
function isWorkspaceRoot(dir) {
  const workspaces = readJson(path.join(dir, "package.json"))?.workspaces;
  const globs = [
    ...pnpmWorkspacePackages(dir),
    ...(Array.isArray(workspaces) ? workspaces : (workspaces?.packages ?? [])),
  ];
  return globs.some((glob) => !/^(\.\/?|!.*)$/.test(String(glob).trim()));
}

// Where the kit is installed below a workspace root (up to two levels down, e.g. apps/web), as the
// <src-root> to give, relative to the current folder.
function installedBelow(dir, depth = 1) {
  const found = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    if (entry.name.startsWith(".")) continue;
    const sub = path.join(dir, entry.name);
    const manifest = readJson(path.join(sub, MANIFEST));
    if (manifest)
      found.push(
        path.relative(process.cwd(), path.join(sub, manifest.srcRoot ?? ".")) ||
          ".",
      );
    else if (depth < 2) found.push(...installedBelow(sub, depth + 1));
  }
  return found;
}

function refuseWorkspaceRoot(what) {
  const found = installedBelow(projectRoot);
  console.error(
    `${projectRoot} is a workspace root${what}. ${
      found.length
        ? `The kit is installed in: ${found.join(", ")}. Give that folder.`
        : `Give the app's folder (the one its "@/" alias points at), e.g. apps/web.`
    }`,
  );
  process.exit(2);
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  if (!manifest || typeof manifest !== "object") {
    console.error(
      `${manifestPath} is not valid JSON (an unresolved git merge?): fix it, then run this again.`,
    );
    process.exit(2);
  }
  if ((manifest.srcRoot ?? ".") !== srcRel) {
    console.error(
      `${MANIFEST} says the kit lives in "${manifest.srcRoot}" of this project, not "${srcRel}": give that folder.`,
    );
    process.exit(2);
  }
  return manifest;
}

function noManifest(message) {
  if (isWorkspaceRoot(projectRoot)) refuseWorkspaceRoot(` without ${MANIFEST}`);
  console.error(message);
  process.exit(1);
}

// The kit files named by --take and --keep, as printed (relative to the project root) or relative to
// <src-root>.
function named(paths, known) {
  const byName = new Map();
  for (const rel of known) {
    byName.set(rel, rel);
    byName.set(shown(rel), rel);
  }
  return new Set(
    paths.map((name) => {
      const rel = byName.get(name.replace(/\\/g, "/").replace(/^\.\//, ""));
      if (!rel) usage(`"${name}" is not a file of the kit or of ${MANIFEST}.`);
      return rel;
    }),
  );
}

function decisions(known) {
  const take = named(takeArgs, known);
  const keep = named(keepArgs, known);
  for (const rel of take)
    if (keep.has(rel))
      usage(`${shown(rel)} is given to both --take and --keep.`);
  return { take, keep };
}

const sorted = (hashes) =>
  Object.fromEntries(
    Object.entries(hashes).sort(([a], [b]) => (a < b ? -1 : 1)),
  );

function writeManifest(files, starters) {
  const manifest = {
    kit: "sam-ui",
    version: kitVersion,
    srcRoot: srcRel,
    starters: sorted(starters),
    files: sorted(files),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

// note is a string, or a function of the file for a per-file note.
function print(label, rels, note = "") {
  for (const rel of rels)
    console.log(
      `${label.padEnd(9)} ${shown(rel)}${typeof note === "function" ? note(rel) : note}`,
    );
}
// Where the kit's version of a file is, for files to compare by hand.
const kitCopy = (rel) => `\n          kit: ${asset(rel)}`;

// The command line to name files on, for the messages.
const rerun = `node ${script} ${command} ${srcArg}`;

function install() {
  refuseIfNewerInstalled();
  const existing = readManifest();
  if (existing) {
    console.error(
      `Already installed (${MANIFEST}, sam-ui ${existing.version}): run update. To install from scratch, delete ${MANIFEST} first.`,
    );
    process.exit(1);
  }
  if (isWorkspaceRoot(projectRoot))
    refuseWorkspaceRoot(": the kit goes into an app");
  const all = kitFiles();
  const { take, keep } = decisions(all);
  const files = {};
  const starterHashes = {};
  const out = {
    copied: [],
    starter: [],
    ownStarter: [],
    replaced: [],
    kept: [],
    same: [],
    differs: [],
  };
  // Decide every file first: nothing is written while a file still needs a decision.
  for (const rel of all) {
    const kitHash = hashOf(asset(rel));
    const exists = fs.existsSync(target(rel));
    if (STARTERS.includes(rel)) {
      starterHashes[rel] = kitHash;
      if (!exists) out.starter.push(rel);
      else if (hashOf(target(rel)) !== kitHash)
        (take.has(rel) ? out.replaced : out.ownStarter).push(rel);
      continue;
    }
    files[rel] = kitHash;
    if (!exists) out.copied.push(rel);
    else if (hashOf(target(rel)) === kitHash) out.same.push(rel);
    else if (take.has(rel)) out.replaced.push(rel);
    else if (keep.has(rel)) out.kept.push(rel);
    else out.differs.push(rel);
  }
  if (out.differs.length) {
    print("differs", out.differs, "  (exists with other content)");
    console.log(
      `Nothing was installed: ${out.differs.length} file(s) already exist with other content. Decide each with the user and run install again with \`--take <path>\` (the kit's version replaces the project's) or \`--keep <path>\` (the project's stays, as a local change), e.g.\n  ${rerun} --keep ${shown(out.differs[0])}\nFiles from another UI kit with the same names (shadcn has button, badge, card, select, switch, tabs …) can't share a folder with this kit.`,
    );
    process.exit(1);
  }
  for (const rel of [...out.copied, ...out.starter, ...out.replaced]) copy(rel);
  writeManifest(files, starterHashes);

  print("copied", out.copied);
  print("starter", out.starter, "  (the project's own from now on)");
  print(
    "kept",
    out.ownStarter,
    "  (existed: kept as the project's starter. The kit's layout imports it, so it must export what the kit's version does)",
  );
  print("replaced", out.replaced, "  (by the kit's version)");
  print("kept", out.kept, "  (the project's version, a local change)");
  console.log(
    `sam-ui ${kitVersion} installed into ${projectRoot}: ${out.copied.length} copied, ${out.same.length} already identical, ${out.starter.length} starters, ${MANIFEST} written.`,
  );
}

function update() {
  refuseIfNewerInstalled();
  const manifest = readManifest();
  if (!manifest)
    noManifest(
      `No ${MANIFEST} in ${projectRoot}: run install first (it adopts files that already match the kit).`,
    );
  if (compareVersions(manifest.version, kitVersion) > 0) {
    console.error(
      `The project has sam-ui ${manifest.version}, newer than this plugin's ${kitVersion}; an older kit would revert its files. Update the plugin first (in Claude Code: /plugin marketplace update sam-plugins, then /reload-plugins; in Codex: codex plugin add sam-ui@sam-plugins, then a new session; in Gemini CLI: gemini skills install https://github.com/sanghoooo/sam-ui.git --path plugins/sam-ui/skills/sam-ui-kit, then /skills reload), then run update with the new version's kit.mjs.`,
    );
    process.exit(1);
  }
  const all = kitFiles();
  const old = manifest.files ?? {};
  // sam-ui 0.2.0 listed the starters without hashes: with no base to go by, a starter that differs from
  // the kit's is reported once.
  const oldStarters = Array.isArray(manifest.starters)
    ? {}
    : (manifest.starters ?? {});
  const oldStarterNames = Array.isArray(manifest.starters)
    ? manifest.starters
    : Object.keys(oldStarters);
  const { take, keep } = decisions([...new Set([...all, ...Object.keys(old)])]);
  const files = {};
  const starterHashes = {};
  const out = {
    added: [],
    updated: [],
    replaced: [],
    removed: [],
    kept: [],
    own: [],
    starter: [],
    compare: [],
    unused: [],
    local: [],
    merge: [],
    differs: [],
    left: [],
  };

  for (const rel of all) {
    const kitHash = hashOf(asset(rel));
    const file = target(rel);
    if (STARTERS.includes(rel)) {
      starterHashes[rel] = kitHash;
      if (!fs.existsSync(file)) {
        copy(rel);
        out.starter.push(rel);
      } else if (hashOf(file) !== kitHash) {
        if (take.has(rel)) {
          copy(rel);
          out.replaced.push(rel);
        } else if (!matches(asset(rel), oldStarters[rel]))
          out.compare.push(rel);
      }
      continue;
    }
    if (!fs.existsSync(file)) {
      copy(rel);
      files[rel] = kitHash;
      out.added.push(rel);
      continue;
    }
    if (hashOf(file) === kitHash) {
      files[rel] = kitHash;
      continue;
    }
    const base = old[rel];
    if (base === undefined) {
      // New in the kit, but the project has a file of its own there: only an explicit decision touches it.
      if (take.has(rel)) {
        copy(rel);
        files[rel] = kitHash;
        out.replaced.push(rel);
      } else if (keep.has(rel)) {
        files[rel] = kitHash;
        out.kept.push(rel);
      } else out.differs.push(rel);
    } else if (keep.has(rel)) {
      // A named --keep wins, --force included.
      files[rel] = kitHash;
      out.kept.push(rel);
    } else if (matches(file, base)) {
      copy(rel);
      files[rel] = kitHash;
      out.updated.push(rel);
    } else if (take.has(rel) || force) {
      copy(rel);
      files[rel] = kitHash;
      out.replaced.push(rel);
    } else if (matches(asset(rel), base)) {
      files[rel] = kitHash;
      out.local.push(rel);
    } else {
      // Stays on the kit version it was based on, so every update lists it until it is merged.
      files[rel] = base;
      out.merge.push(rel);
    }
  }

  for (const [rel, base] of Object.entries(old)) {
    if (all.includes(rel) || STARTERS.includes(rel)) continue;
    const file = target(rel);
    if (!fs.existsSync(file)) continue;
    if (keep.has(rel)) out.own.push(rel);
    else if (matches(file, base) || take.has(rel) || force) {
      fs.rmSync(file);
      out.removed.push(rel);
    } else {
      files[rel] = base;
      out.left.push(rel);
    }
  }
  // A starter the kit dropped stays the project's, but the kit's files no longer import it.
  for (const rel of oldStarterNames)
    if (!STARTERS.includes(rel) && fs.existsSync(target(rel)))
      out.unused.push(rel);
  writeManifest(files, starterHashes);

  print("added", out.added);
  print("updated", out.updated);
  print("replaced", out.replaced, "  (by the kit's version)");
  print("removed", out.removed, "  (dropped from the kit)");
  print("kept", out.kept, "  (the project's version, on top of this kit)");
  print("kept", out.own, "  (dropped from the kit; the project's own now)");
  print("starter", out.starter, "  (new; the project's own from now on)");
  print(
    "compare",
    out.compare,
    (rel) =>
      `  (a starter the kit changed: the project's is kept)${kitCopy(rel)}`,
  );
  print(
    "unused",
    out.unused,
    "  (a starter the kit dropped: the project's copy is left as it is)",
  );
  print(
    "local",
    out.local,
    "  (changed here; the kit's version did not change)",
  );
  print(
    "merge",
    out.merge,
    (rel) => `  (changed here and in the kit: left as it is)${kitCopy(rel)}`,
  );
  print(
    "differs",
    out.differs,
    (rel) =>
      `  (new in the kit, but the project has its own file there)${kitCopy(rel)}`,
  );
  print("left", out.left, "  (dropped from the kit, but changed here)");
  console.log(
    `sam-ui ${manifest.version} -> ${kitVersion}: ${out.added.length} added, ${out.updated.length} updated, ${out.removed.length} removed.`,
  );
  if (out.compare.length)
    console.log(
      `compare: starters stay the project's own. Show the user what the kit changed (its version is under "kit:") and bring over what they want. Each is reported once, on the update that brings the kit's change.`,
    );
  if (out.unused.length)
    console.log(
      `unused: the kit's files no longer import these starters. Tell the user: delete the file, or keep it if the project's own files still use it. Each is reported once.`,
    );
  if (out.merge.length)
    console.log(
      `merge: bring the kit's change (its version is under "kit:") into the project's file, then record it with\n  ${rerun} --keep <path>\nor, if the user agrees to drop the project's change, \`${rerun} --take <path>\`. Every update lists it until then.`,
    );
  if (out.differs.length)
    console.log(
      `differs: ask the user. Rename the project's file and update again to add the kit's, \`--take <path>\` to replace it with the kit's, or \`--keep <path>\` to keep it as a local change of the kit's file.`,
    );
  if (out.left.length)
    console.log(
      `left: \`--keep <path>\` keeps it as the project's own file, \`--take <path>\` deletes it. Every update lists it until then.`,
    );
  if (out.merge.length || out.differs.length || out.left.length)
    process.exit(1);
}

function check() {
  const manifest = readManifest();
  if (!manifest)
    noManifest(
      `No ${MANIFEST} in ${projectRoot}: the kit is not installed here.`,
    );
  const order = compareVersions(manifest.version, kitVersion);
  const all = new Set(kitFiles());
  const tracked = manifest.files ?? {};
  const out = { changed: [], merge: [], left: [], differs: [], missing: [] };
  for (const [rel, base] of Object.entries(tracked)) {
    const file = target(rel);
    // With the plugin's own version, check sees what update would do with each file.
    const sameKit = order === 0;
    if (!fs.existsSync(file)) {
      if (!sameKit || all.has(rel)) out.missing.push(rel);
    } else if (matches(file, base)) continue;
    else if (sameKit && !all.has(rel)) out.left.push(rel);
    else if (sameKit && hashOf(file) === hashOf(asset(rel))) continue;
    else if (sameKit && !matches(asset(rel), base)) out.merge.push(rel);
    else out.changed.push(rel);
  }
  if (order === 0)
    for (const rel of all) {
      if (STARTERS.includes(rel) || rel in tracked) continue;
      if (!fs.existsSync(target(rel))) out.missing.push(rel);
      else if (hashOf(target(rel)) !== hashOf(asset(rel)))
        out.differs.push(rel);
    }
  print("changed", out.changed, "  (differs from the kit)");
  print("merge", out.merge, "  (the kit changed it too: update lists it)");
  print(
    "left",
    out.left,
    "  (dropped from the kit, changed here: update lists it)",
  );
  print(
    "differs",
    out.differs,
    "  (new in the kit, but the project has its own file there: update lists it)",
  );
  print("missing", out.missing);
  if (order < 0)
    console.log(
      `The project has sam-ui ${manifest.version}; this plugin carries ${kitVersion}: run update to bring it in.`,
    );
  if (order > 0)
    console.log(
      `The project has sam-ui ${manifest.version}, newer than this plugin's ${kitVersion}: update the plugin before running update.`,
    );
  const newer = newerInstalled();
  if (newer)
    console.log(
      `${newer.agent} has sam-ui ${newer.version} installed: ${newer.script}`,
    );
  const count = Object.values(out).reduce((sum, rels) => sum + rels.length, 0);
  if (count) {
    console.log(
      `${count} kit file(s) differ from sam-ui ${manifest.version}. Make kit changes in the sam-ui repository instead, or keep them as deliberate local changes.`,
    );
    process.exit(1);
  }
  console.log(`The project's kit files match sam-ui ${manifest.version}.`);
}

({ install, update, check })[command]();
