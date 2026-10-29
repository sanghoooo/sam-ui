// Scenario tests for plugins/sam-ui-kit/skills/ui-kit/scripts/kit.mjs (install, update, check) against fake
// kit versions and fake projects in a temp folder. Run with `pnpm test`.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = fileURLToPath(
  new URL("../plugins/sam-ui-kit/skills/ui-kit/scripts/kit.mjs", import.meta.url),
);
const root = fs.mkdtempSync(
  path.join(process.env.TMPDIR || os.tmpdir(), "kit-test-"),
);
// An empty Claude Code config folder: kit.mjs looks there for a newer installed sam-ui-kit.
const config = path.join(root, "claude-config");
fs.mkdirSync(config);
let failures = 0;
let passes = 0;

function ok(cond, msg) {
  if (cond) passes++;
  else {
    failures++;
    console.log(`  FAIL: ${msg}`);
  }
}
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);
const hash = (s) => createHash("sha256").update(s).digest("hex");
const manifestOf = (dir) => JSON.parse(read(`${dir}/sam-ui.json`));

function plugin(name, version, files) {
  const dir = path.join(root, name);
  fs.mkdirSync(path.join(dir, ".claude-plugin"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, ".claude-plugin/plugin.json"),
    JSON.stringify({ name: "sam-ui-kit", version }),
  );
  const skill = path.join(dir, "skills/ui-kit");
  fs.mkdirSync(path.join(skill, "scripts"), { recursive: true });
  fs.copyFileSync(KIT, path.join(skill, "scripts/kit.mjs"));
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(skill, "assets", rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
  }
  return path.join(skill, "scripts/kit.mjs");
}

function project(name, { src = false } = {}) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), "{}");
  if (src) fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  return dir;
}

function run(kit, ...args) {
  const r = spawnSync(process.execPath, [kit, ...args], {
    encoding: "utf8",
    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

const v1 = plugin("kit-v1", "0.1.0", {
  "components/ui/a.tsx": "a1",
  "components/ui/b.tsx": "b1",
  "components/ui/c.tsx": "c1",
  "components/ui/d.tsx": "d1",
  "lib/nav.ts": "nav1",
  "lib/utils.ts": "u1",
  "public/images/x.svg": "x1",
  "styles/ui-kit.css": "css1",
});
const v2 = plugin("kit-v2", "0.2.0", {
  "components/ui/a.tsx": "a2",
  "components/ui/b.tsx": "b2",
  "components/ui/e.tsx": "e1",
  "lib/nav.ts": "nav2",
  "lib/utils.ts": "u1",
  "lib/theme.ts": "t1",
  "public/images/x.svg": "x2",
  "styles/ui-kit.css": "css1",
});

console.log("1. install into an empty project");
const p = project("app");
let r = run(v1, "install", p);
ok(r.code === 0, `install exit 0, got ${r.code}\n${r.out}`);
ok(read(`${p}/components/ui/a.tsx`) === "a1", "a copied");
ok(read(`${p}/public/images/x.svg`) === "x1", "public file at project root");
ok(read(`${p}/lib/nav.ts`) === "nav1", "starter copied");
let m = manifestOf(p);
ok(m.version === "0.1.0" && m.srcRoot === ".", "manifest version/srcRoot");
ok(!("lib/nav.ts" in m.files), "starter not tracked as a kit file");
ok(m.starters["lib/nav.ts"] === hash("nav1"), "the kit's starter hashed");
ok(m.files["components/ui/a.tsx"] === hash("a1"), "manifest hash of a");

console.log("2. check right after install");
r = run(v1, "check", p);
ok(r.code === 0 && /match sam-ui-kit 0.1.0/.test(r.out), `check clean\n${r.out}`);

console.log("3. local edits are reported by check");
fs.writeFileSync(`${p}/components/ui/b.tsx`, "b1-edited");
fs.writeFileSync(`${p}/components/ui/d.tsx`, "d1-edited");
fs.writeFileSync(`${p}/lib/utils.ts`, "u1-edited");
fs.writeFileSync(`${p}/lib/nav.ts`, "nav-mine");
r = run(v1, "check", p);
ok(r.code === 1, `check exit 1 on edits, got ${r.code}`);
ok(
  /changed\s+components\/ui\/b\.tsx/.test(r.out) &&
    /changed\s+lib\/utils\.ts/.test(r.out),
  `check lists b and utils\n${r.out}`,
);
ok(!/nav\.ts/.test(r.out), "check ignores the starter nav.ts");

console.log("4. update to 0.2.0");
r = run(v2, "update", p);
ok(r.code === 1, `update exit 1 because of a merge, got ${r.code}\n${r.out}`);
ok(read(`${p}/components/ui/a.tsx`) === "a2", "unchanged a updated");
ok(read(`${p}/components/ui/b.tsx`) === "b1-edited", "edited b kept");
ok(/merge\s+components\/ui\/b\.tsx/.test(r.out), "b reported as merge");
ok(read(`${p}/components/ui/c.tsx`) === null, "unchanged dropped c removed");
ok(
  read(`${p}/components/ui/d.tsx`) === "d1-edited" &&
    /left\s+components\/ui\/d\.tsx/.test(r.out),
  "edited dropped d left and reported",
);
ok(
  read(`${p}/components/ui/e.tsx`) === "e1" &&
    read(`${p}/lib/theme.ts`) === "t1",
  "new files added",
);
ok(read(`${p}/lib/nav.ts`) === "nav-mine", "starter untouched");
ok(
  /compare\s+lib\/nav\.ts\s+\(a starter the kit changed/.test(r.out),
  `a starter the kit changed reported as compare\n${r.out}`,
);
ok(
  read(`${p}/lib/utils.ts`) === "u1-edited" &&
    /local\s+lib\/utils\.ts/.test(r.out),
  "local-only edit kept as local",
);
ok(read(`${p}/public/images/x.svg`) === "x2", "public file updated");
m = manifestOf(p);
ok(m.version === "0.2.0", "manifest version bumped");
ok(!("components/ui/c.tsx" in m.files), "removed file gone from manifest");
ok(
  m.files["components/ui/d.tsx"] === hash("d1"),
  "left file stays tracked until decided",
);
ok(
  m.files["components/ui/b.tsx"] === hash("b1"),
  "merge file stays on the kit version it is based on",
);

console.log("5. check lists what the update left to do");
r = run(v2, "check", p);
ok(
  r.code === 1 &&
    /merge\s+components\/ui\/b\.tsx/.test(r.out) &&
    /changed\s+lib\/utils\.ts/.test(r.out) &&
    /left\s+components\/ui\/d\.tsx/.test(r.out),
  `check after update\n${r.out}`,
);

console.log("6. a re-run lists the merge and the left file again");
r = run(v2, "update", p);
ok(
  r.code === 1 &&
    /merge\s+components\/ui\/b\.tsx/.test(r.out) &&
    /left\s+components\/ui\/d\.tsx/.test(r.out) &&
    /local\s+lib\/utils\.ts/.test(r.out) &&
    !/compare/.test(r.out),
  `pending decisions listed again, starters once\n${r.out}`,
);

console.log("7. --keep records a merge and keeps a dropped file");
fs.writeFileSync(`${p}/components/ui/b.tsx`, "b2-merged");
r = run(
  v2,
  "update",
  p,
  "--keep",
  "components/ui/b.tsx",
  "--keep=components/ui/d.tsx",
);
ok(r.code === 0, `keep exit 0, got ${r.code}\n${r.out}`);
ok(
  /kept\s+components\/ui\/b\.tsx/.test(r.out) &&
    /kept\s+components\/ui\/d\.tsx\s+\(dropped/.test(r.out),
  `kept reported\n${r.out}`,
);
m = manifestOf(p);
ok(
  m.files["components/ui/b.tsx"] === hash("b2") &&
    !("components/ui/d.tsx" in m.files),
  "merged b based on the kit's b; d the project's own",
);
ok(
  read(`${p}/components/ui/b.tsx`) === "b2-merged" &&
    read(`${p}/components/ui/d.tsx`) === "d1-edited",
  "kept files untouched",
);
r = run(v2, "update", p);
ok(
  r.code === 0 &&
    /local\s+components\/ui\/b\.tsx/.test(r.out) &&
    !/d\.tsx/.test(r.out),
  `decisions stick\n${r.out}`,
);

console.log("8. --take replaces one file and leaves the other local changes");
r = run(v2, "update", p, "--take", "lib/utils.ts");
ok(
  r.code === 0 &&
    /replaced\s+lib\/utils\.ts/.test(r.out) &&
    read(`${p}/lib/utils.ts`) === "u1" &&
    read(`${p}/components/ui/b.tsx`) === "b2-merged",
  `take one file\n${r.out}`,
);

console.log("9. update --force takes the kit's version of every changed file");
fs.writeFileSync(`${p}/lib/utils.ts`, "u1-edited-again");
r = run(v2, "update", "--force", p);
ok(r.code === 0, `forced update exit 0, got ${r.code}\n${r.out}`);
ok(
  read(`${p}/components/ui/b.tsx`) === "b2" &&
    read(`${p}/lib/utils.ts`) === "u1",
  "forced overwrite",
);
ok(
  read(`${p}/lib/nav.ts`) === "nav-mine" &&
    read(`${p}/components/ui/d.tsx`) === "d1-edited",
  "force keeps starters and the project's own files",
);
r = run(v2, "check", p);
ok(r.code === 0, `clean after force\n${r.out}`);

console.log("10. install twice");
r = run(v2, "install", p);
ok(r.code === 1 && /Already installed/.test(r.out), "second install refused");
r = run(v2, "install", p, "--force");
ok(
  r.code === 2 && /install has no --force/.test(r.out),
  `install --force refused\n${r.out}`,
);

console.log("11. adopting files that already match (no manifest)");
const q = project("adopt");
for (const rel of [
  "components/ui/a.tsx",
  "components/ui/b.tsx",
  "components/ui/c.tsx",
  "components/ui/d.tsx",
  "lib/utils.ts",
  "styles/ui-kit.css",
  "public/images/x.svg",
  "lib/nav.ts",
]) {
  const src = path.join(path.dirname(v1), "../assets", rel);
  const dst = path.join(q, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
fs.writeFileSync(`${q}/lib/nav.ts`, "nav-project");
r = run(v1, "install", q);
ok(
  r.code === 0 && /0 copied, 7 already identical, 0 starters/.test(r.out),
  `adopt all\n${r.out}`,
);
ok(read(`${q}/lib/nav.ts`) === "nav-project", "existing starter kept on adopt");

console.log("12. install writes nothing while a file differs");
const s = project("adopt-diff");
fs.mkdirSync(`${s}/components/ui`, { recursive: true });
fs.writeFileSync(`${s}/components/ui/a.tsx`, "a-mine");
r = run(v1, "install", s);
ok(
  r.code === 1 &&
    /differs\s+components\/ui\/a\.tsx/.test(r.out) &&
    /Nothing was installed/.test(r.out),
  `differs reported\n${r.out}`,
);
ok(
  !fs.existsSync(`${s}/sam-ui.json`) &&
    !fs.existsSync(`${s}/components/ui/b.tsx`) &&
    !fs.existsSync(`${s}/lib/nav.ts`) &&
    read(`${s}/components/ui/a.tsx`) === "a-mine",
  "nothing written",
);
r = run(v1, "install", s, "--keep", "components/ui/a.tsx");
ok(
  r.code === 0 &&
    /kept\s+components\/ui\/a\.tsx/.test(r.out) &&
    read(`${s}/components/ui/a.tsx`) === "a-mine" &&
    read(`${s}/components/ui/b.tsx`) === "b1",
  `install --keep\n${r.out}`,
);
r = run(v1, "check", s);
ok(
  r.code === 1 && /changed\s+components\/ui\/a\.tsx/.test(r.out),
  "check flags the kept file",
);
const s2 = project("take-diff");
fs.mkdirSync(`${s2}/components/ui`, { recursive: true });
fs.writeFileSync(`${s2}/components/ui/a.tsx`, "a-mine");
r = run(v1, "install", s2, "--take", "components/ui/a.tsx");
ok(
  r.code === 0 &&
    /replaced\s+components\/ui\/a\.tsx/.test(r.out) &&
    read(`${s2}/components/ui/a.tsx`) === "a1",
  `install --take\n${r.out}`,
);

console.log("13. src/ layout");
const t = project("srcapp", { src: true });
r = run(v1, "install", `${t}/src`);
ok(r.code === 0, `src install\n${r.out}`);
ok(
  read(`${t}/src/components/ui/a.tsx`) === "a1" &&
    read(`${t}/public/images/x.svg`) === "x1",
  "src files in src/, public at root",
);
ok(manifestOf(t).srcRoot === "src", "srcRoot recorded as src");
r = run(v2, "update", t);
ok(
  r.code === 2 && /says the kit lives in "src"/.test(r.out),
  `wrong src-root refused by update\n${r.out}`,
);
r = run(v2, "check", t);
ok(
  r.code === 2 && /says the kit lives in "src"/.test(r.out),
  `wrong src-root refused by check\n${r.out}`,
);
r = run(v2, "update", `${t}/src`);
ok(
  r.code === 0 && read(`${t}/src/components/ui/a.tsx`) === "a2",
  `src update\n${r.out}`,
);
fs.writeFileSync(`${t}/src/components/ui/b.tsx`, "b-mine");
r = run(v2, "update", `${t}/src`, "--take", "src/components/ui/b.tsx");
ok(
  r.code === 0 && read(`${t}/src/components/ui/b.tsx`) === "b2",
  `--take with the printed path\n${r.out}`,
);

console.log("14. bad usage");
r = run(v1, "install", root);
ok(r.code === 2 && /No package.json/.test(r.out), "no package.json refused");
r = run(v1, "frobnicate", p);
ok(r.code === 2 && /usage/.test(r.out), "unknown command refused");
const before = read(`${p}/sam-ui.json`);
r = run(v2, "update", p, "--dry-run");
ok(
  r.code === 2 &&
    /Unknown option --dry-run/.test(r.out) &&
    read(`${p}/sam-ui.json`) === before,
  "unknown option refused before any change",
);
r = run(v2, "update", p, `${t}/src`);
ok(r.code === 2 && /One <src-root> only/.test(r.out), "two src-roots refused");
r = run(v2, "update", p, "--take");
ok(r.code === 2 && /--take needs a path/.test(r.out), "--take needs a value");
r = run(v2, "update", p, "--take", "components/ui/nope.tsx");
ok(
  r.code === 2 && /is not a file of the kit/.test(r.out),
  "unknown --take path refused",
);
r = run(v2, "update", p, "--take", "lib/utils.ts", "--keep", "./lib/utils.ts");
ok(
  r.code === 2 && /both --take and --keep/.test(r.out),
  "take and keep of one file refused",
);
r = run(v2, "check", p, "--force");
ok(r.code === 2, "check takes no options");

console.log("15. check notices a newer plugin");
const u = project("old");
run(v1, "install", u);
r = run(v2, "check", u);
ok(/this plugin carries 0.2.0/.test(r.out), `newer plugin noticed\n${r.out}`);

console.log("16. update reports the starters the kit changed, once");
const w = project("starters");
run(v1, "install", w);
r = run(v2, "update", w);
ok(r.code === 0, `starter notices alone exit 0, got ${r.code}\n${r.out}`);
ok(
  /compare\s+lib\/nav\.ts/.test(r.out) && read(`${w}/lib/nav.ts`) === "nav1",
  `unchanged starter reported, not replaced\n${r.out}`,
);
ok(
  manifestOf(w).starters["lib/nav.ts"] === hash("nav2"),
  "manifest records the kit's new starter",
);
r = run(v2, "update", w);
ok(r.code === 0 && !/compare/.test(r.out), `reported once\n${r.out}`);
const w2 = project("starters-same");
run(v1, "install", w2);
fs.writeFileSync(`${w2}/lib/nav.ts`, "nav2");
r = run(v2, "update", w2);
ok(
  !/compare/.test(r.out),
  `a starter already like the kit's new one is not reported\n${r.out}`,
);

console.log("17. a 0.2.0 manifest, which listed the starters without hashes");
const k020 = plugin("kit-020", "0.2.0", {
  "lib/nav.ts": "nav-020",
  "components/ui/a.tsx": "a1",
});
const k021 = plugin("kit-021", "0.2.1", {
  "lib/nav.ts": "nav-020",
  "components/ui/a.tsx": "a2",
});
const k022 = plugin("kit-022", "0.2.2", {
  "lib/nav.ts": "nav-022",
  "components/ui/a.tsx": "a2",
});
// 0.2.0 also listed components/layout/brand.tsx, a starter the kit has since dropped.
const legacy = (name, nav) => {
  const dir = project(name);
  run(k020, "install", dir);
  if (nav) fs.writeFileSync(`${dir}/lib/nav.ts`, nav);
  fs.mkdirSync(`${dir}/components/layout`, { recursive: true });
  fs.writeFileSync(`${dir}/components/layout/brand.tsx`, "brand-mine");
  const manifest = manifestOf(dir);
  manifest.starters = ["components/layout/brand.tsx", "lib/nav.ts"];
  fs.writeFileSync(`${dir}/sam-ui.json`, JSON.stringify(manifest));
  return dir;
};
const x = legacy("legacy", "export const NAV = [];\n");
r = run(k021, "update", x);
ok(
  r.code === 0 && /compare\s+lib\/nav\.ts/.test(r.out),
  `with no base, a starter that differs from the kit's is reported\n${r.out}`,
);
ok(
  /unused\s+components\/layout\/brand\.tsx/.test(r.out) &&
    read(`${x}/components/layout/brand.tsx`) === "brand-mine",
  `the dropped starter is reported unused and left alone\n${r.out}`,
);
ok(
  !Array.isArray(manifestOf(x).starters) &&
    !("components/layout/brand.tsx" in manifestOf(x).starters),
  "manifest rewritten with hashes, without the dropped starter",
);
r = run(k021, "update", x);
ok(
  !/compare/.test(r.out) && !/unused/.test(r.out),
  `then neither is reported again\n${r.out}`,
);
r = run(k022, "update", x);
ok(
  /compare\s+lib\/nav\.ts/.test(r.out),
  `the starter the kit changed is reported\n${r.out}`,
);
const x0 = legacy("legacy-untouched");
r = run(k021, "update", x0);
ok(!/compare/.test(r.out), `an untouched starter is not reported\n${r.out}`);

console.log("18. an older plugin never downgrades the project");
const y = project("downgrade");
run(v2, "install", y);
r = run(v1, "update", y);
ok(
  r.code === 1 &&
    /newer than this plugin's 0.1.0/.test(r.out) &&
    read(`${y}/components/ui/a.tsx`) === "a2" &&
    manifestOf(y).version === "0.2.0",
  `downgrade refused\n${r.out}`,
);
r = run(v1, "check", y);
ok(
  /update the plugin before running update/.test(r.out) &&
    !/run update to bring it in/.test(r.out),
  `check says to update the plugin\n${r.out}`,
);

console.log("19. line endings");
const e1 = plugin("kit-eol-1", "1.0.0", {
  "components/ui/t.tsx": "one\ntwo\n",
  "public/images/i.svg": "<svg>\r\n</svg>\r\n",
  "public/images/b.ico": "\0\r\n",
});
const e2 = plugin("kit-eol-2", "1.0.1", {
  "components/ui/t.tsx": "one\ntwo\nthree\n",
  "public/images/i.svg": "<svg>\r\n</svg>\r\n",
  "public/images/b.ico": "\0\r\n",
});
const z = project("eol");
run(e1, "install", z);
fs.writeFileSync(`${z}/components/ui/t.tsx`, "one\r\ntwo\r\n");
fs.writeFileSync(`${z}/public/images/i.svg`, "<svg>\n</svg>\n");
r = run(e1, "check", z);
ok(r.code === 0, `CRLF and LF copies of a text file match\n${r.out}`);
fs.writeFileSync(`${z}/public/images/b.ico`, "\0\n");
r = run(e1, "check", z);
ok(
  r.code === 1 && /changed\s+public\/images\/b\.ico/.test(r.out),
  `binary files compare byte for byte\n${r.out}`,
);
fs.writeFileSync(`${z}/public/images/b.ico`, "\0\r\n");
r = run(e2, "update", z);
ok(
  r.code === 0 &&
    /updated\s+components\/ui\/t\.tsx/.test(r.out) &&
    read(`${z}/components/ui/t.tsx`) === "one\ntwo\nthree\n",
  `an untouched CRLF copy is updated, not merged\n${r.out}`,
);
fs.writeFileSync(`${z}/components/ui/t.tsx`, "one\r\ntwo\r\nthree\r\n");
m = manifestOf(z);
m.files["components/ui/t.tsx"] = hash("one\r\ntwo\r\nthree\r\n");
fs.writeFileSync(`${z}/sam-ui.json`, JSON.stringify(m));
r = run(e2, "check", z);
ok(r.code === 0, `a 0.2.0 byte hash still matches\n${r.out}`);

console.log("20. a new kit file where the project has its own");
const c = project("collide");
run(v1, "install", c);
fs.writeFileSync(`${c}/components/ui/e.tsx`, "my-e");
r = run(v2, "update", c, "--force");
ok(
  r.code === 1 &&
    /differs\s+components\/ui\/e\.tsx/.test(r.out) &&
    read(`${c}/components/ui/e.tsx`) === "my-e" &&
    !("components/ui/e.tsx" in manifestOf(c).files),
  `collision reported, untouched even with --force, not tracked\n${r.out}`,
);
r = run(v2, "update", c);
ok(
  r.code === 1 && /differs\s+components\/ui\/e\.tsx/.test(r.out),
  "listed again",
);
r = run(v2, "update", c, "--keep", "components/ui/e.tsx");
ok(
  r.code === 0 &&
    read(`${c}/components/ui/e.tsx`) === "my-e" &&
    manifestOf(c).files["components/ui/e.tsx"] === hash("e1"),
  `kept as a local change of the kit's file\n${r.out}`,
);

console.log("21. workspace roots");
const ws = project("monorepo");
fs.writeFileSync(
  `${ws}/package.json`,
  JSON.stringify({ workspaces: ["apps/*"] }),
);
fs.mkdirSync(`${ws}/apps/web`, { recursive: true });
fs.writeFileSync(`${ws}/apps/web/package.json`, "{}");
run(v1, "install", `${ws}/apps/web`);
r = run(v1, "update", ws);
ok(
  r.code === 2 &&
    /workspace root/.test(r.out) &&
    /installed in: \S*apps\/web/.test(r.out),
  `points at the app\n${r.out}`,
);
r = run(v1, "install", ws);
ok(
  r.code === 2 &&
    !fs.existsSync(`${ws}/sam-ui.json`) &&
    !fs.existsSync(`${ws}/components`),
  `no install into a workspace root\n${r.out}`,
);

console.log("22. a newer sam-ui-kit installed in Claude Code");
fs.mkdirSync(`${config}/plugins`);
fs.writeFileSync(
  `${config}/plugins/installed_plugins.json`,
  JSON.stringify({
    version: 2,
    plugins: {
      "sam-ui-kit@sam-ui": [
        {
          scope: "user",
          installPath: path.join(root, "kit-v2"),
          version: "0.2.0",
        },
      ],
    },
  }),
);
const o = project("stale-session");
r = run(v1, "install", o);
ok(
  r.code === 1 &&
    /Claude Code has sam-ui-kit 0.2.0 installed/.test(r.out) &&
    r.out.includes(path.join(root, "kit-v2/skills/ui-kit/scripts/kit.mjs")) &&
    !fs.existsSync(`${o}/sam-ui.json`),
  `stale script refused\n${r.out}`,
);
r = run(v2, "install", o);
ok(r.code === 0, `the newest version runs\n${r.out}`);
r = run(v1, "check", o);
ok(/Claude Code has sam-ui-kit 0.2.0 installed/.test(r.out), "check notes it too");
fs.rmSync(`${config}/plugins`, { recursive: true });

console.log("23. a sam-ui.json with git conflict markers");
const g = project("conflict");
run(v1, "install", g);
fs.writeFileSync(
  `${g}/sam-ui.json`,
  "<<<<<<< HEAD\n{}\n=======\n{}\n>>>>>>> other\n",
);
r = run(v1, "check", g);
ok(r.code === 2 && /not valid JSON/.test(r.out), `clear error\n${r.out}`);

console.log("24. pnpm-workspace.yaml: a single app's, and a monorepo's");
const singleApp = {
  "dot-and-settings": 'packages:\n  - "."\nonlyBuiltDependencies:\n  - sharp\n',
  "settings-only": "onlyBuiltDependencies:\n  - sharp\n  - unrs-resolver\n",
  "allow-builds": "allowBuilds:\n  sharp: true\n",
  "flow-dot": 'packages: ["."]\n',
};
for (const [name, yaml] of Object.entries(singleApp)) {
  const dir = project(`pnpm-${name}`, { src: true });
  fs.writeFileSync(`${dir}/pnpm-workspace.yaml`, yaml);
  r = run(v1, "install", `${dir}/src`);
  ok(
    r.code === 0 && read(`${dir}/src/components/ui/a.tsx`) === "a1",
    `a create-next-app pnpm-workspace.yaml (${name}) is not a workspace root\n${r.out}`,
  );
}
const monorepos = {
  indented: "packages:\n  - 'apps/*'\n",
  unindented: "packages:\n- apps/*\n- packages/*\n",
};
for (const [name, yaml] of Object.entries(monorepos)) {
  const dir = project(`pnpm-mono-${name}`);
  fs.writeFileSync(`${dir}/pnpm-workspace.yaml`, yaml);
  r = run(v1, "install", dir);
  ok(
    r.code === 2 &&
      /workspace root/.test(r.out) &&
      !fs.existsSync(`${dir}/sam-ui.json`),
    `a monorepo's pnpm-workspace.yaml (${name}) is refused\n${r.out}`,
  );
}

console.log("25. a named --keep wins over --force");
const fk = project("force-keep");
run(v1, "install", fk);
fs.writeFileSync(`${fk}/components/ui/a.tsx`, "a-mine");
fs.writeFileSync(`${fk}/components/ui/b.tsx`, "b-mine");
fs.writeFileSync(`${fk}/components/ui/d.tsx`, "d-mine");
fs.writeFileSync(`${fk}/lib/utils.ts`, "u-mine");
r = run(
  v2,
  "update",
  fk,
  "--force",
  "--keep",
  "components/ui/b.tsx",
  "--keep",
  "components/ui/d.tsx",
  "--keep",
  "lib/utils.ts",
);
ok(
  r.code === 0 &&
    read(`${fk}/components/ui/b.tsx`) === "b-mine" &&
    read(`${fk}/components/ui/d.tsx`) === "d-mine" &&
    read(`${fk}/lib/utils.ts`) === "u-mine" &&
    read(`${fk}/components/ui/a.tsx`) === "a2",
  `kept merge, left and local files stay; the rest is forced\n${r.out}`,
);
m = manifestOf(fk);
ok(
  m.files["components/ui/b.tsx"] === hash("b2") &&
    m.files["lib/utils.ts"] === hash("u1") &&
    !("components/ui/d.tsx" in m.files),
  "kept files recorded on this kit; the dropped one the project's own",
);

console.log("26. --keep on an unchanged file the kit drops");
const kd = project("keep-dropped");
run(v1, "install", kd);
r = run(v2, "update", kd, "--keep", "components/ui/c.tsx");
ok(
  r.code === 0 &&
    read(`${kd}/components/ui/c.tsx`) === "c1" &&
    /kept\s+components\/ui\/c\.tsx\s+\(dropped/.test(r.out) &&
    !("components/ui/c.tsx" in manifestOf(kd).files),
  `kept as the project's own\n${r.out}`,
);

console.log("27. --take on a left file, a starter and a backslash path");
const tk = project("take-more");
run(v1, "install", tk);
fs.writeFileSync(`${tk}/components/ui/d.tsx`, "d-mine");
fs.writeFileSync(`${tk}/lib/nav.ts`, "nav-mine");
fs.writeFileSync(`${tk}/components/ui/b.tsx`, "b-mine");
r = run(
  v2,
  "update",
  tk,
  "--take",
  "components/ui/d.tsx",
  "--take",
  "lib/nav.ts",
  "--take",
  "components\\ui\\b.tsx",
);
ok(
  r.code === 0 &&
    !fs.existsSync(`${tk}/components/ui/d.tsx`) &&
    /removed\s+components\/ui\/d\.tsx/.test(r.out),
  `--take deletes a left file\n${r.out}`,
);
ok(
  read(`${tk}/lib/nav.ts`) === "nav2" &&
    /replaced\s+lib\/nav\.ts/.test(r.out) &&
    !/compare\s+lib\/nav\.ts/.test(r.out),
  `--take replaces a starter on update\n${r.out}`,
);
ok(
  read(`${tk}/components/ui/b.tsx`) === "b2",
  `a backslash path names the file\n${r.out}`,
);
const withNav = (name) => {
  const dir = project(name);
  fs.mkdirSync(`${dir}/lib`, { recursive: true });
  fs.writeFileSync(`${dir}/lib/nav.ts`, "nav-mine");
  return dir;
};
const ts = withNav("take-starter");
r = run(v1, "install", ts, "--take", "lib/nav.ts");
ok(
  r.code === 0 &&
    read(`${ts}/lib/nav.ts`) === "nav1" &&
    /replaced\s+lib\/nav\.ts/.test(r.out),
  `--take replaces a starter on install\n${r.out}`,
);
const ks = withNav("keep-starter");
r = run(v1, "install", ks);
ok(
  r.code === 0 &&
    read(`${ks}/lib/nav.ts`) === "nav-mine" &&
    /kept\s+lib\/nav\.ts\s+\(existed/.test(r.out),
  `an existing starter is kept and reported\n${r.out}`,
);

console.log("28. a deleted kit file is put back");
const pb = project("put-back");
run(v1, "install", pb);
fs.rmSync(`${pb}/components/ui/a.tsx`);
r = run(v1, "check", pb);
ok(
  r.code === 1 && /missing\s+components\/ui\/a\.tsx/.test(r.out),
  `check reports it missing\n${r.out}`,
);
r = run(v1, "update", pb);
ok(
  r.code === 0 &&
    /added\s+components\/ui\/a\.tsx/.test(r.out) &&
    read(`${pb}/components/ui/a.tsx`) === "a1",
  `update puts it back\n${r.out}`,
);

console.log(
  "29. check after a differs, a merge done by hand and a left file deleted",
);
const cp = project("check-pending");
run(v1, "install", cp);
fs.writeFileSync(`${cp}/components/ui/e.tsx`, "my-e");
fs.writeFileSync(`${cp}/components/ui/b.tsx`, "b-mine");
fs.writeFileSync(`${cp}/components/ui/d.tsx`, "d-mine");
run(v2, "update", cp);
r = run(v2, "check", cp);
ok(
  r.code === 1 &&
    /differs\s+components\/ui\/e\.tsx/.test(r.out) &&
    /merge\s+components\/ui\/b\.tsx/.test(r.out) &&
    /left\s+components\/ui\/d\.tsx/.test(r.out),
  `check lists differs, merge and left\n${r.out}`,
);
fs.writeFileSync(`${cp}/components/ui/b.tsx`, "b2");
fs.rmSync(`${cp}/components/ui/d.tsx`);
r = run(v2, "check", cp);
ok(
  r.code === 1 &&
    /differs\s+components\/ui\/e\.tsx/.test(r.out) &&
    !/b\.tsx/.test(r.out) &&
    !/d\.tsx/.test(r.out),
  `a merge done by hand and a deleted dropped file are not reported\n${r.out}`,
);

console.log("30. 0.2.0 byte hashes of CRLF checkouts");
const e3 = plugin("kit-eol-3", "1.0.2", {
  "components/ui/t.tsx": "one\ntwo\n",
  "public/images/i.svg": "<svg>\r\n</svg>\r\n",
  "public/images/b.ico": "\0\r\n",
});
const cr = project("eol-crlf-base");
run(e1, "install", cr);
m = manifestOf(cr);
m.files["components/ui/t.tsx"] = hash("one\r\ntwo\r\n");
fs.writeFileSync(`${cr}/sam-ui.json`, JSON.stringify(m));
r = run(e1, "check", cr);
ok(r.code === 0, `an LF copy matches a CRLF byte hash\n${r.out}`);
fs.writeFileSync(`${cr}/components/ui/t.tsx`, "one\r\ntwo\r\nmine\r\n");
r = run(e3, "update", cr);
ok(
  r.code === 0 &&
    /local\s+components\/ui\/t\.tsx/.test(r.out) &&
    !/merge/.test(r.out),
  `an edit on a CRLF base the kit did not change is local, not merge\n${r.out}`,
);

console.log("31. which installed sam-ui-kit counts for this project");
fs.mkdirSync(`${config}/plugins`);
const installed = (entry) =>
  fs.writeFileSync(
    `${config}/plugins/installed_plugins.json`,
    JSON.stringify({
      version: 2,
      plugins: {
        "sam-ui-kit@sam-ui": [
          {
            installPath: path.join(root, "kit-v2"),
            version: "0.2.0",
            ...entry,
          },
        ],
      },
    }),
  );
const sc = project("scope");
installed({ scope: "project", projectPath: path.join(root, "elsewhere") });
r = run(v1, "install", sc);
ok(r.code === 0, `another project's install is ignored\n${r.out}`);
installed({ scope: "local", projectPath: root });
r = run(v1, "update", sc, "--keep", "components/ui/a.tsx");
const lastLine = r.out.trim().split("\n").pop().trim();
ok(
  r.code === 1 &&
    /Claude Code has sam-ui-kit 0.2.0 installed/.test(r.out) &&
    lastLine ===
      `node ${path.join(root, "kit-v2/skills/ui-kit/scripts/kit.mjs")} update ${sc}`,
  `an ancestor folder's install counts; the command to run has no --keep\n${r.out}`,
);
installed({ scope: "user", version: "0.0.1" });
r = run(v1, "update", sc);
ok(r.code === 0, `an older install does not refuse\n${r.out}`);
// The plugin was sam-ui@sam-plugins up to 0.3.5; that name stopped there, so it never counts.
fs.writeFileSync(
  `${config}/plugins/installed_plugins.json`,
  JSON.stringify({
    version: 2,
    plugins: {
      "sam-ui@sam-plugins": [
        {
          scope: "user",
          installPath: path.join(root, "kit-v2"),
          version: "0.2.0",
        },
      ],
    },
  }),
);
r = run(v1, "update", sc);
ok(
  r.code === 0 && !/Claude Code has/.test(r.out),
  `the old plugin name is not counted\n${r.out}`,
);
fs.rmSync(`${config}/plugins`, { recursive: true });

console.log("32. a starter the kit dropped, in a hashed manifest");
const ud = project("unused-starter");
run(v1, "install", ud);
fs.mkdirSync(`${ud}/components/layout`, { recursive: true });
fs.writeFileSync(`${ud}/components/layout/brand.tsx`, "brand1");
m = manifestOf(ud);
m.starters["components/layout/brand.tsx"] = hash("brand1");
fs.writeFileSync(`${ud}/sam-ui.json`, JSON.stringify(m));
r = run(v2, "update", ud);
ok(
  r.code === 0 &&
    /unused\s+components\/layout\/brand\.tsx/.test(r.out) &&
    read(`${ud}/components/layout/brand.tsx`) === "brand1",
  `reported unused, even untouched, and left alone\n${r.out}`,
);
r = run(v2, "update", ud);
ok(!/unused/.test(r.out), `reported once\n${r.out}`);
const ug = project("unused-gone");
run(v1, "install", ug);
m = manifestOf(ug);
m.starters["components/layout/brand.tsx"] = hash("brand1");
fs.writeFileSync(`${ug}/sam-ui.json`, JSON.stringify(m));
r = run(v2, "update", ug);
ok(!/unused/.test(r.out), `not reported when the file is gone\n${r.out}`);

fs.rmSync(root, { recursive: true, force: true });
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
