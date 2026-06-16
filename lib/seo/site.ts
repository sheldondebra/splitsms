import { getSiteUrl, siteName as configSiteName, supportEmail } from "@/lib/site-config";

export const siteUrl = getSiteUrl();

export const siteName = configSiteName;

export const defaultKeywords = [
  "SMS",
  "bulk SMS",
  "global bulk SMS",
  "SMS API",
  "SMS gateway",
  "send SMS",
  "SMS marketing",
  "transactional SMS",
  "OTP SMS",
  "SMS platform",
  "affordable SMS",
  "SplitSMS",
  "bulk messaging",
  "international SMS",
  "WooCommerce SMS",
];

/** Brand wordmark served from /public — 1024×343 PNG */
export const brandLogo = {
  path: "/smslogo.png",
  url: `${siteUrl}/smslogo.png`,
  width: 1024,
  height: 343,
  alt: "SplitSMS logo",
} as const;

export const defaultOpenGraphImages = [
  {
    url: brandLogo.path,
    width: brandLogo.width,
    height: brandLogo.height,
    alt: brandLogo.alt,
  },
];

export const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: brandLogo.url,
    width: brandLogo.width,
    height: brandLogo.height,
  },
  image: brandLogo.url,
  email: supportEmail,
  description:
    "SplitSMS is a bulk SMS platform for 190+ countries — campaigns, OTP API, webhooks, and pay-as-you-go pricing.",
  areaServed: ["GH", "NG", "Worldwide"],
  parentOrganization: {
    "@type": "Organization",
    name: "Tecunit",
  },
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  description: "Bulk SMS platform — send SMS campaigns, OTP, and notifications globally.",
  publisher: { "@id": `${siteUrl}/#organization` },
  inLanguage: "en",
};
