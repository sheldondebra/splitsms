import type { Metadata } from "next";
import { defaultKeywords, defaultOpenGraphImages, siteName, siteUrl } from "@/lib/seo/site";

export type BuildPageMetadataOptions = {
  /** Page title without site suffix — root template adds "| SplitSMS" when needed */
  title: string;
  description: string;
  /** Canonical path, e.g. `/pricing` */
  path: string;
  keywords?: string[];
  ogType?: "website" | "article";
  noIndex?: boolean;
  /** Override full title (skips template) */
  absoluteTitle?: string;
};

export function pageUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}

export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    keywords = defaultKeywords,
    ogType = "website",
    noIndex = false,
    absoluteTitle,
  } = options;

  const url = pageUrl(path);
  const resolvedTitle = absoluteTitle ?? title;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName,
      type: ogType,
      locale: "en",
      images: defaultOpenGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [defaultOpenGraphImages[0].url],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export function googleSiteVerification(): Metadata["verification"] | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (!token) return undefined;
  return { google: token };
}
