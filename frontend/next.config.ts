import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // npm-workspaces monorepo: node_modules are hoisted to the repo root, one
  // level above this app. Pin the output-file-tracing root to the repo root so
  // `next build` traces hoisted deps deterministically (verified option name
  // against node_modules/next/dist/docs/.../next-config-js/output.md).
  outputFileTracingRoot: path.join(__dirname, ".."),

  // Amplify Hosting packages the standard `.next` output with its own managed
  // SSR compute (baseDirectory: frontend/.next) — it does NOT use a standalone
  // server bundle, and shipping one can confuse its detection. The self-hosted
  // Docker image (rollback path) still needs `server.js`, so opt in there via
  // BUILD_STANDALONE=true. Amplify builds leave this unset → managed output.
  ...(process.env.BUILD_STANDALONE === "true"
    ? { output: "standalone" as const }
    : {}),

  // jlps.kalacube.com → the JLPS Winter Craft Market page (served from /jlps).
  // beforeFiles so the subdomain root wins over the main homepage route.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: 'jlps.kalacube.com' }],
          destination: '/jlps',
        },
        {
          source: '/join',
          has: [{ type: 'host', value: 'jlps.kalacube.com' }],
          destination: '/jlps/join',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
