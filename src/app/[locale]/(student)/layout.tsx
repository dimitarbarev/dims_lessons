import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Shell } from "@/components/shell";
import { getSession, homeFor } from "@/lib/auth";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    throw new Error("Redirect failed");
  }
  if (session.role !== "student") {
    redirect({ href: homeFor(session.role), locale });
    throw new Error("Redirect failed");
  }
  const t = await getTranslations("nav");

  return (
    <Shell homeHref="/my" signOutLabel={t("signOut")} items={[]}>
      {children}
    </Shell>
  );
}
