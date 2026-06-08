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
    const filePath = String(body.filePath ?? "");
    const fileName = String(body.fileName ?? "");
    const mimeType = String(body.mimeType ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);

    if (!filePath || !fileName) return NextResponse.json({ error: "Missing uploaded file metadata." }, { status: 400 });
    if (!filePath.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Invalid file path." }, { status: 403 });
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType as never)) return NextResponse.json({ error: "Design file must be an image." }, { status: 400 });
    if (sizeBytes > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Maximum file size is 300MB." }, { status: 400 });

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id")
      .eq("order_number", orderNumber)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const { error } = await admin.from("design_uploads").insert({
      order_id: order.id,
      bucket: "design-files",
      file_path: filePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      uploaded_by: user.id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected design upload error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
