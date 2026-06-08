import Link from "next/link";
import DashboardShell from "@/app/_components/dashboard/DashboardShell";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderListRow } from "@/lib/types";
import AdminOrdersClient, {
  type AdminOrderMetrics,
  type AdminOrderRow,
} from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AdminOrdersPage() {
  await requireRole(["admin"]);

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_id, quantity, status, estimated_price, final_price, created_at, profiles(first_name,last_name,contact_number), garment_products(name,base_price), printing_services(name,price)",
    )
    .order("created_at", { ascending: false });

  const rawOrders = (data ?? []) as OrderListRow[];

  const orders: AdminOrderRow[] = rawOrders.map((order) => {
    const customer = one(order.profiles);
    const product = one(order.garment_products);
    const service = one(order.printing_services);
    const finalPrice = order.final_price === null || order.final_price === undefined ? null : Number(order.final_price);
    const estimatedPrice = Number(order.estimated_price ?? 0);

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      quantity: order.quantity,
      status: order.status,
      estimatedPrice,
      finalPrice,
      total: Number(finalPrice ?? estimatedPrice ?? 0),
      createdAt: order.created_at,
      customer: customer
        ? {
            firstName: customer.first_name,
            lastName: customer.last_name,
            contactNumber: customer.contact_number,
          }
        : null,
      product: product
        ? {
            name: product.name,
            basePrice: Number(product.base_price ?? 0),
          }
        : null,
      service: service
        ? {
            name: service.name,
            price: Number(service.price ?? 0),
          }
        : null,
    };
  });

  const completedCount = orders.filter((o) => o.status === "completed").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const metrics: AdminOrderMetrics = {
    total: orders.length,
    needsReview: orders.filter((o) => o.status === "pending" || o.status === "design_review").length,
    awaitingPayment: orders.filter((o) => o.status === "waiting_for_payment").length,
    production: orders.filter((o) => ["paid", "printing", "ready_for_pickup", "out_for_delivery"].includes(o.status)).length,
    completed: completedCount,
    cancelled: cancelledCount,
    active: orders.length - completedCount - cancelledCount,
    revenue: orders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + Number(order.finalPrice ?? order.estimatedPrice ?? 0), 0),
  };

  return (
    <DashboardShell
      role="admin"
      active="orders"
      title="All customer orders"
      subtitle="Search, filter, and review customer orders. Use Staff Queue for approvals, payments, and production updates."
      actions={
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--text)] px-3.5 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-80"
        >
          Open Staff Queue
          <ArrowRightIcon />
        </Link>
      }
    >
      <AdminOrdersClient orders={orders} metrics={metrics} />
    </DashboardShell>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
