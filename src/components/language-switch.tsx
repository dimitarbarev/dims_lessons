"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { rememberLocale } from "@/lib/actions";

export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: "en" | "bg") {
    if (next === locale) return;
    start(async () => {
      await rememberLocale(next);
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-2 text-[15px]">
      {(["en", "bg"] as const).map((code, index) => (
        <span key={code} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="text-mute">/</span> : null}
          <button
            type="button"
            disabled={pending}
            aria-pressed={locale === code}
            onClick={() => choose(code)}
            className={`nav-link ${locale === code ? "text-ink" : "text-ink/70"}`}
          >
            {code === "en" ? "EN" : "БГ"}
          </button>
        </span>
      ))}
    </div>
  );
}
