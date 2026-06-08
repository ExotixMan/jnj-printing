import Link from "next/link";
import {
  faCheck,
  faClipboardList,
  faPesoSign,
  faPrint,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const dynamic = "force-dynamic";

const nextSteps = [
  {
    icon: faClipboardList,
    title: "Staff reviews your order",
    description:
      "Your design, product details, size, quantity, color, and placement will be checked by staff.",
  },
  {
    icon: faPesoSign,
    title: "Final price confirmation",
    description:
      "Staff will confirm the final price based on your design, print size, and quantity.",
  },
  {
    icon: faPrint,
    title: "Production starts",
    description:
      "Once payment is confirmed, your order will move to the printing process.",
  },
  {
    icon: faBoxOpen,
    title: "Ready for pickup",
    description:
      "You will be notified when your custom order is ready for pickup.",
  },
];

const timeline = [
  {
    status: "Pending",
    active: true,
  },
  {
    status: "Design Review",
    active: false,
  },
  {
    status: "Waiting for Payment",
    active: false,
  },
  {
    status: "Printing",
    active: false,
  },
  {
    status: "Ready for Pickup",
    active: false,
  },
];

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params?.orderNumber || "JNJ-0001";

  return (
    <main className="min-h-screen bg-[var(--cream)] px-4 py-12 md:px-8 xl:px-16">
      <div className="mx-auto max-w-5xl">
        {/* TOP CARD */}
        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[0_18px_50px_rgba(13,13,20,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(75,0,110,0.08)] text-[var(--purple)]">
            <FontAwesomeIcon icon={faCheck} className="h-6 w-6" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
            Order Request Submitted
          </p>

          <h1 className="mt-3 font-display text-[clamp(36px,4vw,58px)] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--text)]">
            Your custom order
            <br />
            is now under review.
          </h1>

          <p className="mx-auto mt-5 max-w-[620px] font-body text-[17px] leading-[1.75] text-[var(--muted)]">
            Thank you for sending your request. Our staff will review your
            design and order details first before confirming the final price.
          </p>

          <div className="mx-auto mt-8 max-w-[520px] rounded-[24px] bg-[var(--cream)] p-5 border">
            <div className="grid gap-4 text-left text-sm md:grid-cols-2">
              <div>
                <p className="text-[var(--muted)]">Order Number</p>
                <p className="mt-1 font-bold text-[var(--text)]">{orderNumber}</p>
              </div>

              <div>
                <p className="text-[var(--muted)]">Current Status</p>
                <p className="mt-1 font-bold text-[var(--purple)]">
                  Pending
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`/customer/orders/${encodeURIComponent(orderNumber)}`}
              className="rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--purple)]"
            >
              Track My Order
            </Link>

            <Link
              href="/#home"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--cream)]"
            >
              Back to Home
            </Link>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mt-8 rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_18px_50px_rgba(13,13,20,0.06)]">
          <div className="mb-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
              Order Timeline
            </p>

            <h2 className="font-display text-[30px] font-semibold text-[var(--text)]">
              What happens next?
            </h2>
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-5">
            {timeline.map((item, index) => (
              <div key={index} className="h-full">
                <div
                  className={`flex h-full min-h-[120px] flex-col justify-between rounded-[22px] border p-4 ${
                    item.active
                      ? "border-[var(--purple)] bg-[rgba(75,0,110,0.08)]"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      item.active
                        ? "bg-[var(--purple2)] text-white"
                        : "bg-[var(--cream)] text-[var(--muted)]"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <p
                    className={`mt-4 text-sm font-semibold ${
                      item.active ? "text-[var(--purple)]" : "text-[var(--text)]"
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NEXT STEPS */}
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {nextSteps.map((item, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_10px_30px_rgba(13,13,20,0.04)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(75,0,110,0.08)] text-[var(--purple)]">
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
              </div>

              <h3 className="font-display text-[22px] font-semibold text-[var(--text)]">
                {item.title}
              </h3>

              <p className="mt-3 font-body text-sm leading-[1.7] text-[var(--muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
