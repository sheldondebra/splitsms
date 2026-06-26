"use client";

import { useTransition } from "react";
import { createContactAction } from "@/lib/actions/contacts";
import { ContactTagsInput } from "@/components/contacts/contact-tags-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Phone, User, UserPlus } from "lucide-react";

export function ContactsAddForm() {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      void createContactAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Add a contact</h2>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Save someone manually for quick sends and campaigns.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-name" className="flex items-center gap-1.5 text-xs font-semibold">
              <User className="h-3.5 w-3.5 text-primary" />
              Name
            </Label>
            <Input
              id="contact-name"
              name="name"
              placeholder="Jane Doe"
              disabled={pending}
              className="h-11 bg-background"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-phone" className="flex items-center gap-1.5 text-xs font-semibold">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Phone
            </Label>
            <Input
              id="contact-phone"
              name="phone"
              placeholder="233201234567"
              required
              disabled={pending}
              className="h-11 font-mono bg-background"
            />
            <p className="text-xs text-muted-foreground">International format without +</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="flex items-center gap-1.5 text-xs font-semibold">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Email
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              disabled={pending}
              className="h-11 bg-background"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              Tags
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <ContactTagsInput disabled={pending} />
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add each tag. Tags appear as cards you can remove.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="mt-5 h-11 w-full sm:w-auto rounded-xl font-semibold px-8 gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save contact"
        )}
      </Button>
    </form>
  );
}
