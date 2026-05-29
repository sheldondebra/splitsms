/**
 * Cache-Control headers for docs/API routes (next.config.ts / vercel.json).
 * Route segment config (dynamic, revalidate) must be inlined in each layout/page — not re-exported.
 */
export const NO_STORE_HEADERS = [
  { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Vercel-CDN-Cache-Control", value: "no-store" },
] as const;
