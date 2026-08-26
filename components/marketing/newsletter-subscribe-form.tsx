"use client";

import { useActionState, useState } from "react";
import { Mail } from "lucide-react";
import { AuthHoneypot } from "@/components/auth/auth-honeypot";
import { AuthCaptcha } from "@/components/auth/auth-captcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  subscribeNewsletterAction,
  type NewsletterFormState,
} from "@/lib/actions/newsletter";
import { RECAPTCHA_NEWSLETTER_ACTION } from "@/lib/auth/recaptcha";

export function NewsletterSubscribeForm() {
  const [state, action, pending] = useActionState(
    subscribeNewsletterAction,
    null as NewsletterFormState,
  );
  const [startedAt] = useState(() => String(Date.now()));
  const [email, setEmail] = useState("");

  if (state?.ok) {
    return (
      <div role="status" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <p className="flex h-11 min-w-0 flex-1 items-center truncate border-b border-foreground/20 text-sm">
            {email || "You’re subscribed."}
          </p>
          <p className="flex h-11 shrink-0 items-center text-sm font-medium text-primary">
            Subscribed
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Welcome email is on its way. Unsubscribe any time.
        </p>
      </div>
    );
  }

  return (
    <form id="newsletter-form" action={action} className="relative space-y-3">
      <AuthHoneypot />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="newsletter-email" className="sr-only">
            Email
          </Label>
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-background"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-11 shrink-0">
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Occasional updates only. Unsubscribe any time.
      </p>
      <AuthCaptcha action={RECAPTCHA_NEWSLETTER_ACTION} quiet />
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function NewsletterSubscribeBand() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_minmax(280px,28rem)] lg:items-center lg:px-12 xl:px-16 2xl:px-20">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Mail className="h-3.5 w-3.5" />
            Newsletter
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Subscribe to our newsletter
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Delivery tips, SmartForms, and product updates from SplitSMS. No daily spam.
          </p>
        </div>
        <NewsletterSubscribeForm />
      </div>
    </section>
  );
}
