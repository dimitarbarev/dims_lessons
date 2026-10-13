import { getTranslations } from "next-intl/server";
import { ErrorBanner } from "@/components/error-banner";
import { Area, Field, primaryButton, SelectField } from "@/components/fields";
import { Link } from "@/i18n/navigation";
import { createClientAction } from "@/lib/actions";
import { choiceOptions } from "@/lib/labels";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("client");
  const common = await getTranslations("common");
  const options = await choiceOptions();

  return (
    <div>
      <Link href="/today" className="text-sm font-bold text-soft">
        {t("back")}
      </Link>
      <p className="mt-4 kicker">{t("newKicker")}</p>
      <h1 className="mt-2 font-display text-4xl">{t("newTitle")}</h1>
      <div className="mt-4">
        <ErrorBanner code={error} />
      </div>
      <form action={createClientAction} className="space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
        <Field label={t("name")} name="name" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t("kind")} name="kind" defaultValue="child" options={options.kinds} />
          <SelectField label={t("subject")} name="subject" defaultValue="math" options={options.subjects} />
          <SelectField label={t("platform")} name="platform" defaultValue="paper" options={options.platforms} />
          <SelectField label={t("place")} name="location" defaultValue="in_person" options={options.locations} />
          <Field label={t("price")} name="price" defaultValue="0" type="text" inputMode="decimal" />
          <SelectField label={t("billing")} name="billing" defaultValue="per_lesson" options={options.billing} />
          <Field label={t("packSize")} name="packSize" defaultValue="0" type="text" inputMode="numeric" />
          <Field label={t("amountNow")} name="amountNow" defaultValue="0" type="text" inputMode="decimal" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("parentName")} name="parentName" optional={common("optional")} />
          <Field label={t("parentEmail")} name="parentEmail" type="email" optional={common("optional")} />
          <Field label={t("parentPhone")} name="parentPhone" type="tel" optional={common("optional")} />
        </div>
        <details className="rounded-3xl bg-paper p-4">
          <summary className="cursor-pointer font-bold">{t("more")}</summary>
          <div className="mt-4 grid gap-4">
            <Field label={t("school")} name="school" optional={common("optional")} />
            <Field label={t("grade")} name="grade" optional={common("optional")} />
            <Area label={t("interests")} name="interests" optional={common("optional")} />
            <Area label={t("ambitions")} name="ambitions" optional={common("optional")} />
            <Field label={t("parentSocial")} name="parentSocial" optional={common("optional")} />
            <Field label={t("parentOccupation")} name="parentOccupation" optional={common("optional")} />
          </div>
        </details>
        <button className={primaryButton} type="submit">
          {t("save")}
        </button>
      </form>
    </div>
  );
}
