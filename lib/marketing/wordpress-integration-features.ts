import type { LucideIcon } from "lucide-react";
import { ShoppingCart, UserPlus, FileText, Layers } from "lucide-react";

export type WordPressFeatureGroup = {
  icon: LucideIcon;
  title: string;
  items: string[];
};

/** Shared copy for /integrations/wordpress and dashboard developer pages. */
export const wordpressIntegrationFeatureGroups: WordPressFeatureGroup[] = [
  {
    icon: ShoppingCart,
    title: "WooCommerce",
    items: [
      "Order placed, payment complete, processing, completed",
      "Failed, cancelled, refunded, shipped (tracking)",
      "Paystack / Flutterwave / Stripe via WC hooks",
      "HPOS & block checkout supported",
    ],
  },
  {
    icon: UserPlus,
    title: "WordPress core",
    items: [
      "Welcome SMS on user registration",
      "Optional password reset link via SMS",
      "Settings UI under SplitSMS → Integrations",
    ],
  },
  {
    icon: FileText,
    title: "Form plugins",
    items: [
      "Contact Form 7 — wpcf7_submit + skip logs",
      "WPForms — dedicated integration + form ID filter",
      "Elementor Pro Forms — new_record hook",
      "JetFormBuilder — native Send SMS action",
    ],
  },
  {
    icon: Layers,
    title: "Crocoblock",
    items: [
      "JetEngine CPT create, update & status SMS",
      "JetBooking & JetAppointment with reminders",
      "Full template editor per event",
      "Conditional SMS rules (JSON)",
    ],
  },
];

export function wordpressSetupSteps(baseUrl: string): string[] {
  return [
    "Create a SplitSMS account and generate an API key with sms.send permission.",
    "WordPress → Plugins → Add New → Upload → choose splitsms.zip → Activate.",
    `Open the SplitSMS menu → Settings — API base URL ${baseUrl} (pre-filled).`,
    "Paste your full API key (~56 chars), Sender ID, and admin phone — Test connection → Save.",
    "Enable WooCommerce, WordPress core, forms, or Crocoblock under SplitSMS → Integrations.",
  ];
}

export const woocommerceTemplatePlaceholders =
  "{customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {paystack_reference}, {tracking_number}, {refund_amount}, {site_name}";
