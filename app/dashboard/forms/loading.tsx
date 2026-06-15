import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";

export default function SmartFormsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppCard key={i}>
            <AppCardBody className="p-4 h-20 bg-muted/50">
              <span className="sr-only">Loading</span>
            </AppCardBody>
          </AppCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppCard key={i}>
            <AppCardBody className="p-5 h-48 bg-muted/40">
              <span className="sr-only">Loading</span>
            </AppCardBody>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
