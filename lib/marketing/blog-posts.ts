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
          "SplitSMS is operated by Tecunit. When you need help with routing, billing, or integration, you reach a team that understands the local market — not a ticket queue three time zones away.",
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
  {
    slug: "woocommerce-sms-notifications-wordpress",
    title: "WooCommerce SMS Notifications: Order Alerts That Customers Actually Read",
    excerpt:
      "Send automatic SMS when customers pay with Paystack, Flutterwave, or card — order placed, paid, shipped, and more.",
    category: "Integrations",
    readTime: "6 min read",
    published: "2026-05-18",
    sections: [
      {
        paragraphs: [
          "E-commerce customers expect a text when their order is confirmed and when payment goes through. Email gets buried; SMS lands in seconds. If you run WooCommerce in Ghana or Nigeria, pairing your store with a reliable bulk SMS platform closes the loop between checkout and customer trust.",
        ],
      },
      {
        heading: "What to automate with SMS",
        paragraphs: [
          "Order placed — reassure the buyer immediately after checkout. Payment received — critical when you use Paystack or Flutterwave; many gateways move orders to processing before email fires. Processing and completed — keep buyers informed without them refreshing your site.",
          "SplitSMS WordPress plugin hooks into WooCommerce events. You write templates with placeholders like {customer_name}, {order_id}, and {order_total} — no custom code required.",
        ],
      },
      {
        heading: "Paystack and Flutterwave on WooCommerce",
        paragraphs: [
          "SplitSMS does not process payments. Your customer pays through Paystack or Flutterwave on your store; SplitSMS sends SMS when WooCommerce marks the order paid. Enable Payment complete and Paid → processing in the plugin so webhook delays do not miss a message.",
        ],
      },
      {
        heading: "Get started",
        paragraphs: [
          "Install the free SplitSMS plugin from splitsms.com, connect your API key, enable WooCommerce under Integrations, and place a test order. Check SplitSMS → Logs in wp-admin to confirm delivery.",
        ],
      },
    ],
  },
  {
    slug: "sms-marketing-copy-that-converts",
    title: "How to Write Bulk SMS Copy That Converts (Without Sounding Spammy)",
    excerpt:
      "Short messages, clear CTAs, and local tone — a practical framework for SMS campaigns in Ghana and Africa.",
    category: "SMS Marketing",
    readTime: "5 min read",
    published: "2026-05-12",
    sections: [
      {
        paragraphs: [
          "A 160-character SMS is not a billboard. The best bulk SMS campaigns say one thing, to one audience, with one action. Here is how marketing teams in Accra, Lagos, and beyond write messages people actually tap.",
        ],
      },
      {
        heading: "Lead with value, not your logo",
        paragraphs: [
          "Open with what the reader gets: a discount, a deadline, or a status update. Save your brand name for the end or use a registered Sender ID so the From line already shows SplitSMS or your business name.",
          "Bad: We are XYZ Company and we have exciting news. Good: 20% off today only at XYZ — show this SMS at checkout. Ends 6pm.",
        ],
      },
      {
        heading: "Personalize when it matters",
        paragraphs: [
          "Use {firstName} or {name} from your contact list — SplitSMS supports placeholders in campaigns and templates. Personalization lifts reply rates without doubling your segment count.",
        ],
      },
      {
        heading: "Respect opt-outs and timing",
        paragraphs: [
          "Send promotional SMS during business hours. Always include how to opt out for marketing lists. Transactional SMS (orders, OTP) are expected anytime; promos are not.",
        ],
      },
    ],
  },
  {
    slug: "transactional-sms-vs-promotional-sms",
    title: "Transactional SMS vs Promotional SMS: Know the Difference",
    excerpt:
      "OTP, receipts, and shipping alerts are not the same as flash sales. Here is how to use each type correctly.",
    category: "Guide",
    readTime: "4 min read",
    published: "2026-05-08",
    sections: [
      {
        paragraphs: [
          "Regulators and customers treat transactional and promotional messages differently. Mixing them in one template hurts deliverability and trust. SplitSMS helps you send both — from one wallet — with clear use cases.",
        ],
      },
      {
        heading: "Transactional SMS",
        paragraphs: [
          "These are messages the customer requested or expects: OTP codes, password resets, order confirmations, appointment reminders, and payment receipts. They are time-sensitive and usually exempt from marketing opt-in rules when tied to an existing relationship.",
        ],
      },
      {
        heading: "Promotional SMS",
        paragraphs: [
          "Sales, events, re-engagement, and newsletters-by-SMS need consent. Build lists from sign-ups, past buyers who agreed to marketing, or double opt-in forms. SplitSMS contact groups and CSV import make segmentation simple.",
        ],
      },
      {
        heading: "One platform, two workflows",
        paragraphs: [
          "Use the dashboard for campaigns and the REST API for OTP. Same Sender ID, same delivery reports, same transparent pricing from GHS 0.029 per segment in Ghana.",
        ],
      },
    ],
  },
  {
    slug: "appointment-reminder-sms-clinics-salons",
    title: "Appointment Reminder SMS for Clinics, Salons & Service Businesses",
    excerpt:
      "Cut no-shows with automated text reminders — templates, timing, and WordPress booking plugins.",
    category: "SMS Marketing",
    readTime: "5 min read",
    published: "2026-05-05",
    sections: [
      {
        paragraphs: [
          "A missed appointment is lost revenue. SMS reminders reach patients and clients who ignore email. Clinics, dental offices, salons, and tutors across Ghana use bulk SMS to confirm bookings 24 hours before the slot.",
        ],
      },
      {
        heading: "What to send",
        paragraphs: [
          "Confirmation immediately after booking: Hi {firstName}, your appointment is booked for {date} at {time}. Reply YES to confirm. Reminder 24 hours before: Reminder: see you tomorrow at {time} — {business_name}. Optional follow-up after the visit for feedback or rebooking.",
        ],
      },
      {
        heading: "WordPress and Crocoblock",
        paragraphs: [
          "If you use JetBooking or JetAppointment on WordPress, the SplitSMS plugin can fire SMS on booking created, confirmed, or cancelled — plus scheduled reminders via WP-Cron. Map your phone field once under SplitSMS → Crocoblock.",
        ],
      },
      {
        heading: "Start small",
        paragraphs: [
          "Import this week's appointments as a CSV, send one reminder campaign, and measure no-show rate. SplitSMS gives you 5 free credits to test before you scale.",
        ],
      },
    ],
  },
  {
    slug: "school-fee-alerts-sms-education-ghana",
    title: "School Fee & Exam Alerts by SMS: A Ghana Education Story",
    excerpt:
      "How schools and training centres use bulk SMS for fee reminders, exam timetables, and parent communication.",
    category: "Stories",
    readTime: "6 min read",
    published: "2026-04-28",
    sections: [
      {
        paragraphs: [
          "Private schools and training academies in Ghana juggle hundreds of parents who need timely updates — not another email in spam. SMS reaches guardians on any phone, including basic feature phones without data.",
        ],
      },
      {
        heading: "Fee reminders that get paid",
        paragraphs: [
          "A polite SMS three days before term fees are due: Dear parent, {student_name}'s fees of GHS {amount} are due on {date}. Pay via MoMo or at the office. — {school_name}. Schools report faster collections when reminders are consistent and short.",
        ],
      },
      {
        heading: "Exam and event broadcasts",
        paragraphs: [
          "Bulk SMS blasts for exam timetables, PTA meetings, and weather closures take minutes. Upload a class list CSV, segment by grade, and send from the SplitSMS dashboard — no IT project required.",
        ],
      },
      {
        heading: "Privacy and trust",
        paragraphs: [
          "Use school-branded Sender IDs where approved. Keep messages factual. SplitSMS logs every send so administrators can audit who received what and when.",
        ],
      },
    ],
  },
  {
    slug: "real-estate-sms-leads-ghana",
    title: "Real Estate SMS: How Agents in Ghana Follow Up Faster",
    excerpt:
      "Open-house invites, new listing alerts, and viewing confirmations — SMS workflows for property teams.",
    category: "Stories",
    readTime: "5 min read",
    published: "2026-04-22",
    sections: [
      {
        paragraphs: [
          "Property buyers move fast. The agent who texts first often wins the viewing. Real estate teams in Accra and Kumasi use bulk SMS to nurture leads who registered on a website form or visited an open house.",
        ],
      },
      {
        heading: "High-intent messages",
        paragraphs: [
          "New listing alert: 3-bed East Legon — GHS 850k. Viewing Sat 10am. Reply CALL to book. Open house reminder: Tomorrow 2pm at {address}. Bring ID. Follow-up after viewing: Thanks for visiting — here's the brochure link.",
        ],
      },
      {
        heading: "Integrate with your stack",
        paragraphs: [
          "Connect WPForms or Elementor forms on your WordPress site to SplitSMS so every inquiry triggers an instant auto-reply SMS while you call the hottest leads.",
        ],
      },
    ],
  },
  {
    slug: "sms-compliance-opt-out-ghana",
    title: "SMS Compliance in Ghana: Opt-Outs, Sender IDs & Best Practices",
    excerpt:
      "Stay on the right side of customers and carriers — consent, branding, and what not to send.",
    category: "Guide",
    readTime: "5 min read",
    published: "2026-04-15",
    sections: [
      {
        paragraphs: [
          "Bulk SMS is powerful because it is personal. That means responsibility: get consent for marketing, register your Sender ID, and honor opt-out requests promptly.",
        ],
      },
      {
        heading: "Sender ID registration",
        paragraphs: [
          "Recipients should see your business name, not a random long number. SplitSMS guides you through Sender ID approval for Ghana — submit your brand, wait for carrier approval, then send with trust.",
        ],
      },
      {
        heading: "Marketing consent",
        paragraphs: [
          "Do not buy phone lists. Build opt-in audiences from customers, form sign-ups, and checkout checkboxes. Document consent where possible.",
        ],
      },
      {
        heading: "Opt-out language",
        paragraphs: [
          "Include Reply STOP or contact instructions on promotional campaigns. Remove numbers that opt out from future marketing groups immediately.",
        ],
      },
    ],
  },
  {
    slug: "black-friday-sms-campaign-checklist",
    title: "Black Friday & Holiday SMS Campaign Checklist for Retailers",
    excerpt:
      "Plan timing, offers, and delivery capacity before peak season — a repeatable SMS playbook.",
    category: "SMS Marketing",
    readTime: "4 min read",
    published: "2026-04-10",
    sections: [
      {
        paragraphs: [
          "Holiday SMS drives foot traffic and online carts — if you plan early. Retailers who wait until November to test Sender IDs and wallet balance often hit delays when carriers are busiest.",
        ],
      },
      {
        heading: "Two weeks before",
        paragraphs: [
          "Verify Sender ID is approved. Top up wallet via Paystack. Clean your contact list — remove invalid numbers. Send a soft teaser: Something big drops Friday — VIPs get early access.",
        ],
      },
      {
        heading: "Launch day",
        paragraphs: [
          "Send morning and evening segments to different time zones if you sell across West Africa. One clear CTA per message. Track delivery reports in SplitSMS and pause if failure rates spike.",
        ],
      },
      {
        heading: "After the sale",
        paragraphs: [
          "Thank-you SMS to buyers. Win-back SMS to cart abandoners who did not convert — keep it friendly, not desperate.",
        ],
      },
    ],
  },
  {
    slug: "restaurant-food-delivery-sms-orders",
    title: "Restaurant & Food Delivery SMS: From Order to Door",
    excerpt:
      "Order confirmed, preparing, out for delivery — SMS updates customers love for food businesses.",
    category: "Stories",
    readTime: "4 min read",
    published: "2026-04-05",
    sections: [
      {
        paragraphs: [
          "Hungry customers stare at their phones anyway. A short SMS when the rider leaves the kitchen cuts Where is my food? calls and boosts repeat orders on WhatsApp-heavy markets like Ghana.",
        ],
      },
      {
        heading: "A simple status flow",
        paragraphs: [
          "Order received — ETA 35 mins. Kitchen started — almost there. Rider en route — track: {link}. Delivered — enjoy! Rate us: {link}.",
        ],
      },
      {
        heading: "WooCommerce and custom apps",
        paragraphs: [
          "WooCommerce restaurants can use the SplitSMS plugin on status changes. Custom apps can hit our REST API on each kitchen milestone — same wallet, same logs.",
        ],
      },
    ],
  },
  {
    slug: "wordpress-splitsms-plugin-setup-guide",
    title: "SplitSMS WordPress Plugin: Setup Guide for Forms & WooCommerce",
    excerpt:
      "Install, connect your API key, and enable CF7, WPForms, Elementor, and Crocoblock in under 15 minutes.",
    category: "Integrations",
    readTime: "7 min read",
    published: "2026-03-28",
    sections: [
      {
        paragraphs: [
          "The official SplitSMS plugin connects WordPress and WooCommerce to your SplitSMS account. Send transactional SMS from orders and forms without writing PHP.",
        ],
      },
      {
        heading: "Install the plugin",
        paragraphs: [
          "Download splitsms.zip from splitsms.com/integrations. In wp-admin go to Plugins → Add New → Upload. Activate. If you see Plugin file does not exist, delete old splitsms folders under wp-content/plugins and upload a fresh zip (v1.3+ uses a flat archive).",
        ],
      },
      {
        heading: "Connect API key",
        paragraphs: [
          "SplitSMS → Settings. Paste your API key from the SplitSMS dashboard (App connections). Set Sender ID and admin phone. Click Test connection and Send test SMS.",
        ],
      },
      {
        heading: "Enable integrations",
        paragraphs: [
          "SplitSMS → Integrations shows detected plugins: WooCommerce, Paystack gateways, WPForms, Contact Form 7, Elementor Pro. Toggle what you need and save message templates. Crocoblock Jet modules live under SplitSMS → Crocoblock.",
        ],
      },
    ],
  },
  {
    slug: "nigeria-sms-gateway-pricing-tips",
    title: "Sending SMS to Nigeria: Pricing, Routing & Best Practices",
    excerpt:
      "Reach Nigerian customers with transparent rates, dual-route failover, and local compliance tips.",
    category: "Guide",
    readTime: "5 min read",
    published: "2026-03-15",
    sections: [
      {
        paragraphs: [
          "Nigeria is one of Africa's largest SMS markets. Fintech, e-commerce, and logistics teams send OTP and marketing SMS at scale — but pricing and deliverability vary by route and operator.",
        ],
      },
      {
        heading: "Transparent pricing",
        paragraphs: [
          "SplitSMS publishes Nigeria rates in your dashboard before you send. Top up once, send to Ghana and Nigeria from the same wallet — no separate contracts per country.",
        ],
      },
      {
        heading: "OTP and banking",
        paragraphs: [
          "Use the REST API for verification codes with sandbox keys for staging. Delivery webhooks confirm success to your backend — critical for login and transfer flows.",
        ],
      },
      {
        heading: "Scale with confidence",
        paragraphs: [
          "Multi-carrier routing with failover improves delivery when one path is congested. Monitor campaign reports and adjust send windows for Lagos peak hours.",
        ],
      },
    ],
  },
  {
    slug: "customer-support-sms-two-way-future",
    title: "Why SMS Still Beats Chat Apps for Critical Business Alerts",
    excerpt:
      "WhatsApp needs data; SMS works on every phone. When reliability matters, SMS wins.",
    category: "Stories",
    readTime: "4 min read",
    published: "2026-03-08",
    sections: [
      {
        paragraphs: [
          "Chat apps are great for conversations. SMS is still the universal alert channel — every mobile phone receives it, no app install, no data bundle required. That is why banks, hospitals, and logistics platforms keep SMS in their stack.",
        ],
      },
      {
        heading: "When to choose SMS",
        paragraphs: [
          "OTP and fraud alerts. Payment and delivery confirmations. Appointment reminders to older demographics. Rural areas with inconsistent mobile data.",
        ],
      },
      {
        heading: "Combine channels",
        paragraphs: [
          "Email the receipt PDF. SMS the payment received line. WhatsApp the marketing promo if they opted in. SplitSMS handles the SMS layer so your team does not negotiate with carriers directly.",
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

export function getSortedBlogPosts() {
  return [...blogPosts].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );
}

export function getFeaturedBlogPosts(limit = 3) {
  return getSortedBlogPosts().slice(0, limit);
}

export function getBlogCategories() {
  const cats = new Set(blogPosts.map((p) => p.category));
  return [...cats].sort();
}
