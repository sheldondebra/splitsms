"use client";

import { useState, type ReactNode } from "react";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GeneralSettingsTab } from "@/lib/admin/general-settings-tab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "email" as const, label: "Email", icon: Mail },
  { id: "alerts" as const, label: "Alerts", icon: Bell },
  { id: "slack" as const, label: "Slack", icon: MessageSquare },
];

export function GeneralSettingsTabs({
  initialTab,
  emailNeedsSetup,
  alertContacts,
  slackOn,
  email,
  alerts,
  slack,
}: {
  initialTab: GeneralSettingsTab;
  emailNeedsSetup: boolean;
  alertContacts: number;
  slackOn: boolean;
  email: ReactNode;
  alerts: ReactNode;
  slack: ReactNode;
}) {
  const [tab, setTab] = useState<GeneralSettingsTab>(initialTab);

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setTab(initialTab);
  }

  function onTabChange(value: string) {
    const next = value as GeneralSettingsTab;
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    params.delete("saved");
    params.delete("test");
    params.delete("result");
    params.delete("to");
    params.delete("error");
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", qs ? `/admin/general?${qs}` : "/admin/general");
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="gap-5">
      <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className={cn(
              "h-11 min-w-0 flex-1 gap-2 overflow-hidden rounded-lg px-2 text-xs font-medium whitespace-normal sm:px-3 sm:text-sm",
              "data-active:bg-background data-active:text-foreground data-active:shadow-sm",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
            {id === "email" && emailNeedsSetup ? (
              <Badge
                variant="secondary"
                className="hidden h-4 border-transparent bg-amber-500/20 px-1.5 py-0 text-[9px] text-amber-800 sm:inline-flex dark:text-amber-200"
              >
                Setup
              </Badge>
            ) : null}
            {id === "alerts" && alertContacts > 0 ? (
              <Badge
                variant="secondary"
                className="hidden h-4 border-transparent px-1.5 py-0 text-[9px] sm:inline-flex"
              >
                {alertContacts}
              </Badge>
            ) : null}
            {id === "slack" && slackOn ? (
              <span
                className="hidden h-1.5 w-1.5 rounded-full bg-emerald-500 sm:block"
                aria-label="Configured"
              />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="email" className="mt-0">
        {email}
      </TabsContent>
      <TabsContent value="alerts" className="mt-0 space-y-6">
        {alerts}
      </TabsContent>
      <TabsContent value="slack" className="mt-0">
        {slack}
      </TabsContent>
    </Tabs>
  );
}
