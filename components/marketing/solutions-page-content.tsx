import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Church,
  Code2,
  FormInput,
  GraduationCap,
  HeartPulse,
  Hotel,
  KeyRound,
  Landmark,
  Megaphone,
  Newspaper,
  Package,
  Radio,
  ShoppingBag,
  Smartphone,
  Sprout,
  Store,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seoLandingPages } from "@/lib/marketing/seo-landing-pages";

const jobs = [
  {
    id: "reach",
    icon: Megaphone,
    title: "Reach a list, today",
    body: "Staff, customers, members, citizens, subscribers — anyone whose number you are allowed to text. One Sender ID, a CSV or a group, a report of who got it. That is bulk SMS. It is not a “retail feature.”",
    uses: ["Announcements", "Promos and reminders", "Internal blasts"],
    href: "/products/bulk-sms",
  },
  {
    id: "verify",
    icon: KeyRound,
    title: "Prove it is them",
    body: "Login codes, payout confirms, password resets, new-device checks. If the text is late, the session is gone. OTP is a first-class product here, not a bolt-on to a campaign tool.",
    uses: ["OTP send + verify", "2FA and resets", "High-risk actions"],
    href: "/solutions/otp",
  },
  {
    id: "notify",
    icon: Bell,
    title: "Tell them what just happened",
    body: "Payment received. Parcel at the gate. Ticket issued. Shift starts at 6. Transactional SMS is the message people expect — short, timed, tied to an ID in your system.",
    uses: ["Receipts and balances", "Status and dispatch", "Duty and roster texts"],
    href: "/solutions/woocommerce-sms",
  },
  {
    id: "collect",
    icon: FormInput,
    title: "Collect a reply without a paper pad",
    body: "Registration, intake, RSVP, field survey. Smart Forms on a link or QR, confirmation SMS back, numbers saved to a group you can text later. Works for a ministry workshop and a 12-person clinic the same way.",
    uses: ["Sign-up and RSVP", "Lead capture", "On-site QR"],
    href: "/smart-forms",
  },
  {
    id: "integrate",
    icon: Code2,
    title: "Plug it into software you already run",
    body: "REST API, webhooks, WordPress, WooCommerce, Paystack, Google Sheets and Forms. If the event already exists in your stack, SplitSMS is the last hop to the phone — not another silo to live in.",
    uses: ["REST + sandbox keys", "Delivery webhooks", "Plugins and Google"],
    href: "/solutions/sms-integration",
  },
  {
    id: "resell",
    icon: Store,
    title: "Sell SMS under your own name",
    body: "Agencies, ISPs, and IT shops that already host clients. Wallets per customer, your price, our routes. A platform, not a shared login.",
    uses: ["Client wallets", "Your brand", "Same Ghana routes"],
    href: "/reseller-platform",
  },
];

const industries: {
  id: string;
  icon: typeof ShoppingBag;
  title: string;
  line: string;
  href?: string;
}[] = [
  { id: "retail", icon: ShoppingBag, title: "Retail & e-commerce", line: "Orders, restocks, abandoned carts, pickup codes.", href: "/solutions/retail" },
  { id: "fintech", icon: Landmark, title: "Banks, wallets & fintech", line: "OTP, debit alerts, new-device notices.", href: "/solutions/fintech" },
  { id: "government", icon: Building2, title: "Government & public sector", line: "Notices, appointments, programme reminders.", href: "/solutions/government" },
  { id: "utilities", icon: Zap, title: "Utilities & bills", line: "Outages, meter reads, payment windows." },
  { id: "schools", icon: GraduationCap, title: "Schools & training", line: "Fees, closures, results-are-ready." },
  { id: "health", icon: HeartPulse, title: "Clinics, labs & pharmacies", line: "Appointments, refill windows, pickup." },
  { id: "logistics", icon: Package, title: "Logistics & field ops", line: "Out-for-delivery, failed attempts, agent blasts." },
  { id: "hr", icon: Briefcase, title: "HR, payroll & employers", line: "Shifts, payslip-is-ready, emergency recall." },
  { id: "property", icon: Landmark, title: "Real estate & estates", line: "Viewings, rent, “security will let you in.”" },
  { id: "hospitality", icon: Hotel, title: "Hotels, travel & venues", line: "Bookings, check-in, event gates." },
  { id: "faith", icon: Church, title: "Churches & fellowships", line: "Service reminders, programmes, follow-up." },
  { id: "media", icon: Newspaper, title: "Media, radio & publishers", line: "Breaking alerts, show reminders, polls." },
  { id: "agri", icon: Sprout, title: "Agribusiness & cooperatives", line: "Prices, pickup days, member notices." },
  { id: "microfinance", icon: Wallet, title: "MFIs & collections", line: "Due dates, receipts, officer routes." },
  { id: "saas", icon: Smartphone, title: "Apps, SaaS & platforms", line: "OTP, onboarding, product alerts." },
  { id: "agency", icon: Radio, title: "Agencies & IT shops", line: "Client campaigns, reseller wallets." },
  { id: "ngo", icon: Users, title: "NGOs, events & campaigns", line: "Mobilisation, RSVPs, field days." },
];

const stories = [
  {
    title: "A list that has to move before noon",
    detail:
      "Payroll team, estate office, newsroom, shop — does not matter. If the people you need only live on a phone, you load the group, write two lines, send. Email can wait. This cannot.",
  },
  {
    title: "A login that cannot wait on Gmail",
    detail:
      "Wallet, HR portal, student SIS, internal admin. The user is already looking at the screen. OTP is the product. Bulk SMS is the wrong tool.",
  },
  {
    title: "A status your software already knows",
    detail:
      "Paid, dispatched, approved, delayed. Your ops tool has the event. SplitSMS is how the human hears it without a call centre reading a dashboard out loud.",
  },
  {
    title: "A room, a date, and a sheet in Excel",
    detail:
      "Workshop, AGM, clinic outreach, product launch. Import, remind the morning of, thank them after. Radio is too broad. Door-to-door is too slow.",
  },
  {
    title: "A form at the door",
    detail:
      "QR on a standee, Smart Form on the phone, SMS “you’re in.” Works at a ministry desk and a 40-seat hall. Nobody is typing WhatsApp messages into a spreadsheet at 11pm.",
  },
  {
    title: "A stack you will not rip out",
    detail:
      "WooCommerce, a Laravel app, Google Sheets, a custom ERP. You keep the system of record. We take the last metre to MTN, Telecel, and the rest of the world.",
  },
];

const faqs = [
  {
    q: "Is SplitSMS only for shops, schools, or churches?",
    a: "No. Those are examples because they text a lot — not a limit on who can use the platform. If you have permission to message a phone number, you can run campaigns, OTP, alerts, forms, or the API. Government desks, utilities, hotels, farms, newsrooms, and one-person businesses use the same account type.",
  },
  {
    q: "What is the difference between solutions and products?",
    a: "Solutions are jobs: reach a list, verify a login, confirm an event, collect a reply, plug into software. Products are the tools — campaigns, OTP API, Smart Forms, plugins. Start here if you have a problem. Start on Products if you already know you need a gateway.",
  },
  {
    q: "Can one account cover marketing SMS and OTP?",
    a: "Yes. Same wallet, same Sender ID workflow, different screens and API endpoints. Do not mix promotional copy into transactional OTPs — carriers and customers both notice.",
  },
  {
    q: "We are not in retail or education. Do we still fit?",
    a: "Yes. SplitSMS is a general SMS platform with Ghana billing and global routes. If your industry is not pictured, you are not out of scope — you still get Sender IDs, delivery reports, and the API.",
  },
  {
    q: "How do I start without a developer?",
    a: "Sign up, register a Sender ID, import contacts or connect Google, send a test to yourself. WordPress stores install the plugin. Apps and OTP use the API — that is the path that wants a developer.",
  },
];

export function SolutionsPageContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/50 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Building2 className="h-3.5 w-3.5" />
            SMS platform — not a niche kit
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-4xl lg:leading-[1.08]">
            A real SMS solution for{" "}
            <span className="text-gradient-orange">anyone who needs a phone to answer</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            SplitSMS is campaigns, OTP, transactional alerts, forms, and an API on one wallet.
            Shops, schools, and apps use it because they text a lot — they are not the ceiling.
            If the person you need only lives on a mobile number, this is the pipe.
          </p>
          <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/20")}
            >
              Start with five free credits
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#jobs" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              See what it actually does
            </Link>
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-muted-foreground")}
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>

      <section id="jobs" className="scroll-mt-24 bg-background py-16 md:py-20" aria-labelledby="jobs-heading">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="jobs-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              The jobs. Industry is just the costume.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Every serious SMS platform does a handful of things well. SplitSMS is built around
              those jobs — then you point them at retail, a ministry, a farm, or a fintech. Same
              Sender ID workflow. Same Ghana rates. Same delivery report.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {jobs.map(({ id, icon: Icon, title, body, uses, href }) => (
              <article
                key={id}
                id={id}
                className="flex scroll-mt-24 flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {uses.map((use) => (
                    <li
                      key={use}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {use}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Open this product
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="industries"
        className="scroll-mt-24 border-y border-border/40 bg-muted/30 py-16 md:py-20"
        aria-labelledby="industries-heading"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="industries-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              Who already runs it — not who is allowed
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              These are places SMS shows up every week. If your world is not on the grid, you are
              not “the wrong customer.” You still get the same platform.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map(({ id, icon: Icon, title, line, href }) => (
              <article
                key={id}
                id={id}
                className="flex scroll-mt-24 gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {line}
                  </span>
                  {href ? (
                    <Link
                      href={href}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Learn more
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="use-cases"
        className="scroll-mt-24 py-16 md:py-20"
        aria-labelledby="use-cases-heading"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="use-cases-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
            Situations, not personas
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            If one of these is your Tuesday, you do not need a strategy workshop. You need a
            Sender ID and a list — or a sandbox key.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map(({ title, detail }) => (
              <article
                key={title}
                className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/30 py-16 md:py-20" aria-labelledby="solution-guides">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="solution-guides" className="text-2xl font-bold tracking-tight md:text-3xl">
              Guides if you already know the keyword
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Ghana SMS, mNotify alternative, WooCommerce, Paystack, OTP, integration walkthroughs.
              Long versions for people who arrived with a search query, not a job title.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {seoLandingPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/solutions/${page.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 transition-colors hover:border-primary/30 hover:bg-muted/20"
                >
                  <h3 className="text-lg font-bold transition-colors group-hover:text-primary">
                    {page.h1}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {page.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read guide
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/vibe-coders"
                className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <h3 className="text-lg font-bold transition-colors group-hover:text-primary">
                  SMS for vibe coders
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  OpenAPI, llms.txt, sandbox keys, and prompts for Cursor, Bolt, and shipping this
                  weekend.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Vibe coders hub
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="py-16 md:py-20" aria-labelledby="solutions-faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="solutions-faq" className="mb-10 text-center text-2xl font-bold tracking-tight md:text-3xl">
            Solutions FAQ
          </h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold md:text-base">
                  {q}
                  <span className="shrink-0 text-lg text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pb-1 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl hero-gradient px-8 py-12 text-center text-white md:py-14">
            <div className="relative">
              <h2 className="text-2xl font-bold md:text-3xl">
                Your use case does not need a special pack.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 md:text-base">
                One account. Five free credits. Sender ID, campaigns, OTP, and the API — whether
                you run a till, a ministry, or a production app.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "orange-glow font-semibold")}>
                  Create free account
                </Link>
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  See products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
