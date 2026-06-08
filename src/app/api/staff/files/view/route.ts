import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_BUCKETS = new Set(["design-files", "payment-proofs"]);

type DesignUploadFile = {
  id: string;
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
};

type PaymentFile = {
  id: string;
  proof_bucket: string;
  proof_path: string | null;
  proof_file_name: string | null;
};

type FileLookupResult =
  | {
      ok: false;
      error: string;
      status: number;
    }
  | {
      ok: true;
      bucket: string;
      path: string;
      name: string;
      mimeType: string | null;
    };

export async function GET(request: NextRequest) {
  await requireRole(["admin", "staff"]);

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind")?.trim();
  const id = searchParams.get("id")?.trim();

  if (kind !== "design" && kind !== "payment") {
    return fileError("Invalid file type.", 400);
  }

  if (!id) {
    return fileError("Missing file ID.", 400);
  }

  const admin = createAdminClient();

  const file =
    kind === "design"
      ? await getDesignUploadFile(admin, id)
      : await getPaymentFile(admin, id);

  if (!file.ok) {
    return fileError(file.error, file.status);
  }

  const bucket = file.bucket;
  const rawPath = file.path;

  if (!bucket || !rawPath) {
    return fileError("This record has no storage bucket or file path.", 404);
  }

  const path = normalizeStoragePath(rawPath, bucket);

  if (!path) {
    return fileError("This record has no valid storage file path.", 404);
  }

  const fileName = sanitizeFileName(
    file.name || path.split("/").pop() || "file",
  );

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return fileError(
      `Bucket '${bucket}' is not allowed. Add it to ALLOWED_BUCKETS in app/api/staff/files/view/route.ts if this is your real bucket.`,
      403,
    );
  }

  if (!isSafeStoragePath(path)) {
    return fileError("Invalid storage file path.", 400);
  }

  const { data, error } = await admin.storage.from(bucket).download(path);

  if (error || !data) {
    return fileError(
      `Could not read file from Supabase Storage. Bucket: ${bucket}. Path: ${path}. ${error?.message ?? ""}`,
      404,
    );
  }

  const body = await data.arrayBuffer();
  const contentType = file.mimeType || data.type || guessContentType(fileName);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function getDesignUploadFile(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<FileLookupResult> {
  const { data, error } = await admin
    .from("design_uploads")
    .select("id, bucket, file_path, file_name, mime_type")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Design upload not found.",
      status: 404,
    };
  }

  const row = data as DesignUploadFile;

  return {
    ok: true,
    bucket: row.bucket || "design-files",
    path: row.file_path,
    name: row.file_name,
    mimeType: row.mime_type,
  };
}

async function getPaymentFile(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<FileLookupResult> {
  const { data, error } = await admin
    .from("payments")
    .select("id, proof_bucket, proof_path, proof_file_name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Payment proof not found.",
      status: 404,
    };
  }

  const row = data as PaymentFile;

  return {
    ok: true,
    bucket: row.proof_bucket || "payment-proofs",
    path: row.proof_path ?? "",
    name: row.proof_file_name ?? "payment-proof",
    mimeType: null,
  };
}

function normalizeStoragePath(rawPath: string, bucket: string) {
  const value = rawPath.trim();

  // Correct value: folder/file.png
  if (!/^https?:\/\//i.test(value)) {
    return stripBucketPrefix(value, bucket);
  }

  try {
    const url = new URL(value);
    const decodedPath = decodeURIComponent(url.pathname);
    const bucketNeedle = `/${bucket}/`;
    const index = decodedPath.indexOf(bucketNeedle);

    if (index >= 0) {
      return decodedPath.slice(index + bucketNeedle.length);
    }
  } catch {
    // Validation below will reject invalid paths.
  }

  return value;
}

function stripBucketPrefix(path: string, bucket: string) {
  const clean = path.replace(/^\/+/, "");
  const prefix = `${bucket}/`;

  return clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
}

function isSafeStoragePath(path: string) {
  return (
    Boolean(path) &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/\r\n"]/g, "_").slice(0, 160) || "file";
}

function guessContentType(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".svg")) return "image/svg+xml";

  return "application/octet-stream";
}

function fileError(message: string, status: number) {
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>File unavailable</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px;line-height:1.5;color:#1f2937">
  <h1 style="font-size:18px;margin:0 0 8px">File unavailable</h1>
  <p style="margin:0 0 12px;color:#4b5563">${escapeHtml(message)}</p>
  <p style="font-size:13px;color:#6b7280">Check that the storage bucket name and stored file path match the record in Supabase.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}