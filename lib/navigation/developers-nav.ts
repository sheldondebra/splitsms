import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Braces,
  Key,
  LayoutDashboard,
  MessageSquareText,
  Puzzle,
  ScrollText,
  FileCode2,
  Webhook,
} from "lucide-react";

export type DevelopersNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  accent?: "postman";
};

export const developersNavItems: DevelopersNavItem[] = [
  { href: "/developers", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/developers/api-keys", label: "API Keys", icon: Key },
  { href: "/developers/docs", label: "Documentation", icon: BookOpen },
  { href: "/developers/generate", label: "Generate code", icon: FileCode2 },
  { href: "/developers/prompts", label: "AI prompts", icon: MessageSquareText },
  { href: "/developers/postman", label: "Postman", icon: Braces, accent: "postman" },
  { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/developers/logs", label: "Request logs", icon: ScrollText },
  { href: "/developers/integrations", label: "Integrations", icon: Puzzle },
];

export function isDevelopersNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
