import Link from "next/link";
import { getContactsForUser } from "@/lib/contacts/queries";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CsvImportPanel } from "@/components/contacts/csv-import-panel";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsFilters } from "@/components/contacts/contacts-filters";
import { ContactsGroupsPanel } from "@/components/contacts/contacts-groups-panel";
import { ContactsAddForm } from "@/components/contacts/contacts-add-form";
import { ContactsStats } from "@/components/contacts/contacts-stats";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Download, Users, Upload, UserPlus, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const tabTriggerClass =
    "min-h-10 rounded-lg px-3 py-2 text-sm font-medium gap-2 hover:bg-muted/80 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm data-active:shadow-primary/20 dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:hover:bg-muted/50";

  return (
    <AppPage wide>
      <PageHeader
        title="Contacts"
        description="Import, organize, and message your audience from one place."
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

      <ContactsStats
        total={total}
        groupCount={groups.length}
        countryCount={countryBreakdown.length}
      />

      <Tabs defaultValue="list" className="w-full space-y-4">
        <TabsList className="tabs-list-mobile w-full !h-auto min-h-11 p-1 gap-1 grid grid-cols-2 sm:grid-cols-4 bg-muted/40 rounded-xl border border-border/50">
          <TabsTrigger value="list" className={tabTriggerClass}>
            <Users className="h-4 w-4 shrink-0" />
            <span>All contacts</span>
          </TabsTrigger>
          <TabsTrigger value="import" className={tabTriggerClass}>
            <Upload className="h-4 w-4 shrink-0" />
            <span>Import</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className={tabTriggerClass}>
            <UsersRound className="h-4 w-4 shrink-0" />
            <span>Groups</span>
          </TabsTrigger>
          <TabsTrigger value="add" className={tabTriggerClass}>
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>Add new</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-4">
          <ContactsFilters
            q={params.q}
            country={params.country}
            tag={params.tag}
            groupId={params.groupId}
            groups={groups}
            countryBreakdown={countryBreakdown}
          />

          <AppCard className="overflow-hidden">
            <AppCardBody className="!px-0 !py-0 sm:!px-0 sm:!py-0">
              <ContactsTable
                contacts={contacts}
                groups={groups}
                total={total}
                page={page}
                perPage={perPage}
                query={filterQuery}
              />
            </AppCardBody>
          </AppCard>
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <AppCard>
            <AppCardBody>
              <div className="mb-6 max-w-2xl">
                <h2 className="text-lg font-semibold">Import contacts</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Upload CSV or Excel, review rows, and confirm before saving to your list.
                </p>
              </div>
              <CsvImportPanel />
            </AppCardBody>
          </AppCard>
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          <AppCard>
            <AppCardBody>
              <ContactsGroupsPanel groups={groups} />
            </AppCardBody>
          </AppCard>
        </TabsContent>

        <TabsContent value="add" className="mt-0">
          <AppCard>
            <AppCardBody>
              <ContactsAddForm />
            </AppCardBody>
          </AppCard>
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
