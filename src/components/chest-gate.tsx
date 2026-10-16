"use client";

import { useRef } from "react";
import { Charm } from "@/components/charm";

export function ChestGate() {
  const taps = useRef(0);

  function tap() {
    taps.current += 1;
    if (taps.current < 5) return;
    taps.current = 0;
    window.dispatchEvent(new Event("lessons:coins"));
  }

  return <Charm name="chest" play className="charm-seat charm-seat-chest" onTap={tap} />;
}
