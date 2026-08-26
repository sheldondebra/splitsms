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
  publishedTime?: string;
  modifiedTime?: string;
};

export const shareTitle = "SplitSMS | Bulk SMS Platform and SMS API";
export const shareDescription =
  "Send bulk SMS, OTP, and campaigns in Ghana, Nigeria, and 190+ countries. REST API, WordPress, and pay-as-you-go credits.";

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
    publishedTime,
    modifiedTime,
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
      locale: "en_US",
      images: defaultOpenGraphImages,
      ...(ogType === "article" && publishedTime
        ? { publishedTime, ...(modifiedTime ? { modifiedTime } : {}) }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [
        {
          url: defaultOpenGraphImages[0].url,
          alt: defaultOpenGraphImages[0].alt,
        },
      ],
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
