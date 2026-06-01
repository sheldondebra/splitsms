import type { LucideIcon } from "lucide-react";
import { ShoppingCart, UserPlus, FileText, Layers, LayoutList } from "lucide-react";

export type WordPressFeatureGroup = {
  icon: LucideIcon;
  title: string;
  items: string[];
};

/** Shared copy for /integrations/wordpress and dashboard developer pages. */
export const wordpressIntegrationFeatureGroups: WordPressFeatureGroup[] = [
  {
    icon: LayoutList,
    title: "Forms manager",
    items: [
      "Auto-detect CF7, WPForms, Elementor, JetFormBuilder, JetEngine",
      "Per-form toggle, phone field, message, admin copy",
      "Refresh list when you add new forms — no custom code",
      "Native Send SMS actions in JFB, JetEngine, Elementor Pro",
    ],
  },
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
      "Create account links for WordPress.org installs",
      "Settings UI under SplitSMS → Integrations",
    ],
  },
  {
    icon: FileText,
    title: "Form plugins",
    items: [
      "Contact Form 7 & WPForms — Forms manager or Integrations",
      "Elementor Pro — SplitSMS Notification under Actions After Submit",
      "JetFormBuilder — Send SMS post-submit action",
      "JetEngine legacy forms — Send SMS notification type",
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
    "Create a free SplitSMS account at splitsms.com/signup — starter SMS credits included.",
    "Developers → API Keys — create a key with sms.send permission and copy the full secret (~56 chars).",
    "Install: WordPress.org search “SplitSMS”, or upload the zip from splitsms.com/integrations/wordpress.",
    `SplitSMS → Settings — API base URL ${baseUrl} (pre-filled). Paste API key, Sender ID, admin phone.`,
    "SplitSMS → Forms — enable SMS per form, or add Send SMS / SplitSMS Notification in your form builder.",
    "SplitSMS → Integrations — enable WooCommerce, WordPress core, or Crocoblock events.",
    "Send a test SMS on Dashboard and confirm delivery in Logs and your splitsms.com account.",
  ];
}

export const woocommerceTemplatePlaceholders =
  "{customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {paystack_reference}, {tracking_number}, {refund_amount}, {site_name}";

export const wordpressHowItWorksSteps = [
  {
    title: "Your SplitSMS account",
    body: "Sign up on splitsms.com, add wallet credits, register a Sender ID, and create an API key. The plugin never stores payment details — only your API key.",
  },
  {
    title: "Connect WordPress",
    body: "Paste the API key under SplitSMS → Settings. The plugin validates the key, registers your site on splitsms.com, and shows balance on the Dashboard.",
  },
  {
    title: "Configure events",
    body: "Turn on WooCommerce order SMS, registration alerts, or form notifications using toggles, the Forms manager, or native form actions — all in wp-admin.",
  },
  {
    title: "Send & track",
    body: "Each SMS debits your wallet. Status syncs from Sent to Delivered in SplitSMS → Logs and Dashboard → WordPress on splitsms.com.",
  },
];
