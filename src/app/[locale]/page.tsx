import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { WelcomeHero } from "@/components/welcome-hero";
import { getSession, homeFor } from "@/lib/auth";

export default async function WelcomePage() {
  const t = await getTranslations("welcome");
  const meta = await getTranslations("meta");
  const session = await getSession();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-clip px-4 py-6 sm:px-8 lg:justify-center lg:px-12 lg:py-10">
      <div className="mb-8 flex justify-end">
        <LanguageSwitch />
      </div>
      <WelcomeHero
        title={meta("title")}
        kicker={t("kicker")}
        lead={t("lead")}
        signIn={t("signIn")}
        continueHref={session ? homeFor(session.role) : undefined}
        continueLabel={session ? t("continue") : undefined}
      />
    </div>
  );
}
