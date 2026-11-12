// Checks the folder the plugin directory scans, plugins/sam-ui. The scan has to confirm that it read every file
// whole, or the version isn't published ("not fully checked"), so a text file keeps its lines short and carries
// no base64 data (an image embedded in an SVG did both). Images and fonts pass without being read as code.
// Run with `pnpm test`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN = fileURLToPath(new URL("../plugins/sam-ui", import.meta.url));
const BINARY = /\.(png|jpe?g|gif|webp|woff2?|ttf|otf)$/i;
const MAX_LINE = 1000;

const problems = [];
let checked = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const rel = path.relative(PLUGIN, file);
    if (entry.name === ".DS_Store") continue;
    if (entry.isSymbolicLink())
      problems.push(`${rel} is a symlink; the directory takes regular files`);
    else if (entry.isDirectory()) walk(file);
    else if (!BINARY.test(entry.name)) {
      checked++;
      const text = fs.readFileSync(file, "utf8");
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

for (const problem of problems) console.log(`  FAIL: ${problem}`);
console.log(`plugin: ${checked} text files checked, ${problems.length} failed`);
process.exit(problems.length ? 1 : 0);
