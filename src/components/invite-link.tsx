"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { copyText } from "@/components/phone-link";

export function InviteLink({
  code,
  label,
  copiedLabel,
}: {
  code: string;
  label: string;
  copiedLabel: string;
}) {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const digits = code.replace(/\D/g, "");

  return (
    <button
      type="button"
      className="text-sm font-semibold tracking-normal text-ink underline decoration-ink/30 underline-offset-4"
      onClick={async () => {
        const url = `${window.location.origin}/${locale}/register?code=${digits}`;
        const ok = await copyText(url);
        if (!ok) return;
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
