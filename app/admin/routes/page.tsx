import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminRoutesPage() {
  const routes = await prisma.smsRoute.findMany({
    include: {
      country: true,
      steps: { include: { provider: true }, orderBy: { priority: "asc" } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS routes</h1>
      {routes.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{r.country.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {r.steps.map((s) => (
              <p key={s.id}>
                {s.priority}. {s.provider.type}
              </p>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
