"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { confirmPayment, rejectPayment, updateOrderStatus } from "@/app/actions/staff";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

type MaybeArray<T> = T | T[] | null;

type Customer = {
  first_name: string;
  last_name: string;
  contact_number: string | null;
};

type NamedRow = { name: string };

export type StaffQueueOrder = {
  id: string;
  order_number: string;
  quantity: number;
  status: OrderStatus;
  final_price: number | null;
  estimated_price: number;
  created_at: string;
  placement: string;
  special_instructions: string | null;
  profiles: MaybeArray<Customer>;
  garment_products: MaybeArray<NamedRow>;
  printing_services: MaybeArray<NamedRow>;
  colors: MaybeArray<NamedRow>;
};

export type StaffQueuePayment = {
  id: string;
  order_id: string;
  status: PaymentStatus;
  proof_bucket: string | null;
  proof_path: string | null;
  proof_file_name: string | null;
  amount: number | null;
  created_at: string;
  proofHref: string | null;
};

export type StaffQueueUpload = {
  id: string;
  order_id: string;
  bucket: string | null;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  viewHref: string | null;
};

type StatusFilter = "all" | "needs_action" | "active" | "completed" | "cancelled" | OrderStatus;
type PaymentFilter = "all" | "pending" | "has_proof" | "no_payment";
type DocumentFilter = "all" | "has_design" | "no_design" | "has_payment_proof";

const nextStatuses: OrderStatus[] = [
  "design_review",
  "approved",
  "rejected",
  "waiting_for_payment",
  "paid",
  "printing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
];

const urgentStatuses: OrderStatus[] = ["pending", "design_review", "waiting_for_payment", "paid"];
const activeStatuses: OrderStatus[] = [
  "pending",
  "design_review",
  "waiting_for_payment",
  "paid",
  "printing",
  "ready_for_pickup",
  "out_for_delivery",
];

function one<T>(value: MaybeArray<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default function StaffQueueClient({
  orders,
  payments,
  uploads,
}: {
  orders: StaffQueueOrder[];
  payments: StaffQueuePayment[];
  uploads: StaffQueueUpload[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("needs_action");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const paymentsByOrder = useMemo(() => groupByOrder(payments), [payments]);
  const uploadsByOrder = useMemo(() => groupByOrder(uploads), [uploads]);

  const orderedOrders = useMemo(
    () => [...orders].sort((a, b) => priority(a.status) - priority(b.status)),
    [orders],
  );

  const stats = useMemo(() => {
    const pendingPayments = payments.filter((payment) => payment.status === "pending").length;
    const needsAction = orderedOrders.filter((order) => {
      const orderPayments = paymentsByOrder.get(order.id) ?? [];
      return urgentStatuses.includes(order.status) || orderPayments.some((p) => p.status === "pending");
    }).length;

    return {
      needsAction,
      pendingPayments,
      active: orderedOrders.filter((order) => activeStatuses.includes(order.status)).length,
      total: orderedOrders.length,
    };
  }, [orderedOrders, payments, paymentsByOrder]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orderedOrders.filter((order) => {
      const customer = one(order.profiles);
      const product = one(order.garment_products);
      const service = one(order.printing_services);
      const color = one(order.colors);
      const orderPayments = paymentsByOrder.get(order.id) ?? [];
      const orderUploads = uploadsByOrder.get(order.id) ?? [];
      const hasPendingPayment = orderPayments.some((payment) => payment.status === "pending");
      const hasPaymentProof = orderPayments.some((payment) => payment.proofHref);
      const hasDesign = orderUploads.length > 0;
      const isNeedsAction = urgentStatuses.includes(order.status) || hasPendingPayment;
      const isActive = activeStatuses.includes(order.status);

      const text = [
        order.order_number,
        customer?.first_name,
        customer?.last_name,
        customer?.contact_number,
        product?.name,
        service?.name,
        color?.name,
        order.placement,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "needs_action"
            ? isNeedsAction
            : statusFilter === "active"
              ? isActive
              : statusFilter === "completed"
                ? order.status === "completed"
                : statusFilter === "cancelled"
                  ? order.status === "cancelled"
                  : order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "all"
          ? true
          : paymentFilter === "pending"
            ? hasPendingPayment
            : paymentFilter === "has_proof"
              ? hasPaymentProof
              : orderPayments.length === 0;

      const matchesDocument =
        documentFilter === "all"
          ? true
          : documentFilter === "has_design"
            ? hasDesign
            : documentFilter === "no_design"
              ? !hasDesign
              : hasPaymentProof;

      return matchesQuery && matchesStatus && matchesPayment && matchesDocument;
    });
  }, [orderedOrders, query, statusFilter, paymentFilter, documentFilter, paymentsByOrder, uploadsByOrder]);

  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId) ?? null
    : null;

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDocumentFilter("all");
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric label="Needs action" value={stats.needsAction} helper="Open these first" tone={stats.needsAction > 0 ? "warn" : "default"} />
        <QueueMetric label="Payment checks" value={stats.pendingPayments} helper="GCash proofs" tone={stats.pendingPayments > 0 ? "warn" : "default"} />
        <QueueMetric label="Active orders" value={stats.active} helper="Not yet completed" />
        <QueueMetric label="Showing" value={visibleOrders.length} helper={`${stats.total} total loaded`} />
      </section>

      <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Queue tools</p>
              <h2 className="mt-1 text-base font-semibold text-[var(--text)]">Search and filters</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Search by order, customer, contact, product, service, color, or status.</p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-muted)] sm:w-auto"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order, customer, contact..."
                className="ui-input w-full rounded-md px-3 py-2.5 text-sm"
              />
            </label>

            <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
              <option value="all">All statuses</option>
              <option value="needs_action">Needs action</option>
              <option value="active">Active only</option>
              <option value="pending">Pending</option>
              <option value="design_review">Design review</option>
              <option value="waiting_for_payment">Waiting for payment</option>
              <option value="paid">Paid</option>
              <option value="printing">Printing</option>
              <option value="ready_for_pickup">Ready for pickup</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </FilterSelect>

            <FilterSelect label="Payment" value={paymentFilter} onChange={(value) => setPaymentFilter(value as PaymentFilter)}>
              <option value="all">All payments</option>
              <option value="pending">Pending proof review</option>
              <option value="has_proof">Has proof file</option>
              <option value="no_payment">No payment yet</option>
            </FilterSelect>

            <FilterSelect label="Documents" value={documentFilter} onChange={(value) => setDocumentFilter(value as DocumentFilter)}>
              <option value="all">All documents</option>
              <option value="has_design">Has design file</option>
              <option value="no_design">No design file</option>
              <option value="has_payment_proof">Has payment proof</option>
            </FilterSelect>
          </div>
        </div>

        <div className="hidden border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)] lg:grid lg:grid-cols-[130px_1.1fr_1.2fr_90px_145px_160px_100px] lg:items-center lg:gap-3">
          <span>Order</span>
          <span>Customer</span>
          <span>Product</span>
          <span className="text-center">Qty</span>
          <span>Status</span>
          <span>Info</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {visibleOrders.length ? (
            visibleOrders.map((order) => {
              const orderPayments = paymentsByOrder.get(order.id) ?? [];
              const orderUploads = uploadsByOrder.get(order.id) ?? [];
              return (
                <QueueRow
                  key={order.id}
                  order={order}
                  orderPayments={orderPayments}
                  orderUploads={orderUploads}
                  onOpen={() => setSelectedOrderId(order.id)}
                />
              );
            })
          ) : (
            <div className="bg-[var(--surface)] px-4 py-14 text-center">
              <p className="text-sm font-semibold text-[var(--text)]">No matching orders</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Try a different search term or reset the filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-md bg-[var(--text)] px-3 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-80"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          orderPayments={paymentsByOrder.get(selectedOrder.id) ?? []}
          orderUploads={uploadsByOrder.get(selectedOrder.id) ?? []}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
}

function QueueRow({
  order,
  orderPayments,
  orderUploads,
  onOpen,
}: {
  order: StaffQueueOrder;
  orderPayments: StaffQueuePayment[];
  orderUploads: StaffQueueUpload[];
  onOpen: () => void;
}) {
  const customer = one(order.profiles);
  const product = one(order.garment_products);
  const service = one(order.printing_services);
  const color = one(order.colors);
  const pendingPayment = orderPayments.some((payment) => payment.status === "pending");
  const hasPaymentProof = orderPayments.some((payment) => payment.proofHref);
  const isUrgent = urgentStatuses.includes(order.status) || pendingPayment;
  const amount = formatCurrency(order.final_price ?? order.estimated_price);

  return (
    <article className="bg-[var(--surface)] px-4 py-3 transition hover:bg-[var(--surface-soft)]">
      <div className="grid gap-3 lg:grid-cols-[130px_1.1fr_1.2fr_90px_145px_160px_100px] lg:items-center">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${isUrgent ? "bg-amber-500" : "bg-[var(--border)]"}`} />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold text-[var(--text)]">{order.order_number}</p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{customer ? `${customer.first_name} ${customer.last_name}` : "No customer"}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{customer?.contact_number ?? "No contact"}</p>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text)]">{product?.name ?? "Garment"}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
            {service?.name ?? "Printing service"} · {color?.name ?? "Custom"} · {order.placement || "No placement"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 lg:block lg:text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)] lg:hidden">Qty / Total</span>
          <div>
            <p className="text-sm font-semibold tabular-nums text-[var(--text)]">{order.quantity}</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[var(--muted)]">{amount}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 lg:block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)] lg:hidden">Status</span>
          <StatusPill status={order.status} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ActionTag urgent={isUrgent} label={actionLabel(order.status, pendingPayment)} />
          {orderUploads.length > 0 && <ActionTag label={`${orderUploads.length} design${orderUploads.length !== 1 ? "s" : ""}`} />}
          {hasPaymentProof && <ActionTag label="payment proof" />}
          {order.special_instructions && <ActionTag label="note" />}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-full rounded-md bg-[var(--text)] px-3 py-2 text-xs font-semibold text-[var(--surface)] transition hover:opacity-80 lg:ml-auto lg:w-auto"
        >
          Open
        </button>
      </div>
    </article>
  );
}

function OrderModal({
  order,
  orderPayments,
  orderUploads,
  onClose,
}: {
  order: StaffQueueOrder;
  orderPayments: StaffQueuePayment[];
  orderUploads: StaffQueueUpload[];
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const customer = one(order.profiles);
  const product = one(order.garment_products);
  const service = one(order.printing_services);
  const color = one(order.colors);
  const amount = formatCurrency(order.final_price ?? order.estimated_price);
  const pendingPayment = orderPayments.find((payment) => payment.status === "pending");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" role="presentation">
      <button type="button" aria-label="Close order modal" className="absolute inset-0 cursor-default" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl outline-none sm:max-w-6xl sm:rounded-2xl"
      >
        <header className="border-b border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Focused order</p>
              <h2 id="order-modal-title" className="mt-1 truncate text-lg font-semibold text-[var(--text)] sm:text-xl">
                {order.order_number} · {product?.name ?? "Garment"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {customer ? `${customer.first_name} ${customer.last_name}` : "No customer"}
                {customer?.contact_number ? ` · ${customer.contact_number}` : ""}
                {` · ${formatDate(order.created_at)}`}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <StatusPill status={order.status} />
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_310px_330px]">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Order information</p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--text)]">{product?.name ?? "Garment"}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {service?.name ?? "Printing service"} · {color?.name ?? "Custom color"} · {order.placement || "No placement"}
                  </p>
                </div>
                <div className="rounded-md bg-[var(--surface-soft)] px-3 py-2 sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">Total</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">{amount}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{order.quantity} pc{order.quantity !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {order.special_instructions && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <span className="font-semibold">Customer note:</span> {order.special_instructions}
                </div>
              )}

              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Design files</p>
                {orderUploads.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {orderUploads.map((upload) => (
                      <DocumentLink
                        key={upload.id}
                        label={upload.file_name}
                        url={upload.viewHref}
                        type="Design"
                        mimeType={upload.mime_type}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-6 text-center text-xs text-[var(--muted)]">No design uploaded yet.</p>
                )}
              </div>
            </section>

            <ActionPanel title="Update status">
              <form action={updateOrderStatus} className="space-y-2.5" onSubmit={handleStatusSubmit}>
                <input type="hidden" name="orderId" value={order.id} />
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">New status</span>
                  <select
                    name="status"
                    defaultValue={order.status === "pending" ? "design_review" : order.status}
                    className="ui-input w-full rounded-md px-3 py-2.5 text-sm"
                    required
                  >
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Remarks</span>
                  <textarea
                    name="remarks"
                    rows={4}
                    placeholder="Required when rejecting. Optional for other status changes."
                    className="ui-input w-full resize-none rounded-md px-3 py-2 text-sm"
                  />
                </label>
                <button className="w-full rounded-md bg-[var(--text)] px-3 py-2.5 text-xs font-semibold text-[var(--surface)] transition hover:opacity-80">
                  Save status
                </button>
              </form>
            </ActionPanel>

            <ActionPanel title="Payment" badge={pendingPayment ? "Needs review" : undefined} success={!!pendingPayment}>
              {orderPayments.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-8 text-center text-xs text-[var(--muted)]">No payment proof yet.</div>
              ) : (
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {orderPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </ActionPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ payment }: { payment: StaffQueuePayment }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[var(--text)]">{payment.proof_file_name ?? "GCash receipt"}</p>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">Uploaded {formatDate(payment.created_at)}</p>
          {payment.amount && <p className="mt-1 text-xs font-semibold text-emerald-700">{formatCurrency(payment.amount)}</p>}
        </div>
        <PaymentPill status={payment.status} />
      </div>

      <div className="mt-2">
        <DocumentLink label={payment.proof_file_name ?? "GCash receipt"} url={payment.proofHref} type="Payment proof" compact />
      </div>

      {payment.status === "pending" && (
        <div className="mt-3 space-y-2">
          <form action={confirmPayment} onSubmit={handleConfirmPaymentSubmit}>
            <input type="hidden" name="paymentId" value={payment.id} />
            <button className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
              Confirm payment
            </button>
          </form>
          <form action={rejectPayment} className="space-y-1.5" onSubmit={handleRejectPaymentSubmit}>
            <input type="hidden" name="paymentId" value={payment.id} />
            <label className="block">
              <span className="sr-only">Reason for rejection</span>
              <input
                name="remarks"
                placeholder="Reason for rejection"
                className="ui-input w-full rounded-md px-3 py-2 text-xs"
                required
                minLength={3}
              />
            </label>
            <button className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100">
              Reject payment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
  const form = event.currentTarget;
  const data = new FormData(form);
  const status = String(data.get("status") ?? "");
  const remarks = String(data.get("remarks") ?? "").trim();
  const statusLabel = ORDER_STATUS_LABELS[status as OrderStatus] ?? status;

  if (!status) {
    event.preventDefault();
    alert("Please select a status before saving.");
    focusField(form, "status");
    return;
  }

  if (status === "rejected" && !remarks) {
    event.preventDefault();
    alert("Please add remarks before rejecting an order.");
    focusField(form, "remarks");
    return;
  }

  const message = status === "rejected"
    ? "Reject this order? This will notify the workflow that the design/order was rejected."
    : `Save status as “${statusLabel}”?`;

  if (!window.confirm(message)) {
    event.preventDefault();
  }
}

function handleConfirmPaymentSubmit(event: FormEvent<HTMLFormElement>) {
  if (!window.confirm("Confirm this payment proof? Make sure the amount and receipt are correct.")) {
    event.preventDefault();
  }
}

function handleRejectPaymentSubmit(event: FormEvent<HTMLFormElement>) {
  const form = event.currentTarget;
  const data = new FormData(form);
  const remarks = String(data.get("remarks") ?? "").trim();

  if (!remarks) {
    event.preventDefault();
    alert("Please enter a rejection reason before rejecting payment.");
    focusField(form, "remarks");
    return;
  }

  if (remarks.length < 3) {
    event.preventDefault();
    alert("Please enter a clearer rejection reason.");
    focusField(form, "remarks");
    return;
  }

  if (!window.confirm("Reject this payment proof? The customer/staff will need to review the reason.")) {
    event.preventDefault();
  }
}

function focusField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
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
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="ui-input w-full rounded-md px-3 py-2.5 text-sm">
        {children}
      </select>
    </label>
  );
}

function QueueMetric({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: number;
  helper: string;
  tone?: "default" | "warn";
}) {
  const warn = tone === "warn";
  return (
    <article className={`rounded-xl border p-3.5 ${warn ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-[var(--border)] bg-[var(--surface)]"}`}>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${warn ? "bg-amber-500" : "bg-[var(--text)]"}`} />
        <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${warn ? "text-amber-800" : "text-[var(--muted-2)]"}`}>{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-semibold leading-none ${warn ? "text-amber-800" : "text-[var(--text)]"}`}>{value}</p>
      <p className={`mt-1 truncate text-xs ${warn ? "text-amber-700" : "text-[var(--muted)]"}`}>{helper}</p>
    </article>
  );
}

function ActionTag({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgent ? "bg-amber-400 text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`}>
      {label}
    </span>
  );
}

function ActionPanel({
  title,
  children,
  badge,
  success = false,
}: {
  title: string;
  children: ReactNode;
  badge?: string;
  success?: boolean;
}) {
  return (
    <section className={`rounded-xl border p-4 ${success ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" : "border-[var(--border)] bg-[var(--surface)]"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{title}</p>
        {badge && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function DocumentLink({
  label,
  url,
  type,
  compact = false,
  mimeType,
}: {
  label: string;
  url: string | null;
  type: string;
  compact?: boolean;
  mimeType?: string | null;
}) {
  if (!url) {
    return (
      <div title={label} className={`flex items-center justify-between gap-2 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-2.5 ${compact ? "py-1.5" : "py-2"} text-xs text-[var(--muted)]`}>
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em]">No link</span>
      </div>
    );
  }

  const canPreview = isPreviewableImage(label, mimeType);

  return (
    <div title={label} className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-soft)]">
      {canPreview && (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`${type}: ${label}`} loading="lazy" className="h-36 w-full border-b border-[var(--border)] bg-[var(--surface)] object-contain" />
        </a>
      )}
      <a href={url} target="_blank" rel="noreferrer" className={`group flex items-center justify-between gap-2 px-2.5 ${compact ? "py-1.5" : "py-2"} text-xs text-[var(--text)] transition hover:bg-[var(--surface)]`}>
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">{canPreview ? `${type} preview` : type}</span>
        </span>
        <span className="shrink-0 rounded bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold text-[var(--text)] transition group-hover:bg-[var(--text)] group-hover:text-[var(--surface)]">View ↗</span>
      </a>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${orderStatusStyles[status] ?? orderStatusStyles.default}`}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}

function PaymentPill({ status }: { status: PaymentStatus }) {
  const label = String(status).replaceAll("_", " ");
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${paymentStatusStyles[String(status)] ?? paymentStatusStyles.default}`}>{label}</span>;
}

const orderStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  design_review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  waiting_for_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  printing: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-teal-100 text-teal-800",
  out_for_delivery: "bg-pink-100 text-pink-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  default: "bg-[var(--surface-soft)] text-[var(--muted)]",
};

const paymentStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  default: "bg-[var(--surface-soft)] text-[var(--muted)]",
};

function groupByOrder<T extends { order_id: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    map.set(item.order_id, [...(map.get(item.order_id) ?? []), item]);
  }
  return map;
}

function priority(status: OrderStatus) {
  const map: Partial<Record<OrderStatus, number>> = {
    pending: 1,
    design_review: 2,
    waiting_for_payment: 3,
    paid: 4,
    printing: 5,
    ready_for_pickup: 6,
    out_for_delivery: 7,
    rejected: 8,
    completed: 9,
    cancelled: 10,
  };
  return map[status] ?? 99;
}

function actionLabel(status: OrderStatus, hasPendingPayment: boolean) {
  if (hasPendingPayment) return "check payment";
  if (status === "pending") return "review design";
  if (status === "design_review") return "approve / reject";
  if (status === "waiting_for_payment") return "wait payment";
  if (status === "paid") return "start printing";
  if (status === "printing") return "mark ready";
  if (status === "ready_for_pickup") return "release";
  if (status === "out_for_delivery") return "complete";
  return "no action";
}

function isPreviewableImage(fileName: string, mimeType?: string | null) {
  return Boolean(mimeType?.startsWith("image/")) || /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(fileName);
}
