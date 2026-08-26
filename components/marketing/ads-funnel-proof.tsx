"use client";

import Image from "next/image";
import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const lanes = [
  {
    title: "Bulk campaigns",
    body: "Import contacts, schedule promos and reminders, and see what delivered.",
    image: "/images/splitsms-selling.png",
    alt: "Professional reviewing an SMS on her phone",
  },
  {
    title: "WordPress stores",
    body: "Order placed, paid, and shipped alerts from the official plugin.",
    image: "/images/smart-forms-hero.png",
    alt: "Customer celebrating after a successful form submission",
  },
  {
    title: "OTP and API",
    body: "Send login codes and alerts from your app with a REST key.",
    image: "/images/rest-api-developer.png",
    alt: "Developer sending SMS from code and dashboards",
  },
] as const;

export function AdsFunnelProof() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col gap-3 lg:h-[580px] lg:flex-row">
      {lanes.map((lane, index) => {
        const open = active === index;
        return (
          <article
            key={lane.title}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            tabIndex={0}
            className={cn(
              "relative min-h-[260px] overflow-hidden rounded-[1.75rem] outline-none ring-offset-2 ring-offset-[oklch(0.13_0_0)] focus-visible:ring-2 focus-visible:ring-primary sm:min-h-[300px] lg:h-full lg:min-h-0",
              !reduce && "transition-[flex] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            )}
            style={{ flex: open ? 2.35 : 1 }}
          >
            <Image
              src={lane.image}
              alt={lane.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={cn(
                "object-cover object-center",
                !reduce && "transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                open && !reduce && "scale-[1.04]",
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">{lane.title}</h3>
              <p
                className={cn(
                  "mt-2 max-w-sm text-sm leading-relaxed text-white/80",
                  open ? "lg:block" : "lg:hidden",
                )}
              >
                {lane.body}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
