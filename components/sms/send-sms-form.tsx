"use client";

import { useState } from "react";
import { sendSmsAction } from "@/lib/actions/sms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2 } from "lucide-react";

type SendSmsFormProps = {
  defaultSender: string;
  senderOptions: { value: string }[];
};

export function SendSmsForm({ defaultSender, senderOptions }: SendSmsFormProps) {
  const [pending, setPending] = useState(false);
  const [senderId, setSenderId] = useState(senderOptions[0]?.value ?? defaultSender);
  const [countryCode, setCountryCode] = useState("GH");

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await sendSmsAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="recipients" className="text-base font-semibold">
          1. Enter phone numbers
        </Label>
        <Textarea
          id="recipients"
          name="recipients"
          rows={5}
          required
          placeholder="One number per line&#10;e.g. 233201234567"
          className="min-h-[120px] text-base"
        />
        <p className="text-xs text-muted-foreground">Paste numbers from your contacts or spreadsheet.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body" className="text-base font-semibold">
          2. Type your message
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={4}
          required
          placeholder="Hello! Your order is ready for pickup."
          className="min-h-[100px] text-base"
        />
      </div>

      <input type="hidden" name="senderId" value={senderId} />
      <input type="hidden" name="countryCode" value={countryCode} />

      <details className="group rounded-xl border bg-muted/30 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-muted-foreground">
          Advanced options
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 space-y-4 border-t pt-4">
          <div>
            <Label htmlFor="senderIdVisible">Sender name (what recipients see)</Label>
            <Input
              id="senderIdVisible"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="mt-1 h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="countryCode">Country</Label>
            <Input
              id="countryCode"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="mt-1 h-11 text-base"
            />
          </div>
        </div>
      </details>

      <Button
        type="submit"
        disabled={pending}
        className="h-14 w-full text-base font-semibold rounded-xl"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending your messages…
          </>
        ) : (
          "3. Send SMS"
        )}
      </Button>
    </form>
  );
}
