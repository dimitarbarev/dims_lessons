import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { listFeedbackNotes, listFeedbackRequests } from "@/lib/db";
import { formatDay } from "@/lib/format";

export default async function TeacherFeedbackPage() {
  const t = await getTranslations("feedback");
  const locale = await getLocale();
  const notes = listFeedbackNotes();
  const requests = listFeedbackRequests();

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 mb-6 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      {notes.length === 0 && requests.length === 0 ? (
        <EmptyState title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="rise rounded-2xl bg-ivory p-5 shadow-card">
              <p className="text-sm font-bold text-soft">
                {request.parent_name}
                {request.client_name ? ` · ${request.client_name}` : ""} ·{" "}
                {request.status === "answered" ? t("answered") : t("waiting")}
              </p>
              <h2 className="mt-1 text-xl font-bold">{request.open_question}</h2>
              {request.status === "answered" ? (
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    {t("pace")}: {request.pace}
                  </div>
                  <div>
                    {t("following")}: {request.following_score}
                  </div>
                  <div>
                    {t("homework")}: {request.homework_score}
                  </div>
                  <div>
                    {t("overall")}: {request.overall}
                  </div>
                </dl>
              ) : null}
              {request.open_answer ? <p className="mt-3">{request.open_answer}</p> : null}
              <p className="mt-2 text-xs text-soft">{formatDay(request.created_at, locale)}</p>
            </article>
          ))}
          {notes.map((note) => (
            <article key={note.id} className="rise rounded-2xl bg-ivory p-5 shadow-card">
              <p className="text-sm font-bold text-soft">
                {note.parent_name}
                {note.client_name ? ` · ${note.client_name}` : ""} · {formatDay(note.created_at, locale)}
              </p>
              <p className="mt-2 text-lg">{note.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
