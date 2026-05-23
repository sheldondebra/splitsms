import { createContactAction } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function ContactsAddForm() {
  return (
    <form
      action={createContactAction}
      className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-5 max-w-lg"
    >
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">New contact</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" placeholder="Jane Doe" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            name="phone"
            placeholder="233201234567"
            required
            className="h-11 font-mono"
          />
          <p className="text-xs text-muted-foreground">International format without +</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email (optional)</Label>
          <Input id="contact-email" name="email" type="email" placeholder="jane@example.com" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-tags">Tags (optional)</Label>
          <Input id="contact-tags" name="tags" placeholder="vip, newsletter" className="h-11" />
        </div>
      </div>

      <Button type="submit" className="h-11 w-full sm:w-auto rounded-xl font-semibold">
        Save contact
      </Button>
    </form>
  );
}
