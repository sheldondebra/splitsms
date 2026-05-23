export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  published: string;
  sections: { heading?: string; paragraphs: string[] }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "why-your-business-needs-bulk-sms",
    title: "Why Your Business Needs Bulk SMS in 2026",
    excerpt:
      "SMS open rates beat email by miles. Here is why bulk SMS belongs in every Ghanaian business communication stack.",
    category: "SMS Marketing",
    readTime: "5 min read",
    published: "2026-05-01",
    sections: [
      {
        paragraphs: [
          "Customers do not live in their inbox — they live on their phones. Bulk SMS puts your message directly in the one app people check within minutes of waking up. For retailers, clinics, banks, and SaaS teams in Ghana, that immediacy translates into real revenue, not vanity metrics.",
          "SplitSMS makes bulk SMS accessible without enterprise contracts. Upload contacts, personalize messages, schedule campaigns, and track delivery — from GHS 0.029 per segment in Ghana with 5 free credits to start.",
        ],
      },
      {
        heading: "SMS gets read — email gets buried",
        paragraphs: [
          "Industry averages put SMS open rates above 90%, while email often sits below 25%. When you send a flash sale alert, appointment reminder, or OTP code, SMS is the channel that actually reaches people.",
          "Bulk SMS is not just for promotions. Transactional SMS — order confirmations, delivery updates, payment receipts — builds trust because customers expect timely text updates.",
        ],
      },
      {
        heading: "Built for Ghana, ready for the world",
        paragraphs: [
          "SplitSMS routes through trusted carriers including mNotify for Ghana, with coverage across Nigeria and 190+ countries. Register an approved Sender ID so recipients see your brand name, not a random number.",
          "Pay with Paystack, top up your wallet, and send from a dashboard your team can learn in one afternoon — or integrate our REST SMS API if you are building an app.",
        ],
      },
      {
        heading: "Start sending today",
        paragraphs: [
          "You do not need a six-month implementation project. Sign up, claim your free SMS credits, import a CSV, and send your first bulk campaign in under five minutes. That is why growing businesses choose SplitSMS over cluttered legacy portals.",
        ],
      },
    ],
  },
  {
    slug: "bulk-sms-vs-email-marketing",
    title: "Bulk SMS vs Email: When to Use Each Channel",
    excerpt:
      "Email is great for long-form content. SMS wins on urgency, open rates, and Ghana mobile-first audiences.",
    category: "Strategy",
    readTime: "4 min read",
    published: "2026-04-18",
    sections: [
      {
        paragraphs: [
          "Smart marketers use both email and SMS — but for different jobs. Email carries newsletters, PDFs, and detailed offers. SMS handles what must be seen now: OTP codes, same-day promotions, appointment reminders, and delivery alerts.",
        ],
      },
      {
        heading: "When SMS wins",
        paragraphs: [
          "Choose bulk SMS when timing matters. Flash sales, event reminders, and payment confirmations need instant delivery. SMS segments are short by design — clear, actionable, and impossible to ignore.",
          "In Ghana and across Africa, mobile money and phone-first commerce make SMS the natural fit for transactional updates customers already expect.",
        ],
      },
      {
        heading: "When email wins",
        paragraphs: [
          "Use email for rich content, attachments, and nurture sequences that do not require immediate 98% open rate. Combine both: email the full catalog, SMS the 24-hour discount code.",
        ],
      },
      {
        heading: "One platform for SMS",
        paragraphs: [
          "SplitSMS gives you bulk campaigns, contact groups, scheduling, and delivery reports — plus an SMS API for developers. Start with 5 free credits and scale pay-as-you-go.",
        ],
      },
    ],
  },
  {
    slug: "choose-sms-gateway-ghana",
    title: "How to Choose an SMS Gateway in Ghana",
    excerpt:
      "Sender IDs, pricing transparency, API quality, and local support — what to look for before you commit.",
    category: "Guide",
    readTime: "6 min read",
    published: "2026-04-02",
    sections: [
      {
        paragraphs: [
          "Not all SMS gateways are equal. Some hide pricing behind sales calls. Others offer APIs but no campaign UI. Here is a practical checklist for teams evaluating bulk SMS in Ghana.",
        ],
      },
      {
        heading: "Transparent per-SMS pricing",
        paragraphs: [
          "You should see country rates before you sign up. SplitSMS publishes live pricing — Ghana from around GHS 0.029 per segment — with a wallet you top up via Paystack. No surprise invoices.",
        ],
      },
      {
        heading: "Sender ID and deliverability",
        paragraphs: [
          "Recipients trust messages from your brand name. Look for a platform with a clear Sender ID registration workflow. SplitSMS handles pending → approved states and routes through carriers with failover for higher delivery rates.",
        ],
      },
      {
        heading: "Dashboard plus API",
        paragraphs: [
          "Marketing teams need a bulk SMS UI. Developers need REST endpoints for OTP and webhooks. SplitSMS delivers both from one account — Postman collection and sandbox keys included.",
        ],
      },
      {
        heading: "Local operator you can call",
        paragraphs: [
          "SplitSMS is operated by Tecunit Ghana. When you need help with routing, billing, or integration, you reach a team that understands the local market — not a ticket queue three time zones away.",
        ],
      },
    ],
  },
  {
    slug: "otp-sms-api-developer-guide",
    title: "OTP SMS API: Ship Verification in Minutes",
    excerpt:
      "Send and verify one-time passwords with SplitSMS REST API — sandbox testing, webhooks, and production-ready security.",
    category: "Developers",
    readTime: "5 min read",
    published: "2026-03-20",
    sections: [
      {
        paragraphs: [
          "Every login flow, checkout, and password reset needs reliable OTP delivery. SplitSMS exposes send and verify endpoints so you can integrate SMS verification without managing carrier relationships yourself.",
        ],
      },
      {
        heading: "Why OTP over SMS",
        paragraphs: [
          "SMS OTP is the global standard for two-factor authentication. Users already expect a six-digit code on their phone. With SplitSMS, you get fast delivery across Ghana and 190+ countries through multi-carrier routing.",
        ],
      },
      {
        heading: "Developer experience",
        paragraphs: [
          "Create API keys from your dashboard, test in sandbox mode without charges, and promote to production when ready. Delivery webhooks notify your backend when messages succeed or fail — signed with HMAC for security.",
        ],
      },
      {
        heading: "Beyond OTP",
        paragraphs: [
          "The same API powers bulk campaigns, balance checks, and contact management. One wallet, one set of keys, full delivery logs. Sign up for 5 free SMS credits and ship your first verification flow this week.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogSlugs() {
  return blogPosts.map((p) => p.slug);
}
