"use client";

import Image from "next/image";
import Link from "next/link";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/auth-roles";
import { Turnstile } from "@marsidev/react-turnstile";
import FloatingActions from "../_components/FloatingActions";

export const dynamic = "force-dynamic";

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const STAFF_EMAIL_OTP_ROLES = new Set(["admin", "staff"]);

function requiresLoginEmailOtp(role?: string | null) {
  return !!role && STAFF_EMAIL_OTP_ROLES.has(role.toLowerCase());
}

function validateOtp(v: string) {
  return /^\d{8}$/.test(v.trim());
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

export default function LoginPage() {
  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError = emailTouched && !validateEmail(email.trim()) ? "Enter a valid email address." : "";
  const passwordError = passwordTouched && password.length < 6 ? "Password must be at least 6 characters." : "";

  const [loginStep, setLoginStep] = useState<"credentials" | "otp">("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpTouched, setOtpTouched] = useState(false);

  const otpError = otpTouched && !validateOtp(otp) ? "Enter the 6-digit code sent to your email." : "";

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaKey((key) => key + 1);
  }, []);

  const sendLoginOtp = useCallback(async (targetEmail: string) => {
    const supabase = createClient();

    return supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false,
      },
    });
  }, []);

  const handleLogin = useCallback(async () => {
    setEmailTouched(true);
    setPasswordTouched(true);

    const normalizedEmail = email.trim();

    if (!validateEmail(normalizedEmail) || password.length < 6) return;

    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);
    setServerError("");
    setStatusMessage("");
    setCaptchaError("");

    try {
      const captchaResp = await fetch("/api/auth/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaToken }),
      });

      const captchaJson = await captchaResp.json().catch(() => ({}));

      if (!captchaResp.ok) {
        setCaptchaError(
          captchaJson?.error || "CAPTCHA verification failed. Please try again."
        );
        resetCaptcha();
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (/email not confirmed|not confirmed|confirm/i.test(error.message)) {
          setServerError(
            "Please verify your email first. Check your inbox and click the confirmation link before signing in."
          );
        } else {
          setServerError(error.message);
        }

        resetCaptcha();
        return;
      }

      if (!data.user) {
        setServerError("Unable to sign in. Please try again.");
        resetCaptcha();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setServerError("Unable to verify your account role. Please try again.");
        resetCaptcha();
        return;
      }

      const role = profile?.role ?? null;

      if (requiresLoginEmailOtp(role)) {
        await supabase.auth.signOut();

        const { error: otpSendError } = await sendLoginOtp(normalizedEmail);

        if (otpSendError) {
          setServerError(
            otpSendError.message || "Unable to send the email verification code. Please try again."
          );
          resetCaptcha();
          return;
        }

        setPendingEmail(normalizedEmail);
        setPendingRole(role);
        setOtp("");
        setOtpTouched(false);
        setPassword("");
        setPasswordTouched(false);
        setLoginStep("otp");
        setStatusMessage("We sent a 6-digit verification code to your email. Enter it to complete sign in.");
        resetCaptcha();
        return;
      }

      router.push(getDashboardPathForRole(role));
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [email, password, captchaToken, router, resetCaptcha, sendLoginOtp]);

  const handleVerifyOtp = useCallback(async () => {
    setOtpTouched(true);

    const normalizedEmail = pendingEmail || email.trim();
    const normalizedOtp = otp.trim();

    if (!validateEmail(normalizedEmail) || !validateOtp(normalizedOtp)) return;

    setLoading(true);
    setServerError("");
    setStatusMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedOtp,
        type: "email",
      });

      if (error) {
        setServerError("Invalid or expired verification code. Please try again or request a new code.");
        return;
      }

      if (!data.user) {
        setServerError("Unable to verify this login. Please try again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setServerError("Unable to verify your account role. Please try again.");
        return;
      }

      const role = profile?.role ?? null;

      if (!requiresLoginEmailOtp(role)) {
        await supabase.auth.signOut();
        setLoginStep("credentials");
        setPendingEmail("");
        setPendingRole(null);
        setOtp("");
        setServerError("This email verification step is only for admin and staff accounts. Please sign in again.");
        return;
      }

      router.push(getDashboardPathForRole(role));
      router.refresh();
    } catch {
      setServerError("Something went wrong while verifying your code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, otp, pendingEmail, router]);

  const handleResendOtp = useCallback(async () => {
    if (!pendingEmail) return;

    setLoading(true);
    setServerError("");
    setStatusMessage("");

    try {
      const { error } = await sendLoginOtp(pendingEmail);

      if (error) {
        setServerError(error.message || "Unable to resend the verification code. Please try again.");
        return;
      }

      setOtp("");
      setOtpTouched(false);
      setStatusMessage("We sent a new verification code to your email.");
    } catch {
      setServerError("Something went wrong while resending the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pendingEmail, sendLoginOtp]);

  const handleBackToLogin = useCallback(() => {
    setLoginStep("credentials");
    setPendingEmail("");
    setPendingRole(null);
    setOtp("");
    setOtpTouched(false);
    setServerError("");
    setStatusMessage("");
    resetCaptcha();
  }, [resetCaptcha]);

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
                Welcome Back
              </p>

              <h1 className="font-display text-[clamp(40px,4.5vw,68px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)]">
                Track your
                <br />
                custom printing
                <br />
                orders easily.
              </h1>

              <p className="mt-6 text-[16px] leading-[1.75] text-[var(--muted)]">
                Sign in to view your previous orders, check staff updates, upload
                payment proof, and track your order until pickup.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <FeatureCard number="01" label="View orders" />
                <FeatureCard number="02" label="Track status" />
                <FeatureCard number="03" label="Upload proof" />
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col justify-center border-[var(--border)] bg-[var(--surface)] px-6 py-12 sm:px-10 lg:min-h-screen lg:border-l lg:px-12">

            {/* inner content capped so it doesn't hug the edges */}
            <div className="mx-auto w-full max-w-md">

              {/* mobile logo */}
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

              {/* header */}
              <div className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                  Sign In
                </p>
                <h2 className="font-display text-[clamp(28px,3.5vw,38px)] font-semibold leading-tight text-[var(--text)]">
                  {loginStep === "otp" ? "Verify your email" : "Access your account"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {loginStep === "otp"
                    ? "Admin and staff accounts must verify by email every time before opening the dashboard."
                    : "Continue to your orders, payment updates, and custom printing requests."}
                </p>
              </div>

              {/* form */}
              {loginStep === "credentials" ? (
                <form
                  className="space-y-5"
                  onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
                  noValidate
                >
                  {/* email */}
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--text)]">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailTouched) setEmailTouched(true); }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="example@email.com"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className={[
                        "w-full rounded-2xl border bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors",
                        emailError
                          ? "border-red-400 focus:border-red-500"
                          : emailTouched && validateEmail(email.trim())
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-[var(--border)] focus:border-[var(--purple)]",
                      ].join(" ")}
                    />
                    {emailError && (
                      <p id="email-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <span aria-hidden="true">✕</span>{emailError}
                      </p>
                    )}
                    {!emailError && emailTouched && validateEmail(email.trim()) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                        <span aria-hidden="true">✓</span>Looks good!
                      </p>
                    )}
                  </div>

                  {/* password */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="password" className="block text-sm font-semibold text-[var(--text)]">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-xs font-semibold text-[var(--purple)] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        placeholder="Enter your password"
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? "password-error" : undefined}
                        className={[
                          "w-full rounded-2xl border bg-[var(--surface)] py-3 pl-4 pr-11 text-sm outline-none transition-colors",
                          passwordError
                            ? "border-red-400 focus:border-red-500"
                            : passwordTouched && password.length >= 6
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
                    {passwordError && (
                      <p id="password-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <span aria-hidden="true">✕</span>{passwordError}
                      </p>
                    )}
                    {!passwordError && passwordTouched && password.length >= 6 && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                        <span aria-hidden="true">✓</span>Password looks good!
                      </p>
                    )}
                  </div>

                  {/* remember me */}
                  <label className="flex cursor-pointer select-none items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded accent-(--purple)"
                    />
                    <span className="text-sm text-[var(--muted)]">Remember me on this device</span>
                  </label>

                  {/* captcha */}
                  <div>
                    <Turnstile
                      key={captchaKey}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                        setCaptchaError("");
                      }}
                      onExpire={() => {
                        setCaptchaToken("");
                        setCaptchaError("CAPTCHA expired. Please verify again.");
                      }}
                      onError={() => {
                        setCaptchaToken("");
                        setCaptchaError("CAPTCHA failed to load. Please refresh and try again.");
                      }}
                      options={{
                        theme: "light",
                        size: "normal",
                      }}
                    />

                    {captchaError && (
                      <p
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                      >
                        <span aria-hidden="true">✕</span>
                        {captchaError}
                      </p>
                    )}
                  </div>

                  {/* server error */}
                  {serverError && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-red-500">✕</span>
                      {serverError}
                    </div>
                  )}

                  {/* submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--purple)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in…
                      </span>
                    ) : "Sign In"}
                  </button>
                </form>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}
                  noValidate
                >
                  <div className="rounded-2xl bg-[var(--cream)] p-4 text-sm leading-6 text-[var(--muted)]">
                    We sent a 6-digit code to <strong className="text-[var(--text)]">{pendingEmail}</strong>.
                    {pendingRole ? ` This ${pendingRole} account must complete email verification every login.` : " This account must complete email verification every login."}
                  </div>

                  <div>
                    <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-[var(--text)]">
                      Email verification code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      required
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      onBlur={() => setOtpTouched(true)}
                      placeholder="123456"
                      aria-invalid={!!otpError}
                      aria-describedby={otpError ? "otp-error" : undefined}
                      className={[
                        "w-full rounded-2xl border bg-[var(--surface)] px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] outline-none transition-colors",
                        otpError
                          ? "border-red-400 focus:border-red-500"
                          : otpTouched && validateOtp(otp)
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-[var(--border)] focus:border-[var(--purple)]",
                      ].join(" ")}
                    />
                    {otpError && (
                      <p id="otp-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <span aria-hidden="true">✕</span>{otpError}
                      </p>
                    )}
                    {!otpError && otpTouched && validateOtp(otp) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                        <span aria-hidden="true">✓</span>Code format looks good!
                      </p>
                    )}
                  </div>

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
                    disabled={loading}
                    className="w-full rounded-full bg-[var(--purple2)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--purple)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying…
                      </span>
                    ) : "Verify and Sign In"}
                  </button>

                  <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-[var(--purple)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      disabled={loading}
                      className="text-[var(--muted)] hover:text-[var(--purple)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              )}

              {/* sign-up nudge */}
              <div className="mt-6 rounded-2xl bg-[var(--cream)] p-4 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-semibold text-[var(--purple)] hover:underline">
                    Create one
                  </Link>
                </p>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-[var(--muted-2)]">
                You need an account to create custom orders and track order updates.
              </p>
            </div>
          </section>
        </div>
      </main>
      <FloatingActions />
    </>
  );
}
