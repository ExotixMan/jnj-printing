import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, status, customer_id")
      .eq("order_number", orderNumber)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Orders can only be cancelled while status is Pending." }, { status: 400 });
    }

    const { error } = await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin.from("order_status_logs").insert({
      order_id: order.id,
      status: "cancelled",
      remarks: "Order cancelled by customer.",
      changed_by: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected cancellation error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
