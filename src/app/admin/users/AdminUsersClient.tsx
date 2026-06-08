"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createManagedUser, updateUserRole } from "@/app/actions/admin";
import type { AppRole, Profile } from "@/lib/types";

type RoleFilter = "all" | AppRole;
type AccountGroup = "all" | "employee" | "customer";
type SortMode = "newest" | "oldest" | "name";

type Props = {
  users: Profile[];
};

export default function AdminUsersClient({ users }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [groupFilter, setGroupFilter] = useState<AccountGroup>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [createError, setCreateError] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const counts = useMemo(() => countRoles(users), [users]);
  const managedAccounts = counts.admin + counts.staff;

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return users
      .filter((user) => {
        const name = displayName(user).toLowerCase();
        const contact = (user.contact_number ?? "").toLowerCase();
        const role = user.role.toLowerCase();

        const matchesSearch =
          !search ||
          name.includes(search) ||
          contact.includes(search) ||
          role.includes(search);

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesGroup =
          groupFilter === "all" ||
          (groupFilter === "employee" && (user.role === "admin" || user.role === "staff")) ||
          (groupFilter === "customer" && user.role === "customer");

        return matchesSearch && matchesRole && matchesGroup;
      })
      .sort((a, b) => {
        if (sortMode === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortMode === "name") {
          return displayName(a).localeCompare(displayName(b));
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [users, query, roleFilter, groupFilter, sortMode]);

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setGroupFilter("all");
    setSortMode("newest");
  }

  function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    setCreateError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = getFormString(formData, "firstName");
    const lastName = getFormString(formData, "lastName");
    const contactNumber = getFormString(formData, "contactNumber");
    const email = getFormString(formData, "email");
    const password = getFormString(formData, "password");
    const role = getFormString(formData, "role") as AppRole;

    if (!firstName || !lastName || !contactNumber || !email || !password || !role) {
      event.preventDefault();
      setCreateError("Please complete all required fields before creating the account.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      event.preventDefault();
      setCreateError("Enter a valid email address.");
      return;
    }

    if (!/^09\d{9}$/.test(contactNumber)) {
      event.preventDefault();
      setCreateError("Use a valid Philippine mobile number, for example 09171234567.");
      return;
    }

    if (password.length < 8) {
      event.preventDefault();
      setCreateError("Temporary password must be at least 8 characters.");
      return;
    }

    if (role === "admin") {
      const confirmed = window.confirm(
        "Create a new Admin account? Admins can manage users, prices, catalog, and reports.",
      );
      if (!confirmed) event.preventDefault();
    }
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total accounts" value={users.length} helper="All registered profiles" dotClass="bg-[#1a1a2e]" />
        <MetricCard label="Customers" value={counts.customer} helper="Created from storefront" dotClass="bg-emerald-600" />
        <MetricCard label="Staff" value={counts.staff} helper="Operations access" dotClass="bg-violet-600" />
        <MetricCard
          label="Admins"
          value={counts.admin}
          helper="Full management access"
          dotClass="bg-amber-500"
          warning={counts.admin > 1}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <details className="group rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-0 xl:open" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 xl:cursor-default">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">Create account</p>
                <h2 className="mt-1 text-base font-semibold text-[var(--text)]">Add staff or admin</h2>
              </div>
              <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--muted)] xl:hidden">
                Toggle
              </span>
            </summary>

            <form action={createManagedUser} onSubmit={handleCreateSubmit} className="border-t border-[var(--border)] px-5 pb-5 pt-4 xl:border-t-0 xl:pt-0">
              <p className="mb-4 text-xs leading-5 text-[var(--muted)]">
                Employee accounts only. Customers should register from the public website.
              </p>

              {createError && (
                <div role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                  {createError}
                </div>
              )}

              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <FormInput name="firstName" label="First name" placeholder="Juan" autoComplete="given-name" />
                  <FormInput name="lastName" label="Last name" placeholder="Dela Cruz" autoComplete="family-name" />
                </div>

                <FormInput name="contactNumber" label="Contact number" placeholder="09171234567" autoComplete="tel" inputMode="tel" />
                <FormInput name="email" label="Email address" type="email" placeholder="juan@example.com" autoComplete="email" />
                <FormInput
                  name="password"
                  label="Temporary password"
                  type="password"
                  placeholder="Min. 8 characters"
                  helper="Tell the user to change it after first login."
                  autoComplete="new-password"
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text)]">Account type</span>
                  <select
                    name="role"
                    className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
                    defaultValue="staff"
                    required
                  >
                    <option value="staff">Staff — orders and payments</option>
                    <option value="admin">Admin — full access</option>
                  </select>
                </label>

                <button className="mt-1 inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d2d4e]">
                  Create account
                </button>
              </div>
            </form>
          </details>

          <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">Access guide</p>
            <div className="mt-3 space-y-2">
              <GuideItem label="Customer" helper="Can place and track their own orders." />
              <GuideItem label="Staff" helper="Can process orders and payment updates." />
              <GuideItem label="Admin" helper="Can manage users, catalog, reports, and pricing." />
            </div>
            <div className="mt-4 rounded-md bg-[var(--surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
              {managedAccounts} managed employee account{managedAccounts !== 1 ? "s" : ""} currently have staff/admin access.
            </div>
          </section>
        </div>

        <section className="min-w-0 rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">Accounts</p>
                <h2 className="mt-1 text-base font-semibold text-[var(--text)]">Account list</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {filteredUsers.length} of {users.length} account{users.length !== 1 ? "s" : ""} shown.
                </p>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                <label className="relative block min-w-0 flex-1 sm:min-w-[220px]">
                    <span className="sr-only">Search accounts</span>
                    <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name, contact, role..."
                    className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
                    />
                </label>

                <div className="min-w-0 sm:w-[150px]">
                    <FilterSelect label="Role" value={roleFilter} onChange={(value) => setRoleFilter(value as RoleFilter)}>
                    <option value="all">All roles</option>
                    <option value="customer">Customers</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admins</option>
                    </FilterSelect>
                </div>

                <div className="min-w-0 sm:w-[160px]">
                    <FilterSelect label="Group" value={groupFilter} onChange={(value) => setGroupFilter(value as AccountGroup)}>
                    <option value="all">All accounts</option>
                    <option value="employee">Employees only</option>
                    <option value="customer">Customers only</option>
                    </FilterSelect>
                </div>

                <div className="min-w-0 sm:w-[150px]">
                    <FilterSelect label="Sort" value={sortMode} onChange={(value) => setSortMode(value as SortMode)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name A-Z</option>
                    </FilterSelect>
                </div>
            </div>
           </div>

          {filteredUsers.length ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-soft)]">
                      <Th>Account</Th>
                      <Th>Contact</Th>
                      <Th>Current role</Th>
                      <Th>Joined</Th>
                      <Th align="right">Change access</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-soft)]">
                        <td className="px-4 py-3">
                          <UserIdentity user={user} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-[var(--muted)]">
                          {user.contact_number || "No contact number"}
                        </td>
                        <td className="px-4 py-3">
                          <RolePill role={user.role} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-[var(--muted)]">
                          {formatJoinedDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2d2d4e]"
                          >
                            Change role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-2 p-3 lg:hidden">
                {filteredUsers.map((user) => (
                  <article key={user.id} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <UserIdentity user={user} />
                      <RolePill role={user.role} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-[var(--surface-soft)] p-3 text-xs">
                      <div>
                        <p className="font-semibold text-[var(--muted-2)]">Contact</p>
                        <p className="mt-1 break-words tabular-nums text-[var(--text)]">{user.contact_number || "No contact"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--muted-2)]">Joined</p>
                        <p className="mt-1 tabular-nums text-[var(--text)]">{formatJoinedDate(user.created_at)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[#1a1a2e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2d2d4e]"
                    >
                      Change access
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <EmptyState resetFilters={resetFilters} />
          )}
        </section>
      </section>

      {selectedUser ? (
        <RoleModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
    </>
  );
}

function RoleModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [role, setRole] = useState<AppRole>(() => user.role);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const activeUser = user;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setError("");

    if (!role) {
      event.preventDefault();
      setError("Please choose a role before saving.");
      return;
    }

    if (role === activeUser.role) {
      event.preventDefault();
      setError("Choose a different role before saving.");
      return;
    }

    const confirmed = window.confirm(
      `Change ${displayName(activeUser)} from ${activeUser.role} to ${role}? This changes what they can access.`,
    );

    if (!confirmed) event.preventDefault();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-4" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <button type="button" aria-label="Close role modal" className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative w-full rounded-t-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:max-w-md md:rounded-[18px] md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">Change access</p>
            <h2 id="role-modal-title" className="mt-1 text-lg font-semibold text-[var(--text)]">
              {displayName(activeUser)}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Current role: <span className="font-semibold capitalize text-[var(--text)]">{activeUser.role}</span>
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)]"
          >
            Close
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {error}
          </div>
        )}

        <form action={updateUserRole} onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={activeUser.id} />

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--text)]">New role</span>
            <select
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
              required
            >
              <option value="customer">Customer — place and track own orders</option>
              <option value="staff">Staff — process orders and payments</option>
              <option value="admin">Admin — full management access</option>
            </select>
          </label>

          <div className="rounded-md bg-[var(--surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            Admin access should only be given to trusted managers. Staff access is enough for daily order and payment work.
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]">
              Cancel
            </button>
            <button className="min-h-11 rounded-md bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d2d4e]">
              Save role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function countRoles(users: Profile[]): Record<AppRole, number> {
  return users.reduce<Record<AppRole, number>>(
    (acc, user) => {
      acc[user.role] = (acc[user.role] ?? 0) + 1;
      return acc;
    },
    { admin: 0, staff: 0, customer: 0 },
  );
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function displayName(user: Pick<Profile, "first_name" | "last_name"> | null | undefined) {
  if (!user) return "Unnamed user";
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || "Unnamed user";
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  return initials || "U";
}

function formatJoinedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function MetricCard({
  label,
  value,
  helper,
  dotClass,
  warning = false,
}: {
  label: string;
  value: number;
  helper: string;
  dotClass: string;
  warning?: boolean;
}) {
  return (
    <article className={`rounded-[16px] border p-4 ${warning ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-[var(--border)] bg-[var(--surface)]"}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none text-[var(--text)] tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{helper}</p>
    </article>
  );
}

function GuideItem({ label, helper }: { label: string; helper: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] px-3 py-2">
      <p className="text-xs font-semibold text-[var(--text)]">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{helper}</p>
    </div>
  );
}

function FormInput({
  label,
  name,
  type = "text",
  placeholder = "",
  helper,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  helper?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text)]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
      />
      {helper && <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{helper}</span>}
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block w-full min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
      >
        {children}
      </select>
    </label>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted-2)] ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

const avatarStyles: Record<AppRole, string> = {
  admin: "bg-amber-100 text-amber-800",
  staff: "bg-violet-100 text-violet-800",
  customer: "bg-emerald-100 text-emerald-800",
};

function UserAvatar({ firstName, lastName, role }: { firstName: string | null | undefined; lastName: string | null | undefined; role: AppRole }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarStyles[role]}`} aria-hidden="true">
      {getInitials(firstName, lastName)}
    </span>
  );
}

function UserIdentity({ user }: { user: Profile }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar firstName={user.first_name} lastName={user.last_name} role={user.role} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--text)]">{displayName(user)}</p>
        <p className="text-xs capitalize text-[var(--muted)]">{user.role} account</p>
      </div>
    </div>
  );
}

const rolePillStyles: Record<AppRole, string> = {
  admin: "border-amber-200 bg-amber-50 text-amber-800",
  staff: "border-violet-200 bg-violet-50 text-violet-800",
  customer: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function RolePill({ role }: { role: AppRole }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${rolePillStyles[role]}`}>{role}</span>;
}

function EmptyState({ resetFilters }: { resetFilters: () => void }) {
  return (
    <div className="px-4 py-14 text-center">
      <div className="mx-auto max-w-sm">
        <p className="text-sm font-semibold text-[var(--text)]">No accounts match your filters</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Try a different search term or reset the filters to see all accounts.</p>
        <button type="button" onClick={resetFilters} className="mt-4 rounded-md bg-[#1a1a2e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2d2d4e]">
          Reset filters
        </button>
      </div>
    </div>
  );
}
