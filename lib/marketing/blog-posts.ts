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
      {
        heading: "Elementor Pro Forms",
        paragraphs: [
          "For Elementor-built sites, use SplitSMS → Forms to auto-detect every Elementor Pro form — toggle SMS per form, pick the phone field, and edit the message without opening the page builder. Or edit a form in Elementor → Actions After Submit → add SplitSMS Notification for per-form phone mapping, custom templates, sender ID override, and admin copy.",
          "Set a Tel field Field ID (Advanced → Field ID, e.g. phone) so SplitSMS reads the right number. See our full Elementor Pro Forms SMS guide for both setup paths, template variables, and skip-log debugging.",
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
  {
    slug: "jetformbuilder-send-sms-splitsms-wordpress",
    title: "JetFormBuilder SMS: Send Text Messages After Any Form Submit",
    excerpt:
      "Add SplitSMS as a native JetFormBuilder Post Submit Action — per-form templates, phone mapping, and no custom PHP.",
    category: "WordPress",
    readTime: "7 min read",
    published: "2026-05-26",
    sections: [
      {
        paragraphs: [
          "JetFormBuilder powers thousands of WordPress sites — booking forms, lead capture, multi-step applications, and checkout flows built inside the block editor. When someone submits, you usually send email. Email is slow, gets filtered, and customers rarely read it on the go. SMS closes the gap in seconds.",
          "SplitSMS plugin v1.6.0 adds a native Send SMS (SplitSMS) Post Submit Action inside JetFormBuilder. Drag the action onto your form, map the phone field, write a short template, and every successful submit triggers a text through your SplitSMS wallet — no Zapier, no webhook middleware, no PHP snippets.",
        ],
      },
      {
        heading: "Why JetFormBuilder + SMS beats email-only workflows",
        paragraphs: [
          "Form submissions are high-intent moments. A job applicant, a clinic patient booking a slot, or a buyer requesting a quote is actively waiting for confirmation. SMS open rates exceed 90% on mobile-first markets like Ghana and Nigeria. A single line — Thanks {field_name}, we received your request. Ref #{record_id}. — reduces support calls and builds trust immediately.",
          "JetFormBuilder already exposes field values to Post Submit Actions. SplitSMS reads those values at submit time, normalizes the phone number, and sends through the same API your dashboard uses. Delivery logs appear under SplitSMS → Logs in wp-admin and in your SplitSMS developer portal.",
        ],
      },
      {
        heading: "How to add Send SMS in JetFormBuilder",
        paragraphs: [
          "Install the SplitSMS WordPress plugin from splitsms.com/integrations (v1.6.0 or later). Connect your API key under SplitSMS → Settings — paste the full key (~56 characters), set your approved Sender ID, and run Test connection.",
          "Open your JetFormBuilder form → Post Submit Actions → Add Action → Send SMS (SplitSMS). Choose the phone field (Tel or Text field with a valid number). Write your message body using JetFormBuilder macros for field values — for example Hi %field_name%, your booking on %field_date% is confirmed.",
          "Save the form and submit a test entry with your own mobile number. Check SplitSMS → Logs for a delivered status before going live.",
        ],
      },
      {
        heading: "Per-form control vs global auto-SMS",
        paragraphs: [
          "The native action gives you per-form templates — different messages for contact vs booking vs payment forms. SplitSMS also supports optional global JetFormBuilder auto-SMS under SplitSMS → Crocoblock, but when the Send SMS action is present on a form, the plugin skips the global hook to avoid duplicate texts.",
          "Use the action for production forms where message copy matters. Use global auto-SMS only for quick experiments or legacy forms you have not migrated yet.",
        ],
      },
      {
        heading: "Templates, placeholders, and admin alerts",
        paragraphs: [
          "Keep messages under 160 characters when possible to stay in one SMS segment. Include {site_name} or your brand Sender ID so recipients know who sent the text. For internal alerts, add a second Post Submit Action or enable admin phone notifications in SplitSMS settings so your team gets pinged on high-value leads.",
          "SplitSMS does not charge WordPress separately — each SMS debits your wallet at published Ghana rates (from around GHS 0.029 per segment). Top up via Paystack from the SplitSMS dashboard.",
        ],
      },
      {
        heading: "SEO takeaway for WordPress developers",
        paragraphs: [
          "If you build client sites with Crocoblock and JetFormBuilder, advertising SMS-ready forms is a differentiator. Search terms like JetFormBuilder SMS notification, WordPress form SMS Ghana, and send SMS after form submit map directly to this workflow. Install SplitSMS once per site, configure per form in minutes, and ship transactional SMS without leaving WordPress admin.",
        ],
      },
    ],
  },
  {
    slug: "elementor-pro-forms-sms-splitsms-wordpress",
    title: "Elementor Pro Forms SMS: SplitSMS Notification & Forms Manager",
    excerpt:
      "Two ways to send SMS from Elementor Pro forms — native SplitSMS Notification action and auto-detected Forms manager toggles.",
    category: "WordPress",
    readTime: "7 min read",
    published: "2026-07-02",
    sections: [
      {
        paragraphs: [
          "Elementor Pro powers landing pages, quote forms, and lead capture on thousands of WordPress sites. When someone submits a form, email is the default — and email is slow, gets filtered, and rarely gets read on mobile-first markets like Ghana and Nigeria. SMS closes the loop in seconds.",
          "SplitSMS plugin v1.7.2 ships two Elementor Pro integrations: a native SplitSMS Notification action inside the form builder, and a Forms manager that auto-detects every Elementor form on your site. Pick the path that fits your workflow — per-form control in Elementor, or bulk toggles from SplitSMS → Forms.",
        ],
      },
      {
        heading: "Why Elementor Pro + SMS beats email-only forms",
        paragraphs: [
          "Form submissions are high-intent moments. A prospect requesting a quote, a patient booking a consultation, or a buyer asking about availability is actively waiting for confirmation. SMS open rates exceed 90% on mobile. A single line — Hi {name}, we received your request on {site_name}. We will call you soon. — reduces support calls and builds trust immediately.",
          "Elementor Pro forms fire elementor_pro/forms/new_record after submit. SplitSMS hooks that event (plus a mail_sent fallback for edge cases across Elementor versions), normalizes the phone number, and sends through the same API your dashboard uses. Delivery logs appear under SplitSMS → Logs in wp-admin and on your splitsms.com dashboard.",
        ],
      },
      {
        heading: "Method 1: SplitSMS Notification in Actions After Submit",
        paragraphs: [
          "Recommended for production forms where message copy matters. Install the SplitSMS WordPress plugin from splitsms.com/integrations (v1.7.2 or later). Connect your API key under SplitSMS → Settings — paste the full key (~56 characters), set your approved Sender ID, and run Test connection.",
          "Edit your page in Elementor → select the Form widget → Actions After Submit → Add Action → SplitSMS Notification. Choose Send to: phone from form field, custom phone with field macros, or admin phone only. Map the Tel field ID (Advanced → Field ID, e.g. phone). Write your message using placeholders like {name}, {email}, {form_name}, and {phone}.",
          "Optional controls: Sender ID override per form, Also notify admin toggle with a separate admin message template. Save and submit a test entry with your own mobile number. Check SplitSMS → Logs for delivered status before going live.",
        ],
      },
      {
        heading: "Method 2: Forms manager — auto-detect every Elementor form",
        paragraphs: [
          "SplitSMS → Forms scans your site for Elementor Pro forms embedded in pages, posts, and Elementor library templates. Click Refresh list when you add new forms. Toggle Send SMS per form, pick the phone field from a dropdown, edit the message template, and save — no need to open the Elementor editor.",
          "Best for agencies managing many client sites, quick rollouts across existing forms, or when non-technical owners maintain SMS copy from wp-admin without touching the page builder.",
        ],
      },
      {
        heading: "Global Elementor integration (Integrations page)",
        paragraphs: [
          "SplitSMS → Integrations → Elementor Pro Forms enables automatic SMS for all detected forms using one global template. Set the default phone field ID, optional comma-separated form names to filter (Contact Form, Quote — empty means all forms), and a shared message template with variables: {site_name}, {name}, {email}, {subject}, {message}, {form_name}, {form_id}, {phone}, {field_phone}.",
          "Use the global toggle for quick experiments or legacy forms. When a form has the native SplitSMS Notification action configured, the plugin skips duplicate global hooks for that submission.",
        ],
      },
      {
        heading: "Phone field setup in Elementor",
        paragraphs: [
          "Add a Tel field type to your Elementor form — not a plain Text field labeled Phone. Open the field → Advanced → Field ID and set a clear ID like phone or mobile. Enter that same ID in SplitSMS (Forms manager dropdown, Integrations panel, or SplitSMS Notification action).",
          "SplitSMS also scans common field labels and IDs (phone, mobile, tel) as fallbacks, but explicit Field IDs prevent wrong-number sends on multi-field forms.",
        ],
      },
      {
        heading: "Templates, admin alerts, and skip logs",
        paragraphs: [
          "Keep messages under 160 characters when possible to stay in one SMS segment. Include {site_name} or your brand Sender ID so recipients know who sent the text. Enable admin copy on high-value lead forms so your sales team gets pinged instantly — separate templates for customer confirmation vs internal alert.",
          "Every send writes to SplitSMS → Logs with recipient, template, status, and source (elementor). Skipped sends show reasons: no phone field, form filtered out, insufficient wallet balance, or duplicate prevented when the native action already handled the submission. Failed sends show API errors so you fix issues without guessing.",
        ],
      },
      {
        heading: "SEO takeaway for Elementor developers",
        paragraphs: [
          "If you build client sites in Elementor Pro, advertising SMS-ready forms is a differentiator. Search terms like Elementor Pro form SMS notification, WordPress Elementor SMS Ghana, and send SMS after Elementor form submit map directly to this workflow. Install SplitSMS once per site, configure per form in minutes, and ship transactional SMS without leaving WordPress admin.",
        ],
      },
    ],
  },
  {
    slug: "wpforms-elementor-contact-form-7-sms-wordpress",
    title: "WPForms, Contact Form 7 & Elementor SMS: Which WordPress Form Plugin Works Best?",
    excerpt:
      "Compare SplitSMS integrations for WPForms, CF7, and Elementor Pro Forms — setup, phone fields, and skip logs.",
    category: "WordPress",
    readTime: "8 min read",
    published: "2026-05-24",
    sections: [
      {
        paragraphs: [
          "Every WordPress lead-gen site runs on forms. Whether you chose WPForms for its drag-and-drop UI, Contact Form 7 for its lightweight footprint, or Elementor Pro Forms because your whole site is built in Elementor — the problem is the same: email notifications are unreliable and slow. SplitSMS sends an SMS the moment a form submits successfully.",
          "The official SplitSMS WordPress plugin (v1.6.0) ships dedicated integrations for all three. This guide explains how each hook works, how to map phone fields, and how to debug delivery with skip logs.",
        ],
      },
      {
        heading: "WPForms SMS notifications",
        paragraphs: [
          "SplitSMS listens on wpforms_process_complete — after WPForms validates and stores the entry. Add a Phone field type to your form (not just a text field labeled Phone — WPForms has a dedicated Phone field for better parsing).",
          "Under SplitSMS → Integrations → WPForms, enable the integration and optionally restrict by form ID so only your contact or quote forms send SMS. Customize the message template per form. Placeholders pull from submitted field values.",
          "Best for: agencies standardizing on WPForms, membership sites, and small business sites where non-technical owners edit forms in wp-admin.",
        ],
      },
      {
        heading: "Contact Form 7 SMS after submit",
        paragraphs: [
          "CF7 remains the most installed form plugin on WordPress. SplitSMS hooks wpcf7_submit and sends after a successful mail hand-off. If your SMTP plugin fails silently, enable the optional mail_failed fallback so SMS still fires when email does not.",
          "Add a tel input or text field for phone numbers. Map the field name in SplitSMS → Integrations → Contact Form 7. Use skip logs to exclude spam-trap forms or internal test forms from burning SMS credits.",
          "Best for: theme developers, minimal stacks, and sites that already have dozens of CF7 forms — enable SMS per form ID without rebuilding forms.",
        ],
      },
      {
        heading: "Elementor Pro Forms SMS",
        paragraphs: [
          "Elementor Pro forms fire elementor_pro/forms/new_record on submit. SplitSMS offers two setup paths: edit the form in Elementor → Actions After Submit → SplitSMS Notification (per-form phone, message, sender ID override, admin copy), or use SplitSMS → Forms to auto-detect every Elementor form and toggle SMS without opening the page builder.",
          "Map the Tel field using Advanced → Field ID — set a clear ID like phone or mobile, then enter that ID in the SplitSMS Notification action or Forms manager. The global Integrations panel supports form-name filters and a shared template; mail_sent fallback covers edge cases where hook timing differs across Elementor versions.",
          "When the native SplitSMS Notification action is present, duplicate global hooks are skipped. Best for: marketing sites, landing pages, and WooCommerce stores where Elementor controls the entire front end. See our dedicated Elementor Pro Forms SMS guide for full setup steps.",
        ],
      },
      {
        heading: "Shared setup: API key, Sender ID, and logs",
        paragraphs: [
          "All three integrations share one SplitSMS → Settings screen. Create an API key with sms.send permission in your SplitSMS dashboard. Register an approved Sender ID so Ghana recipients see your brand name, not a random long code.",
          "Every send writes to SplitSMS → Logs with recipient, template, status, and source (WPForms, CF7, or Elementor). Failed sends show API errors — wrong API key, insufficient wallet balance, or invalid phone format — so you fix issues without guessing.",
        ],
      },
      {
        heading: "Choosing the right plugin for SMS",
        paragraphs: [
          "You do not need to migrate form plugins to use SplitSMS. Pick the integration that matches what is already active on the site. WPForms and Elementor offer the friendliest admin UX for phone field setup. CF7 offers the lightest weight and per-form ID filters for power users.",
          "Download the plugin at splitsms.com/integrations/wordpress, connect your account, enable one form integration, and send a test submission. Most sites go live in under fifteen minutes — the same day you would spend wiring a third-party automation tool.",
        ],
      },
    ],
  },
  {
    slug: "crocoblock-jetbooking-jetappointment-sms-wordpress",
    title: "Crocoblock SMS: JetBooking, JetAppointment & JetEngine with SplitSMS",
    excerpt:
      "Automate booking confirmations, appointment reminders, and CPT status alerts on WordPress with Crocoblock + SplitSMS.",
    category: "WordPress",
    readTime: "7 min read",
    published: "2026-05-22",
    sections: [
      {
        paragraphs: [
          "Crocoblock turns WordPress into an app platform — custom post types with JetEngine, reservations with JetBooking, and time-slot scheduling with JetAppointment. Your clients book online, but they still expect a text confirmation on their phone. Email alone will not cut no-show rates.",
          "The SplitSMS WordPress plugin includes a dedicated Crocoblock module: per-event SMS templates, phone field mapping, conditional rules, and WP-Cron reminders for upcoming appointments.",
        ],
      },
      {
        heading: "JetBooking: confirm reservations by SMS",
        paragraphs: [
          "When a guest books a room, desk, or equipment slot, enable SMS on booking created and booking confirmed under SplitSMS → Crocoblock → JetBooking. Templates support placeholders for guest name, check-in date, property name, and booking reference.",
          "Send a reminder 24 hours before check-in using scheduled reminders — SplitSMS queues via WP-Cron so you do not need a separate cron SaaS. Cancelled bookings can trigger a cancellation SMS automatically so your calendar and customer expectations stay aligned.",
        ],
      },
      {
        heading: "JetAppointment: reduce no-shows at clinics and salons",
        paragraphs: [
          "Salons, dental clinics, tutors, and consultants lose revenue when clients forget appointments. Map the phone field once in SplitSMS → Crocoblock → JetAppointment. Enable SMS on appointment created, confirmed, and cancelled.",
          "Reminder SMS — sent hours or days before the slot — is the highest-ROI message type for service businesses. Keep copy short: Reminder: {service} tomorrow at {time} with {provider}. Reply to reschedule. — {site_name}.",
        ],
      },
      {
        heading: "JetEngine: SMS on custom post type changes",
        paragraphs: [
          "JetEngine CPTs power directories, job boards, property listings, and internal workflows. SplitSMS can send when a post is created, updated, or when a custom status field changes — for example when a job application moves from pending to shortlisted.",
          "Use conditional SMS rules (JSON) to send only when specific meta fields match — avoid texting every draft save. Pair with admin phone alerts so your team gets internal SMS on high-priority status changes.",
        ],
      },
      {
        heading: "Template editor and phone field mapping",
        paragraphs: [
          "Each Crocoblock event has its own template editor in wp-admin. Preview placeholders documented in SplitSMS → Crocoblock. Wrong phone mapping is the number-one reason SMS fails — confirm JetEngine / JetBooking stores phone in the field you mapped, including international format for Ghana (+233) numbers.",
          "SplitSMS normalizes common local formats (024, 020, 054) before sending. Test with your own number on staging before client go-live.",
        ],
      },
      {
        heading: "One plugin for Crocoblock + WooCommerce + forms",
        paragraphs: [
          "Agencies building Crocoblock stacks often run WooCommerce and JetFormBuilder on the same site. SplitSMS v1.6.0 unifies SMS for orders, forms, and bookings under one API key and one wallet. Install from splitsms.com/wordpress-plugin, enable Crocoblock under Integrations, and configure each Jet module from SplitSMS → Crocoblock.",
        ],
      },
    ],
  },
  {
    slug: "woocommerce-hpos-paystack-sms-splitsms-wordpress",
    title: "WooCommerce HPOS & Paystack SMS: Order Texts That Fire at the Right Time",
    excerpt:
      "SplitSMS supports WooCommerce HPOS, block checkout, and Paystack — order placed, paid, shipped, refunded.",
    category: "WordPress",
    readTime: "8 min read",
    published: "2026-05-20",
    sections: [
      {
        paragraphs: [
          "WooCommerce in 2026 means High-Performance Order Storage (HPOS), block checkout, and payment gateways like Paystack that confirm payment asynchronously. Your SMS plugin must hook the right order events — not just order created — or customers get a paid confirmation before money actually clears.",
          "SplitSMS WordPress plugin v1.6.0 supports HPOS and block checkout. It listens to WooCommerce status transitions and payment-complete hooks so SMS matches what your customer sees in their bank app.",
        ],
      },
      {
        heading: "Which WooCommerce events to enable",
        paragraphs: [
          "Order placed — immediate reassurance after checkout (especially useful before payment redirect). Payment complete — fires when WooCommerce marks the order paid; critical for Paystack, Flutterwave, and Stripe. Processing and completed — fulfillment updates customers check their phone for.",
          "Also available: failed, cancelled, refunded, and shipped with tracking number placeholder {tracking_number}. Enable only the events your customers expect — too many texts feel spammy; too few generate where is my order? tickets.",
        ],
      },
      {
        heading: "Paystack and mobile money on WooCommerce",
        paragraphs: [
          "SplitSMS does not process payments. Your customer pays via Paystack on your WooCommerce checkout; Paystack webhook updates order status; SplitSMS sends SMS when WooCommerce fires payment_complete or status changes you enabled.",
          "Enable Payment complete and Paid → processing in SplitSMS → Integrations → WooCommerce so a slow webhook does not skip the confirmation text. Template placeholder {paystack_reference} helps support teams match SMS to gateway logs.",
        ],
      },
      {
        heading: "Message templates that convert",
        paragraphs: [
          "Use WooCommerce placeholders: {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {site_name}, {refund_amount}. Example payment SMS: Hi {customer_name}, payment of {order_total} received for order #{order_id}. Thank you — {site_name}.",
          "Shipping SMS with {tracking_number} cuts delivery support volume. Keep promotional upsells out of transactional templates — mixed intent hurts trust and can confuse compliance boundaries.",
        ],
      },
      {
        heading: "HPOS and block checkout compatibility",
        paragraphs: [
          "WooCommerce HPOS stores orders in dedicated tables for faster admin and API access. Legacy SMS plugins that read post meta directly often break under HPOS. SplitSMS uses WooCommerce APIs and standard hooks — compatible with HPOS when enabled under WooCommerce → Settings → Advanced → Features.",
          "Block checkout and classic shortcode checkout both trigger the same order lifecycle hooks SplitSMS listens to. Test with a real Paystack sandbox transaction before Black Friday traffic.",
        ],
      },
      {
        heading: "Install and verify in wp-admin",
        paragraphs: [
          "Download splitsms.zip (v1.6.0) from splitsms.com/wordpress-plugin. Connect API key, Sender ID, and billing phone under SplitSMS → Settings. Enable WooCommerce under Integrations, save templates, place a test order, and confirm delivery in SplitSMS → Logs.",
          "Same SplitSMS account powers your bulk campaigns, OTP API, and WordPress store — one wallet, transparent Ghana pricing, delivery reports in the dashboard and wp-admin.",
        ],
      },
    ],
  },
  {
    slug: "wordpress-welcome-sms-user-registration-password-reset",
    title: "WordPress Welcome SMS: Registration & Password Reset by Text",
    excerpt:
      "Send welcome texts on new user signup and optional password reset links via SMS — SplitSMS core WordPress integration.",
    category: "WordPress",
    readTime: "6 min read",
    published: "2026-05-19",
    sections: [
      {
        paragraphs: [
          "Membership sites, LMS platforms, and B2B portals register users every day. WordPress sends a confirmation email by default — and most users never open it. A welcome SMS on registration confirms the account instantly and gives you a direct line for OTP or support later.",
          "SplitSMS WordPress plugin includes a WordPress core integration: welcome SMS on user registration and optional password reset notification via text.",
        ],
      },
      {
        heading: "Welcome SMS on new user registration",
        paragraphs: [
          "Enable WordPress core under SplitSMS → Integrations. When wp_insert_user or standard registration completes, SplitSMS sends your welcome template to the phone number stored on the user profile — or a phone field you collect at signup via WPForms, JetFormBuilder, or custom registration forms.",
          "Example: Welcome to {site_name}, {user_login}! Your account is active. Log in at {site_url}. Keep it under 160 characters and include one clear next step.",
        ],
      },
      {
        heading: "Password reset via SMS (optional)",
        paragraphs: [
          "Email password reset links get lost in spam. Optional SMS notification alerts the user that a reset was requested and can include a short link if your workflow supports it. Enable only if you collect verified phone numbers at registration — sending reset hints to wrong numbers is a security risk.",
          "Pair with SplitSMS OTP API if you want true phone-based login — send a six-digit code instead of a long email link for mobile-first audiences in Ghana and Nigeria.",
        ],
      },
      {
        heading: "Where to store phone numbers on WordPress",
        paragraphs: [
          "Standard user meta works for custom registration plugins. WooCommerce billing phone can double as SMS destination for customer accounts. Form plugins should write phone to user meta on signup so SplitSMS core integration finds it on the next login.",
          "Validate format at registration — SplitSMS logs show invalid number errors so you fix the form field rather than losing silent failures.",
        ],
      },
      {
        heading: "Transactional vs marketing on member sites",
        paragraphs: [
          "Welcome and password reset SMS are transactional — users expect them when they sign up or request access. Marketing SMS to the same list requires separate opt-in. Use SplitSMS contact groups and campaigns for newsletters; use the WordPress plugin for account lifecycle messages.",
        ],
      },
      {
        heading: "Get started with SplitSMS on WordPress",
        paragraphs: [
          "Install plugin v1.6.0 from splitsms.com/integrations, connect your API key, enable WordPress core under Integrations, and register a test user on staging. Check SplitSMS → Logs for delivered status.",
          "Combine with WooCommerce, WPForms, and Crocoblock on the same site — one plugin, one API key, every WordPress event covered.",
        ],
      },
    ],
  },
  {
    slug: "smart-forms-collect-leads-instant-sms",
    title: "Smart Forms: Collect Leads and Send Instant SMS — No Extra Tools",
    excerpt:
      "Build branded forms, share with short links and QR codes, and trigger SMS confirmations automatically from your SplitSMS dashboard.",
    category: "Smart Forms",
    readTime: "6 min read",
    published: "2026-06-28",
    sections: [
      {
        paragraphs: [
          "Most businesses stitch together a form builder, a CRM, and an SMS platform just to capture a phone number and send a thank-you text. SplitSMS Smart Forms puts all three in one dashboard — build the form, collect responses, save contacts, and fire SMS automation the moment someone submits.",
          "Smart Forms is built for Ghana and Africa's mobile-first audiences. Every submission can trigger an instant SMS confirmation the respondent actually reads, while your team gets an admin alert on their phone. No Zapier, no webhook middleware, no developer required.",
        ],
      },
      {
        heading: "What Smart Forms does",
        paragraphs: [
          "Create custom forms with text, phone, email, select, date, consent, and other field types. Start from templates — event registration, contact collection, feedback surveys, training sign-ups — or build from scratch in under ten minutes.",
          "Brand every form with your colors, button text, background, and success message. Publish with a short link like splitsms.com/f/abc123, generate a QR code for posters and flyers, or embed the form on your website and WordPress pages.",
        ],
      },
      {
        heading: "SMS automation built in",
        paragraphs: [
          "Configure two automation types from the form dashboard: a confirmation SMS to the respondent and an admin notification when a new response arrives. Use merge tags like {full_name} and {phone} so every message feels personal.",
          "Respondents saved to a contact group can be targeted in future bulk SMS campaigns — the same wallet, the same Sender ID, the same delivery reports you already use for campaigns and OTP.",
        ],
      },
      {
        heading: "Analytics and exports",
        paragraphs: [
          "Track views, submissions, conversion rate, traffic sources, QR scans, and device types in real time. Export responses to CSV when you need a spreadsheet for your team or client report.",
          "Built-in spam protection includes honeypot fields, captcha options, and rate limiting — so your form stays clean without slowing down legitimate visitors.",
        ],
      },
      {
        heading: "Get started today",
        paragraphs: [
          "Open Dashboard → Smart Forms, pick a template, customize the design, enable SMS automation, and publish. Your first form can go live in under ten minutes — with 5 free SMS credits to test confirmations before you scale.",
        ],
      },
    ],
  },
  {
    slug: "event-registration-sms-smart-forms",
    title: "Event Registration with SMS Confirmation: A Smart Forms Playbook",
    excerpt:
      "Church conferences, workshops, and corporate events — how to collect sign-ups and send instant text confirmations.",
    category: "Smart Forms",
    readTime: "5 min read",
    published: "2026-06-25",
    sections: [
      {
        paragraphs: [
          "Event organizers in Accra, Lagos, and across West Africa lose registrations to long Google Forms that never send a confirmation. Attendees wonder if their sign-up worked. Smart Forms fixes that with instant SMS the moment someone submits — plus QR codes for walk-up registration at the venue.",
        ],
      },
      {
        heading: "Start with the event registration template",
        paragraphs: [
          "SplitSMS includes a ready-made event registration template: full name, phone number, email, and number of guests. Customize fields for your event — add a session preference dropdown, dietary requirements, or a consent checkbox for follow-up SMS.",
          "Mark phone as required. SMS confirmation only works when you capture a valid number. SplitSMS normalizes Ghana formats (024, 054, +233) automatically before sending.",
        ],
      },
      {
        heading: "Write confirmation SMS that attendees trust",
        paragraphs: [
          "Keep the respondent message short and factual: Hi {full_name}, you're registered for [Event Name] on [Date]. See you there! — [Your Brand]. Stay under 160 characters when possible to use one SMS segment.",
          "Enable admin notification SMS so your events team gets pinged on every new registration: New registration: {full_name}, {phone}, {guests} guests. Route admin alerts to a shared phone or team lead.",
        ],
      },
      {
        heading: "Share offline and online",
        paragraphs: [
          "Print the QR code on flyers, church bulletins, and conference banners — attendees scan and register on the spot. Share the short link on WhatsApp status, Instagram bio, and email invites. Embed the form on your WordPress event page with one iframe snippet.",
          "Track QR scans vs link clicks in Smart Forms analytics to see which channel drives the most sign-ups.",
        ],
      },
      {
        heading: "After the event",
        paragraphs: [
          "Export all responses to CSV for check-in lists or badge printing. The contact group built from submissions is ready for a thank-you SMS or early-bird promo for your next event — all from the same SplitSMS account.",
        ],
      },
    ],
  },
  {
    slug: "smart-forms-qr-codes-short-links-sharing",
    title: "QR Codes, Short Links & Embeds: Share Smart Forms Anywhere",
    excerpt:
      "Four ways to publish your form — short links, QR codes, website embeds, and WordPress — with analytics for each channel.",
    category: "Smart Forms",
    readTime: "5 min read",
    published: "2026-06-22",
    sections: [
      {
        paragraphs: [
          "A form nobody can find collects zero leads. Smart Forms gives you four sharing options from one publish button — each tracked separately in analytics so you know what actually works.",
        ],
      },
      {
        heading: "Short links for digital sharing",
        paragraphs: [
          "Every published form gets a short URL like splitsms.com/f/abc123. Copy it for WhatsApp broadcasts, SMS campaigns, email signatures, and social media bios. Short links are easy to type, easy to remember, and trackable — Smart Forms logs every click as a shortlink_click event.",
          "Use UTM-style source parameters when sharing across channels so analytics breaks down traffic by source: WhatsApp vs Instagram vs paid ads.",
        ],
      },
      {
        heading: "QR codes for offline and print",
        paragraphs: [
          "Download a QR code PNG from the Share panel and drop it on posters, restaurant table tents, event banners, product packaging, and business cards. When someone scans, Smart Forms records a qr_scan event — perfect for measuring foot traffic from a physical location.",
          "QR codes work on any smartphone camera. No app install required. In markets where mobile data is expensive, a quick scan beats typing a long URL on a small keyboard.",
        ],
      },
      {
        heading: "Website and WordPress embeds",
        paragraphs: [
          "Copy the iframe embed code to add the form directly on your landing page — visitors never leave your site. For WordPress, paste the embed snippet into any page, post, or Elementor HTML widget.",
          "Embedded forms inherit your brand styling from the Smart Forms builder. Adjust colors and button text once; every share channel shows the same polished experience.",
        ],
      },
      {
        heading: "Measure what matters",
        paragraphs: [
          "The analytics dashboard shows views, unique views, submissions, conversion rate, QR scans, shares, and device breakdown. Compare channels weekly: if QR scans spike at your retail location but link clicks dominate online, double down on what converts.",
          "Open Dashboard → Smart Forms → Share on any published form to access all four options in one place.",
        ],
      },
    ],
  },
  {
    slug: "smart-forms-sms-automation-setup-guide",
    title: "Smart Forms SMS Automation: Confirmations & Admin Alerts Setup Guide",
    excerpt:
      "Configure instant SMS to respondents and admin notifications — templates, merge tags, Sender IDs, and troubleshooting.",
    category: "Smart Forms",
    readTime: "6 min read",
    published: "2026-06-18",
    sections: [
      {
        paragraphs: [
          "The highest-value moment in lead capture is the ten seconds after someone submits. Smart Forms SMS automation sends a confirmation text immediately — before they close the tab, before they forget your brand, before a competitor replies first.",
        ],
      },
      {
        heading: "Two automation types",
        paragraphs: [
          "Respondent SMS — sent to the phone number on the form. Use this for thank-you messages, booking confirmations, reference numbers, and next-step instructions. Admin SMS — sent to your team's phone when a new response arrives. Use this for hot leads, support tickets, and event registrations that need same-day follow-up.",
          "Enable either or both from Dashboard → Smart Forms → [Your Form] → Automation. Each form has its own templates — your contact form and event registration can send different messages.",
        ],
      },
      {
        heading: "Merge tags and templates",
        paragraphs: [
          "Personalize messages with field merge tags: {full_name}, {phone}, {email}, and any custom field key you defined in the builder. Example respondent template: Thanks {full_name}! We received your inquiry and will call you within 24 hours. — Acme Ltd.",
          "Example admin template: New lead: {full_name} ({phone}). Source: contact form. Reply ASAP. Keep admin messages actionable — include the phone number and one clear next step.",
        ],
      },
      {
        heading: "Sender ID and wallet",
        paragraphs: [
          "SMS sends through your approved Sender ID so recipients see your brand name, not a random number. Register a Sender ID in Dashboard → Sender IDs before going live — Ghana carrier approval typically takes a few business days.",
          "Each SMS debits your SplitSMS wallet at published rates (from around GHS 0.029 per segment in Ghana). Top up via Paystack. Smart Forms analytics shows smsSent and smsFailed counts per form so you catch wallet or delivery issues early.",
        ],
      },
      {
        heading: "Save contacts for follow-up campaigns",
        paragraphs: [
          "Enable Save to contact group in form settings. Every submission with a valid phone number joins the group you choose — ready for bulk SMS campaigns, segmented promos, or re-engagement without re-importing CSVs.",
          "Test with your own number before publishing. Submit the form, confirm delivery in message logs, and verify merge tags render correctly. Most setup issues are wrong phone format or missing Sender ID approval.",
        ],
      },
    ],
  },
  {
    slug: "smart-forms-analytics-improve-conversions",
    title: "Smart Forms Analytics: Track Views, Conversions & Optimize Your Forms",
    excerpt:
      "Views, QR scans, conversion rate, traffic sources, and device breakdown — use data to fix forms that underperform.",
    category: "Smart Forms",
    readTime: "5 min read",
    published: "2026-06-15",
    sections: [
      {
        paragraphs: [
          "Publishing a form is step one. Improving it is step two. Smart Forms analytics gives you the metrics marketers need — without exporting to Google Analytics or wiring custom tracking pixels.",
        ],
      },
      {
        heading: "Core metrics at a glance",
        paragraphs: [
          "Views and unique views tell you how many people opened your form. Submissions and conversion rate (submissions ÷ views) tell you how many completed it. A 40% view-to-submit rate on a two-field contact form is healthy; 5% on a ten-field survey means something is wrong.",
          "Contacts collected counts how many phone numbers landed in your contact group. SMS sent and SMS failed track automation health — if failures spike, check wallet balance and Sender ID status.",
        ],
      },
      {
        heading: "Channel and device breakdown",
        paragraphs: [
          "Source breakdown shows where traffic comes from — direct link, QR scan, embed, social share. If you run a poster campaign, watch qr_scans climb. If WhatsApp drives most link clicks, put the short URL in your status more often.",
          "Device breakdown splits mobile vs desktop vs tablet. Forms with tiny tap targets or long dropdowns often show lower mobile conversion. If 80% of views are mobile but conversion is half your desktop rate, simplify fields for thumb-friendly input.",
        ],
      },
      {
        heading: "Time series and trends",
        paragraphs: [
          "The chart view plots views, submissions, and conversion rate by day. Spot spikes after a campaign launch or drops after you added a required field nobody wants to fill. Compare week-over-week to measure the impact of design or copy changes.",
          "Filter by date range and traffic source to isolate specific campaigns — useful when the same form serves both a QR poster and a paid ad with different audiences.",
        ],
      },
      {
        heading: "Act on the data",
        paragraphs: [
          "Low views? Share more — post the short link, print the QR code, embed on your homepage. High views, low submissions? Remove optional fields, shorten labels, or add a clearer value proposition above the submit button. High submissions, low SMS delivery? Top up wallet and verify Sender ID.",
          "Export responses to CSV for deeper analysis or client reporting. Open Dashboard → Smart Forms → [Your Form] → Analytics to start — every published form tracks automatically from day one.",
        ],
      },
    ],
  },
  {
    slug: "smart-forms-like-google-forms-with-sms",
    title: "Smart Forms Works Like Google Forms — But Sends SMS When Someone Submits",
    excerpt:
      "Same familiar flow: build a form, share a link, collect responses. The difference is instant text confirmations and admin alerts built in.",
    category: "Smart Forms",
    readTime: "5 min read",
    published: "2026-07-01",
    sections: [
      {
        paragraphs: [
          "If you have ever created a Google Form, you already know the rhythm: add questions, copy a link, share it on WhatsApp or email, and watch responses roll into a spreadsheet. SplitSMS Smart Forms follows that same workflow — build, publish, share, review submissions — with one addition Google Forms does not offer out of the box: automatic SMS when someone hits submit.",
          "This is not about replacing Google Forms for every use case. Google Forms is excellent for internal surveys, classroom quizzes, and free unlimited response collection. Smart Forms is for teams who collect phone numbers and need the respondent — and their own team — to get a text immediately.",
        ],
      },
      {
        heading: "The workflow you already know",
        paragraphs: [
          "Create a form in the dashboard. Drag in fields — name, phone, email, dropdowns, checkboxes, long text. Customize how it looks. Publish and copy a short link or QR code. Share it anywhere. View every response in a list, export to CSV when you need a file.",
          "If that sounds like Google Forms, that is intentional. Smart Forms was designed so marketers, event organizers, and small business owners do not need to learn a new mental model — just the same form-building habit with SMS layered on top.",
        ],
      },
      {
        heading: "Where SMS fits in",
        paragraphs: [
          "Google Forms can email you when someone responds, and you can wire SMS through third-party tools like Zapier or Make — but that means another subscription, another login, and another thing to break. Smart Forms sends SMS from the same account you use for bulk campaigns and OTP.",
          "Two automations, configured per form: a confirmation text to the person who submitted, and an alert to your team's phone. Both use merge tags from the form fields — Hi {full_name}, we received your request — the same way you might personalize an email, except SMS gets read.",
        ],
      },
      {
        heading: "When Smart Forms makes sense",
        paragraphs: [
          "Choose Smart Forms when phone numbers are part of the form and SMS follow-up matters: event registration, lead capture, customer feedback with instant thank-you texts, training sign-ups, and contact forms where your sales team needs a ping on their mobile.",
          "Stick with Google Forms when you need completely free unlimited forms with no SMS, complex logic branching for internal HR surveys, or deep Google Sheets integration for teams already living in Workspace.",
        ],
      },
      {
        heading: "Try the familiar flow with SMS",
        paragraphs: [
          "Open Dashboard → Smart Forms, pick a template, publish, and submit a test entry with your own number. You will see the response in your dashboard and the confirmation SMS on your phone — the Google Forms experience, plus the text message Ghana and Nigeria customers expect.",
        ],
      },
    ],
  },
  {
    slug: "google-forms-email-vs-smart-forms-sms-confirmations",
    title: "Google Forms Sends Email Confirmations. Smart Forms Sends SMS.",
    excerpt:
      "Both collect responses the same way. For mobile-first customers who ignore inbox notifications, SMS confirmation closes the loop.",
    category: "Smart Forms",
    readTime: "5 min read",
    published: "2026-06-30",
    sections: [
      {
        paragraphs: [
          "Google Forms can show a custom confirmation message on screen after submit, and with add-ons or Apps Script you can send an email receipt. That works fine when your audience checks email daily. In Ghana, Nigeria, and much of Africa, the phone is the primary screen — and SMS is what people actually read within minutes.",
          "Smart Forms keeps the same collection mechanics as Google Forms. The difference is what happens in the ten seconds after submit: an SMS lands on the respondent's phone and optionally on yours.",
        ],
      },
      {
        heading: "Same collection, different confirmation channel",
        paragraphs: [
          "Google Forms: respondent fills out fields → sees a thank-you page → maybe receives an email → organizer checks the Responses tab or linked Sheet.",
          "Smart Forms: respondent fills out fields → sees a branded success message → receives an SMS confirmation → organizer gets an optional admin SMS and sees the response in the dashboard. Both store every answer. Both export to CSV. The confirmation channel is what changes.",
        ],
      },
      {
        heading: "Why SMS confirmation matters for forms",
        paragraphs: [
          "Event registration: attendees want proof they are on the list. A text that says You are registered for Saturday 9am beats an email they may never open. Lead capture: a prospect who just requested a quote feels acknowledged when a text arrives before your sales call. Customer feedback: a short thank-you SMS after a survey increases trust and future response rates.",
          "Google Forms can do none of this natively without external integrations. Smart Forms includes it in the Automation tab — no Zapier, no Apps Script, no developer.",
        ],
      },
      {
        heading: "Contacts flow into bulk SMS",
        paragraphs: [
          "Google Forms responses live in Google Sheets. To SMS those contacts later, you export the sheet, clean phone numbers, import into an SMS tool, and send a campaign. Smart Forms saves respondents directly to a contact group in SplitSMS — the same groups you use for bulk SMS, OTP, and wallet billing.",
          "One account, one phone number format normalization (+233, 024, 054), one Sender ID. The form is not a dead end; it feeds your SMS marketing stack.",
        ],
      },
      {
        heading: "Use both if you need to",
        paragraphs: [
          "Some teams keep Google Forms for internal staff surveys and use Smart Forms for customer-facing forms that need SMS. That is a reasonable split. For anything where the submitter gave you a phone number and expects to hear back fast, Smart Forms gives you the Google Forms-style builder with the confirmation channel your market actually uses.",
        ],
      },
    ],
  },
  {
    slug: "recreate-google-form-smart-forms-sms",
    title: "How to Recreate Your Google Form in Smart Forms (and Add SMS)",
    excerpt:
      "Field by field: migrate contact forms, event sign-ups, and surveys to Smart Forms without losing the simple share-and-collect workflow.",
    category: "Smart Forms",
    readTime: "6 min read",
    published: "2026-06-29",
    sections: [
      {
        paragraphs: [
          "You have a Google Form that works — contact us, event RSVP, customer feedback. Responses land in a Sheet. You share the link on WhatsApp. The only thing missing is an automatic text to the person who submitted and an alert on your phone. Here is how to rebuild the same form in Smart Forms without changing how your audience experiences it.",
        ],
      },
      {
        heading: "Map your Google Form fields",
        paragraphs: [
          "Short answer → Text field. Paragraph → Textarea. Multiple choice → Radio or Select. Checkboxes → Checkbox field. Dropdown → Select. Date → Date field. Email → Email field. Phone number → Phone field (required for SMS automation).",
          "Smart Forms templates cover common Google Form use cases: contact collection, event registration, customer feedback, training sign-ups, and church registration. Pick the closest template and adjust rather than rebuilding every field from zero.",
        ],
      },
      {
        heading: "Match the share experience",
        paragraphs: [
          "In Google Forms you copy a docs.google.com link. In Smart Forms you copy splitsms.com/f/abc123 — same idea, shorter URL for WhatsApp. Google Forms offers a QR code via third-party tools; Smart Forms generates one in the Share panel. Google Forms embeds via iframe; Smart Forms gives you the same embed snippet for your website or WordPress page.",
          "Your audience still clicks a link, fills fields, and taps Submit. The form URL changes; the habit does not.",
        ],
      },
      {
        heading: "Add the SMS layer Google Forms lacks",
        paragraphs: [
          "Open Automation on your Smart Form. Enable Send confirmation SMS to respondent. Write a template using your field keys: Thanks {full_name}, we got your message. We will call {phone} within 24 hours. Enable admin notification SMS and point it to your sales or events phone.",
          "Register an approved Sender ID in SplitSMS so texts show your business name. Test with your own number before replacing the Google Form link in the wild.",
        ],
      },
      {
        heading: "Review responses the same way",
        paragraphs: [
          "Google Forms Responses tab → Smart Forms Responses page. Filter, search, open individual submissions. Google Sheets export → CSV export from the dashboard. Smart Forms adds analytics Google Forms does not include by default: views, conversion rate, QR scans, traffic sources, and SMS delivery counts.",
          "Migration tip: run both forms in parallel for a week. Send new traffic to Smart Forms. Compare submission volume and — more importantly — how many people reply to your follow-up because they received an SMS confirmation.",
        ],
      },
      {
        heading: "When to keep Google Forms",
        paragraphs: [
          "Internal-only forms with no phone field, classroom quizzes, and teams deeply integrated with Google Workspace may stay on Google Forms — and that is fine. Smart Forms is the same build-share-collect pattern for customer-facing forms where SMS closes the loop. Start with your highest-traffic Google Form that collects phone numbers; that is where the upgrade pays off first.",
        ],
      },
    ],
  },
  {
    slug: "best-sms-ghana-accra-messaging-reseller-platform",
    title: "Best SMS in Ghana: Accra Messaging Platform & Reseller Program",
    excerpt:
      "Compare bulk SMS in Ghana, Accra-ready messaging tools, and the best reseller platform for agencies — transparent pricing, Sender IDs, and white-label branding.",
    category: "Guide",
    readTime: "7 min read",
    published: "2026-07-02",
    sections: [
      {
        paragraphs: [
          "Searching for the best SMS in Ghana usually means three things at once: a reliable bulk SMS gateway for campaigns and OTP, a messaging platform Accra teams can run without calling overseas support, and — if you are an agency or SaaS founder — the best reseller platform to sell SMS under your own brand.",
          "SplitSMS covers all three from one stack: Ghana-first routing through trusted carriers, a dashboard and REST API built for West Africa, and an approved reseller program with white-label portals, sub-users, and per-country pricing you control.",
        ],
      },
      {
        heading: "What makes the best SMS in Ghana",
        paragraphs: [
          "The best SMS in Ghana is not the cheapest line on a spreadsheet — it is transparent per-segment pricing, approved Sender IDs, deliverability on MTN and Telecel networks, and a wallet you top up locally via Paystack. SplitSMS publishes Ghana rates before you send (from around GHS 0.029 per segment), registers your brand Sender ID through a clear approval workflow, and routes through carriers including mNotify with failover when one path is congested.",
          "You need both a bulk SMS UI for marketing teams and a REST API for OTP, WooCommerce, and custom apps. SplitSMS gives you campaigns, contact groups, scheduling, delivery reports, sandbox keys, and webhooks from one account — no separate enterprise contract to negotiate.",
        ],
      },
      {
        heading: "Accra messaging platform for growing teams",
        paragraphs: [
          "Accra is Ghana's business hub — fintech, e-commerce, schools, clinics, and real estate teams all need messaging that lands in seconds. An Accra messaging platform should feel local: GHS wallet billing, +233 phone normalization (024, 054, +233), Paystack top-ups, and support from operators who understand Ghana carrier rules.",
          "SplitSMS is operated by Tecunit and built for mobile-first West Africa. Retailers in Osu send flash-sale SMS. Clinics in East Legon confirm appointments by text. Developers in Cantonments ship OTP login with the same API that powers bulk campaigns. Whether you are in Accra, Kumasi, or serving Ghana from abroad, you get one dashboard, one wallet, and delivery logs you can audit.",
        ],
      },
      {
        heading: "Bulk SMS, OTP, and WordPress — one Ghana account",
        paragraphs: [
          "Marketing SMS: upload CSV contacts, personalize with merge fields, schedule sends, and track delivered vs failed in real time. Transactional SMS: order confirmations, payment alerts, appointment reminders — the messages Ghana customers actually read.",
          "Developers get REST endpoints for send, verify OTP, balance checks, and signed delivery webhooks. WordPress and WooCommerce teams install the free SplitSMS plugin for order SMS, Elementor and WPForms lead alerts, and Crocoblock booking confirmations — same API key, same wallet, same Ghana pricing.",
        ],
      },
      {
        heading: "Best reseller platform for SMS agencies",
        paragraphs: [
          "If you resell SMS to clients, the best reseller platform lets you set your own sell rates, fund sub-user wallets, earn commission on every message, and put your brand on the login screen — not SplitSMS. SplitSMS Reseller gives approved partners a full partner dashboard: create and suspend sub-users, set per-country pricing above platform cost, track unpaid commission, and request payouts from your wallet tab.",
          "White-label branding goes further: custom domain (sms.yourcompany.com), logo, accent colors, and a branded member portal so your clients sign in on your site. Agencies in Accra, Lagos, and across West Africa use this to package bulk SMS, OTP API access, and WordPress integrations as their own product without building carrier relationships from scratch.",
        ],
      },
      {
        heading: "Reseller vs direct account — which fits you",
        paragraphs: [
          "Choose a direct SplitSMS account if you send SMS for your own business: campaigns, OTP, WooCommerce notifications, Smart Forms confirmations. Sign up, claim free starter credits, register a Sender ID, and send the same day.",
          "Apply for the reseller program if you manage multiple client accounts, want margin on every SMS segment, or need a white-label portal for your agency brand. Submit your business name at splitsms.com/reseller — admin review usually takes one to two business days. Approved resellers set Ghana and Nigeria sell rates, onboard sub-users, and earn commission as clients send.",
        ],
      },
      {
        heading: "Why teams pick SplitSMS over legacy gateways",
        paragraphs: [
          "Legacy SMS portals hide pricing, force sales calls, and offer APIs as an afterthought. SplitSMS is built for 2026: transparent Ghana rates, modern REST API, WordPress plugin, Smart Forms with SMS confirmations, SplitSMS Connect for SaaS embeds, and a reseller layer for agencies — all from one operator with local market knowledge.",
          "Start with 5 free SMS credits on signup. Top up via Paystack. Register your Sender ID. Send your first bulk campaign or OTP flow in minutes — or apply to become a reseller and launch your own Accra messaging platform under your brand.",
        ],
      },
    ],
  },
  {
    slug: "mnotify-alternative-bulk-sms-ghana",
    title: "mNotify Alternative: Bulk SMS Ghana with Dashboard, API & WooCommerce",
    excerpt:
      "Compare mNotify vs SplitSMS — Ghana SMS routing, transparent GHS pricing, OTP API, WordPress plugin, and self-serve signup without sales calls.",
    category: "Guide",
    readTime: "6 min read",
    published: "2026-07-02",
    sections: [
      {
        paragraphs: [
          "Searching mNotify or mnotify usually means you need reliable bulk SMS in Ghana. SplitSMS routes through trusted carriers including mNotify while adding a modern dashboard, REST SMS API, OTP verify endpoints, WooCommerce plugin, and Paystack wallet top-ups — one platform for campaigns and transactional SMS.",
        ],
      },
      {
        heading: "What SplitSMS adds beyond mNotify-only portals",
        paragraphs: [
          "Self-serve signup with 5 free credits. Published Ghana rates from around GHS 0.029 per segment. Sender ID registration workflow. Delivery webhooks. WordPress + Paystack SMS. Smart Forms with SMS confirmations. Reseller white-label for agencies.",
        ],
      },
      {
        heading: "When to choose SplitSMS",
        paragraphs: [
          "Pick SplitSMS if you need bulk SMS plus OTP API, WooCommerce order texts, developer docs, or multi-country sending from one wallet. Test with sandbox keys before migrating live campaigns.",
        ],
      },
    ],
  },
  {
    slug: "infobip-alternative-sms-api-africa",
    title: "Infobip Alternative: Affordable SMS API for Ghana, Nigeria & Africa",
    excerpt:
      "Infobip vs SplitSMS for African teams — pay-as-you-go pricing, OTP API, WooCommerce SMS, and no enterprise contract required.",
    category: "Guide",
    readTime: "6 min read",
    published: "2026-07-02",
    sections: [
      {
        paragraphs: [
          "Infobip powers global enterprises with complex CPaaS stacks. Many Ghana and West Africa teams want SMS integration without long procurement cycles or opaque pricing. SplitSMS is an Infobip alternative with transparent rates, REST API, OTP, webhooks, and Africa-first billing via Paystack.",
        ],
      },
      {
        heading: "SplitSMS vs Infobip for developers",
        paragraphs: [
          "OpenAPI spec, llms.txt, sandbox keys, and vibe-coder docs. Send your first OTP in under an hour. Same account powers bulk campaigns, Smart Forms, and WordPress WooCommerce SMS.",
        ],
      },
      {
        heading: "SplitSMS vs Infobip for marketers",
        paragraphs: [
          "Bulk SMS dashboard, contact groups, scheduling, delivery reports, and approved Sender IDs for Ghana. No monthly minimum — top up when you need credits.",
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
