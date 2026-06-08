"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";

export default function Footer() {
  const { language } = useAppPreferences();
  const copy = siteCopy.footer[language];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--cream)] px-4 py-10 text-[var(--text)] md:px-8 xl:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="JNJ Printing Logo"
              width={50}
              height={50}
              priority
              className="h-auto w-12 rounded object-contain"
            />

            <div>
              <strong className="block font-display text-[18px] font-semibold text-[var(--text)]">
                JNJ Printing
              </strong>
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Custom prints made simple
              </span>
            </div>
          </Link>

          <p className="mt-5 max-w-[320px] text-sm leading-6 text-[var(--muted)]">
            {copy.description}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text)]">{copy.quickLinks}</h3>

          <div className="flex flex-col gap-3 text-sm text-[var(--muted)]">
            <Link href="/#home" className="transition-colors hover:text-[var(--purple)]">
              Home
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-[var(--purple)]"
            >
              About
            </Link>
            <Link
              href="/#how-to-order"
              className="transition-colors hover:text-[var(--purple)]"
            >
              How to Order
            </Link>
            <Link
              href="/#services"
              className="transition-colors hover:text-[var(--purple)]"
            >
              Services
            </Link>
            <Link
              href="/#gallery"
              className="transition-colors hover:text-[var(--purple)]"
            >
              Gallery
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-[var(--purple)]"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text)]">{copy.services}</h3>

          <div className="flex flex-col gap-3 text-sm text-[var(--muted)]">
            <span>DTF Print</span>
            <span>Silkscreen</span>
            <span>Rubberized</span>
            <span>Sublimation</span>
            <span>Vinyl</span>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text)]">{copy.contact}</h3>

          <div className="space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>
              Have a custom print idea? Start your order and send your design
              details.
            </p>

            <Link
              href="/custom-order"
              className="inline-flex rounded-full bg-[var(--purple2)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--purple)]"
            >
              {copy.startOrder}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-left justify-left gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
        <p>{copy.rights}</p>

        <div className="flex items-center gap-4 ml-10">
          <Link href="/privacy" className="hover:text-[var(--purple)]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[var(--purple)]">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}