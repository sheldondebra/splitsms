import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/enterprise/",
          "/reseller/",
          "/developers/",
          "/embed/",
          "/f/",
          "/em/",
          "/go",
          "/onboarding",
          "/complete-profile",
          "/complete-phone",
          "/login",
          "/signup",
          "/forgot-password",
          "/verify-otp",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
