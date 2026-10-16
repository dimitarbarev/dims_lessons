"use client";

import { useState } from "react";
import { useEscape } from "@/components/use-escape";

export function PaymentTotal({ label, amount }: { label: string; amount: string }) {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false), 1);

  return (
    <span className="inline-flex items-baseline gap-3">
      {open ? <span className="font-display text-2xl leading-none">{amount}</span> : null}
      <button
        type="button"
        className="nav-link text-sm text-ink/55"
        aria-pressed={open}
        onClick={() => setOpen((shown) => !shown)}
      >
        {label}
      </button>
    </span>
  );
}
