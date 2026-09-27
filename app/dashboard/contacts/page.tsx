import Link from "next/link";
import { getContactsForUser } from "@/lib/contacts/queries";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CsvImportPanel } from "@/components/contacts/csv-import-panel";
import { GoogleContactsImportPanel } from "@/components/contacts/google-contacts-import-panel";
import { GoogleContactsExportPanel } from "@/components/contacts/google-contacts-export-panel";
import { GoogleSheetsImportPanel } from "@/components/contacts/google-sheets-import-panel";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsFilters } from "@/components/contacts/contacts-filters";
import { ContactsGroupsPanel } from "@/components/contacts/contacts-groups-panel";
import { ContactsAddForm } from "@/components/contacts/contacts-add-form";
import { ContactsStats } from "@/components/contacts/contacts-stats";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import {
  Download,
  Users,
  Upload,
  UserPlus,
  UsersRound,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleConnectionPublic } from "@/lib/google/connection";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    imported?: string;
    invalid?: string;
    dup?: string;
    error?: string;
    exported?: string;
    exportFailed?: string;
    q?: string;
    country?: string;
    tag?: string;
    groupId?: string;
    page?: string;
    tab?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const defaultTab =
    params.tab === "import" || params.tab === "groups" || params.tab === "add"
      ? params.tab
      : "list";

  const [{ contacts, total, allCount, countryBreakdown, perPage }, groups, googleConnection] =
    await Promise.all([
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
      getGoogleConnectionPublic(session.userId),
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

  const filtered = Boolean(params.q || params.country || params.tag || params.groupId);

  const importSuccessMessage = params.imported
    ? `Imported ${params.imported} contacts${params.invalid ? ` · ${params.invalid} invalid skipped` : ""}${params.dup ? ` · ${params.dup} duplicates skipped` : ""}`
    : params.exported
      ? `Exported ${params.exported} contacts to Google${params.exportFailed ? ` · ${params.exportFailed} failed` : ""}`
      : undefined;

  const tabTriggerClass =
    "min-h-10 rounded-lg px-3 py-2 text-sm font-medium gap-2 hover:bg-muted/80 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm data-active:shadow-primary/20 dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:hover:bg-muted/50";

  return (
    <AppPage wide>
      <PageHeader
        title="Contacts"
        description="Build your audience once — then search, group, and message them from Send SMS or campaigns."
        icon={Users}
        mobileDescription={
          allCount === 0
            ? "Import or add contacts to get started."
            : `${allCount.toLocaleString()} contacts — search, import, or add.`
        }
        actions={
          <>
            <Link
              href="/dashboard/contacts?tab=add"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-10 gap-2 rounded-xl font-semibold",
              )}
            >
              <UserPlus className="h-4 w-4" />
              Add contact
            </Link>
            <a
              href={`/api/dashboard/contacts/export?${exportQs.toString()}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 gap-2 rounded-xl font-medium",
              )}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </>
        }
      />

      {importSuccessMessage ? (
        <FriendlyAlert success="1" successMessage={importSuccessMessage} />
      ) : (
        <FriendlyAlert error={params.error} />
      )}

      <div className="space-y-6">
        <ContactsStats
          total={total}
          allCount={allCount}
          groupCount={groups.length}
          countryCount={countryBreakdown.length}
          filtered={filtered}
        />

        {allCount === 0 && defaultTab === "list" ? (
          <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.10] via-background to-muted/20 px-4 py-4 sm:px-6 sm:py-5">
              <h2 className="text-lg font-semibold tracking-tight">Get started with contacts</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Choose how you want to add people. Once they’re in, you can filter by country or
                tag and send SMS in a few taps.
              </p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
              {[
                {
                  href: "/dashboard/contacts?tab=import",
                  icon: Upload,
                  title: "Import CSV / Google",
                  text: "Upload a file or sync Google Contacts and Sheets.",
                },
                {
                  href: "/dashboard/contacts?tab=add",
                  icon: UserPlus,
                  title: "Add one contact",
                  text: "Save a name and phone for quick sends.",
                },
                {
                  href: "/dashboard/contacts?tab=groups",
                  icon: UsersRound,
                  title: "Create a group",
                  text: "Organize audiences for campaigns later.",
                },
              ].map(({ href, icon: Icon, title, text }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-xl border border-border/60 bg-muted/10 p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <Tabs defaultValue={defaultTab} className="w-full space-y-4">
          <TabsList className="tabs-list-mobile !h-auto min-h-11 w-full grid grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/40 p-1 sm:grid-cols-4">
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

          <TabsContent value="list" className="mt-0">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              {allCount > 0 || filtered ? (
                <div className="border-b border-border/50 px-4 py-3.5 sm:px-5">
                  <ContactsFilters
                    q={params.q}
                    country={params.country}
                    tag={params.tag}
                    groupId={params.groupId}
                    groups={groups}
                    countryBreakdown={countryBreakdown}
                  />
                </div>
              ) : null}
              <ContactsTable
                contacts={contacts}
                groups={groups}
                total={total}
                allCount={allCount}
                page={page}
                perPage={perPage}
                query={filterQuery}
              />
            </div>
          </TabsContent>

          <TabsContent value="import" className="mt-0 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.06] via-background to-muted/15 px-4 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Import contacts</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Upload CSV or Excel, pull from Google Contacts or Sheets — review rows, then
                      confirm.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
                <GoogleContactsImportPanel connected={Boolean(googleConnection)} />
                <GoogleSheetsImportPanel connected={Boolean(googleConnection)} />
                <GoogleContactsExportPanel
                  connected={Boolean(googleConnection)}
                  totalContacts={allCount}
                />
                <CsvImportPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <AppCard>
              <AppCardBody>
                <ContactsGroupsPanel groups={groups} />
              </AppCardBody>
            </AppCard>
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-4 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Add a contact</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Save someone manually for quick sends and campaigns.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:px-6 sm:py-6">
                <ContactsAddForm />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppPage>
  );
}
