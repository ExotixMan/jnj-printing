import type { AppRole } from "@/lib/types";

export type UserRole = AppRole;

export function normalizeRole(role: unknown): AppRole {
  const value = String(role ?? "customer").toLowerCase();
  if (value === "admin" || value === "staff" || value === "customer") return value;
  return "customer";
}

export function getDashboardPathForRole(role: unknown) {
  switch (normalizeRole(role)) {
    case "admin": return "/admin";
    case "staff": return "/staff";
    default: return "/customer/orders";
  }
}

export function canAccessPath(role: unknown, pathname: string) {
  const userRole = normalizeRole(role);
  if (pathname.startsWith("/admin")) return userRole === "admin";
  if (pathname.startsWith("/staff")) return userRole === "admin" || userRole === "staff";
  if (pathname.startsWith("/customer") || pathname.startsWith("/custom-order")) {
    return userRole === "admin" || userRole === "customer";
  }
  return true;
}
