import Link from "next/link";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { StatusBadge } from "@/app/_components/dashboard/StatusBadge";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderListRow } from "@/lib/types";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "design_review", label: "Design Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "waiting_for_payment", label: "Waiting for Payment" },
  { value: "paid", label: "Paid" },
  { value: "printing", label: "Printing" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const VALID_STATUS_FILTER_VALUES = new Set(
  STATUS_FILTER_OPTIONS.map((option) => option.value)
);

type CustomerOrdersSearchParams = {
  page?: string;
  q?: string;
  status?: string;
};

type SummaryCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function createOrdersHref({
  page,
  q,
  status,
}: {
  page: number;
  q?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(Math.max(1, page)));

  if (q) {
    params.set("q", q);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  return `/customer/orders?${params.toString()}`;
}

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<CustomerOrdersSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page ?? 1) || 1);
  const searchTerm = (resolvedSearchParams?.q ?? "").trim();
  const requestedStatus = resolvedSearchParams?.status ?? "all";
  const selectedStatus = VALID_STATUS_FILTER_VALUES.has(requestedStatus)
    ? requestedStatus
    : "all";
  const hasActiveFilters = searchTerm.length > 0 || selectedStatus !== "all";

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { user } = await requireRole(["customer", "admin"]);
  const admin = createAdminClient();

  let ordersQuery = admin
    .from("orders")
    .select(
      "id, order_number, customer_id, quantity, status, estimated_price, final_price, created_at, garment_products(name, base_price), printing_services(name, price)",
      { count: "exact" }
    )
    .eq("customer_id", user.id);

  if (searchTerm) {
    ordersQuery = ordersQuery.ilike("order_number", `%${searchTerm}%`);
  }

  if (selectedStatus !== "all") {
    ordersQuery = ordersQuery.eq("status", selectedStatus);
  }

  const [
    { data, error, count: orderCount },
    { data: countData },
    { data: notifications },
  ] = await Promise.all([
    ordersQuery.order("created_at", { ascending: false }).range(from, to),

    admin.from("orders").select("id, status").eq("customer_id", user.id),

    admin
      .from("notifications")
      .select("id, title, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = (data ?? []) as OrderListRow[];
  const allOrdersForCounts = (countData ?? []) as Pick<OrderListRow, "id" | "status">[];

  const totalOrders = orderCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));

  const counts = {
    total: allOrdersForCounts.length,
    pending: allOrdersForCounts.filter((order) => order.status === "pending").length,
    progress: allOrdersForCounts.filter((order) =>
      [
        "approved",
        "waiting_for_payment",
        "paid",
        "printing",
        "ready_for_pickup",
        "out_for_delivery",
      ].includes(order.status)
    ).length,
    completed: allOrdersForCounts.filter((order) => order.status === "completed").length,
  };

  const latestNotifCount = notifications?.length ?? 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)] px-6 py-12 text-[var(--text)] md:px-8 xl:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Page header */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                My Orders
              </p>
              <h1 className="font-display text-[clamp(32px,4vw,52px)] leading-tight text-[var(--text)]">
                Your custom order history
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Track every JNJ Printing order from pending review to pickup, delivery, or completion.
              </p>
            </div>
            <Link
              href="/custom-order"
              className="rounded-full bg-[var(--purple2)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--purple)]"
            >
              + Create New Order
            </Link>
          </div>

          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Total Orders"
              value={counts.total}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="fill-amber-200/70"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
                    stroke="black"
                  />
                  <line x1="3" y1="6" x2="21" y2="6" stroke="black" />
                  <polyline points="9 14 11 16 15 12" stroke="black" />
                </svg>
              }
            />

            <SummaryCard
              label="Pending"
              value={counts.pending}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" stroke="#94a3b8" />
                  <polyline points="12 6 12 12 16 14" stroke="#f97316" />
                </svg>
              }
            />

            <SummaryCard
              label="In Progress"
              value={counts.progress}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                    stroke="#2563eb"
                  />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="#2563eb" />
                  <path d="M12 11h4" stroke="#2563eb" />
                  <path d="M12 16h4" stroke="#2563eb" />
                  <path d="M8 11h.01" stroke="#2563eb" />
                  <path d="M8 16h.01" stroke="#2563eb" />
                </svg>
              }
            />

            <SummaryCard
              label="Completed"
              value={counts.completed}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#16a34a" />
                  <polyline points="22 4 12 14.01 9 11.01" stroke="#16a34a" />
                </svg>
              }
            />
          </div>

          {/* Two-column layout: orders + notifications */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            {/* Orders panel */}
            <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--text)]">Orders</h2>
                  {hasActiveFilters && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Showing {totalOrders} {totalOrders === 1 ? "result" : "results"}
                      {searchTerm ? ` for “${searchTerm}”` : ""}
                    </p>
                  )}
                </div>

                {(orders.length > 0 || hasActiveFilters) && (
                  <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    {totalOrders} {totalOrders === 1 ? "order" : "orders"}
                  </span>
                )}
              </div>

              <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]/40 px-6 py-4">
                <form action="/customer/orders" className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
                  <label className="relative block">
                    <span className="sr-only">Search orders</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="search"
                      name="q"
                      defaultValue={searchTerm}
                      placeholder="Search by order number"
                      className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm font-medium text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
                    />
                  </label>

                  <label>
                    <span className="sr-only">Filter by status</span>
                    <select
                      name="status"
                      defaultValue={selectedStatus}
                      className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--purple2)] focus:ring-2 focus:ring-[var(--purple-soft)]"
                    >
                      {STATUS_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="h-11 rounded-full bg-[var(--purple2)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--purple)]"
                  >
                    Apply
                  </button>

                  {hasActiveFilters && (
                    <Link
                      href="/customer/orders"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-semibold transition hover:bg-[var(--surface)]"
                    >
                      Clear
                    </Link>
                  )}
                </form>
              </div>

              {error ? (
                <div className="p-6 text-sm text-red-500">Failed to load orders: {error.message}</div>
              ) : orders.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-[var(--muted)]">
                    {hasActiveFilters ? "No orders match your search or filters." : "No orders yet."}
                  </p>

                  {hasActiveFilters ? (
                    <Link
                      href="/customer/orders"
                      className="mt-4 inline-flex rounded-full bg-[var(--purple2)] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Clear filters
                    </Link>
                  ) : (
                    <Link
                      href="/custom-order"
                      className="mt-4 inline-flex rounded-full bg-[var(--purple2)] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Start Order
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-[var(--border)]">
                    {orders.map((order) => {
                      const product = one(order.garment_products);
                      const service = one(order.printing_services);

                      return (
                        <li key={order.id}>
                          <Link
                            href={`/customer/orders/${order.order_number}`}
                            className="group flex items-center gap-4 px-6 py-4 transition hover:bg-[var(--surface-soft)]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--purple)]">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[var(--text)]">
                                {order.order_number}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                {formatDate(order.created_at)}
                                {product?.name ? ` · ${product.name}` : ""}
                                {service?.name ? ` · ${service.name}` : ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span className="hidden text-xs font-semibold text-[var(--muted)] sm:block">
                                {formatCurrency(order.final_price ?? order.estimated_price)}
                              </span>

                              <StatusBadge status={order.status} />

                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[var(--muted)] transition group-hover:text-[var(--purple)]"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
                      <Link
                        href={createOrdersHref({
                          page: Math.max(1, currentPage - 1),
                          q: searchTerm,
                          status: selectedStatus,
                        })}
                        className={`rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-[var(--surface-soft)]"
                        }`}
                      >
                        Previous
                      </Link>

                      <span className="text-sm font-semibold text-[var(--muted)]">
                        Page {currentPage} of {totalPages}
                      </span>

                      <Link
                        href={createOrdersHref({
                          page: Math.min(totalPages, currentPage + 1),
                          q: searchTerm,
                          status: selectedStatus,
                        })}
                        className={`rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold ${
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "hover:bg-[var(--surface-soft)]"
                        }`}
                      >
                        Next
                      </Link>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Notifications panel */}
            <section className="overflow-hidden self-start rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--text)]">
                    Notifications
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Latest order updates</p>
                </div>

                {latestNotifCount > 0 && (
                  <span className="rounded-full bg-[var(--purple2)] px-2.5 py-0.5 text-xs font-bold text-white">
                    {latestNotifCount} updates
                  </span>
                )}
              </div>

              {!notifications || notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--purple)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-[var(--text)]">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Order updates will appear here when staff reviews or updates your order.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-[var(--border)]">
                    {notifications.map((note) => (
                      <li key={note.id} className="px-5 py-4 transition hover:bg-[var(--surface-soft)]">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--purple-soft)] text-[var(--purple2)]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-bold leading-snug text-[var(--text)]">
                                {note.title}
                              </p>

                              <span className="shrink-0 text-[10px] font-medium text-[var(--muted)]">
                                {formatDate(note.created_at)}
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                              {note.message}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-[var(--border)] px-5 py-4">
                    <Link
                      href="/customer/notifications"
                      className="inline-flex items-center gap-1 text-sm font-bold text-[var(--purple)] transition hover:text-[var(--purple2)]"
                    >
                      View all notifications
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div
      className={[
        "relative rounded-[20px] border p-5 transition border-[var(--border)] bg-[var(--surface)]",
      ].join(" ")}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {icon}
        <p className={["mt-2 font-display text-4xl font-bold"].join(" ")}>{value}</p>
      </div>
    </div>
  );
}
