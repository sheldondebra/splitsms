"use client";

import { useState, useMemo } from "react";
import { createCampaignAction } from "@/lib/actions/campaigns";
import { CampaignMessagePreview } from "@/components/campaigns/message-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Group = { id: string; name: string; _count?: { members: number } };
type Template = { id: string; name: string; content: string };

export function CampaignForm({
  groups,
  templates,
  defaultSenderId = "SplitSMS",
  initialMessage = "",
}: {
  groups: Group[];
  templates: Template[];
  defaultSenderId?: string;
  initialMessage?: string;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [contactGroupId, setContactGroupId] = useState("");
  const [recipients, setRecipients] = useState("");

  const recipientCount = useMemo(() => {
    if (contactGroupId) {
      const g = groups.find((x) => x.id === contactGroupId);
      return g?._count?.members ?? 0;
    }
    return recipients
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [contactGroupId, recipients, groups]);

  return (
    <form action={createCampaignAction} className="space-y-4">
      <div>
        <Label>Campaign name</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Sender ID</Label>
        <Input name="senderId" defaultValue={defaultSenderId} required />
      </div>
      <div>
        <Label>Country code</Label>
        <Input name="countryCode" defaultValue="GH" />
      </div>
      <div>
        <Label>Timezone</Label>
        <Input name="timezone" defaultValue="UTC" placeholder="Africa/Accra" />
      </div>
      {templates.length > 0 && (
        <div>
          <Label>Load template</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value);
              if (t) setMessage(t.content);
            }}
            defaultValue=""
          >
            <option value="">— Select —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label>Message</Label>
        <Textarea
          name="message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <CampaignMessagePreview message={message} recipientCount={recipientCount} />
      <div>
        <Label>Contact group (optional)</Label>
        <select
          name="contactGroupId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={contactGroupId}
          onChange={(e) => setContactGroupId(e.target.value)}
        >
          <option value="">— Paste numbers below —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g._count?.members ?? 0})
            </option>
          ))}
        </select>
      </div>
      {!contactGroupId && (
        <div>
          <Label>Recipients</Label>
          <Textarea
            name="recipients"
            rows={4}
            placeholder="+233..."
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />
        </div>
      )}
      <div>
        <Label>Schedule (optional)</Label>
        <Input name="scheduledAt" type="datetime-local" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Recurrence</Label>
          <select
            name="recurrence"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="NONE"
          >
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="CUSTOM_DAYS">Custom interval (days)</option>
          </select>
        </div>
        <div>
          <Label>Custom days (if custom)</Label>
          <Input name="recurrenceDays" type="number" min={1} placeholder="7" />
        </div>
      </div>
      <div>
        <Label>Recurrence ends (optional)</Label>
        <Input name="recurrenceEndAt" type="datetime-local" />
      </div>
      <Button type="submit">Create campaign</Button>
    </form>
  );
}
