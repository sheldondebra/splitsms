import Link from "next/link";
import {
  createContactAction,
  createGroupAction,
  renameGroupAction,
  deleteGroupAction,
} from "@/lib/actions/contacts";
import { getContactsForUser } from "@/lib/contacts/queries";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CsvImportPanel } from "@/components/contacts/csv-import-panel";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Users } from "lucide-react";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    imported?: string;
    invalid?: string;
    dup?: string;
    q?: string;
    country?: string;
    tag?: string;
    groupId?: string;
    page?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const [{ contacts, total, countryBreakdown }, groups] = await Promise.all([
    getContactsForUser(session.userId, {
      q: params.q,
      country: params.country,
      tag: params.tag,
      groupId: params.groupId,
      page,
    }),
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const exportQs = new URLSearchParams();
  if (params.q) exportQs.set("q", params.q);
  if (params.country) exportQs.set("country", params.country);
  if (params.tag) exportQs.set("tag", params.tag);
  if (params.groupId) exportQs.set("groupId", params.groupId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} contacts · import, segment, and group audiences
          </p>
        </div>
        <a
          href={`/api/dashboard/contacts/export?${exportQs.toString()}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {params.imported && (
        <p className="text-sm text-green-600 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2">
          Imported {params.imported} contacts
          {params.invalid ? ` · ${params.invalid} invalid skipped` : ""}
          {params.dup ? ` · ${params.dup} duplicates skipped` : ""}
        </p>
      )}

      <form method="get" className="flex flex-wrap gap-2 max-w-4xl">
        <Input name="q" placeholder="Search name, phone, tag…" defaultValue={params.q} className="max-w-xs" />
        <Input name="country" placeholder="Country GH" defaultValue={params.country} className="w-28" />
        <Input name="tag" placeholder="Tag" defaultValue={params.tag} className="w-28" />
        <select
          name="groupId"
          defaultValue={params.groupId ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {countryBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {countryBreakdown.map((c) => (
            <Badge key={c.countryCode ?? "unk"} variant="outline">
              {c.countryCode ?? "?"}: {c._count.id}
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All contacts</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="add">Add one</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <ContactsTable contacts={contacts} groups={groups} />
          {total > 50 && (
            <div className="flex gap-2 mt-4">
              {page > 1 && (
                <Link
                  href={`?${(() => {
                    const qp = new URLSearchParams();
                    if (params.q) qp.set("q", params.q);
                    if (params.country) qp.set("country", params.country);
                    if (params.tag) qp.set("tag", params.tag);
                    if (params.groupId) qp.set("groupId", params.groupId);
                    qp.set("page", String(page - 1));
                    return qp.toString();
                  })()}`}
                  className="text-sm text-primary"
                >
                  Previous
                </Link>
              )}
              {page * 50 < total && (
                <Link
                  href={`?${(() => {
                    const qp = new URLSearchParams();
                    if (params.q) qp.set("q", params.q);
                    if (params.country) qp.set("country", params.country);
                    if (params.tag) qp.set("tag", params.tag);
                    if (params.groupId) qp.set("groupId", params.groupId);
                    qp.set("page", String(page + 1));
                    return qp.toString();
                  })()}`}
                  className="text-sm text-primary"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import CSV</CardTitle>
              <CardDescription>
                Drag content or paste CSV. Preview validates numbers and removes duplicates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsvImportPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={createGroupAction} className="flex flex-wrap gap-2">
                <Input name="name" placeholder="Group name" required />
                <Input name="description" placeholder="Description (optional)" />
                <Button type="submit">Create</Button>
              </form>
              <div className="space-y-3">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b py-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g._count.members} members</p>
                    </div>
                    <div className="flex gap-2">
                      <form action={renameGroupAction} className="flex gap-1">
                        <input type="hidden" name="id" value={g.id} />
                        <Input name="name" placeholder="Rename" className="h-8 w-32" />
                        <Button type="submit" size="sm" variant="outline">
                          Rename
                        </Button>
                      </form>
                      <form action={deleteGroupAction}>
                        <input type="hidden" name="id" value={g.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Add contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createContactAction} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input name="name" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="+233..." required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <div>
                  <Label>Tags</Label>
                  <Input name="tags" placeholder="vip, newsletter" />
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
