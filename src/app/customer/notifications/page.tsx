import Link from "next/link";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

export default async function CustomerNotificationsPage() {
  const { user } = await requireRole(["customer", "admin"]);
  const admin = createAdminClient();

  const { data: notifications } = await admin
    .from("notifications")
    .select("id, title, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (notifications ?? []) as Notification[];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--cream)] px-6 py-12 text-[var(--text)] md:px-8 xl:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                Notifications
              </p>

              <h1 className="font-display text-[clamp(32px,4vw,52px)] leading-tight text-[var(--text)]">
                All notifications
              </h1>

              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                View all updates about your orders.
              </p>
            </div>

            <Link
              href="/customer/orders"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
            >
              Back to Orders
            </Link>
          </div>

          <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]">
            {items.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-[var(--text)]">
                  No notifications yet.
                </p>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Your order updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((note) => (
                  <li key={note.id} className="px-6 py-5">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--purple-soft)] text-[var(--purple2)]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h2 className="text-sm font-bold text-[var(--text)]">
                            {note.title}
                          </h2>

                          <span className="text-xs text-[var(--muted)]">
                            {formatDate(note.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {note.message}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}