"use client";

import Image from "next/image";
import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FloatingActions from "../_components/FloatingActions";

export const dynamic = "force-dynamic";


type PasswordStrength = {
  score: number;
  label: "Weak" | "Medium" | "Strong";
  message: string;
  percent: number;
  barClass: string;
  textClass: string;
  isStrong: boolean;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
};

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score >= 5) {
    return {
      score,
      label: "Strong",
      message: "Strong password.",
      percent: 100,
      barClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      isStrong: true,
      checks,
    };
  }

  if (score >= 3) {
    return {
      score,
      label: "Medium",
      message:
        "Password is okay, but make it stronger with uppercase, lowercase, number, and symbol.",
      percent: 66,
      barClass: "bg-yellow-500",
      textClass: "text-yellow-600",
      isStrong: false,
      checks,
    };
  }

  return {
    score,
    label: "Weak",
    message:
      "Password must include at least 8 characters, uppercase, lowercase, number, and symbol.",
    percent: password.length > 0 ? 33 : 0,
    barClass: "bg-red-500",
    textClass: "text-red-600",
    isStrong: false,
    checks,
  };
}

function validatePassword(password: string) {
  return getPasswordStrength(password).isStrong;
}

function FeatureCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-muted)]">
      <p className="text-xs font-bold text-[var(--purple)]">{number}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--text)]">{label}</p>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const passwordStrength = getPasswordStrength(password);

  const passwordError =
    passwordTouched && !passwordStrength.isStrong
        ? passwordStrength.message
        : "";

  const confirmError =
    confirmTouched && confirmPassword !== password
      ? "Passwords do not match."
      : "";

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setCanReset(!!session);
        setCheckingSession(false);

        if (session) {
          setServerError("");
        }
      }
    });

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setCanReset(!!session);
      setCheckingSession(false);

      if (!session) {
        setServerError(
          "This password reset link is invalid or expired. Please request a new reset link."
        );
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setPasswordTouched(true);
      setConfirmTouched(true);
      setServerError("");
      setStatusMessage("");

      if (!canReset) {
        setServerError(
          "This password reset session is missing. Please open the latest reset link from your email."
        );
        return;
      }

      if (!validatePassword(password) || confirmPassword !== password) return;

      setLoading(true);

      try {
        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setServerError(error.message);
          return;
        }

        setStatusMessage("Password updated successfully. Redirecting you to sign in...");

        await supabase.auth.signOut();

        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      } catch {
        setServerError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [canReset, password, confirmPassword, router]
  );

  return (
    <>
      <main className="min-h-screen bg-[var(--cream)]">
        <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
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
                Account Security
              </p>

              <h1 className="font-display text-[clamp(40px,4.5vw,68px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)]">
                Create a
                <br />
                safer password
                <br />
                for your account.
              </h1>

              <p className="mt-6 text-[16px] leading-[1.75] text-[var(--muted)]">
                Choose a new password to keep your JNJ Printing orders, payment
                updates, and account details protected.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <FeatureCard number="01" label="Secure access" />
                <FeatureCard number="02" label="Protect orders" />
                <FeatureCard number="03" label="Back to tracking" />
              </div>
            </div>
          </section>

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
                  Reset Password
                </p>
                <h2 className="font-display text-[clamp(28px,3.5vw,38px)] font-semibold leading-tight text-[var(--text)]">
                  Choose a new password
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Enter and confirm your new password below. After updating, you can sign in again.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleUpdatePassword} noValidate>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[var(--text)]">
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="Enter new password"
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      className={[
                        "w-full rounded-2xl border bg-[var(--surface)] py-3 pl-4 pr-11 text-sm outline-none transition-colors",
                        passwordError
                          ? "border-red-400 focus:border-red-500"
                          : passwordTouched && validatePassword(password)
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-[var(--border)] focus:border-[var(--purple)]",
                      ].join(" ")}
                    />

                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9b93a8] transition-colors hover:text-[var(--purple)]"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {password && (
                    <div className="mt-3 rounded-2xl bg-[var(--cream)] p-4">
                        <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--muted)]">
                            Password strength
                        </p>

                        <p className={`text-xs font-bold ${passwordStrength.textClass}`}>
                            {passwordStrength.label}
                        </p>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                            className={`h-full rounded-full transition-all ${passwordStrength.barClass}`}
                            style={{ width: `${passwordStrength.percent}%` }}
                        />
                        </div>

                        <div className="mt-3 grid gap-1.5 text-xs text-[var(--muted)]">
                        <p className={passwordStrength.checks.length ? "text-emerald-600" : ""}>
                            {passwordStrength.checks.length ? "✓" : "•"} At least 8 characters
                        </p>

                        <p className={passwordStrength.checks.uppercase ? "text-emerald-600" : ""}>
                            {passwordStrength.checks.uppercase ? "✓" : "•"} One uppercase letter
                        </p>

                        <p className={passwordStrength.checks.lowercase ? "text-emerald-600" : ""}>
                            {passwordStrength.checks.lowercase ? "✓" : "•"} One lowercase letter
                        </p>

                        <p className={passwordStrength.checks.number ? "text-emerald-600" : ""}>
                            {passwordStrength.checks.number ? "✓" : "•"} One number
                        </p>

                        <p className={passwordStrength.checks.symbol ? "text-emerald-600" : ""}>
                            {passwordStrength.checks.symbol ? "✓" : "•"} One special character
                        </p>
                        </div>
                    </div>
                    )}

                  {passwordError && (
                    <p id="password-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <span aria-hidden="true">✕</span>
                      {passwordError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[var(--text)]">
                    Confirm new password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmTouched(true)}
                      placeholder="Confirm new password"
                      aria-invalid={!!confirmError}
                      aria-describedby={confirmError ? "confirm-password-error" : undefined}
                      className={[
                        "w-full rounded-2xl border bg-[var(--surface)] py-3 pl-4 pr-11 text-sm outline-none transition-colors",
                        confirmError
                          ? "border-red-400 focus:border-red-500"
                          : confirmTouched && confirmPassword === password && confirmPassword.length > 0
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-[var(--border)] focus:border-[var(--purple)]",
                      ].join(" ")}
                    />

                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9b93a8] transition-colors hover:text-[var(--purple)]"
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>

                  {confirmError && (
                    <p id="confirm-password-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <span aria-hidden="true">✕</span>
                      {confirmError}
                    </p>
                  )}

                  {!confirmError && confirmTouched && confirmPassword === password && confirmPassword.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                      <span aria-hidden="true">✓</span>
                      Passwords match!
                    </p>
                  )}
                </div>

                {checkingSession && (
                  <div role="status" className="flex items-start gap-2.5 rounded-2xl bg-[var(--cream)] px-4 py-3 text-sm text-[var(--muted)]">
                    Checking your reset link...
                  </div>
                )}

                {statusMessage && (
                  <div role="status" className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                    {statusMessage}
                  </div>
                )}

                {serverError && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-red-500">✕</span>
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || checkingSession || !canReset}
                  className="w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--purple)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating password…
                    </span>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-[var(--cream)] p-4 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Remember your password?{" "}
                  <Link href="/login" className="font-semibold text-[var(--purple)] hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-[var(--muted-2)]">
                For your security, reset links can expire. Use the latest email from JNJ Printing.
              </p>
            </div>
          </section>
        </div>
      </main>

      <FloatingActions />
    </>
  );
}

