"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitPublicSupportAction,
  type PublicSupportState,
} from "@/lib/actions/public-support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supportCategories, type SupportCategory } from "@/lib/marketing/support-page";
import { cn } from "@/lib/utils";

const initialState: PublicSupportState = {};

export function SupportForm({ defaultCategory }: { defaultCategory?: SupportCategory }) {
  const [state, formAction, pending] = useActionState(
    submitPublicSupportAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-name">Your name</Label>
          <Input
            id="support-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Ama Mensah"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          {state.fieldErrors?.name ? (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-email">Email</Label>
          <Input
            id="support-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email ? (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-category">What do you need help with?</Label>
        <select
          key={defaultCategory ?? "none"}
          id="support-category"
          name="category"
          required
          defaultValue={defaultCategory ?? ""}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-invalid={Boolean(state.fieldErrors?.category)}
        >
          <option value="" disabled>
            Select a topic…
          </option>
          {supportCategories.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category ? (
          <p className="text-xs text-destructive">{state.fieldErrors.category}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-subject">Subject</Label>
        <Input
          id="support-subject"
          name="subject"
          required
          placeholder="Sender ID still pending after two days"
          aria-invalid={Boolean(state.fieldErrors?.subject)}
        />
        {state.fieldErrors?.subject ? (
          <p className="text-xs text-destructive">{state.fieldErrors.subject}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-message">Details</Label>
        <Textarea
          id="support-message"
          name="message"
          required
          rows={7}
          placeholder="What you sent, to which number, at what time, and what the log shows. Paste the message ID if you have one."
          aria-invalid={Boolean(state.fieldErrors?.message)}
        />
        {state.fieldErrors?.message ? (
          <p className="text-xs text-destructive">{state.fieldErrors.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 sm:w-auto" disabled={pending}>
        {pending ? (
          "Sending…"
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit request
          </>
        )}
      </Button>
    </form>
  );
}
