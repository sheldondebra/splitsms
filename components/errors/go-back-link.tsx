"use client";

import { ArrowLeft } from "lucide-react";

export function GoBackLink() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-primary transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Go back
    </button>
  );
}
