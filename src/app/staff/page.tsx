import Link from "next/link";
import DashboardShell from "@/app/_components/dashboard/DashboardShell";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus } from "@/lib/types";
import StaffQueueClient, {
  type StaffQueueOrder,
  type StaffQueuePayment,
  type StaffQueueUpload,
} from "./StaffQueueClient";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const { role } = await requireRole(["admin", "staff"]);
  const admin = createAdminClient();

  const [{ data: orderData }, { data: paymentData }, { data: uploadData }] =
    await Promise.all([
      admin
        .from("orders")
        .select(
          "id, order_number, quantity, status, final_price, estimated_price, created_at, placement, special_instructions, profiles(first_name,last_name,contact_number), garment_products(name), printing_services(name), colors(name)",
        )
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("payments")
        .select(
          "id, order_id, status, proof_bucket, proof_path, proof_file_name, amount, created_at",
        )
        .order("created_at", { ascending: false }),
      admin
        .from("design_uploads")
        .select("id, order_id, bucket, file_name, file_path, mime_type")
        .order("created_at", { ascending: false }),
    ]);

  const orders = (orderData ?? []) as StaffQueueOrder[];

  const payments = ((paymentData ?? []) as Array<
    Omit<StaffQueuePayment, "proofHref"> & {
      proof_bucket: string | null;
      proof_path: string | null;
      proof_file_name: string | null;
      status: PaymentStatus;
    }
  >).map((payment) => ({
    ...payment,
    proofHref: payment.proof_path
      ? staffFileHref({ kind: "payment", id: payment.id })
      : null,
  })) satisfies StaffQueuePayment[];

  const uploads = ((uploadData ?? []) as Array<
    Omit<StaffQueueUpload, "viewHref"> & {
      bucket: string | null;
      file_path: string;
      file_name: string;
      mime_type: string | null;
    }
  >).map((upload) => ({
    ...upload,
    viewHref: upload.file_path
      ? staffFileHref({ kind: "design", id: upload.id })
      : null,
  })) satisfies StaffQueueUpload[];

  return (
    <DashboardShell
      role="staff"
      active="workspace"
      title="Staff work queue"
      subtitle="Search, filter, and open one order at a time. Use the focused modal to view documents, confirm payments, and update order status."
      actions={
        role === "admin" ? (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
          >
            ← Back to Admin
          </Link>
        ) : null
      }
    >
      <StaffQueueClient orders={orders} payments={payments} uploads={uploads} />
    </DashboardShell>
  );
}

function staffFileHref({
  kind,
  id,
}: {
  kind: "design" | "payment";
  id: string;
}) {
  const params = new URLSearchParams({ kind, id });
  return `/api/staff/files/view?${params.toString()}`;
}
