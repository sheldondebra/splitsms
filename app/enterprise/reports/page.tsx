import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subDays } from "date-fns";

export default async function EnterpriseReportsPage() {
  const session = await getSession();
  if (!session) return null;
  const since = subDays(new Date(), 7);

  const messages = await prisma.message.findMany({
    where: { userId: session.userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      recipient: true,
      status: true,
      channel: true,
      priority: true,
      countryCode: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Recent messages (last 7 days)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={`${m.recipient}-${m.createdAt.toISOString()}`} className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">{m.recipient}</td>
                  <td className="py-2 pr-4">{m.status}</td>
                  <td className="py-2 pr-4">{m.channel ?? "—"}</td>
                  <td className="py-2 pr-4">{m.priority}</td>
                  <td className="py-2 text-muted-foreground">
                    {m.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-muted-foreground">
                    No messages in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
