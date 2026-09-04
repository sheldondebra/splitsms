"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteFileUploadAction,
  emailFileUploadToAdminAction,
  emailFileUploadToProviderAction,
} from "@/lib/actions/file-uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Mail, Send, Trash2, Loader2 } from "lucide-react";

export function FileUploadRowActions({
  id,
  downloadUrl,
  senderValue,
}: {
  id: string;
  downloadUrl: string;
  senderValue: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [providerOpen, setProviderOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  function runDelete() {
    if (!window.confirm("Delete this file permanently?")) return;
    startTransition(async () => {
      const result = await deleteFileUploadAction(id);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function runEmailAdmin() {
    startTransition(async () => {
      const result = await emailFileUploadToAdminAction(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function runSendToProvider() {
    startTransition(async () => {
      const result = await emailFileUploadToProviderAction(id, recipientEmail);
      if (result.ok) {
        toast.success(result.message);
        setProviderOpen(false);
        setRecipientEmail("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={downloadUrl}
        title="Download"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" />
      </a>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Email to admin"
        disabled={pending}
        onClick={runEmailAdmin}
      >
        <Mail className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={providerOpen} onOpenChange={setProviderOpen}>
        <DialogTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" title="Send to provider" />}
        >
          <Send className="h-3.5 w-3.5" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send to provider</DialogTitle>
            <DialogDescription>
              Emails this document with a professional cover message for sender ID “{senderValue}”.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor={`provider-email-${id}`}>Provider email address</Label>
            <Input
              id={`provider-email-${id}`}
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="compliance@provider.com"
              autoFocus
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs whitespace-pre-line text-muted-foreground">
            {`Greetings,\n\nKindly find attached business registration documents for ${senderValue} as requested.\n\nThank you.`}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProviderOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !recipientEmail.trim()}
              onClick={runSendToProvider}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Delete"
        disabled={pending}
        onClick={runDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
