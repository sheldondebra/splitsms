import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Building2,
  Church,
  Cloud,
  Code2,
  FileCode2,
  FileText,
  FormInput,
  GraduationCap,
  HeartPulse,
  KeyRound,
  Landmark,
  LifeBuoy,
  Megaphone,
  Package,
  Puzzle,
  Scale,
  ScrollText,
  Send,
  Shield,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  Webhook,
} from "lucide-react";

export type MegaLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type MegaColumn = {
  title: string;
  links: MegaLink[];
};

export type MegaFeatured = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type MegaMenu = {
  columns: MegaColumn[];
  featured: MegaFeatured;
};

export type MarketingNavItem = {
  id: string;
  href: string;
  label: string;
  matchHrefs?: string[];
  mega?: MegaMenu;
};

export const marketingNavItems: MarketingNavItem[] = [
  {
    id: "products",
    href: "/products",
    label: "Products",
    matchHrefs: ["/products", "/features", "/smart-forms", "/google", "/reseller-platform"],
    mega: {
      columns: [
        {
          title: "Messaging",
          links: [
            {
              href: "/products/bulk-sms",
              label: "Bulk SMS campaigns",
              description: "Lists, scheduling, and delivery reports.",
              icon: Megaphone,
            },
            {
              href: "/solutions/otp",
              label: "OTP & verification",
              description: "Login and payout codes over SMS.",
              icon: KeyRound,
            },
            {
              href: "/smart-forms",
              label: "Smart Forms",
              description: "Forms with confirmation texts and QR.",
              icon: FormInput,
            },
            {
              href: "/solutions/woocommerce-sms",
              label: "Store & payment SMS",
              description: "WooCommerce, Paystack, Flutterwave alerts.",
              icon: ShoppingBag,
            },
          ],
        },
        {
          title: "Platform",
          links: [
            {
              href: "/api-docs",
              label: "SMS API",
              description: "REST, sandbox keys, and webhooks.",
              icon: Code2,
            },
            {
              href: "/google",
              label: "Google Workspace",
              description: "Contacts, Sheets, and Forms → SMS.",
              icon: Cloud,
            },
            {
              href: "/reseller-platform",
              label: "Reseller platform",
              description: "Sell SMS under your own brand.",
              icon: Store,
            },
            {
              href: "/features",
              label: "All features",
              description: "Full tour of the dashboard and tools.",
              icon: Send,
            },
          ],
        },
      ],
      featured: {
        eyebrow: "Start here",
        title: "See the product catalogue",
        body: "One wallet for campaigns, OTP, forms, and the API. Five free credits on signup.",
        href: "/products",
        cta: "Explore products",
      },
    },
  },
  {
    id: "solutions",
    href: "/solutions",
    label: "Solutions",
    matchHrefs: ["/solutions"],
    mega: {
      columns: [
        {
          title: "The jobs",
          links: [
            {
              href: "/products/bulk-sms",
              label: "Reach a list",
              description: "Campaigns, reminders, staff blasts.",
              icon: Megaphone,
            },
            {
              href: "/solutions/otp",
              label: "OTP & verification",
              description: "Login, payout, and reset codes.",
              icon: KeyRound,
            },
            {
              href: "/solutions/woocommerce-sms",
              label: "Alerts & receipts",
              description: "Status, payments, duty texts.",
              icon: Bell,
            },
            {
              href: "/solutions/sms-integration",
              label: "API & integrations",
              description: "REST, WordPress, Google, webhooks.",
              icon: Code2,
            },
          ],
        },
        {
          title: "Examples — not a fence",
          links: [
            {
              href: "/solutions/retail",
              label: "Retail & commerce",
              description: "Orders, restocks, pickup codes.",
              icon: ShoppingBag,
            },
            {
              href: "/solutions/fintech",
              label: "Banks & fintech",
              description: "OTP, debit alerts, new devices.",
              icon: Landmark,
            },
            {
              href: "/solutions/government",
              label: "Public sector",
              description: "Notices, appointments, programmes.",
              icon: Building2,
            },
            {
              href: "/solutions#industries",
              label: "Every other team",
              description: "HR, utilities, farms, hotels, media…",
              icon: Users,
            },
          ],
        },
      ],
      featured: {
        eyebrow: "The platform",
        title: "SMS for any organisation that texts",
        body: "Campaigns, OTP, alerts, forms, and API on one wallet. Shops and schools are examples — not who is allowed.",
        href: "/solutions",
        cta: "See solutions",
      },
    },
  },
  {
    id: "developers",
    href: "/docs",
    label: "Developers",
    matchHrefs: [
      "/docs",
      "/api-docs",
      "/sdk",
      "/vibe-coders",
      "/developers",
      "/changelog",
      "/integrations",
    ],
    mega: {
      columns: [
        {
          title: "Build",
          links: [
            {
              href: "/docs",
              label: "Platform docs",
              description: "Guides from first send to production.",
              icon: BookOpen,
            },
            {
              href: "/api-docs",
              label: "API reference",
              description: "REST endpoints, auth, and examples.",
              icon: Code2,
            },
            {
              href: "/sdk",
              label: "SDKs",
              description: "JavaScript, PHP, and Flutter.",
              icon: FileCode2,
            },
            {
              href: "/docs/connect",
              label: "Connect API",
              description: "Embed SMS for SaaS and partners.",
              icon: Webhook,
            },
          ],
        },
        {
          title: "Ship faster",
          links: [
            {
              href: "/vibe-coders",
              label: "Vibe coders",
              description: "OpenAPI, llms.txt, and AI prompts.",
              icon: Smartphone,
            },
            {
              href: "/integrations",
              label: "Integrations",
              description: "WordPress, Google, Paystack, and more.",
              icon: Puzzle,
            },
            {
              href: "/changelog",
              label: "Changelog",
              description: "What shipped, and when.",
              icon: ScrollText,
            },
            {
              href: "/developers",
              label: "Developer portal",
              description: "Keys, logs, Postman, and webhooks.",
              icon: KeyRound,
            },
          ],
        },
      ],
      featured: {
        eyebrow: "For engineers",
        title: "Docs, API, and sandbox keys",
        body: "Read the API, grab a sandbox key, and send a test SMS without a sales call.",
        href: "/api-docs",
        cta: "Open API docs",
      },
    },
  },
  {
    id: "pricing",
    href: "/pricing",
    label: "Pricing",
  },
  {
    id: "blog",
    href: "/blog",
    label: "Blog",
  },
  {
    id: "company",
    href: "/company",
    label: "Company",
    matchHrefs: ["/company", "/support", "/security", "/privacy", "/terms"],
    mega: {
      columns: [
        {
          title: "SplitSMS",
          links: [
            {
              href: "/company",
              label: "About",
              description: "Who we are, and why we built this.",
              icon: Building2,
            },
            {
              href: "/support",
              label: "Support",
              description: "Bugs, billing, and account help.",
              icon: LifeBuoy,
            },
            {
              href: "/security",
              label: "Security",
              description: "How we protect keys and traffic.",
              icon: Shield,
            },
            {
              href: "/blog",
              label: "Blog",
              description: "Guides, pricing notes, and stories.",
              icon: BookOpen,
            },
          ],
        },
        {
          title: "Trust",
          links: [
            {
              href: "/privacy",
              label: "Privacy",
              description: "What we collect, and what we don't.",
              icon: FileText,
            },
            {
              href: "/terms",
              label: "Terms",
              description: "How the service is offered.",
              icon: Scale,
            },
          ],
        },
      ],
      featured: {
        eyebrow: "Talk to us",
        title: "Need a hand getting live?",
        body: "Sender IDs, routes, and WordPress setup — open a ticket or start with five free credits.",
        href: "/support",
        cta: "Contact support",
      },
    },
  },
];

export function isMarketingNavActive(pathname: string, item: MarketingNavItem) {
  const hrefs = item.matchHrefs ?? [item.href];
  return hrefs.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}
