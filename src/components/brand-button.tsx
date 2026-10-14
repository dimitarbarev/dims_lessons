"use client";

import { PillRail } from "./pill-rail";

export function BrandButton({ title }: { title: string }) {
  return (
    <PillRail>
      <button
        type="button"
        data-nav-item=""
        className="nav-item"
        onClick={() => window.dispatchEvent(new Event("lessons:forest"))}
      >
        {title}
      </button>
    </PillRail>
  );
}
