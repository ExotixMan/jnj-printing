import DashboardShell from "@/app/_components/dashboard/DashboardShell";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, first_name, last_name, contact_number, role, created_at")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <DashboardShell
      role="admin"
      active="users"
      title="Users and staff"
      subtitle="Manage employee access and review customer accounts from one clean admin page."
    >
      <AdminUsersClient users={users} />
    </DashboardShell>
  );
}
