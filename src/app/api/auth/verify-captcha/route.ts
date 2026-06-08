import { NextResponse } from "next/server";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const captchaToken = String(body.captchaToken ?? "");

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Please complete the CAPTCHA verification." },
        { status: 400 }
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { error: "CAPTCHA is not configured on the server." },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify CAPTCHA. Please try again." },
      { status: 500 }
    );
  }
}