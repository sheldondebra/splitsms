import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site";
import { blogPosts, getAllBlogSlugs } from "@/lib/marketing/blog-posts";
import { getAllIntegrationSlugs } from "@/lib/marketing/integrations-catalog";
import { getAllSeoLandingSlugs } from "@/lib/marketing/seo-landing-pages";

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"] = "monthly",
  lastModified?: Date,
): SitemapEntry {
  return {
    url: `${siteUrl}${path}`,
    lastModified: lastModified ?? new Date("2026-06-01"),
    changeFrequency,
    priority,
  };
}

const blogLastModified = new Map(blogPosts.map((post) => [post.slug, new Date(post.published)]));

/** Public marketing & docs URLs worth indexing (no auth, no redirects-only stubs). */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency?: SitemapEntry["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/features", priority: 0.95, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.95, changeFrequency: "weekly" },
  { path: "/smart-forms", priority: 0.85, changeFrequency: "monthly" },
  { path: "/integrations", priority: 0.85, changeFrequency: "weekly" },
  { path: "/api-docs", priority: 0.9, changeFrequency: "weekly" },
  { path: "/docs", priority: 0.85, changeFrequency: "weekly" },
  { path: "/docs/api", priority: 0.85, changeFrequency: "monthly" },
  { path: "/docs/connect", priority: 0.8, changeFrequency: "monthly" },
  { path: "/docs/mobile", priority: 0.75, changeFrequency: "monthly" },
  { path: "/sdk", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vibe-coders", priority: 0.85, changeFrequency: "monthly" },
  { path: "/solutions", priority: 0.92, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.85, changeFrequency: "weekly" },
  { path: "/company", priority: 0.6, changeFrequency: "monthly" },
  { path: "/support", priority: 0.65, changeFrequency: "monthly" },
  { path: "/security", priority: 0.55, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/data-protection", priority: 0.4, changeFrequency: "yearly" },
  { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFrequency }) =>
    entry(path, priority, changeFrequency),
  );

  const blogEntries = getAllBlogSlugs().map((slug) =>
    entry(`/blog/${slug}`, 0.7, "monthly", blogLastModified.get(slug)),
  );

  const integrationEntries = getAllIntegrationSlugs().map((slug) =>
    entry(`/integrations/${slug}`, 0.75, "monthly"),
  );

  const solutionEntries = getAllSeoLandingSlugs().map((slug) =>
    entry(`/solutions/${slug}`, 0.9, "weekly"),
  );

  return [...staticEntries, ...solutionEntries, ...integrationEntries, ...blogEntries];
}
