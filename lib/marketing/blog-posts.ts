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
          "Elementor Pro forms fire elementor_pro/forms/new_record on submit. SplitSMS maps the Tel field using Advanced → Field ID — set a clear ID like phone or mobile in the Elementor form widget, then enter that ID in the SplitSMS Elementor panel.",
          "Filter by form name when you only want SMS on specific forms (quote request vs newsletter). Elementor's mail_sent fallback covers edge cases where the primary hook timing differs across Elementor versions.",
          "Best for: marketing sites, landing pages, and WooCommerce stores where Elementor controls the entire front end.",
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
