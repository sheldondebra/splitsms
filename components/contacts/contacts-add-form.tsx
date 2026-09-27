"use client";

import { useTransition } from "react";
import { createContactAction } from "@/lib/actions/contacts";
import { ContactTagsInput } from "@/components/contacts/contact-tags-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export function ContactsAddForm() {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      startTransition(async () => {
        try {
          const { enqueueOfflineAction, formDataToPayload } = await import(
            "@/lib/offline/queue"
          );
          const phone = String(formData.get("phone") ?? "").trim() || "contact";
          await enqueueOfflineAction({
            kind: "create_contact",
            payload: formDataToPayload(formData),
            label: `Add contact ${phone}`,
          });
          toast.success("Contact saved offline", {
            description: "Will sync when you’re back online.",
          });
          form.reset();
        } catch {
          toast.error("Could not queue offline");
        }
      });
      return;
    }

    startTransition(() => {
      void createContactAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
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
              className="h-11 rounded-xl bg-background"
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
              className="h-11 rounded-xl bg-background font-mono"
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
              className="h-11 rounded-xl bg-background"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              Tags
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <ContactTagsInput disabled={pending} />
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add each tag.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full gap-2 rounded-xl px-8 font-semibold sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Save contact
          </>
        )}
      </Button>
    </form>
  );
}
