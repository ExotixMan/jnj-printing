import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import CancelOrderButton from "@/app/_components/CancelOrderButton";
import PaymentProofForm from "@/app/_components/PaymentProofForm";
import { StatusBadge } from "@/app/_components/dashboard/StatusBadge";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import FloatingActions from "@/app/_components/FloatingActions";

export const dynamic = "force-dynamic";

type OrderDetail = {
  id: string;
  order_number: string;
  customer_id: string;
  quantity: number;
  status: OrderStatus;
  estimated_price: number;
  final_price: number | null;
  placement: string;
  color_custom: string | null;
  special_instructions: string | null;
  staff_remarks: string | null;
  rejection_reason: string | null;
  created_at: string;
  garment_products: { name: string; base_price: number } | { name: string; base_price: number }[] | null;
  printing_services: { name: string; price: number } | { name: string; price: number }[] | null;
  colors: { name: string } | { name: string }[] | null;
};

type Item = { id: string; quantity: number; sizes: { name: string } | { name: string }[] | null };
type Upload = { file_name: string; file_path: string; created_at: string };
type UploadWithUrl = Upload & { viewUrl: string | null; };
type Payment = {
  id: string;
  status: PaymentStatus;
  proof_bucket: string | null;
  proof_path: string | null;
  proof_file_name: string | null;
  remarks: string | null;
  created_at: string;
};

type PaymentWithUrl = Payment & {
  proofUrl: string | null;
};
type Log = { status: OrderStatus; remarks: string | null; created_at: string };

function one<T>(value: T | T[] | null | undefined): T | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

export default async function TrackOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const { user } = await requireRole(["customer", "admin"]);
  const admin = createAdminClient();

  const { data: orderData } = await admin
    .from("orders")
    .select("id, order_number, customer_id, quantity, status, estimated_price, final_price, placement, color_custom, special_instructions, staff_remarks, rejection_reason, created_at, garment_products(name, base_price), printing_services(name, price), colors(name)")
    .eq("order_number", orderNumber)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!orderData) notFound();
  const order = orderData as OrderDetail;
  const [{ data: itemData }, { data: uploadData }, { data: paymentData }, { data: logData }] =
    await Promise.all([
      admin
        .from("order_items")
        .select("id, quantity, sizes(name)")
        .eq("order_id", order.id),

      admin
        .from("design_uploads")
        .select("file_name, file_path, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),

      admin
        .from("payments")
        .select("id, status, proof_bucket, proof_path, proof_file_name, remarks, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),

      admin
        .from("order_status_logs")
        .select("status, remarks, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),
    ]);

  const product = one(order.garment_products);
  const service = one(order.printing_services);
  const color = one(order.colors)?.name ?? order.color_custom ?? "Custom color";
  const items = (itemData ?? []) as Item[];
  const uploads = (uploadData ?? []) as Upload[];
  const payments = (paymentData ?? []) as Payment[];
  const logs = (logData ?? []) as Log[];
  const paymentsWithUrls: PaymentWithUrl[] = await Promise.all(
    payments.map(async (payment) => {
      if (!payment.proof_path) {
        return {
          ...payment,
          proofUrl: null,
        };
      }

      const { data } = await admin.storage
        .from(payment.proof_bucket ?? "payment-proofs")
        .createSignedUrl(payment.proof_path, 60 * 60);

      return {
        ...payment,
        proofUrl: data?.signedUrl ?? null,
      };
    })
  );
  const uploadsWithUrls: UploadWithUrl[] = await Promise.all(
    uploads.map(async (upload) => {
      const { data } = await admin.storage
        .from("design-files")
        .createSignedUrl(upload.file_path, 60 * 60);

      return {
        ...upload,
        viewUrl: data?.signedUrl ?? null,
      };
    })
  );
  const currentIndex = Math.max(0, ORDER_FLOW.indexOf(order.status as never));
  const canCancel = order.status === "pending";
  const canPay = order.status === "approved" || order.status === "waiting_for_payment";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)] px-6 py-12 md:px-8 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">Order Details</p>
              <h1 className="mt-2 font-display text-[clamp(34px,5vw,56px)] leading-tight text-[var(--text)]">{order.order_number}</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">Submitted on {formatDate(order.created_at)}</p>
            </div>
            <div className="flex gap-3">
              {canCancel && <CancelOrderButton orderNumber={order.order_number} />}
              <Link href="/customer/orders" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)]">Back to Orders</Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(13,13,20,0.06)] md:p-8">
              <div className="rounded-[26px] bg-[var(--cream)] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--muted)]">Product</p>
                    <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--text)]">{product?.name}</h2>
                    <p className="mt-2 font-bold text-[var(--purple)]">{service?.name}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Info label="Quantity" value={`${order.quantity} item/s`} />
                <Info label="Color" value={color} />
                <Info label="Placement" value={order.placement} />
                <Info label="Total Price" value={formatCurrency(order.final_price ?? order.estimated_price)} highlight />
              </div>

              <Panel title="Size / Quantity Breakdown">
                <div className="flex flex-wrap gap-2">
                  {items.length ? items.map((item) => <span key={item.id} className="rounded-full bg-[rgba(75,0,110,0.08)] px-3 py-1 text-xs font-bold text-[var(--purple)]">{one(item.sizes)?.name ?? "Qty"}: {item.quantity}</span>) : <p className="text-sm text-[var(--muted)]">No size breakdown available.</p>}
                </div>
              </Panel>

              {(order.special_instructions || order.staff_remarks || order.rejection_reason) && (
                <Panel title="Notes and Remarks">
                  {order.special_instructions && <p className="text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--text)]">Your instructions:</strong> {order.special_instructions}</p>}
                  {order.staff_remarks && <p className="mt-2 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--text)]">Staff remarks:</strong> {order.staff_remarks}</p>}
                  {order.rejection_reason && <p className="mt-2 text-sm leading-6 text-red-700"><strong>Rejection reason:</strong> {order.rejection_reason}</p>}
                </Panel>
              )}

              <Panel title="Design Uploads">
                {uploadsWithUrls.length ? (
                  <div className="space-y-3">
                    {uploadsWithUrls.map((upload) => (
                      <div
                        key={upload.file_path}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-4"
                      >
                        <p className="font-bold text-[var(--text)]">
                          {upload.file_name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Uploaded on {formatDate(upload.created_at)}
                        </p>

                        {upload.viewUrl ? (
                          <>
                            <Image
                              src={upload.viewUrl}
                              alt={upload.file_name}
                              className="mt-4 max-h-64 w-full rounded-2xl border border-[var(--border)] object-contain"
                            />
                            <a
                              href={upload.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex rounded-full bg-[var(--purple2)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--purple)]"
                            >
                              View uploaded design
                            </a>
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-red-700">
                            Unable to generate preview link.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    No design files saved.
                  </p>
                )}
              </Panel>

              {canPay && <PaymentProofForm orderNumber={order.order_number} orderId={order.id} />}

              <Panel title="Payment Records">
                {paymentsWithUrls.length ? (
                  <div className="space-y-3">
                    {paymentsWithUrls.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-[var(--text)]">
                              {payment.proof_file_name ?? "GCash proof"}
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                              Uploaded on {formatDate(payment.created_at)}
                            </p>
                          </div>

                          <StatusBadge status={payment.status} />
                        </div>

                        {payment.proofUrl && (
                          <>
                            <Image
                              src={payment.proofUrl}
                              alt={payment.proof_file_name ?? "Payment proof"}
                              className="mt-4 max-h-64 w-full rounded-2xl border border-[var(--border)] bg-white object-contain"
                            />

                            <a
                              href={payment.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex rounded-full bg-[var(--purple2)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--purple)]"
                            >
                              View payment proof
                            </a>
                          </>
                        )}

                        {!payment.proofUrl && (
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            No proof file available.
                          </p>
                        )}

                        {payment.remarks && (
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            {payment.remarks}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    No payment proof uploaded yet.
                  </p>
                )}
              </Panel>
            </section>

            <aside className="h-fit rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(13,13,20,0.06)] lg:sticky lg:top-24 md:p-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">Order Timeline</p>
              <h2 className="font-display text-3xl font-semibold text-[var(--text)]">Current progress</h2>
              <div className="mt-8 space-y-5">
                {ORDER_FLOW.map((status, index) => (
                  <div key={status} className="flex gap-4">
                    <div className={`mt-1 h-4 w-4 rounded-full ${index <= currentIndex ? "bg-[var(--purple2)]" : "bg-[#e7e0d8]"}`} />
                    <div>
                      <p className={`font-bold ${index === currentIndex ? "text-[var(--purple)]" : "text-[var(--text)]"}`}>{ORDER_STATUS_LABELS[status]}</p>
                      {index === currentIndex && <p className="mt-1 text-xs text-[var(--muted)]">Current status</p>}
                    </div>
                  </div>
                ))}
              </div>

              <Panel title="Status History">
                <div className="space-y-3">
                  {logs.map((log) => <div key={`${log.status}-${log.created_at}`} className="rounded-2xl bg-[var(--cream)] p-4"><p className="font-bold text-[var(--purple)]">{ORDER_STATUS_LABELS[log.status]}</p><p className="mt-1 text-xs text-[var(--muted-2)]">{formatDate(log.created_at)}</p>{log.remarks && <p className="mt-2 text-sm text-[var(--muted)]">{log.remarks}</p>}</div>)}
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

function Info({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-2)]">{label}</p><p className={`mt-2 text-sm font-bold ${highlight ? "text-[var(--purple)]" : "text-[var(--text)]"}`}>{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"><h3 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">{title}</h3>{children}</section>;
}
