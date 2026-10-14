import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ClientBoard, type PanelId, type StatusTone, type WidgetModel } from "@/components/client-board";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ErrorBanner } from "@/components/error-banner";
import { Area, butterButton, Field, primaryButton, SelectField } from "@/components/fields";
import { Link } from "@/i18n/navigation";
import {
  addPayment,
  linkParentAction,
  linkParentByCode,
  logDetailedLesson,
  markSelfPayer,
  removeLesson,
  removePayment,
  savePin,
  saveProfile,
  sendFeedbackRequest,
} from "@/lib/actions";
import { getSession } from "@/lib/auth";
import {
  getClient,
  getTeacherById,
  listFeedbackRequests,
  listLessons,
  listNotesForClient,
  listParentsOfClient,
  listPayments,
} from "@/lib/db";
import { formatCode, formatDay, formatMoney, todayISO } from "@/lib/format";
import { choiceOptions, labelOf } from "@/lib/labels";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSession();
  const client = getClient(id);
  if (!client || client.teacher_id !== session?.user_id) notFound();

  const teacher = getTeacherById(session.user_id)!;
  const locale = await getLocale();
  const t = await getTranslations("client");
  const feedback = await getTranslations("feedback");
  const settings = await getTranslations("settings");
  const status = await getTranslations("status");
  const options = await choiceOptions();
  const lessons = listLessons(client.id);
  const payments = listPayments(client.id);
  const parents = listParentsOfClient(client.id);
  const notes = listNotesForClient(client.id);
  const requests = listFeedbackRequests().filter((request) => request.client_id === client.id);
  const money = (cents: number) => formatMoney(cents, teacher.currency, locale);
  const price = (client.price_cents / 100).toFixed(2);
  const meta = [
    labelOf(options.subjects, client.subject_default),
    labelOf(options.platforms, client.platform_default),
    labelOf(options.locations, client.location_default),
  ].join(" · ");
  const latestLesson = lessons[0];
  const latestPayment = payments[0];
  const latestNote = notes[0];
  const standing = standingWidget(client.stats, client.billing_mode, {
    pack: t("widgetPack"),
    balance: t("widgetBalance"),
    left: t("leftWord"),
    over: t("overWord"),
    none: status("noneLeft"),
    open: t("openShort"),
    credit: t("creditShort"),
    settled: status("settled"),
    money,
  });
  const profileBits = [labelOf(options.kinds, client.kind), client.school, client.grade].filter(Boolean).join(" · ");

  const widgets: WidgetModel[] = [
    {
      id: "lesson",
      panel: "lesson",
      label: t("widgetLesson"),
      figure: formatDay(todayISO(), locale),
      caption: meta,
      detail: t("widgetWrite"),
      tone: "feature",
      size: "hero",
      display: "stat",
    },
    {
      id: "standing",
      panel: "payments",
      label: standing.label,
      figure: standing.figure,
      caption: standing.caption,
      detail:
        (client.billing_mode === "per_lesson" || client.billing_mode === "per_hour") && client.price_cents === 0
          ? t("setPrice")
          : undefined,
      tone: "plain",
      size: "wide",
      display: "stat",
      status: standing.status,
    },
    {
      id: "lessons",
      panel: "lessons",
      label: t("widgetLessons"),
      figure: String(lessons.length),
      caption: latestLesson ? latestLesson.materials || latestLesson.homework || formatDay(latestLesson.occurred_on, locale) : t("noLessons"),
      tone: "plain",
      size: "tile",
      display: "stat",
    },
    {
      id: "payments",
      panel: "payments",
      label: t("widgetPayments"),
      figure: money(client.stats.paidCents),
      caption: latestPayment ? formatDay(latestPayment.paid_on, locale) : t("noPayments"),
      tone: "blush",
      size: "tile",
      display: "stat",
    },
    {
      id: "profile",
      panel: "profile",
      label: t("widgetProfile"),
      figure: money(client.price_cents),
      caption: labelOf(options.billing, client.billing_mode),
      detail: profileBits || undefined,
      tone: "plain",
      size: "wide",
      display: "stat",
    },
    {
      id: "parents",
      panel: "parents",
      label: t("widgetParents"),
      figure: parents.length === 1 ? parents[0].name : String(parents.length),
      caption:
        parents.length === 0
          ? t("noParents")
          : parents.length === 1 && parents[0].public_code === client.public_code
            ? t("paysSelf")
            : parents.length === 1
              ? parents[0].email.endsWith("@lessons.local")
                ? formatCode(parents[0].public_code)
                : parents[0].email
              : parents.map((parent) => parent.name).join(", "),
      tone: "plain",
      size: "tile",
      display: parents.length === 1 ? "story" : "stat",
    },
    {
      id: "pin",
      panel: "pin",
      label: t("widgetPin"),
      figure: client.student_pin_hash ? "●●●●" : "—",
      caption: client.student_pin_hash ? t("pinSet") : t("pinOff"),
      tone: "plain",
      size: "tile",
      display: "stat",
    },
    {
      id: "notes",
      panel: "notes",
      label: t("widgetNotes"),
      figure: latestNote ? excerpt(latestNote.body) : t("noNotes"),
      caption: latestNote ? `${latestNote.parent_name} · ${formatDay(latestNote.created_at, locale)}` : "",
      tone: "plain",
      size: "wide",
      display: "story",
    },
    {
      id: "feedback",
      panel: "feedback",
      label: t("widgetFeedback"),
      figure: String(requests.length),
      caption: requests[0]?.open_question || (parents.length === 0 ? t("needParent") : t("noNotes")),
      tone: "plain",
      size: "wide",
      display: "stat",
    },
  ];

  const titles: Record<PanelId, string> = {
    lesson: t("details"),
    payments: t("receive"),
    lessons: t("history"),
    profile: t("profile"),
    pin: t("pin"),
    parents: t("parents"),
    feedback: t("ask"),
    notes: t("notes"),
  };

  const notice = (
    <div className="mb-4 space-y-3">
      <ErrorBanner code={query.error} />
      {query.saved === "1" ? <p className="text-sm font-bold text-sage">{settings("saved")}</p> : null}
    </div>
  );

  return (
    <div>
      <Link href="/today" className="text-sm text-soft">
        {t("back")}
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="font-display text-4xl sm:text-5xl">{client.name}</h1>
        <p className="mt-1 text-soft">{meta}</p>
        {client.public_code ? <p className="mt-3 text-sm tracking-[0.28em] text-soft">{formatCode(client.public_code)}</p> : null}
      </header>
      <ClientBoard
        widgets={widgets}
        titles={titles}
        closeLabel={t("close")}
        initialPanel={panelForError(query.error)}
        notice={notice}
        panels={{
          lesson: (
            <form action={logDetailedLesson} className="grid gap-4">
              <input type="hidden" name="clientId" value={client.id} />
              <input type="hidden" name="kind" value={client.kind} />
              <input type="hidden" name="billing" value={client.billing_mode} />
              <Field label={t("date")} name="date" type="date" defaultValue={todayISO()} required />
              <Field label={t("duration")} name="duration" defaultValue="1" inputMode="decimal" />
              <SelectField label={t("subject")} name="subject" defaultValue={client.subject_default} options={options.subjects} />
              <SelectField label={t("platform")} name="platform" defaultValue={client.platform_default} options={options.platforms} />
              <SelectField label={t("place")} name="location" defaultValue={client.location_default} options={options.locations} />
              <Area label={t("materials")} name="materials" />
              <Area label={t("homework")} name="homework" />
              <div className="justify-self-start">
                <button className={primaryButton} type="submit">
                  {t("log")}
                </button>
              </div>
            </form>
          ),
          payments: (
            <div className="space-y-6">
              {(client.billing_mode === "per_lesson" || client.billing_mode === "per_hour") && client.price_cents === 0 ? (
                <p className="text-sm font-semibold text-apricot-deep">{t("setPrice")}</p>
              ) : null}
              <form action={addPayment} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="clientId" value={client.id} />
                <Field label={t("date")} name="date" type="date" defaultValue={todayISO()} required />
                <Field label={t("amount")} name="amount" defaultValue="0" inputMode="decimal" />
                {client.billing_mode === "prepaid" ? (
                  <Field label={t("lessonsAdded")} name="lessonsAdded" defaultValue="0" inputMode="numeric" />
                ) : (
                  <input type="hidden" name="lessonsAdded" value="0" />
                )}
                <div className="justify-self-start sm:col-span-2">
                  <button className={butterButton} type="submit">
                    {t("savePayment")}
                  </button>
                </div>
              </form>
              <div>
                <h3 className="mb-3 font-display text-2xl">{t("payments")}</h3>
                {payments.length === 0 ? <p className="text-soft">{t("noPayments")}</p> : null}
                <RecordList>
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 rounded-3xl bg-paper px-4 py-3">
                      <div>
                        <p className="font-bold">{formatDay(payment.paid_on, locale)}</p>
                        <p className="text-sm text-soft">
                          {money(payment.amount_cents)}
                          {payment.lessons_added ? ` · +${payment.lessons_added}` : ""}
                        </p>
                      </div>
                      <form action={removePayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <ConfirmSubmit label={t("remove")} message={t("removeConfirm")} />
                      </form>
                    </li>
                  ))}
                </RecordList>
              </div>
            </div>
          ),
          lessons: (
            <div>
              {lessons.length === 0 ? <p className="text-soft">{t("noLessons")}</p> : null}
              <RecordList>
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="rounded-3xl bg-paper px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {formatDay(lesson.occurred_on, locale)} · {t("hours", { count: lesson.duration_hours || 1 })}
                        </p>
                        <p className="text-sm text-soft">
                          {labelOf(options.subjects, lesson.subject)} · {labelOf(options.platforms, lesson.platform)} ·{" "}
                          {labelOf(options.locations, lesson.location)}
                        </p>
                        {lesson.materials ? <p className="mt-1 text-sm">{lesson.materials}</p> : null}
                        {lesson.homework ? <p className="mt-1 text-sm font-semibold">{lesson.homework}</p> : null}
                      </div>
                      <form action={removeLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <ConfirmSubmit label={t("remove")} message={t("removeConfirm")} />
                      </form>
                    </div>
                  </li>
                ))}
              </RecordList>
            </div>
          ),
          profile: (
            <form action={saveProfile} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="clientId" value={client.id} />
              <Field label={t("name")} name="name" defaultValue={client.name} required />
              <SelectField label={t("kind")} name="kind" defaultValue={client.kind} options={options.kinds} />
              <SelectField label={t("subject")} name="subject" defaultValue={client.subject_default} options={options.subjects} />
              <SelectField label={t("platform")} name="platform" defaultValue={client.platform_default} options={options.platforms} />
              <SelectField label={t("place")} name="location" defaultValue={client.location_default} options={options.locations} />
              <Field
                label={client.billing_mode === "per_hour" ? t("priceHour") : t("price")}
                name="price"
                defaultValue={price}
                inputMode="decimal"
              />
              <SelectField label={t("billing")} name="billing" defaultValue={client.billing_mode} options={options.billing} />
              <Field label={t("school")} name="school" defaultValue={client.school} />
              <Field label={t("grade")} name="grade" defaultValue={client.grade} />
              <div className="sm:col-span-2">
                <Area label={t("interests")} name="interests" defaultValue={client.interests} />
              </div>
              <div className="sm:col-span-2">
                <Area label={t("ambitions")} name="ambitions" defaultValue={client.ambitions} />
              </div>
              <div className="justify-self-start sm:col-span-2">
                <button className={primaryButton} type="submit">
                  {t("saveProfile")}
                </button>
              </div>
            </form>
          ),
          pin: (
            <form action={savePin} className="grid gap-4">
              <p className="text-sm text-soft">{t("pinHint")}</p>
              <input type="hidden" name="clientId" value={client.id} />
              <Field label={t("pin")} name="pin" inputMode="numeric" />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="clearPin" />
                {t("clearPin")}
              </label>
              <div className="justify-self-start">
                <button className={butterButton} type="submit">
                  {t("savePin")}
                </button>
              </div>
            </form>
          ),
          parents: (
            <div className="space-y-6">
              {parents.some((parent) => parent.public_code && parent.public_code === client.public_code) ? (
                <p className="rounded-3xl bg-peach px-4 py-3">
                  <span className="font-bold">{t("paysSelf")}</span>
                  <span className="mt-1 block text-sm tracking-[0.2em] text-soft">{formatCode(client.public_code)}</span>
                </p>
              ) : (
                <form action={markSelfPayer}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <button className={butterButton} type="submit">
                    {t("markSelf")}
                  </button>
                </form>
              )}
              {parents.filter((parent) => parent.public_code !== client.public_code).length === 0 &&
              !parents.some((parent) => parent.public_code === client.public_code) ? (
                <p className="text-soft">{t("noParents")}</p>
              ) : null}
              <RecordList>
                {parents
                  .filter((parent) => parent.public_code !== client.public_code)
                  .map((parent) => (
                    <li key={parent.id} className="rounded-3xl bg-paper px-4 py-3">
                      <p className="font-bold">{parent.name}</p>
                      <p className="text-sm tracking-[0.16em] text-soft">{formatCode(parent.public_code)}</p>
                      {parent.email.endsWith("@lessons.local") ? null : <p className="text-sm text-soft">{parent.email}</p>}
                      {parent.phone ? <p className="text-sm">{parent.phone}</p> : null}
                      {parent.occupation ? <p className="text-sm">{parent.occupation}</p> : null}
                      {parent.social ? <p className="text-sm">{parent.social}</p> : null}
                    </li>
                  ))}
              </RecordList>
              <form action={linkParentByCode} className="grid gap-4">
                <input type="hidden" name="clientId" value={client.id} />
                <Field label={t("linkCode")} name="code" hint={t("linkCodeHint")} inputMode="numeric" />
                <div className="justify-self-start">
                  <button className={butterButton} type="submit">
                    {t("link")}
                  </button>
                </div>
              </form>
              <div>
                <h3 className="mb-3 font-display text-2xl">{t("addParent")}</h3>
                <form action={linkParentAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="clientId" value={client.id} />
                  <Field label={t("parentName")} name="parentName" />
                  <Field label={t("parentEmail")} name="parentEmail" type="email" />
                  <Field label={t("parentPhone")} name="parentPhone" type="tel" />
                  <Field label={t("parentSocial")} name="parentSocial" />
                  <Field label={t("parentOccupation")} name="parentOccupation" />
                  <div className="justify-self-start sm:col-span-2">
                    <button className={butterButton} type="submit">
                      {t("link")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ),
          feedback: (
            <div>
              {parents.length === 0 ? (
                <p className="text-soft">{t("needParent")}</p>
              ) : (
                <form action={sendFeedbackRequest} className="grid gap-4">
                  <input type="hidden" name="clientId" value={client.id} />
                  <SelectField
                    label={feedback("parentLabel")}
                    name="parentId"
                    defaultValue={parents[0]?.id}
                    options={parents.map((parent) => ({ value: parent.id, label: parent.name }))}
                  />
                  <Area label={t("question")} name="question" defaultValue={feedback("defaultQuestion")} />
                  <div className="justify-self-start">
                    <button className={primaryButton} type="submit">
                      {t("sendRequest")}
                    </button>
                  </div>
                </form>
              )}
              {requests.length > 0 ? (
                <RecordList className="mt-4">
                  {requests.map((request) => (
                    <li key={request.id} className="rounded-3xl bg-paper px-4 py-3 text-sm">
                      <p className="font-bold">
                        {request.parent_name} · {request.status === "answered" ? feedback("answered") : feedback("waiting")}
                      </p>
                      <p className="mt-1">{request.open_question}</p>
                      {request.open_answer ? <p className="mt-1">{request.open_answer}</p> : null}
                    </li>
                  ))}
                </RecordList>
              ) : null}
            </div>
          ),
          notes: (
            <div>
              {notes.length === 0 ? <p className="text-soft">{t("noNotes")}</p> : null}
              <RecordList>
                {notes.map((note) => (
                  <li key={note.id} className="rounded-3xl bg-paper px-4 py-3">
                    <p className="text-sm font-bold text-soft">
                      {note.parent_name} · {formatDay(note.created_at, locale)}
                    </p>
                    <p className="mt-1">{note.body}</p>
                  </li>
                ))}
              </RecordList>
            </div>
          ),
        }}
      />
    </div>
  );
}

function RecordList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`space-y-3 ${className}`}>{children}</ul>;
}

function excerpt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 110) return clean;
  return `${clean.slice(0, 110).trim()}…`;
}

function panelForError(error?: string): PanelId | null {
  if (error === "invalidAmount") return "payments";
  if (error === "invalidPin") return "pin";
  if (error === "unknownCode") return "parents";
  return null;
}

function standingWidget(
  stats: { remaining: number | null; owedCents: number },
  billingMode: string,
  copy: {
    pack: string;
    balance: string;
    left: string;
    over: string;
    none: string;
    open: string;
    credit: string;
    settled: string;
    money: (cents: number) => string;
  },
): { label: string; figure: string; caption: string; status: StatusTone } {
  if (stats.remaining !== null) {
    if (stats.remaining < 0) {
      return { label: copy.pack, figure: String(Math.abs(stats.remaining)), caption: copy.over, status: "empty" };
    }
    if (stats.remaining === 0) {
      return { label: copy.pack, figure: "0", caption: copy.none, status: "empty" };
    }
    return {
      label: copy.pack,
      figure: String(stats.remaining),
      caption: copy.left,
      status: stats.remaining <= 2 ? "low" : "ok",
    };
  }
  if (stats.owedCents > 0) {
    return { label: copy.balance, figure: copy.money(stats.owedCents), caption: copy.open, status: "due" };
  }
  if (stats.owedCents < 0) {
    return { label: copy.balance, figure: copy.money(-stats.owedCents), caption: copy.credit, status: "ok" };
  }
  return {
    label: billingMode === "prepaid" ? copy.pack : copy.balance,
    figure: copy.money(0),
    caption: copy.settled,
    status: "neutral",
  };
}
