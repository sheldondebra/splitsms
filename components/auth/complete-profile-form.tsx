"use client";

import { completeProfileAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";

export function CompleteProfileForm({
  defaultEmail,
  emailLocked = false,
}: {
  defaultEmail?: string | null;
  emailLocked?: boolean;
}) {
  return (
    <form action={completeProfileAction} className="space-y-5">
      <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex gap-2">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <p>
          Phone verified! Add your name
          {emailLocked ? "" : " and email"} so we can personalize your account and send receipts.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="e.g. Ama Mensah"
          required
          autoComplete="name"
          autoFocus
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          defaultValue={defaultEmail ?? undefined}
          readOnly={emailLocked}
          required
          autoComplete="email"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Used for receipts, account recovery, and email sign-in.
        </p>
      </div>

      <Button type="submit" className="w-full h-11 font-semibold">
        Save and continue
      </Button>
    </form>
  );
}
