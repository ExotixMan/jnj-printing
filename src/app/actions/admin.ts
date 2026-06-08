"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/types";

export async function createManagedUser(formData: FormData) {
  await requireRole(["admin"]);
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "customer") as AppRole;

  if (!firstName || !lastName || !email || password.length < 8) throw new Error("Complete all required user fields.");
  if (!["admin", "staff", "customer"].includes(role)) throw new Error("Invalid role.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, contact_number: contactNumber, role },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Failed to create user.");

  const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, first_name: firstName, last_name: lastName, contact_number: contactNumber, role });
  if (profileError) throw new Error(profileError.message);

  if (role === "staff") await admin.from("staff").insert({ user_id: data.user.id });
  if (role === "customer") await admin.from("customers").insert({ user_id: data.user.id });

  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "customer") as AppRole;
  if (!id || !["admin", "staff", "customer"].includes(role)) throw new Error("Invalid role update.");

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  if (role === "staff") await admin.from("staff").upsert({ user_id: id });
  if (role === "customer") await admin.from("customers").upsert({ user_id: id });
  revalidatePath("/admin/users");
}

export async function saveProduct(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const basePrice = Number(formData.get("basePrice") ?? 0);
  const hasSizes = formData.get("hasSizes") === "on";
  const active = formData.get("active") !== "off";
  if (!name || basePrice < 0) throw new Error("Invalid product.");
  const admin = createAdminClient();
  const payload = { name, base_price: basePrice, has_sizes: hasSizes, active };
  const query = id ? admin.from("garment_products").update(payload).eq("id", id) : admin.from("garment_products").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function saveService(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const active = formData.get("active") !== "off";
  if (!name || !description || !tag || price < 0) throw new Error("Invalid printing service.");
  const admin = createAdminClient();
  const payload = { name, description, tag, price, active };
  const query = id ? admin.from("printing_services").update(payload).eq("id", id) : admin.from("printing_services").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function saveColor(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hex = String(formData.get("hex") ?? "").trim() || null;
  const active = formData.get("active") !== "off";
  if (!name) throw new Error("Color name is required.");
  const admin = createAdminClient();
  const payload = { name, hex, active };
  const query = id ? admin.from("colors").update(payload).eq("id", id) : admin.from("colors").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function saveSize(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const active = formData.get("active") !== "off";
  if (!name) throw new Error("Size name is required.");
  const admin = createAdminClient();
  const payload = { name, sort_order: sortOrder, active };
  const query = id ? admin.from("sizes").update(payload).eq("id", id) : admin.from("sizes").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function deactivateCatalogItem(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const tableMap: Record<string, string> = {
    product: "garment_products",
    service: "printing_services",
    size: "sizes",
    color: "colors",
  };
  const table = tableMap[kind];
  if (!id || !table) throw new Error("Invalid catalog item.");
  const admin = createAdminClient();
  const { error } = await admin.from(table).update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}
