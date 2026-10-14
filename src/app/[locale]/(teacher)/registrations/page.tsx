import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { butterButton, primaryButton } from "@/components/fields";
import { SignupBoard } from "@/components/signup-board";
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
  const client = await getTranslations("client");
  const options = await choiceOptions();
  const rows = listPendingRegistrations();
  const panels = Object.fromEntries(
    rows.map((row) => [
      row.id,
      <div key={row.id}>
        <img
          src={row.portrait === "boy" ? "/portrait-boy.jpg" : "/portrait-girl.jpg"}
          alt=""
          width={1024}
          height={1024}
          className="mb-4 aspect-[4/3] w-full rounded-[22px] object-cover object-[center_18%]"
        />
        <h2 className="font-display text-4xl">{row.child_name}</h2>
        <p className="mt-1 text-soft">{labelOf(options.subjects, row.subject)}</p>
        <dl className="mt-6">
          <Fact label={t("child")} value={row.child_name} />
          <Fact label={client("subject")} value={labelOf(options.subjects, row.subject)} />
          <Fact label={client("school")} value={row.school || "—"} />
          <Fact label={client("grade")} value={row.grade || "—"} />
          <Fact label={client("interests")} value={row.interests || "—"} />
          <Fact label={client("ambitions")} value={row.ambitions || "—"} />
          <Fact label={t("parent")} value={row.parent_name} />
          <Fact label={client("parentEmail")} value={row.parent_email} />
          <Fact label={client("parentPhone")} value={row.parent_phone || "—"} />
          <Fact label={client("parentOccupation")} value={row.parent_occupation || "—"} />
          <Fact label={client("parentSocial")} value={row.parent_social || "—"} />
        </dl>
        <div className="mt-6 flex flex-wrap items-center gap-4">
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
      </div>,
    ]),
  );

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 mb-6 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <ErrorBanner code={error} />
      {rows.length === 0 ? (
        <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <SignupBoard
          closeLabel={client("close")}
          cards={rows.map((row) => ({
            id: row.id,
            name: row.child_name,
            subject: labelOf(options.subjects, row.subject),
            portrait: row.portrait === "boy" ? "boy" : "girl",
          }))}
          panels={panels}
        />
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-ink/10 py-3">
      <dt className="text-sm text-soft">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
