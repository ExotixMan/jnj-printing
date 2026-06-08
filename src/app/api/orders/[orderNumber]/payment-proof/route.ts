import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const proofPath = String(body.filePath ?? "");
    const proofFileName = String(body.fileName ?? "");
    const mimeType = String(body.mimeType ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);

    if (!proofPath || !proofFileName) return NextResponse.json({ error: "Missing payment proof metadata." }, { status: 400 });
    if (!proofPath.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Invalid file path." }, { status: 403 });
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType as never)) return NextResponse.json({ error: "Payment proof must be an image." }, { status: 400 });
    if (sizeBytes > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Maximum file size is 300MB." }, { status: 400 });

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, final_price, status")
      .eq("order_number", orderNumber)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!["approved", "waiting_for_payment"].includes(order.status)) {
      return NextResponse.json({ error: "Payment proof can only be uploaded after order approval." }, { status: 400 });
    }

    const { error } = await admin.from("payments").insert({
      order_id: order.id,
      method: "gcash",
      amount: order.final_price,
      status: "pending",
      proof_bucket: "payment-proofs",
      proof_path: proofPath,
      proof_file_name: proofFileName,
      remarks: `Customer uploaded ${proofFileName} (${mimeType}, ${sizeBytes} bytes).`,
      uploaded_by: user.id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin.from("order_status_logs").insert({
      order_id: order.id,
      status: order.status,
      remarks: "GCash payment proof uploaded by customer.",
      changed_by: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected payment proof error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
