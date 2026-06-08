"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerId: string;
  quantity: number;
  status: OrderStatus;
  estimatedPrice: number;
  finalPrice: number | null;
  total: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    contactNumber: string | null;
  } | null;
  product: {
    name: string;
    basePrice: number;
  } | null;
  service: {
    name: string;
    price: number;
  } | null;
};

export type AdminOrderMetrics = {
  total: number;
  needsReview: number;
  awaitingPayment: number;
  production: number;
  completed: number;
  cancelled: number;
  active: number;
  revenue: number;
};

type GroupFilter = "all" | "review" | "active" | "completed" | "cancelled";
type DocumentFilter = "all" | "with_customer" | "missing_customer";

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function AdminOrdersClient({
  orders,
  metrics,
}: {
  orders: AdminOrderRow[];
  metrics: AdminOrderMetrics;
}) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [customerFilter, setCustomerFilter] = useState<DocumentFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : "";
      const searchable = [
        order.orderNumber,
        customerName,
        order.customer?.contactNumber ?? "",
        order.product?.name ?? "",
        order.service?.name ?? "",
        ORDER_STATUS_LABELS[order.status] ?? order.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = query.length === 0 || searchable.includes(query);
      const matchesStatus = status === "all" || order.status === status;
      const matchesCustomer =
        customerFilter === "all" ||
        (customerFilter === "with_customer" && Boolean(order.customer)) ||
        (customerFilter === "missing_customer" && !order.customer);

      const matchesGroup =
        group === "all" ||
        (group === "review" && ["pending", "design_review", "waiting_for_payment"].includes(order.status)) ||
        (group === "active" && !["completed", "cancelled"].includes(order.status)) ||
        (group === "completed" && order.status === "completed") ||
        (group === "cancelled" && order.status === "cancelled");

      return matchesSearch && matchesStatus && matchesCustomer && matchesGroup;
    });
  }, [orders, search, group, status, customerFilter]);

  const resetFilters = () => {
    setSearch("");
    setGroup("all");
    setStatus("all");
    setCustomerFilter("all");
  };

  const hasFilters =
    search.trim().length > 0 || group !== "all" || status !== "all" || customerFilter !== "all";

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="All orders" value={metrics.total} helper="Total customer requests" dot="bg-[var(--text)]" />
        <MetricCard
          label="Needs review"
          value={metrics.needsReview}
          helper="Pending, design review, payment"
          dot="bg-amber-500"
          tone={metrics.needsReview > 0 ? "warning" : "default"}
        />
        <MetricCard label="Active work" value={metrics.active} helper="Not completed or cancelled" dot="bg-indigo-500" />
        <MetricCard
          label="Completed sales"
          value={formatCurrency(metrics.revenue)}
          helper={`${metrics.completed} completed orders`}
          dot="bg-emerald-600"
          isText
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            Operations
          </p>
          <h2 className="mt-1 text-sm font-semibold text-[var(--text)]">Order flow</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            This page is for searching and reviewing records. Move orders forward from the Staff Queue.
          </p>

          <div className="mt-4 space-y-2">
            <FlowItem label="Needs check" value={metrics.needsReview} urgent={metrics.needsReview > 0} />
            <FlowItem label="Awaiting payment" value={metrics.awaitingPayment} urgent={metrics.awaitingPayment > 0} />
            <FlowItem label="Production / delivery" value={metrics.production} />
            <FlowItem label="Completed" value={metrics.completed} />
          </div>

          <Link
            href="/staff"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--text)] px-3 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-80"
          >
            Go to Staff Queue
            <ArrowRightIcon />
          </Link>
        </aside>

        <section className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                  Orders
                </p>
                <h2 className="mt-1 text-base font-semibold text-[var(--text)]">Customer request list</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Showing {filteredOrders.length} of {orders.length} orders.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/admin/reports/orders/export?format=xlsx"
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                >
                  <DownloadIcon />
                  Excel
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-2 lg:grid-cols-[1.2fr_0.75fr_0.7fr_auto]">
              <label className="relative block">
                <span className="sr-only">Search orders</span>
                <SearchIcon />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order, customer, contact, product..."
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] py-2 pl-8 pr-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--text)] focus:bg-[var(--surface)]"
                />
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--text)] focus:bg-[var(--surface)]"
                aria-label="Filter by order status"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {ORDER_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>

              <select
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value as DocumentFilter)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--text)] focus:bg-[var(--surface)]"
                aria-label="Filter by customer data"
              >
                <option value="all">All customers</option>
                <option value="with_customer">Has customer</option>
                <option value="missing_customer">Missing customer</option>
              </select>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto rounded-md bg-[var(--surface-soft)] p-1">
              <FilterChip label="All" value={metrics.total} active={group === "all"} onClick={() => setGroup("all")} />
              <FilterChip label="Review" value={metrics.needsReview} active={group === "review"} onClick={() => setGroup("review")} />
              <FilterChip label="Active" value={metrics.active} active={group === "active"} onClick={() => setGroup("active")} />
              <FilterChip label="Completed" value={metrics.completed} active={group === "completed"} onClick={() => setGroup("completed")} />
              <FilterChip label="Cancelled" value={metrics.cancelled} active={group === "cancelled"} onClick={() => setGroup("cancelled")} />
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[var(--surface-soft)]">
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Product & service</Th>
                  <Th align="center">Qty</Th>
                  <Th align="right">Total</Th>
                  <Th>Status</Th>
                  <Th>Next step</Th>
                  <Th>Date</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <OrderTableRow
                      key={order.id}
                      order={order}
                      onOpen={() => setSelectedOrder(order)}
                    />
                  ))
                ) : (
                  <EmptyTableRow hasFilters={hasFilters} onReset={resetFilters} />
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 p-3 lg:hidden">
            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  onOpen={() => setSelectedOrder(order)}
                />
              ))
            ) : (
              <EmptyMobileState hasFilters={hasFilters} onReset={resetFilters} />
            )}
          </div>
        </section>
      </section>

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}

function OrderTableRow({
  order,
  onOpen,
}: {
  order: AdminOrderRow;
  onOpen: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-soft)]">
      <td className="px-4 py-3 align-middle">
        <span className="font-semibold tabular-nums text-[var(--text)]">{order.orderNumber}</span>
      </td>

      <td className="px-4 py-3 align-middle">
        <CustomerSummary order={order} />
      </td>

      <td className="px-4 py-3 align-middle">
        <p className="text-sm font-medium leading-snug text-[var(--text)]">
          {order.product?.name ?? "Garment"}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {order.service?.name ?? "Printing service"}
        </p>
      </td>

      <td className="px-4 py-3 text-center align-middle tabular-nums text-[var(--text)]">
        {order.quantity}
      </td>

      <td className="px-4 py-3 text-right align-middle font-semibold tabular-nums text-[var(--text)]">
        {formatCurrency(order.total)}
      </td>

      <td className="px-4 py-3 align-middle">
        <LocalStatusBadge status={order.status} />
      </td>

      <td className="px-4 py-3 align-middle">
        <span className="text-xs font-medium text-[var(--muted)]">{nextStepFor(order.status)}</span>
      </td>

      <td className="px-4 py-3 align-middle text-xs tabular-nums text-[var(--muted)]">
        {formatDateSafe(order.createdAt)}
      </td>

      <td className="px-4 py-3 text-right align-middle">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function MobileOrderCard({
  order,
  onOpen,
}: {
  order: AdminOrderRow;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold tabular-nums text-[var(--text)]">{order.orderNumber}</p>
          <p className="mt-1 truncate text-sm text-[var(--text)]">
            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "No customer"}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
            {(order.product?.name ?? "Garment") + " · " + (order.service?.name ?? "Printing service")}
          </p>
        </div>
        <LocalStatusBadge status={order.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-[var(--surface-soft)] p-2 text-xs">
        <MiniDetail label="Qty" value={String(order.quantity)} />
        <MiniDetail label="Total" value={formatCurrency(order.total)} />
        <MiniDetail label="Date" value={formatDateShort(order.createdAt)} />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 w-full rounded-md bg-[var(--text)] px-3 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-85"
      >
        View details
      </button>
    </article>
  );
}

function OrderDetailsModal({
  order,
  onClose,
}: {
  order: AdminOrderRow | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!order) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [order, onClose]);

  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Order details
            </p>
            <h2 id="order-details-title" className="mt-1 text-lg font-semibold text-[var(--text)]">
              {order.orderNumber}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {nextStepFor(order.status)}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-78px)] overflow-y-auto p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard label="Status" value={<LocalStatusBadge status={order.status} />} />
            <InfoCard label="Total amount" value={formatCurrency(order.total)} strong />
            <InfoCard label="Created" value={formatDateSafe(order.createdAt)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Customer</h3>
              <div className="mt-3 flex items-center gap-3">
                <CustomerAvatar order={order} size="lg" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "No customer"}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-[var(--muted)]">
                    {order.customer?.contactNumber ?? "No contact number"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Product and service</h3>
              <div className="mt-3 grid gap-2 text-sm">
                <DetailLine label="Garment" value={order.product?.name ?? "Garment"} />
                <DetailLine label="Service" value={order.service?.name ?? "Printing service"} />
                <DetailLine label="Quantity" value={`${order.quantity} pcs`} />
              </div>
            </section>
          </div>

          <section className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Pricing</h3>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <DetailLine label="Product base" value={formatCurrency(order.product?.basePrice ?? 0)} />
              <DetailLine label="Service price" value={formatCurrency(order.service?.price ?? 0)} />
              <DetailLine label={order.finalPrice === null ? "Estimated total" : "Final total"} value={formatCurrency(order.total)} />
            </div>
          </section>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              Back to list
            </button>
            <Link
              href="/staff"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-85"
            >
              Open in Staff Queue
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerSummary({ order }: { order: AdminOrderRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <CustomerAvatar order={order} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text)]">
          {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "No customer"}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-[var(--muted)]">
          {order.customer?.contactNumber ?? "—"}
        </p>
      </div>
    </div>
  );
}

function CustomerAvatar({
  order,
  size = "sm",
}: {
  order: AdminOrderRow;
  size?: "sm" | "lg";
}) {
  const initials = getInitials(order.customer?.firstName, order.customer?.lastName);
  const colorIdx = (initials.charCodeAt(0) || 0) % AVATAR_BG.length;
  const sizeClass = size === "lg" ? "h-10 w-10 text-xs" : "h-7 w-7 text-[10px]";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${AVATAR_BG[colorIdx]}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  dot,
  tone = "default",
  isText = false,
}: {
  label: string;
  value: number | string;
  helper: string;
  dot: string;
  tone?: "default" | "warning";
  isText?: boolean;
}) {
  const warning = tone === "warning";
  return (
    <article
      className={`rounded-lg border p-4 ${
        warning
          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
        <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${warning ? "text-amber-800" : "text-[var(--muted-2)]"}`}>
          {label}
        </p>
      </div>
      <p className={`mt-2 leading-none ${isText ? "text-xl" : "text-3xl"} font-semibold tabular-nums ${warning ? "text-amber-800" : "text-[var(--text)]"}`}>
        {value}
      </p>
      <p className={`mt-1.5 text-xs ${warning ? "text-amber-700" : "text-[var(--muted)]"}`}>{helper}</p>
    </article>
  );
}

function FlowItem({ label, value, urgent = false }: { label: string; value: number; urgent?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
        urgent
          ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/20"
          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)]"
      }`}
    >
      <span className="text-xs font-medium">{label}</span>
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
          urgent ? "bg-amber-500 text-white" : "bg-[var(--surface)] text-[var(--text)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold ${
        active
          ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
          : "text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {label}
      <span className="tabular-nums">{value}</span>
    </button>
  );
}

function LocalStatusBadge({ status }: { status: OrderStatus }) {
  const tone = statusTone[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function InfoCard({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p>
      <div className={`mt-1.5 text-sm ${strong ? "font-semibold text-[var(--text)]" : "text-[var(--text)]"}`}>
        {value}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface)] px-3 py-2">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="text-right text-xs font-semibold text-[var(--text)]">{value}</span>
    </div>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function EmptyTableRow({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <tr>
      <td colSpan={9} className="px-4 py-14 text-center">
        <div className="mx-auto max-w-sm">
          <p className="text-sm font-semibold text-[var(--text)]">
            {hasFilters ? "No orders match your filters" : "No orders yet"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {hasFilters
              ? "Try another search term or reset the filters."
              : "Customer orders will appear here after they submit a custom order."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              Reset filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyMobileState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">
        {hasFilters ? "No orders match your filters" : "No orders yet"}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {hasFilters ? "Try resetting the filters." : "New customer orders will show here."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

function nextStepFor(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Review request";
    case "design_review":
      return "Check artwork";
    case "approved":
      return "Request payment";
    case "rejected":
      return "Wait for revision";
    case "waiting_for_payment":
      return "Confirm payment";
    case "paid":
      return "Start production";
    case "printing":
      return "Update progress";
    case "ready_for_pickup":
      return "Notify customer";
    case "out_for_delivery":
      return "Track delivery";
    case "completed":
      return "Done";
    case "cancelled":
      return "No action";
    default:
      return "Check order";
  }
}

function Th({
  children,
  align,
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  const cls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th className={`whitespace-nowrap border-b border-[var(--border)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)] ${cls}`}>
      {children}
    </th>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDateSafe(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getInitials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

const AVATAR_BG = [
  "bg-purple-100 text-purple-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

const statusTone: Partial<Record<OrderStatus, string>> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  design_review: "border-blue-200 bg-blue-50 text-blue-800",
  approved: "border-indigo-200 bg-indigo-50 text-indigo-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
  waiting_for_payment: "border-orange-200 bg-orange-50 text-orange-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  printing: "border-purple-200 bg-purple-50 text-purple-800",
  ready_for_pickup: "border-teal-200 bg-teal-50 text-teal-800",
  out_for_delivery: "border-pink-200 bg-pink-50 text-pink-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
