import { getTranslations } from "next-intl/server";
import { ErrorBanner } from "@/components/error-banner";
import { Area, Field, primaryButton, SelectField } from "@/components/fields";
import { LanguageSwitch } from "@/components/language-switch";
import { BrandLink } from "@/components/brand-link";
import { Link } from "@/i18n/navigation";
import { submitRegistration } from "@/lib/actions";
import { choiceOptions } from "@/lib/labels";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const t = await getTranslations("register");
  const common = await getTranslations("common");
  const options = await choiceOptions();

  return (
    <div className="mx-auto min-h-screen max-w-lg px-5 py-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandLink />
        <LanguageSwitch />
      </div>
      {sent === "1" ? (
        <div className="rise rounded-2xl bg-ivory p-6 shadow-card">
          <h1 className="font-display text-4xl">{t("thanksTitle")}</h1>
          <p className="mt-3 text-soft">{t("thanksLead")}</p>
          <Link className={`${primaryButton} mt-6`} href="/login">
            {t("signIn")}
          </Link>
        </div>
      ) : (
        <>
          <p className="kicker">{t("kicker")}</p>
          <h1 className="mt-2 font-display text-4xl">{t("title")}</h1>
          <p className="mt-2 text-soft">{t("lead")}</p>
          <ErrorBanner code={error} />
          <form action={submitRegistration} className="mt-6 space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
            <Field label={t("parentName")} name="parentName" required />
            <Field label={t("email")} name="email" type="email" required />
            <Field label={t("phone")} name="phone" type="tel" optional={common("optional")} />
            <Field label={t("social")} name="social" optional={common("optional")} />
            <Field
              label={t("occupation")}
              name="occupation"
              hint={t("occupationHint")}
              optional={common("optional")}
            />
            <Field label={t("childName")} name="childName" required />
            <SelectField label={t("subject")} name="subject" defaultValue="math" options={options.subjects} />
            <Field label={t("school")} name="school" optional={common("optional")} />
            <Field label={t("grade")} name="grade" optional={common("optional")} />
            <Area label={t("interests")} name="interests" optional={common("optional")} />
            <Area label={t("ambitions")} name="ambitions" optional={common("optional")} />
            <button className={primaryButton} type="submit">
              {t("submit")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
