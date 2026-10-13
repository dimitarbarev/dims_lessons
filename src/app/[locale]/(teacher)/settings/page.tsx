import { getTranslations } from "next-intl/server";
import { ErrorBanner } from "@/components/error-banner";
import { Field, primaryButton, SelectField } from "@/components/fields";
import { saveSettings } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { getTeacherById } from "@/lib/db";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const session = await requireSession("teacher");
  const teacher = getTeacherById(session.user_id)!;
  const t = await getTranslations("settings");

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 font-display text-4xl">{t("title")}</h1>
      <p className="mt-2 mb-5 text-soft">{t("lead")}</p>
      <ErrorBanner code={error} />
      {saved === "1" ? <p className="mb-4 text-sm font-bold text-sage">{t("saved")}</p> : null}
      <form action={saveSettings} className="grid gap-4 rounded-2xl bg-ivory p-5 shadow-card">
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
        <button className={primaryButton} type="submit">
          {t("save")}
        </button>
      </form>
    </div>
  );
}
