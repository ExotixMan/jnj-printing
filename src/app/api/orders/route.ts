import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateOrderTotal } from "@/lib/price";

export async function POST(req: Request) {
  try {
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const garmentProductId = String(body.garmentProductId ?? "");
    const printingServiceId = String(body.printingServiceId ?? "");
    const colorId = body.colorId ? String(body.colorId) : null;
    const colorCustom = body.colorCustom ? String(body.colorCustom).trim() : null;
    const placement = String(body.placement ?? "Front").trim();
    const specialInstructions = body.specialInstructions ? String(body.specialInstructions).trim() : null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!garmentProductId || !printingServiceId) {
      return NextResponse.json({ error: "Product and printing service are required." }, { status: 400 });
    }

    if (!placement) return NextResponse.json({ error: "Print placement is required." }, { status: 400 });

    const admin = createAdminClient();

    const [{ data: profile }, { data: product }, { data: service }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      admin.from("garment_products").select("id, name, base_price, has_sizes, active").eq("id", garmentProductId).eq("active", true).maybeSingle(),
      admin.from("printing_services").select("id, name, price, active").eq("id", printingServiceId).eq("active", true).maybeSingle(),
    ]);

    if (profile?.role !== "customer") {
      return NextResponse.json({ error: "Only customers can create orders." }, { status: 403 });
    }

    if (!product || !service) {
      return NextResponse.json({ error: "Selected product or service is unavailable." }, { status: 400 });
    }

    const normalizedItems = items
      .map((item: Record<string, unknown>) => ({
        size_id: item.sizeId ? String(item.sizeId) : null,
        quantity: Math.floor(Number(item.quantity ?? 0)),
      }))
      .filter((item: { size_id: string | null; quantity: number }) => item.quantity > 0);

    const quantity = normalizedItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
    if (quantity <= 0) return NextResponse.json({ error: "Quantity must be greater than zero." }, { status: 400 });

    const estimatedPrice = calculateOrderTotal({
      garmentBasePrice: Number(product.base_price),
      printingServicePrice: Number(service.price),
      quantity,
    });

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: user.id,
        garment_product_id: garmentProductId,
        printing_service_id: printingServiceId,
        color_id: colorId,
        color_custom: colorCustom,
        placement,
        quantity,
        estimated_price: estimatedPrice,
        final_price: estimatedPrice,
        special_instructions: specialInstructions,
        status: "pending",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Failed to create order." }, { status: 500 });
    }

    if (normalizedItems.length > 0) {
      const { error: itemError } = await admin.from("order_items").insert(
        normalizedItems.map((item: { size_id: string | null; quantity: number }) => ({
          order_id: order.id,
          size_id: item.size_id,
          quantity: item.quantity,
        }))
      );
      if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    await admin.from("order_status_logs").insert({
      order_id: order.id,
      status: "pending",
      remarks: "Order request submitted by customer.",
      changed_by: user.id,
    });

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected order error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
