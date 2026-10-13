"use client";

import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { BookMark } from "./book-mark";
import { primaryButton, butterButton } from "./fields";

export function WelcomeHero({
  title,
  kicker,
  lead,
  signIn,
  continueLabel,
  continueHref,
}: {
  title: string;
  kicker: string;
  lead: string;
  signIn: string;
  continueLabel?: string;
  continueHref?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="grid items-center gap-4 lg:grid-cols-[minmax(280px,440px)_minmax(0,1fr)] lg:gap-12">
      <BookMark />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <p className="kicker">{kicker}</p>
        <h1 className="mt-3 max-w-[12ch] font-display text-[clamp(3.2rem,8vw,5.6rem)] leading-[0.9] font-medium text-balance text-ink">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-[17px] text-soft">{lead}</p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {continueHref && continueLabel ? (
            <Link className={primaryButton} href={continueHref}>
              {continueLabel}
            </Link>
          ) : null}
          <Link className={continueHref ? butterButton : primaryButton} href="/login">
            {signIn}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
