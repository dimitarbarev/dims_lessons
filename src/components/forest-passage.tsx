"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const TRAVEL_MS = 5600;
const FADE_MS = 280;

export function ForestPassage() {
  const router = useRouter();
  const t = useTranslations("welcome");
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const travelRef = useRef<number | null>(null);
  const gone = useRef(false);
  const leaveRef = useRef<() => void>(() => {});

  leaveRef.current = () => {
    if (gone.current) return;
    gone.current = true;
    if (travelRef.current) window.clearTimeout(travelRef.current);
    setLeaving(true);
    router.push("/");
    window.setTimeout(() => setOpen(false), FADE_MS);
  };

  useEffect(() => {
    const openPassage = () => {
      gone.current = false;
      setLeaving(false);
      setOpen(true);
    };
    window.addEventListener("lessons:forest", openPassage);
    return () => window.removeEventListener("lessons:forest", openPassage);
  }, []);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    travelRef.current = window.setTimeout(() => leaveRef.current(), reduce ? 80 : TRAVEL_MS);
    return () => {
      document.body.style.overflow = previous;
      if (travelRef.current) window.clearTimeout(travelRef.current);
    };
  }, [open]);

  if (!open) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`forest-passage${leaving ? " is-leaving" : ""}`}
      aria-label={t("continue")}
      onClick={() => leaveRef.current()}
    >
      <span className="forest-layer forest-night">
        <img src="/forest-night.jpg" alt="" className="forest-photo" />
      </span>
      <span className="forest-layer forest-day">
        <img src="/forest-day.jpg" alt="" className="forest-photo" />
      </span>
      <span className="forest-veil" />
    </button>
  );
}
