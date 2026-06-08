import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, getDashboardPathForRole } from "@/lib/auth-roles";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/customer") || pathname.startsWith("/custom-order");

  const { data: { user } } = await supabase.auth.getUser();

  if (protectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const url = request.nextUrl.clone();
    url.pathname = getDashboardPathForRole(profile?.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && protectedPath) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!canAccessPath(profile?.role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(profile?.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
