import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { getClient, listLessons, parentLinkedTo } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { choiceOptions, labelOf } from "@/lib/labels";

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !parentLinkedTo(session.user_id, id)) notFound();
  const client = getClient(id);
  if (!client) notFound();

  const locale = await getLocale();
  const t = await getTranslations("parent");
  const options = await choiceOptions();
  const lessons = listLessons(client.id);

  return (
    <div>
      <Link href="/family" className="text-sm font-bold text-soft">
        {t("title")}
      </Link>
      <h1 className="mt-3 font-display text-4xl">{client.name}</h1>
      <p className="mt-2 text-soft">{t("readOnly")}</p>
      {client.school || client.grade ? (
        <p className="mt-2 text-sm">
          {[client.school, client.grade].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {lessons.length === 0 ? <p className="mt-6 text-soft">{t("noLessons")}</p> : null}
      <ul className="mt-5 space-y-3">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="rounded-2xl bg-ivory p-4 shadow-card">
            <p className="font-bold">{formatDay(lesson.occurred_on, locale)}</p>
            <p className="text-sm text-soft">
              {labelOf(options.subjects, lesson.subject)} · {labelOf(options.platforms, lesson.platform)} ·{" "}
              {labelOf(options.locations, lesson.location)}
            </p>
            {lesson.materials ? (
              <p className="mt-2 text-sm">
                <span className="font-bold">{t("materials")}: </span>
                {lesson.materials}
              </p>
            ) : null}
            {lesson.homework ? (
              <p className="mt-1 text-sm">
                <span className="font-bold">{t("homework")}: </span>
                {lesson.homework}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
