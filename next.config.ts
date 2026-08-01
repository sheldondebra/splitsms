import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NO_STORE_HEADERS } from "@/lib/cache/no-store";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const docPaths = ["/api-docs", "/api-docs/:path*", "/docs", "/docs/:path*", "/changelog"];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return docPaths.map((source) => ({
      source,
      headers: [...NO_STORE_HEADERS],
    }));
  },
};

export default nextConfig;
