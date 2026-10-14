"use client";

import { useState } from "react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { MoodMark } from "@/components/mood-mark";
import { archiveFeedback } from "@/lib/actions";

export type FeedbackTicket = {
  id: string;
  kind: "request" | "note";
  who: string;
  about: string;
  title: string;
  body: string;
  date: string;
  mood: number | null;
  scores: { label: string; value: number }[];
};

export function FeedbackBoard({
  sent,
  received,
  archived,
  labels,
  emptyTitle,
  emptyLead,
}: {
  sent: FeedbackTicket[];
  received: FeedbackTicket[];
  archived: FeedbackTicket[];
  labels: {
    sent: string;
    received: string;
    archive: string;
    archiveAction: string;
    restore: string;
    restoreAsk: string;
    restoreLead: string;
    archiveAsk: string;
    archiveLead: string;
    cancel: string;
  };
  emptyTitle: string;
  emptyLead: string;
}) {
  const [view, setView] = useState<"sent" | "received" | "archive">("received");
  const lists = { sent, received, archive: archived };
  const tickets = lists[view];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tab pressed={view === "sent"} onClick={() => setView("sent")}>
          {labels.sent}
          <Count n={sent.length} />
        </Tab>
        <Tab pressed={view === "received"} onClick={() => setView("received")}>
          {labels.received}
          <Count n={received.length} />
        </Tab>
        <button type="button" className={`nav-link ml-auto text-sm ${view === "archive" ? "text-ink" : "text-ink/60"}`} aria-pressed={view === "archive"} onClick={() => setView("archive")}>
          {labels.archive}
          {archived.length ? ` ${archived.length}` : ""}
        </button>
      </div>
      {tickets.length === 0 ? (
        <div className="rounded-[28px] bg-ivory px-5 py-8 shadow-card">
          <h2 className="font-display text-3xl">{emptyTitle}</h2>
          <p className="mt-2 text-soft">{emptyLead}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tickets.map((ticket) => (
            <li key={`${ticket.kind}-${ticket.id}`} className={`rounded-[28px] bg-ivory p-4 shadow-card ${ticket.mood ? "sm:col-span-2" : ""}`}>
              <div className="flex items-start gap-4">
                {ticket.mood ? <MoodMark level={ticket.mood} label={String(ticket.mood)} /> : <span className="mt-1 inline-block size-8 rounded-full bg-paper" aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-soft">
                    {ticket.who}
                    {ticket.about ? ` · ${ticket.about}` : ""} · {ticket.date}
                  </p>
                  <h2 className="mt-1 font-display text-2xl leading-tight">{ticket.title}</h2>
                  {ticket.body ? <p className="mt-2 text-sm">{ticket.body}</p> : null}
                  {ticket.scores.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-3">
                      {ticket.scores.map((score) => (
                        <li key={score.label} className="flex items-center gap-1.5 text-xs text-soft">
                          <MoodMark level={score.value} small label={score.label} />
                          {score.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {view === "archive" ? (
                  <form action={archiveFeedback}>
                    <input type="hidden" name="kind" value={ticket.kind} />
                    <input type="hidden" name="id" value={ticket.id} />
                    <input type="hidden" name="archived" value="0" />
                    <ConfirmSubmit
                      label={labels.restore}
                      title={labels.restoreAsk}
                      message={labels.restoreLead}
                      cancel={labels.cancel}
                      className="nav-link text-sm text-ink/60"
                    />
                  </form>
                ) : (
                  <form action={archiveFeedback}>
                    <input type="hidden" name="kind" value={ticket.kind} />
                    <input type="hidden" name="id" value={ticket.id} />
                    <ConfirmSubmit
                      label={labels.archiveAction}
                      title={labels.archiveAsk}
                      message={labels.archiveLead}
                      cancel={labels.cancel}
                      className="nav-link text-sm text-ink/60"
                    />
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tab({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`rounded-full px-4 py-2 text-sm ${pressed ? "bg-ink text-paper" : "bg-ivory text-ink shadow-card"}`}>
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-2 text-xs opacity-70">{n}</span>;
}
