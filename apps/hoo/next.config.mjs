import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The kit's sources sit outside this app (packages/sam-ui-engine/assets); rooting Turbopack and
  // tracing at the repo root lets it compile them.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  // GitHub Pages (.github/workflows/pages.yml) serves the site as static files under the repository's path,
  // which the workflow passes as NEXT_PUBLIC_BASE_PATH.
  ...(process.env.PAGES === "1" && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  }),
};

export default nextConfig;
