"use client";

import {
  faPrint,
  faBolt,
  faUsers,
  faClipboardCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";
import FloatingActions from "./FloatingActions";

const values = [
  {
    icon: faPrint,
    title: "Quality First",
    description:
      "We focus on clean, detailed, and reliable print results for every custom order.",
    background: "bg-purple-100",
    color: "text-purple-700",
  },
  {
    icon: faBolt,
    title: "Fast Process",
    description:
      "From design review to production updates, we help customers follow each step clearly.",
    background: "bg-yellow-100",
    color: "text-yellow-700",
  },
  {
    icon: faUsers,
    title: "Customer-Focused",
    description:
      "We guide customers from choosing a service to confirming details, payment, and pickup.",
    background: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    icon: faClipboardCheck,
    title: "Organized Workflow",
    description:
      "We keep orders, design files, payment records, and production status easier to manage and track.",
    background: "bg-green-100",
    color: "text-green-600",
  },
];

const timeline = [
  {
    year: "2013",
    title: "Humble Beginnings",
    description:
      "JNJ Printing started with a passion for service and quality printing.",
  },
  {
    year: "2016",
    title: "Growing Services",
    description:
      "The shop expanded its printing services to serve more students, organizations, and businesses.",
  },
  {
    year: "2019",
    title: "Better Equipment",
    description:
      "Improved printing tools helped support faster and more consistent production.",
  },
  {
    year: "2026",
    title: "Online Ordering Direction",
    description:
      "The business moved toward a more convenient online ordering and tracking experience.",
  },
];

export default function About() {
  const { language } = useAppPreferences();
  const copy = siteCopy.about[language];

  return (
    <>
      <section id="about" className="scroll-mt-24 bg-[var(--cream)] px-4 py-20 md:px-8 xl:px-16">
        <div className="mx-auto max-w-7xl">
          {/* TOP CONTENT */}
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                {copy.title}
              </p>

              <h2 className="font-display text-[clamp(34px,4vw,56px)] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--text)]">
                {copy.subtitle[0]}
                <br />
                {copy.subtitle[1]}
              </h2>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_18px_50px_rgba(13,13,20,0.06)]">
              <p className="font-body text-[17px] leading-[1.8] text-[var(--muted)]">
                {copy.intro}
              </p>

              <p className="mt-4 font-body text-[17px] leading-[1.8] text-[var(--muted)]">
                {copy.intro2}
              </p>
            </div>
          </div>

          {/* VALUES */}
          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((item, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_10px_30px_rgba(13,13,20,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(13,13,20,0.08)]"
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${item.background}`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`h-4 w-4 ${item.color}`}
                  />
                </div>

                <h3 className="font-display text-[20px] font-semibold text-[var(--text)]">
                  {item.title}
                </h3>

                <p className="mt-3 font-body text-sm leading-[1.7] text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* JOURNEY */}
          <div className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
                {language === "fil" ? "Aming Paglalakbay" : "Our Journey"}
              </p>

              <h2 className="font-display text-[clamp(30px,3vw,46px)] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--text)]">
                {copy.journeyTitle[0]}
                <br />
                {copy.journeyTitle[1]}
              </h2>

              <p className="mt-4 max-w-[420px] font-body text-[16px] leading-[1.8] text-[var(--muted)]">
                {copy.journeyText}
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_18px_50px_rgba(13,13,20,0.06)]">
              <div className="space-y-7">
                {timeline.map((item, index) => (
                  <div key={index} className="relative flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(75,0,110,0.08)] text-sm font-bold text-[var(--purple)]">
                        {item.year}
                      </div>

                      {index !== timeline.length - 1 && (
                        <div className="mt-3 h-full w-px bg-[#e7e0d8]" />
                      )}
                    </div>

                    <div className="pb-2">
                      <h3 className="font-display text-[21px] font-semibold text-[var(--text)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 font-body text-[15px] leading-[1.7] text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <FloatingActions />
    </>
  );
}