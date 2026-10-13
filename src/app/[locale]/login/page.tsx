import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { BrandLink } from "@/components/brand-link";
import { primaryButton } from "@/components/fields";
import { Link } from "@/i18n/navigation";
import { signInWithPassword } from "@/lib/actions";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { getDb } from "@/lib/db";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  getDb();
  const t = await getTranslations("auth");
  const roleLabel = {
    teacher: t("teacherRole"),
    parent: t("parentRole"),
    student: t("studentRole"),
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandLink />
        <LanguageSwitch />
      </div>
      <p className="kicker">01</p>
      <h1 className="mt-2 font-display text-4xl">{t("signInTitle")}</h1>
      <p className="mt-2 text-soft">{t("signInLead")}</p>
      {error === "invalid" ? (
        <p className="mt-6 rounded-2xl bg-butter px-4 py-3 text-sm font-bold">{t("invalid")}</p>
      ) : null}
      <form action={signInWithPassword} className="mt-6 space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
        <label className="block">
          <span className="label">{t("email")}</span>
          <input className="field" name="email" type="email" required autoComplete="username" />
        </label>
        <label className="block">
          <span className="label">{t("password")}</span>
          <input className="field" name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className={primaryButton} type="submit">
          {t("enter")}
        </button>
      </form>
      {process.env.NODE_ENV === "development" ? (
        <table className="mt-8 w-full text-left text-sm">
          <caption className="mb-3 text-left text-soft">{t("demoLead")}</caption>
          <thead>
            <tr className="border-b border-faint text-soft">
              <th className="py-2 font-medium">{t("role")}</th>
              <th className="py-2 font-medium">{t("email")}</th>
              <th className="py-2 font-medium">{t("password")}</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map((account) => (
              <tr key={account.email} className="border-b border-faint">
                <td className="py-2">{roleLabel[account.role]}</td>
                <td className="py-2">{account.email}</td>
                <td className="py-2">{account.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <Link href="/" className="mt-6 text-sm font-bold text-soft">
        {t("back")}
      </Link>
    </div>
  );
}
