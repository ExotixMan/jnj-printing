"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import FloatingActions from "../_components/FloatingActions";
import Footer from "../_components/Footer";
import Navbar from "../_components/Navbar";

const businessEmail = "jnjprinting.staff@gmail.com";
const phoneNumber = "+639568030775";
const facebookUrl = "https://www.facebook.com/profile.php?id=100063887535544";

const contactCards = [
  {
    title: "Message us",
    value: "Facebook / Messenger",
    description: "Best for quick questions and quotation requests.",
    href: facebookUrl,
    action: "Open Facebook",
  },
  {
    title: "Call us",
    value: "0956 803 0775",
    description: "For urgent concerns or order follow-ups.",
    href: `tel:${phoneNumber}`,
    action: "Call now",
  },
  {
    title: "Email us",
    value: businessEmail,
    description: "Send your design details, sizes, and quantity.",
    href: `mailto:${businessEmail}`,
    action: "Send email",
  },
];

const services = [
  "Custom shirts",
  "Uniforms",
  "Jerseys",
  "DTF printing",
  "Sublimation",
  "Silkscreen",
];

export default function ContactPage() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const name = String(formData.get("name") || "");
    const contact = String(formData.get("contact") || "");
    const email = String(formData.get("email") || "");
    const service = String(formData.get("service") || "");
    const message = String(formData.get("message") || "");

    const subject = encodeURIComponent(`JNJ Printing Inquiry - ${service || "General"}`);

    const body = encodeURIComponent(
      `Name: ${name}
Contact Number: ${contact}
Email: ${email}
Service Interested In: ${service}

Message:
${message}`
    );

    window.location.href = `mailto:${businessEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--cream)] text-[var(--text)]">
        <section className="px-4 py-8 sm:px-6 lg:px-16 lg:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3">
                <Image
                  src="/Logo.png"
                  alt="JNJ Printing Logo"
                  width={52}
                  height={52}
                  priority
                  className="h-auto w-12 rounded object-contain"
                />

                <div>
                  <strong className="block font-display text-lg font-semibold text-[var(--text)]">
                    JNJ Printing
                  </strong>
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Custom prints made simple
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                    Contact Us
                  </p>

                  <h1 className="font-display text-[clamp(34px,7vw,64px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)]">
                    Let&apos;s talk about your custom print.
                  </h1>
                </div>

                <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Have a question about shirts, uniforms, jerseys, printing options,
                  pricing, or availability? Send us your details and we&apos;ll guide
                  you with the next steps.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-4">
                {contactCards.map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                    className="block rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-muted)]"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                      {card.title}
                    </p>

                    <h2 className="mt-3 break-words text-base font-semibold text-[var(--text)]">
                      {card.value}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {card.description}
                    </p>

                    <p className="mt-4 text-sm font-semibold text-[var(--purple)]">
                      {card.action} →
                    </p>
                  </a>
                ))}

                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                    Reminder
                  </p>

                  <h2 className="text-lg font-semibold text-[var(--text)]">
                    For faster quotations
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Include your product, quantity, size, color, printing method,
                    and deadline so we can respond faster.
                  </p>
                </div>
              </div>

              <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
                <div className="mb-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                    Send an Inquiry
                  </p>

                  <h2 className="font-display text-2xl font-semibold text-[var(--text)] sm:text-3xl">
                    Tell us what you need
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    This will open your email app with your inquiry details ready to send.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-semibold text-[var(--text)]"
                      >
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--purple)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact"
                        className="mb-2 block text-sm font-semibold text-[var(--text)]"
                      >
                        Contact number
                      </label>
                      <input
                        id="contact"
                        name="contact"
                        type="text"
                        required
                        placeholder="09XXXXXXXXX"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--purple)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-[var(--text)]"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="example@email.com"
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--purple)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service"
                      className="mb-2 block text-sm font-semibold text-[var(--text)]"
                    >
                      What are you interested in?
                    </label>
                    <select
                      id="service"
                      name="service"
                      defaultValue=""
                      required
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--purple)]"
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      <option>Custom shirts</option>
                      <option>Uniforms</option>
                      <option>Jerseys</option>
                      <option>DTF printing</option>
                      <option>Sublimation</option>
                      <option>Silkscreen</option>
                      <option>Other inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-semibold text-[var(--text)]"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Tell us your size, color, quantity, design idea, or question..."
                      className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--purple)]"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--purple)] sm:w-auto"
                    >
                      Send Inquiry →
                    </button>

                    <Link
                      href="/custom-order"
                      className="text-center text-sm font-semibold text-[var(--purple)] hover:underline"
                    >
                      Ready to order? Go to order page
                    </Link>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </>
  );
}