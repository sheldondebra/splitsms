"use client";

import { completeProfileAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";

export function CompleteProfileForm() {
  return (
    <form action={completeProfileAction} className="space-y-5">
      <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex gap-2">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <p>Phone verified! Add your name to finish — you get 5 free SMS credits.</p>
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
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          For receipts and account recovery. You can add this later in settings.
        </p>
      </div>

      <Button type="submit" className="w-full h-11 font-semibold">
        Go to dashboard
      </Button>
    </form>
  );
}
