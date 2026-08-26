import { marketingNavItems } from "@/lib/navigation/marketing-nav";

export type SiteSearchGroup =
  | "Pages"
  | "Products"
  | "Solutions"
  | "Developers"
  | "Company"
  | "Integrations";

export type SiteSearchItem = {
  href: string;
  title: string;
  description?: string;
  group: SiteSearchGroup;
  keywords?: string;
};

const GROUP_BY_NAV: Record<string, SiteSearchGroup> = {
  products: "Products",
  solutions: "Solutions",
  developers: "Developers",
  company: "Company",
};

const extraItems: SiteSearchItem[] = [
  {
    href: "/signup",
    title: "Create an account",
    description: "Five free credits. No card to start.",
    group: "Pages",
    keywords: "register signup get started free",
  },
  {
    href: "/login",
    title: "Log in",
    description: "Dashboard, wallet, and API keys.",
    group: "Pages",
    keywords: "sign in account",
  },
  {
    href: "/docs",
    title: "Documentation",
    description: "Campaigns, Sender IDs, and first send.",
    group: "Developers",
    keywords: "docs help guides",
  },
  {
    href: "/api-docs",
    title: "API reference",
    description: "Auth, send, balance, and webhooks.",
    group: "Developers",
    keywords: "rest otp endpoint",
  },
  {
    href: "/sdk",
    title: "SDKs",
    description: "JavaScript, PHP, and Flutter.",
    group: "Developers",
  },
  {
    href: "/smart-forms",
    title: "Smart Forms",
    description: "Forms with confirmation SMS and QR.",
    group: "Products",
    keywords: "form qr registration",
  },
  {
    href: "/google",
    title: "Google Workspace SMS",
    description: "Contacts, Sheets, and Forms → SMS.",
    group: "Products",
  },
  {
    href: "/how-to",
    title: "How to",
    description: "Step-by-step: WordPress, reports, Smart Forms, Google.",
    group: "Company",
    keywords: "howto guide tutorial woocommerce google forms reports",
  },
  {
    href: "/support",
    title: "Support",
    description: "Sender ID, billing, API, WordPress.",
    group: "Company",
    keywords: "help ticket contact",
  },
  {
    href: "/changelog",
    title: "Changelog",
    description: "What shipped, and when.",
    group: "Developers",
  },
  {
    href: "/security",
    title: "Security",
    description: "Keys, traffic, and account protection.",
    group: "Company",
  },
  {
    href: "/integrations/wordpress",
    title: "WordPress plugin",
    description: "WooCommerce, Paystack, and form plugins.",
    group: "Integrations",
    keywords: "woo plugin wp",
  },
  {
    href: "/integrations",
    title: "Integrations",
    description: "WordPress, Google, Paystack, and more.",
    group: "Integrations",
  },
  {
    href: "/pricing",
    title: "SMS pricing",
    description: "Pay-as-you-go rates by country.",
    group: "Pages",
    keywords: "rates credits ghs cost",
  },
  {
    href: "/blog",
    title: "Blog",
    description: "Guides, Sender IDs, and Ghana SMS notes.",
    group: "Pages",
  },
];

const featuredHrefs = new Set([
  "/products",
  "/docs",
  "/api-docs",
  "/pricing",
  "/smart-forms",
  "/support",
  "/how-to",
  "/signup",
  "/integrations/wordpress",
]);

function dedupeKey(item: SiteSearchItem) {
  return `${item.href}|${item.title}`;
}

export function getSiteSearchItems(): SiteSearchItem[] {
  const items: SiteSearchItem[] = [];
  const seen = new Set<string>();

  function add(item: SiteSearchItem) {
    const key = dedupeKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  }

  for (const nav of marketingNavItems) {
    add({
      href: nav.href,
      title: nav.label,
      group: GROUP_BY_NAV[nav.id] ?? "Pages",
    });
    if (!nav.mega) continue;
    for (const column of nav.mega.columns) {
      for (const link of column.links) {
        add({
          href: link.href,
          title: link.label,
          description: link.description,
          group: GROUP_BY_NAV[nav.id] ?? "Pages",
        });
      }
    }
  }

  for (const extra of extraItems) add(extra);
  return items;
}

export function searchSite(query: string, items: SiteSearchItem[], limit = 8): SiteSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items.filter((item) => featuredHrefs.has(item.href)).slice(0, limit);
  }

  const scored = items
    .map((item) => {
      const title = item.title.toLowerCase();
      const hay = `${title} ${item.description ?? ""} ${item.keywords ?? ""} ${item.href}`.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (hay.includes(q)) score = 40;
      const words = q.split(/\s+/).filter(Boolean);
      if (score === 0 && words.length > 1 && words.every((word) => hay.includes(word))) {
        score = 30;
      }
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return scored.slice(0, limit).map((row) => row.item);
}

export function groupSearchHits(hits: SiteSearchItem[]) {
  const order: SiteSearchGroup[] = [
    "Pages",
    "Products",
    "Solutions",
    "Developers",
    "Company",
    "Integrations",
  ];
  return order
    .map((group) => ({ group, items: hits.filter((hit) => hit.group === group) }))
    .filter((row) => row.items.length > 0);
}
