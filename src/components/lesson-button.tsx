"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { logQuickLesson } from "@/lib/actions";

export function LessonButton({
  clientId,
  label,
  savedLabel,
}: {
  clientId: string;
  label: string;
  savedLabel: string;
}) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-ink inline-flex min-h-10 min-w-28 items-center justify-center rounded-full px-4 text-sm font-medium tracking-tight disabled:opacity-45"
      onClick={() => {
        start(async () => {
          await logQuickLesson(clientId);
          setSaved(true);
          router.refresh();
          window.setTimeout(() => setSaved(false), 1400);
        });
      }}
    >
      <span className={saved ? "check-pop" : undefined}>{saved ? savedLabel : label}</span>
    </button>
  );
}
