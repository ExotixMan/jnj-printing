import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen bg-[var(--cream)] px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
          Verify your email
        </p>

        <h1 className="font-display text-3xl font-semibold text-[var(--text)]">
          Check your inbox
        </h1>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          We sent a verification link to your email address. Please open the
          email and click the confirmation link before signing in.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--purple)]"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}