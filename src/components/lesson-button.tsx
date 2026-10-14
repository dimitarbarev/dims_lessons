"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import { logQuickLesson } from "@/lib/actions";

const PRESETS = [1, 1.5, 2] as const;

export function LessonButton({
  clientId,
  label,
  savedLabel,
  title,
  lead,
  otherLabel,
  hoursLabel,
  saveLabel,
  closeLabel,
}: {
  clientId: string;
  label: string;
  savedLabel: string;
  title: string;
  lead: string;
  otherLabel: string;
  hoursLabel: string;
  saveLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [choice, setChoice] = useState<number | "other">(1);
  const [custom, setCustom] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function hours() {
    if (choice !== "other") return choice;
    const parsed = Number(custom.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 12) return null;
    return Math.round(parsed * 10) / 10;
  }

  function commit() {
    const length = hours();
    if (length === null) return;
    start(async () => {
      await logQuickLesson(clientId, length);
      setOpen(false);
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 1400);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="btn btn-ink inline-flex min-h-10 min-w-28 items-center justify-center rounded-full px-4 text-sm font-medium tracking-tight disabled:opacity-45"
        onClick={() => setOpen(true)}
      >
        <span className={saved ? "check-pop" : undefined}>{saved ? savedLabel : label}</span>
      </button>
      {open
        ? createPortal(
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" aria-label={closeLabel} onClick={() => setOpen(false)} />
          <div className="pointer-events-none relative flex h-full items-end justify-center p-3 sm:items-center sm:p-8">
            <div role="dialog" aria-modal="true" aria-labelledby={`length-${clientId}`} className="rise pointer-events-auto w-full max-w-sm rounded-[28px] bg-ivory p-5 shadow-card">
              <h2 id={`length-${clientId}`} className="font-display text-3xl">{title}</h2>
              <p className="mt-2 text-sm text-soft">{lead}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setChoice(preset)}
                    className={`min-h-12 rounded-2xl text-sm ${choice === preset ? "bg-ink text-paper" : "bg-paper text-ink"}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="label">{otherLabel}</span>
                <input
                  className="field"
                  inputMode="decimal"
                  value={choice === "other" ? custom : ""}
                  placeholder={hoursLabel}
                  onFocus={() => setChoice("other")}
                  onChange={(event) => {
                    setChoice("other");
                    setCustom(event.target.value);
                  }}
                />
              </label>
              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" className="nav-link text-sm text-ink/70" onClick={() => setOpen(false)}>
                  {closeLabel}
                </button>
                <button type="button" className="btn btn-ink inline-flex min-h-10 items-center rounded-full px-4 text-sm" disabled={pending || hours() === null} onClick={commit}>
                  {saveLabel}
                </button>
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}
    </>
  );
}
