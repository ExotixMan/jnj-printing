import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardPathForRole, normalizeRole } from "@/lib/auth-roles";
import type { AppRole, Profile } from "@/lib/types";

export async function getCurrentUserAndProfile() {
  const authClient = await createServerClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return { user: null, profile: null };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name, last_name, contact_number, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null };
}

export async function requireUser() {
  const result = await getCurrentUserAndProfile();

  if (!result.user) redirect("/login");
  if (!result.profile) redirect("/login");

  return { user: result.user, profile: result.profile };
}

export async function requireRole(allowed: AppRole[]) {
  const { user, profile } = await requireUser();

  const role = normalizeRole(profile.role);

  if (!allowed.includes(role)) redirect(getDashboardPathForRole(role));

  return { user, profile, role };
}

export async function requireGuest() {
  const authClient = await createServerClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (user) redirect("/#home");

  return null;
}