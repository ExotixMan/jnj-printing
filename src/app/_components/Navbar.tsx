"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";
import { getDashboardPathForRole } from "@/lib/auth-roles";

const navLinks = [
  { name: "Home", href: "/#home", id: "home" },
  { name: "About", href: "/about", id: "about" },
  { name: "How to Order", href: "/#how-to-order", id: "how-to-order" },
  { name: "Services", href: "/#services", id: "services" },
  { name: "Gallery", href: "/#gallery", id: "gallery" },
  { name: "Contact", href: "/contact", id: "contact" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useAppPreferences();
  const [activeLink, setActiveLink] = useState("home");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [dashboardPath, setDashboardPath] = useState("/customer/orders");

  const isAuthActive = pathname === "/login" || pathname === "/register";
  const isCustomOrderActive = pathname.startsWith("/custom-order");
  const isHomeRoute = pathname === "/";
  const centerActiveLink = isHomeRoute
  ? activeLink
  : pathname === "/about"
    ? "about"
    : pathname === "/contact"
      ? "contact"
      : "";
  const isDashboardActive = pathname.startsWith("/customer") || pathname.startsWith("/admin");

  const copy = siteCopy.navbar[language];

  useEffect(() => {
    const supabase = createClient();

    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      setIsSignedIn(Boolean(data.session));

      if (data.session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .maybeSingle();

        setDashboardPath(getDashboardPathForRole(profile?.role));
      }
    }

    void syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void syncSession();
    });

    if (!isHomeRoute) {
      return () => authListener.subscription.unsubscribe();
    }

    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      authListener.subscription.unsubscribe();

      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, [isHomeRoute]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsSignedIn(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--cream)] px-3 py-3 text-[var(--text)] backdrop-blur-xl backdrop-saturate-[1.6] sm:px-4 md:px-8 xl:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-2 sm:gap-3 xl:grid-cols-[auto_1fr_auto]">
        <Link
          href="/#home"
          className="group flex min-w-0 items-center gap-2 font-display transition-colors sm:gap-3"
        >
          <Image
            src="/Logo.png"
            alt="JNJ Printing Logo"
            width={50}
            height={50}
            priority
            className="h-auto w-10 shrink-0 rounded object-contain sm:w-12"
          />

          <span className="min-w-0 leading-tight">
            <strong className="block truncate text-[14px] font-semibold text-[var(--text)] group-hover:text-[var(--purple2)] sm:text-[16px]">
              JNJ Printing
            </strong>

            <small className="hidden text-[10px] uppercase tracking-[0.05em] text-[var(--muted)] group-hover:text-[var(--purple)] sm:block md:text-[11px]">
              Custom prints made simple
            </small>
          </span>
        </Link>

        <nav className="order-3 col-span-2 -mx-3 flex items-center gap-1 overflow-x-auto px-3 pt-2 text-xs font-bold [scrollbar-width:none] sm:-mx-4 sm:gap-2 sm:px-4 sm:text-sm xl:order-none xl:col-span-1 xl:mx-0 xl:justify-center xl:px-0 xl:pt-0 [&::-webkit-scrollbar]:hidden">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors sm:px-4 ${
                centerActiveLink === link.id
                  ? "bg-[var(--purple-soft)] text-[var(--purple2)]"
                  : "text-[var(--text)] hover:bg-[var(--purple-soft)] hover:text-[var(--purple2)]"
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {isSignedIn ? (
            <>
              <Link
                href={dashboardPath}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  isDashboardActive
                    ? "bg-[var(--purple-soft)] text-[var(--purple2)]"
                    : "text-[var(--text)] hover:bg-[var(--purple-soft)] hover:text-[var(--purple2)]"
                }`}
              >
                My Orders
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--purple2)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--purple)] sm:gap-2 sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">{copy.logout}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="white" />
                  <polyline points="16 17 21 12 16 7" stroke="white" />
                  <line x1="21" y1="12" x2="9" y2="12" stroke="white" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isAuthActive
                    ? "bg-[var(--purple-soft)] text-[var(--purple2)]"
                    : "text-[var(--text)] hover:bg-[var(--purple-soft)] hover:text-[var(--purple2)]"
                }`}
              >
                {copy.signIn}
              </Link>

              <Link
                href="/custom-order"
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                  isCustomOrderActive
                    ? "bg-[var(--purple-soft)] text-[var(--purple2)]"
                    : "bg-[var(--purple2)] text-white hover:bg-[var(--purple)]"
                }`}
              >
                Order →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}