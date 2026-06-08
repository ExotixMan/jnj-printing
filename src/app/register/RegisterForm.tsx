"use client";

import Image from "next/image";
import Link from "next/link";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import FloatingActions from "../_components/FloatingActions";

export const dynamic = "force-dynamic";

// helpers 
function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validatePhone(v: string) {
  return /^(09|\+639)\d{9}$/.test(v.replace(/\s/g, ""));
}

function passwordStrength(v: string): 0 | 1 | 2 | 3 {
  if (v.length === 0) return 0;

  let score = 0;

  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) && /[^a-zA-Z0-9]/.test(v)) score++;

  return score as 0 | 1 | 2 | 3;
}

const strengthLabel = ["", "Weak", "Fair", "Strong"] as const;
const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"] as const;
const strengthText = ["", "text-red-500", "text-amber-500", "text-emerald-600"] as const;

// shared input class builder 
function inputCls(error: string, touched: boolean, valid: boolean) {
  return [
    "w-full rounded-2xl border bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors",
    error
      ? "border-red-400 focus:border-red-500"
      : touched && valid
      ? "border-emerald-400 focus:border-emerald-500"
      : "border-[var(--border)] focus:border-[var(--purple)]",
  ].join(" ");
}

// sub-components 
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FieldError({ id, msg }: { id: string; msg: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
    >
      <span aria-hidden="true">✕</span>
      {msg}
    </p>
  );
}

function FieldOk({ msg }: { msg: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
      <span aria-hidden="true">✓</span>
      {msg}
    </p>
  );
}

function BenefitCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-muted)]">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(75,0,110,0.08)] text-sm font-bold text-[var(--purple)]">
          {number}
        </span>

        <div>
          <h3 className="font-display text-[17px] font-semibold text-[var(--text)]">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

// page 
export default function RegisterPage() {
  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalError, setLegalError] = useState("");

  // fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // touched flags
  const [touched, setTouch] = useState({
    firstName: false,
    lastName: false,
    contact: false,
    email: false,
    password: false,
    confirm: false,
  });

  const touch = (field: keyof typeof touched) =>
    setTouch((t) => ({ ...t, [field]: true }));

  // password visibility
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  // derived validation
  const strength = passwordStrength(password);

  const errors = {
    firstName:
      touched.firstName && !firstName.trim() ? "First name is required." : "",
    lastName:
      touched.lastName && !lastName.trim() ? "Last name is required." : "",
    contact:
      touched.contact && !validatePhone(contactNumber)
        ? "Enter a valid PH number (09XXXXXXXXX)."
        : "",
    email:
      touched.email && !validateEmail(email)
        ? "Enter a valid email address."
        : "",
    password:
      touched.password && password.length < 8
        ? "Password must be at least 8 characters."
        : "",
    confirm:
      touched.confirm && password !== confirmPassword
        ? "Passwords do not match."
        : "",
  };

  const valid = useMemo(
    () => ({
      firstName: !!firstName.trim(),
      lastName: !!lastName.trim(),
      contact: validatePhone(contactNumber),
      email: validateEmail(email),
      password: password.length >= 8,
      confirm: password === confirmPassword && confirmPassword.length > 0,
    }),
    [firstName, lastName, contactNumber, email, password, confirmPassword]
  );

  // server state
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleRegister = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setTouch({
        firstName: true,
        lastName: true,
        contact: true,
        email: true,
        password: true,
        confirm: true,
      });

      if (!legalAccepted) {
        setLegalError(
          "Please agree to the Terms and Privacy Policy to continue."
        );
        return;
      }

      setLegalError("");

      if (
        !valid.firstName ||
        !valid.lastName ||
        !valid.contact ||
        !valid.email ||
        !valid.password ||
        !valid.confirm
      ) {
        return;
      }

      if (!captchaToken) {
        setCaptchaError("Please complete the CAPTCHA verification.");
        return;
      }

      setLoading(true);
      setServerError("");

      try {
        const resp = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            contactNumber,
            email,
            password,
            captchaToken,
            legalAccepted,
          }),
        });

        const json = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          if (resp.status === 409 || /already/i.test(json?.error ?? "")) {
            setServerError(
              "An account with that email already exists. Try signing in or resetting your password."
            );
          } else if (
            json?.error === "SUPABASE_SERVICE_ROLE_KEY not configured on server"
          ) {
            setServerError(
              "Registration is temporarily unavailable. Please contact support."
            );
          } else {
            setServerError(json?.error || "Failed to register. Please try again.");
          }

          setLoading(false);
          return;
        }

        setLoading(false);
        router.push("/check-email");
      } catch {
        setServerError("Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    [
      firstName,
      lastName,
      contactNumber,
      email,
      password,
      valid,
      captchaToken,
      legalAccepted,
      router,
    ]
  );

  return (
    <>
      <main className="min-h-screen bg-[var(--cream)]">
        <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
          {/* LEFT: hero info */}
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
                Why create an account?
              </p>

              <h2 className="font-display text-[clamp(40px,4.5vw,68px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)]">
                Order,
                <br />
                review,
                <br />
                and track.
              </h2>

              <p className="mt-6 text-[16px] leading-[1.75] text-[var(--muted)]">
                Your account keeps your custom order requests, design uploads,
                payment proof, staff remarks, and order history all in one
                place.
              </p>

              <div className="mt-8 space-y-4">
                <BenefitCard
                  number="01"
                  title="Submit custom orders"
                  text="Choose product type, service, color, size, placement, and upload your design."
                />
                <BenefitCard
                  number="02"
                  title="Receive staff updates"
                  text="Know if your order is approved, rejected, waiting for payment, or printing."
                />
                <BenefitCard
                  number="03"
                  title="Track previous orders"
                  text="View your past orders and open each card to see full details."
                />
              </div>
            </div>
          </section>

          {/* RIGHT: registration form */}
          <section className="flex w-full flex-col justify-center border-[var(--border)] bg-[var(--surface)] px-6 py-12 sm:px-10 lg:min-h-screen lg:border-l lg:px-12">
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
                  Create Account
                </p>

                <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-semibold leading-tight text-[var(--text)]">
                  Start ordering custom prints
                </h1>

                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Create an account to submit custom orders, upload designs, and
                  track staff updates.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleRegister} noValidate>
                {/* first + last name */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-[var(--text)]"
                    >
                      First name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      placeholder="Juan"
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => touch("firstName")}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? "fn-error" : undefined}
                      className={inputCls(
                        errors.firstName,
                        touched.firstName,
                        valid.firstName
                      )}
                    />

                    {errors.firstName && (
                      <FieldError id="fn-error" msg={errors.firstName} />
                    )}
                    {!errors.firstName && touched.firstName && valid.firstName && (
                      <FieldOk msg="Looks good!" />
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-[var(--text)]"
                    >
                      Last name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      placeholder="Dela Cruz"
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => touch("lastName")}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? "ln-error" : undefined}
                      className={inputCls(
                        errors.lastName,
                        touched.lastName,
                        valid.lastName
                      )}
                    />

                    {errors.lastName && (
                      <FieldError id="ln-error" msg={errors.lastName} />
                    )}
                    {!errors.lastName && touched.lastName && valid.lastName && (
                      <FieldOk msg="Looks good!" />
                    )}
                  </div>
                </div>

                {/* email */}
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
                    autoComplete="email"
                    value={email}
                    placeholder="example@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => touch("email")}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={inputCls(errors.email, touched.email, valid.email)}
                  />

                  {errors.email && (
                    <FieldError id="email-error" msg={errors.email} />
                  )}
                  {!errors.email && touched.email && valid.email && (
                    <FieldOk msg="Looks good!" />
                  )}
                </div>

                {/* contact */}
                <div>
                  <label
                    htmlFor="contact"
                    className="mb-2 block text-sm font-semibold text-[var(--text)]"
                  >
                    Contact number
                  </label>

                  <input
                    id="contact"
                    type="tel"
                    autoComplete="tel"
                    value={contactNumber}
                    placeholder="09XXXXXXXXX"
                    onChange={(e) => setContactNumber(e.target.value)}
                    onBlur={() => touch("contact")}
                    aria-invalid={!!errors.contact}
                    aria-describedby={errors.contact ? "contact-error" : undefined}
                    className={inputCls(
                      errors.contact,
                      touched.contact,
                      valid.contact
                    )}
                  />

                  {errors.contact && (
                    <FieldError id="contact-error" msg={errors.contact} />
                  )}
                  {!errors.contact && touched.contact && valid.contact && (
                    <FieldOk msg="Valid number!" />
                  )}
                </div>

                {/* password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[var(--text)]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      placeholder="Create a password"
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => touch("password")}
                      aria-invalid={!!errors.password}
                      aria-describedby="pw-hint"
                      className={
                        inputCls(errors.password, touched.password, valid.password) +
                        " pr-11"
                      }
                    />

                    <button
                      type="button"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9b93a8] transition-colors hover:text-[var(--purple)]"
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={[
                              "h-1 flex-1 rounded-full transition-colors duration-300",
                              strength >= i
                                ? strengthColor[strength]
                                : "bg-[#e7e0d8]",
                            ].join(" ")}
                          />
                        ))}
                      </div>

                      <p
                        id="pw-hint"
                        className={["mt-1 text-xs", strengthText[strength]].join(
                          " "
                        )}
                      >
                        {strengthLabel[strength]} password
                        {strength < 3 &&
                          " — try adding uppercase, numbers, or symbols."}
                      </p>
                    </div>
                  )}

                  {errors.password && (
                    <FieldError id="pw-error" msg={errors.password} />
                  )}
                  {!errors.password && !password && (
                    <p
                      id="pw-hint"
                      className="mt-1.5 text-xs text-[var(--muted-2)]"
                    >
                      Use at least 8 characters.
                    </p>
                  )}
                </div>

                {/* confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[var(--text)]"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showCpw ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      placeholder="Re-enter your password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => touch("confirm")}
                      aria-invalid={!!errors.confirm}
                      aria-describedby={errors.confirm ? "cpw-error" : undefined}
                      className={
                        inputCls(errors.confirm, touched.confirm, valid.confirm) +
                        " pr-11"
                      }
                    />

                    <button
                      type="button"
                      aria-label={showCpw ? "Hide password" : "Show password"}
                      onClick={() => setShowCpw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9b93a8] transition-colors hover:text-[var(--purple)]"
                    >
                      <EyeIcon open={showCpw} />
                    </button>
                  </div>

                  {errors.confirm && (
                    <FieldError id="cpw-error" msg={errors.confirm} />
                  )}
                  {!errors.confirm && touched.confirm && valid.confirm && (
                    <FieldOk msg="Passwords match!" />
                  )}
                </div>

                {/* terms and privacy agreement */}
                <div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-4 text-sm leading-6 text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={legalAccepted}
                      onChange={(e) => {
                        setLegalAccepted(e.target.checked);
                        if (e.target.checked) setLegalError("");
                      }}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--purple)]"
                    />

                    <span>
                      I have read and agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="font-semibold text-[var(--purple)] underline hover:text-[var(--purple2)]"
                      >
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-semibold text-[var(--purple)] underline hover:text-[var(--purple2)]"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {legalError && (
                    <p
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                    >
                      <span aria-hidden="true">✕</span>
                      {legalError}
                    </p>
                  )}
                </div>

                {/* captcha */}
                <div>
                  <Turnstile
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
                      setCaptchaError(
                        "CAPTCHA failed to load. Please refresh and try again."
                      );
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
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-red-500"
                    >
                      ✕
                    </span>
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
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* sign-in nudge */}
              <div className="mt-6 rounded-2xl bg-[var(--cream)] p-4 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[var(--purple)] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-[var(--muted-2)]">
                By creating an account you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-[var(--purple)]"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-[var(--purple)]"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </main>

      <FloatingActions />
    </>
  );
}