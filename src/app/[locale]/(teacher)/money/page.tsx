import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { StatusLine } from "@/components/pack-dot";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth";
import { getTeacherById, listClients } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { describeStats } from "@/lib/stats";

export default async function MoneyPage() {
  const session = await requireSession("teacher");
  const teacher = getTeacherById(session.user_id)!;
  const locale = await getLocale();
  const t = await getTranslations("money");
  const status = await getTranslations("status");
  const money = (cents: number) => formatMoney(cents, teacher.currency, locale);
  const clients = listClients(teacher.id);
  const owed = clients.filter((client) => client.stats.owedCents > 0);
  const packs = clients.filter((client) => client.stats.level === "low" || client.stats.level === "empty");

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 mb-6 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      {owed.length === 0 && packs.length === 0 ? (
        <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <div className="space-y-8">
          <Section title={t("owedHeading")} clients={owed} status={status} money={money} />
          <Section title={t("packHeading")} clients={packs} status={status} money={money} />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  clients,
  status,
  money,
}: {
  title: string;
  clients: ReturnType<typeof listClients>;
  status: Awaited<ReturnType<typeof getTranslations>>;
  money: (cents: number) => string;
}) {
  if (clients.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold tracking-[0.14em] text-soft uppercase">{title}</h2>
      <ul className="space-y-3">
        {clients.map((client) => {
          const described = describeStats(client.stats, (key, values) => status(key as "leftOne", values as never), money);
          return (
            <li key={client.id}>
              <Link href={`/clients/${client.id}`} className="rise block rounded-2xl bg-ivory p-4 shadow-card">
                <h3 className="text-xl font-bold">{client.name}</h3>
                <StatusLine text={described.text} tone={described.tone} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
