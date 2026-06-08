export const APP_NAME = "JNJ Printing";
export const MAX_UPLOAD_BYTES = 300 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  design_review: "Design Review",
  approved: "Approved",
  rejected: "Rejected",
  waiting_for_payment: "Waiting for Payment",
  paid: "Paid",
  printing: "Printing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
} as const;

export const ORDER_FLOW = [
  "pending",
  "design_review",
  "approved",
  "waiting_for_payment",
  "paid",
  "printing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
] as const;
