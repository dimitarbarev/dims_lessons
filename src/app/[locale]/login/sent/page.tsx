import { redirect } from "@/i18n/navigation";

export default async function SentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/login", locale });
  throw new Error("Redirect failed");
}
