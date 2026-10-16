"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { butterButton, Field, primaryButton, SelectField } from "@/components/fields";
import { InviteLink } from "@/components/invite-link";
import { PhoneLink } from "@/components/phone-link";
import { saveSettings } from "@/lib/actions";
import { useEscape } from "@/components/use-escape";

export function SettingsView({
  teacher,
  startEditing,
  notice,
}: {
  teacher: { name: string; email: string; phone: string; currency: string; code: string };
  startEditing: boolean;
  notice?: ReactNode;
}) {
  const t = useTranslations("settings");
  const [editing, setEditing] = useState(startEditing);
  const taps = useRef(0);
  useEscape(editing, () => setEditing(false));

  function tapWizard() {
    taps.current += 1;
    if (taps.current < 5) return;
    taps.current = 0;
    window.dispatchEvent(new Event("lessons:coins"));
  }

  return (
    <div>
      <button type="button" className="grove-frame" aria-label={teacher.name} onClick={tapWizard}>
        <img
          src="/grove.jpg"
          alt=""
          width={1024}
          height={796}
          draggable={false}
          className="grove-photo"
        />
      </button>
      <div className="relative z-10 -mt-16 sm:-mt-20">
        <p className="kicker">{t("kicker")}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-4xl sm:text-5xl">{teacher.name}</h1>
          {editing ? (
            <button type="button" className={butterButton} onClick={() => setEditing(false)}>
              {t("cancel")}
            </button>
          ) : (
            <button type="button" className={primaryButton} onClick={() => setEditing(true)}>
              {t("edit")}
            </button>
          )}
        </div>
        <p className="mt-2 max-w-md text-soft">{t("lead")}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm tracking-[0.28em] text-soft">
          <span>
            {t("code")} {teacher.code}
          </span>
          <InviteLink code={teacher.code} label={t("invite")} copiedLabel={t("inviteCopied")} />
        </p>
        <p className="mt-2 max-w-md text-sm text-soft">{t("inviteLead")}</p>
        {notice}
        {editing ? (
          <form action={saveSettings} className="mt-6 grid max-w-lg gap-4 rounded-[28px] bg-ivory p-5 shadow-card">
            <Field label={t("name")} name="name" defaultValue={teacher.name} required />
            <Field label={t("email")} name="email" type="email" defaultValue={teacher.email} required />
            <Field label={t("phone")} name="phone" type="tel" defaultValue={teacher.phone} />
            <SelectField
              label={t("currency")}
              name="currency"
              defaultValue={teacher.currency}
              options={[
                { value: "EUR", label: "EUR" },
                { value: "BGN", label: "BGN" },
              ]}
            />
            <div className="justify-self-start">
              <button className={primaryButton} type="submit">
                {t("save")}
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-8 max-w-lg">
            <Fact label={t("email")} value={teacher.email} />
            <Fact label={t("phone")} value={teacher.phone ? <PhoneLink phone={teacher.phone} /> : "—"} />
            <Fact label={t("currency")} value={teacher.currency} />
          </dl>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-ink/10 py-3">
      <dt className="text-sm text-soft">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
