import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Mail, Paperclip } from "lucide-react";
import { SupportForm } from "@/components/marketing/support-form";
import { buttonVariants } from "@/components/ui/button";
import {
  supportFaqs,
  supportFastPaths,
  supportTopics,
  type SupportCategory,
} from "@/lib/marketing/support-page";
import { supportEmail } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SupportPageContent({
  submitted,
  defaultCategory,
}: {
  submitted: boolean;
  defaultCategory?: SupportCategory;
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_-10%,oklch(0.72_0.19_45/0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-14 md:pt-20 md:pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Support
            </p>
            <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              When a message stalls, write it down once.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Sender ID still pending. Checkout SMS silent. OTP 401 in staging. We reply by email
              from Accra — usually the same working day. There is no phone queue, and we will not
              ask you to “restart your router.”
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#contact" className={cn(buttonVariants({ size: "lg" }), "font-semibold")}>
                Open a request
              </Link>
              <Link href="/docs" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                Read the docs first
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">How we work</p>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Mon–Fri, Accra time.</strong> Same day if you
                  write before mid-afternoon; otherwise the next working morning.
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Email{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {supportEmail}
                  </a>{" "}
                  or the form — same inbox.
                </span>
              </li>
              <li className="flex gap-3">
                <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Bring the IDs.</strong> Message ID, order
                  number, or API request beat a paragraph of “it didn’t work.”
                </span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="py-14 md:py-16" aria-labelledby="try-this-first">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="try-this-first" className="text-2xl font-bold tracking-tight md:text-3xl">
            Try this before you wait on us
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Most “is the platform down?” mail is a sandbox key on a live store, or a Sender ID
            that has not cleared the networks yet. These pages close that loop faster than a ticket.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportFastPaths.map(({ href, title, body, icon: Icon, featured }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40",
                  featured && "sm:col-span-2 lg:col-span-1 lg:row-span-2",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-border/40 bg-muted/30 py-14 md:py-16"
        aria-labelledby="common-topics"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="common-topics" className="text-2xl font-bold tracking-tight">
            Jump to a topic
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prefills the form. You still have to tell us what actually happened.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supportTopics.map(({ href, title, body, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex gap-3 rounded-xl border border-border/60 bg-background px-4 py-3.5 transition-colors hover:border-primary/35 hover:bg-card"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {body}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 py-14 md:py-20" aria-labelledby="contact-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div>
            <h2 id="contact-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              {submitted ? "Request received" : "Write to support"}
            </h2>
            {submitted ? (
              <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-4 text-lg font-semibold">It’s in the queue.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  We will reply to the email you used. If you have an account, you can also pick
                  the thread up under Help &amp; support in the dashboard.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/support#contact" className={cn(buttonVariants({ variant: "outline" }))}>
                    Send another
                  </Link>
                  <Link href="/dashboard/support" className={cn(buttonVariants())}>
                    Open dashboard tickets
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
                <SupportForm defaultCategory={defaultCategory} />
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-5">
              <h3 className="text-sm font-semibold">What to paste in</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>The phone number (with country code) and send time.</li>
                <li>Message ID or API request ID from the log.</li>
                <li>Sender ID you used, and whether it is approved.</li>
                <li>For plugins: WordPress version, plugin version, one order ID.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-sm font-semibold">Already a member?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tickets from the dashboard stay attached to the wallet, so we can see the campaign
                without a round of “please forward the screenshot.”
              </p>
              <Link
                href="/dashboard/support"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Dashboard support
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border/40 bg-muted/30 py-14 md:py-16" aria-labelledby="support-faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="support-faq" className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            Before you hit send
          </h2>
          <div className="mt-10 space-y-3">
            {supportFaqs.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold md:text-base">
                  {question}
                  <span className="shrink-0 text-lg text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pb-1 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
