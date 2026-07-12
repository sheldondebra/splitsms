"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  createStaffUserJsonAction,
  demoteStaffUserJsonAction,
  resetStaffPasswordJsonAction,
  updateStaffUserJsonAction,
} from "@/lib/actions/admin-staff";
import type { AdminStaffDashboard, SerializedStaffUser } from "@/lib/admin/staff-serialize";
import { staffPermissionSummary } from "@/lib/admin/staff-serialize";
import {
  ADMIN_PERMISSION_GROUPS,
  DEFAULT_ADMIN_PERMISSIONS,
  resolveStaffPermissions,
  staffRoleLabel,
} from "@/lib/auth/admin-permissions";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Crown,
  KeyRound,
  Loader2,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

function PermissionPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const selected = useMemo(() => new Set(value), [value]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
      {ADMIN_PERMISSION_GROUPS.map((group) => (
        <div key={group.id} className="rounded-lg border border-border/60 bg-muted/10 p-3">
          <p className="text-xs font-semibold mb-2">{group.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.permissions.map((perm) => (
              <label
                key={perm.id}
                className={cn(
                  "flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30",
                  selected.has(perm.id) && "border-primary/30 bg-primary/[0.04]",
                  disabled && "opacity-60 cursor-not-allowed",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(perm.id)}
                  disabled={disabled}
                  onChange={() => toggle(perm.id)}
                  className="mt-0.5 rounded border-border"
                />
                <span>
                  <span className="font-medium block">{perm.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{perm.id}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffFormDialog({
  mode,
  user,
  canAssignSuperAdmin,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  user?: SerializedStaffUser;
  canAssignSuperAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">(
    user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
  );
  const [permissions, setPermissions] = useState<string[]>(
    user ? resolveStaffPermissions(user) : [...DEFAULT_ADMIN_PERMISSIONS],
  );

  function resetForm() {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN");
    setPermissions(user ? resolveStaffPermissions(user) : [...DEFAULT_ADMIN_PERMISSIONS]);
  }

  function submit() {
    startTransition(async () => {
      const toastId = toast.loading(mode === "create" ? "Creating staff user…" : "Saving changes…");
      try {
        const result =
          mode === "create"
            ? await createStaffUserJsonAction({
                fullName,
                phone,
                email,
                password,
                role,
                permissions: role === "SUPER_ADMIN" ? [] : permissions,
              })
            : await updateStaffUserJsonAction({
                userId: user!.id,
                fullName,
                email,
                role,
                permissions: role === "SUPER_ADMIN" ? [] : permissions,
              });

        if (!result.ok) {
          toast.error("Could not save", { id: toastId, description: result.message });
          return;
        }

        toast.success(mode === "create" ? "Staff user created" : "Staff updated", {
          id: toastId,
          description: result.message,
        });
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("Could not save", { id: toastId, description: "Something went wrong." });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 overflow-y-auto">
          <DialogHeader className="text-left gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
              {mode === "create" ? <UserPlus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </div>
            <DialogTitle>{mode === "create" ? "Add staff user" : "Edit staff user"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create an admin account with a role and granular permissions."
                : "Update profile, role, and permission scopes."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="staff-name">Full name</Label>
              <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={pending || mode === "edit"}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </div>
            {mode === "create" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="staff-password">Temporary password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="staff-role">Role</Label>
              <select
                id="staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "SUPER_ADMIN")}
                disabled={pending || (!canAssignSuperAdmin && role !== "ADMIN")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                {canAssignSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
          </div>

          {role === "ADMIN" && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Permissions
              </p>
              <PermissionPicker value={permissions} onChange={setPermissions} disabled={pending} />
            </div>
          )}

          {role === "SUPER_ADMIN" && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              Super Admins have full access to all admin areas and permission settings.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  user: SerializedStaffUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const toastId = toast.loading("Resetting password…");
      const result = await resetStaffPasswordJsonAction({ userId: user.id, password });
      if (!result.ok) {
        toast.error("Could not reset", { id: toastId, description: result.message });
        return;
      }
      toast.success("Password reset", { id: toastId, description: result.message });
      onOpenChange(false);
      setPassword("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {user.fullName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || password.length < 8} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffRow({
  user,
  currentUserId,
  canManage,
  canAssignSuperAdmin,
}: {
  user: SerializedStaffUser;
  currentUserId: string;
  canManage: boolean;
  canAssignSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  return (
    <>
      <li className="px-2 py-3 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/15 transition-colors">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{user.fullName}</p>
              <Badge
                variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}
                className="text-[9px] px-1.5 py-0 h-5 gap-1"
              >
                {user.role === "SUPER_ADMIN" ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                {staffRoleLabel(user.role)}
              </Badge>
              {isSelf && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">
                  You
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
              <span className="font-mono">{user.phone}</span>
              {user.email && (
                <>
                  <span>·</span>
                  <span>{user.email}</span>
                </>
              )}
              <span>·</span>
              <span>{staffPermissionSummary(user)}</span>
              <span>·</span>
              <span>
                {user.lastLoginAt
                  ? `Active ${formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}`
                  : "No recent session"}
              </span>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setResetOpen(true)}>
                <KeyRound className="h-3.5 w-3.5" />
                Reset password
              </Button>
              {!isSelf && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                  disabled={pending || (user.role === "SUPER_ADMIN" && !canAssignSuperAdmin)}
                  onClick={() => {
                    startTransition(async () => {
                      const toastId = toast.loading("Removing staff access…");
                      const result = await demoteStaffUserJsonAction({ userId: user.id });
                      if (!result.ok) {
                        toast.error("Could not remove", { id: toastId, description: result.message });
                        return;
                      }
                      toast.success("Staff removed", { id: toastId, description: result.message });
                      router.refresh();
                    });
                  }}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove access
                </Button>
              )}
            </div>
          )}
        </div>
      </li>

      <StaffFormDialog
        mode="edit"
        user={user}
        canAssignSuperAdmin={canAssignSuperAdmin}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ResetPasswordDialog user={user} open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}

export function AdminStaffView({
  dashboard,
  currentUserId,
  canManage,
  canAssignSuperAdmin,
}: {
  dashboard: AdminStaffDashboard;
  currentUserId: string;
  canManage: boolean;
  canAssignSuperAdmin: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AdminPage wide className="space-y-4 md:space-y-5">
      <AdminPageHeader
        title="Staff users"
        description="Manage admin accounts, roles, and permission scopes for your team."
        icon={Users}
        actions={
          canManage ? (
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Add staff user
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total staff", value: dashboard.stats.totalStaff, icon: Users },
          { label: "Super Admins", value: dashboard.stats.superAdmins, icon: Crown },
          { label: "Admins", value: dashboard.stats.admins, icon: Shield },
          { label: "Custom scopes", value: dashboard.stats.withCustomPermissions, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="users" className="gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/25 p-1">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="users" className="h-9 rounded-lg px-3.5 text-xs sm:text-sm">
              Staff users
            </TabsTrigger>
            <TabsTrigger value="permissions" className="h-9 rounded-lg px-3.5 text-xs sm:text-sm">
              Roles & permissions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-0">
          <AdminCard title="Admin team" description="Platform staff with access to /admin" dense>
            {dashboard.staff.length === 0 ? (
              <AdminEmpty dense>No staff users yet.</AdminEmpty>
            ) : (
              <ul className="divide-y divide-border/50 -mx-2">
                {dashboard.staff.map((user) => (
                  <StaffRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    canManage={canManage}
                    canAssignSuperAdmin={canAssignSuperAdmin}
                  />
                ))}
              </ul>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="permissions" className="mt-0 space-y-4">
          <AdminCard title="Role overview" description="How access is structured on SplitSMS" dense>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Crown className="h-3.5 w-3.5" />
                  Super Admin
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Full access to every admin area, including creating other Super Admins and changing
                  sensitive platform settings.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-xs">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Admin
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Scoped access based on selected permissions below. Defaults cover day-to-day ops without
                  staff or gateway settings access.
                </p>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Permission catalog" description="Granular scopes you can assign to Admin users" dense>
            <div className="space-y-3">
              {ADMIN_PERMISSION_GROUPS.map((group) => (
                <div key={group.id} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                  <p className="text-xs font-semibold mb-2">{group.label}</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2 text-xs">
                    {group.permissions.map((perm) => (
                      <li key={perm.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 bg-background/60">
                        <span>{perm.label}</span>
                        <code className="text-[10px] text-muted-foreground">{perm.id}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AdminCard>
        </TabsContent>
      </Tabs>

      <StaffFormDialog
        mode="create"
        canAssignSuperAdmin={canAssignSuperAdmin}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </AdminPage>
  );
}
