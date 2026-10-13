import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ErrorBanner } from "@/components/error-banner";
import { Area, butterButton, Field, primaryButton, SelectField } from "@/components/fields";
import { StatusLine } from "@/components/pack-dot";
import { Link } from "@/i18n/navigation";
import {
  addPayment,
  linkParentAction,
  logDetailedLesson,
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
import { formatDay, formatMoney, todayISO } from "@/lib/format";
import { choiceOptions, labelOf } from "@/lib/labels";
import { describeStats } from "@/lib/stats";

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
  const described = describeStats(client.stats, (key, values) => status(key as "leftOne", values as never), money);
  const price = (client.price_cents / 100).toFixed(2);

  return (
    <div className="space-y-5">
      <Link href="/today" className="text-sm font-bold text-soft">
        {t("back")}
      </Link>
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">{client.name}</h1>
        <p className="text-soft">
          {labelOf(options.subjects, client.subject_default)} · {labelOf(options.platforms, client.platform_default)} ·{" "}
          {labelOf(options.locations, client.location_default)}
        </p>
        <StatusLine text={described.text} tone={described.tone} />
        {client.billing_mode === "per_lesson" && client.price_cents === 0 ? (
          <p className="mt-2 text-sm font-semibold text-apricot-deep">{t("setPrice")}</p>
        ) : null}
      </header>
      <ErrorBanner code={query.error} />
      {query.saved === "1" ? <p className="text-sm font-bold text-sage">{settings("saved")}</p> : null}

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-4 font-display text-2xl">{t("details")}</h2>
        <form action={logDetailedLesson} className="grid gap-4">
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="kind" value={client.kind} />
          <input type="hidden" name="billing" value={client.billing_mode} />
          <Field label={t("date")} name="date" type="date" defaultValue={todayISO()} required />
          <SelectField label={t("subject")} name="subject" defaultValue={client.subject_default} options={options.subjects} />
          <SelectField label={t("platform")} name="platform" defaultValue={client.platform_default} options={options.platforms} />
          <SelectField label={t("place")} name="location" defaultValue={client.location_default} options={options.locations} />
          <Area label={t("materials")} name="materials" />
          <Area label={t("homework")} name="homework" />
          <button className={primaryButton} type="submit">
            {t("log")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-4 font-display text-2xl">{t("receive")}</h2>
        <form action={addPayment} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label={t("date")} name="date" type="date" defaultValue={todayISO()} required />
          <Field label={t("amount")} name="amount" defaultValue="0" inputMode="decimal" />
          {client.billing_mode === "prepaid" ? (
            <Field label={t("lessonsAdded")} name="lessonsAdded" defaultValue="0" inputMode="numeric" />
          ) : (
            <input type="hidden" name="lessonsAdded" value="0" />
          )}
          <div className="sm:col-span-2">
            <button className={butterButton} type="submit">
              {t("savePayment")}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-3 font-display text-2xl">{t("history")}</h2>
        {lessons.length === 0 ? <p className="text-soft">{t("noLessons")}</p> : null}
        <ul className="space-y-3">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="rounded-3xl bg-paper px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{formatDay(lesson.occurred_on, locale)}</p>
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
        </ul>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-3 font-display text-2xl">{t("payments")}</h2>
        {payments.length === 0 ? <p className="text-soft">{t("noPayments")}</p> : null}
        <ul className="space-y-3">
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
        </ul>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-4 font-display text-2xl">{t("profile")}</h2>
        <form action={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label={t("name")} name="name" defaultValue={client.name} required />
          <SelectField label={t("kind")} name="kind" defaultValue={client.kind} options={options.kinds} />
          <SelectField label={t("subject")} name="subject" defaultValue={client.subject_default} options={options.subjects} />
          <SelectField label={t("platform")} name="platform" defaultValue={client.platform_default} options={options.platforms} />
          <SelectField label={t("place")} name="location" defaultValue={client.location_default} options={options.locations} />
          <Field label={t("price")} name="price" defaultValue={price} inputMode="decimal" />
          <SelectField label={t("billing")} name="billing" defaultValue={client.billing_mode} options={options.billing} />
          <Field label={t("school")} name="school" defaultValue={client.school} />
          <Field label={t("grade")} name="grade" defaultValue={client.grade} />
          <div className="sm:col-span-2">
            <Area label={t("interests")} name="interests" defaultValue={client.interests} />
          </div>
          <div className="sm:col-span-2">
            <Area label={t("ambitions")} name="ambitions" defaultValue={client.ambitions} />
          </div>
          <div className="sm:col-span-2">
            <button className={primaryButton} type="submit">
              {t("saveProfile")}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-2 font-display text-2xl">{t("pin")}</h2>
        <p className="mb-4 text-sm text-soft">{t("pinHint")}</p>
        {client.student_pin_hash ? <p className="mb-3 text-sm font-bold text-sage">{t("pinSet")}</p> : null}
        <form action={savePin} className="grid gap-4">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label={t("pin")} name="pin" inputMode="numeric" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="clearPin" />
            {t("clearPin")}
          </label>
          <button className={butterButton} type="submit">
            {t("savePin")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-3 font-display text-2xl">{t("parents")}</h2>
        {parents.length === 0 ? <p className="text-soft">{t("noParents")}</p> : null}
        <ul className="mb-4 space-y-2">
          {parents.map((parent) => (
            <li key={parent.id} className="rounded-3xl bg-paper px-4 py-3">
              <p className="font-bold">{parent.name}</p>
              <p className="text-sm text-soft">{parent.email}</p>
              {parent.phone ? <p className="text-sm">{parent.phone}</p> : null}
              {parent.occupation ? <p className="text-sm">{parent.occupation}</p> : null}
              {parent.social ? <p className="text-sm">{parent.social}</p> : null}
            </li>
          ))}
        </ul>
        <h3 className="mb-3 font-bold">{t("addParent")}</h3>
        <form action={linkParentAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label={t("parentName")} name="parentName" />
          <Field label={t("parentEmail")} name="parentEmail" type="email" />
          <Field label={t("parentPhone")} name="parentPhone" type="tel" />
          <Field label={t("parentSocial")} name="parentSocial" />
          <Field label={t("parentOccupation")} name="parentOccupation" />
          <div className="sm:col-span-2">
            <button className={butterButton} type="submit">
              {t("link")}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-3 font-display text-2xl">{t("ask")}</h2>
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
            <button className={primaryButton} type="submit">
              {t("sendRequest")}
            </button>
          </form>
        )}
        {requests.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {requests.map((request) => (
              <li key={request.id} className="rounded-3xl bg-paper px-4 py-3 text-sm">
                <p className="font-bold">
                  {request.parent_name} · {request.status === "answered" ? feedback("answered") : feedback("waiting")}
                </p>
                <p className="mt-1">{request.open_question}</p>
                {request.open_answer ? <p className="mt-1">{request.open_answer}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl bg-ivory p-5 shadow-card">
        <h2 className="mb-3 font-display text-2xl">{t("notes")}</h2>
        {notes.length === 0 ? <p className="text-soft">{t("noNotes")}</p> : null}
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-3xl bg-paper px-4 py-3">
              <p className="text-sm font-bold text-soft">
                {note.parent_name} · {formatDay(note.created_at, locale)}
              </p>
              <p className="mt-1">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
