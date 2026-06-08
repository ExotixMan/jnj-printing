"use client";

import {
  faShirt,
  faPenToSquare,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";

export default function Guideline() {
  const { language } = useAppPreferences();
  const copy = siteCopy.guideline[language];

  const steps = [
    {
      step: "01",
      icon: faShirt,
      title: copy.steps[0],
      name: copy.stepNames[0],
      background: "bg-blue-100",
      color: "text-blue-600",
      description: copy.descriptions[0],
    },
    {
      step: "02",
      icon: faPenToSquare,
      title: copy.steps[1],
      name: copy.stepNames[1],
      background: "bg-green-100",
      color: "text-green-600",
      description: copy.descriptions[1],
    },
    {
      step: "03",
      icon: faTruckFast,
      title: copy.steps[2],
      name: copy.stepNames[2],
      background: "bg-yellow-100",
      color: "text-yellow-700",
      description: copy.descriptions[2],
    },
  ];

  return (
    <section id="how-to-order" className="bg-[var(--surface)] px-4 pb-20 pt-12 md:px-8 xl:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-10 max-w-[620px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
            {copy.title}
          </p>

          <h2 className="font-display text-[clamp(34px,3.0vw,50px)] leading-none tracking-[-0.03em] text-[var(--text)]">
            {copy.subtitle[0]}
            <br />
            {copy.subtitle[1]}
          </h2>
        </div>

        {/* Cards */}
        <div className="grid overflow-hidden md:grid-cols-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(13,13,20,0.06)]">
          {steps.map((item, index) => (
            <div
              key={index}
              className="group relative border-r border-[var(--border)] p-8 last:border-r-0 transition-all duration-300 hover:bg-[var(--surface-muted)]"
            >
              {/* Top row */}
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-bold tracking-[0.08em] text-[var(--muted-2)]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${item.background}`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`h-4 w-4 ${item.color}`}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="mb-4 text-[26px] font-semibold leading-tight text-[var(--text)] font-display">
                {item.title}
              </h3>

              <p className="max-w-[330px] text-[17px] leading-[1.7] text-[var(--muted)] font-body">
                {item.description}
              </p>

              {/* Badge */}
              <p
                className={`mt-7 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${item.background} ${item.color}`}
              >
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}