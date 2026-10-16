"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

const COINS = [
  { x: "-54px", y: "-78px", r: "-40deg" },
  { x: "-28px", y: "-96px", r: "30deg" },
  { x: "6px", y: "-104px", r: "-16deg" },
  { x: "36px", y: "-90px", r: "48deg" },
  { x: "62px", y: "-70px", r: "-28deg" },
  { x: "-72px", y: "-46px", r: "18deg" },
  { x: "78px", y: "-40px", r: "-36deg" },
  { x: "-18px", y: "-58px", r: "22deg" },
  { x: "22px", y: "-64px", r: "-12deg" },
  { x: "-46px", y: "-28px", r: "40deg" },
  { x: "48px", y: "-24px", r: "-22deg" },
  { x: "0px", y: "-84px", r: "14deg" },
];

export function SavePaymentButton({ label, celebrate }: { label: string; celebrate?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="pay-save-wrap">
      {celebrate ? <CoinBurst /> : null}
      <button className={`pay-save${pending ? " is-pending" : ""}`} type="submit" disabled={pending}>
        {label}
      </button>
    </div>
  );
}

function CoinBurst() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("paid")) return;
    url.searchParams.delete("paid");
    const next = url.pathname + (url.searchParams.size ? `?${url.searchParams}` : "");
    window.history.replaceState(null, "", next);
  }, []);

  return (
    <span className="coin-burst" aria-hidden="true">
      {COINS.map((coin, index) => (
        <i key={index} style={{ ["--x" as string]: coin.x, ["--y" as string]: coin.y, ["--r" as string]: coin.r, ["--i" as string]: index }} />
      ))}
    </span>
  );
}
