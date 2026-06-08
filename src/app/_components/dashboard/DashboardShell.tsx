import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";
import type { AppRole } from "@/lib/types";

import ThemeToggleButton from "@/app/_components/dashboard/ThemeToggleButton";
import LogoutButton from "@/app/_components/dashboard/LogoutButton";

type NavItem = {
  key: string;
  label: string;
  href: string;
  helper: string;
  icon: ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const roleNav: Record<AppRole, NavSection[]> = {
  admin: [
    {
      label: "Main",
      items: [
        { key: "overview", label: "Overview", href: "/admin", helper: "Sales, orders, reports", icon: <DashboardIcon /> },
        { key: "orders", label: "Orders", href: "/admin/orders", helper: "Every customer order", icon: <OrdersIcon /> },
        { key: "users", label: "Users", href: "/admin/users", helper: "Accounts and staff", icon: <UsersIcon /> },
        { key: "catalog", label: "Catalog", href: "/admin/catalog", helper: "Products and prices", icon: <CatalogIcon /> },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "staff", label: "Staff queue", href: "/staff", helper: "Orders and payments", icon: <QueueIcon /> },
      ],
    },
  ],
  staff: [
    {
      label: "Operations",
      items: [
        { key: "workspace", label: "Work queue", href: "/staff", helper: "Approve, reject, update", icon: <QueueIcon /> },
      ],
    },
  ],
  customer: [
    {
      label: "Orders",
      items: [
        { key: "orders", label: "My orders", href: "/customer/orders", helper: "Track your orders", icon: <OrdersIcon /> },
        { key: "custom-order", label: "New custom order", href: "/custom-order", helper: "Send a new design", icon: <PlusIcon /> },
      ],
    },
  ],
};

const roleLabel: Record<AppRole, string> = {
  admin: "Admin panel",
  staff: "Staff panel",
  customer: "Customer panel",
};

const roleInitials: Record<AppRole, string> = {
  admin: "JA",
  staff: "ST",
  customer: "CU",
};

const roleName: Record<AppRole, string> = {
  admin: "Admin User",
  staff: "Staff User",
  customer: "Customer",
};

const roleAccent: Record<AppRole, string> = {
  admin: "text-[#854F0B]",
  staff: "text-[#3C3489]",
  customer: "text-[#0F6E56]",
};

export default function DashboardShell({
  role,
  active,
  title,
  subtitle,
  children,
  actions,
}: {
  role: AppRole;
  active: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const sections = roleNav[role];
  const mobileNavItems = sections.flatMap((section) => section.items);

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--text)]">
      <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:block lg:h-screen">
          <div className="flex h-full flex-col">
            {/* Brand */}
            <div className="border-b border-[var(--border)] px-5 py-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]">
                  <Image
                    src="/Logo.png"
                    alt="JNJ Printing logo"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    priority
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight text-[var(--text)]">
                    {APP_NAME}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[var(--muted-2)]">
                    {roleLabel[role]}
                  </p>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {sections.map((section) => (
                <div key={section.label} className="pb-3">
                  <p className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
                    {section.label}
                  </p>

                  <nav className="grid gap-0.5">
                    {section.items.map((item) => {
                      const isActive = active === item.key;

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                            isActive
                              ? "bg-[#1a1a2e] text-white"
                              : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                          }`}
                        >
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center ${
                              isActive
                                ? "text-white"
                                : "text-[var(--muted-2)] group-hover:text-[var(--text)]"
                            }`}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate font-medium leading-tight">
                              {item.label}
                            </span>
                            <span
                              className={`mt-0.5 block truncate text-[11px] leading-tight ${
                                isActive ? "text-white/65" : "text-[var(--muted-2)]"
                              }`}
                            >
                              {item.helper}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Footer user pill */}
            <div className="border-t border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1a1a2e] text-[11px] font-semibold text-white">
                  {roleInitials[role]}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--text)]">
                    {roleName[role]}
                  </p>
                  <p className={`truncate text-[11px] ${roleAccent[role]}`}>
                    {roleLabel[role]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0">
          {/* Mobile Brand + Nav */}
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)] lg:hidden">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a2e]">
                    <Image
                      src="/Logo.png"
                      alt="JNJ Printing logo"
                      width={26}
                      height={26}
                      className="h-6 w-6 object-contain"
                      priority
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight text-[var(--text)]">
                      {APP_NAME}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--muted-2)]">
                      {roleLabel[role]}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  <ThemeToggleButton />

                  <Link
                    href="/"
                    className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                  >
                    Store
                  </Link>

                  <LogoutButton />
                </div>
              </div>

              <nav
                aria-label="Mobile navigation"
                className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {mobileNavItems.map((item) => {
                  const isActive = active === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? "border-[#1a1a2e] bg-[#1a1a2e] text-white"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span className="grid h-4 w-4 shrink-0 place-items-center">
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          {/* Page Header */}
          <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:px-7 lg:sticky lg:top-0 lg:z-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight text-[var(--text)] sm:truncate">
                  {title}
                </h1>

                {subtitle && (
                  <p className="mt-0.5 max-w-3xl text-xs leading-5 text-[var(--muted)] sm:truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                {actions}

                <div className="hidden items-center gap-2 lg:flex">
                  <ThemeToggleButton />

                  <Link
                    href="/"
                    className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                  >
                    Storefront
                  </Link>

                  <LogoutButton />
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="px-4 py-5 md:px-7">{children}</div>
        </section>
      </div>
    </main>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
