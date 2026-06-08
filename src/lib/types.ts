export type AppRole = "admin" | "staff" | "customer";

export type OrderStatus =
  | "pending"
  | "design_review"
  | "approved"
  | "rejected"
  | "waiting_for_payment"
  | "paid"
  | "printing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "confirmed" | "rejected";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  role: AppRole;
  created_at: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  base_price: number;
  has_sizes: boolean;
  active: boolean;
};

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  tag: string;
  price: number;
  active: boolean;
};

export type CatalogSize = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type CatalogColor = {
  id: string;
  name: string;
  hex: string | null;
  active: boolean;
};

export type OrderListRow = {
  id: string;
  order_number: string;
  customer_id: string;
  quantity: number;
  status: OrderStatus;
  estimated_price: number;
  final_price: number | null;
  created_at: string;
  garment_products: { name: string; base_price: number } | { name: string; base_price: number }[] | null;
  printing_services: { name: string; price: number } | { name: string; price: number }[] | null;
  profiles?: { first_name: string; last_name: string; contact_number: string | null } | { first_name: string; last_name: string; contact_number: string | null }[] | null;
};
