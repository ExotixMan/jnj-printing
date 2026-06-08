"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { safeFileName } from "@/lib/utils/format";

export default function PaymentProofForm({ orderNumber, orderId }: { orderNumber: string; orderId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function validate(fileToCheck: File | null) {
    if (!fileToCheck) return "Please select a GCash receipt screenshot.";
    if (!ALLOWED_IMAGE_TYPES.includes(fileToCheck.type as never)) return "Payment proof must be an image file.";
    if (fileToCheck.size > MAX_UPLOAD_BYTES) return "Maximum file size is 300MB.";
    return "";
  }

  async function handleSubmit() {
    const validationError = validate(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !file) throw new Error("Your session expired. Please sign in again.");

      const path = `${user.id}/${orderId}/payment-proofs/${Date.now()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: path, fileName: file.name, mimeType: file.type, sizeBytes: file.size }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Failed to upload payment proof.");

      setMessage("Payment proof uploaded successfully. Please wait for staff confirmation.");
      setFile(null);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to upload payment proof.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">Payment Proof</p>
        <h3 className="mt-1 font-display text-[22px] font-semibold text-[var(--text)]">Upload GCash receipt</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">After paying through GCash, upload an image screenshot of your payment receipt for staff confirmation.</p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--cream)] px-6 py-8 text-center transition-colors hover:bg-[var(--surface-muted)]">
        <span className="text-sm font-semibold text-[var(--text)]">{file ? file.name : "Click to upload GCash receipt"}</span>
        <span className="mt-2 text-xs text-[var(--muted)]">Image file only, maximum 300MB</span>
        <input type="file" className="hidden" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>

      {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}

      <button type="button" onClick={handleSubmit} disabled={loading} className="mt-5 w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--purple)] disabled:opacity-60">
        {loading ? "Submitting..." : "Submit Payment Proof"}
      </button>
    </div>
  );
}
