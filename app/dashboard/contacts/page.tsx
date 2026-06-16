import Link from "next/link";
import { getContactsForUser } from "@/lib/contacts/queries";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CsvImportPanel } from "@/components/contacts/csv-import-panel";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsFilters } from "@/components/contacts/contacts-filters";
import { ContactsGroupsPanel } from "@/components/contacts/contacts-groups-panel";
import { ContactsAddForm } from "@/components/contacts/contacts-add-form";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Download, Users, Upload, UserPlus, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildContactsQueryString } from "@/components/contacts/contacts-pagination";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    imported?: string;
    invalid?: string;
    dup?: string;
    error?: string;
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

  const [{ contacts, total, countryBreakdown, perPage }, groups] = await Promise.all([
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

  const filterQuery = {
    q: params.q,
    country: params.country,
    tag: params.tag,
    groupId: params.groupId,
  };

  const importSuccessMessage = params.imported
    ? `Imported ${params.imported} contacts${params.invalid ? ` · ${params.invalid} invalid skipped` : ""}${params.dup ? ` · ${params.dup} duplicates skipped` : ""}`
    : undefined;

  return (
    <AppPage>
      <PageHeader
        title="Contacts"
        description={`${total.toLocaleString()} contact${total === 1 ? "" : "s"} · import, filter, and group for campaigns`}
        icon={Users}
        mobileDescription={`${total} contacts — search, import CSV, or add manually.`}
        actions={
          <a
            href={`/api/dashboard/contacts/export?${exportQs.toString()}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 h-10 rounded-xl font-medium",
            )}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        }
      />

      {importSuccessMessage ? (
        <FriendlyAlert success="1" successMessage={importSuccessMessage} />
      ) : (
        <FriendlyAlert error={params.error} />
      )}

      <ContactsFilters
        q={params.q}
        country={params.country}
        tag={params.tag}
        groupId={params.groupId}
        groups={groups}
      />

      {countryBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-1">By country:</span>
          {countryBreakdown.map((c) => (
            <Link
              key={c.countryCode ?? "unk"}
              href={`/dashboard/contacts${buildContactsQueryString({
                ...filterQuery,
                country: c.countryCode ?? undefined,
              })}`}
            >
              <Badge variant="outline" className="hover:bg-muted/50 cursor-pointer font-mono">
                {c.countryCode ?? "?"}: {c._count.id}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="tabs-list-mobile w-full !h-auto min-h-11 p-1.5 gap-1.5 grid grid-cols-2 sm:grid-cols-4 bg-muted/50 rounded-xl border border-border/50">
          <TabsTrigger
            value="list"
            className="!h-auto min-h-10 rounded-lg px-3 py-2.5 text-sm font-medium gap-2 data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>All</span>
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="!h-auto min-h-10 rounded-lg px-3 py-2.5 text-sm font-medium gap-2 data-[state=active]:shadow-sm"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>Import</span>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="!h-auto min-h-10 rounded-lg px-3 py-2.5 text-sm font-medium gap-2 data-[state=active]:shadow-sm"
          >
            <UsersRound className="h-4 w-4 shrink-0" />
            <span>Groups</span>
          </TabsTrigger>
          <TabsTrigger
            value="add"
            className="!h-auto min-h-10 rounded-lg px-3 py-2.5 text-sm font-medium gap-2 data-[state=active]:shadow-sm"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>Add</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <AppCard className="overflow-hidden border-border/60 shadow-sm">
            <CardContent className="p-0 sm:p-0">
              <div className="p-4 sm:p-6">
                <ContactsTable
                  contacts={contacts}
                  groups={groups}
                  total={total}
                  page={page}
                  perPage={perPage}
                  query={filterQuery}
                />
              </div>
            </CardContent>
          </AppCard>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <AppCard>
            <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Import from CSV</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste or upload contact data. Preview validates numbers before saving.
                </p>
              </div>
              <CsvImportPanel />
            </CardContent>
          </AppCard>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <AppCard>
            <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
              <ContactsGroupsPanel groups={groups} />
            </CardContent>
          </AppCard>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <ContactsAddForm />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
