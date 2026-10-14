import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { primaryButton } from "@/components/fields";
import { LessonButton } from "@/components/lesson-button";
import { StatusLine } from "@/components/pack-dot";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth";
import { getTeacherById, listClients } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { choiceOptions, labelOf } from "@/lib/labels";
import { describeStats, urgency } from "@/lib/stats";

export default async function TodayPage() {
  const session = await requireSession("teacher");
  const teacher = getTeacherById(session.user_id)!;
  const locale = await getLocale();
  const t = await getTranslations("today");
  const clientCopy = await getTranslations("client");
  const status = await getTranslations("status");
  const options = await choiceOptions();
  const clients = listClients(teacher.id).sort((a, b) => {
    const rank = urgency(a.stats) - urgency(b.stats);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
  const money = (cents: number) => formatMoney(cents, teacher.currency, locale);

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
        <Link className={primaryButton} href="/clients/new">
          {t("add")}
        </Link>
      </div>
      {clients.length === 0 ? (
        <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <ul className="space-y-3">
          {clients.map((client, index) => {
            const described = describeStats(client.stats, (key, values) => status(key as "leftOne", values as never), money);
            return (
              <li
                key={client.id}
                className="rise flex flex-col gap-4 rounded-2xl bg-ivory p-4 shadow-card sm:flex-row sm:items-center"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <Link href={`/clients/${client.id}`} className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-bold">{client.name}</h2>
                  <p className="text-sm text-soft">
                    {labelOf(options.subjects, client.subject_default)} · {labelOf(options.platforms, client.platform_default)} ·{" "}
                    {labelOf(options.locations, client.location_default)}
                  </p>
                  <StatusLine text={described.text} tone={described.tone} />
                </Link>
                <LessonButton
                  clientId={client.id}
                  label={t("lesson")}
                  savedLabel={t("saved")}
                  title={t("lengthTitle")}
                  lead={t("lengthLead")}
                  otherLabel={t("otherLength")}
                  hoursLabel={t("hoursLabel")}
                  saveLabel={t("lesson")}
                  closeLabel={clientCopy("close")}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
