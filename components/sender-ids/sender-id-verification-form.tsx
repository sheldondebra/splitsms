"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitSenderIdVerificationDocumentFormAction } from "@/lib/actions/sender-id-verification";

const DOC_TYPE_OPTIONS = [
  { value: "BUSINESS_REGISTRATION", label: "Business registration document" },
  { value: "PASSPORT", label: "Passport" },
  { value: "GHANA_CARD", label: "Ghana Card" },
  { value: "OTHER_ID", label: "Other government ID" },
] as const;

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function SenderIdVerificationForm({
  token,
  value,
}: {
  token: string;
  value: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={submitSenderIdVerificationDocumentFormAction}
      onSubmit={() => setSubmitting(true)}
      className="space-y-5"
    >
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <Label htmlFor="docType">Document type</Label>
        <select id="docType" name="docType" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Choose a document type
          </option>
          {DOC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">File</Label>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-input bg-muted/20 px-3 py-4">
          <UploadCloud className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            id="file"
            name="file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png"
            className="min-w-0 flex-1 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">PDF, JPG, or PNG. Max 5MB.</p>
      </div>

      <Button type="submit" className="w-full font-semibold" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Submit for review
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        For sender ID <span className="font-mono font-semibold text-foreground">{value}</span>
      </p>
    </form>
  );
}
