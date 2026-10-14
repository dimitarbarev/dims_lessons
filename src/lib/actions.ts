"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { cookieOptions, getSession, homeFor, SESSION_COOKIE } from "./auth";
import {
  BILLING_MODES,
  isOneOf,
  KINDS,
  LOCATIONS,
  PLATFORMS,
  SUBJECTS,
} from "./constants";
import {
  answerFeedbackRequest,
  authenticate,
  clearStudentPin,
  createSession,
  deleteLesson,
  deletePayment,
  deleteSession,
  emailTaken,
  getClient,
  getFeedbackRequest,
  getLesson,
  getPayment,
  getRegistration,
  getParentByCode,
  getTeacherByEmail,
  insertClient,
  insertFeedbackNote,
  insertFeedbackRequest,
  insertLesson,
  insertPayment,
  insertRegistration,
  linkParent,
  markPaysForSelf,
  parentLinkedTo,
  setFeedbackArchived,
  setRegistrationStatus,
  setStudentPin,
  updateClient,
  updateParentLocale,
  updateTeacher,
  updateTeacherLocale,
  upsertParent,
} from "./db";
import { isEmail, parseCount, parseHours, parseMoney, todayISO } from "./format";

function refresh() {
  revalidatePath("/en", "layout");
  revalidatePath("/bg", "layout");
}

async function go(href: string, query?: Record<string, string>): Promise<never> {
  const current = await getLocale();
  if (query) redirect({ href: { pathname: href, query }, locale: current });
  else redirect({ href, locale: current });
  throw new Error("Redirect failed");
}

function field(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function must<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Missing value");
  return value;
}

async function requireTeacher() {
  const session = await getSession();
  if (!session || session.role !== "teacher") await go("/login");
  return must(session);
}

async function requireParent() {
  const session = await getSession();
  if (!session || session.role !== "parent") await go("/login");
  return must(session);
}

function choices(form: FormData) {
  const subject = field(form, "subject");
  const platform = field(form, "platform");
  const location = field(form, "location");
  const kind = field(form, "kind") || "child";
  const billing = field(form, "billing") || "per_lesson";
  if (
    !isOneOf(SUBJECTS, subject) ||
    !isOneOf(PLATFORMS, platform) ||
    !isOneOf(LOCATIONS, location) ||
    !isOneOf(KINDS, kind) ||
    !isOneOf(BILLING_MODES, billing)
  ) {
    return null;
  }
  return { subject, platform, location, kind, billing };
}

export async function signInWithPassword(form: FormData) {
  const email = field(form, "email").toLowerCase();
  const password = field(form, "password");
  const current = await getLocale();
  const account = authenticate(email, password);
  if (!account) {
    redirect({ href: { pathname: "/login", query: { error: "invalid" } }, locale: current });
    throw new Error("Redirect failed");
  }
  const session = createSession(account.role, account.userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, cookieOptions);
  redirect({ href: homeFor(account.role), locale: current });
}

export async function signOutAction() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) deleteSession(id);
  jar.delete(SESSION_COOKIE);
  const current = await getLocale();
  redirect({ href: "/", locale: current });
}

export async function rememberLocale(next: string) {
  if (next !== "en" && next !== "bg") return;
  const session = await getSession();
  if (!session) return;
  if (session.role === "teacher") updateTeacherLocale(session.user_id, next);
  if (session.role === "parent") updateParentLocale(session.user_id, next);
}

export async function submitRegistration(form: FormData) {
  const parentName = field(form, "parentName");
  const email = field(form, "email").toLowerCase();
  const childName = field(form, "childName");
  const subject = field(form, "subject") || "math";
  if (!parentName || !childName || !isEmail(email) || !isOneOf(SUBJECTS, subject)) {
    await go("/register", { error: "required" });
  }
  if (emailTaken(email)) await go("/register", { error: "emailTaken" });

  insertRegistration({
    parent_name: parentName,
    parent_email: email,
    parent_phone: field(form, "phone"),
    parent_social: field(form, "social"),
    parent_occupation: field(form, "occupation"),
    child_name: childName,
    school: field(form, "school"),
    grade: field(form, "grade"),
    interests: field(form, "interests"),
    ambitions: field(form, "ambitions"),
    subject,
    portrait: field(form, "portrait") === "boy" ? "boy" : "girl",
  });
  refresh();
  await go("/register", { sent: "1" });
}

export async function createClientAction(form: FormData) {
  const session = await requireTeacher();
  const name = field(form, "name");
  const picked = choices(form);
  const price = parseMoney(field(form, "price"));
  const pack = parseCount(field(form, "packSize"));
  const amount = parseMoney(field(form, "amountNow"));
  if (!name || !picked || price === null || pack === null || amount === null) {
    await go("/clients/new", { error: "required" });
  }
  const choice = must(picked);
  const priceCents = must(price);
  const packCount = must(pack);
  const amountCents = must(amount);

  const parentEmail = field(form, "parentEmail").toLowerCase();
  const parentName = field(form, "parentName");
  if (parentEmail && (!isEmail(parentEmail) || !parentName)) {
    await go("/clients/new", { error: "required" });
  }
  if (parentEmail && getTeacherByEmail(parentEmail)) {
    await go("/clients/new", { error: "emailTaken" });
  }

  const id = insertClient({
    teacherId: session.user_id,
    name,
    kind: choice.kind,
    subject: choice.subject,
    platform: choice.platform,
    location: choice.location,
    priceCents,
    billingMode: choice.billing,
    school: field(form, "school"),
    grade: field(form, "grade"),
    interests: field(form, "interests"),
    ambitions: field(form, "ambitions"),
  });

  if (amountCents > 0 || packCount > 0) {
    insertPayment({
      clientId: id,
      paidOn: todayISO(),
      amountCents,
      lessonsAdded: choice.billing === "prepaid" ? packCount : 0,
    });
  }

  if (parentEmail) {
    const parent = upsertParent({
      name: parentName,
      email: parentEmail,
      phone: field(form, "parentPhone"),
      social: field(form, "parentSocial"),
      occupation: field(form, "parentOccupation"),
    });
    linkParent(id, parent.id);
  }

  refresh();
  await go(`/clients/${id}`);
}

async function ownedClient(clientId: string) {
  const session = await requireTeacher();
  const client = getClient(clientId);
  if (!client || client.teacher_id !== session.user_id) await go("/today");
  return must(client);
}

export async function logQuickLesson(clientId: string, hours: number) {
  const client = await ownedClient(clientId);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 12) return;
  insertLesson({
    clientId: client.id,
    occurredOn: todayISO(),
    subject: client.subject_default,
    platform: client.platform_default,
    location: client.location_default,
    materials: "",
    homework: "",
    durationHours: Math.round(hours * 10) / 10,
  });
  refresh();
}

export async function logDetailedLesson(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  const picked = choices(form);
  const date = field(form, "date") || todayISO();
  const hours = parseHours(field(form, "duration") || "1");
  if (!picked || !/^\d{4}-\d{2}-\d{2}$/.test(date) || hours === null) {
    await go(`/clients/${client.id}`, { error: "required" });
  }
  const choice = must(picked);
  insertLesson({
    clientId: client.id,
    occurredOn: date,
    subject: choice.subject,
    platform: choice.platform,
    location: choice.location,
    materials: field(form, "materials"),
    homework: field(form, "homework"),
    durationHours: must(hours),
  });
  refresh();
  await go(`/clients/${client.id}`);
}

export async function removeLesson(form: FormData) {
  const found = getLesson(field(form, "lessonId"));
  if (!found) await go("/today");
  const lesson = must(found);
  await ownedClient(lesson.client_id);
  deleteLesson(lesson.id);
  refresh();
  await go(`/clients/${lesson.client_id}`);
}

export async function addPayment(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  const amount = parseMoney(field(form, "amount"));
  const added = parseCount(field(form, "lessonsAdded"));
  const date = field(form, "date") || todayISO();
  if (amount === null || added === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    await go(`/clients/${client.id}`, { error: "invalidAmount" });
  }
  const cents = must(amount);
  const lessonsAdded = must(added);
  if (cents === 0 && lessonsAdded === 0) await go(`/clients/${client.id}`, { error: "invalidAmount" });
  insertPayment({
    clientId: client.id,
    paidOn: date,
    amountCents: cents,
    lessonsAdded: client.billing_mode === "prepaid" ? lessonsAdded : 0,
  });
  refresh();
  await go(`/clients/${client.id}`);
}

export async function removePayment(form: FormData) {
  const found = getPayment(field(form, "paymentId"));
  if (!found) await go("/today");
  const payment = must(found);
  await ownedClient(payment.client_id);
  deletePayment(payment.id);
  refresh();
  await go(`/clients/${payment.client_id}`);
}

export async function saveProfile(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  const name = field(form, "name");
  const picked = choices(form);
  const price = parseMoney(field(form, "price"));
  if (!name || !picked || price === null) await go(`/clients/${client.id}`, { error: "required" });
  const choice = must(picked);
  updateClient(client.id, {
    name,
    kind: choice.kind,
    subject: choice.subject,
    platform: choice.platform,
    location: choice.location,
    priceCents: must(price),
    billingMode: choice.billing,
    school: field(form, "school"),
    grade: field(form, "grade"),
    interests: field(form, "interests"),
    ambitions: field(form, "ambitions"),
  });
  refresh();
  await go(`/clients/${client.id}`, { saved: "1" });
}

export async function savePin(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  if (form.get("clearPin") === "on") {
    clearStudentPin(client.id);
  } else {
    const pin = field(form, "pin");
    if (pin) {
      if (!/^\d{4,6}$/.test(pin)) await go(`/clients/${client.id}`, { error: "invalidPin" });
      setStudentPin(client.id, pin);
    }
  }
  refresh();
  await go(`/clients/${client.id}`, { saved: "1" });
}

export async function linkParentAction(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  const email = field(form, "parentEmail").toLowerCase();
  const name = field(form, "parentName");
  if (!name || !isEmail(email)) await go(`/clients/${client.id}`, { error: "required" });
  if (getTeacherByEmail(email)) await go(`/clients/${client.id}`, { error: "emailTaken" });
  const parent = upsertParent({
    name,
    email,
    phone: field(form, "parentPhone"),
    social: field(form, "parentSocial"),
    occupation: field(form, "parentOccupation"),
  });
  linkParent(client.id, parent.id);
  refresh();
  await go(`/clients/${client.id}`);
}

export async function linkParentByCode(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  const code = field(form, "code").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) await go(`/clients/${client.id}`, { error: "unknownCode" });
  if (code === client.public_code) {
    markPaysForSelf(client.id);
    refresh();
    await go(`/clients/${client.id}`, { saved: "1" });
  }
  const parent = getParentByCode(code);
  if (!parent) await go(`/clients/${client.id}`, { error: "unknownCode" });
  linkParent(client.id, must(parent).id);
  refresh();
  await go(`/clients/${client.id}`, { saved: "1" });
}

export async function markSelfPayer(form: FormData) {
  const client = await ownedClient(field(form, "clientId"));
  markPaysForSelf(client.id);
  refresh();
  await go(`/clients/${client.id}`, { saved: "1" });
}

export async function acceptRegistration(form: FormData) {
  const session = await requireTeacher();
  const found = getRegistration(field(form, "id"));
  if (!found || found.status !== "pending") await go("/registrations");
  const registration = must(found);
  if (getTeacherByEmail(registration.parent_email)) await go("/registrations", { error: "emailTaken" });

  const clientId = insertClient({
    teacherId: session.user_id,
    name: registration.child_name,
    kind: "child",
    subject: isOneOf(SUBJECTS, registration.subject) ? registration.subject : "math",
    platform: "paper",
    location: "in_person",
    priceCents: 0,
    billingMode: "per_lesson",
    school: registration.school,
    grade: registration.grade,
    interests: registration.interests,
    ambitions: registration.ambitions,
  });
  const parent = upsertParent({
    name: registration.parent_name,
    email: registration.parent_email,
    phone: registration.parent_phone,
    social: registration.parent_social,
    occupation: registration.parent_occupation,
  });
  linkParent(clientId, parent.id);
  setRegistrationStatus(registration.id, "accepted");
  refresh();
  await go(`/clients/${clientId}`);
}

export async function declineRegistration(form: FormData) {
  await requireTeacher();
  const registration = getRegistration(field(form, "id"));
  if (registration && registration.status === "pending") setRegistrationStatus(registration.id, "declined");
  refresh();
  await go("/registrations");
}

export async function archiveFeedback(form: FormData) {
  await requireTeacher();
  const kind = field(form, "kind") === "note" ? "note" : "request";
  const id = field(form, "id");
  if (!id) await go("/feedback");
  setFeedbackArchived(kind, id, field(form, "archived") !== "0");
  refresh();
  await go("/feedback");
}

export async function saveSettings(form: FormData) {
  const session = await requireTeacher();
  const name = field(form, "name");
  const email = field(form, "email").toLowerCase();
  const phone = field(form, "phone");
  const currency = field(form, "currency") === "BGN" ? "BGN" : "EUR";
  if (!name || !isEmail(email)) await go("/settings", { error: "required" });
  if (emailTaken(email, { role: "teacher", id: session.user_id })) {
    await go("/settings", { error: "emailTaken" });
  }
  updateTeacher(session.user_id, { name, email, phone, currency });
  refresh();
  await go("/settings", { saved: "1" });
}

export async function sendFeedbackRequest(form: FormData) {
  const session = await requireTeacher();
  const client = await ownedClient(field(form, "clientId"));
  const parentId = field(form, "parentId");
  if (!parentLinkedTo(parentId, client.id)) await go(`/clients/${client.id}`, { error: "required" });
  insertFeedbackRequest({
    parentId,
    clientId: client.id,
    teacherId: session.user_id,
    openQuestion: field(form, "question") || "What should I change?",
  });
  refresh();
  await go(`/clients/${client.id}`, { saved: "1" });
}

export async function addFeedbackNote(form: FormData) {
  const session = await requireParent();
  const body = field(form, "body");
  const clientId = field(form, "clientId");
  if (!body) await go("/family/feedback", { error: "required" });
  if (clientId && !parentLinkedTo(session.user_id, clientId)) await go("/family/feedback");
  insertFeedbackNote(session.user_id, clientId || null, body);
  refresh();
  await go("/family/feedback", { saved: "1" });
}

export async function answerRequest(form: FormData) {
  const session = await requireParent();
  const found = getFeedbackRequest(field(form, "requestId"));
  if (!found || found.parent_id !== session.user_id || found.status !== "open") {
    await go("/family/feedback");
  }
  const request = must(found);
  const pace = Number(field(form, "pace"));
  const following = Number(field(form, "following"));
  const homework = Number(field(form, "homework"));
  const overall = Number(field(form, "overall"));
  const scores = [pace, following, homework, overall];
  if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
    await go("/family/feedback", { error: "required" });
  }
  answerFeedbackRequest(request.id, {
    pace,
    following,
    homework,
    overall,
    openAnswer: field(form, "openAnswer"),
  });
  refresh();
  await go("/family/feedback", { saved: "1" });
}
