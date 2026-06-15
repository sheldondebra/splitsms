"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateSmartFormAction } from "@/lib/actions/smart-forms";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DuplicateSmartFormButton({ formId }: { formId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-9 gap-1.5 text-muted-foreground"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicateSmartFormAction(formId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Form duplicated");
          router.push(`/dashboard/forms/${result.newFormId}/builder`);
        });
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
      Duplicate
    </Button>
  );
}
