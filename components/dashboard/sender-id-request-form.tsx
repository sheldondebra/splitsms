"use client";

import { useState } from "react";
import { requestSenderIdAction } from "@/lib/actions/sender-ids";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function SenderIdRequestForm() {
  const [value, setValue] = useState("");

  return (
    <form action={requestSenderIdAction} className="space-y-4">
      <div>
        <Label htmlFor="value" className="text-sm font-semibold">
          Brand name (Sender ID)
        </Label>
        <Input
          id="value"
          name="value"
          maxLength={11}
          required
          placeholder="MYBRAND"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          className="mt-1.5 h-12 text-lg font-mono tracking-wider uppercase"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          {value.length}/11 characters · letters and numbers only
        </p>
      </div>
      <div>
        <Label htmlFor="countryCode">Country code</Label>
        <Input
          id="countryCode"
          name="countryCode"
          defaultValue="GH"
          maxLength={10}
          className="mt-1.5 h-11 font-mono uppercase"
        />
      </div>
      <Button type="submit" className="h-11 w-full sm:w-auto font-semibold gap-2">
        <Plus className="h-4 w-4" />
        Register Sender ID
      </Button>
    </form>
  );
}
