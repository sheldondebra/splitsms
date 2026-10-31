"use client";

import { useEffect, useId, useState } from "react";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DownloadPluginButtonProps = {
  label?: string;
  source?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
};

export function DownloadPluginButton({
  label = "Download plugin",
  source = "wordpress-plugin-page",
  size = "lg",
  variant = "default",
  className,
}: DownloadPluginButtonProps) {
  const formId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/plugin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Could not start your download. Try again.");
        return;
      }

      const link = document.createElement("a");
      link.href = data.download_url;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Download starting…");
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ size, variant }), "gap-2 font-semibold", className)}
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="relative z-10 w-full max-w-sm rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
                <div className="flex flex-col gap-2 pr-6">
                  <h2 className="text-base font-semibold leading-none">
                    Download SplitSMS for WordPress
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tell us where to send setup tips and update alerts. Your download starts right
                    after.
                  </p>
                </div>
                <form id={formId} onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${formId}-name`}>Name</Label>
                    <Input
                      id={`${formId}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${formId}-email`}>Email *</Label>
                    <Input
                      id={`${formId}-email`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${formId}-phone`}>Phone</Label>
                    <Input
                      id={`${formId}-phone`}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="233…"
                      autoComplete="tel"
                    />
                  </div>
                  <Button type="submit" disabled={pending} className="w-full gap-2">
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {pending ? "Starting download…" : "Download now"}
                  </Button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
