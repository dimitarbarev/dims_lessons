import { getLocale, getTranslations } from "next-intl/server";
import { ErrorBanner } from "@/components/error-banner";
import { Area, primaryButton, SelectField } from "@/components/fields";
import { Scale } from "@/components/scale";
import { addFeedbackNote, answerRequest } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { listClientsOfParent, listNotesForParent, listRequestsForParent } from "@/lib/db";
import { formatDay } from "@/lib/format";

export default async function ParentFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const session = await requireSession("parent");
  const locale = await getLocale();
  const t = await getTranslations("feedback");
  const settings = await getTranslations("settings");
  const children = listClientsOfParent(session.user_id);
  const notes = listNotesForParent(session.user_id);
  const requests = listRequestsForParent(session.user_id);
  const open = requests.filter((request) => request.status === "open");

  return (
    <div className="space-y-5">
      <p className="kicker">{t("kicker")}</p>
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <ErrorBanner code={error} />
      {saved === "1" ? <p className="text-sm font-bold text-sage">{settings("saved")}</p> : null}

      {open.map((request) => (
        <form key={request.id} action={answerRequest} className="space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
          <input type="hidden" name="requestId" value={request.id} />
          <p className="text-sm font-bold text-apricot">{t("request")}</p>
          <h2 className="font-display text-2xl">{request.open_question}</h2>
          {request.client_name ? <p className="text-sm text-soft">{request.client_name}</p> : null}
          <p className="text-xs text-soft">{t("scaleHint")}</p>
          <Scale name="pace" label={t("pace")} />
          <Scale name="following" label={t("following")} />
          <Scale name="homework" label={t("homework")} />
          <Scale name="overall" label={t("overall")} />
          <Area label={t("answer")} name="openAnswer" />
          <button className={primaryButton} type="submit">
            {t("sendAnswer")}
          </button>
        </form>
      ))}

      <form action={addFeedbackNote} className="space-y-4 rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="font-display text-2xl">{t("note")}</h2>
        <p className="text-sm text-soft">{t("noteHint")}</p>
        {children.length > 0 ? (
          <SelectField
            label={t("about")}
            name="clientId"
            defaultValue=""
            options={[{ value: "", label: t("family") }, ...children.map((child) => ({ value: child.id, label: child.name }))]}
          />
        ) : null}
        <Area label={t("note")} name="body" />
        <button className={primaryButton} type="submit">
          {t("saveNote")}
        </button>
      </form>

      {notes.length > 0 ? (
        <section>
          <h2 className="mb-3 font-bold">{t("yourNotes")}</h2>
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-2xl bg-ivory p-4 shadow-card">
                <p className="text-sm font-bold text-soft">
                  {note.client_name ?? t("family")} · {formatDay(note.created_at, locale)}
                </p>
                <p className="mt-1">{note.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
