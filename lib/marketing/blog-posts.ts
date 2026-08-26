export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  published: string;
  /** Optional last-updated date for sitemap / article metadata */
  updated?: string;
  /** Page-specific SEO keywords (falls back to site defaults) */
  keywords?: string[];
  sections: { heading?: string; paragraphs: string[] }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-send-bulk-sms-ghana-complete-guide",
    title: "How to Send Bulk SMS in Ghana in 2026: A Complete Step-by-Step Guide",
    excerpt:
      "From Sender ID approval and contact lists to message length, scheduling, delivery reports, and cost — everything a Ghana business needs to send bulk SMS that actually arrives.",
    category: "Guides",
    readTime: "16 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "how to send bulk SMS Ghana",
      "send bulk SMS Ghana",
      "bulk SMS Ghana 2026",
      "SMS blast Ghana",
      "mass SMS Ghana",
      "SplitSMS bulk SMS",
    ],
    sections: [
      {
        paragraphs: [
          "Sending bulk SMS in Ghana is simple once the pieces sit in the right order: an approved Sender ID, a clean contact list, a message that fits one or two segments, a funded wallet, and a way to see what was delivered. Most failed first campaigns skip one of those steps. This guide walks through each one in the order a real business should do it — churches, schools, shops, clinics, and SaaS teams included.",
          "SplitSMS is a wallet-based platform: you top up in GHS via Paystack, pick an approved Sender ID, and send from the dashboard or the REST API. Ghana rates start around GHS 0.029 per 160-character segment. You get 5 free credits on signup so you can test on your own phone before a real blast.",
          "If you already have an account, keep this page open while you work through Dashboard → Send, Contacts, and Sender IDs. If you do not, start at splitsms.com/signup, then come back to the checklist below.",
        ],
      },
      {
        heading: "What “bulk SMS” actually means in Ghana",
        paragraphs: [
          "Bulk SMS is one message (or a small set of personalized variants) sent to many phone numbers at once. It is not the same as chatting on WhatsApp. Carriers treat it as A2P traffic — application to person — which is why branded Sender IDs, routing, and delivery reports exist.",
          "Typical Ghana use cases are fee reminders, event RSVPs, flash sales, appointment confirmations, OTP codes, order updates, and church or school announcements. Feature phones still matter here. SMS works without data, which is why it still beats email for anything time-sensitive.",
          "Promotional bulk SMS (sales, events) and transactional SMS (OTP, receipts, shipping) share the same wallet on SplitSMS, but they should not share the same copy. Transactional texts should stay factual. Promotional texts should include a clear way to stop future marketing.",
        ],
      },
      {
        heading: "Step 1: Register a Sender ID before you import a list",
        paragraphs: [
          "Ghana recipients should see your brand name, not a random number. Open Dashboard → Sender IDs, submit a short alphanumeric name (usually up to 11 characters), and wait for carrier approval. Names that copy banks, networks, or the word OTP are often rejected. Match your trading name as closely as you can.",
          "Do not wait until the morning of a campaign. Approval can take from hours to a few days depending on the name and the route. While it is pending, send tests with a fallback Sender ID only if your account allows it — otherwise wait. Sending a blast from an unapproved ID is how messages fail silently.",
          "Once approved, that same Sender ID works for dashboard campaigns, Smart Forms, WordPress, and the API. One registration covers every channel. Details and rejection tips live in our Sender ID Ghana guide.",
        ],
      },
      {
        heading: "Step 2: Build a list you actually have permission to text",
        paragraphs: [
          "Do not buy phone dumps. Carriers and customers treat cold lists as spam, delivery drops, and you burn credits on dead numbers. Use customers who already gave you a number: checkout, registration, Smart Forms, Google Forms, school admission files, church membership, or CRM export.",
          "On SplitSMS you can paste numbers, upload CSV, import Google Contacts, or pull from a connected Sheet. Normalize Ghana numbers to international format (233XXXXXXXXX) so MTN, Telecel, and AirtelTigo routes match. Remove duplicates before you send — one person should not get the same promo three times.",
          "Keep marketing groups separate from transactional groups. A parent who opted in for fee alerts did not automatically opt in for a fundraiser blast. SplitSMS contact groups make that split easy if you name them clearly (Fees-2026, Events, Promo-opt-in).",
        ],
      },
      {
        heading: "Step 3: Write a message that fits the channel",
        paragraphs: [
          "GSM SMS is 160 characters per segment. Unicode (emoji, some Ghanaian language characters) drops that to 70. Two segments cost two credits. Before you hit send, read the character counter on the SplitSMS compose screen and decide if the extra segment is worth it.",
          "Lead with who you are and what to do. Example: ACCRA MART: 20% off rice today only. Show this SMS at East Legon till 8pm. STOP to opt out. That is brand, offer, place, time, and an exit. Vague lines like “Big news coming soon!!!” waste money.",
          "Personalization helps when you have the data. {first_name} and {amount} turn a blast into a reminder people take seriously. If you only have phone numbers, skip fake first names — “Dear Customer” is honest. Save merge fields for CSVs that actually contain them.",
        ],
      },
      {
        heading: "Step 4: Check cost, then top up the wallet",
        paragraphs: [
          "Cost is recipients × segments × country rate. One thousand Ghana numbers with a one-segment English message is about GHS 29 at GHS 0.029. Two-segment Unicode is roughly double. SplitSMS shows a live estimate on the send screen so you are not surprised after the fact.",
          "Top up via Paystack from Dashboard → Wallet. Credits stay in the account until you send; they are not a monthly plan. If a campaign fails part-way, check the wallet first — empty balance is the most common “nothing happened” report we see.",
          "Use the 5 free trial credits on your own handset and one colleague on each major network. Confirm the Sender ID, the copy, and that the text looks right on a cheap Android before you mail 5,000 parents.",
        ],
      },
      {
        heading: "Step 5: Send, schedule, or drip — pick one job per campaign",
        paragraphs: [
          "Immediate send is for flash sales, closures, and OTPs. Scheduled send is for school reminders at 6:30am, church notices Saturday morning, and payday promotions. SplitSMS campaigns let you schedule in your local time so you are not blasting at 1am because someone used UTC by mistake.",
          "Do not mix five CTAs in one SMS. One campaign, one job: pay fees, confirm a seat, use a code, or show up. If you need a longer story, SMS the hook and point to a short link (Smart Form, WhatsApp, or your site).",
          "For recurring work — weekly reminders, monthly collections — save the template and the group. Re-run with a new date rather than rewriting from scratch. That is how small teams stay consistent without a marketing department.",
        ],
      },
      {
        heading: "Step 6: Read delivery reports before you send again",
        paragraphs: [
          "A “sent” status from your laptop is not the same as delivered on the handset. Open delivery reports and look at delivered vs failed vs pending. Failures cluster around invalid numbers, barred lines, and unapproved Sender IDs.",
          "Clean the list after every large send. Remove numbers that failed as invalid. Do not keep retrying the same dead rows — you pay again and the report stays ugly. If a whole network looks weak, check Sender ID status and wallet, then contact support with the campaign ID rather than guessing.",
          "Developers can subscribe to delivery webhooks so your app stores the same statuses the dashboard shows. The webhook guide on this blog walks through signatures and retries.",
        ],
      },
      {
        heading: "Dashboard vs API vs WordPress vs Smart Forms",
        paragraphs: [
          "Use the dashboard when a person is sending: CSV upload, church blast, school reminder. Use the API when software is sending: OTP, order paid, booking confirmed. Use the WordPress plugin when WooCommerce or a form plugin should fire SMS without custom PHP. Use Smart Forms when you need a hosted form plus an automatic confirmation text.",
          "All four spend the same wallet and can use the same Sender ID. You do not need four vendors. If you are unsure, start with dashboard send this week, then add API or WordPress only when a workflow is repeating daily.",
        ],
      },
      {
        heading: "Common mistakes that waste credits",
        paragraphs: [
          "Sending before Sender ID approval. Importing Excel files with notes in the phone column. Using emoji “to stand out” and doubling the segment count. Buying a 50,000-number list. Scheduling in the wrong timezone. Putting the entire newsletter into SMS instead of a 140-character prompt plus a link.",
          "Fix those and most Ghana businesses get reliable delivery on the first paid campaign. If you want a second opinion on copy length or list format, send a 10-row test and look at the logs before you scale.",
        ],
      },
      {
        heading: "What to do next",
        paragraphs: [
          "Sign up, register a Sender ID, import a real (small) list, send to yourself, then schedule or send the live campaign. Pricing is on /pricing. API details are on /api-docs. Smart Forms are on /smart-forms. WordPress is on /integrations/wordpress.",
          "Bulk SMS in Ghana is not a mystery. It is a short checklist executed in order. SplitSMS is built so that checklist fits in one afternoon, not a six-month carrier project.",
        ],
      },
    ],
  },
  {
    slug: "sms-campaign-roi-ghana-businesses",
    title: "SMS Campaign ROI in Ghana: How to Measure What Every Text Is Worth",
    excerpt:
      "A practical way to calculate bulk SMS return: cost per delivered message, conversion, collections, and no-show reduction — with examples in GHS.",
    category: "Strategy",
    readTime: "15 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "SMS ROI Ghana",
      "bulk SMS return on investment",
      "SMS campaign results",
      "measure SMS marketing",
      "SMS cost per conversion Ghana",
    ],
    sections: [
      {
        paragraphs: [
          "SMS feels cheap until nobody can say whether it paid for itself. Finance will ask. Pastors will ask. School bursars will ask. The answer is not “open rates are 90%.” Open rates are a reason to test SMS, not proof that a campaign made money.",
          "This article shows how Ghana teams can measure SMS the same way they measure MoMo charges: credits out, results in. You do not need a data warehouse. You need a campaign name, a wallet debit, and one outcome you already track — payments, bookings, attendance, or sales.",
        ],
      },
      {
        heading: "Start with cost you can audit",
        paragraphs: [
          "SplitSMS shows sent count, failed count, and credits used per campaign. Cost = credits used × your effective GHS per credit. If Ghana is GHS 0.029 per segment and you sent 2,000 one-segment messages, that is about GHS 58. Two-segment messages double it. Failed sends that never left the platform should not be counted as “delivered cost.”",
          "Write the campaign name in a sheet: date, audience size, segments, credits, GHS, and the offer. If you skip this, you will not remember whether last month’s PTA reminder was 400 or 4,000 people.",
        ],
      },
      {
        heading: "Pick one primary outcome per send",
        paragraphs: [
          "Retail: unique discount codes redeemed, or till sales in a 24-hour window versus a quiet Tuesday. Collections: fees received in 72 hours versus the previous term without SMS. Clinics: no-show rate this week versus last month. Churches: confirmed seats versus last event.",
          "If you track five outcomes, you will credit SMS for everything and learn nothing. One campaign, one number. Secondary effects (brand recall) can wait until the primary number is stable.",
        ],
      },
      {
        heading: "A simple GHS example: fee reminder",
        paragraphs: [
          "A school texts 800 parents a one-segment reminder. Cost ≈ GHS 23. In the next three days, 40 extra families pay GHS 400 each who usually delay two weeks. That is GHS 16,000 of cash moved earlier — not new revenue, but cash-flow you can use for payroll. ROI on timing is still ROI for a bursar.",
          "If only 5 extra families pay, SMS still likely beat a printer-and-envelope reminder. Compare to the actual alternative you would have used, not to a fantasy of 100% payment.",
        ],
      },
      {
        heading: "A simple GHS example: flash sale",
        paragraphs: [
          "A retailer texts 1,200 opted-in customers a one-segment 15% code. Cost ≈ GHS 35. Thirty people redeem with an average extra basket of GHS 80 attributable to the code. That is GHS 2,400 gross. After product cost, if contribution margin is 30%, SMS contributed about GHS 720 against GHS 35 spend. That is a campaign worth repeating.",
          "If nobody redeems, the copy, timing, or list is wrong — not “SMS is dead.” Test a shorter offer, a Saturday 10am send, or a smaller VIP group before you abandon the channel.",
        ],
      },
      {
        heading: "Count no-shows as money too",
        paragraphs: [
          "A salon slot that sits empty is lost revenue you already staffed for. If SMS reminders cut no-shows from 20% to 8% on 50 weekly appointments at GHS 80 each, you recovered about 6 appointments × GHS 80 = GHS 480 per week. A weekly reminder to 50 people is a few cedis. That math is why clinics and salons stay on SMS even when they never run “marketing” campaigns.",
        ],
      },
      {
        heading: "Do not confuse delivered with converted",
        paragraphs: [
          "High delivery with zero action usually means the message asked for nothing, asked for too much, or went to people who did not care. Delivery is a health check on Sender ID and numbers. Conversion is a health check on offer and audience.",
          "SplitSMS logs help you separate the two. If delivery is poor, fix routing and lists first. If delivery is fine and conversion is poor, fix the sentence you sent.",
        ],
      },
      {
        heading: "Attribution without pretending you have Google Ads",
        paragraphs: [
          "Use unique codes per campaign (EAST15 vs EAST15B). Use unique Smart Form links per poster versus SMS. Ask “How did you hear?” at till for a week. None of this is perfect. It is better than guessing.",
          "OTP and order SMS are not ROI campaigns. They are cost of doing business, like receipts. Track their cost under operations, not marketing. Mixing them inflates “SMS marketing spend” and makes promotions look worse than they are.",
        ],
      },
      {
        heading: "A monthly SMS scorecard",
        paragraphs: [
          "Once a month, list campaigns, GHS spent, primary outcome, and a one-line note (repeat / rewrite / kill). Share it with whoever pays the wallet. Teams that do this keep SMS. Teams that only remember the one blast that “felt busy” eventually stop topping up.",
          "SplitSMS account reports and delivery views give you the raw counts. The scorecard is your job. Fifteen minutes at month-end is enough.",
        ],
      },
      {
        heading: "How SplitSMS makes the numbers honest",
        paragraphs: [
          "Wallet history, campaign sent/failed counts, and per-message logs mean you are not estimating from memory. API users can store message IDs against orders. WordPress users can match WooCommerce order SMS to paid orders in the same week.",
          "Start with 5 free credits, send a 20-person test, then run one campaign you can measure. Pricing is public on /pricing. If a campaign cannot be measured, it is probably too vague to send.",
        ],
      },
    ],
  },
  {
    slug: "import-csv-excel-contacts-bulk-sms",
    title: "How to Import CSV and Excel Contacts for Bulk SMS (Without Wrecking the List)",
    excerpt:
      "Prepare phone columns, Ghana number formats, merge fields, duplicates, and encoding so your first SplitSMS upload sends to real handsets — not spreadsheet artefacts.",
    category: "Guides",
    readTime: "14 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "import contacts bulk SMS",
      "CSV SMS Ghana",
      "Excel phone list SMS",
      "upload contacts SplitSMS",
      "bulk SMS contact import",
    ],
    sections: [
      {
        paragraphs: [
          "Most bulk SMS problems start in the spreadsheet, not the gateway. A column of names in the phone field, numbers stored as 2.33E+11, leading zeros stripped by Excel, or a mix of 024… and +233… in the same file will fail a chunk of your blast and make the report look like the platform is broken.",
          "This guide is the checklist we wish every first-time sender used before clicking Upload on SplitSMS. It applies whether you export from a school MIS, a church membership sheet, WooCommerce, or a Google Sheet.",
        ],
      },
      {
        heading: "Use a boring file on purpose",
        paragraphs: [
          "Save as CSV UTF-8 when you can. XLSX often works, but CSV fails less often on commas inside names. One header row. One phone column with a clear name: phone or mobile. Optional columns: first_name, last_name, email, group, amount, due_date — only if you will actually merge them.",
          "Delete decorative header rows, merged cells, and “Notes” sheets. SplitSMS cannot guess that row 4 is a title and row 5 is data. If your export has junk at the top, delete it in Excel first.",
        ],
      },
      {
        heading: "Fix Ghana numbers before you import",
        paragraphs: [
          "Pick one format and convert the whole column. International without plus — 233201234567 — is the safest for APIs and most African gateways. Local 0201234567 is fine if every row is Ghana and you convert on import. Mixing 020, 23320, +233 20, and 00233 in one file is how duplicates and fails appear.",
          "In Excel, format the phone column as Text before you paste, or you will lose the leading 0. If you already lost zeros, a formula that prepends 233 and strips spaces and dashes will save the file. Remove letters, parentheses, and “WhatsApp only” notes from the phone column — those belong in a notes column, not in to.",
        ],
      },
      {
        heading: "Stop Excel from eating your numbers",
        paragraphs: [
          "Scientific notation (2.332E+11) is not a phone number. Set the column to Text, re-paste from a source that still has the full digits, or import using Google Sheets (File → Import) which is slightly kinder to long numbers. Then export CSV.",
          "If you maintain the master list in Sheets, connect Google Sheets to SplitSMS when you send often. Re-uploading a damaged Excel file every Friday is how errors return.",
        ],
      },
      {
        heading: "Map merge fields only when the data is real",
        paragraphs: [
          "Personalization like Hi {first_name}, your balance is GHS {amount} is powerful for collections. It is embarrassing when {first_name} is blank or “N/A”. Scan the column for empties. Use a fallback in copy (“Hi parent”) if many rows have no name.",
          "Keep merge tokens matching the SplitSMS field names you mapped on upload. A heading called “Student” will not fill {first_name} unless you map it. Test on three rows: a complete row, a row with only a phone, and a row with a weird character in the name.",
        ],
      },
      {
        heading: "Dedupe like you mean it",
        paragraphs: [
          "Same parent with two children should get two fee texts if the amounts differ, or one combined text if you wrote it that way. Same person in “Members” and “Choir” should not get the same event SMS twice. Deduplicate on normalized phone, not on name (two people named Ama is normal).",
          "SplitSMS groups help: import once into Parents-2026, then send. Do not import the same CSV into a new group every week without removing the old one.",
        ],
      },
      {
        heading: "Respect consent in the file itself",
        paragraphs: [
          "Add a column opted_in or source (checkout, form, staff). Filter marketing sends to opted_in = yes. Transactional fee and OTP lists can be wider, but still must be your members or customers — not a purchased dump.",
          "When someone says stop, remove them from promo groups the same day. Leaving STOP numbers in the next blast is how you get complaints and poor routing reputation.",
        ],
      },
      {
        heading: "Import into SplitSMS",
        paragraphs: [
          "Open Contacts, choose import, upload the CSV, map phone (required) and any merge columns, pick or create a group, and review the preview rows. If the preview shows blank phones, cancel and fix the file. Do not “send anyway.”",
          "After import, spot-check five random contacts. Then send a test campaign to a group that contains only your team. If those arrive with the right Sender ID and merge values, the list is ready.",
        ],
      },
      {
        heading: "After the send: clean from the report",
        paragraphs: [
          "Export or scan failed numbers. Invalid format and not a subscriber should leave the group. Temporary failures can be retried once; permanent invalids should not. A cleaner list next month is cheaper than a bigger list this month.",
          "If you use Smart Forms, new phones can land in a group automatically so you are not copying from a form export every Monday. That is the long-term fix for messy CSVs.",
        ],
      },
      {
        heading: "When to skip CSV entirely",
        paragraphs: [
          "Google Contacts import, Google Sheets connect, WooCommerce order SMS, and the API are all better than a weekly Excel ritual when the data already lives in those systems. CSV is for one-off lists and schools that still live in spreadsheets. Use it well, then graduate the repeating workflows.",
          "Need a working file today? One header, one phone column in 233 format, a short test group, then the real group. SplitSMS signup includes trial credits so the first test does not require a Paystack top-up.",
        ],
      },
    ],
  },
  {
    slug: "otp-sms-production-guide-ghana",
    title: "OTP SMS in Production: Delivery, Security, Cost, and What Breaks at Scale",
    excerpt:
      "A full production checklist for SMS one-time passwords in Ghana: Sender IDs, timeouts, retries, webhooks, fraud, and how SplitSMS OTP APIs fit a real login stack.",
    category: "Developers",
    readTime: "16 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "OTP SMS Ghana",
      "SMS verification API",
      "two factor SMS Africa",
      "OTP delivery Ghana",
      "SplitSMS OTP",
      "send OTP SMS API",
    ],
    sections: [
      {
        paragraphs: [
          "A demo OTP that arrives on your phone is not a production OTP system. Production means the code arrives in seconds on MTN, Telecel, and AirtelTigo, expires on time, cannot be reused, is rate-limited, and does not bankrupt you when a bot hammers /login.",
          "SplitSMS gives you send/verify style OTP endpoints, sandbox keys, and delivery webhooks so you are not inventing carrier accounts. This article is the operational layer around those APIs — the parts that usually fail after launch.",
        ],
      },
      {
        heading: "Use a dedicated OTP Sender ID and template",
        paragraphs: [
          "Do not send “Your code is 123456” from a marketing Sender ID that also blasts sales. Carriers and users treat OTP as transactional. Register a clear brand ID and keep the template stable: {brand}: your code is {code}. Valid 10 min. Do not share.",
          "Changing the wording every week looks like phishing. Ghana users already see a lot of fake bank texts. Consistency plus an approved Sender ID is half of trust.",
        ],
      },
      {
        heading: "Generate codes you can defend",
        paragraphs: [
          "Six digits, cryptographically random, hashed at rest if you store them, single use, 5–10 minute TTL. Do not log raw codes in application logs. Do not put the code in a URL query string that will hit analytics.",
          "SplitSMS can deliver the SMS; your app still owns session binding: this code belongs to this user-id or phone, created at this timestamp, with this attempt counter. Verify should increment attempts and lock after a small number of guesses.",
        ],
      },
      {
        heading: "Normalize Ghana numbers at the edge",
        paragraphs: [
          "If the UI accepts 0201234567, convert to 233201234567 before you call SplitSMS. If you accept +233, strip formatting. Failed OTP is often “we stored 020… and sent 20…” — a missing digit, not a downed network.",
          "Reject numbers that are too short after normalization. Show the user the destination you will text (masked) so they can correct a typo before you spend a credit.",
        ],
      },
      {
        heading: "Rate limit like an attacker is already here",
        paragraphs: [
          "Cap OTP sends per phone per hour and per IP per hour. Bots will use you as a free SMS cannon against random Ghana numbers. That is a cost incident and a carrier reputation incident.",
          "Add a cooldown between resends (45–60 seconds). SplitSMS will send what you ask; it will not know that the same phone requested 200 codes. That is your job. Use CAPTCHA on public signup if abuse appears.",
        ],
      },
      {
        heading: "Retries, idempotency, and “I didn’t get it”",
        paragraphs: [
          "The first user complaint is always “SMS didn’t come.” Check: wallet balance, Sender ID status, destination format, and the delivery webhook or dashboard log for that message id. Resend should invalidate or supersede the previous code so two valid codes are not floating.",
          "Do not retry in a tight loop on your server. If the provider returns a 4xx for a bad number, stop. If it is 5xx or timeout, retry with backoff and an idempotency key so you do not double-send on network blips.",
        ],
      },
      {
        heading: "Webhooks close the loop",
        paragraphs: [
          "Subscribe to delivery webhooks, verify HMAC signatures, and store status on the OTP record. Your support screen should show “delivered to network at 14:02” instead of “we think we sent it.”",
          "Pending for many minutes on one network may be a routing issue — split a sample across networks before you blame the user. The SplitSMS delivery webhook article covers payload fields and retries.",
        ],
      },
      {
        heading: "Cost control for OTP at scale",
        paragraphs: [
          "OTP is usually one segment. Cost is volume × rate. A fintech sending 50,000 OTP a day needs wallet alerts and a daily cap dashboard-side so a bug cannot drain GHS thousands overnight. SplitSMS low-balance emails exist so someone gets pinged before sends start failing.",
          "Sandbox keys exist so CI and staging never hit live credits. Promote to live keys only on the production server. Never ship sk_live_ in a mobile app.",
        ],
      },
      {
        heading: "SMS OTP vs WhatsApp vs authenticator apps",
        paragraphs: [
          "Authenticator apps are stronger against SIM-swap. SMS OTP is what Ghana users complete without installing anything. Many products use SMS for signup and offer TOTP later. WhatsApp OTP depends on the user having WhatsApp and data. SMS remains the fallback that works on a feature phone in a village.",
          "SplitSMS is the SMS layer. If you add WhatsApp later, keep SMS as backup for the users who will never scan a QR.",
        ],
      },
      {
        heading: "Launch checklist",
        paragraphs: [
          "Approved Sender ID. Sandbox test. Live test on three networks. Rate limits. Expiry and attempt caps. Webhooks verified. Wallet alert. No codes in logs. Masked phone on the verify screen. Support playbook for “I didn’t get the SMS.”",
          "Create an API key with sms.send from the SplitSMS dashboard, read /api-docs, and start with the OTP endpoints rather than a homemade “send random number via bulk SMS” job. The bulk endpoint is the wrong tool for login codes.",
        ],
      },
      {
        heading: "SIM-swap and social engineering",
        paragraphs: [
          "SMS OTP is phishable. Attackers call users and ask them to read the code. Your UI should say SplitSMS / your brand will never call to ask for this code. High-value actions (password change, payout account) can require a second factor or a delay.",
          "You cannot fix SIM-swap with a nicer template. You can reduce damage with alerts: “A login code was sent. If this was not you, reset your password.” SplitSMS can deliver that SMS; your app decides when to send it.",
        ],
      },
      {
        heading: "International numbers and roaming",
        paragraphs: [
          "If your product has Ghana plus Nigeria or diaspora users, do not assume one Sender ID and one rate. Check SplitSMS country pricing, test a real roaming handset if you claim “works abroad,” and fail closed when the number country is unsupported rather than billing a surprise route.",
          "Store the country with the user profile. Retrying a UK number on a Ghana-only assumption is a common staging-vs-production bug.",
        ],
      },
    ],
  },
  {
    slug: "logistics-delivery-sms-ghana",
    title: "Logistics and Delivery SMS in Ghana: Keep Customers Updated Without Call-Center Chaos",
    excerpt:
      "How couriers, last-mile teams, and e-commerce brands use SMS for pickup, out-for-delivery, failed attempt, and COD — with copy you can steal and a SplitSMS setup that scales.",
    category: "Use cases",
    readTime: "15 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "delivery SMS Ghana",
      "courier SMS notifications",
      "logistics SMS Africa",
      "out for delivery SMS",
      "e-commerce shipping SMS Ghana",
    ],
    sections: [
      {
        paragraphs: [
          "Ghana customers will call if they do not know where a parcel is. Each call costs more than an SMS. The brands that feel “premium” in last-mile are often just consistent: order confirmed, packed, out for delivery, delivered, or we missed you — each as a short text from a known Sender ID.",
          "This playbook is for courier startups, shopify-style stores, pharmacies doing dispatch, and marketplaces that still coordinate riders on WhatsApp. WhatsApp is fine for the rider group. The customer should get SMS because it does not depend on them being in your broadcast list.",
        ],
      },
      {
        heading: "Map the journey to four or five texts, not twelve",
        paragraphs: [
          "Too many texts and people mute you. A solid set: (1) order received, (2) out for delivery with a window, (3) delivered or we missed you with a next step. Optional: delay if the rider is stuck in Accra traffic longer than the window you promised.",
          "Do not SMS every warehouse scan. That is noise. SMS the moments the customer would have called about.",
        ],
      },
      {
        heading: "Copy that works on the road",
        paragraphs: [
          "Out for delivery: {brand}: Your order {id} is out for delivery in Accra today 2–5pm. Rider will call. Help: 055…. Missed: {brand}: We missed you for order {id}. Please call {phone} to reschedule today. Keep under 160 characters when you can so one credit covers it.",
          "Include the order id. Without it, your support line becomes a guessing game. Include a human phone or WhatsApp for exceptions — SMS should reduce calls, not eliminate a contact path when the gate is locked.",
        ],
      },
      {
        heading: "Hook SMS to the system that already knows the status",
        paragraphs: [
          "If orders live in WooCommerce, use the SplitSMS WordPress plugin for paid / processing / completed — plus a custom status if you added “out for delivery.” If orders live in your own Node or Laravel app, fire SplitSMS send on status change with the same Sender ID you use for OTP.",
          "Riders should not be responsible for remembering to text. If the status is in software, the SMS should be in software. Manual “please SMS the customer” in a WhatsApp group does not survive a 200-order Saturday.",
        ],
      },
      {
        heading: "Failed delivery is where SMS earns its keep",
        paragraphs: [
          "The expensive failure is a second trip. A same-day “we came, nobody answered, here is a number” text recovers a surprising share of parcels. Pair it with a Smart Form link to pick a new window if you do not want the phone to ring.",
          "Log the SMS next to the attempt in your ops tool. When a customer claims “nobody came,” you have a timestamp and a delivered SMS. That is not aggression; it is how you train riders and customers at the same time.",
        ],
      },
      {
        heading: "Cash on delivery and MoMo",
        paragraphs: [
          "If you collect cash or MoMo on delivery, SMS the amount before the rider arrives: Please have GHS {amount} ready for order {id}. Surprise amounts cause refused parcels. If they already paid, say so — Paid. Rider bringing your order {id} — so they do not pay twice.",
        ],
      },
      {
        heading: "Numbers, Sender IDs, and trust",
        paragraphs: [
          "Use an approved brand Sender ID. A random number looks like a scam, especially when the text mentions money. Register the ID before you promise customers “we will text you.”",
          "Store the customer phone from checkout in international format. Delivery to 024… vs 23324… should be a solved problem in your order table, not a debate at 7pm.",
        ],
      },
      {
        heading: "Cost for a real volume day",
        paragraphs: [
          "Three one-segment SMS per order × GHS 0.029 is under 9 pesewas of SMS per parcel in Ghana. One avoided failed trip pays for hundreds of texts. If you send six status texts per order, cut it down — the extra two are not “engagement,” they are noise.",
          "Watch the wallet on peak days. SplitSMS low-balance alerts exist so Friday promo plus Saturday dispatch does not silently stop mid-route.",
        ],
      },
      {
        heading: "What to implement this week",
        paragraphs: [
          "List your order statuses. Assign at most five to SMS. Write templates with {id} and {amount}. Connect WooCommerce or your API. Test on all three major networks. Then turn it on for live orders, not for a fake staging customer only you remember.",
          "Signup, Sender ID, and a test credit run are enough to prove the idea. Expand to Smart Forms for reschedule links once the basic status texts are boringly reliable.",
        ],
      },
      {
        heading: "Riders, dispatchers, and who owns the template",
        paragraphs: [
          "If riders can edit the SMS wording from a phone, you will get typos, extra charges (added emoji), and the occasional angry paragraph. Keep templates in the office system. Riders update status; software sends the text.",
          "Give dispatch a SplitSMS login only if they need to send a one-off exception. Most teams never need that. Exceptions can be a saved “missed delivery” campaign to a one-number group.",
        ],
      },
      {
        heading: "Multi-drop days and rate limits",
        paragraphs: [
          "A 400-drop Saturday is 400–1,200 SMS if you send two or three per order. That is still a small wallet hit in Ghana. The failure mode is not cost — it is a script that loops on “pending” and resends. Idempotency on order-id + status is mandatory in your code.",
          "SplitSMS will send what you POST. Your dispatch app must not POST “out for delivery” twice because the rider toggled the button. That is a product bug, not an SMS bug.",
        ],
      },
    ],
  },
  {
    slug: "personalize-bulk-sms-merge-fields",
    title: "How to Personalize Bulk SMS: Names, Amounts, Dates, and Merge Fields That Don’t Look Fake",
    excerpt:
      "When to use merge fields in Ghana bulk SMS, how to prepare the data, and example templates for fees, appointments, and retail — plus the mistakes that make personalized texts worse than a generic blast.",
    category: "SMS Marketing",
    readTime: "14 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "personalized bulk SMS",
      "SMS merge fields",
      "custom SMS Ghana",
      "mail merge SMS",
      "dynamic SMS campaign",
    ],
    sections: [
      {
        paragraphs: [
          "A generic blast is fine for “we are closed tomorrow.” It is weak for “you owe GHS 450” or “Ama, your 2pm is confirmed.” Personalization is not a gimmick. It is how collections, clinics, and schools get action without a phone tree.",
          "It is also how you accidentally send Hi {first_name} to 3,000 people if the CSV column is empty. This guide is about doing merge fields the unglamorous way: data first, copy second, test third, blast fourth.",
        ],
      },
      {
        heading: "What is worth personalizing",
        paragraphs: [
          "Worth it: first name when you have it, amount due, due date, order id, appointment time, class or child’s name for schools. Not worth it: last name, middle name, fake “we miss you {name}!!!” energy on a promo that is really a 10% coupon.",
          "If 40% of rows have no first name, do not merge first name. Use a segment: named vs unnamed. Or use a role: Hi parent, Hi member. Honesty beats a blank token.",
        ],
      },
      {
        heading: "Prepare the sheet as if a robot will read it",
        paragraphs: [
          "One row per recipient. Phone required. Merge columns with stable headers: first_name, amount, due_date, student. No “GHS 450.00 “ with a trailing space in some rows and “450” in others if you plan to print the value as-is. Normalize currency in the template (“GHS {amount}”) and keep amount numeric in the file.",
          "Dates should be human in the SMS: 12 Sep, not 2026-09-12T00:00:00Z. Convert in the sheet before import. SplitSMS will substitute what you give it; it will not guess your school’s term calendar.",
        ],
      },
      {
        heading: "Templates you can copy",
        paragraphs: [
          "Fees: {school}: Dear parent, {student}’s fees of GHS {amount} are due {due_date}. Pay at the office or MoMo. Ignore if paid. Clinic: {clinic}: Hi {first_name}, reminder — {time} on {date}. Reply 1 to confirm. Retail: {brand}: {first_name}, your code EAST15 is valid till 8pm at East Legon.",
          "Count characters with a real name and a worst-case long name. “Anastasia” should not push you into a second segment unless you accept the cost. The SplitSMS compose preview exists for this.",
        ],
      },
      {
        heading: "Preview is not optional",
        paragraphs: [
          "Send three tests: a complete row, a row with only phone, and a row with punctuation in the name (O’Neil, Nyamekye). Read them on a physical phone. If any token leaks as {amount}, stop the campaign.",
          "Then send to a 10-person staff group. Only then the real group. Personalized mistakes feel ruder than generic mistakes because they look targeted.",
        ],
      },
      {
        heading: "Segmentation is personalization’s quieter cousin",
        paragraphs: [
          "Often you do not need {first_name}. You need two campaigns: Accra vs Kumasi, paid vs unpaid, members vs visitors. That is still “personal” in the useful sense. Over-merging a bad list is worse than two clean generic texts.",
          "SplitSMS contact groups are how you do this without a CRM. Name groups after the decision, not after the date you imported the file.",
        ],
      },
      {
        heading: "Transactional vs promo tone",
        paragraphs: [
          "Fee and appointment SMS should sound like the institution. Promo SMS can be warmer but still short. Do not mix a debt reminder and a pizza coupon in one personalized paragraph. People remember the coupon and forget the debt — or get angry about both.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: [
          "Amounts and student names are sensitive. Do not forward the CSV on WhatsApp. Limit who can export SplitSMS contacts. If a phone is shared in a household, think about what the SMS reveals on the lock screen. Sometimes “fees due” without the amount is enough.",
        ],
      },
      {
        heading: "Where the data should live long term",
        paragraphs: [
          "If every send starts from a new Excel export, merge fields will keep breaking. Smart Forms, Google Sheets connect, and the API keep phone + metadata together. CSV is a bridge, not a strategy.",
          "Start with one personalized reminder campaign this week, ten test rows, then scale. SplitSMS trial credits cover the tests. Public pricing is on /pricing.",
        ],
      },
      {
        heading: "Unicode, names, and accidental extra segments",
        paragraphs: [
          "A Ghanaian name with a character outside the GSM alphabet, or a single emoji in the template, can switch the whole message to Unicode and cut the segment from 160 characters to 70. That doubles cost for every recipient, not just the one with the special character — depending on how the campaign is encoded.",
          "Keep templates in plain English or carefully tested Twi copy. If you must use native script, accept the segment cost in the estimate before you send. Never add emoji “for warmth” on a 3,000-parent fee reminder.",
        ],
      },
      {
        heading: "Legal and reputational lines",
        paragraphs: [
          "Personalized debt SMS should not shame people in a shared household. Avoid “you are a defaulter” language. State the amount and the pay-by date. If a number is a company gate phone, do not merge a child’s name onto it.",
          "Ghana promotional SMS should still offer a stop path. Personalization does not cancel consent rules. See the compliance article on this blog for Sender IDs and opt-outs.",
        ],
      },
    ],
  },
  {
    slug: "school-parent-sms-playbook-ghana",
    title: "School Parent SMS Playbook for Ghana: Fees, Attendance, Exams, and Emergencies",
    excerpt:
      "A detailed operating guide for Ghana schools and training centres: which messages to send, when to send them, how to keep lists clean, and how SplitSMS replaces scattered WhatsApp groups for official notices.",
    category: "Use cases",
    readTime: "16 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "school SMS Ghana",
      "parent SMS alerts",
      "school fee reminder SMS",
      "PTA SMS Ghana",
      "education bulk SMS",
    ],
    sections: [
      {
        paragraphs: [
          "WhatsApp groups are where rumours live. Official school communication should be boring, timestamped, and complete: every parent who should have heard it, heard it. SMS is still the channel that reaches a guardian on a feature phone in traffic, without data, without being an admin of 84 groups.",
          "This playbook is for private basic schools, SHS support programmes, crèches, and training centres in Ghana. It assumes you already have a term calendar and a spreadsheet of phones. SplitSMS is how you send without forwarding a broadcast list to a teacher’s personal phone.",
        ],
      },
      {
        heading: "Decide what is official SMS vs what stays on WhatsApp",
        paragraphs: [
          "SMS: fee due dates, exam timetables, closures, emergency pickup, PTA date and time, report-card collection. WhatsApp: class photos, optional bake sales, teacher chatter. If everything is SMS, parents mute you. If nothing official is SMS, the bursar spends the term on calls.",
          "Write this split down. When a teacher asks to “just SMS the whole school” about a lost water bottle, the answer is no.",
        ],
      },
      {
        heading: "Build groups the way the school is actually organised",
        paragraphs: [
          "Groups by class or year are enough for most schools: Creche, BS1, BS2, JHS1. Add Staff, Board, and Transport if those lists are real. Do not make 40 groups you will not maintain. A parent with two children should be in two class groups or in one “All parents” group plus class groups — pick a rule and stick to it so they are not double-texted on whole-school notices.",
          "Import from your admission CSV once per term. Remove withdrawn pupils the week they leave. A text to a departed family is how you look careless.",
        ],
      },
      {
        heading: "Fee reminders that collect without sounding like a threat",
        paragraphs: [
          "Cadence that works: two weeks before, three days before, due-date morning, and one arrears notice after. Personalize with student name and amount when the data is clean. Always include how to pay (MoMo short code, bank, office hours).",
          "Example: {school}: Reminder — {student} term fees GHS {amount} due {date}. Pay via MoMo {code} or at the office 8am–2pm. Ignore if paid. That last sentence saves you from angry parents who already paid.",
        ],
      },
      {
        heading: "Attendance and pickup",
        paragraphs: [
          "Same-day absence SMS (“{student} is not in school as of 8:30am — please call the office”) is an operational product, not marketing. It requires a process: who marks the register, who clicks send. If that process is not real, do not promise parents you will text.",
          "Emergency early closing should be SMS to all, not a WhatsApp hop from headteacher to teachers to parents. Minutes matter when rain floods a compound.",
        ],
      },
      {
        heading: "Exams, reports, and PTA",
        paragraphs: [
          "Send the timetable a week ahead and the morning of the first paper. Send report collection window once, with a reminder 24 hours before. PTA: date, time, whether attendance is required, and whether there is a fee for the meeting (be honest).",
          "Keep each SMS to one event. Combining PTA + fees + sports day in one paragraph guarantees nobody notes the time.",
        ],
      },
      {
        heading: "Sender ID and who is allowed to send",
        paragraphs: [
          "Register the school’s trading name as Sender ID. Do not send from a teacher’s personal name. Limit dashboard logins. A leaked password plus a parent list is a data incident. SplitSMS accounts should follow the same seriousness as your fee records.",
        ],
      },
      {
        heading: "Cost for a term",
        paragraphs: [
          "A 400-parent school sending eight one-segment official SMS in a term is 3,200 segments. At about GHS 0.029 that is roughly GHS 93 for the whole term’s official spine — less than one banner print run. Arrears and emergency texts are extra and still cheap next to empty seats.",
          "Budget it as operations, not “marketing.” Parents are not a promo audience; they are the school’s partners. Consent still matters for fundraising blasts that are not about their child’s fees or safety.",
        ],
      },
      {
        heading: "Smart Forms for events and new admissions",
        paragraphs: [
          "Use a Smart Form for sports day registration or new-intake enquiries so phones land in a group with a confirmation SMS. That is cleaner than a paper list typed by a tired secretary on Sunday night.",
          "You can still export CSV for the office. The win is that the parent already got “we received this” on their lock screen.",
        ],
      },
      {
        heading: "A one-term starter plan",
        paragraphs: [
          "Week 0: Sender ID, import class groups, test to staff. Week 1: fee reminder template. Mid-term: one PTA or exam SMS. Keep a shared doc of templates so you are not rewriting from memory. Review failed numbers after the first whole-school send.",
          "Sign up at splitsms.com/signup, claim trial credits, and run the staff test this week. The short “school fee alerts” story on this blog is a cousin of this playbook; this one is the operating manual.",
        ],
      },
    ],
  },
  {
    slug: "sms-delivery-reports-failed-messages-ghana",
    title: "SMS Delivery Reports Explained: Why Messages Fail in Ghana and How to Fix Them",
    excerpt:
      "Sent, delivered, failed, pending — what each status means on SplitSMS, the usual Ghana causes (numbers, Sender IDs, wallet, networks), and a practical repair order for your next campaign.",
    category: "Guides",
    readTime: "15 min read",
    published: "2026-08-23",
    updated: "2026-08-23",
    keywords: [
      "SMS delivery report Ghana",
      "SMS failed delivery",
      "SMS not delivered Ghana",
      "DLR SMS",
      "SplitSMS delivery logs",
    ],
    sections: [
      {
        paragraphs: [
          "If you cannot explain a failed SMS, you will keep paying for the same mistakes. Delivery reports (DLR) are how SplitSMS and the carriers tell you what happened after you clicked send. They are not perfect — some phones never return a receipt — but they are far better than hoping.",
          "This article translates the statuses you will see in the dashboard and in webhooks, then gives a repair order so you do not change five things at once.",
        ],
      },
      {
        heading: "The statuses that matter",
        paragraphs: [
          "Queued or sending means SplitSMS accepted the job. Sent to network means a carrier took it. Delivered means a handset-level or network-level success came back. Failed means the route or number was rejected. Pending too long often means the network has not said yet — wait, then treat as failed if your SLA is tight (OTP).",
          "Do not celebrate “sent” for OTP. Celebrate delivered, or a login that succeeded. Campaigns can tolerate a small fail rate. Login cannot.",
        ],
      },
      {
        heading: "Cause 1: the number was never a number",
        paragraphs: [
          "Too short, letters in the field, Excel scientific notation, missing 233, extra zeros. These fail fast and should be stripped from the group. If 20% of a school list fails, the MIS export is wrong — do not keep blasting it.",
        ],
      },
      {
        heading: "Cause 2: Sender ID",
        paragraphs: [
          "Unapproved, rejected, or mistyped Sender ID is a classic “works on my phone with a test ID, fails in production” story. Check Dashboard → Sender IDs before you schedule 10,000. If the ID was approved last month and suddenly fails, check whether you switched routes or spelled it differently in the API payload.",
        ],
      },
      {
        heading: "Cause 3: wallet and credits",
        paragraphs: [
          "Empty wallet stops the queue. Partial sends happen when credits run out mid-campaign. Top up, then use retry only for the unsent remainder — not the whole list, or you double-text people who already got it. SplitSMS can email you on low balance so this is not a surprise on Monday morning.",
        ],
      },
      {
        heading: "Cause 4: the destination line",
        paragraphs: [
          "Barred, inactive, or ported numbers fail at the network. There is nothing to “fix” except removing them. Porting between Ghana networks can lag; a number that worked last term might fail this term. Cleaning after each term is cheaper than arguing with a parent whose line is dead.",
        ],
      },
      {
        heading: "Cause 5: content and filters",
        paragraphs: [
          "Heavy URL shorteners, “WIN NOW”, fake bank language, or unicode that looks like a different brand can be filtered. If tests to your own phone work but a promo blast fails at scale, read the copy like a fraud filter. Then resend a calmer version to a small slice.",
        ],
      },
      {
        heading: "How to read a campaign like an engineer",
        paragraphs: [
          "Look at fail rate by prefix (024 vs 020 vs 027) if you can. A single prefix collapsing points at a network or a formatting bug for that prefix. Uniform low delivery across prefixes points at Sender ID or account routing. A handful of fails in a huge list is normal.",
          "Developers should log provider message ids and webhook status. Support should ask for campaign id and a sample phone, not “SMS is down.”",
        ],
      },
      {
        heading: "Retries without making it worse",
        paragraphs: [
          "Retry failed-invalid? No. Retry failed-temporary or pending after 15 minutes? Once, for OTP and critical alerts. Retry the entire delivered list? Never. SplitSMS admin tools can retry insufficient-credit cases after a top-up — that is the right kind of retry.",
        ],
      },
      {
        heading: "Make reports part of the weekly habit",
        paragraphs: [
          "After every large send, export or scan fails, update the group, and note the fail rate in your SMS scorecard. That is how lists get healthier and costs go down.",
          "Open your last campaign in SplitSMS, pick ten fails, and classify them with this article. If you cannot classify them, send the campaign id to support. Guessing is how rumours about “the network” start.",
        ],
      },
      {
        heading: "OTP is a special case",
        paragraphs: [
          "A marketing blast can live with 4% failed. A login code cannot. For OTP, treat pending longer than a minute as a support event: check Sender ID, destination format, and wallet, then resend once with a new code. Do not queue three codes to the same phone in ten seconds — the user will type the first one that arrives, which may already be invalid.",
          "Store the provider message id on the OTP row. When someone writes “I never got it,” you should see delivered, failed, or still pending before you argue. The production OTP guide on this blog covers rate limits and webhooks in more depth.",
        ],
      },
      {
        heading: "What “unknown” or missing DLR really means",
        paragraphs: [
          "Some networks return a thin acknowledgement and never a final delivered flag. If the user received the text, your report can still look pending. That is why you should not refund or retry solely on a missing DLR when the customer says they have the SMS. Ask them to reply with the last three digits of the Sender ID they saw.",
          "If nobody on that network is getting DLR and nobody is receiving, that is a route problem. If DLR is missing but people are logging in, do not panic-retry. Log it, and mention it to support with timestamps.",
        ],
      },
      {
        heading: "A one-page repair order",
        paragraphs: [
          "1) Wallet. 2) Sender ID spelling and approval. 3) Sample five failed numbers — format vs barred. 4) Fail rate by network prefix. 5) Copy/filter suspicion on promos. 6) Retry only the unsent or truly temporary fails. 7) Update the group. 8) Write the fail % in your monthly SMS notes.",
          "Do this in order. Skipping to “maybe we need another provider” before step 3 is how teams churn platforms and keep the same spreadsheet.",
        ],
      },
    ],
  },
  {
    slug: "how-to-choose-splitsms",
    title: "How to Choose SplitSMS: A Buyer’s Guide for Ghana Businesses",
    excerpt:
      "Compare pricing clarity, Sender IDs, wallet credits, Google & WordPress connect, and API depth so you know when SplitSMS is the right SMS platform.",
    category: "Guides",
    readTime: "9 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "how to choose SplitSMS",
      "best SMS platform Ghana",
      "SplitSMS vs SMS gateway",
      "buy bulk SMS Ghana",
      "SMS provider comparison Ghana",
    ],
    sections: [
      {
        paragraphs: [
          "Choosing an SMS platform in Ghana is not only about the lowest GHS-per-segment quote. You need approved Sender IDs, predictable wallet top-ups, delivery that reaches MTN, Vodafone, and AirtelTigo, and tools your team will actually open every day—dashboard campaigns, WordPress hooks, Google Sheets, and a REST API when you scale.",
          "SplitSMS is built for that mix: pay-as-you-go credits, Connect Google and WordPress without Zapier for common paths, Smart Forms with SMS automation, and developer-ready OTP and send APIs. This guide helps you decide whether SplitSMS fits your stage.",
        ],
      },
      {
        heading: "Checklist before you buy any SMS provider",
        paragraphs: [
          "Ask for transparent country rates (especially Ghana), how Sender ID approval works, whether credits expire, and how failed messages are reported. Confirm sandbox or free credits so you can test before a blast.",
          "Map your workflows: spreadsheet lists, website checkouts, Google Forms registrations, OTP logins, or reseller clients. The right provider covers those paths without five extra subscriptions.",
        ],
      },
      {
        heading: "When SplitSMS is a strong fit",
        paragraphs: [
          "Choose SplitSMS if you want Ghana-friendly pricing with a modern dashboard, API keys for your product, WordPress/WooCommerce order SMS, Google Contacts/Sheets/Forms connect, and Smart Forms for branded lead capture.",
          "It also fits agencies and resellers who need client accounts, wallets, and reporting under a partner model—without building carrier integrations yourself.",
        ],
      },
      {
        heading: "When to look elsewhere first",
        paragraphs: [
          "If you only need a one-off 50-person SMS and will never return, a lightweight tool may be enough. If your stack requires deep SMPP peering you manage yourself, compare enterprise gateways carefully.",
          "For most SMEs, churches, schools, and SaaS teams, a wallet-based platform with integrations beats a “cheap per SMS” pitch that locks you into opaque support.",
        ],
      },
      {
        heading: "How to evaluate SplitSMS in one afternoon",
        paragraphs: [
          "Sign up, claim free trial credits, register a Sender ID, send a test to your own phone, import a ten-row Sheet or Google Contact list, and optionally hit the send endpoint with a sk_test_ key.",
          "If those steps feel clear, you have your answer. Start at splitsms.com/signup, then read pricing and /google for Workspace workflows.",
        ],
      },
    ],
  },
  {
    slug: "splitsms-for-your-website",
    title: "SplitSMS for Your Website: Forms, OTP, WooCommerce & Smart Forms",
    excerpt:
      "Connect SplitSMS to any website—WordPress plugin, REST API, Smart Forms embeds, or Google Forms—so visitors get SMS confirmations they actually read.",
    category: "Integrations",
    readTime: "8 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "SMS for website",
      "website SMS notifications",
      "WordPress SMS Ghana",
      "Smart Forms SMS",
      "website OTP SMS",
      "SplitSMS for websites",
    ],
    sections: [
      {
        paragraphs: [
          "Your website already captures intent: contact forms, checkouts, bookings, newsletters. Email confirmations get buried; SMS lands on the lock screen. SplitSMS connects those website moments to reliable texts using your Sender ID and wallet.",
          "You do not need one vendor per channel. Use WordPress for store events, Smart Forms for branded lead pages, Google Forms when your team already lives in Drive, or the REST API when your stack is custom.",
        ],
      },
      {
        heading: "WordPress and WooCommerce sites",
        paragraphs: [
          "Install the official SplitSMS plugin, paste an API key, and toggle order placed, processing, and completed SMS. Forms plugins like Contact Form 7, WPForms, and Elementor Pro can trigger follow-ups too.",
          "Credits stay in your SplitSMS wallet—you oversee delivery logs without hopping between gateways.",
        ],
      },
      {
        heading: "Custom sites and SaaS products",
        paragraphs: [
          "Call the SplitSMS send and OTP endpoints from Next.js, Laravel, or Flutter backends. Sandbox keys let you ship verification flows before charging wallets for production SMS.",
          "Webhooks return delivery status so your UI can show “delivered” instead of guessing.",
        ],
      },
      {
        heading: "Smart Forms and Google Forms",
        paragraphs: [
          "Publish a Smart Form with short link or QR, embed it on your site, and enable respondent or admin SMS. Export responses to Google Sheets when ops prefers Drive.",
          "Already on Google Forms? Connect Google Forms → SMS so each submission texts the respondent within about a minute—no Apps Script paste.",
        ],
      },
      {
        heading: "Launch checklist",
        paragraphs: [
          "Approve a Sender ID, top up credits, pick the connection path that matches your CMS, and send a test from production. Guide links: /integrations/wordpress, /smart-forms, /google, and /api-docs.",
        ],
      },
    ],
  },
  {
    slug: "event-sms-playbook-ghana",
    title: "Event SMS Playbook for Ghana: RSVPs, Reminders & Day-Of Alerts",
    excerpt:
      "Run conferences, concerts, church conventions, and campus events with SMS for registrations, reminders, gate codes, and last-minute venue updates.",
    category: "Use cases",
    readTime: "9 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "event SMS Ghana",
      "conference SMS reminders",
      "RSVP SMS",
      "SMS for events",
      "church event SMS",
      "ticket SMS notification",
    ],
    sections: [
      {
        paragraphs: [
          "Events fail in the details: wrong date in email, silent WhatsApp groups, lost tickets. SMS keeps attendees informed even when data is off. SplitSMS helps organizers collect RSVPs and blast schedule changes without building a custom ticketing SMS stack.",
          "Whether you use Google Forms, Smart Forms, or a spreadsheet from sponsors, you can text confirmations and day-of logistics from one wallet.",
        ],
      },
      {
        heading: "Before the event",
        paragraphs: [
          "Capture phone numbers on registration forms and send an instant confirmation with date, venue, and any dress code. Schedule a T-minus-24h reminder and a morning-of “doors open” text.",
          "Import sponsor guest lists from Google Sheets or Contacts—select one VIP row or select all—then tag groups for speakers versus general admission.",
        ],
      },
      {
        heading: "During the event",
        paragraphs: [
          "Room changes, delayed keynotes, and security notices should go out in minutes. Keep a saved Sender ID and template drafts so ops can send without rewriting every alert.",
          "Use short links to interactive programs or Smart Forms feedback QRs posted at exits.",
        ],
      },
      {
        heading: "After the event",
        paragraphs: [
          "Thank-you texts with survey links lift response rates over email alone. Export Smart Forms feedback to Sheets for your postmortem.",
          "Comply with consent: only registered guests, offer STOP guidance for marketing follow-ups, and keep transactional day-of notices separate from promo blasts.",
        ],
      },
      {
        heading: "Starter stack",
        paragraphs: [
          "Google Forms or Smart Forms for RSVP → SplitSMS for confirmations → Sheets for the guest list → campaign blast for reminders. Sign up at splitsms.com and connect Google under Integrations when you are ready.",
        ],
      },
    ],
  },
  {
    slug: "connect-splitsms-ecommerce-checkout",
    title: "Connect SplitSMS to Your Ecommerce Checkout: Order & Payment SMS",
    excerpt:
      "Wire SplitSMS into WooCommerce, Paystack flows, and custom carts so customers get order, payment, and shipping texts that reduce support tickets.",
    category: "Integrations",
    readTime: "8 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "ecommerce SMS Ghana",
      "checkout SMS notifications",
      "WooCommerce order SMS",
      "Paystack SMS notification",
      "order confirmation SMS",
    ],
    sections: [
      {
        paragraphs: [
          "Abandoned carts and “was my payment successful?” chats eat margins. Transactional SMS at checkout, payment success, and shipping milestones cuts confusion and builds trust for Ghana shoppers who live on mobile networks.",
          "SplitSMS plugs into WooCommerce via the official plugin and into custom checkouts via API—same wallet, same Sender ID brand on every text.",
        ],
      },
      {
        heading: "WooCommerce path",
        paragraphs: [
          "Install SplitSMS for WordPress, connect your API key, and enable templates for new order, processing, and completed. Include order ID and tracking URL so customers self-serve.",
          "Test with a sk_test_ key first, then switch to live keys when templates look right.",
        ],
      },
      {
        heading: "Payment gateways and custom carts",
        paragraphs: [
          "After Paystack or card success webhooks fire, call SplitSMS send with the customer’s MSISDN. Keep the copy short: amount, reference, and support contact.",
          "For Flutter/Next storefronts, wrap send SMS in your backend—never expose API keys in the browser.",
        ],
      },
      {
        heading: "Compliance and preference",
        paragraphs: [
          "Transactional checkout SMS is expected; promotional “buy again” blasts need consent. Separate templates and segment lists accordingly.",
          "Use delivery reports to spot numbers that bounce before Black Friday week.",
        ],
      },
      {
        heading: "Next steps",
        paragraphs: [
          "Read the WooCommerce and Paystack SMS solutions pages, or jump to /integrations/wordpress and /api-docs to connect today.",
        ],
      },
    ],
  },
  {
    slug: "church-conference-sms-registration",
    title: "Church & Conference SMS: From Registration to Follow-Up",
    excerpt:
      "How churches, ministries, and faith conferences in Ghana use SplitSMS for registration confirmations, seating, offerings reminders, and post-event outreach.",
    category: "Use cases",
    readTime: "8 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "church SMS Ghana",
      "conference registration SMS",
      "ministry SMS alerts",
      "church event reminders",
      "SMS for churches",
    ],
    sections: [
      {
        paragraphs: [
          "Churches and conferences often organize with Google Forms, volunteer spreadsheets, and Word of mouth. SMS keeps thousands of attendees aligned when Wi-Fi on campus fails and WhatsApp admins sleep.",
          "SplitSMS supports Google Forms → SMS, Sheets import, Smart Forms with QR codes at the gate, and bulk campaigns for midweek reminders—without a developer on staff.",
        ],
      },
      {
        heading: "Registration week",
        paragraphs: [
          "Collect name, phone, and session preference. Automate a confirmation text with arrival time and dress code. Export form responses to Sheets for ushers.",
          "Import volunteers from Google Contacts—select all or filter by group leaders—so leadership can text the right subset.",
        ],
      },
      {
        heading: "Service and conference days",
        paragraphs: [
          "Send parking instructions, livestream links for overflow, and emergency weather notices. Keep Sender IDs recognizable (church or conference brand).",
          "Avoid spammy tone; sacred communities notice authenticity. One clear message beats three hype texts.",
        ],
      },
      {
        heading: "Follow-up and discipleship",
        paragraphs: [
          "After the event, invite first-timers to a welcome form via SMS short link. Honor opt-outs for promotional series while still allowing critical safety alerts on dedicated lists.",
        ],
      },
      {
        heading: "Get started",
        paragraphs: [
          "Connect Google under Integrations, or publish a Smart Form at /smart-forms. Start with 5 free credits on signup to validate delivery to your leadership phones.",
        ],
      },
    ],
  },
  {
    slug: "sms-for-booking-sites-appointments",
    title: "SMS for Booking Sites & Appointment Portals",
    excerpt:
      "Reduce no-shows with confirmation and reminder SMS from booking websites, clinic portals, and salon schedulers connected to SplitSMS.",
    category: "Use cases",
    readTime: "7 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "appointment SMS reminder",
      "booking website SMS",
      "clinic SMS Ghana",
      "salon appointment SMS",
      "reduce no-shows SMS",
    ],
    sections: [
      {
        paragraphs: [
          "No-shows waste chair time and clinical slots. A confirmation SMS at booking plus a reminder the day before reliably lifts show rates across Ghana salons, clinics, tutoring centers, and coworking rooms.",
          "If your booking site is WordPress, a custom React app, or a Google Form waitlist, SplitSMS can sit behind it.",
        ],
      },
      {
        heading: "WordPress booking plugins",
        paragraphs: [
          "Trigger SplitSMS from form or WooCommerce booking events via the plugin’s SMS toggles or webhooks into the send API. Include date, time, location, and reschedule instructions.",
        ],
      },
      {
        heading: "Custom booking backends",
        paragraphs: [
          "On appointment_created and appointment_reminder_job events, call SplitSMS with template variables. Store message IDs for delivery troubleshooting in support chat.",
          "OTP SMS can secure patient portals without SMS from a foreign brand the customer does not trust.",
        ],
      },
      {
        heading: "Google Form waitlists",
        paragraphs: [
          "Pop-up clinics and pop-up markets often start on Google Forms. Enable Google Forms → SMS so every signup gets a token or arrival window automatically.",
        ],
      },
      {
        heading: "Measure what matters",
        paragraphs: [
          "Track reminder send volume versus no-show rate month over month. Top up wallet ahead of peak seasons (exam week, holiday salon rush). Explore /api-docs and appointment blog tips for copy ideas.",
        ],
      },
    ],
  },
  {
    slug: "developers-choose-splitsms-over-twilio-alone",
    title: "Why Developers Connect SplitSMS Instead of Twilio Alone",
    excerpt:
      "Build OTP and alerts for Africa-first products with Ghana pricing, local Sender IDs, and the same REST patterns you expect—plus WordPress and Google connect for ops.",
    category: "Developers",
    readTime: "8 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "Twilio alternative Ghana",
      "SMS API Africa developers",
      "OTP SMS API Ghana",
      "SplitSMS vs Twilio",
      "Africa SMS API",
    ],
    sections: [
      {
        paragraphs: [
          "Twilio is excellent globally, but African products often need local Sender ID norms, GHS-friendly credits, and ops tools for non-engineers who still live in Sheets and WordPress.",
          "SplitSMS gives developers REST SMS, OTP send/verify, webhooks, and SDKs hosted on splitsms.com—while product and growth teams can connect Google and WooCommerce without opening a support ticket every time.",
        ],
      },
      {
        heading: "API ergonomics",
        paragraphs: [
          "Use Bearer API keys, sk_test_ sandboxes, OpenAPI/Postman collections, and SDK tarballs from /sdk. Example-first docs at /api-docs mirror the dashboard permissions model.",
        ],
      },
      {
        heading: "Africa delivery context",
        paragraphs: [
          "Routing across regional and global providers with failover matters when a single MNO blip would otherwise drop OTPs. Watch delivery in the dashboard while you iterate templates.",
        ],
      },
      {
        heading: "Hybrid teams win",
        paragraphs: [
          "Engineers ship the product; marketers import Sheets and run campaigns; support reuses Smart Forms. One wallet keeps cost visibility honest.",
        ],
      },
      {
        heading: "Try it",
        paragraphs: [
          "Create keys under developer settings, send a sandbox SMS, then graduate to live Sender IDs. Compare Infobip/Twilio alternative solutions pages if you are migrating.",
        ],
      },
    ],
  },
  {
    slug: "nonprofit-community-event-sms-budget",
    title: "Nonprofit & Community Event SMS on a Budget",
    excerpt:
      "Run NGO outreach, school PTAs, and community clean-ups with affordable wallet SMS—Google Forms RSVPs, volunteer blasts, and transparent per-segment costs.",
    category: "Use cases",
    readTime: "7 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "nonprofit SMS Ghana",
      "NGO SMS outreach",
      "community event SMS",
      "cheap SMS for NGOs",
      "PTA SMS alerts",
    ],
    sections: [
      {
        paragraphs: [
          "Nonprofits pinch every cedi. SMS still outperforms printing flyers when storms cancel a clean-up or exam schedules shift. SplitSMS pay-as-you-go wallets mean you top up for this month’s campaign instead of signing an annual enterprise contract.",
          "Pair free Google Forms with Forms → SMS automations so volunteer coordinators are not copy-pasting numbers at midnight.",
        ],
      },
      {
        heading: "Keep lists clean",
        paragraphs: [
          "Import Google Contacts or Sheets, remove duplicates, and segment donors versus volunteers. Consent and opt-out matter—especially for fundraising follow-ups.",
        ],
      },
      {
        heading: "High-impact templates",
        paragraphs: [
          "Event reminders, donation thank-yous with reference codes, and emergency safety notices. Keep language clear; avoid all-caps panic unless truly urgent.",
        ],
      },
      {
        heading: "Budget tips",
        paragraphs: [
          "Use free signup credits to validate delivery, schedule quieter midweek tests, and export Smart Forms responses to Sheets for board reporting without paid BI tools.",
        ],
      },
      {
        heading: "Start small",
        paragraphs: [
          "One PTA reminder and one volunteer blast prove value. Then connect Google and invite your program manager under the same org account practices you already use.",
        ],
      },
    ],
  },
  {
    slug: "splitsms-vs-building-your-own-sms-stack",
    title: "SplitSMS vs Building Your Own SMS Stack",
    excerpt:
      "Should you stitch carriers, OTP, and dashboards yourself—or connect SplitSMS and ship product features? A practical build-vs-buy guide for startups.",
    category: "Guides",
    readTime: "9 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "build vs buy SMS",
      "SMS gateway build or buy",
      "SMS infrastructure Ghana",
      "SplitSMS platform",
      "SMS stack for startups",
    ],
    sections: [
      {
        paragraphs: [
          "Building SMS in-house means aggregator contracts, Sender ID bureaucracy, delivery receipts, retry logic, fraud controls, and a UI your support team will hate if you skip it. Many startups underestimate the ops tax.",
          "SplitSMS packages routing, wallets, dashboards, APIs, WordPress, and Google connect so you spend engineering time on your product differentiator—not on MNO quirks.",
        ],
      },
      {
        heading: "When building makes sense",
        paragraphs: [
          "You are a telecom innovator with direct interconnects, or regulations force on-prem message stores you alone can host. Even then, hybrid models often use a platform for overflow.",
        ],
      },
      {
        heading: "When connecting SplitSMS wins",
        paragraphs: [
          "You need OTP next sprint, marketers need Sheets import this week, and finance wants GHS wallet visibility. Plug in API keys and Integrations instead of a six-month SMS project.",
        ],
      },
      {
        heading: "Hidden costs of DIY",
        paragraphs: [
          "On-call for failed routes, Sender ID renewals, number formatting edge cases, and rebuilding campaign tools. those costs dwarf per-SMS fees quickly.",
        ],
      },
      {
        heading: "Decision shortcut",
        paragraphs: [
          "If SMS is a feature—not your product—connect SplitSMS. Read /features, /api-docs, and /google, then ship.",
        ],
      },
    ],
  },
  {
    slug: "agencies-connect-client-websites-splitsms",
    title: "How Agencies Connect Client Websites to SplitSMS",
    excerpt:
      "A playbook for digital agencies: WordPress installs, API keys per client, reseller options, Google Workspace handoff, and SMS that survives after you leave.",
    category: "Guides",
    readTime: "8 min read",
    published: "2026-08-04",
    updated: "2026-08-04",
    keywords: [
      "agency SMS integration",
      "WordPress agency SMS",
      "client website SMS",
      "SMS reseller for agencies",
      "connect client site SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "Agencies ship dozens of WordPress and custom sites. Clients then ask for order SMS, booking reminders, and OTP. Instead of inventing a new gateway each time, standardize on SplitSMS Connect patterns.",
          "Use one playbook: create or reseller-provision the client, install the plugin or API key, document Sender ID ownership, and hand over a one-pager.",
        ],
      },
      {
        heading: "WordPress retainers",
        paragraphs: [
          "Bundle plugin install + template copywriting into your launch checklist. Keep API keys in the client’s SplitSMS account—never your personal wallet—for clean offboarding.",
        ],
      },
      {
        heading: "Custom builds",
        paragraphs: [
          "Wire send and OTP in the backend, store secrets in the client’s vault, and leave /api-docs bookmarks in the repo README. Offer Google Sheets import training for their marketing intern.",
        ],
      },
      {
        heading: "Reseller and margin",
        paragraphs: [
          "If you manage many clients, explore the SplitSMS Reseller Platform for wallets, pricing, and branded portals. SMS becomes recurring revenue, not a one-time setup fee.",
        ],
      },
      {
        heading: "Handoff checklist",
        paragraphs: [
          "Sender ID approved, live key rotated from test, templates approved by brand, Google/WordPress connected if needed, and support contact documented. Point clients to /support and /google for self-serve later.",
        ],
      },
    ],
  },
  {
    slug: "connect-google-sheets-drive-export-sms",
    title: "Connect Google Drive & Sheets to SplitSMS: Import Excel and Export Campaign Data",
    excerpt:
      "Link Google Drive to SplitSMS to import Sheets or Excel files for bulk SMS, then export Smart Forms responses straight to a new Google Sheet.",
    category: "Integrations",
    readTime: "8 min read",
    published: "2026-08-03",
    updated: "2026-08-03",
    keywords: [
      "Google Sheets SMS",
      "Google Drive Excel SMS",
      "import Excel bulk SMS",
      "export Smart Forms Google Sheets",
      "SplitSMS Google integration",
    ],
    sections: [
      {
        paragraphs: [
          "Most Ghana businesses keep contact lists in Google Sheets or Excel files sitting in Drive. Copy-pasting hundreds of phone numbers into a messaging tool wastes time and creates typos. SplitSMS Connect Google lets you browse Drive, pick a Sheet or spreadsheet file, map the phone column, and either import contacts or jump straight into Send SMS.",
          "The same Google connection powers Smart Forms export: one click creates a spreadsheet with your responses so operations and marketing teams can filter, chart, and share without downloading CSVs first.",
        ],
      },
      {
        heading: "How Google Drive import works",
        paragraphs: [
          "From Dashboard → Integrations → Google, connect your Google account (separate from Sign in with Google). When you open Contacts → Import, choose Browse Google Drive. SplitSMS lists recent Sheets and Excel files you can access, previews phone numbers, and lets you import as contacts or open the Send SMS composer with those recipients.",
          "Column mapping prefers headers like Phone, Mobile, or Tel. Name columns are detected when present. Invalid or duplicate numbers follow the same rules as CSV import so your campaigns stay clean.",
        ],
      },
      {
        heading: "Export Smart Forms to Google Sheets",
        paragraphs: [
          "Open any form’s Responses page and click Export to Google Sheets. SplitSMS creates a spreadsheet titled with your form name and today’s date, writes headers plus up to thousands of rows, and stores the Sheet link on the export record.",
          "This is ideal for schools collecting fee interest forms, churches registering events, or agencies handing lead sheets to clients who live in Google Workspace.",
        ],
      },
      {
        heading: "Security and permissions",
        paragraphs: [
          "Connect Google uses incremental OAuth scopes. You grant Sheets and Drive access only when you use those features—not at login. Disconnect anytime under Integrations → Google; feature settings remain but require a reconnect before syncing again.",
          "Refresh tokens are encrypted at rest. SplitSMS never asks you to paste a script into Drive or share files publicly.",
        ],
      },
      {
        heading: "Get started",
        paragraphs: [
          "Create a SplitSMS account, approve a Sender ID, then open Integrations → Google. After you connect, try importing a small Sheet with test numbers before your first live blast.",
          "Want form-triggered SMS from Google Forms next? Read our Google Forms → SMS guide or open Dashboard → Integrations → Google Forms SMS.",
        ],
      },
    ],
  },
  {
    slug: "google-forms-sms-automation-splitsms",
    title: "Google Forms to SMS: Auto-Text Respondents When Someone Submits",
    excerpt:
      "Connect Google Forms to SplitSMS with click-and-work setup—no Apps Script paste. Pick a form, map the phone question, and send SMS within about a minute of each submission.",
    category: "Integrations",
    readTime: "9 min read",
    published: "2026-08-03",
    updated: "2026-08-03",
    keywords: [
      "Google Forms SMS",
      "Google Forms SMS notification",
      "auto SMS Google Form",
      "Google Forms WhatsApp alternative SMS",
      "SplitSMS Google Forms",
    ],
    sections: [
      {
        paragraphs: [
          "Google Forms is everywhere in Ghana—event RSVPs, school registrations, clinic intakes, HR applications. The missing piece is usually an instant SMS confirmation. Email alerts get lost; phone calls do not scale. SplitSMS connects your Form so every new response can trigger a text to the respondent (or your ops team) using your approved Sender ID.",
          "Unlike Zapier-only setups, you configure everything inside SplitSMS: Connect Google once, pick the form from a list, choose the phone question, write a template with merge tags, and save. A background poller checks for new responses about every 45 seconds—near real-time without installing Apps Script yourself.",
        ],
      },
      {
        heading: "Click-and-work setup",
        paragraphs: [
          "Go to Dashboard → Integrations → Google Forms SMS. Grant Forms access when prompted, select a form, map the phone field (we guess questions titled Phone or Mobile), pick a Sender ID, and save your message template.",
          "Templates can reference question titles like {{Full name}}. Historical responses are skipped by default so turning automation on does not spam everyone who filled the form last month.",
        ],
      },
      {
        heading: "When to use Google Forms vs Smart Forms",
        paragraphs: [
          "Keep using Google Forms when your team already collaborates in Drive, shares edit access widely, or needs Google’s quiz mode. Use SplitSMS Smart Forms when you want branded URLs, QR codes, contact-group sync, and SMS automation without leaving SplitSMS.",
          "Many organizations run both: external registrations on Google Forms + Google Forms SMS for confirmations, and branded campaign landing forms on Smart Forms.",
        ],
      },
      {
        heading: "Credits, delivery, and reliability",
        paragraphs: [
          "Each triggered SMS debits your SplitSMS wallet the same way dashboard sends do. If credits run out, the automation pauses and surfaces an error so you can top up and resume.",
          "Delivery rides SplitSMS routing across Ghana and 190+ countries. Pair with an approved Sender ID so recipients recognize your brand in the notification tray.",
        ],
      },
      {
        heading: "Start sending",
        paragraphs: [
          "Sign up, connect Google, and create your first Google Forms SMS automation in minutes. For spreadsheet lists instead of live forms, import from Google Sheets under Contacts → Import.",
        ],
      },
    ],
  },
  {
    slug: "import-google-contacts-bulk-sms",
    title: "Import Google Contacts into SplitSMS (Select One or Select All)",
    excerpt:
      "Connect Google Contacts to SplitSMS, preview every number with a phone, then import a single contact or select all—plus export SplitSMS contacts back to Google.",
    category: "Integrations",
    readTime: "7 min read",
    published: "2026-08-03",
    updated: "2026-08-03",
    keywords: [
      "import Google Contacts SMS",
      "Google Contacts bulk SMS",
      "export contacts to Google",
      "SplitSMS Google Contacts",
      "select all Google contacts import",
    ],
    sections: [
      {
        paragraphs: [
          "Your phone book already lives in Google Contacts. SplitSMS lets you import those numbers without CSV gymnastics. Open Contacts → Import, load Google Contacts, tick the rows you need—or Select all—and confirm. Only contacts with valid international phones are offered.",
          "Selection mirrors the CSV importer you already know: review, pick individuals or everyone valid, then import. New contacts can fire your signup automations just like manual adds.",
        ],
      },
      {
        heading: "Select one or select all",
        paragraphs: [
          "Marketing teams often want every Ghana mobile in the book. Ops teams may import only a single VIP. Both flows share the same preview table with checkboxes, Select all, and Clear. Invalid rows without phones never enter your list.",
          "After import, group contacts, tag them, and send bulk SMS or schedule campaigns from the same audience.",
        ],
      },
      {
        heading: "Export SplitSMS contacts back to Google",
        paragraphs: [
          "Need your messaging list in another team’s Google account? Select contacts in the table (or export all from the Import tab) and push them to Google Contacts with name, phone, and email when present.",
          "v1 is one-shot import/export—not continuous two-way sync—so you stay in control of when Google is updated.",
        ],
      },
      {
        heading: "Privacy tips",
        paragraphs: [
          "Only grant Contacts scopes when you use the feature. Disconnect Google under Integrations anytime. Prefer Lists dedicated for marketing and keep staff personal numbers out of campaign groups.",
          "Always include opt-out language on promotional SMS and honour STOP requests under Ghana messaging rules.",
        ],
      },
    ],
  },
  {
    slug: "google-workspace-sms-playbook-ghana",
    title: "Google Workspace SMS Playbook for Ghana Teams Using SplitSMS",
    excerpt:
      "A practical playbook for churches, schools, clinics, and SMEs: Connect Google once, then use Contacts, Sheets, Forms, and Smart Forms export for reliable SMS ops.",
    category: "Guides",
    readTime: "10 min read",
    published: "2026-08-03",
    updated: "2026-08-03",
    keywords: [
      "Google Workspace SMS Ghana",
      "church SMS Google Forms",
      "school SMS Google Sheets",
      "clinic appointment SMS Google",
      "SplitSMS Google Workspace",
    ],
    sections: [
      {
        paragraphs: [
          "Ghana organizations live in Google Workspace—Drive for spreadsheets, Forms for registrations, Contacts for volunteers and parents. SplitSMS sits beside that stack so messaging is not a separate spreadsheet-export ritual every Friday.",
          "This playbook shows one connected Google account powering four jobs: import contacts, blast from Sheets, SMS on Form submit, and export Smart Forms data back to Drive.",
        ],
      },
      {
        heading: "Churches and NGOs",
        paragraphs: [
          "Collect event RSVPs with Google Forms → SMS for confirmation. Keep member phones in Google Contacts and import the whole list before Sunday promotions or emergency announcements.",
          "Export Smart Forms offering registration into Sheets for volunteer coordinators who already share Google Drive folders.",
        ],
      },
      {
        heading: "Schools and training centres",
        paragraphs: [
          "Maintain class lists in Sheets, import before fee reminders, and use Google Forms for exam registration with automatic parent SMS. Approved Sender IDs keep messages trusted.",
          "Segment by class group inside SplitSMS after import so Form 3 parents are never mixed with Form 1 campaigns.",
        ],
      },
      {
        heading: "Clinics and salons",
        paragraphs: [
          "Appointment intake on Forms can text the booking phone with time and address. Revisit Sheets each week for no-show follow-ups after a quick Drive import.",
          "Pair with SplitSMS wallet top-ups via Paystack so front-desk staff never wait on invoices to send OTPs or reminders.",
        ],
      },
      {
        heading: "Rollout checklist",
        paragraphs: [
          "1) Sign up and approve Sender ID. 2) Integrations → Google Connect. 3) Import a test Contact. 4) Send a test SMS. 5) Optionally enable one Google Form automation. 6) Train one staff member on Disconnect/Reconnect if tokens expire.",
          "Need WordPress too? The SplitSMS plugin works with WooCommerce while Google powers your Workspace flows—same wallet.",
        ],
      },
    ],
  },
  {
    slug: "splitsms-google-vs-zapier-sms",
    title: "SplitSMS Google Integration vs Zapier for SMS: What Fits Ghana Businesses?",
    excerpt:
      "Compare connecting Google Forms, Sheets, and Contacts natively in SplitSMS versus routing everything through Zapier—cost, latency, scopes, and when each path wins.",
    category: "Integrations",
    readTime: "8 min read",
    published: "2026-08-03",
    updated: "2026-08-03",
    keywords: [
      "Zapier Google Forms SMS",
      "SplitSMS vs Zapier",
      "native Google SMS integration",
      "Google Sheets Zapier SMS Ghana",
      "SMS automation without Zapier",
    ],
    sections: [
      {
        paragraphs: [
          "Zapier is excellent glue for dozens of apps. For SMS tied to Google Forms and Sheets, an extra middleware layer adds cost, another login, and more failure points. SplitSMS Connect Google runs Contacts import, Sheets import/export, and Forms → SMS inside the messaging product you already bill for.",
          "Choose Zapier when you need exotic multi-step workflows across CRMs SplitSMS does not ship yet. Choose native Google when your loop is Google list → SMS → delivery report.",
        ],
      },
      {
        heading: "Speed and reliability",
        paragraphs: [
          "Native Forms SMS polls about every 45 seconds and enqueues through the same BullMQ path as dashboard sends. Zapier depends on task cadence and task quotas; free plans throttle hard during campaign season.",
          "Wallet credits, Sender IDs, and delivery logs stay in one SplitSMS dashboard instead of chasing three UIs when a parent complains they never got a text.",
        ],
      },
      {
        heading: "Permissions model",
        paragraphs: [
          "SplitSMS uses incremental Google scopes—connect lightly, then grant Contacts, Sheets, or Forms when you click those features. That keeps consent screens honest for ops staff who only need Sheets import.",
          "Zapier usually needs its own Google and SMS connections. Staff must understand both products’ security review screens.",
        ],
      },
      {
        heading: "Recommendation",
        paragraphs: [
          "For Ghana SMEs, churches, and schools whose “CRM” is already Google Workspace, start with SplitSMS Google Connect. Add Zapier later only if you outgrow what Contacts, Sheets, and Forms cover.",
          "Read the Sheets, Forms, and Contacts guides on the SplitSMS blog, or open /integrations/google for the full capability list.",
        ],
      },
    ],
  },
  {
    slug: "how-to-start-an-sms-reseller-business",
    title: "How to Start an SMS Reseller Business in 2026: A Practical Step-by-Step Guide",
    excerpt:
      "Learn how to launch your own SMS reseller business, choose the right platform, set pricing, find clients, and grow recurring revenue with SplitSMS.",
    category: "Reseller",
    readTime: "12 min read",
    published: "2026-07-28",
    updated: "2026-07-28",
    keywords: [
      "start sms reseller business",
      "sms reseller business",
      "how to become sms reseller",
      "start bulk sms business",
      "sms business in Ghana",
    ],
    sections: [
      {
        paragraphs: [
          "Starting an SMS reseller business is one of the simplest ways to enter the communications software market without building telecom infrastructure from scratch. Companies, churches, schools, clinics, e-commerce stores, political teams, and fintech startups all need reliable messaging. Most of them do not care who owns the underlying carrier connections. They care about results: delivery, speed, reporting, support, and easy billing.",
          "That is what makes the reseller model attractive. Instead of spending years negotiating routes, building wallet systems, designing dashboards, and maintaining sender ID workflows, you can partner with a platform like SplitSMS and focus on branding, sales, onboarding, and client relationships. You become the trusted local operator while the platform handles the heavy technical work in the background.",
        ],
      },
      {
        heading: "What an SMS reseller business actually is",
        paragraphs: [
          "An SMS reseller business sells bulk SMS services to end customers under your own business process, pricing strategy, and support workflow. In practice, your clients buy SMS credits, use a dashboard or API, upload contacts, send campaigns, request sender IDs, and monitor reports. Your margin comes from the difference between your client pricing and your wholesale or platform cost.",
          "The reseller opportunity is broader than just selling text campaigns. Many customers also need OTP delivery, appointment reminders, payment alerts, support notifications, delivery updates, WordPress integration, WooCommerce order SMS, and API access for their own apps. That means one customer can generate revenue across multiple use cases, not just occasional promotions.",
        ],
      },
      {
        heading: "Why 2026 is a strong time to enter the market",
        paragraphs: [
          "Mobile-first commerce keeps growing, and SMS remains one of the few channels that works across smartphones and feature phones alike. Email is easy to ignore, social reach is unstable, and paid ads get more expensive every year. SMS still cuts through because the inbox sits in the customer’s pocket and does not depend on app installs, algorithms, or data bundles.",
          "For African markets especially, businesses want tools that match how customers actually behave. They need direct, low-friction communication that works for reminders, collections, marketing, and authentication. A reseller who understands local business culture, responds quickly, and offers transparent pricing can compete effectively even without being the largest operator in the market.",
        ],
      },
      {
        heading: "Step 1: Choose a platform you can grow on",
        paragraphs: [
          "Your platform choice matters more than your logo. A weak backend creates support problems that kill referrals. Look for contact import tools, delivery reports, sender ID support, API access, usage tracking, pricing controls, and a clean user dashboard. You also want a provider with reliable routing, stable billing, and support that answers when client traffic spikes.",
          "SplitSMS gives resellers a strong base to build on: bulk campaigns, OTP flows, wallet-based usage, developer APIs, WordPress support, sender ID management, client accounts, and country-aware pricing. Instead of piecing together five tools and hoping they cooperate, you can start with a system already designed for commercial SMS operations.",
        ],
      },
      {
        heading: "Step 2: Pick a niche before you chase everyone",
        paragraphs: [
          "Many new resellers fail because they market to every business type at once. It is easier to win with a focused offer. You might specialize in schools that need parent alerts, churches that send weekly announcements, clinics that need appointment reminders, retailers that want promo blasts, or SaaS businesses that need OTP and transactional messaging.",
          "A niche helps you write better sales copy, design better onboarding, and collect stronger testimonials. If you understand one customer segment deeply, you can speak their language, solve their real workflow problems, and charge for outcomes instead of sounding like another generic SMS vendor.",
        ],
      },
      {
        heading: "Step 3: Build your pricing model carefully",
        paragraphs: [
          "The easiest mistake is underpricing just to close early customers. Cheap pricing may win first conversations, but it hurts support quality and makes growth unstable. Good reseller pricing accounts for message cost, support time, payment processing, sales effort, and client education. You want a margin that lets your business survive real operational work, not just demos.",
          "A practical model is tiered pricing. High-volume customers get better rates, while smaller customers pay a little more for convenience and support. You can also bundle services such as campaign setup, template writing, sender ID registration help, WordPress integration, or managed SMS operations. That turns your business from a commodity seller into a service-backed solution.",
        ],
      },
      {
        heading: "Step 4: Set up simple but professional sales assets",
        paragraphs: [
          "You do not need a complicated funnel to start. You need a clear landing page, a signup path, a rate explanation, a list of use cases, a short demo flow, and a way to collect leads. Most buyers want to know what the system does, how fast they can start, how much it costs, and whether you are reachable when something breaks.",
          "Point prospects to your signup path early. If you want a direct conversion destination, send them to the SplitSMS signup page and onboard them into the right account flow. A clean call to action matters because many interested leads disappear when the next step is vague. The businesses that win online make the path obvious.",
        ],
      },
      {
        heading: "Step 5: Onboard the first 10 clients manually",
        paragraphs: [
          "In the beginning, manual onboarding is an advantage, not a weakness. Help early customers import contacts, create groups, draft their first message templates, and understand sender ID requirements. Those conversations teach you what features clients ask for, what objections appear most often, and which industries generate repeat usage.",
          "Your first ten clients become your market research. Watch what they send, when they send it, and where they get stuck. Then turn those lessons into reusable onboarding docs, email sequences, WhatsApp scripts, and sales materials. That is how a small reseller becomes a repeatable business instead of a string of one-off deals.",
        ],
      },
      {
        heading: "Step 6: Focus on retention, not just first sales",
        paragraphs: [
          "The best SMS reseller businesses do not rely only on new signups every month. They grow by keeping customers active. A client who sends monthly campaigns, weekly reminders, or daily OTP traffic is worth far more than a one-time buyer who disappears after an election or event. Retention increases profit because support and acquisition costs get spread across more revenue.",
          "Retention improves when you help clients succeed. Share campaign ideas, remind them before seasonal promotions, suggest automated use cases, and review delivery results with them. When customers see you as a growth partner instead of a credit seller, they stay longer and refer other businesses.",
        ],
      },
      {
        heading: "Start your SMS business with less risk",
        paragraphs: [
          "You do not need to build an aggregator to own a real SMS business. You need the right platform, a clear niche, disciplined pricing, and a direct signup path that turns traffic into accounts. That combination gives you a realistic way to start earning from messaging while learning the market in public.",
          "If you are ready to launch, the fastest next step is to create an account, study the dashboard, test campaigns, and shape your reseller offer around actual platform capabilities. SplitSMS gives you a working base so you can spend your energy on winning customers, not rebuilding telecom infrastructure. Start with the signup page and begin packaging your service today.",
        ],
      },
    ],
  },
  {
    slug: "benefits-of-running-your-own-sms-business",
    title: "7 Big Benefits of Running Your Own SMS Business",
    excerpt:
      "From recurring revenue to low startup costs and high-demand business messaging, here are the biggest benefits of building your own SMS business.",
    category: "Reseller",
    readTime: "10 min read",
    published: "2026-07-27",
    updated: "2026-07-27",
    keywords: [
      "benefits of sms business",
      "own sms business benefits",
      "bulk sms business benefits",
      "sms reseller benefits",
      "why start sms business",
    ],
    sections: [
      {
        paragraphs: [
          "A lot of digital businesses look attractive from the outside but turn out to be crowded, unstable, or difficult to monetize. An SMS business is different because demand is tied to real operational communication. Businesses need order alerts, password codes, support notifications, payment reminders, and promotions whether ad markets are good or bad.",
          "That makes SMS a practical business model for founders who want something useful, revenue-focused, and easier to launch than a custom SaaS product. If you are comparing ideas, it helps to understand exactly why SMS is such a strong category and how a platform like SplitSMS reduces the barriers to entry.",
        ],
      },
      {
        heading: "1. Low startup cost compared to building telecom infrastructure",
        paragraphs: [
          "Launching your own SMS business does not require carrier contracts, gateway hardware, or a full engineering team when you start through a reseller-friendly platform. That cuts startup costs dramatically. Instead of raising large capital to build from zero, you can begin with a smaller budget and invest mainly in customer acquisition, branding, and support.",
          "This matters because lower startup cost means lower risk. You can validate your niche quickly, learn what customers want, and grow into more advanced operations over time. SplitSMS gives you immediate access to the core SMS tools you need so your first investment goes toward traction instead of technical debt.",
        ],
      },
      {
        heading: "2. Recurring revenue potential",
        paragraphs: [
          "One of the best features of the SMS business model is repeat usage. Businesses do not send just one message forever. They send onboarding messages, promos, reminders, alerts, and verification codes again and again. If you serve active customers, revenue repeats naturally because the product is tied to everyday communication needs.",
          "Recurring usage is far more attractive than one-time projects. A school can message parents every term. A clinic can send reminders daily. A store can run weekend campaigns every week. A fintech can generate OTP traffic continuously. That predictability makes planning, reinvestment, and growth much easier.",
        ],
      },
      {
        heading: "3. High demand across many industries",
        paragraphs: [
          "SMS is not limited to one market segment. Retail, education, healthcare, finance, logistics, hospitality, politics, real estate, and religious organizations all use it differently. That broad demand gives you flexibility. If one niche slows down, you can expand into another without changing the core service you sell.",
          "At the same time, this broad demand lets you start specialized and widen later. You might begin by serving churches or schools, then add e-commerce or appointment-based businesses once your systems are stronger. The demand base is wide enough to support both niche positioning and later expansion.",
        ],
      },
      {
        heading: "4. Fast time to market",
        paragraphs: [
          "Many online businesses take months before you can sell anything. An SMS business can move much faster. Once your account, pricing, and positioning are ready, you can begin outreach almost immediately. You can onboard clients, help them send their first campaign, and start collecting revenue in a short time frame.",
          "Fast time to market is a major advantage for founders who want proof quickly. The shorter the gap between idea and first customer, the faster you learn. With SplitSMS, you can create an account, explore the platform, and turn that live product experience into a usable offer instead of waiting for development work to finish.",
        ],
      },
      {
        heading: "5. Easy value proposition to explain",
        paragraphs: [
          "Some services are hard to pitch because the return is abstract. SMS is easier. You can explain it in one sentence: help businesses send important messages that customers actually see. When your value proposition is simple, sales conversations move faster and objections become easier to handle.",
          "That simplicity also helps your marketing. Your website, blog posts, outreach messages, and demos can all focus on outcomes people already understand: more responses, fewer missed appointments, faster payments, better customer communication, and dependable OTP delivery.",
        ],
      },
      {
        heading: "6. Opportunity to bundle support and services",
        paragraphs: [
          "An SMS business does not have to make money only from message volume. You can package services around the product: contact cleaning, campaign planning, message template writing, WooCommerce setup, sender ID support, API guidance, and account management. Those services increase margin and make your offer harder to compare on price alone.",
          "Bundled support is especially valuable for small and medium-sized businesses that do not have in-house marketing or technical teams. They want results, not another dashboard to figure out alone. If you combine good platform access with hands-on help, you become much more than a vendor.",
        ],
      },
      {
        heading: "7. Strong long-term relevance",
        paragraphs: [
          "Channels change, but direct mobile communication remains essential. Even when social media behavior shifts, businesses still need a dependable way to reach customers with urgent, practical, high-visibility messages. SMS keeps its place because it solves a basic communication problem efficiently.",
          "That gives your business durability. You are not betting on a trendy content format or a temporary growth hack. You are building around business messaging infrastructure that continues to matter. The exact use cases may expand, but the core need remains strong.",
        ],
      },
      {
        heading: "Turn the benefits into a real business",
        paragraphs: [
          "Benefits only matter if you act on them. The practical next move is to test the platform you plan to sell, study the signup flow, and define the first customer segment you want to win. Once you know who you serve and how you price, you can begin turning demand into predictable monthly usage.",
          "If you want to launch quickly, use SplitSMS as your operating base and point prospects to the signup journey as part of your sales process. It is easier to sell a service when your platform already works. Start now, learn fast, and build a communications business around a channel that customers still read every day.",
        ],
      },
    ],
  },
  {
    slug: "how-to-make-money-with-bulk-sms-reselling",
    title: "How to Make Money With Bulk SMS Reselling: Revenue Models, Margins, and Client Ideas",
    excerpt:
      "Discover the most practical ways to make money as an SMS reseller, from margin on credits to managed campaigns, OTP traffic, and niche services.",
    category: "Reseller",
    readTime: "11 min read",
    published: "2026-07-26",
    updated: "2026-07-26",
    keywords: [
      "make money with bulk sms",
      "sms reseller revenue model",
      "bulk sms reselling profits",
      "how sms business makes money",
      "sms reseller margins",
    ],
    sections: [
      {
        paragraphs: [
          "A common question from aspiring resellers is simple: can an SMS business really make money? The answer is yes, but not by thinking only about cheap message volume. Profitable SMS businesses usually combine message margin, service packaging, client retention, and niche positioning. The more ways you help businesses communicate, the better your economics become.",
          "If you look at SMS only as a race to the lowest price, growth gets hard quickly. But if you sell reliability, guidance, automation, and business outcomes, you gain room to earn. That is why smart resellers study revenue models before they begin outreach instead of copying generic rate cards and hoping for the best.",
        ],
      },
      {
        heading: "Revenue model 1: Margin on SMS credits",
        paragraphs: [
          "The most obvious model is buying access through a platform and selling usage at your own price. Your gross margin comes from the difference between your underlying message cost and what your customer pays. This model is straightforward and works well when you serve businesses with regular campaign or notification needs.",
          "To make this model sustainable, avoid quoting random prices. Set tiers based on volume, service level, and support expectations. A business sending thousands of OTPs per day should not be priced exactly like a small church sending weekly announcements. Good pricing protects both your margin and your customer relationships.",
        ],
      },
      {
        heading: "Revenue model 2: Managed campaign services",
        paragraphs: [
          "Many businesses do not want only access to a dashboard. They want someone to handle audience upload, copywriting, scheduling, and reporting. That creates a managed service opportunity on top of message usage. You can charge campaign setup fees, monthly management retainers, or consulting add-ons for strategy and optimization.",
          "Managed campaigns are especially attractive because they reduce churn. When clients rely on your team for execution, they are less likely to leave over small price differences. They also tend to send more messages because someone is actively helping them use the platform well.",
        ],
      },
      {
        heading: "Revenue model 3: OTP and transactional messaging",
        paragraphs: [
          "Application developers, fintechs, marketplaces, and SaaS teams often care less about promo blasts and more about OTP codes, login verification, payment alerts, and system notifications. This traffic can be extremely valuable because it is operational, frequent, and sticky. Once integrated into an app, it is harder to replace casually.",
          "If you work with startups or software teams, position yourself around API reliability, webhooks, reporting, and support responsiveness. SplitSMS already supports OTP and API-driven messaging, which gives you a better starting point for technical accounts than trying to improvise from a marketing-only tool.",
        ],
      },
      {
        heading: "Revenue model 4: Integration and onboarding fees",
        paragraphs: [
          "Not every customer needs a developer, but many need setup help. They may need sender ID guidance, WordPress plugin setup, WooCommerce templates, contact segmentation advice, or account structure recommendations. Charging for onboarding and integration protects your time and creates additional early revenue even before message volume grows.",
          "This approach works well because clients often value speed more than self-service. A business owner would rather pay to get the system working correctly this week than spend days reading documentation and risking mistakes. Your ability to shorten that path is a service worth charging for.",
        ],
      },
      {
        heading: "Revenue model 5: Niche packages",
        paragraphs: [
          "The highest-converting offers are often not generic SMS packages. They are niche packages tied to a clear workflow. For example: school parent alert package, clinic reminder package, church event broadcast package, e-commerce order SMS package, or real estate lead follow-up package. Each package makes the product feel more concrete and more valuable.",
          "Niche packaging also improves your SEO and sales pages because you can target specific search intent. Instead of hoping someone searches for a general SMS reseller, you can attract buyers searching for order notification SMS, school bulk SMS platform, or OTP provider for startup apps.",
        ],
      },
      {
        heading: "How to protect your margins",
        paragraphs: [
          "Margins disappear when resellers oversupport underpriced accounts, accept difficult clients without process, or treat every customer as custom work. Protecting margin requires clear onboarding, transparent policies, minimum top-up expectations for some plans, and service boundaries. You should know what level of help is included and what counts as billable work.",
          "It also helps to watch customer behavior. Clients who send once and vanish are useful, but recurring users build the business. Focus more effort on accounts that have a strong reason to message every week or every day. Those clients create steadier profit than short-term volume spikes.",
        ],
      },
      {
        heading: "The role of signup and conversion flow",
        paragraphs: [
          "Revenue does not begin at invoicing. It begins at conversion. If your website, blog posts, or outreach messages do not lead people into a clear account creation flow, you lose warm demand. Every article, sales deck, and demo should move prospects toward a simple next step: create an account, request onboarding, or start testing the platform.",
          "That is why linking to signup matters. When people are interested, momentum is your biggest asset. SplitSMS gives you a direct signup destination you can use in content, proposals, and demos so you can shorten the gap between interest and activation.",
        ],
      },
      {
        heading: "Build revenue intentionally",
        paragraphs: [
          "The resellers who make the most money are rarely the ones shouting the loudest about low prices. They are the ones with a clear revenue model, a repeatable niche offer, and a platform that supports both simple campaigns and more advanced messaging use cases. They treat the business like a real service company, not a side hustle built only on hope.",
          "If you want to make money with bulk SMS reselling, start by choosing the right platform, setting profitable pricing, and creating a path that turns traffic into signups. SplitSMS gives you the tools to do that without building the entire stack yourself. Use the signup route, win your first active clients, and optimize from there.",
        ],
      },
    ],
  },
  {
    slug: "white-label-sms-business-vs-building-from-scratch",
    title: "White-Label SMS Business vs Building From Scratch: Which Is Better for New Founders?",
    excerpt:
      "Should you launch a white-label SMS business or build your own SMS platform from zero? Here is the realistic comparison for founders and resellers.",
    category: "Reseller",
    readTime: "10 min read",
    published: "2026-07-25",
    updated: "2026-07-25",
    keywords: [
      "white label sms business",
      "build sms platform from scratch",
      "sms reseller platform comparison",
      "white label bulk sms",
      "start sms business fast",
    ],
    sections: [
      {
        paragraphs: [
          "Many people interested in the SMS market assume they need to build everything themselves to own a real business. In reality, that decision can slow you down by months or years. The better question is not whether you can build a platform from scratch. It is whether that is the smartest use of your time, capital, and risk tolerance at your current stage.",
          "For most new founders, a white-label or reseller-style path is the more practical entry point. It gives you speed, operational leverage, and room to learn from real customers before you take on the burden of running telecom infrastructure and a full software product roadmap.",
        ],
      },
      {
        heading: "What building from scratch actually involves",
        paragraphs: [
          "Building a full SMS platform is more than creating a dashboard. You need routing relationships, failover logic, billing, wallet management, sender ID systems, delivery reporting, queue processing, monitoring, authentication flows, anti-abuse controls, country-aware pricing, APIs, documentation, and support operations. That is before you even start winning customers.",
          "Most founders underestimate the operational side. Deliverability issues, network exceptions, payment reconciliation, message logs, and customer complaints all require strong systems. If your goal is to validate demand and build a client base, these tasks can consume time that should have gone to sales and market learning.",
        ],
      },
      {
        heading: "Why white-label or reseller models win early",
        paragraphs: [
          "A reseller-friendly platform gives you a running engine so you can focus on packaging and distribution. That means faster launch, lower cost, and fewer ways to fail early. You do not need to solve every infrastructure problem before you can start earning from real customers.",
          "This is especially powerful if you already have an audience or niche. If you know schools, churches, clinics, or online stores that need messaging, speed matters more than technical purity. Market access beats architecture ego in the early stages of most service businesses.",
        ],
      },
      {
        heading: "The cost difference is huge",
        paragraphs: [
          "Building from scratch usually requires developers, hosting, monitoring, security work, and ongoing maintenance. Even if you can code yourself, the opportunity cost is high. Every week spent rebuilding solved problems is a week not spent selling, onboarding, and understanding what customers will actually pay for.",
          "By contrast, using SplitSMS as your platform base reduces the amount of capital and complexity needed to begin. You can redirect resources into branding, SEO, outbound sales, demos, support, and partnerships. Those activities often produce revenue much faster than custom platform development.",
        ],
      },
      {
        heading: "Customer perception matters less than you think",
        paragraphs: [
          "New founders often worry that customers will ask whether the infrastructure is fully self-built. Most customers do not ask that. They ask whether messages deliver, whether pricing is clear, whether support responds, and whether onboarding is easy. Reliability and experience matter more than how much of the stack you personally engineered.",
          "That means your advantage can come from service quality, niche knowledge, and business communication strategy. If your clients succeed, they are unlikely to care that you partnered with a proven platform instead of writing a queue system yourself.",
        ],
      },
      {
        heading: "When building from scratch can make sense",
        paragraphs: [
          "There are cases where building deeper infrastructure makes sense later. If you reach high enough scale, need highly specialized routing control, or want to expand into a broader communications product, owning more of the stack may become strategically useful. But that is usually a stage-two or stage-three decision, not a day-one requirement.",
          "A smarter path is often to begin with a platform, prove demand, understand customer behavior, and then decide where custom development creates real business value. Build after learning, not before learning.",
        ],
      },
      {
        heading: "SEO, content, and signup velocity",
        paragraphs: [
          "If you want to rank online and convert traffic, a faster go-to-market approach matters. Blog content, niche landing pages, case studies, and strong calls to action can start attracting qualified demand while your offer is still maturing. But that only works if prospects have somewhere useful to go after reading.",
          "That is why linking content to signup is important. If a reader is convinced that your SMS business can help them, the next click should move them closer to activation. SplitSMS provides a clear signup path you can use as the action point in SEO content and sales campaigns.",
        ],
      },
      {
        heading: "Choose speed if you want momentum",
        paragraphs: [
          "The founders who get traction fastest are often the ones who make fewer heroic technical choices and more practical commercial choices. They use working systems, ship offers, learn from customer feedback, and improve over time. That is the right mindset for a new SMS business.",
          "If your goal is to build a profitable communications company, not just a technically impressive project, start with the route that gets customers on board quickly. Use SplitSMS, direct leads into the signup flow, and spend your time where early businesses win: positioning, sales, content, and service.",
        ],
      },
    ],
  },
  {
    slug: "best-clients-for-an-sms-reseller-business",
    title: "Best Clients for an SMS Reseller Business: 9 Niches That Buy and Keep Buying",
    excerpt:
      "Not all customers are equal. These are the best niches for an SMS reseller business if you want recurring usage, better retention, and easier sales.",
    category: "Reseller",
    readTime: "11 min read",
    published: "2026-07-24",
    updated: "2026-07-24",
    keywords: [
      "best sms reseller clients",
      "sms business niches",
      "bulk sms target market",
      "who needs bulk sms",
      "sms reseller target customers",
    ],
    sections: [
      {
        paragraphs: [
          "One of the fastest ways to grow an SMS reseller business is to stop selling to everyone. Some customer types use SMS occasionally. Others depend on it for daily operations and become long-term accounts. If you choose the wrong niche, you work harder for less retention. If you choose the right one, repeat usage becomes normal.",
          "The best clients for an SMS reseller business are those with recurring communication needs, clear urgency, and measurable outcomes. They do not need to be the biggest companies. They need to have real reasons to send messages consistently and the ability to see value quickly.",
        ],
      },
      {
        heading: "1. Schools and training centers",
        paragraphs: [
          "Schools send admission alerts, fee reminders, timetable notices, event updates, and exam communication. Parents and students need timely information, and schools often value direct communication that does not depend on email open rates. This creates repeat usage throughout the term, not just once a year.",
          "Training centers, coding bootcamps, and tutoring brands work similarly. Their communities are schedule-driven, which makes reminders and notices especially valuable. These organizations are often strong reseller clients because they understand the operational value of reliable outreach.",
        ],
      },
      {
        heading: "2. Clinics, hospitals, and labs",
        paragraphs: [
          "Healthcare providers benefit from appointment reminders, follow-up alerts, prescription refill notices, and results readiness updates. Missed appointments cost money, and SMS is one of the most practical ways to reduce no-shows. That makes this niche easy to justify in business terms.",
          "Healthcare clients also appreciate systems that feel dependable and easy to manage. If you combine SMS access with template guidance and sender ID help, you can become a valuable communications partner rather than just another software seller.",
        ],
      },
      {
        heading: "3. E-commerce stores",
        paragraphs: [
          "Online stores need transactional and promotional messaging. Order confirmation, payment receipt, shipping updates, abandoned-cart reminders, and flash sale alerts all fit naturally into SMS. Since e-commerce traffic can be event-driven, some stores also create seasonal volume spikes that are useful for revenue growth.",
          "Stores using WooCommerce or custom platforms are especially attractive if your SMS platform supports integrations or plugins. SplitSMS already fits this use case well, which helps you sell a more complete solution instead of just promising message credits.",
        ],
      },
      {
        heading: "4. Churches and religious organizations",
        paragraphs: [
          "Churches, ministries, and religious networks often have large member lists and frequent announcement needs. Weekly services, prayer meetings, conferences, fundraising drives, and community notices all create steady demand for direct communication. SMS is a simple fit because every member already has a phone.",
          "This niche also tends to value trust and responsiveness. If you provide dependable support and clear pricing, churches can become loyal long-term clients who refer other organizations in their network.",
        ],
      },
      {
        heading: "5. Fintechs and software startups",
        paragraphs: [
          "Startups that need OTPs, verification, or payment alerts can become high-value technical accounts. Their messaging is tied directly to account activity, so usage can be frequent and mission-critical. These customers care about API quality, uptime, logs, and support, which creates a different but often stronger kind of account relationship.",
          "If you understand onboarding, API documentation, and technical support, this niche can be extremely attractive. Once integrated, they are less likely to churn casually because switching messaging providers often affects real product workflows.",
        ],
      },
      {
        heading: "6. Real estate and property managers",
        paragraphs: [
          "Real estate teams use SMS for lead follow-up, inspection reminders, payment reminders, availability updates, and event notices. Property managers can also use SMS for maintenance notifications and tenant communication. The channel works well because real estate often depends on speed and response timing.",
          "For these clients, you can sell both lead-generation use cases and operational messaging. That increases account value and gives you more reasons to stay involved after the first setup.",
        ],
      },
      {
        heading: "7. Event organizers",
        paragraphs: [
          "Conferences, concerts, workshops, and training events need registration confirmations, reminder sequences, venue updates, and post-event follow-up. Event traffic can be bursty, but it can also be lucrative if you package services well and manage multiple organizers across the year.",
          "Event clients respond well to bundles. Offer campaign setup, reminder timing guidance, and attendance messaging. The more complete your package, the less likely they are to compare you only on raw SMS price.",
        ],
      },
      {
        heading: "8. Loan, collections, and service businesses",
        paragraphs: [
          "Businesses that depend on repayment, appointment attendance, or time-sensitive customer action often see immediate value from SMS. Loan teams can use reminders, collection prompts, and account notices. Service businesses can use booking reminders and follow-up messaging to keep revenue flowing.",
          "These customers care about outcomes. If your messaging reduces late payments or missed bookings, you become important quickly. That makes retention easier than in niches where SMS feels optional.",
        ],
      },
      {
        heading: "9. Political and advocacy campaigns",
        paragraphs: [
          "Political clients can create significant short-term volume through voter outreach, volunteer updates, polling reminders, and event mobilization. These accounts may be cyclical rather than year-round, but they can still be highly valuable when timed well and managed professionally.",
          "They are best treated as a supplement to a broader client base, not your only market. Pairing campaign work with more recurring niches gives your business both volume spikes and dependable baseline revenue.",
        ],
      },
      {
        heading: "Find niches, then convert them",
        paragraphs: [
          "The right target market makes selling easier, pricing clearer, and retention stronger. Once you choose a niche, create content, case studies, outreach messaging, and demos tailored to that audience. Show them exactly how SMS solves their communication problem instead of making them imagine it on their own.",
          "When they are ready, make signup easy. A strong niche strategy only pays off if prospects can move directly from interest to account creation. Use SplitSMS as your platform, point traffic toward signup, and build around the client segments most likely to message again and again.",
        ],
      },
    ],
  },
  {
    slug: "sms-business-marketing-strategy-for-resellers",
    title: "SMS Business Marketing Strategy for Resellers: How to Get Your First 100 Customers",
    excerpt:
      "A practical marketing strategy for SMS resellers: SEO, outreach, demos, referrals, niche offers, and signup funnels that turn interest into accounts.",
    category: "Reseller",
    readTime: "12 min read",
    published: "2026-07-23",
    updated: "2026-07-23",
    keywords: [
      "sms reseller marketing strategy",
      "get customers for sms business",
      "market bulk sms business",
      "sms business seo",
      "how to sell bulk sms",
    ],
    sections: [
      {
        paragraphs: [
          "Most new resellers do not fail because the product is bad. They fail because they do not have a customer acquisition plan. A strong SMS business needs more than a rate card and a WhatsApp status update. It needs a repeatable way to attract attention, qualify demand, demonstrate value, and move prospects toward signup or onboarding.",
          "The good news is that SMS is easier to market than many technical products because the use cases are tangible. Businesses already understand reminders, promotions, alerts, and verification. Your job is to frame those needs clearly and remove friction between curiosity and activation.",
        ],
      },
      {
        heading: "Start with a narrow positioning statement",
        paragraphs: [
          "Marketing works better when your message is specific. Instead of saying you sell bulk SMS for everyone, say you help schools send parent alerts, clinics reduce no-shows, churches reach members instantly, or online stores automate order SMS. Specificity makes your content and sales materials more believable.",
          "Your positioning statement should answer three questions quickly: who you help, what problem you solve, and why your solution is easier or more reliable. Once you can say that clearly, your website and outreach become much stronger.",
        ],
      },
      {
        heading: "Use SEO to capture high-intent searches",
        paragraphs: [
          "SEO is one of the best long-term channels for an SMS reseller because buyers often search when they already need a solution. They look for terms like bulk SMS platform, SMS gateway in Ghana, OTP provider, school SMS alerts, or WooCommerce SMS notifications. Good blog content helps you appear when that intent is strongest.",
          "That is why detailed articles matter. Long-form content builds relevance around use cases, pricing questions, reseller topics, and niche workflows. But SEO alone is not enough. Each article should point readers toward a meaningful next step such as signup, demo, or contact. Content without conversion paths produces traffic without business impact.",
        ],
      },
      {
        heading: "Do direct outreach the smart way",
        paragraphs: [
          "Direct outreach still works, especially in local markets, but it needs context. Do not send generic messages saying you offer bulk SMS. Reference a clear use case. Tell a clinic you can reduce missed appointments. Tell a school you can simplify parent notices. Tell an online store you can automate order updates and flash sale alerts.",
          "Short, practical outreach performs better than long pitches. Offer one simple next step: a demo, a test campaign, or an account setup walkthrough. Your goal is not to explain everything in the first message. It is to start a business conversation around a visible pain point.",
        ],
      },
      {
        heading: "Use demos to shorten trust-building",
        paragraphs: [
          "SMS is easier to sell once a customer sees the flow live. Show contact import, message composition, delivery logs, sender ID options, or API pages depending on the customer type. A five-minute practical demo often beats a twenty-minute abstract explanation.",
          "Demos also help qualify buyers. Serious prospects ask implementation and usage questions. Casual price shoppers usually do not. That helps you decide where to invest your time and which accounts are most likely to become recurring customers.",
        ],
      },
      {
        heading: "Build a referral engine early",
        paragraphs: [
          "Satisfied clients are one of the best sources of growth for an SMS reseller business. A school can refer another school. A church can refer partner ministries. A software founder can refer another startup. Referrals close faster because trust arrives before the first meeting.",
          "Ask for referrals after you help clients achieve a meaningful result: a successful launch, improved communication workflow, or a strong campaign outcome. Make it easy by telling them the kind of customer you serve best instead of asking vaguely for introductions.",
        ],
      },
      {
        heading: "Create offers, not just pricing",
        paragraphs: [
          "Many resellers publish rates and assume the market will figure out the rest. Better marketers create offers. An offer combines target customer, use case, setup support, and expected outcome. For example: church announcement package, clinic reminder package, e-commerce order SMS starter package, or startup OTP integration package.",
          "Offers make your business easier to buy because they reduce decision fatigue. Instead of asking prospects to imagine everything SMS can do, you hand them a relevant starting point. That improves both conversion and customer confidence.",
        ],
      },
      {
        heading: "Link every channel to signup",
        paragraphs: [
          "Your website, blog posts, email follow-ups, and proposals should all include a clean conversion step. If someone is convinced, do not make them search for how to begin. Guide them directly into your signup or onboarding flow. Momentum matters, especially with SMB buyers who get distracted easily.",
          "SplitSMS gives you a direct signup path you can use throughout your marketing. That link turns content and outreach into measurable acquisition instead of loose awareness. Strong marketing is not only about traffic. It is about shortening the path from attention to account creation.",
        ],
      },
      {
        heading: "Aim for systems, not bursts",
        paragraphs: [
          "The first 100 customers rarely come from one channel alone. They usually come from a mix of SEO, outreach, referrals, partnerships, demos, and repeat visibility. What matters is building a system that keeps producing leads every month, not depending on occasional lucky bursts.",
          "If you want real traction, start publishing useful content, define one niche offer, begin direct outreach, and send prospects to a signup path that converts. SplitSMS gives you the product foundation; your job is to create the marketing engine around it and keep improving the system as you learn.",
        ],
      },
    ],
  },
  {
    slug: "sms-reseller-business-plan-guide",
    title: "SMS Reseller Business Plan Guide: What to Include Before You Launch",
    excerpt:
      "A simple but detailed SMS reseller business plan: niche, pricing, costs, sales process, support model, SEO, and the signup funnel you need before launch.",
    category: "Reseller",
    readTime: "11 min read",
    published: "2026-07-22",
    updated: "2026-07-22",
    keywords: [
      "sms reseller business plan",
      "bulk sms business plan",
      "start sms business plan",
      "sms reseller strategy",
      "bulk sms startup guide",
    ],
    sections: [
      {
        paragraphs: [
          "A business plan does not need to be a forty-page document no one reads. For an SMS reseller business, it should be a practical decision tool. It should tell you who you want to serve, how you will win them, how you will price, what support you will provide, and what platform will power the service.",
          "Without that clarity, founders often launch with scattered messaging, inconsistent pricing, and no reliable path from traffic to customer activation. A strong SMS reseller business plan keeps your first year focused and helps you make better choices under pressure.",
        ],
      },
      {
        heading: "1. Define your target market",
        paragraphs: [
          "Your first planning decision is who you serve best. Are you targeting schools, e-commerce stores, churches, startups, clinics, or a mix? The narrower your early target market, the easier it is to write better copy, create better offers, and build referrals inside one network.",
          "Target market clarity also shapes onboarding. A startup needing OTP has very different expectations from a church needing event broadcasts. If you try to serve both with the same language from day one, your plan becomes weaker and your sales process becomes slower.",
        ],
      },
      {
        heading: "2. Clarify the offer",
        paragraphs: [
          "Your business plan should explain what customers are actually buying. Is it access to a messaging dashboard? Is it managed campaigns? Is it OTP delivery and API onboarding? Is it an industry-specific solution with templates and setup support? The better you define the offer, the easier it is to price and sell.",
          "A strong offer solves one clear problem well. You can always expand later. In the beginning, clear value beats broad possibility. Prospects convert more easily when they know exactly what they are getting and why it matters.",
        ],
      },
      {
        heading: "3. Set your pricing and margin rules",
        paragraphs: [
          "Many reseller businesses become confusing because pricing is invented on the fly. Put structure in your plan. Decide your base rate logic, volume discounts, setup fees, support boundaries, and which services are included or billed separately. This prevents emotional pricing decisions during sales calls.",
          "You should also know your minimum acceptable margin. That helps you avoid chasing every deal at a bad price. Some clients are worth discounting because of scale or visibility, but those decisions should be strategic, not desperate.",
        ],
      },
      {
        heading: "4. Choose your platform and operating model",
        paragraphs: [
          "Your plan should explain what system runs the business. If you are using SplitSMS, document the platform benefits that support your offer: campaigns, sender IDs, wallet flows, API support, reporting, OTP, and integrations. Those capabilities influence how you sell and what markets you can serve confidently.",
          "An operating model is not only software. It includes how clients top up, how support requests get handled, how onboarding is delivered, and how usage issues are escalated. Good planning here prevents service breakdowns later.",
        ],
      },
      {
        heading: "5. Build a customer acquisition plan",
        paragraphs: [
          "A business plan without acquisition strategy is incomplete. Decide how you will get your first leads. That may include SEO blog content, LinkedIn outreach, local partnerships, referrals, church or school network introductions, WhatsApp follow-up, or demos. The channel mix should reflect where your target customers already spend attention.",
          "Acquisition planning should also include conversion steps. Once someone lands on your site or replies to outreach, what happens next? Ideally the path is direct: demo, signup, onboarding, or trial activation. Confused journeys waste demand.",
        ],
      },
      {
        heading: "6. Plan your support model",
        paragraphs: [
          "Support quality influences retention more than many new founders realize. Businesses using SMS for operations do not enjoy delays when they need help. Your plan should define response expectations, escalation paths, client education materials, and the kind of help included at different account levels.",
          "You do not need a giant help desk on day one. But you do need a repeatable support rhythm. Even a simple onboarding guide, FAQ, and standard response process will make your business feel more professional and reduce preventable churn.",
        ],
      },
      {
        heading: "7. Include your SEO and content plan",
        paragraphs: [
          "If you want to rank online, content should be part of the business plan, not an afterthought. Publish articles around buyer intent: SMS reseller business, bulk SMS in Ghana, OTP provider, school SMS alerts, WooCommerce SMS, and similar use cases. Long-form posts build search visibility and credibility over time.",
          "Make sure those articles include a clear route to action. If content creates interest but does not lead toward signup, you lose the commercial value of your SEO effort. Content should educate and convert, not just fill space.",
        ],
      },
      {
        heading: "8. Decide what success looks like",
        paragraphs: [
          "Your plan should define simple metrics: first 10 customers, first 100 active users, monthly message volume, client retention, average revenue per account, and conversion from content or outreach to signup. Measurable goals help you improve faster than vague ambitions.",
          "With a platform like SplitSMS, you can move from planning to execution much faster because the technical base is already live. That allows your business plan to focus on market execution, which is where most early success is actually won.",
        ],
      },
      {
        heading: "Launch with structure, then improve",
        paragraphs: [
          "A good SMS reseller business plan is not meant to keep you in theory forever. Its job is to remove avoidable confusion so you can launch with confidence. Once your pricing, positioning, platform, support, and signup path are clear, you can start learning from real customers.",
          "If you are ready to put the plan into motion, create your account, map your first niche offer, and begin sending prospects to signup. SplitSMS gives you the infrastructure foundation so you can spend more time closing customers and less time reinventing the product.",
        ],
      },
    ],
  },
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
    updated: "2026-07-12",
    keywords: [
      "best SMS Ghana",
      "bulk SMS Accra",
      "SMS reseller Ghana",
      "messaging platform Ghana",
      "white label SMS",
      "SplitSMS",
    ],
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
    updated: "2026-07-12",
    keywords: [
      "mNotify alternative",
      "mnotify",
      "bulk SMS Ghana",
      "SMS gateway Ghana",
      "mNotify vs SplitSMS",
    ],
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
    updated: "2026-07-12",
    keywords: [
      "Infobip alternative",
      "SMS API Africa",
      "Infobip vs SplitSMS",
      "cheap SMS API",
      "CPaaS Africa",
    ],
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
  {
    slug: "sender-id-registration-ghana",
    title: "How to Register a Sender ID in Ghana (Step-by-Step)",
    excerpt:
      "Register an approved alphanumeric Sender ID for bulk SMS in Ghana. What carriers require, how SplitSMS handles approval, and tips to avoid rejection.",
    category: "Guide",
    readTime: "6 min read",
    published: "2026-07-12",
    keywords: [
      "Sender ID Ghana",
      "register Sender ID",
      "alphanumeric Sender ID",
      "bulk SMS Ghana",
      "SMS brand name",
      "SplitSMS Sender ID",
    ],
    sections: [
      {
        paragraphs: [
          "A Sender ID is the name customers see instead of a phone number when your SMS arrives — for example MYBRAND or SCHOOLNAME. In Ghana, carriers typically require approval before you can send with a branded alphanumeric ID. Without it, messages may fail, land as a random short code, or look untrustworthy.",
          "SplitSMS walks you through Sender ID registration from the dashboard. You submit the brand name, business details, and any supporting docs; we route the request through trusted Ghana carriers (including mNotify paths) and show status until it is approved.",
        ],
      },
      {
        heading: "What makes a strong Ghana Sender ID",
        paragraphs: [
          "Keep it short (usually up to 11 characters), match your legal or trading name, and avoid generic words like SMS, OTP, or BANK that carriers reject. Use letters only when possible — spaces and special characters often fail approval.",
          "If you send for multiple brands, register each Sender ID separately. Clinics, schools, and SaaS products should each use their own brand so recipients recognize who texted them.",
        ],
      },
      {
        heading: "How to register on SplitSMS",
        paragraphs: [
          "Sign up, open Dashboard → Sender IDs, and submit a new request. Add your company name, intended use (promotional, transactional, or OTP), and sample message content. Top up your wallet so you can test as soon as approval lands.",
          "Approval timing varies by carrier and name uniqueness. Track status in the same screen — pending, approved, or rejected with a reason you can fix and resubmit.",
        ],
      },
      {
        heading: "After approval: dashboard, API, and WordPress",
        paragraphs: [
          "Once approved, pick that Sender ID when sending campaigns, OTP, or WooCommerce order SMS. The same ID works across the REST API and the SplitSMS WordPress plugin — one registration, every channel.",
          "Need help? Contact support with your business registration and preferred Sender ID before you launch a big campaign so approval is not the bottleneck on launch day.",
        ],
      },
    ],
  },
  {
    slug: "paystack-sms-notifications-woocommerce",
    title: "Paystack SMS Notifications for WooCommerce Orders",
    excerpt:
      "Send SMS when Paystack marks an order paid — WooCommerce alerts customers instantly. Setup with the SplitSMS WordPress plugin and template tips.",
    category: "Integrations",
    readTime: "6 min read",
    published: "2026-07-11",
    keywords: [
      "Paystack SMS",
      "WooCommerce Paystack SMS",
      "payment confirmation SMS",
      "WooCommerce SMS Ghana",
      "order paid SMS",
      "SplitSMS WordPress",
    ],
    sections: [
      {
        paragraphs: [
          "Ghana shoppers pay with Paystack every day — but email receipts often sit unread. An SMS the moment payment clears builds trust: the customer sees the amount, order ID, and that their money went through.",
          "SplitSMS’s WordPress plugin hooks WooCommerce status changes used by Paystack (and similar gateways), so you can fire a payment confirmation text without writing custom PHP.",
        ],
      },
      {
        heading: "What to send after Paystack success",
        paragraphs: [
          "Keep it short: thank them, confirm the amount, include the order number, and optionally a tracking or support line. Example: “Hi {customer_name}, we received GHS {order_total} for order #{order_id}. Thank you — {site_name}.”",
          "Use merge fields the plugin already supports — customer name, order total, payment method, Paystack reference — so every text is accurate without manual copy-paste.",
        ],
      },
      {
        heading: "Setup checklist",
        paragraphs: [
          "Install the SplitSMS plugin, paste your API key, choose an approved Sender ID, and enable WooCommerce order events (especially paid → processing). Test with a real Paystack sandbox or small live order.",
          "Ensure the checkout collects a valid Ghana mobile number (+233 / 0XX). Without a phone field, SMS cannot send even when payment succeeds.",
        ],
      },
      {
        heading: "Why SMS beats email for paid orders",
        paragraphs: [
          "Payment anxiety is highest in the first minutes after checkout. SMS open rates dwarf email — customers know instantly that Paystack and your store both succeeded. Pair SMS with your usual email receipt for a complete trail.",
          "Same wallet powers marketing campaigns later: abandoned-cart nudges, restock alerts, and delivery updates — one SplitSMS account for checkout and growth.",
        ],
      },
    ],
  },
  {
    slug: "sms-delivery-webhooks-developer-guide",
    title: "SMS Delivery Webhooks: Track Delivered, Failed & Pending",
    excerpt:
      "Use SplitSMS delivery webhooks to update your database when SMS status changes — signatures, retries, and a practical Node.js pattern.",
    category: "Developers",
    readTime: "7 min read",
    published: "2026-07-10",
    keywords: [
      "SMS webhook",
      "delivery report SMS",
      "SMS DLR",
      "SMS API webhook",
      "delivery status API",
      "SplitSMS webhooks",
    ],
    sections: [
      {
        paragraphs: [
          "Sending SMS is only half the job. Your app needs to know whether the message was delivered, rejected, or still pending — especially for OTP, payment alerts, and order updates. SplitSMS pushes signed delivery webhooks to your HTTPS endpoint as status changes.",
          "Instead of polling message IDs, store the provider message reference when you send, then update your row when the webhook arrives. That pattern scales for bulk campaigns and transactional flows alike.",
        ],
      },
      {
        heading: "What a delivery webhook carries",
        paragraphs: [
          "Typical payloads include message ID, destination, status (delivered, failed, pending), timestamp, and an error reason when something went wrong (invalid number, blocked Sender ID, insufficient balance).",
          "Verify the webhook signature before you trust the body. Reject unsigned or mismatched requests so attackers cannot forge “delivered” events into your system.",
        ],
      },
      {
        heading: "Implementation tips",
        paragraphs: [
          "Respond with HTTP 200 quickly, then process asynchronously if your work is heavy. SplitSMS may retry on non-2xx responses — make handlers idempotent so duplicate events do not double-credit or double-notify.",
          "Map statuses into your UI: green for delivered, amber for pending, red for failed with a human-readable reason. Support teams will thank you when a customer asks “did my OTP arrive?”",
        ],
      },
      {
        heading: "Where to configure",
        paragraphs: [
          "Create an API key, set your webhook URL in the developer settings, and send a test SMS to your phone. Watch Dashboard → API logs and your server logs together until the flow is solid.",
          "Full request shapes live in the SplitSMS API docs and Postman collection — start there, then wire production URLs behind HTTPS only.",
        ],
      },
    ],
  },
  {
    slug: "whatsapp-vs-sms-business-ghana",
    title: "WhatsApp vs SMS for Business in Ghana: When to Use Each",
    excerpt:
      "Compare WhatsApp Business and bulk SMS in Ghana — reach, cost, OTP reliability, and when SplitSMS is the better channel for alerts and campaigns.",
    category: "Strategy",
    readTime: "6 min read",
    published: "2026-07-09",
    keywords: [
      "WhatsApp vs SMS",
      "SMS Ghana business",
      "bulk SMS vs WhatsApp",
      "OTP SMS Ghana",
      "business messaging Ghana",
      "SplitSMS",
    ],
    sections: [
      {
        paragraphs: [
          "WhatsApp is ubiquitous in Ghana — but it is not a replacement for SMS. Opt-in requirements, template approvals, and internet dependency mean critical OTP codes and payment alerts still belong on SMS. Smart teams use both channels with clear jobs.",
          "SplitSMS focuses on the SMS layer: campaigns, transactional texts, OTP API, and WooCommerce alerts that work on any handset, including feature phones and customers offline from data.",
        ],
      },
      {
        heading: "Where SMS wins",
        paragraphs: [
          "OTP login, bank-style alerts, appointment reminders, and flash sales that must interrupt the lock screen. SMS does not require the customer to have WhatsApp installed, data on, or your number saved.",
          "Compliance for promotional SMS still matters — include opt-out language and use approved Sender IDs — but delivery does not depend on Meta template review cycles.",
        ],
      },
      {
        heading: "Where WhatsApp wins",
        paragraphs: [
          "Rich media catalogues, long support threads, and customers who already chat with your brand on WhatsApp. Use it for conversations; use SMS for time-critical notifications.",
          "Many Accra retailers run WhatsApp for sales chat and SplitSMS for “order paid” and “out for delivery” pings so nothing important is missed in a flooded chat list.",
        ],
      },
      {
        heading: "A practical split for Ghana teams",
        paragraphs: [
          "Transactional + OTP → SMS via SplitSMS. Nurture conversations and media → WhatsApp. Marketing blasts → SMS for reach, WhatsApp broadcast lists only for opted-in chat audiences.",
          "Start with SplitSMS free credits, register a Sender ID, and instrument your highest-value alerts first — payments and OTPs — before expanding into campaigns.",
        ],
      },
    ],
  },
  {
    slug: "bulk-sms-pricing-ghana-explained",
    title: "Bulk SMS Pricing in Ghana Explained (GHS Per Segment)",
    excerpt:
      "Understand Ghana bulk SMS pricing: segments, GHS rates, Sender IDs, and how SplitSMS pay-as-you-go wallet billing works — no hidden monthly fees.",
    category: "Guide",
    readTime: "5 min read",
    published: "2026-07-08",
    keywords: [
      "bulk SMS pricing Ghana",
      "SMS cost Ghana",
      "GHS SMS rate",
      "SMS segment price",
      "cheap bulk SMS Ghana",
      "SplitSMS pricing",
    ],
    sections: [
      {
        paragraphs: [
          "Ghana SMS pricing is almost always quoted per segment — a chunk of characters that carriers bill as one unit. A short English message is usually one segment; longer text or Unicode (e.g. some special characters) can split into more segments and cost more.",
          "SplitSMS publishes transparent country rates on the pricing page. Ghana often starts around GHS 0.029 per segment depending on route — you see the number before you send, then debit your prepaid wallet.",
        ],
      },
      {
        heading: "What affects your bill",
        paragraphs: [
          "Destination country, message length (segments), and volume. There is no mandatory monthly platform fee on SplitSMS — top up when you need credits via Paystack and send.",
          "Failed sends due to invalid numbers may still consume attempts depending on provider rules; clean your contact list and normalize Ghana numbers to +233 to reduce waste.",
        ],
      },
      {
        heading: "How to estimate a campaign",
        paragraphs: [
          "Count recipients × segments per message × rate. Example: 2,000 customers × 1 segment × GHS 0.029 ≈ GHS 58 for a flash-sale blast — far cheaper than many paid social boosts with weaker open rates.",
          "Use the SplitSMS pricing explorer to pick Ghana or Nigeria and see live rates. Test with free signup credits before you fund a large wallet.",
        ],
      },
      {
        heading: "Reseller and multi-country notes",
        paragraphs: [
          "Agencies can resell at their own markup through the SplitSMS reseller program. Direct accounts pay platform rates; resellers set client prices above cost and earn commission.",
          "Sending outside Ghana? Rates differ by country — check pricing before you schedule a multi-country campaign so wallet balance covers every destination.",
        ],
      },
    ],
  },
  {
    slug: "sms-api-getting-started-ghana",
    title: "SMS API Getting Started: Send Your First Text in Ghana",
    excerpt:
      "Ship your first Ghana SMS with the SplitSMS REST API — API keys, Sender ID, curl example, OTP next steps, and sandbox testing.",
    category: "Developers",
    readTime: "6 min read",
    published: "2026-07-07",
    keywords: [
      "SMS API Ghana",
      "REST SMS API",
      "send SMS API",
      "OTP SMS API",
      "SMS gateway API",
      "SplitSMS API",
    ],
    sections: [
      {
        paragraphs: [
          "If you need to send SMS from a Node, PHP, Flutter, or Python app in Ghana, a REST SMS API is faster than wiring carrier accounts yourself. SplitSMS gives you Bearer auth, sandbox keys, OTP helpers, and delivery webhooks from one dashboard.",
          "This guide gets a live “hello” SMS onto a Ghana handset, then points you to OTP and webhooks for production.",
        ],
      },
      {
        heading: "Prerequisites",
        paragraphs: [
          "Create a SplitSMS account, claim free credits, register or pick an approved Sender ID, and generate an API key with sms.send permission. Keep live keys server-side only — never in mobile apps or public repos.",
          "Normalize destinations to international format without “+” noise in your client if required by the endpoint (e.g. 233201234567 for Ghana).",
        ],
      },
      {
        heading: "Send with curl",
        paragraphs: [
          "POST to the send endpoint with Authorization: Bearer sk_live_…, Content-Type application/json, and a body containing to, sender, and message. Check the JSON response for message IDs you will later match to webhooks.",
          "Full schemas, error codes, and Postman collections live at /api-docs and /developers/postman. SDKs for JavaScript, PHP, and Flutter speed up common patterns.",
        ],
      },
      {
        heading: "Next: OTP and production hardening",
        paragraphs: [
          "Use dedicated OTP send/verify endpoints for login codes instead of rolling your own expiry logic poorly. Add delivery webhooks, rate limits, and idempotency keys for retries.",
          "When you are ready for WooCommerce or WordPress without code, install the SplitSMS plugin — same wallet and Sender ID as your API traffic.",
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

/** Prefer same category + shared keywords for internal linking (SEO). */
export function getRelatedBlogPosts(post: BlogPost, limit = 3): BlogPost[] {
  const keywords = new Set((post.keywords ?? []).map((k) => k.toLowerCase()));
  const scored = getSortedBlogPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;
      if (p.category === post.category) score += 3;
      for (const k of p.keywords ?? []) {
        if (keywords.has(k.toLowerCase())) score += 2;
      }
      // Soft boost for recent connect / Google / website guides
      if (
        /google|website|choose|event|connect|wordpress|agency|otp|delivery|school|csv|bulk|logistics|personalize/i.test(p.slug) &&
        /google|website|choose|event|connect|wordpress|agency|otp|delivery|school|csv|bulk|logistics|personalize/i.test(post.slug)
      ) {
        score += 1;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || new Date(b.p.published).getTime() - new Date(a.p.published).getTime());

  const related = scored.filter((x) => x.score > 0).slice(0, limit).map((x) => x.p);
  if (related.length >= limit) return related;
  const fill = getSortedBlogPosts()
    .filter((p) => p.slug !== post.slug && !related.some((r) => r.slug === p.slug))
    .slice(0, limit - related.length);
  return [...related, ...fill];
}

export function getBlogCategories() {
  const cats = new Set(blogPosts.map((p) => p.category));
  return [...cats].sort();
}
