"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Box = { x: number; y: number; w: number; h: number };

function boxOf(el: HTMLElement): Box {
  return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
}

function isChosen(el: HTMLElement) {
  return el.getAttribute("aria-current") === "page" || el.getAttribute("aria-pressed") === "true";
}

export function PillRail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [activeBox, setActiveBox] = useState<Box | null>(null);
  const [hoverBox, setHoverBox] = useState<Box | null>(null);
  const [hoverOn, setHoverOn] = useState(false);

  const place = useCallback(() => {
    const rail = ref.current;
    if (!rail) return;
    const current = rail.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
    setActiveBox(current ? boxOf(current) : null);
    const hovered = rail.querySelector<HTMLElement>("[data-nav-item]:hover");
    if (hovered && !isChosen(hovered)) {
      setHoverBox(boxOf(hovered));
      setHoverOn(true);
    }
  }, []);

  useLayoutEffect(() => {
    place();
    setReady(true);
    const rail = ref.current;
    if (!rail) return;
    const observer = new ResizeObserver(place);
    observer.observe(rail);
    rail.querySelectorAll<HTMLElement>("[data-nav-item]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [place, children]);

  return (
    <div
      ref={ref}
      data-ready={ready ? "" : undefined}
      className="nav-rail"
      onMouseLeave={() => setHoverOn(false)}
      onMouseOver={(event) => {
        const item = (event.target as HTMLElement).closest<HTMLElement>("[data-nav-item]");
        if (!item || isChosen(item)) {
          setHoverOn(false);
          return;
        }
        setHoverBox(boxOf(item));
        setHoverOn(true);
      }}
    >
      <span
        aria-hidden
        className="nav-indicator"
        style={
          activeBox
            ? {
                transform: `translate3d(${activeBox.x}px, ${activeBox.y}px, 0)`,
                width: activeBox.w,
                height: activeBox.h,
              }
            : { opacity: 0 }
        }
      />
      <span
        aria-hidden
        className="nav-hover"
        style={
          hoverBox
            ? {
                transform: `translate3d(${hoverBox.x}px, ${hoverBox.y}px, 0)`,
                width: hoverBox.w,
                height: hoverBox.h,
                opacity: hoverOn ? 1 : 0,
              }
            : { opacity: 0 }
        }
      />
      {children}
    </div>
  );
}
