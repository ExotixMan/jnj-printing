"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (!confirm("Cancel this order? This is only allowed while the order is Pending.")) return;
    setLoading(true);
    setError("");
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) setError(json.error || "Failed to cancel order.");
    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <button type="button" onClick={handleCancel} disabled={loading} className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60">
        {loading ? "Cancelling..." : "Cancel Order"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
