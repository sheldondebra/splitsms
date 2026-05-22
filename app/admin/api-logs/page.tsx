import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminApiLogsPage() {
  const logs = await prisma.apiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { fullName: true, phone: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API logs</h1>
      <Card>
        <CardContent className="divide-y pt-6 text-sm">
          {logs.map((l) => (
            <div key={l.id} className="flex justify-between py-2">
              <span>
                {l.user?.fullName ?? "—"} · {l.method} {l.path}
              </span>
              <Badge variant="outline">{l.statusCode}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
