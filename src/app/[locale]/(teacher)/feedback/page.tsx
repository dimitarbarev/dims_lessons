import { getLocale, getTranslations } from "next-intl/server";
import { FeedbackBoard, type FeedbackTicket } from "@/components/feedback-board";
import { listFeedbackNotes, listFeedbackRequests } from "@/lib/db";
import { formatDay } from "@/lib/format";

export default async function TeacherFeedbackPage() {
  const t = await getTranslations("feedback");
  const locale = await getLocale();
  const notes = listFeedbackNotes();
  const requests = listFeedbackRequests();
  const requestTickets = requests.map((request) => ({
    id: request.id,
    kind: "request",
    who: request.parent_name ?? "",
    about: request.client_name ?? "",
    title: request.open_question,
    body: request.open_answer,
    date: formatDay(request.created_at, locale),
    mood: request.status === "answered" ? request.overall : null,
    scores:
      request.status === "answered"
        ? [
            { label: t("pace"), value: request.pace ?? 3 },
            { label: t("following"), value: request.following_score ?? 3 },
            { label: t("homework"), value: request.homework_score ?? 3 },
          ]
        : [],
    archived: request.archived === 1,
    waiting: request.status !== "answered",
  }));

  const noteTickets = notes.map((note) => ({
    id: note.id,
    kind: "note",
    who: note.parent_name,
    about: note.client_name ?? "",
    title: note.body,
    body: "",
    date: formatDay(note.created_at, locale),
    mood: null,
    scores: [],
    archived: note.archived === 1,
    waiting: false,
  }));

  const sent = requestTickets.filter((ticket) => ticket.waiting && !ticket.archived);
  const received = [
    ...requestTickets.filter((ticket) => !ticket.waiting && !ticket.archived),
    ...noteTickets.filter((ticket) => !ticket.archived),
  ];
  const archived = [...requestTickets, ...noteTickets].filter((ticket) => ticket.archived);

  return (
    <div>
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-2 mb-6 font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <FeedbackBoard
        sent={sent.map(strip)}
        received={received.map(strip)}
        archived={archived.map(strip)}
        emptyTitle={t("emptyTitle")}
        emptyLead={t("emptyLead")}
        labels={{
          sent: t("sent"),
          received: t("received"),
          archive: t("archive"),
          archiveAction: t("archiveAction"),
          restore: t("restore"),
        }}
      />
    </div>
  );
}

function strip(ticket: {
  id: string;
  kind: string;
  who: string;
  about: string;
  title: string;
  body: string;
  date: string;
  mood: number | null;
  scores: { label: string; value: number }[];
}): FeedbackTicket {
  return { ...ticket, kind: ticket.kind === "note" ? "note" : "request" };
}
