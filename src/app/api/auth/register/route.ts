import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  return /^09\d{9}$/.test(phone);
}

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

async function verifyCaptcha(captchaToken: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return {
      ok: false,
      error: "CAPTCHA is not configured on the server.",
      status: 500,
    };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", captchaToken);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const result = (await response.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    return {
      ok: false,
      error: "CAPTCHA verification failed. Please try again.",
      status: 400,
    };
  }

  return {
    ok: true,
    error: null,
    status: 200,
  };
}

function createSignupClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public URL or anon key is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const contactNumber = String(body.contactNumber ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const captchaToken = String(body.captchaToken ?? "");
    const legalAccepted = Boolean(body.legalAccepted);

    if (!legalAccepted) {
      return NextResponse.json(
        { error: "You must agree to the Terms and Privacy Policy." },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (!isValidPhone(contactNumber)) {
      return NextResponse.json(
        { error: "Enter a valid PH mobile number." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Please complete the CAPTCHA verification." },
        { status: 400 }
      );
    }

    const captcha = await verifyCaptcha(captchaToken);

    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.error },
        { status: captcha.status }
      );
    }

    const auth = createSignupClient();
    const admin = createAdminClient();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    const { data, error } = await auth.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          contact_number: contactNumber,
          role: "customer",
        },
      },
    });

    if (error) {
      const status = /already|exists|duplicate|registered/i.test(error.message)
        ? 409
        : 500;

      return NextResponse.json({ error: error.message }, { status });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create user." },
        { status: 500 }
      );
    }

    /**
     * When email confirmation is enabled, Supabase may return an empty
     * identities array for an already-registered email.
     */
    if (data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json(
        {
          error:
            "An account with that email already exists. Try signing in or resetting your password.",
        },
        { status: 409 }
      );
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      contact_number: contactNumber,
      role: "customer",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const { error: customerError } = await admin.from("customers").insert({
      user_id: data.user.id,
    });

    if (customerError) {
      await admin.from("profiles").delete().eq("id", data.user.id);
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);

      return NextResponse.json(
        { error: customerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: true,
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected registration error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}