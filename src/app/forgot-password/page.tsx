"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists for that email, you will receive a password reset email shortly."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Side */}
        <section className="hidden flex-col justify-center px-12 py-16 xl:px-20 lg:flex">
          <div className="max-w-lg">
            <Link href="/" className="mb-12 inline-flex items-center gap-3">
              <Image
                src="/Logo.png"
                alt="JNJ Printing Logo"
                width={50}
                height={50}
                priority
                className="h-auto w-12 rounded object-contain"
              />

              <div>
                <strong className="block font-display text-[20px] font-semibold text-[var(--text)]">
                  JNJ Printing
                </strong>
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Custom prints made simple
                </span>
              </div>
            </Link>

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
              Password Recovery
            </p>

            <h1 className="font-display text-[clamp(40px,4.5vw,68px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)]">
              Reset your
              <br />
              password
              <br />
              securely.
            </h1>

            <p className="mt-6 text-[16px] leading-[1.75] text-[var(--muted)]">
              Enter your account email and we’ll send you a secure link to create
              a new password for your JNJ Printing account.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-bold text-[var(--purple)]">01</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                  Enter email
                </p>
              </div>

              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-bold text-[var(--purple)]">02</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                  Check inbox
                </p>
              </div>

              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-bold text-[var(--purple)]">03</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                  New password
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Side */}
        <section className="flex w-full flex-col justify-center border-[var(--border)] bg-[var(--surface)] px-6 py-12 sm:px-10 lg:min-h-screen lg:border-l lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-3 lg:hidden">
              <Image
                src="/Logo.png"
                alt="JNJ Printing Logo"
                width={44}
                height={44}
                priority
                className="h-auto w-11 rounded object-contain"
              />

              <div>
                <strong className="block font-display text-[17px] font-semibold text-[var(--text)]">
                  JNJ Printing
                </strong>
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Custom prints made simple
                </span>
              </div>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                Forgot Password
              </p>

              <h2 className="font-display text-[clamp(28px,3.5vw,38px)] font-semibold leading-tight text-[var(--text)]">
                Reset your password
              </h2>

              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Enter the email for your account and we’ll send password reset
                instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[var(--text)]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--purple)]"
                />
              </div>

              {message && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--purple)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset email"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--cream)]"
              >
                Back to Sign in
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-[var(--muted-2)]">
              For your security, the reset link may expire. Use the latest email
              from JNJ Printing.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
