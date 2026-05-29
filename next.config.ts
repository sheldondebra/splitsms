import type { NextConfig } from "next";
import { NO_STORE_HEADERS } from "@/lib/cache/no-store";

const docPaths = ["/api-docs", "/api-docs/:path*", "/docs", "/docs/:path*", "/changelog"];

const nextConfig: NextConfig = {
  async headers() {
    return docPaths.map((source) => ({
      source,
      headers: [...NO_STORE_HEADERS],
    }));
  },
};

export default nextConfig;
