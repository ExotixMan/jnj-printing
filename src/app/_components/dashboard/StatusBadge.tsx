import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

type BadgeTone = {
  dot: string;
  badge: string;
};

const toneMap: Record<string, BadgeTone> = {
  pending:             { dot: "#f59e0b", badge: "bg-amber-100   border-amber-300   text-amber-800"   },
  design_review:       { dot: "#6366f1", badge: "bg-indigo-100  border-indigo-300  text-indigo-800"  },
  approved:            { dot: "#10b981", badge: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  rejected:            { dot: "#ef4444", badge: "bg-red-100     border-red-300     text-red-800"     },
  waiting_for_payment: { dot: "#f97316", badge: "bg-orange-100  border-orange-300  text-orange-800"  },
  paid:                { dot: "#10b981", badge: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  printing:            { dot: "#a855f7", badge: "bg-purple-100  border-purple-300  text-purple-800"  },
  ready_for_pickup:    { dot: "#0ea5e9", badge: "bg-sky-100     border-sky-300     text-sky-800"     },
  out_for_delivery:    { dot: "#3b82f6", badge: "bg-blue-100    border-blue-300    text-blue-800"    },
  completed:           { dot: "#6b7280", badge: "bg-zinc-100    border-zinc-300    text-zinc-800"    },
  cancelled:           { dot: "#ef4444", badge: "bg-red-100     border-red-300     text-red-800"     },
  // payment statuses
  confirmed:           { dot: "#10b981", badge: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  failed:              { dot: "#ef4444", badge: "bg-red-100     border-red-300     text-red-800"     },
  refunded:            { dot: "#6b7280", badge: "bg-zinc-100    border-zinc-300    text-zinc-800"    },
};

const fallback: BadgeTone = { dot: "#6b7280", badge: "bg-zinc-100 border-zinc-300 text-zinc-800" };

export function StatusBadge({ status }: { status: OrderStatus | PaymentStatus }) {
  const label =
    (ORDER_STATUS_LABELS as Record<string, string>)[status] ??
    (PAYMENT_STATUS_LABELS as Record<string, string>)[status] ??
    status.replaceAll("_", " ");

  const tone = toneMap[status] ?? fallback;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}