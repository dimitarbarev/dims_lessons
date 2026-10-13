import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { butterButton, primaryButton } from "@/components/fields";
import { acceptRegistration, declineRegistration } from "@/lib/actions";
import { listPendingRegistrations } from "@/lib/db";
import { choiceOptions, labelOf } from "@/lib/labels";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("signups");
  const options = await choiceOptions();
  const rows = listPendingRegistrations();

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 mb-6 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <ErrorBanner code={error} />
      {rows.length === 0 ? (
        <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rise rounded-2xl bg-ivory p-5 shadow-card">
              <p className="text-sm font-bold text-soft">{t("child")}</p>
              <h2 className="font-display text-3xl">{row.child_name}</h2>
              <p className="text-soft">{labelOf(options.subjects, row.subject)}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="inline font-bold">{t("parent")}: </dt>
                  <dd className="inline">
                    {row.parent_name} · {row.parent_email}
                    {row.parent_phone ? ` · ${row.parent_phone}` : ""}
                  </dd>
                </div>
                {row.parent_occupation ? <div>{row.parent_occupation}</div> : null}
                {row.parent_social ? <div>{row.parent_social}</div> : null}
                {row.school ? <div>{row.school}</div> : null}
                {row.grade ? <div>{row.grade}</div> : null}
                {row.interests ? <div>{row.interests}</div> : null}
                {row.ambitions ? <div>{row.ambitions}</div> : null}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={acceptRegistration}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className={primaryButton} type="submit">
                    {t("accept")}
                  </button>
                </form>
                <form action={declineRegistration}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className={butterButton} type="submit">
                    {t("decline")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
