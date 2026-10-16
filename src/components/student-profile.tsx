"use client";

import { useState, type ReactNode } from "react";
import { primaryButton } from "@/components/fields";
import { useEscape } from "@/components/use-escape";

export function StudentProfile({
  portrait,
  name,
  facts,
  editLabel,
  cancelLabel,
  startEditing,
  children,
  footer,
}: {
  portrait: "boy" | "girl";
  name: string;
  facts: { label: string; value: string }[];
  editLabel: string;
  cancelLabel: string;
  startEditing?: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  const [editing, setEditing] = useState(Boolean(startEditing));
  useEscape(editing, () => setEditing(false), 1);
  const src = portrait === "boy" ? "/portrait-boy.jpg" : "/portrait-girl.jpg";

  return (
    <div>
      <div className="overflow-hidden rounded-[28px] bg-ink">
        <img src={src} alt="" width={1024} height={1024} className="h-72 w-full object-cover object-[center_18%]" />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <h2 className="font-display text-4xl">{name}</h2>
        {editing ? (
          <button type="button" className="nav-link text-sm text-ink/70" onClick={() => setEditing(false)}>
            {cancelLabel}
          </button>
        ) : (
          <button type="button" className={primaryButton} onClick={() => setEditing(true)}>
            {editLabel}
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-6">{children}</div>
      ) : (
        <>
          <dl className="mt-6">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-baseline justify-between gap-6 border-t border-ink/10 py-3">
                <dt className="text-sm text-soft">{fact.label}</dt>
                <dd className="text-right">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">{footer}</div>
        </>
      )}
    </div>
  );
}
