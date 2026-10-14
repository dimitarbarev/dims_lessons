import { getTranslations } from "next-intl/server";
import { signOutAction } from "@/lib/actions";
import { BrandButton } from "./brand-button";
import { LanguageSwitch } from "./language-switch";
import { NavLinks, type NavItem } from "./nav-links";

export async function Shell({
  signOutLabel,
  items,
  children,
}: {
  homeHref: string;
  signOutLabel: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const meta = await getTranslations("meta");

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <BrandButton title={meta("title")} />
        <LanguageSwitch
          trailing={
            <form action={signOutAction} className="contents">
              <button type="submit" data-nav-item="" className="nav-item">
                {signOutLabel}
              </button>
            </form>
          }
        />
      </header>
      <NavLinks items={items} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
