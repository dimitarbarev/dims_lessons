"use client";

import { useEffect, useRef } from "react";

const SRC = {
  lantern: "/magic/lantern.png",
  book: "/magic/book.png",
  wand: "/magic/wand.png",
  chest: "/magic/chest.png",
} as const;

export function Charm({
  name,
  live = false,
  play = false,
  className = "",
  onTap,
}: {
  name: keyof typeof SRC;
  live?: boolean;
  play?: boolean;
  className?: string;
  onTap?: () => void;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const figure = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;

  useEffect(() => {
    if (!play) return;
    const el = root.current;
    const figureEl = figure.current;
    const popEl = pop.current;
    if (!el || !figureEl || !popEl) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motion.matches;
    let pointing = false;
    let moved = false;
    let originX = 0;
    let originY = 0;
    let baseX = 0;
    let baseY = 0;
    let x = 0;
    let y = 0;
    let targetRX = 12;
    let targetRY = -18;
    let rx = 12;
    let ry = -18;
    let frame = 0;

    function paint(bob: number) {
      el!.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0)`;
      figureEl!.style.transform = `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
    }

    function onDown(event: PointerEvent) {
      event.preventDefault();
      event.stopPropagation();
      pointing = true;
      moved = false;
      originX = event.clientX;
      originY = event.clientY;
      baseX = x;
      baseY = y;
      el!.classList.add("is-held");
      try {
        el!.setPointerCapture(event.pointerId);
      } catch {
        pointing = true;
      }
    }

    function onMove(event: PointerEvent) {
      if (pointing) {
        const dx = event.clientX - originX;
        const dy = event.clientY - originY;
        if (Math.hypot(dx, dy) > 5) moved = true;
        x = Math.max(-240, Math.min(72, baseX + dx));
        y = Math.max(-96, Math.min(96, baseY + dy));
        targetRY = Math.max(-34, Math.min(34, -18 + dx * 0.06));
        targetRX = Math.max(-16, Math.min(28, 12 - dy * 0.06));
        return;
      }
      const rect = el!.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetRY = -18 + px * 24;
      targetRX = 12 - py * 16;
      el!.classList.add("is-hot");
    }

    function onUp(event: PointerEvent) {
      event.stopPropagation();
      if (pointing && !moved) {
        tapRef.current?.();
        if (!reduce) {
          popEl!.classList.remove("is-pop");
          void popEl!.offsetWidth;
          popEl!.classList.add("is-pop");
        }
      }
      pointing = false;
      el!.classList.remove("is-held");
    }

    function onLeave() {
      if (pointing) return;
      el!.classList.remove("is-hot");
      targetRX = 12;
      targetRY = -18;
    }

    function onPopEnd() {
      popEl!.classList.remove("is-pop");
    }

    function tick(now: number) {
      const idle = !pointing && !el!.classList.contains("is-hot");
      if (idle) {
        if (reduce) {
          targetRX = 12;
          targetRY = -18;
        } else {
          const t = now / 1000;
          targetRX = 12 + Math.sin(t * 0.7) * 3;
          targetRY = -18 + Math.sin(t * 0.45) * 7;
        }
      }
      rx += (targetRX - rx) * (pointing ? 0.22 : 0.12);
      ry += (targetRY - ry) * (pointing ? 0.22 : 0.12);
      const bob = pointing || reduce ? 0 : Math.sin(now / 900) * 5;
      paint(bob);
      frame = requestAnimationFrame(tick);
    }

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    popEl.addEventListener("animationend", onPopEnd);
    const onMotion = () => {
      reduce = motion.matches;
    };
    motion.addEventListener("change", onMotion);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      popEl.removeEventListener("animationend", onPopEnd);
      motion.removeEventListener("change", onMotion);
    };
  }, [play]);

  if (!play) {
    return (
      <span className={`charm ${live ? "charm-live" : ""} ${className}`.trim()} aria-hidden="true">
        <img src={SRC[name]} alt="" draggable={false} />
      </span>
    );
  }

  return (
    <span ref={root} className={`charm-play ${className}`.trim()} aria-hidden="true">
      <span className="charm-lights">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="charm-lights charm-lights-soft">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="charm-cast" />
      <span ref={figure} className="charm-figure">
        <span ref={pop} className="charm-pop">
          <img src={SRC[name]} alt="" draggable={false} />
        </span>
      </span>
    </span>
  );
}
