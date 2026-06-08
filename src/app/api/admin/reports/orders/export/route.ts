import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils/format";
import type { OrderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportOrder = {
  order_number: string;
  quantity: number;
  status: OrderStatus;
  estimated_price: number;
  final_price: number | null;
  created_at: string;
  profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  garment_products: { name: string } | { name: string }[] | null;
  printing_services: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function requireAdminResponse() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { ok: true as const, admin };
}

export async function GET(req: Request) {
  const guard = await requireAdminResponse();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "xlsx";

  const { data } = await guard.admin
    .from("orders")
    .select("order_number, quantity, status, estimated_price, final_price, created_at, profiles(first_name,last_name), garment_products(name), printing_services(name)")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as ExportOrder[];
  const rows = orders.map(toRow);

  if (format === "pdf") {
    const pdf = buildSimplePdf(rows);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="jnj-orders-report.pdf"`,
      },
    });
  }

  const excelHtml = buildExcelHtml(rows);
  return new NextResponse(excelHtml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="jnj-orders-report.xls"`,
    },
  });
}

function toRow(order: ExportOrder) {
  const customer = one(order.profiles);
  return {
    orderNumber: order.order_number,
    customer: customer ? `${customer.first_name} ${customer.last_name}` : "—",
    product: one(order.garment_products)?.name ?? "—",
    service: one(order.printing_services)?.name ?? "—",
    quantity: order.quantity,
    status: order.status,
    price: Number(order.final_price ?? order.estimated_price ?? 0),
    created: formatDate(order.created_at),
  };
}

function buildExcelHtml(rows: ReturnType<typeof toRow>[]) {
  const tableRows = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.orderNumber)}</td>
      <td>${escapeHtml(row.customer)}</td>
      <td>${escapeHtml(row.product)}</td>
      <td>${escapeHtml(row.service)}</td>
      <td>${row.quantity}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>${row.price}</td>
      <td>${escapeHtml(row.created)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #4b006e; color: #ffffff; font-weight: 700; }
    th, td { border: 1px solid #d9d9d9; padding: 8px; }
  </style>
</head>
<body>
  <h2>JNJ Printing Orders Report</h2>
  <p>Generated: ${escapeHtml(formatDate(new Date()))}</p>
  <table>
    <thead>
      <tr>
        <th>Order Number</th>
        <th>Customer</th>
        <th>Product</th>
        <th>Service</th>
        <th>Quantity</th>
        <th>Status</th>
        <th>Price</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;
}

function buildSimplePdf(rows: ReturnType<typeof toRow>[]) {
  const visibleRows = rows.slice(0, 70);
  const lines = [
    "JNJ Printing Orders Report",
    `Generated: ${formatDate(new Date())}`,
    "",
    ...visibleRows.map((row) => `${row.orderNumber} | ${row.customer} | ${row.product} | ${row.service} | Qty ${row.quantity} | ${row.status} | PHP ${row.price.toLocaleString("en-PH")}`),
  ];

  if (rows.length > visibleRows.length) {
    lines.push(`Showing first ${visibleRows.length} of ${rows.length} orders.`);
  }

  const stream = [
    "BT",
    "/F1 16 Tf",
    "42 800 Td",
    ...lines.flatMap((line, index) => {
      const font = index === 0 ? "/F1 16 Tf" : "/F1 8 Tf";
      const movement = index === 0 ? "" : "0 -14 Td";
      return [font, movement, `(${escapePdf(line.slice(0, 115))}) Tj`].filter(Boolean);
    }),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapePdf(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}
