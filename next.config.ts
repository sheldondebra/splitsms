import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NO_STORE_HEADERS } from "@/lib/cache/no-store";
import { CLICKJACK_HEADERS, CLICKJACK_PATHS, SECURITY_HEADERS } from "@/lib/security/http-headers";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const docPaths = ["/api-docs", "/api-docs/:path*", "/docs", "/docs/:path*", "/changelog"];

const staticAssetCache = [
  { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  turbopack: {
    root: projectRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      ...CLICKJACK_PATHS.map((source) => ({
        source,
        headers: CLICKJACK_HEADERS,
      })),
      ...docPaths.map((source) => ({
        source,
        headers: [...NO_STORE_HEADERS],
      })),
      {
        source: "/images/:path*",
        headers: staticAssetCache,
      },
      ...["/smslogo.png", "/smslogo-dark.png", "/icon.png", "/icon.svg", "/bimi.svg", "/logo.png", "/og.png", "/apple-icon.png", "/apple-touch-icon.png", "/favicon.ico"].map(
        (source) => ({ source, headers: staticAssetCache }),
      ),
    ];
  },
};

export default nextConfig;
