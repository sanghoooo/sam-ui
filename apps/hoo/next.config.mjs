import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The kit's sources sit outside this app (plugins/sam-ui-kit/skills/ui-kit/assets); rooting Turbopack and
  // tracing at the repo root lets it compile them.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
};

export default nextConfig;
