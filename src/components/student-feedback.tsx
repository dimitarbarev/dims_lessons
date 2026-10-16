"use client";

import { useState, type ReactNode } from "react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { butterButton, primaryButton } from "@/components/fields";
import { MoodMark } from "@/components/mood-mark";
import { archiveFeedback } from "@/lib/actions";
import { useEscape } from "@/components/use-escape";

export type FeedbackItem = {
  id: string;
  kind: "note" | "request";
  who: string;
  date: string;
  lesson?: string;
  title: string;
  body: string;
  waiting: boolean;
  scores: { label: string; value: number }[];
};

export function StudentFeedback({
  items,
  archived,
  request,
  back,
  labels,
}: {
  items: FeedbackItem[];
  archived: FeedbackItem[];
  request: ReactNode;
  back: string;
  labels: {
    request: string;
    archive: string;
    latest: string;
    empty: string;
    archiveEmpty: string;
    waiting: string;
    archiveAction: string;
    restore: string;
    archiveAsk: string;
    archiveLead: string;
    restoreAsk: string;
    restoreLead: string;
    cancel: string;
  };
}) {
  const [asking, setAsking] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = showArchive ? archived : items;

  useEscape(asking || showArchive || openId !== null, () => {
    if (openId) setOpenId(null);
    else if (asking) setAsking(false);
    else setShowArchive(false);
  }, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            setAsking((open) => !open);
            setShowArchive(false);
          }}
        >
          {labels.request}
        </button>
        <button
          type="button"
          className={butterButton}
          onClick={() => {
            setShowArchive((open) => !open);
            setAsking(false);
            setOpenId(null);
          }}
        >
          {labels.archive}
        </button>
      </div>
      {asking ? request : null}
      {shown.length === 0 ? <p className="text-soft">{showArchive ? labels.archiveEmpty : labels.empty}</p> : null}
      <ul className="space-y-3">
        {shown.map((item, index) => {
          const open = openId === `${item.kind}-${item.id}`;
          return (
            <li key={`${item.kind}-${item.id}`} className="rounded-3xl bg-paper px-4 py-3">
              {index === 0 && !showArchive ? <p className="mb-1 text-xs font-bold tracking-[0.14em] text-soft uppercase">{labels.latest}</p> : null}
              <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : `${item.kind}-${item.id}`)}>
                <p className="font-bold">
                  {item.who} · {item.date}
                  {item.waiting ? <span className="ml-2 text-sm font-semibold text-soft">{labels.waiting}</span> : null}
                </p>
                {item.lesson ? <p className="mt-1 text-sm font-bold text-soft">{item.lesson}</p> : null}
                <p className="mt-1">{item.title}</p>
              </button>
              {open ? (
                <div className="mt-3 space-y-3">
                  {item.scores.length > 0 ? (
                    <ul className="space-y-2">
                      {item.scores.map((score) => (
                        <li key={score.label} className="flex items-center justify-between gap-3">
                          <span className="text-sm">{score.label}</span>
                          <MoodMark level={score.value} small label={score.label} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.body ? <p className="text-sm">{item.body}</p> : null}
                  <form action={archiveFeedback}>
                    <input type="hidden" name="kind" value={item.kind} />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="back" value={back} />
                    {showArchive ? <input type="hidden" name="archived" value="0" /> : null}
                    <ConfirmSubmit
                      label={showArchive ? labels.restore : labels.archiveAction}
                      title={showArchive ? labels.restoreAsk : labels.archiveAsk}
                      message={showArchive ? labels.restoreLead : labels.archiveLead}
                      cancel={labels.cancel}
                    />
                  </form>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
