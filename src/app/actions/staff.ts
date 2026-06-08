"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

const STAFF_ALLOWED_STATUSES: OrderStatus[] = [
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

export async function updateOrderStatus(formData: FormData) {
  const { user } = await requireRole(["admin", "staff"]);
  const orderId = String(formData.get("orderId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as OrderStatus;
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  if (!orderId || !STAFF_ALLOWED_STATUSES.includes(nextStatus)) throw new Error("Invalid order status update.");
  if (nextStatus === "rejected" && !remarks) throw new Error("Rejection reason is required.");

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, customer_id, order_number").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found.");

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    staff_remarks: remarks,
  };

  if (nextStatus === "rejected") updatePayload.rejection_reason = remarks;
  if (nextStatus === "completed") updatePayload.completed_at = new Date().toISOString();

  const { error } = await admin.from("orders").update(updatePayload).eq("id", orderId);
  if (error) throw new Error(error.message);

  await admin.from("order_status_logs").insert({
    order_id: orderId,
    status: nextStatus,
    remarks: remarks ?? `Status changed to ${ORDER_STATUS_LABELS[nextStatus]}.`,
    changed_by: user.id,
  });

  await createNotification({
    userId: order.customer_id,
    orderId,
    title: `Order ${order.order_number}: ${ORDER_STATUS_LABELS[nextStatus]}`,
    message: remarks ?? `Your order status was updated to ${ORDER_STATUS_LABELS[nextStatus]}.`,
  });

  revalidatePath("/staff");
  revalidatePath("/admin/orders");
  revalidatePath(`/customer/orders/${order.order_number}`);
}

export async function confirmPayment(formData: FormData) {
  const { user } = await requireRole(["admin", "staff"]);
  const paymentId = String(formData.get("paymentId") ?? "");
  const remarks = String(formData.get("remarks") ?? "Payment confirmed by staff.").trim();
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, orders(id, order_number, customer_id)")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) throw new Error("Payment not found.");
  const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
  if (!order) throw new Error("Related order not found.");

  const { error: paymentError } = await admin
    .from("payments")
    .update({ status: "confirmed", remarks, confirmed_by: user.id, confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (paymentError) throw new Error(paymentError.message);

  const { error: orderError } = await admin.from("orders").update({ status: "paid" }).eq("id", order.id);
  if (orderError) throw new Error(orderError.message);

  await admin.from("order_status_logs").insert({ order_id: order.id, status: "paid", remarks, changed_by: user.id });
  await createNotification({ userId: order.customer_id, orderId: order.id, title: `Order ${order.order_number}: Payment confirmed`, message: "Your GCash payment has been confirmed." });

  revalidatePath("/staff");
  revalidatePath("/admin/orders");
  revalidatePath(`/customer/orders/${order.order_number}`);
}

export async function rejectPayment(formData: FormData) {
  const { user } = await requireRole(["admin", "staff"]);
  const paymentId = String(formData.get("paymentId") ?? "");
  const remarks = String(formData.get("remarks") ?? "").trim();
  if (!remarks) throw new Error("Payment rejection remarks are required.");

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, orders(id, order_number, customer_id)")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) throw new Error("Payment not found.");
  const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
  if (!order) throw new Error("Related order not found.");

  const { error } = await admin.from("payments").update({ status: "rejected", remarks, confirmed_by: user.id }).eq("id", paymentId);
  if (error) throw new Error(error.message);

  await createNotification({ userId: order.customer_id, orderId: order.id, title: `Order ${order.order_number}: Payment needs review`, message: remarks });

  revalidatePath("/staff");
  revalidatePath("/admin/orders");
  revalidatePath(`/customer/orders/${order.order_number}`);
}
