import { signOutAction } from "@/lib/actions";
import { BrandLink } from "./brand-link";
import { LanguageSwitch } from "./language-switch";
import { NavLinks, type NavItem } from "./nav-links";

export async function Shell({
  homeHref,
  signOutLabel,
  items,
  children,
}: {
  homeHref: string;
  signOutLabel: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <BrandLink href={homeHref} className="text-[15px] font-medium tracking-tight text-ink" />
        <div className="flex items-center gap-4">
          <LanguageSwitch />
          <form action={signOutAction}>
            <button type="submit" className="nav-link text-[15px] text-ink/70">
              {signOutLabel}
            </button>
          </form>
        </div>
      </header>
      <NavLinks items={items} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
