import { stopResellerImpersonationAction } from "@/lib/actions/admin-impersonation";
import { Button } from "@/components/ui/button";
import { Eye, LogOut } from "lucide-react";

export function ResellerImpersonationBanner({
  businessName,
}: {
  businessName: string;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-amber-500/40 bg-amber-500 text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="h-4 w-4 shrink-0" />
          <p className="font-semibold truncate">
            Viewing as <span className="underline decoration-amber-800/40">{businessName}</span>
          </p>
          <span className="hidden sm:inline text-amber-900/80 text-xs font-medium">
            Staff impersonation · actions are audited
          </span>
        </div>
        <form action={stopResellerImpersonationAction}>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-8 bg-amber-950 text-amber-50 hover:bg-amber-900 border-0"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Exit to admin
          </Button>
        </form>
      </div>
    </div>
  );
}
