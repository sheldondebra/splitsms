import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site";
import { getAllBlogSlugs } from "@/lib/marketing/blog-posts";
import { getAllIntegrationSlugs } from "@/lib/marketing/integrations-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes = [
    "",
    "/features",
    "/pricing",
    "/blog",
    "/company",
    "/api-docs",
    "/vibe-coders",
    "/openapi.json",
    "/llms.txt",
    "/sdk",
    "/integrations",
    "/docs",
    "/changelog",
    "/support",
    "/privacy",
    "/terms",
    "/data-protection",
    "/security",
    "/signup",
    "/login",
  ];

  const blogRoutes = getAllBlogSlugs().map((slug) => `/blog/${slug}`);
  const integrationRoutes = getAllIntegrationSlugs().map(
    (slug) => `/integrations/${slug}`,
  );

  return [...staticRoutes, ...integrationRoutes, ...blogRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path.startsWith("/blog/") ? "monthly" : path === "" || path === "/blog" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/blog" || path === "/features" || path === "/pricing" ? 0.9 : 0.6,
  }));
}
