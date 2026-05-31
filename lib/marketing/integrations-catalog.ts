import { wordpressPlugin } from "@/lib/site-config";

export type IntegrationCategory = "platform" | "gateway" | "automation";

export type IntegrationDef = {
  slug: string;
  name: string;
  tagline: string;
  category: IntegrationCategory;
  /** Brand logo (Simple Icons CDN or local path) */
  logoSrc: string;
  brandColor: string;
  metaDescription: string;
  heroDescription: string;
  overview: string;
  howSplitSmsWorks: string[];
  setupSteps: { title: string; body: string }[];
  capabilities: string[];
  relatedSlugs: string[];
  primaryCta: { label: string; href: string; external?: boolean };
  secondaryCta?: { label: string; href: string; external?: boolean };
};

const LOGO = {
  wordpress: "https://cdn.simpleicons.org/wordpress/21759B",
  woocommerce: "https://cdn.simpleicons.org/woocommerce/96588A",
  paystack: "https://cdn.simpleicons.org/paystack/00C3F7",
  flutterwave: "https://cdn.simpleicons.org/flutterwave/FF9800",
  stripe: "https://cdn.simpleicons.org/stripe/635BFF",
  /** Crocoblock brand purple — favicon-style mark */
  crocoblock: "https://crocoblock.com/favicon.ico",
  mtn: "https://cdn.simpleicons.org/mtn/FFCC00",
  cf7: "https://cdn.simpleicons.org/contactform7/0073AA",
  wpforms: "https://cdn.simpleicons.org/wpforms/E27730",
  elementor: "https://cdn.simpleicons.org/elementor/92003B",
};

export const integrationsCatalog: IntegrationDef[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    tagline: "Official plugin for WooCommerce, forms & core events",
    category: "platform",
    logoSrc: LOGO.wordpress,
    brandColor: "#21759B",
    metaDescription:
      "Connect WordPress and WooCommerce to SplitSMS. Order SMS, registration alerts, CF7, WPForms, Elementor Pro, Crocoblock, and auto-updates from splitsms.com.",
    heroDescription:
      "Install the free SplitSMS plugin on any WordPress site. Connect your API key once, then send transactional SMS from WooCommerce orders, user signups, and form plugins.",
    overview:
      "SplitSMS is built for WordPress store owners and agencies. The official plugin talks only to splitsms.com — no third-party SMS gateways. You control every event with simple toggles and message templates.",
    howSplitSmsWorks: [
      "Your WordPress site calls the SplitSMS REST API using a secure API key from your dashboard.",
      "SMS credits are deducted from your SplitSMS wallet when messages are sent (sandbox keys test without charges).",
      "Delivery status and plugin events sync to your SplitSMS dashboard under WordPress integrations.",
      "Plugin updates are delivered automatically from splitsms.com — no manual zip uploads after the first install.",
    ],
    setupSteps: [
      {
        title: "Create a SplitSMS account",
        body: "Sign up at splitsms.com and generate an API key under App connections with sms.send permission.",
      },
      {
        title: "Download & install the plugin",
        body: "Get splitsms.zip from this site, upload via Plugins → Add New, and activate.",
      },
      {
        title: "Connect your API key",
        body: "Open SplitSMS → Settings in wp-admin, paste your key, set Sender ID and admin phone, then send a test SMS.",
      },
      {
        title: "Enable integrations",
        body: "Turn on WooCommerce, WordPress core, Contact Form 7, WPForms, Elementor Pro, or Crocoblock under SplitSMS → Integrations and Crocoblock.",
      },
    ],
    capabilities: [
      "WooCommerce order, payment & status SMS",
      "WordPress registration & password reset",
      "Contact Form 7, WPForms & Elementor Pro",
      "JetFormBuilder native Send SMS action",
      "Crocoblock JetEngine, JetBooking & JetAppointment",
      "Admin bar SMS balance widget",
      "Local + cloud message logs",
      "One-click plugin updates",
    ],
    relatedSlugs: ["woocommerce", "crocoblock", "paystack", "elementor-pro"],
    primaryCta: { label: "Download plugin", href: wordpressPlugin.downloadUrl, external: true },
    secondaryCta: { label: "API documentation", href: "/api-docs" },
  },
  {
    slug: "crocoblock",
    name: "Crocoblock",
    tagline: "JetEngine, JetFormBuilder, JetBooking & JetAppointment SMS",
    category: "automation",
    logoSrc: LOGO.crocoblock,
    brandColor: "#6B46C1",
    metaDescription:
      "Send SMS from JetEngine, JetFormBuilder, JetBooking, and JetAppointment with the SplitSMS WordPress plugin — bookings, forms, and CPT automations.",
    heroDescription:
      "Build advanced WordPress sites with Crocoblock and trigger SMS automatically — no custom code. Perfect for bookings, directories, schools, clinics, and marketplaces.",
    overview:
      "Crocoblock powers thousands of dynamic WordPress sites. SplitSMS adds an SMS layer on top: when a booking is confirmed, a form is submitted, or a custom post status changes, your customer or admin gets an instant text.",
    howSplitSmsWorks: [
      "The SplitSMS plugin detects installed Crocoblock plugins (JetEngine, JetFormBuilder, JetBooking, JetAppointment).",
      "You map phone fields and write templates with placeholders like {booking_date} and {customer_name}.",
      "Events fire on WordPress hooks, messages queue through SplitSMS, and credits are billed per segment.",
      "Optional reminders run on WP-Cron before check-in or appointment time.",
      "Logs show source as JetBooking, JetFormBuilder, etc. in both WordPress and your SplitSMS dashboard.",
    ],
    setupSteps: [
      {
        title: "Install SplitSMS + Crocoblock stack",
        body: "You need the SplitSMS plugin (v1.2+) and your Crocoblock plugins active on the same site.",
      },
      {
        title: "Connect SplitSMS API key",
        body: "Same as WordPress setup — Settings → API key, test connection, add funds.",
      },
      {
        title: "Open SplitSMS → Crocoblock",
        body: "Enable JetEngine, JetFormBuilder, JetBooking, or JetAppointment modules. For JetFormBuilder, add Send SMS (SplitSMS) under Post Submit Actions or use global templates.",
      },
      {
        title: "Customize templates",
        body: "Edit SMS text per event. Use conditional rules (JSON) for status = confirmed, etc.",
      },
    ],
    capabilities: [
      "JetEngine CPT create, update & status SMS",
      "JetFormBuilder Post Submit Action + global auto-SMS",
      "JetBooking confirm, cancel, status & reminders",
      "JetAppointment + provider alerts",
      "Full template editor per event",
      "Conditional SMS rules (JSON)",
    ],
    relatedSlugs: ["wordpress", "woocommerce"],
    primaryCta: { label: "WordPress plugin setup", href: "/integrations/wordpress" },
    secondaryCta: { label: "Developer docs", href: "/developers/docs" },
  },
  {
    slug: "paystack",
    name: "Paystack",
    tagline: "Payment confirmation SMS for WooCommerce + Paystack stores",
    category: "gateway",
    logoSrc: LOGO.paystack,
    brandColor: "#00C3F7",
    metaDescription:
      "Connect Paystack on your WordPress store with SplitSMS. Send order and payment-complete SMS when customers pay via Paystack on WooCommerce.",
    heroDescription:
      "Run WooCommerce with the Paystack payment gateway and SplitSMS together — customers get instant SMS when they place an order and when Paystack confirms payment.",
    overview:
      "Paystack is how many Ghanaian and African WordPress shops collect card, bank, and mobile money payments. SplitSMS does not process Paystack payments on your store — it sends SMS when WooCommerce order events fire after your customer pays through Paystack.",
    howSplitSmsWorks: [
      "Install WooCommerce + Paystack for WooCommerce (or your Paystack gateway plugin) on the same site as the SplitSMS plugin.",
      "Connect your SplitSMS API key in wp-admin — this powers SMS delivery, separate from Paystack checkout.",
      "When a customer checks out, SplitSMS can send an order-placed SMS to the billing phone.",
      "When Paystack confirms payment, WooCommerce marks the order paid and fires woocommerce_payment_complete — SplitSMS sends your payment-received template.",
      "If the customer’s network drops after Paystack checkout, the Paystack webhook marks the order paid — enable Paid → processing so SMS still sends.",
      "Status changes (processing, completed, cancelled) can trigger additional SMS with {order_id}, {order_total}, and {payment_method}.",
      "All messages log in WordPress and sync to your SplitSMS dashboard — manage templates and toggles without touching Paystack settings.",
    ],
    setupSteps: [
      {
        title: "Set up WooCommerce + Paystack on WordPress",
        body: "Install the Paystack WooCommerce gateway from Paystack’s integrations directory. Add test/live API keys under WooCommerce → Settings → Payments → Paystack, and run a test checkout before going live.",
      },
      {
        title: "Configure Paystack webhook (required)",
        body: "Copy the webhook URL from WooCommerce Paystack settings into Paystack Dashboard → Settings → API Keys & Webhooks. This ensures orders are marked paid when checkout redirects fail — and SplitSMS payment SMS still fires.",
      },
      {
        title: "Install & connect SplitSMS",
        body: "Download the SplitSMS plugin, add your API key and approved Sender ID, and send a test SMS.",
      },
      {
        title: "Enable WooCommerce payment events",
        body: "SplitSMS → Integrations → enable order placed, payment complete, and Paid → processing (Paystack). The setup checklist guides you through each step.",
      },
      {
        title: "Customize Paystack payment SMS",
        body: "Edit templates e.g. “Hi {customer_name}, we received your payment of {order_total} for order #{order_id}.” Use {paystack_reference} for the Paystack transaction reference.",
      },
    ],
    capabilities: [
      "Order placed SMS at checkout",
      "Payment complete after Paystack",
      "Processing & completed alerts",
      "Cancelled order notices",
      "Billing phone from WooCommerce",
      "Per-gateway store workflows",
    ],
    relatedSlugs: ["woocommerce", "flutterwave", "stripe", "wordpress"],
    primaryCta: { label: "WordPress plugin setup", href: "/integrations/wordpress" },
    secondaryCta: { label: "WooCommerce guide", href: "/integrations/woocommerce" },
  },
  {
    slug: "flutterwave",
    name: "Flutterwave",
    tagline: "WooCommerce SMS when customers pay via Flutterwave",
    category: "gateway",
    logoSrc: LOGO.flutterwave,
    brandColor: "#FF9800",
    metaDescription:
      "WordPress + Flutterwave + SplitSMS: automated order and payment SMS for WooCommerce stores using Flutterwave as the payment gateway.",
    heroDescription:
      "Accept payments with Flutterwave on your WordPress shop and keep buyers updated by SMS — powered by the SplitSMS plugin alongside WooCommerce.",
    overview:
      "Flutterwave lets WooCommerce merchants collect across African markets. Pair it with SplitSMS so every successful Flutterwave checkout triggers the SMS your customers expect — without building custom webhooks.",
    howSplitSmsWorks: [
      "Flutterwave handles checkout on your WordPress site; SplitSMS handles SMS only.",
      "The SplitSMS plugin hooks into standard WooCommerce events — the same flow works whether the gateway is Flutterwave, Paystack, or Stripe.",
      "Order-placed SMS fires at checkout; payment-complete SMS fires when WooCommerce records payment after Flutterwave succeeds.",
      "Use different templates per event so customers know when payment is pending vs confirmed.",
      "Store admins can receive alerts on a separate admin phone configured in SplitSMS settings.",
    ],
    setupSteps: [
      { title: "Connect Flutterwave to WooCommerce", body: "Install and configure the Flutterwave gateway plugin for your store currency." },
      { title: "Add SplitSMS to the site", body: "Install the official plugin and connect your splitsms.com API key." },
      { title: "Turn on WooCommerce SMS", body: "Enable payment complete and order status notifications in SplitSMS → Integrations." },
      { title: "Place a test order", body: "Pay with Flutterwave test mode and confirm SMS on the order billing phone." },
    ],
    capabilities: [
      "Multi-currency store support",
      "Payment confirmed SMS",
      "Order status templates",
      "Admin notifications",
      "Message logs in wp-admin",
      "Cloud sync to SplitSMS",
    ],
    relatedSlugs: ["paystack", "stripe", "woocommerce", "wordpress"],
    primaryCta: { label: "Get WordPress plugin", href: "/integrations/wordpress" },
    secondaryCta: { label: "WooCommerce integration", href: "/integrations/woocommerce" },
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    tagline: "Order, payment & status SMS for your store",
    category: "platform",
    logoSrc: LOGO.woocommerce,
    brandColor: "#96588A",
    metaDescription:
      "WooCommerce SMS notifications with SplitSMS — order placed, payment complete, processing, completed, and cancelled messages.",
    heroDescription:
      "Keep customers informed at every step of their WooCommerce order with automated SMS powered by SplitSMS.",
    overview:
      "WooCommerce is the most popular WordPress ecommerce plugin. SplitSMS connects via our WordPress plugin — no separate WooCommerce extension required.",
    howSplitSmsWorks: [
      "WooCommerce hooks fire on checkout, payment, and order status changes.",
      "SplitSMS reads the billing phone on each order and sends templated SMS.",
      "Templates support placeholders: {customer_name}, {order_id}, {order_total}, {order_status}.",
      "Each SMS is logged locally in WordPress and synced to SplitSMS cloud.",
      "Failed sends show in logs so you can fix balance or sender ID issues.",
    ],
    setupSteps: [
      { title: "Install SplitSMS plugin", body: "Required — download from splitsms.com/integrations/wordpress." },
      { title: "Connect API key", body: "Use a live API key with sufficient SMS credits." },
      { title: "Enable WooCommerce", body: "SplitSMS → Integrations → toggle order events you need." },
      { title: "Test an order", body: "Place a test order and confirm SMS on the billing phone." },
    ],
    capabilities: [
      "Order placed SMS",
      "Payment complete",
      "Processing & completed",
      "Cancelled notifications",
      "Per-event templates",
      "Billing phone auto-detect",
    ],
    relatedSlugs: ["wordpress", "paystack"],
    primaryCta: { label: "Get WordPress plugin", href: "/integrations/wordpress" },
    secondaryCta: { label: "Pricing", href: "/pricing" },
  },
  {
    slug: "stripe",
    name: "Stripe",
    tagline: "Global WooCommerce payment SMS with Stripe checkout",
    category: "gateway",
    logoSrc: LOGO.stripe,
    brandColor: "#635BFF",
    metaDescription:
      "Connect Stripe on WooCommerce with SplitSMS for international order and payment confirmation SMS on your WordPress store.",
    heroDescription:
      "Sell worldwide with Stripe on WooCommerce and notify customers by SMS the moment their card payment succeeds — managed from the SplitSMS WordPress plugin.",
    overview:
      "Stripe powers card payments for global WooCommerce stores. SplitSMS layers transactional SMS on top: your store keeps using Stripe for money; SplitSMS sends texts when orders and payments update in WooCommerce.",
    howSplitSmsWorks: [
      "WooCommerce Stripe gateway (or WooCommerce Payments) processes the transaction on your site.",
      "SplitSMS listens for WooCommerce hooks — no Stripe API keys are stored in the SplitSMS plugin.",
      "Customers receive SMS at order placement and when payment completes.",
      "Templates can mention order reference and amount; Stripe receipt emails and SplitSMS SMS work side by side.",
      "Ideal for digital goods, subscriptions with Woo extensions, and cross-border shops that still want SMS in local format.",
    ],
    setupSteps: [
      { title: "Configure Stripe on WooCommerce", body: "Connect Stripe in WooCommerce → Settings → Payments." },
      { title: "Install SplitSMS plugin", body: "Connect your SplitSMS account API key and sender ID." },
      { title: "Enable payment & order SMS", body: "Toggle WooCommerce events in SplitSMS → Integrations." },
      { title: "Test with Stripe test cards", body: "Complete a test order and verify SMS on the billing phone number." },
    ],
    capabilities: [
      "Card payment confirmed SMS",
      "International billing phones",
      "Order lifecycle notifications",
      "Custom templates per event",
      "Works with WooCommerce Payments",
      "Centralized SMS logs",
    ],
    relatedSlugs: ["paystack", "flutterwave", "woocommerce", "wordpress"],
    primaryCta: { label: "WordPress setup", href: "/integrations/wordpress" },
    secondaryCta: { label: "WooCommerce guide", href: "/integrations/woocommerce" },
  },
  {
    slug: "mtn-momo",
    name: "MTN MoMo",
    tagline: "MoMo checkout SMS for Ghana WooCommerce stores",
    category: "gateway",
    logoSrc: LOGO.mtn,
    brandColor: "#FFCC00",
    metaDescription:
      "MTN Mobile Money + WooCommerce + SplitSMS: payment and order SMS when customers pay with MoMo on your WordPress site.",
    heroDescription:
      "Ghana shops that accept MTN MoMo at checkout can automatically text customers when payment lands — using SplitSMS with WooCommerce.",
    overview:
      "MTN Mobile Money is a common WooCommerce payment method in Ghana. When MoMo payment succeeds, WooCommerce updates the order and SplitSMS sends your configured confirmation SMS.",
    howSplitSmsWorks: [
      "Your MoMo gateway plugin marks the order paid in WooCommerce.",
      "SplitSMS triggers payment-complete and status SMS to the customer phone on the order.",
      "SplitSMS API key connects your site to splitsms.com for delivery — separate from MTN’s payment APIs.",
    ],
    setupSteps: [
      { title: "Enable MTN MoMo on WooCommerce", body: "Use your preferred MoMo gateway plugin for WordPress." },
      { title: "Connect SplitSMS", body: "Install the plugin and add your API key." },
      { title: "Enable WooCommerce SMS events", body: "Turn on payment complete and order notifications." },
    ],
    capabilities: ["MoMo payment confirmed SMS", "GHS order alerts", "WooCommerce hooks", "Admin SMS"],
    relatedSlugs: ["paystack", "woocommerce", "wordpress"],
    primaryCta: { label: "WordPress plugin", href: "/integrations/wordpress" },
  },
  {
    slug: "contact-form-7",
    name: "Contact Form 7",
    tagline: "SMS after successful form submit",
    category: "automation",
    logoSrc: LOGO.cf7,
    brandColor: "#0073AA",
    metaDescription:
      "Send SMS when Contact Form 7 submissions succeed — powered by the SplitSMS WordPress plugin.",
    heroDescription:
      "Thank form respondents instantly via SMS when they submit Contact Form 7 — map your phone field name in plugin settings.",
    overview:
      "Contact Form 7 is a lightweight form plugin. SplitSMS sends a configurable message to the phone field after mail is sent successfully.",
    howSplitSmsWorks: [
      "Hook: wpcf7_submit — fires on mail_sent; optional mail_failed when SMTP fails.",
      "Phone field name is configurable (default: your-phone); per-form ID filter.",
      "Skip reasons (no phone, empty template) sync to your SplitSMS dashboard.",
      "Message template supports {site_name}, {name}, {form_title}, {field_*} placeholders.",
    ],
    setupSteps: [
      { title: "Install SplitSMS", body: "WordPress plugin from splitsms.com." },
      { title: "Enable CF7", body: "Integrations → Contact Form 7." },
      { title: "Set phone field", body: "Match your CF7 field name for phone numbers." },
    ],
    capabilities: ["After-submit SMS", "Per-form ID filter", "Skip logs to dashboard", "Custom template"],
    relatedSlugs: ["wordpress", "wpforms"],
    primaryCta: { label: "WordPress setup", href: "/integrations/wordpress" },
  },
  {
    slug: "wpforms",
    name: "WPForms",
    tagline: "SMS notifications for WPForms",
    category: "automation",
    logoSrc: LOGO.wpforms,
    brandColor: "#E27730",
    metaDescription:
      "WPForms SMS integration via SplitSMS — notify users after successful form completion.",
    heroDescription:
      "Connect WPForms to SplitSMS and send automatic SMS when forms are completed successfully.",
    overview:
      "WPForms powers lead capture and applications. SplitSMS maps the phone field by name or label slug.",
    howSplitSmsWorks: [
      "Dedicated SplitSMS_WPForms class — hook: wpforms_process_complete.",
      "Phone field by type, name, or label slug; per-form ID filter.",
      "Skip logs sync to SplitSMS dashboard when phone or template is missing.",
    ],
    setupSteps: [
      { title: "Install SplitSMS plugin", body: "Connect API key under SplitSMS → Settings." },
      { title: "Enable WPForms", body: "SplitSMS → Integrations → WPForms; optional form ID filter." },
      { title: "Add Phone field", body: "Use WPForms Phone field type; match field name in plugin settings." },
    ],
    capabilities: ["Form complete SMS", "Per-form ID filter", "Skip logs", "Custom message"],
    relatedSlugs: ["wordpress", "contact-form-7"],
    primaryCta: { label: "Get started", href: "/integrations/wordpress" },
  },
  {
    slug: "elementor-pro",
    name: "Elementor Pro Forms",
    tagline: "SMS after Elementor form submission",
    category: "automation",
    logoSrc: LOGO.elementor,
    brandColor: "#92003B",
    metaDescription:
      "Send SMS when Elementor Pro Forms submit — SplitSMS WordPress plugin with Tel field detection and skip logs.",
    heroDescription:
      "Thank visitors instantly when they submit an Elementor Pro form — map the Tel field ID and customize your message template.",
    overview:
      "Elementor Pro Forms power landing pages and lead capture. SplitSMS hooks elementor_pro/forms/new_record after form actions run, with mail_sent fallback and deduplication.",
    howSplitSmsWorks: [
      "Primary hook: elementor_pro/forms/new_record; fallback: elementor_pro/forms/mail_sent.",
      "Tel field detected via Field ID (Advanced tab), field type, or auto-scan.",
      "Optional per-form name filter; skip reasons sync to SplitSMS dashboard.",
    ],
    setupSteps: [
      { title: "Install SplitSMS plugin", body: "Requires Elementor Pro and a connected API key." },
      { title: "Enable Elementor Pro", body: "SplitSMS → Integrations → Elementor Pro Forms." },
      { title: "Set Field ID", body: "Add Tel field; set Field ID (e.g. phone) to match plugin settings." },
    ],
    capabilities: ["After-submit SMS", "Tel field auto-detect", "Per-form filter", "Skip logs"],
    relatedSlugs: ["wordpress", "contact-form-7", "wpforms"],
    primaryCta: { label: "WordPress setup", href: "/integrations/wordpress" },
  },
];

export function getIntegration(slug: string): IntegrationDef | undefined {
  return integrationsCatalog.find((i) => i.slug === slug);
}

export function getAllIntegrationSlugs(): string[] {
  return integrationsCatalog.map((i) => i.slug);
}

export const integrationsByCategory = {
  platform: integrationsCatalog.filter((i) => i.category === "platform"),
  gateway: integrationsCatalog.filter((i) => i.category === "gateway"),
  automation: integrationsCatalog.filter((i) => i.category === "automation"),
};
