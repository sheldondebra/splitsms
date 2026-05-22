import { getSession } from "@/lib/auth/session";
import { getEnterpriseByUserId } from "@/lib/enterprise/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EnterpriseRoutesPage() {
  const session = await getSession();
  if (!session) return null;
  const enterprise = await getEnterpriseByUserId(session.userId);
  const route = enterprise?.dedicatedRoute;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dedicated routes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Locked provider paths for your traffic by country.
        </p>
      </div>

      {route ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {route.name}
              <Badge>{route.isActive ? "Active" : "Inactive"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Country: {route.countryCode}</p>
            <p>
              Locked provider:{" "}
              {route.lockedProvider ?? "Failover (platform default)"}
            </p>
            {route.description && (
              <p className="text-muted-foreground">{route.description}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No dedicated route assigned. Your messages use the standard platform routing
            chain. Contact your account manager to request a dedicated route.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
