import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { StatusLine } from "@/components/pack-dot";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth";
import { getParentById, getTeacher, listClientsOfParent } from "@/lib/db";
import { formatCode, formatMoney } from "@/lib/format";
import { choiceOptions, labelOf } from "@/lib/labels";
import { describeStats } from "@/lib/stats";

export default async function FamilyPage() {
  const session = await requireSession("parent");
  const teacher = getTeacher();
  const locale = await getLocale();
  const t = await getTranslations("parent");
  const status = await getTranslations("status");
  const options = await choiceOptions();
  const parent = getParentById(session.user_id);
  const children = listClientsOfParent(session.user_id);
  const money = (cents: number) => formatMoney(cents, teacher?.currency ?? "EUR", locale);
  const phone = teacher?.phone?.trim() ?? "";

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-2 text-soft">{t("readOnly")}</p>
      {parent?.public_code ? <p className="mt-3 text-sm tracking-[0.28em] text-soft">{t("code")} {formatCode(parent.public_code)}</p> : null}

      <section className="mt-5 rounded-2xl bg-ivory p-5 shadow-card">
        <p className="text-sm font-bold text-soft">{t("teacher")}</p>
        <p className="font-display text-3xl">{teacher?.name}</p>
        {phone ? (
          <a className="btn btn-ink mt-4 inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium" href={`tel:${phone.replace(/\s/g, "")}`}>
            {t("call")} · {phone}
          </a>
        ) : (
          <p className="mt-2 text-sm text-soft">{t("noPhone")}</p>
        )}
      </section>

      {children.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {children.map((child) => {
            const described = describeStats(child.stats, (key, values) => status(key as "leftOne", values as never), money);
            return (
              <li key={child.id}>
                <Link href={`/family/${child.id}`} className="rise block rounded-2xl bg-ivory p-4 shadow-card">
                  <h2 className="text-xl font-bold">{child.name}</h2>
                  <p className="text-sm text-soft">
                    {labelOf(options.subjects, child.subject_default)} · {labelOf(options.locations, child.location_default)}
                  </p>
                  <StatusLine text={described.text} tone={described.tone} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
