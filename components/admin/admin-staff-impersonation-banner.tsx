import { stopStaffImpersonationAction } from "@/lib/actions/admin-impersonation";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

export function AdminStaffImpersonationBanner({ staffName }: { staffName: string }) {
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100">
          <UserCog className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          Viewing admin as <strong>{staffName}</strong> — permissions match this staff account.
        </p>
        <form action={stopStaffImpersonationAction}>
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
            Exit staff view
          </Button>
        </form>
      </div>
    </div>
  );
}
