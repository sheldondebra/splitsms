import { getSiteUrl, siteName as configSiteName, supportEmail } from "@/lib/site-config";

export const siteUrl = getSiteUrl();

export const siteName = configSiteName;

export const defaultKeywords = [
  "SMS",
  "SMS Ghana",
  "bulk SMS",
  "bulk SMS platform",
  "bulk SMS Ghana",
  "bulk SMS Nigeria",
  "bulk SMS Africa",
  "SMS API",
  "REST SMS API",
  "SMS gateway",
  "SMS gateway API",
  "SMS gateway Ghana",
  "send SMS online",
  "SMS marketing",
  "transactional SMS",
  "OTP",
  "OTP SMS",
  "OTP SMS API",
  "SMS verification API",
  "SMS integration",
  "affordable SMS",
  "cheap bulk SMS",
  "international SMS",
  "global SMS",
  "WooCommerce SMS",
  "Paystack SMS",
  "WordPress SMS plugin",
  "SMS webhooks",
  "SMS delivery reports",
  "mNotify",
  "mNotify alternative",
  "Infobip alternative",
  "Twilio SMS alternative",
  "vibe coders SMS API",
  "SplitSMS",
];

/** Brand wordmark served from /public — 1024×343 PNG */
export const brandLogo = {
  path: "/smslogo.png",
  url: `${siteUrl}/smslogo.png`,
  width: 1024,
  height: 343,
  alt: "SplitSMS — Bulk SMS platform and SMS API",
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
    "SplitSMS is a bulk SMS platform and SMS API for 190+ countries — campaigns, OTP, webhooks, Smart Forms, and pay-as-you-go pricing.",
  areaServed: ["GH", "NG", "KE", "ZA", "US", "GB", "Worldwide"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      availableLanguage: ["English"],
      areaServed: "Worldwide",
    },
  ],
  parentOrganization: {
    "@type": "Organization",
    name: "Tecunit",
  },
  knowsAbout: [
    "Bulk SMS",
    "SMS Ghana",
    "SMS API",
    "OTP verification",
    "SMS marketing",
    "Transactional messaging",
    "WooCommerce SMS",
    "Paystack SMS integration",
    "mNotify routing",
    "SMS integration",
  ],
};

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  description:
    "Bulk SMS platform — send SMS campaigns, OTP, and notifications globally with REST API and dashboard.",
  publisher: { "@id": `${siteUrl}/#organization` },
  inLanguage: "en",
};

export const smsServiceJsonLd = {
  "@type": "Service",
  "@id": `${siteUrl}/#service`,
  name: "Bulk SMS & SMS API",
  serviceType: "SMS messaging platform",
  provider: { "@id": `${siteUrl}/#organization` },
  areaServed: "Worldwide",
  description:
    "Send bulk SMS, OTP codes, and marketing campaigns in 190+ countries via dashboard or REST API.",
  offers: {
    "@type": "Offer",
    priceCurrency: "GHS",
    price: "0.029",
    description: "Per SMS segment from — country-dependent transparent pricing",
    url: `${siteUrl}/pricing`,
  },
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
}) {
  return {
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: `${siteUrl}${input.path}`,
    datePublished: input.datePublished,
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: `${siteUrl}${input.path}`,
  };
}

export function webPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@type": "WebPage",
    "@id": `${siteUrl}${input.path}#webpage`,
    url: `${siteUrl}${input.path}`,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };
}
