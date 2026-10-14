"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function PhoneLink({ phone }: { phone: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const dial = phone.replace(/[^\d+]/g, "");
  if (!phone.trim() || !dial) return <span>{phone}</span>;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <a href={`tel:${dial}`} className="underline decoration-ink/30 underline-offset-4">
        {phone}
      </a>
      <button
        type="button"
        className="text-xs font-semibold tracking-normal text-soft"
        onClick={async () => {
          const ok = await copyText(phone);
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </span>
  );
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
