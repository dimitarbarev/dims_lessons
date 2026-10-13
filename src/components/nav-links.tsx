"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export type NavItem = {
  href: string;
  label: string;
  match: "exact" | "prefix";
  badge?: number;
};

type Box = { x: number; y: number; w: number; h: number };

function boxOf(el: HTMLElement): Box {
  return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
}

function isActive(pathname: string, item: NavItem) {
  return item.match === "exact" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [activeBox, setActiveBox] = useState<Box | null>(null);
  const [hoverBox, setHoverBox] = useState<Box | null>(null);
  const [hoverOn, setHoverOn] = useState(false);

  const place = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
    setActiveBox(current ? boxOf(current) : null);
    const hovered = nav.querySelector<HTMLElement>("[data-nav-item]:hover");
    if (hovered && hovered.getAttribute("aria-current") !== "page") {
      setHoverBox(boxOf(hovered));
      setHoverOn(true);
    }
  }, []);

  useLayoutEffect(() => {
    place();
    setReady(true);
    const nav = navRef.current;
    if (!nav) return;
    const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduce ? "auto" : "smooth" });
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    nav.querySelectorAll<HTMLElement>("[data-nav-item]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [place, pathname, items]);

  if (items.length === 0) return null;

  return (
    <nav
      ref={navRef}
      data-ready={ready ? "" : undefined}
      className="nav-rail"
      onMouseLeave={() => setHoverOn(false)}
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
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-nav-item=""
            aria-current={active ? "page" : undefined}
            className="nav-item"
            onMouseEnter={(event) => {
              if (event.currentTarget.getAttribute("aria-current") === "page") {
                setHoverOn(false);
                return;
              }
              setHoverBox(boxOf(event.currentTarget));
              setHoverOn(true);
            }}
          >
            {item.label}
            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
