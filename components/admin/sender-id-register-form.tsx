import { adminCreateSenderIdAction } from "@/lib/actions/admin-sender-ids";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberOption = { id: string; label: string };

export function SenderIdRegisterForm({
  members,
  defaultUserId,
  returnTo,
}: {
  members: MemberOption[];
  defaultUserId?: string;
  returnTo: string;
}) {
  return (
    <form action={adminCreateSenderIdAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="space-y-2">
        <Label htmlFor="userId">Member</Label>
        <select
          id="userId"
          name="userId"
          required
          defaultValue={defaultUserId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="" disabled>
            Select member…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Sender ID</Label>
        <Input
          id="value"
          name="value"
          placeholder="MYBRAND"
          maxLength={11}
          required
          className="font-mono uppercase"
        />
        <p className="text-xs text-muted-foreground">
          Up to 11 characters, letters and numbers, at least one letter.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="countryCode">Country</Label>
          <Input
            id="countryCode"
            name="countryCode"
            defaultValue={DEFAULT_COUNTRY_CODE}
            maxLength={2}
            className="uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose (optional)</Label>
          <Input id="purpose" name="purpose" placeholder="Marketing / OTP" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" name="setDefault" className="h-4 w-4 rounded accent-primary" />
        Set as member default when approved
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          name="submitToProviders"
          defaultChecked
          className="h-4 w-4 rounded accent-primary"
        />
        Submit to mNotify, Twilio, and Infobip
      </label>
      <Button type="submit">Register sender ID</Button>
    </form>
  );
}
