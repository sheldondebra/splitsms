export type SeoLandingPage = {
  slug: string;
  /** Browser title (template adds | SplitSMS unless absoluteTitle set on page) */
  title: string;
  h1: string;
  excerpt: string;
  keywords: string[];
  sections: { heading?: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  relatedLinks: { href: string; label: string }[];
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "sms",
    title: "SMS Ghana — Bulk SMS Platform, API & OTP | SplitSMS",
    h1: "SMS for Ghana & 190+ Countries",
    excerpt:
      "Send bulk SMS, OTP, and transactional texts in Ghana and worldwide. Transparent GHS pricing, mNotify routing, REST API, dashboard, and 5 free credits.",
    keywords: [
      "SMS",
      "SMS Ghana",
      "bulk SMS Ghana",
      "send SMS online",
      "SMS platform Ghana",
      "transactional SMS",
      "SMS API Ghana",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "Whether you need marketing SMS, OTP verification, or order alerts, SplitSMS is an SMS platform built for Ghana and global reach. Top up in GHS via Paystack, register an approved Sender ID, and send from a dashboard or REST API — no enterprise sales cycle.",
          "Routes include trusted Ghana carriers such as mNotify, with failover and delivery reports so you know what landed on MTN and Telecel networks.",
        ],
      },
      {
        heading: "Bulk SMS campaigns",
        paragraphs: [
          "Upload contacts, personalize messages, schedule sends, and track delivered vs failed in real time. Ghana rates from around GHS 0.029 per segment with pay-as-you-go billing — no monthly minimum.",
        ],
      },
      {
        heading: "SMS API for developers",
        paragraphs: [
          "REST endpoints for send SMS, OTP verify, balance, campaigns, and signed delivery webhooks. Sandbox keys for staging, OpenAPI spec, Postman collection, and SDKs for JavaScript, PHP, and Flutter.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much does SMS cost in Ghana on SplitSMS?",
        answer:
          "SplitSMS publishes transparent per-segment Ghana pricing on the pricing page — typically from around GHS 0.029 per SMS segment. Top up your wallet via Paystack and pay only for what you send.",
      },
      {
        question: "Does SplitSMS work with mNotify in Ghana?",
        answer:
          "Yes. SplitSMS routes Ghana SMS through trusted carriers including mNotify, with multi-carrier failover for higher deliverability.",
      },
    ],
    relatedLinks: [
      { href: "/pricing", label: "SMS pricing" },
      { href: "/api-docs", label: "SMS API docs" },
      { href: "/solutions/otp", label: "OTP SMS API" },
      { href: "/blog/sms-api-getting-started-ghana", label: "SMS API getting started" },
      { href: "/blog/bulk-sms-pricing-ghana-explained", label: "Ghana SMS pricing guide" },
    ],
    primaryCta: { href: "/signup", label: "Start free — 5 SMS credits" },
    secondaryCta: { href: "/features", label: "See all features" },
  },
  {
    slug: "mnotify",
    title: "mNotify Alternative — Bulk SMS Ghana with SplitSMS",
    h1: "mNotify Alternative for Ghana SMS",
    excerpt:
      "Looking for an mNotify alternative? SplitSMS offers Ghana bulk SMS with transparent pricing, dashboard + API, WooCommerce plugin, and mNotify-grade routing.",
    keywords: [
      "mNotify",
      "mnotify",
      "mNotify alternative",
      "mNotify SMS Ghana",
      "bulk SMS Ghana",
      "SMS gateway Ghana",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "Teams searching for mNotify or mnotify often want reliable Ghana SMS with clear pricing and modern tooling. SplitSMS routes through carriers including mNotify while adding a self-serve dashboard, REST API, OTP verification, WordPress plugin, and delivery webhooks — one wallet for campaigns and transactional SMS.",
        ],
      },
      {
        heading: "Why switch from mNotify-only workflows",
        paragraphs: [
          "Legacy portals focus on bulk blasts. SplitSMS covers bulk SMS, OTP API, WooCommerce order texts, Smart Forms confirmations, reseller white-label, and developer docs — without hiding rates behind a sales call.",
          "Register your Sender ID, top up via Paystack in GHS, and send the same day. Logs show Sent → Delivered when carriers confirm DLR.",
        ],
      },
      {
        heading: "Same Ghana networks, broader platform",
        paragraphs: [
          "SplitSMS is built for Ghana mobile-first markets: +233 normalization, approved Sender IDs, Paystack wallet top-ups, and local support from Tecunit. Send to Ghana, Nigeria, and 190+ countries from one account.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is SplitSMS an mNotify alternative?",
        answer:
          "SplitSMS is a full SMS platform for Ghana that routes through trusted carriers including mNotify. You get bulk SMS, OTP API, integrations, and transparent pricing in one dashboard — not just a reseller portal.",
      },
      {
        question: "Can I use SplitSMS if I already use mNotify?",
        answer:
          "Many teams migrate to SplitSMS for the REST API, WordPress plugin, OTP verify endpoints, and unified wallet. Sign up free, test with sandbox keys, and compare delivery on your own numbers before switching campaigns.",
      },
    ],
    relatedLinks: [
      { href: "/solutions/sms", label: "SMS Ghana overview" },
      { href: "/integrations/wordpress", label: "WordPress SMS plugin" },
      { href: "/blog/best-sms-ghana-accra-messaging-reseller-platform", label: "Best SMS in Ghana guide" },
      { href: "/blog/sender-id-registration-ghana", label: "Sender ID registration guide" },
      { href: "/blog/bulk-sms-pricing-ghana-explained", label: "Ghana SMS pricing explained" },
    ],
    primaryCta: { href: "/signup", label: "Try SplitSMS free" },
    secondaryCta: { href: "/pricing", label: "Compare Ghana rates" },
  },
  {
    slug: "infobip",
    title: "Infobip Alternative — SMS API & Bulk SMS for Africa",
    h1: "Infobip Alternative — Simpler SMS for Ghana & Africa",
    excerpt:
      "Infobip alternative for teams who want affordable bulk SMS, OTP API, and WooCommerce SMS without enterprise complexity. Ghana-ready pricing and local support.",
    keywords: [
      "Infobip",
      "Infobip alternative",
      "Infobip alternative Ghana",
      "Infobip vs SplitSMS",
      "SMS API Africa",
      "bulk SMS Nigeria",
      "OTP SMS API",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "Infobip powers global enterprises — but many Ghana and West Africa teams need SMS without long contracts, opaque pricing, or a six-month integration project. SplitSMS is an Infobip alternative focused on self-serve signup, transparent per-country rates, and Africa-first workflows.",
        ],
      },
      {
        heading: "What you get instead of Infobip",
        paragraphs: [
          "Bulk SMS dashboard, REST SMS API, OTP send and verify, delivery webhooks, Smart Forms, WordPress + WooCommerce plugin, Paystack billing in GHS, and reseller white-label — from one operator (Tecunit) who understands local Sender ID rules.",
        ],
      },
      {
        heading: "Developers ship faster",
        paragraphs: [
          "OpenAPI spec, llms.txt, sandbox API keys, code generator, and vibe-coder friendly docs. Most teams send their first OTP or bulk campaign in under an hour — not after procurement.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is SplitSMS cheaper than Infobip?",
        answer:
          "SplitSMS publishes pay-as-you-go rates per country with no monthly minimum. Ghana SMS from around GHS 0.029 per segment. Compare live pricing on splitsms.com/pricing before you commit.",
      },
      {
        question: "Does SplitSMS support the same countries as Infobip?",
        answer:
          "SplitSMS delivers to 190+ countries including Ghana, Nigeria, Kenya, South Africa, the UK, and the US — with multi-carrier routing and failover.",
      },
    ],
    relatedLinks: [
      { href: "/api-docs", label: "REST SMS API" },
      { href: "/vibe-coders", label: "SMS for vibe coders" },
      { href: "/docs/connect", label: "SplitSMS Connect for SaaS" },
      { href: "/blog/sms-api-getting-started-ghana", label: "SMS API getting started" },
      { href: "/blog/sms-delivery-webhooks-developer-guide", label: "Delivery webhooks guide" },
    ],
    primaryCta: { href: "/signup", label: "Create free account" },
    secondaryCta: { href: "/api-docs", label: "Read API docs" },
  },
  {
    slug: "otp",
    title: "OTP SMS API — Send & Verify Codes in Ghana | SplitSMS",
    h1: "OTP SMS API — Verification Codes That Deliver",
    excerpt:
      "Send and verify OTP SMS in Ghana and 190+ countries. REST API, sandbox testing, webhooks, and transparent pricing — ship login and payment verification fast.",
    keywords: [
      "OTP",
      "OTP SMS",
      "OTP SMS API",
      "OTP API Ghana",
      "SMS verification API",
      "two factor SMS",
      "verify OTP API",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "OTP over SMS is the global standard for login, checkout, and password reset. SplitSMS exposes send and verify endpoints so your backend confirms codes without managing carrier relationships — sandbox keys let you test for free before production.",
        ],
      },
      {
        heading: "OTP API endpoints",
        paragraphs: [
          "Create API keys with sms.send permission, POST to send a one-time code, and verify the user input on your server. Delivery webhooks notify you when messages succeed or fail — signed with HMAC for security.",
        ],
      },
      {
        heading: "Ghana and international OTP",
        paragraphs: [
          "Deliver OTP to Ghana (+233), Nigeria, Kenya, and 190+ countries. Normalize local formats (024, 054) before send. Same wallet powers OTP and bulk campaigns.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I send OTP SMS with SplitSMS?",
        answer:
          "Sign up, create an API key, use the REST send endpoint with your message template or OTP helper, and verify codes via the verify endpoint. Full reference at splitsms.com/api-docs.",
      },
      {
        question: "Can I test OTP without charges?",
        answer:
          "Yes. Sandbox API keys let you integrate and test OTP flows without debiting your wallet. Switch to production keys when ready.",
      },
    ],
    relatedLinks: [
      { href: "/api-docs", label: "OTP API reference" },
      { href: "/blog/otp-sms-api-developer-guide", label: "OTP developer guide" },
      { href: "/vibe-coders", label: "AI-friendly API docs" },
    ],
    primaryCta: { href: "/signup", label: "Get API keys" },
    secondaryCta: { href: "/api-docs", label: "View OTP endpoints" },
  },
  {
    slug: "woocommerce-sms",
    title: "WooCommerce SMS — Order & Payment Notifications | SplitSMS",
    h1: "WooCommerce SMS Notifications",
    excerpt:
      "Send WooCommerce SMS when orders are placed, paid, shipped, or cancelled. Free WordPress plugin, HPOS compatible, Paystack and Flutterwave ready.",
    keywords: [
      "WooCommerce SMS",
      "WooCommerce SMS notifications",
      "WordPress order SMS",
      "WooCommerce text message",
      "order SMS Ghana",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "WooCommerce customers expect a text when they pay — not just an email in spam. SplitSMS WordPress plugin hooks order placed, payment complete, processing, completed, cancelled, and shipped events. Templates use {customer_name}, {order_id}, {order_total}, and {tracking_number}.",
        ],
      },
      {
        heading: "Works with Ghana payment gateways",
        paragraphs: [
          "Pair with Paystack, Flutterwave, Stripe, or MTN MoMo on WooCommerce. SplitSMS sends SMS when WooCommerce marks the order paid — including Paystack webhook delays when you enable Paid → processing.",
        ],
      },
      {
        heading: "HPOS and block checkout",
        paragraphs: [
          "Compatible with WooCommerce High-Performance Order Storage and block checkout. Configure everything from SplitSMS → Integrations in wp-admin — no custom PHP.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I add SMS to WooCommerce?",
        answer:
          "Install the SplitSMS plugin, connect your API key, enable WooCommerce under Integrations, save templates, and place a test order. See splitsms.com/integrations/woocommerce for the full guide.",
      },
      {
        question: "Which phone number does WooCommerce SMS use?",
        answer:
          "Billing phone on the order, with fallbacks to shipping phone and user meta. Check SplitSMS → Logs for skip reasons if no SMS is sent.",
      },
    ],
    relatedLinks: [
      { href: "/integrations/woocommerce", label: "WooCommerce integration" },
      { href: "/integrations/wordpress", label: "WordPress plugin" },
      { href: "/blog/woocommerce-sms-notifications-wordpress", label: "WooCommerce SMS blog" },
    ],
    primaryCta: { href: "/integrations/wordpress", label: "Get WordPress plugin" },
    secondaryCta: { href: "/integrations/woocommerce", label: "WooCommerce setup" },
  },
  {
    slug: "paystack-sms",
    title: "Paystack SMS — Payment Confirmation for WooCommerce | SplitSMS",
    h1: "Paystack SMS for WooCommerce Stores",
    excerpt:
      "Send Paystack payment confirmation SMS when customers pay on your WooCommerce store. Order placed + payment complete templates, webhook-safe, Ghana-ready.",
    keywords: [
      "Paystack SMS",
      "Paystack WooCommerce SMS",
      "Paystack payment SMS",
      "Paystack order notification",
      "WooCommerce Paystack SMS",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "Paystack handles checkout on your WordPress store; SplitSMS sends the SMS your customer reads. When Paystack confirms payment, WooCommerce fires payment complete — SplitSMS sends your template with {order_total}, {order_id}, and {paystack_reference}.",
        ],
      },
      {
        heading: "Webhook-safe payment SMS",
        paragraphs: [
          "If the customer closes the browser after Paystack checkout, the Paystack webhook still marks the order paid. Enable Paid → processing in SplitSMS so payment SMS fires even when redirect fails.",
        ],
      },
      {
        heading: "Ghana shops on Paystack + WooCommerce",
        paragraphs: [
          "Top up SplitSMS in GHS via Paystack, register a Ghana Sender ID, and text billing phones on every successful MoMo or card payment — same plugin as Flutterwave and Stripe gateways.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does SplitSMS integrate directly with Paystack API?",
        answer:
          "SplitSMS hooks WooCommerce order events — not Paystack directly. Install Paystack for WooCommerce, configure Paystack webhooks, and enable payment SMS in the SplitSMS plugin.",
      },
      {
        question: "Can I customize Paystack payment SMS text?",
        answer:
          "Yes. Edit templates in SplitSMS → Integrations with placeholders like {customer_name}, {order_total}, {paystack_reference}, and {site_name}.",
      },
    ],
    relatedLinks: [
      { href: "/integrations/paystack", label: "Paystack integration page" },
      { href: "/solutions/woocommerce-sms", label: "WooCommerce SMS" },
      { href: "/integrations/wordpress", label: "Download plugin" },
      { href: "/blog/paystack-sms-notifications-woocommerce", label: "Paystack SMS blog" },
    ],
    primaryCta: { href: "/integrations/paystack", label: "Paystack + SplitSMS guide" },
    secondaryCta: { href: "/signup", label: "Create SplitSMS account" },
  },
  {
    slug: "sms-integration",
    title: "SMS Integration — REST API, Google, WordPress & Webhooks | SplitSMS",
    h1: "SMS Integration for Apps, Google Workspace, WordPress & SaaS",
    excerpt:
      "SMS integration via REST API, Google Workspace, WordPress plugin, WooCommerce, webhooks, SplitSMS Connect, and SDKs. One API key for bulk SMS, OTP, and transactional messages.",
    keywords: [
      "SMS integration",
      "integrate SMS API",
      "SMS API integration",
      "Google Forms SMS",
      "Google Sheets SMS",
      "WordPress SMS integration",
      "WooCommerce SMS integration",
      "SMS webhook integration",
      "SplitSMS Connect",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "SMS integration should not take a quarter. SplitSMS gives you Google Contacts/Sheets/Forms connect, a REST API for custom apps, an official WordPress plugin for WooCommerce and forms, SplitSMS Connect for SaaS embeds, and delivery webhooks — one wallet, one set of API keys.",
        ],
      },
      {
        heading: "REST SMS API integration",
        paragraphs: [
          "Bearer auth, JSON bodies, send SMS, OTP verify, balance, contacts, campaigns. OpenAPI spec, Postman collection, sandbox keys, and HMAC-signed webhooks.",
        ],
      },
      {
        heading: "WordPress & WooCommerce integration",
        paragraphs: [
          "Install splitsms.zip, paste your API key, toggle WooCommerce, Contact Form 7, WPForms, Elementor Pro, and Crocoblock events. No Zapier required for order or form SMS.",
        ],
      },
      {
        heading: "Google Workspace integration",
        paragraphs: [
          "Connect Google for Contacts import, Sheets/Excel from Drive → SMS, Google Forms → SMS, and Smart Forms export to Sheets—without Zapier for the common loops. See /integrations/google.",
        ],
      },
      {
        heading: "SaaS & reseller integration",
        paragraphs: [
          "SplitSMS Connect provisions sub-accounts with wallets and sender IDs over REST. Resellers get white-label domains, custom pricing, and commission on client usage.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the fastest SMS integration path?",
        answer:
          "WordPress stores: install the SplitSMS plugin. Google Workspace teams: Connect Google. Custom apps: REST API with sandbox keys. SaaS platforms: SplitSMS Connect sub-accounts.",
      },
      {
        question: "Does SplitSMS support SMS webhooks?",
        answer:
          "Yes. Configure delivery webhooks in your dashboard. Payloads are signed with HMAC so your backend can verify authenticity.",
      },
    ],
    relatedLinks: [
      { href: "/integrations/google", label: "Google integration" },
      { href: "/integrations", label: "Integrations hub" },
      { href: "/docs/connect", label: "Connect API" },
      { href: "/api-docs", label: "REST API docs" },
    ],
    primaryCta: { href: "/api-docs", label: "Start with API docs" },
    secondaryCta: { href: "/integrations/google", label: "Connect Google" },
  },
  {
    slug: "retail",
    title: "Retail SMS — Orders, Restocks & Pickup Codes | SplitSMS",
    h1: "SMS for Retail & E-commerce",
    excerpt:
      "Send order confirmations, restock alerts, abandoned-cart nudges, and pickup codes by SMS. Works with WooCommerce, Paystack, and Flutterwave — or a till that has never seen a plugin.",
    keywords: [
      "retail SMS",
      "ecommerce SMS Ghana",
      "order confirmation SMS",
      "abandoned cart SMS",
      "restock alert SMS",
      "pickup code SMS",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "A shop text gets read in the queue at the bank. An email sits in a promotions tab until it dies there. SplitSMS gives retail and e-commerce teams the texts customers actually expect: order placed, payment received, restocked, ready for pickup — sent the moment your system says so, not whenever someone remembers to update a status page.",
        ],
      },
      {
        heading: "From checkout to pickup",
        paragraphs: [
          "WooCommerce, Paystack, and Flutterwave hook straight into the SplitSMS WordPress plugin — order events fire an SMS with no custom code. Running a physical till or a custom cart instead? The REST API takes the same job: one POST call per event, same delivery reports either side.",
          "Abandoned cart reminders, low-stock alerts to your own staff, and “it's back in stock” texts to customers who asked — all templates, not one-off scripts.",
        ],
      },
      {
        heading: "Built for Ghana rates, not a US price list",
        paragraphs: [
          "Top up in GHS via Paystack, register a Sender ID your customers already recognize, and send to 190+ countries when the order ships across a border. No monthly minimum for a shop that has quiet weeks.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need a developer to add SMS to my shop?",
        answer:
          "Not for WooCommerce. Install the SplitSMS plugin, connect Paystack or Flutterwave, and switch on order templates from wp-admin. Custom carts or POS systems use the REST API — that is the one path that benefits from a developer.",
      },
      {
        question: "Can I send abandoned-cart and restock texts, not just order receipts?",
        answer:
          "Yes. Any event your store already fires — cart abandoned, back in stock, pickup ready — can trigger a template through the plugin or a single API call. It is the same wallet and Sender ID as your order confirmations.",
      },
    ],
    relatedLinks: [
      { href: "/solutions/woocommerce-sms", label: "WooCommerce SMS notifications" },
      { href: "/solutions/paystack-sms", label: "Paystack SMS for WooCommerce" },
      { href: "/integrations/woocommerce", label: "WooCommerce integration setup" },
      { href: "/pricing", label: "Per-country SMS pricing" },
    ],
    primaryCta: { href: "/signup", label: "Start free — 5 SMS credits" },
    secondaryCta: { href: "/solutions/woocommerce-sms", label: "See WooCommerce SMS" },
  },
  {
    slug: "fintech",
    title: "Fintech SMS — OTP, Debit Alerts & Device Checks | SplitSMS",
    h1: "SMS for Banks, Wallets & Fintech",
    excerpt:
      "OTP for login and payouts, debit and credit alerts, new-device warnings — sent through routes built for the one message that cannot arrive late.",
    keywords: [
      "fintech SMS",
      "bank SMS alerts Ghana",
      "OTP for fintech",
      "mobile money SMS",
      "debit alert SMS",
      "SMS for wallets",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "A fintech does not get a second chance on a login code. If the OTP is late, the user assumes the app is broken and calls support — or worse, gives up on the transaction. SplitSMS treats OTP as a first-class endpoint with sandbox testing, HMAC-signed delivery webhooks, and multi-carrier failover, not a bulk-SMS feature bolted on for compliance.",
        ],
      },
      {
        heading: "Every account event, one wallet",
        paragraphs: [
          "Login OTP, payout confirmation, debit and credit alerts, new-device sign-in warnings, and password resets all route through the same API key and Sender ID — so finance does not reconcile three SMS invoices for one product.",
        ],
      },
      {
        heading: "Routed for Ghana and cross-border transfers",
        paragraphs: [
          "MTN, Telecel, and international carriers across 190+ countries, with failover when a route degrades. Delivery webhooks tell your backend whether the code actually landed, so you can offer a voice-call fallback instead of guessing.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is SplitSMS fast enough for login OTP?",
        answer:
          "Routes carry multi-carrier failover so a code still lands if one network is congested. Sandbox keys let you measure real delivery time on your own numbers before committing production traffic.",
      },
      {
        question: "Can I separate OTP traffic from marketing SMS?",
        answer:
          "Yes. Use dedicated Sender IDs and API keys per use case — carriers and customers both notice when promotional copy and one-time codes share an identity, so keep them apart from the start.",
      },
    ],
    relatedLinks: [
      { href: "/solutions/otp", label: "OTP SMS API" },
      { href: "/api-docs", label: "REST API reference" },
      { href: "/security", label: "Security & data handling" },
      { href: "/pricing", label: "Per-country SMS pricing" },
    ],
    primaryCta: { href: "/signup", label: "Get sandbox API keys" },
    secondaryCta: { href: "/solutions/otp", label: "See the OTP API" },
  },
  {
    slug: "government",
    title: "SMS for Government & Public Sector | SplitSMS",
    h1: "SMS for Government & Public Sector",
    excerpt:
      "Reach citizens with notices, appointment reminders, and programme updates by SMS. Sender ID registration and Ghana-first billing, without an enterprise procurement cycle.",
    keywords: [
      "government SMS Ghana",
      "public sector SMS",
      "citizen notification SMS",
      "SMS for ministries",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "A notice printed at the district office reaches the people who happened to walk past it. The same notice by SMS reaches every registered phone number on the list — a permit renewal window, a clinic date, a programme deadline — without a poster campaign or a radio slot.",
        ],
      },
      {
        heading: "Registration through delivery, in one flow",
        paragraphs: [
          "Smart Forms collects citizen or beneficiary details on a link or QR code at the point of registration, saves the number to a group, and confirms with an SMS on the spot. When the appointment date or programme update comes around, the same group receives the reminder — no re-keying names from a paper register.",
        ],
      },
      {
        heading: "A Sender ID people recognize as official",
        paragraphs: [
          "Register a Sender ID for the department or programme so texts do not arrive from an anonymous long number. Delivery reports show what reached MTN, Telecel, and other networks, useful when a programme has to account for outreach, not just intention.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can a government department register its own Sender ID?",
        answer:
          "Yes. Submit the department or programme name for Sender ID approval from the dashboard. SplitSMS tracks approval status and fails over to a backup route if one carrier has an issue.",
      },
      {
        question: "How do we collect phone numbers before sending programme updates?",
        answer:
          "Smart Forms handles registration on a shared link or QR code at the point of contact, saves respondents into a contact group automatically, and sends a confirmation text — no separate database or spreadsheet import step.",
      },
    ],
    relatedLinks: [
      { href: "/smart-forms", label: "Smart Forms registration" },
      { href: "/pricing", label: "Per-country SMS pricing" },
      { href: "/security", label: "Security & data handling" },
      { href: "/solutions", label: "All solutions" },
    ],
    primaryCta: { href: "/signup", label: "Start free — 5 SMS credits" },
    secondaryCta: { href: "/smart-forms", label: "See Smart Forms" },
  },
];

export function getSeoLandingPage(slug: string) {
  return seoLandingPages.find((p) => p.slug === slug);
}

export function getAllSeoLandingSlugs() {
  return seoLandingPages.map((p) => p.slug);
}
