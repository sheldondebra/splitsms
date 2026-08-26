"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Link2, MessageSquareText, QrCode, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MarketingCtaArrow,
  marketingCtaClass,
} from "@/components/marketing/marketing-cta-arrow";
import {
  dismissSmartFormsPopup,
  hasReachedScrollThreshold,
  isSmartFormsPopupDismissed,
  shouldOpenSmartFormsPopup,
  shouldShowSmartFormsPopup,
  SMART_FORMS_POPUP_CTA_HREF,
  SMART_FORMS_POPUP_IMAGE,
} from "@/lib/marketing/smart-forms-popup";
import { cn } from "@/lib/utils";

function readSessionDismissed() {
  try {
    return isSmartFormsPopupDismissed(sessionStorage);
  } catch {
    return false;
  }
}

function writeSessionDismissed() {
  try {
    dismissSmartFormsPopup(sessionStorage);
  } catch {
    // Private mode can block sessionStorage. Keep dismiss in React state.
  }
}

const FLOW = [
  { icon: Link2, label: "Share a link" },
  { icon: QrCode, label: "Scan a QR" },
  { icon: MessageSquareText, label: "Get an SMS" },
] as const;

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function SmartFormsPromoPopup() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const eligiblePage = shouldShowSmartFormsPopup(pathname);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setDismissed(readSessionDismissed());
    setScrolled(false);
    setForceOpen(new URLSearchParams(window.location.search).get("promo") === "smart-forms");
  }, [pathname]);

  useEffect(() => {
    if (!eligiblePage || dismissed) return;

    const metrics = () => ({
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    });

    const markIfReady = () => {
      if (hasReachedScrollThreshold(metrics())) {
        setScrolled(true);
        return true;
      }
      return false;
    };

    if (markIfReady()) return;

    const sentinel = document.createElement("div");
    sentinel.setAttribute("data-smart-forms-popup-sentinel", "");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.position = "absolute";
    sentinel.style.left = "0";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    sentinel.style.pointerEvents = "none";
    sentinel.style.visibility = "hidden";

    const placeSentinel = () => {
      const { viewportHeight, documentHeight } = metrics();
      const scrollable = Math.max(0, documentHeight - viewportHeight);
      sentinel.style.top = `${viewportHeight + scrollable * 0.25}px`;
    };

    document.body.appendChild(sentinel);
    placeSentinel();

    const intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setScrolled(true);
      },
      { threshold: 0 },
    );
    intersection.observe(sentinel);

    const resize = new ResizeObserver(() => {
      placeSentinel();
      markIfReady();
    });
    resize.observe(document.documentElement);

    return () => {
      intersection.disconnect();
      resize.disconnect();
      sentinel.remove();
    };
  }, [dismissed, eligiblePage, pathname]);

  const open =
    forceOpen ||
    shouldOpenSmartFormsPopup({
      pathname,
      dismissed,
      scrolled,
    });

  const dismiss = () => {
    writeSessionDismissed();
    setDismissed(true);
    setScrolled(false);
    setForceOpen(false);
  };

  if (!eligiblePage) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/55 supports-backdrop-filter:backdrop-blur-[2px]" />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed top-1/2 left-1/2 z-50 w-[min(100%-1.5rem,24.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-background p-1.5 font-marketing text-foreground shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] ring-1 ring-black/8 outline-none duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:ring-white/10"
        >
          <div className="relative overflow-hidden rounded-[1.25rem] bg-muted">
            <div className="relative h-40 sm:h-44">
              <Image
                src={SMART_FORMS_POPUP_IMAGE}
                alt="Customer completing a SplitSMS Smart Form"
                fill
                sizes="24.5rem"
                className="object-cover object-[center_18%]"
                priority={false}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/10 to-transparent mix-blend-multiply"
                aria-hidden
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent"
                aria-hidden
              />
            </div>

            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/15 text-white shadow-sm ring-1 ring-white/35 backdrop-blur-md hover:bg-white/25 hover:text-white"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>

            <motion.div
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              variants={contentVariants}
              className="relative px-4 pt-4 pb-4 sm:px-5 sm:pb-5"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <FileText className="size-3.5" aria-hidden />
                </span>
                <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                  Smart Forms
                </span>
              </motion.div>

              <motion.div variants={itemVariants}>
                <DialogTitle className="mt-2.5 text-[1.35rem] font-semibold leading-snug tracking-tight text-balance">
                  Forms that collect leads and send SMS
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Build a branded form, share a link or QR, and fire a confirmation text the
                  moment someone submits. Leads, RSVPs, and feedback without extra tools.
                </DialogDescription>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-4 grid grid-cols-3 gap-1">
                {FLOW.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex flex-col items-center gap-1.5 text-center"
                  >
                    {index > 0 && (
                      <span
                        className="absolute right-1/2 top-4 h-px w-full -translate-y-1/2 bg-gradient-to-r from-primary/10 to-primary/40"
                        aria-hidden
                      />
                    )}
                    <span className="relative inline-flex size-8 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-black/5 dark:ring-white/10">
                      <step.icon className="size-3.5 text-primary" aria-hidden />
                    </span>
                    <span className="text-[10.5px] font-medium text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link
                  href={SMART_FORMS_POPUP_CTA_HREF}
                  onClick={dismiss}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    marketingCtaClass,
                    "mt-4 h-11 w-full justify-center pl-5 pr-1.5 font-semibold",
                  )}
                >
                  See Smart Forms
                  <MarketingCtaArrow />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
