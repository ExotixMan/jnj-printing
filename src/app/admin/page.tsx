import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import DashboardShell from "@/app/_components/dashboard/DashboardShell";
import { StatusBadge } from "@/app/_components/dashboard/StatusBadge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import type { AppRole, OrderStatus, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type ReportOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  quantity: number;
  final_price: number | null;
  estimated_price: number;
  created_at: string;
  garment_products: { name: string } | { name: string }[] | null;
  printing_services: { name: string } | { name: string }[] | null;
};

type ProfileRow = { id: string; role: AppRole };
type PaymentRow = { id: string; status: PaymentStatus };

type MonthlySummary = ReturnType<typeof buildMonthlySummary>;

type WorkFilter = "all" | "urgent" | "in_progress";

type PageSearchParams = Promise<{
  work?: string | string[];
}>;

const activeStatuses: OrderStatus[] = [
  "pending",
  "design_review",
  "waiting_for_payment",
  "paid",
  "printing",
  "ready_for_pickup",
  "out_for_delivery",
];

const urgentStatuses: OrderStatus[] = [
  "pending",
  "design_review",
  "waiting_for_payment",
];

const inProgressStatuses: OrderStatus[] = [
  "paid",
  "printing",
  "ready_for_pickup",
  "out_for_delivery",
];

const workFilterLabels: Record<WorkFilter, string> = {
  all: "All",
  urgent: "Urgent",
  in_progress: "In progress",
};

const pipelineColors: Record<string, string> = {
  pending: "#EF9F27",
  design_review: "#378ADD",
  waiting_for_payment: "#BA7517",
  paid: "#639922",
  printing: "#7F77DD",
  ready_for_pickup: "#1D9E75",
  out_for_delivery: "#D4537E",
  completed: "#1a1a2e",
  cancelled: "#C74848",
};

const nextStepLabels: Record<string, string> = {
  pending: "Review details",
  design_review: "Approve artwork",
  waiting_for_payment: "Confirm payment",
  paid: "Send to queue",
  printing: "Track production",
  ready_for_pickup: "Notify customer",
  out_for_delivery: "Monitor delivery",
  completed: "Done",
  cancelled: "Closed",
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  await requireRole(["admin"]);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeWorkFilter = normalizeWorkFilter(resolvedSearchParams.work);

  const admin = createAdminClient();

  const [{ data: ordersData }, { data: usersData }, { data: paymentsData }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id, order_number, status, quantity, final_price, estimated_price, created_at, garment_products(name), printing_services(name)",
      )
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, role"),
    admin.from("payments").select("id, status"),
  ]);

  const orders = (ordersData ?? []) as ReportOrder[];
  const users = (usersData ?? []) as ProfileRow[];
  const payments = (paymentsData ?? []) as PaymentRow[];

  const totalSales = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.final_price ?? o.estimated_price ?? 0), 0);

  const orderValue = orders.reduce((sum, o) => sum + Number(o.final_price ?? o.estimated_price ?? 0), 0);
  const averageOrder = orders.length ? orderValue / orders.length : 0;

  const statusCounts = countBy(orders.map((o) => o.status));
  const productCounts = countBy(orders.map((o) => one(o.garment_products)?.name ?? "Unknown"));
  const serviceCounts = countBy(orders.map((o) => one(o.printing_services)?.name ?? "Unknown"));
  const roleCounts = countBy(users.map((u) => u.role));
  const paymentCounts = countBy(payments.map((p) => p.status));
  const monthly = buildMonthlySummary(orders);

  const needsReview = (statusCounts.pending ?? 0) + (statusCounts.design_review ?? 0);
  const paymentChecks = paymentCounts.pending ?? 0;

  const openOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const activeOrders = openOrders.length;

  const workFilterCounts: Record<WorkFilter, number> = {
    all: openOrders.length,
    urgent: openOrders.filter((o) => matchesWorkFilter(o.status, "urgent")).length,
    in_progress: openOrders.filter((o) => matchesWorkFilter(o.status, "in_progress")).length,
  };

  const openWork = openOrders
    .filter((o) => matchesWorkFilter(o.status, activeWorkFilter))
    .sort((a, b) => statusPriority(a.status) - statusPriority(b.status))
    .slice(0, 8);

  return (
    <DashboardShell
      role="admin"
      active="overview"
      title="Business overview"
      subtitle="Daily operations for JNJ Printing — orders, payments, sales, and users."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/reports/orders/export?format=xlsx"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-card)] px-3.5 py-2 text-xs font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-soft)]"
          >
            <SpreadsheetIcon /> Export Excel
          </a>

          <a
            href="/api/admin/reports/orders/export?format=pdf"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#1a1a2e] bg-[#1a1a2e] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#2d2d4e]"
          >
            <PdfIcon /> Export PDF
          </a>
        </div>
      }
    >
      <div
        className="admin-format space-y-4"
        style={
          {
            "--admin-bg": "var(--color-background-tertiary, #f6f7fb)",
            "--admin-card": "var(--color-background-primary, var(--surface, #ffffff))",
            "--admin-soft": "var(--color-background-secondary, var(--surface-soft, #f4f5f7))",
            "--admin-muted-surface": "var(--surface-muted, #eef0f4)",
            "--admin-border": "var(--color-border-tertiary, var(--border, #e4e7ec))",
            "--admin-border-strong": "var(--color-border-secondary, #d1d5db)",
            "--admin-text": "var(--color-text-primary, var(--text, #1f2937))",
            "--admin-muted": "var(--color-text-secondary, var(--muted, #667085))",
            "--admin-muted-2": "var(--color-text-tertiary, var(--muted-2, #98a2b3))",
          } as CSSProperties
        }
      >
        {/* Metrics */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total orders"
            value={orders.length.toString()}
            helper="All customer requests"
            dotColor="#1a1a2e"
          />

          <MetricCard
            label="Needs review"
            value={String(needsReview)}
            helper="Pending + design review"
            icon={<AlertIcon />}
            tone={needsReview > 0 ? "warn" : "default"}
          />

          <MetricCard
            label="Total sales"
            value={formatCurrency(totalSales)}
            helper="Completed orders only"
            dotColor="#1D9E75"
          />

          <MetricCard
            label="Users"
            value={users.length.toString()}
            helper={`${roleCounts.customer ?? 0} customers · ${roleCounts.staff ?? 0} staff`}
            dotColor="#534AB7"
          />
        </section>

        {/* Chart + Daily focus */}
        <section className="grid gap-4 xl:grid-cols-2">
          <AdminCard
            eyebrow="Visual report"
            title="Monthly orders and sales"
            subtitle="Order volume and completed revenue — last 6 months"
          >
            <MonthlyChart data={monthly} />
          </AdminCard>

          <AdminCard eyebrow="Daily focus" title="What to check first" subtitle="Items that need attention today">
            <div className="space-y-1.5">
              <FocusItem
                label="New orders"
                value={statusCounts.pending ?? 0}
                href="/staff"
                icon={<ClockIcon />}
                urgent={(statusCounts.pending ?? 0) > 0}
              />

              <FocusItem
                label="Design review"
                value={statusCounts.design_review ?? 0}
                href="/staff"
                icon={<PencilIcon />}
                urgent={(statusCounts.design_review ?? 0) > 0}
              />

              <FocusItem
                label="Payment confirmations"
                value={paymentChecks}
                href="/staff"
                icon={<CardIcon />}
                urgent={paymentChecks > 0}
              />

              <FocusItem
                label="Currently printing"
                value={statusCounts.printing ?? 0}
                href="/staff"
                icon={<PrinterIcon />}
                urgent={false}
              />
            </div>
          </AdminCard>
        </section>

        {/* Pipeline + Actions */}
        <section className="grid gap-4 xl:grid-cols-[2fr_3fr]">
          <AdminCard eyebrow="Pipeline" title="Order pipeline" subtitle="By status">
            <div className="space-y-2.5">
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
                <PipelineRow
                  key={status}
                  label={ORDER_STATUS_LABELS[status]}
                  value={statusCounts[status] ?? 0}
                  max={Math.max(1, ...Object.values(statusCounts))}
                  color={pipelineColors[status] ?? "#1a1a2e"}
                />
              ))}
            </div>
          </AdminCard>

          <div className="grid content-start gap-3">
            <AdminCard eyebrow="Quick actions" title="Operate without confusion">
              <div className="grid gap-2 sm:grid-cols-2">
                <QuickAction href="/admin/orders" title="View all orders" helper="Every customer request" icon={<ListIcon />} />
                <QuickAction href="/admin/users" title="Create staff account" helper="Add trusted operators" icon={<UserPlusIcon />} />
                <QuickAction href="/admin/catalog" title="Update price list" helper="Garments and services" icon={<TagIcon />} />
                <QuickAction href="/staff" title="Open work queue" helper="Approve orders & payments" icon={<StackIcon />} />
              </div>
            </AdminCard>

            <section className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Active orders" value={String(activeOrders)} />
              <MiniStat label="Average order" value={formatCurrency(averageOrder)} />
              <MiniStat label="Pending payments" value={String(paymentChecks)} />
            </section>

            <AdminCard eyebrow="Most requested">
              <div className="grid gap-2 sm:grid-cols-2">
                <MiniStat label="Best garment" value={top(productCounts)} mutedSurface />
                <MiniStat label="Top printing" value={top(serviceCounts)} mutedSurface />
              </div>
            </AdminCard>
          </div>
        </section>

        {/* Orders table */}
        <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--admin-text)]">Orders that need movement</h2>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Active orders — sorted by urgency
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <div className="flex w-full gap-1 overflow-x-auto rounded-md bg-[var(--admin-soft)] p-1 sm:w-fit">
                {(["all", "urgent", "in_progress"] as WorkFilter[]).map((filter) => {
                  const isActive = activeWorkFilter === filter;

                  return (
                    <Link
                      key={filter}
                      href={workFilterHref(filter)}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-[var(--admin-card)] text-[var(--admin-text)] shadow-sm"
                          : "text-[var(--admin-muted)] hover:bg-[var(--admin-card)] hover:text-[var(--admin-text)]"
                      }`}
                    >
                      {workFilterLabels[filter]}

                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                          isActive
                            ? "bg-[var(--admin-soft)] text-[var(--admin-text)]"
                            : "bg-[var(--admin-card)] text-[var(--admin-muted)]"
                        }`}
                      >
                        {workFilterCounts[filter]}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-card)] px-3.5 py-2 text-xs font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-soft)]"
              >
                See all <ArrowRightIcon />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[var(--admin-border)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
                <thead className="bg-[var(--admin-soft)]">
                  <tr>
                    <Th>Order</Th>
                    <Th>Product & service</Th>
                    <Th align="center">Qty</Th>
                    <Th align="right">Amount</Th>
                    <Th>Status</Th>
                    <Th>Next step</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>

                <tbody>
                  {openWork.length ? (
                    openWork.map((order) => (
                      <tr
                        key={order.id}
                        className="group border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-soft)]"
                      >
                        <td className="px-3.5 py-3 font-semibold tabular-nums text-[var(--admin-text)]">
                          {order.order_number}
                        </td>

                        <td className="px-3.5 py-3">
                          <div className="font-medium text-[var(--admin-text)]">
                            {one(order.garment_products)?.name ?? "Garment"}
                          </div>

                          <div className="mt-0.5 text-xs text-[var(--admin-muted)]">
                            {one(order.printing_services)?.name ?? "Service"}
                          </div>
                        </td>

                        <td className="px-3.5 py-3 text-center tabular-nums text-[var(--admin-text)]">
                          {order.quantity}
                        </td>

                        <td className="px-3.5 py-3 text-right font-semibold tabular-nums text-[var(--admin-text)]">
                          {formatCurrency(order.final_price ?? order.estimated_price)}
                        </td>

                        <td className="px-3.5 py-3">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-3.5 py-3 text-xs font-medium text-[var(--admin-muted)]">
                          {nextStepLabels[order.status] ?? "Review order"}
                        </td>

                        <td className="px-3.5 py-3 text-xs tabular-nums text-[var(--admin-muted)]">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-soft)] text-lg">
                            ✓
                          </div>

                          <p className="mt-3 text-sm font-semibold text-[var(--admin-text)]">
                            No {activeWorkFilter === "all" ? "active" : workFilterLabels[activeWorkFilter].toLowerCase()} orders need movement
                          </p>

                          <p className="mt-1 text-xs text-[var(--admin-muted)]">
                            New orders, reviews, payments, and production work will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

// ── Utilities ──────────────────────────────────────────────────

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, val) => {
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});
}

function top(counts: Record<string, number>) {
  const entry = Object.entries(counts)
    .filter(([name]) => name !== "Unknown")
    .sort((a, b) => b[1] - a[1])[0];

  return entry ? `${entry[0]} (${entry[1]})` : "No data yet";
}

function statusPriority(status: OrderStatus) {
  const index = activeStatuses.indexOf(status);
  return index === -1 ? activeStatuses.length : index;
}

function normalizeWorkFilter(value: string | string[] | undefined): WorkFilter {
  const filter = Array.isArray(value) ? value[0] : value;

  if (filter === "urgent" || filter === "in_progress") {
    return filter;
  }

  return "all";
}

function matchesWorkFilter(status: OrderStatus, filter: WorkFilter) {
  if (filter === "urgent") return urgentStatuses.includes(status);
  if (filter === "in_progress") return inProgressStatuses.includes(status);

  return activeStatuses.includes(status);
}

function workFilterHref(filter: WorkFilter) {
  return filter === "all" ? "/admin" : `/admin?work=${filter}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildMonthlySummary(orders: ReportOrder[]) {
  const today = new Date();

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    return {
      key,
      label: d.toLocaleString("en", { month: "short" }),
      orders: 0,
      sales: 0,
    };
  });

  const map = new Map(months.map((m) => [m.key, m]));

  orders.forEach((order) => {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const month = map.get(key);

    if (!month) return;

    month.orders += 1;

    if (order.status === "completed") {
      month.sales += Number(order.final_price ?? order.estimated_price ?? 0);
    }
  });

  return months;
}

// ── Shared UI ──────────────────────────────────────────────────

function AdminCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      {eyebrow && (
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--admin-muted-2)]">
          {eyebrow}
        </div>
      )}

      {title && <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>}

      {subtitle && <p className="mt-1 mb-4 text-xs text-[var(--admin-muted)]">{subtitle}</p>}

      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
  dotColor,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  dotColor?: string;
  icon?: ReactNode;
  tone?: "default" | "warn";
}) {
  const isWarn = tone === "warn";

  return (
    <article
      className={`rounded-lg border p-4 transition ${
        isWarn
          ? "border-[#EF9F27] bg-[#FAEEDA]"
          : "border-[var(--admin-border)] bg-[var(--admin-card)] hover:border-[var(--admin-border-strong)]"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] ${
          isWarn ? "text-[#854F0B]" : "text-[var(--admin-muted-2)]"
        }`}
      >
        {icon ?? (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: dotColor ?? "currentColor" }}
          />
        )}
        {label}
      </div>

      <div
        className={`mt-2 text-[26px] font-semibold leading-none tabular-nums ${
          isWarn ? "text-[#633806]" : "text-[var(--admin-text)]"
        }`}
      >
        {value}
      </div>

      <p className={`mt-1 text-xs ${isWarn ? "text-[#854F0B]" : "text-[var(--admin-muted)]"}`}>
        {helper}
      </p>
    </article>
  );
}

function MonthlyChart({ data }: { data: MonthlySummary }) {
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const maxSales = Math.max(1, ...data.map((d) => d.sales));
  const width = 340;
  const baseY = 100;
  const topY = 24;
  const leftX = 20;
  const step = data.length > 1 ? (width - leftX) / (data.length - 1) : 0;

  const orderPoints = data
    .map((d, i) => `${leftX + i * step},${baseY - (d.orders / maxOrders) * (baseY - topY)}`)
    .join(" ");

  const salesPoints = data
    .map((d, i) => `${leftX + i * step},${baseY - (d.sales / maxSales) * (baseY - topY)}`)
    .join(" ");

  return (
    <div className="rounded-md bg-[var(--admin-soft)] p-4">
      <div className="mb-3 flex flex-wrap gap-4">
        <ChartLegend color="#1a1a2e" label="Orders" />
        <ChartLegend color="#1D9E75" label="Sales" />
      </div>

      <svg
        viewBox="0 0 360 126"
        className="h-[150px] w-full overflow-visible"
        role="img"
        aria-label="Monthly orders and sales chart"
      >
        <line x1="0" y1="100" x2="350" y2="100" stroke="var(--admin-border)" strokeWidth="1" />
        <line x1="0" y1="70" x2="350" y2="70" stroke="var(--admin-border)" strokeWidth="0.8" strokeDasharray="3 4" />
        <line x1="0" y1="40" x2="350" y2="40" stroke="var(--admin-border)" strokeWidth="0.8" strokeDasharray="3 4" />

        <polyline
          points={`${leftX},${baseY} ${orderPoints} ${leftX + (data.length - 1) * step},${baseY}`}
          fill="#1a1a2e"
          fillOpacity="0.05"
          stroke="none"
        />

        <polyline
          points={orderPoints}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={salesPoints}
          fill="none"
          stroke="#1D9E75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const x = leftX + i * step;
          const orderY = baseY - (d.orders / maxOrders) * (baseY - topY);
          const salesY = baseY - (d.sales / maxSales) * (baseY - topY);

          return (
            <g key={d.key}>
              <circle cx={x} cy={orderY} r="3" fill="#1a1a2e" />
              <circle cx={x} cy={salesY} r="3" fill="#1D9E75" />
              <text x={x} y="120" textAnchor="middle" fontSize="10" fill="var(--admin-muted-2)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--admin-muted)]">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

function FocusItem({
  label,
  value,
  href,
  icon,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
  urgent: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition ${
        urgent
          ? "border-[#FAC775] bg-[#FAEEDA] hover:bg-[#FAC775]"
          : "border-[var(--admin-border)] bg-[var(--admin-card)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-soft)]"
      }`}
    >
      <span
        className={`flex items-center gap-1.5 text-[13px] font-semibold ${
          urgent ? "text-[#633806]" : "text-[var(--admin-text)]"
        }`}
      >
        <span className="text-current">{icon}</span>
        {label}
      </span>

      <span
        className={`rounded-md px-2.5 py-1 text-[15px] font-semibold leading-none tabular-nums ${
          urgent && value > 0
            ? "bg-[#EF9F27] text-white"
            : "bg-[var(--admin-soft)] text-[var(--admin-text)]"
        }`}
      >
        {value}
      </span>
    </Link>
  );
}

function PipelineRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(value > 0 ? 5 : 0, (value / max) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-[var(--admin-muted)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--admin-text)]">{value}</span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[var(--admin-soft)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  helper,
  icon,
}: {
  href: string;
  title: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-[var(--admin-border)] px-3.5 py-3 transition hover:border-[#1a1a2e] hover:bg-[var(--admin-soft)]"
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--admin-text)]">
        <span className="text-[var(--admin-muted-2)]">{icon}</span>
        {title}
      </span>

      <span className="mt-1 block text-[11px] text-[var(--admin-muted)]">{helper}</span>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  mutedSurface = false,
}: {
  label: string;
  value: string;
  mutedSurface?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-3.5 ${
        mutedSurface
          ? "bg-[var(--admin-soft)]"
          : "border border-[var(--admin-border)] bg-[var(--admin-card)]"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-muted-2)]">
        {label}
      </div>

      <div className="mt-1.5 text-[13px] font-semibold text-[var(--admin-text)]">
        {value}
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={`whitespace-nowrap border-b border-[var(--admin-border)] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--admin-muted)] ${alignClass}`}
    >
      {children}
    </th>
  );
}

// ── Icons ──────────────────────────────────────────────────────

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function AlertIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </IconBase>
  );
}

function SpreadsheetIcon() {
  return (
    <IconBase>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M8 9h2" />
    </IconBase>
  );
}

function PdfIcon() {
  return (
    <IconBase>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 15h1.5a1.5 1.5 0 0 0 0-3H8v5" />
      <path d="M13 12v5" />
      <path d="M13 12h1a2 2 0 0 1 0 5h-1" />
    </IconBase>
  );
}

function ClockIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconBase>
  );
}

function PencilIcon() {
  return (
    <IconBase>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </IconBase>
  );
}

function CardIcon() {
  return (
    <IconBase>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </IconBase>
  );
}

function PrinterIcon() {
  return (
    <IconBase>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </IconBase>
  );
}

function ListIcon() {
  return (
    <IconBase>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </IconBase>
  );
}

function UserPlusIcon() {
  return (
    <IconBase>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </IconBase>
  );
}

function TagIcon() {
  return (
    <IconBase>
      <path d="M20.59 13.41 12 22l-10-10V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </IconBase>
  );
}

function StackIcon() {
  return (
    <IconBase>
      <path d="m12 2 10 5-10 5L2 7Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </IconBase>
  );
}

function ArrowRightIcon() {
  return (
    <IconBase>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </IconBase>
  );
}