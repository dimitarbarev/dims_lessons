"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Area, Field, primaryButton, SelectField } from "@/components/fields";
import { submitRegistration } from "@/lib/actions";

export function RegisterForm({
  subjects,
  code,
  pays,
}: {
  subjects: { value: string; label: string }[];
  code: string;
  pays: boolean;
}) {
  const t = useTranslations("register");
  const common = useTranslations("common");
  const [paysSelf, setPaysSelf] = useState(pays);

  return (
    <form action={submitRegistration} className="mt-6 space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
      <input type="hidden" name="paysSelf" value={paysSelf ? "1" : "0"} />
      <h2 className="font-display text-3xl">{t("studentHeading")}</h2>
      <Field label={t("childName")} name="childName" required />
      <SelectField
        label={t("portrait")}
        name="portrait"
        defaultValue="girl"
        options={[
          { value: "girl", label: t("girl") },
          { value: "boy", label: t("boy") },
        ]}
      />
      <SelectField label={t("subject")} name="subject" defaultValue="math" options={subjects} />
      <Field label={t("school")} name="school" optional={common("optional")} />
      <Field label={t("grade")} name="grade" optional={common("optional")} />
      <Area label={t("interests")} name="interests" optional={common("optional")} />
      <Area label={t("ambitions")} name="ambitions" optional={common("optional")} />

      <label className="flex items-center justify-between gap-4 rounded-3xl bg-paper px-4 py-3">
        <span>
          <span className="block font-bold">{t("paysSelf")}</span>
          <span className="mt-1 block text-sm text-soft">{t("paysSelfLead")}</span>
        </span>
        <input
          type="checkbox"
          className="size-5 accent-ink"
          checked={paysSelf}
          onChange={(event) => setPaysSelf(event.target.checked)}
        />
      </label>

      {paysSelf ? (
        <div className="grid gap-4">
          <Field label={t("email")} name="email" type="email" required />
          <Field label={t("phone")} name="phone" type="tel" optional={common("optional")} />
        </div>
      ) : (
        <div className="grid gap-4 rounded-[28px] border border-ink/10 bg-blush/40 p-4">
          <h2 className="font-display text-3xl">{t("parentHeading")}</h2>
          <p className="text-sm text-soft">{t("parentLead")}</p>
          <Field label={t("parentName")} name="parentName" required />
          <Field label={t("email")} name="email" type="email" required />
          <Field label={t("phone")} name="phone" type="tel" optional={common("optional")} />
          <Field label={t("social")} name="social" optional={common("optional")} />
          <Field label={t("occupation")} name="occupation" hint={t("occupationHint")} optional={common("optional")} />
        </div>
      )}

      <Field label={t("teacherCode")} name="teacherCode" defaultValue={code} hint={t("teacherCodeHint")} inputMode="numeric" required />
      <button className={primaryButton} type="submit">
        {t("submit")}
      </button>
    </form>
  );
}
