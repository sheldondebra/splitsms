import { getSession } from "@/lib/auth/session";
import { getEnterpriseByUserId } from "@/lib/enterprise/context";
import {
  updateEnterpriseIpWhitelistAction,
  updateSmppIpWhitelistAction,
} from "@/lib/actions/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function EnterpriseSmppPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const enterprise = await getEnterpriseByUserId(session.userId);
  const smpp = enterprise?.smppAccount;
  const port = process.env.SMPP_PORT ?? "2775";
  const host = process.env.SMPP_HOST ?? "localhost";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Direct connection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          High-volume messaging link for your systems
        </p>
      </div>

      {params.saved && (
        <p className="text-sm text-green-600">IP whitelist updated.</p>
      )}

      {smpp ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Connection details
                <Badge variant={smpp.isActive ? "default" : "secondary"}>
                  {smpp.isActive ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono space-y-2">
              <p>Host: {host}</p>
              <p>Port: {port}</p>
              <p>System ID: {smpp.systemId}</p>
              <p>Message speed: {smpp.throughput} per second</p>
              <p className="text-muted-foreground font-sans text-xs mt-4">
                Password is shown only when an admin creates or resets your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account IP whitelist</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateEnterpriseIpWhitelistAction} className="space-y-3">
                <div>
                  <Label>IPs (one per line)</Label>
                  <textarea
                    name="ipWhitelist"
                    className="mt-1 flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm font-mono"
                    defaultValue={enterprise?.ipWhitelist.join("\n")}
                  />
                </div>
                <Button type="submit" size="sm">
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMPP-specific IP whitelist</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateSmppIpWhitelistAction} className="space-y-3">
                <div>
                  <Label>IPs (one per line)</Label>
                  <textarea
                    name="ipWhitelist"
                    className="mt-1 flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm font-mono"
                    defaultValue={smpp.ipWhitelist.join("\n")}
                  />
                </div>
                <Button type="submit" size="sm">
                  Save SMPP IPs
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            SMPP account not provisioned yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
