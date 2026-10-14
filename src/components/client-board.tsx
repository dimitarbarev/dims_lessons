"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type PanelId = "lesson" | "payments" | "lessons" | "profile" | "pin" | "parents" | "feedback" | "notes";

export type WidgetSize = "hero" | "wide" | "tile";
export type WidgetTone = "feature" | "blush" | "plain";
export type StatusTone = "ok" | "low" | "empty" | "due" | "neutral";

export type WidgetModel = {
  id: string;
  panel: PanelId;
  label: string;
  figure: string;
  caption: string;
  detail?: string;
  tone: WidgetTone;
  size: WidgetSize;
  display: "stat" | "story";
  status?: StatusTone;
};

const spanClass: Record<WidgetSize, string> = {
  hero: "col-span-2 lg:row-span-2",
  wide: "col-span-2",
  tile: "col-span-1",
};

const surfaceClass: Record<WidgetTone, string> = {
  feature: "bg-peach",
  blush: "bg-blush/70",
  plain: "bg-ivory",
};

const dotClass: Record<StatusTone, string> = {
  ok: "bg-sage",
  low: "bg-amber",
  empty: "bg-coral",
  due: "bg-apricot",
  neutral: "bg-butter",
};

export function ClientBoard({
  widgets,
  panels,
  titles,
  closeLabel,
  initialPanel = null,
  notice,
}: {
  widgets: WidgetModel[];
  panels: Partial<Record<PanelId, ReactNode>>;
  titles: Record<PanelId, string>;
  closeLabel: string;
  initialPanel?: PanelId | null;
  notice?: ReactNode;
}) {
  const [panel, setPanel] = useState<PanelId | null>(initialPanel);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!panel) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        returnFocus.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  function open(next: PanelId, trigger: HTMLElement) {
    returnFocus.current = trigger;
    setPanel(next);
  }

  function close() {
    setPanel(null);
    returnFocus.current?.focus();
  }

  return (
    <div>
      {panel ? null : notice}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {widgets.map((widget) => (
          <li key={widget.id} className={spanClass[widget.size]}>
            <button
              type="button"
              onClick={(event) => open(widget.panel, event.currentTarget)}
              className={`group relative flex h-full w-full min-w-0 flex-col rounded-[28px] p-5 pr-14 text-left shadow-card transition duration-200 hover:-translate-y-0.5 ${surfaceClass[widget.tone]} ${widget.size === "hero" ? "min-h-64" : "min-h-40"}`}
            >
              <span className="kicker">{widget.label}</span>
              {widget.display === "story" ? (
                <p className="mt-3 line-clamp-3 font-display text-2xl leading-tight">{widget.figure}</p>
              ) : (
                <p
                  className={`mt-3 font-display leading-none tracking-tight ${widget.size === "tile" ? "text-4xl" : "text-5xl"}`}
                >
                  {widget.figure}
                </p>
              )}
              {widget.caption ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink/80">
                  {widget.status ? (
                    <span className={`inline-block size-2.5 shrink-0 rounded-full ${dotClass[widget.status]}`} aria-hidden="true" />
                  ) : null}
                  <span className="line-clamp-2">{widget.caption}</span>
                </p>
              ) : null}
              {widget.detail ? <p className="mt-auto pt-6 text-sm text-soft">{widget.detail}</p> : null}
              <span
                aria-hidden="true"
                className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-ivory text-ink shadow-card transition group-hover:bg-ink group-hover:text-paper"
              >
                <Arrow />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {panel ? (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" aria-label={closeLabel} onClick={close} />
          <div className="pointer-events-none relative flex h-full items-end justify-center p-3 sm:items-center sm:p-8">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="rise pointer-events-auto max-h-[min(88vh,760px)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-ivory p-5 shadow-card sm:p-7"
            >
              <div className="sticky top-0 z-10 -mx-5 mb-5 flex items-start justify-between gap-4 bg-ivory px-5 pb-3 sm:-mx-7 sm:px-7">
                <h2 id={titleId} className="font-display text-3xl">
                  {titles[panel]}
                </h2>
                <button ref={closeRef} type="button" onClick={close} className="nav-link mt-2 shrink-0 text-sm text-ink/70">
                  {closeLabel}
                </button>
              </div>
              {notice}
              {panels[panel]}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 10 10 4M10 4H5.5M10 4v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
