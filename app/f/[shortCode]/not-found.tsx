import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Form not found",
  description: "This Smart Form may have been removed, closed, or the link is incorrect.",
  path: "/f/not-found",
  noIndex: true,
});

export default function PublicFormNotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Form not found</h1>
        <p className="text-muted-foreground leading-relaxed">
          This form may have been removed, closed, or the link is incorrect.
        </p>
        <Link href="https://www.splitsms.com" className={cn(buttonVariants(), "inline-flex h-11")}>
          Go to SplitSMS
        </Link>
      </div>
    </div>
  );
}
