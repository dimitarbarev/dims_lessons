"use client";

import { useState } from "react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Area, butterButton, Field, primaryButton, SelectField } from "@/components/fields";
import { removeLesson, updateLessonAction } from "@/lib/actions";

type Choice = { value: string; label: string };

export type LessonRow = {
  id: string;
  occurredOn: string;
  duration: string;
  subject: string;
  platform: string;
  location: string;
  materials: string;
  homework: string;
  title: string;
  meta: string;
};

export function LessonRecords({
  lessons,
  subjects,
  platforms,
  places,
  emptyLabel,
  labels,
}: {
  lessons: LessonRow[];
  subjects: Choice[];
  platforms: Choice[];
  places: Choice[];
  emptyLabel: string;
  labels: {
    edit: string;
    save: string;
    cancel: string;
    remove: string;
    removeAsk: string;
    removeConfirm: string;
    date: string;
    duration: string;
    subject: string;
    platform: string;
    place: string;
    materials: string;
    homework: string;
    materialsPlaceholder: string;
    homeworkPlaceholder: string;
  };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  if (lessons.length === 0) return <p className="text-soft">{emptyLabel}</p>;

  return (
    <ul className="space-y-3">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="rounded-3xl bg-paper px-4 py-3">
          {editing === lesson.id ? (
            <form key={lesson.id} action={updateLessonAction} className="grid gap-4">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <Field label={labels.date} name="date" type="date" defaultValue={lesson.occurredOn} required />
              <Field label={labels.duration} name="duration" defaultValue={lesson.duration} inputMode="decimal" />
              <SelectField label={labels.subject} name="subject" defaultValue={lesson.subject} options={subjects} />
              <SelectField label={labels.platform} name="platform" defaultValue={lesson.platform} options={platforms} />
              <SelectField label={labels.place} name="location" defaultValue={lesson.location} options={places} />
              <Area
                label={labels.materials}
                name="materials"
                defaultValue={lesson.materials}
                placeholder={labels.materialsPlaceholder}
              />
              <Area
                label={labels.homework}
                name="homework"
                defaultValue={lesson.homework}
                placeholder={labels.homeworkPlaceholder}
              />
              <div className="flex flex-wrap items-center gap-4">
                <button className={primaryButton} type="submit">
                  {labels.save}
                </button>
                <button type="button" className="text-sm text-soft" onClick={() => setEditing(null)}>
                  {labels.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{lesson.title}</p>
                <p className="text-sm text-soft">{lesson.meta}</p>
                <p className="mt-2 text-sm">
                  <span className="text-soft">{labels.materials}. </span>
                  {lesson.materials || labels.materialsPlaceholder}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-soft">{labels.homework}. </span>
                  {lesson.homework || labels.homeworkPlaceholder}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button type="button" className={butterButton} onClick={() => setEditing(lesson.id)}>
                  {labels.edit}
                </button>
                <form action={removeLesson}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <ConfirmSubmit
                    label={labels.remove}
                    title={labels.removeAsk}
                    message={labels.removeConfirm}
                    cancel={labels.cancel}
                  />
                </form>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
