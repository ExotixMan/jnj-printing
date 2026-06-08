"use client";

import Image from "next/image";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";

const services = [
  {
    image: "/dtf-print.png",
    title: "DTF Print",
    description:
      "Best for colorful artwork, gradients, and detailed custom prints.",
    tag: "Full color",
    background: "bg-pink-100",
    color: "text-pink-500",
  },
  {
    image: "/silkscreen.png",
    title: "Silkscreen",
    description:
      "Best for bulk shirts, uniforms, teams, and organization orders.",
    tag: "Bulk orders",
    background: "bg-orange-100",
    color: "text-orange-500",
  },
  {
    image: "/rubber-print.png",
    title: "Rubberized",
    description:
      "Best for bold, thick, raised designs with strong coverage.",
    tag: "Raised finish",
    background: "bg-purple-100",
    color: "text-purple-700",
  },
  {
    image: "/sublimation-print.png",
    title: "Sublimation",
    description:
      "Best for jerseys, sportswear, polyester, and all-over prints.",
    tag: "Sportswear",
    background: "bg-yellow-100",
    color: "text-yellow-600",
  },
  {
    image: "/vinyl-print.png",
    title: "Vinyl",
    description:
      "Best for names, numbers, short text, and simple single-color designs.",
    tag: "Names & numbers",
    background: "bg-blue-100",
    color: "text-blue-600",
  },
];

export default function Services() {
  const { language } = useAppPreferences();
  const copy = siteCopy.services[language];

  return (
    <section id="services" className="bg-[var(--cream)] px-4 py-20 md:px-8 xl:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-9">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
            {copy.heading}
          </p>

          <h2 className="text-[24px] font-bold leading-tight text-[var(--text)] font-display">
            {copy.title}
          </h2>

          <p className="mt-2 text-[16px] leading-[1.7] text-[var(--muted)] font-body">
            {copy.subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {services.map((service, index) => (
            <div
              key={index}
              className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(13,13,20,0.04)]"
            >
              <div
                className={`mb-7 flex h-10 w-10 items-center justify-center rounded-xl ${service.background}`}
              >
                <Image
                  src={service.image}
                  alt={`${service.title} icon`}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>

              <h3 className="mb-2 text-[18px] font-bold leading-tight text-[var(--text)] font-display">
                {service.title}
              </h3>

              <p className="min-h-[72px] text-[14px] leading-normal text-[var(--muted)] font-body">
                {service.description}
              </p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold bg-[rgba(75,0,110,.08)] text-[var(--purple)]`}
              >
                {copy.tags[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}