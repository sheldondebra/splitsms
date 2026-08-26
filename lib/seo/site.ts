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
  "Google Contacts SMS",
  "Google Sheets SMS",
  "Google Forms SMS",
  "SMS webhooks",
  "SMS delivery reports",
  "mNotify",
  "mNotify alternative",
  "Infobip alternative",
  "Twilio SMS alternative",
  "vibe coders SMS API",
  "SplitSMS",
  "how to choose SplitSMS",
  "SMS for websites Ghana",
  "event SMS Ghana",
];

/** Square mark for Gmail, Apple Mail, BIMI, and Organization JSON-LD (min 112×112). */
export const brandLogo = {
  path: "/icon.png",
  url: `${siteUrl}/icon.png`,
  width: 512,
  height: 512,
  alt: "SplitSMS — Bulk SMS platform and SMS API",
} as const;

/** Default share card for Facebook, WhatsApp, LinkedIn, Twitter, iMessage. */
export const defaultOpenGraphImages = [
  {
    url: `${siteUrl}/og.png`,
    secureUrl: `${siteUrl}/og.png`,
    width: 1200,
    height: 630,
    alt: "SplitSMS bulk SMS platform and SMS API for Ghana and 190+ countries",
    type: "image/png",
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
  dateModified?: string;
  image?: string;
}) {
  return {
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: `${siteUrl}${input.path}`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: input.image ?? `${siteUrl}/og.png`,
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: `${siteUrl}${input.path}`,
  };
}

export function blogCollectionJsonLd(
  posts: { title: string; path: string; datePublished: string }[],
) {
  return {
    "@type": "Blog",
    "@id": `${siteUrl}/blog#blog`,
    url: `${siteUrl}/blog`,
    name: "SplitSMS Blog",
    description:
      "Bulk SMS marketing tips, OTP API guides, WooCommerce SMS, Ghana & Nigeria pricing, and integration tutorials.",
    publisher: { "@id": `${siteUrl}/#organization` },
    blogPost: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${post.path}`,
        name: post.title,
        datePublished: post.datePublished,
      })),
    },
  };
}

export function pricingPageJsonLd() {
  return {
    "@type": "WebPage",
    "@id": `${siteUrl}/pricing#webpage`,
    url: `${siteUrl}/pricing`,
    name: "SplitSMS SMS Pricing by Country",
    description:
      "Transparent bulk SMS rates per country. Pay-as-you-go credits with no monthly minimum.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "Product",
      name: "SplitSMS Bulk SMS",
      description: "Pay-as-you-go bulk SMS and OTP API with country-based pricing.",
      brand: { "@id": `${siteUrl}/#organization` },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "GHS",
        lowPrice: "0.029",
        offerCount: "190+",
        url: `${siteUrl}/pricing`,
      },
    },
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
