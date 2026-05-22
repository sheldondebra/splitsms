import { getFraudFlags } from "@/lib/admin/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminFraudPage() {
  const flags = await getFraudFlags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fraud monitoring</h1>
      <p className="text-sm text-muted-foreground">
        Members with elevated failure rates in the last 7 days.
      </p>
      <Card>
        <CardHeader><CardTitle>Flagged accounts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {flags.length === 0 ? (
            <p className="text-muted-foreground">No elevated risk accounts.</p>
          ) : (
            flags.map((f) => (
              <div key={f.userId} className="flex justify-between border-b py-3 text-sm">
                <div>
                  <p className="font-medium">{f.fullName}</p>
                  <p className="text-muted-foreground">{f.phone}</p>
                </div>
                <div className="text-right">
                  <Badge variant={f.risk === "HIGH" ? "destructive" : "outline"}>
                    {f.risk}
                  </Badge>
                  <p className="mt-1">{f.failureRate}% failed ({f.failed}/{f.total})</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
