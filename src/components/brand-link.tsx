import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function BrandLink({
  href = "/",
  className = "font-display text-2xl text-ink",
}: {
  href?: string;
  className?: string;
}) {
  const t = await getTranslations("meta");
  return (
    <Link href={href} className={className}>
      {t("title")}
    </Link>
  );
}
