import {
  createEnterpriseFromUserAction,
  approveEnterpriseAction,
  suspendEnterpriseAction,
  assignDedicatedRouteAction,
  createDedicatedRouteAction,
  resetSmppPasswordAction,
} from "@/lib/actions/admin-enterprise";
import { getAdminEnterpriseMonitoring } from "@/lib/enterprise/analytics";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function AdminEnterprisePage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    systemId?: string;
    password?: string;
    passwordReset?: string;
    approved?: string;
  }>;
}) {
  const params = await searchParams;
  const monitoring = await getAdminEnterpriseMonitoring();

  const [members, routes] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ENTERPRISE"] } },
      take: 20,
      select: { id: true, fullName: true, phone: true, role: true },
    }),
    prisma.dedicatedRoute.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Enterprise & SMPP</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Telecom monitoring · Active binds: {monitoring.activeSessions} · Queue backlog:{" "}
          {monitoring.pendingQueue}
        </p>
      </div>

      {params.systemId && params.password && (
        <Card className="border-primary">
          <CardContent className="pt-6 text-sm font-mono">
            <p>SMPP System ID: {params.systemId}</p>
            <p>Password (save now): {params.password}</p>
          </CardContent>
        </Card>
      )}
      {params.passwordReset && (
        <p className="text-sm text-amber-600">New SMPP password: {params.passwordReset}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Enterprises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monitoring.accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SMPP (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monitoring.smsLast24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monitoring.pendingQueue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create enterprise account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEnterpriseFromUserAction} className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>User</Label>
              <select name="userId" className="flex h-10 rounded-md border px-3 text-sm" required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Company</Label>
              <Input name="companyName" required />
            </div>
            <div>
              <Label>SLA tier</Label>
              <select name="slaTier" className="flex h-10 rounded-md border px-3 text-sm">
                <option value="STANDARD">Standard</option>
                <option value="BUSINESS">Business</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <Label>Credit limit (0 = prepaid)</Label>
              <Input name="creditLimit" type="number" step="0.01" defaultValue="0" />
            </div>
            <Button type="submit">Create + SMPP</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New dedicated route</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDedicatedRouteAction} className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>Name</Label>
              <Input name="name" required placeholder="GH Bank Route" />
            </div>
            <div>
              <Label>Country</Label>
              <Input name="countryCode" defaultValue="GH" />
            </div>
            <div>
              <Label>Lock provider</Label>
              <select name="lockedProvider" className="flex h-10 rounded-md border px-3 text-sm">
                <option value="">Failover</option>
                <option value="MNOTIFY">mNotify</option>
                <option value="TWILIO">Twilio</option>
                <option value="INFOBIP">Infobip</option>
              </select>
            </div>
            <Button type="submit" variant="secondary">
              Add route
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {monitoring.accounts.map((ent) => (
            <div key={ent.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{ent.companyName}</span>
                <Badge>{ent.status}</Badge>
                <Badge variant="outline">{ent.slaTier}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {ent.user.fullName} · {ent.user.phone}
              </p>
              {ent.smppAccount && (
                <p className="text-xs font-mono">
                  SMPP: {ent.smppAccount.systemId} · {ent.smppAccount.throughput}/s
                </p>
              )}
              {ent.credit && (
                <p className="text-xs">
                  Credit: {ent.credit.usedCredit.toNumber()} /{" "}
                  {ent.credit.creditLimit.toNumber()} {ent.credit.currency}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {ent.status === "PENDING" && (
                  <form action={approveEnterpriseAction}>
                    <input type="hidden" name="id" value={ent.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                )}
                {ent.status === "ACTIVE" && (
                  <form action={suspendEnterpriseAction}>
                    <input type="hidden" name="id" value={ent.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Suspend
                    </Button>
                  </form>
                )}
                {ent.smppAccount && (
                  <form action={resetSmppPasswordAction}>
                    <input type="hidden" name="smppAccountId" value={ent.smppAccount.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Reset SMPP password
                    </Button>
                  </form>
                )}
              </div>

              <form action={assignDedicatedRouteAction} className="flex gap-2 items-end">
                <input type="hidden" name="enterpriseId" value={ent.id} />
                <select name="routeId" className="flex h-9 rounded-md border px-2 text-sm">
                  <option value="">No dedicated route</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.countryCode})
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="secondary">
                  Assign route
                </Button>
              </form>
            </div>
          ))}
          {monitoring.accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">No enterprise accounts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
