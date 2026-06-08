"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";

const partners = [
  "/arellano.png",
  "/feu_logo.png",
  "/gringo.png",
  "/icps2.png",
  "/malabon.png",
  "/metro.png",
  "/tau.png",
];

export default function HomePage() {
  const { language } = useAppPreferences();
  const copy = siteCopy.home[language];

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[var(--cream)] px-4 pb-12 pt-12 text-[var(--text)] sm:px-6 sm:pb-14 sm:pt-16 md:px-8 md:pt-24 xl:px-16"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="flex min-w-0 flex-col justify-center">
          <section className="relative mb-6 w-full max-w-[520px] overflow-hidden rounded-full bg-[var(--surface-soft)] py-3 sm:py-4">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-linear-to-r from-[var(--surface-soft)] to-transparent sm:w-20" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-linear-to-l from-[var(--surface-soft)] to-transparent sm:w-20" />

            <div className="flex w-max animate-marquee-right gap-7 sm:gap-10">
              {[...partners, ...partners].map((logo, index) => (
                <Image
                  key={index}
                  src={logo}
                  alt={`Partner logo ${index + 1}`}
                  width={50}
                  height={50}
                  className="h-auto w-8 shrink-0 object-contain sm:w-10"
                />
              ))}
            </div>
          </section>

          <h1 className="mb-5 font-display text-[clamp(38px,12vw,80px)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--text)] sm:mb-6">
            {copy.heroTitle[0]}
            <br />
            {copy.heroTitle[1]}{" "}
            <em className="bg-linear-to-br from-[var(--purple2)] to-[var(--gold)] bg-clip-text italic text-transparent">
              {copy.heroTitle[2]}
            </em>
          </h1>

          <p className="mb-7 max-w-[520px] text-[15px] leading-[1.75] text-[var(--muted)] sm:mb-8 sm:text-[18px]">
            {copy.heroDescription}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/custom-order"
              className="w-full rounded-full bg-[var(--purple2)] px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--purple)] sm:w-auto"
            >
              {copy.startOrder}
            </Link>

            <Link
              href="/#services"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-center font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] sm:w-auto"
            >
              {copy.viewServices}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[470px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] sm:rounded-[28px]">
            <Image
              src="/custom-print.png"
              alt="Custom shirt printing"
              width={500}
              height={370}
              className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[380px]"
              priority
            />

            <span className="absolute right-3 top-3 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[10px] font-bold uppercase text-[var(--purple)] sm:right-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs">
              JNJ Quality
            </span>

            <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="block text-sm font-bold text-[var(--text)]">
                    {copy.featureTitle}
                  </strong>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    DTF · Silkscreen · Rubberized
                  </span>
                </div>

                <div className="w-fit rounded-full bg-[var(--surface-soft)] px-4 py-2 text-center sm:shrink-0">
                  <span className="block text-[11px] leading-none text-[var(--muted)]">
                    {copy.featureTag}
                  </span>
                  <strong className="mt-1 block text-xs font-bold text-[var(--purple)]">
                    ₱180
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}