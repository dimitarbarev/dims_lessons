import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { TEACHER_EMAIL } from "./constants";
import { demoAccount } from "./demo-accounts";
import { summarize, type Stats } from "./stats";

export type Role = "teacher" | "parent" | "student";

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  currency: string;
  locale: string;
  public_code: string;
};

export type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  social: string;
  occupation: string;
  locale: string;
  public_code: string;
};

export type Client = {
  id: string;
  teacher_id: string;
  name: string;
  kind: string;
  subject_default: string;
  platform_default: string;
  location_default: string;
  price_cents: number;
  billing_mode: string;
  school: string;
  grade: string;
  interests: string;
  ambitions: string;
  status: string;
  student_email: string | null;
  public_code: string;
  student_pin_hash: string | null;
  student_pin_salt: string | null;
  created_at: string;
};

export type ClientCard = Client & { stats: Stats };

export type Lesson = {
  id: string;
  client_id: string;
  occurred_on: string;
  subject: string;
  platform: string;
  location: string;
  materials: string;
  homework: string;
  duration_hours: number;
  created_at: string;
};

export type Payment = {
  id: string;
  client_id: string;
  paid_on: string;
  amount_cents: number;
  lessons_added: number;
  created_at: string;
};

export type Registration = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  parent_social: string;
  parent_occupation: string;
  child_name: string;
  school: string;
  grade: string;
  interests: string;
  ambitions: string;
  subject: string;
  portrait: string;
  status: string;
  created_at: string;
};

export type FeedbackNote = {
  id: string;
  parent_id: string;
  client_id: string | null;
  body: string;
  created_at: string;
  archived: number;
  parent_name: string;
  client_name: string | null;
};

export type FeedbackRequest = {
  id: string;
  parent_id: string;
  client_id: string | null;
  teacher_id: string;
  open_question: string;
  status: string;
  pace: number | null;
  following_score: number | null;
  homework_score: number | null;
  overall: number | null;
  open_answer: string;
  created_at: string;
  answered_at: string | null;
  archived: number;
  parent_name?: string;
  client_name?: string | null;
};

type SqlValue = string | number | null;

const globalForDb = globalThis as unknown as { lessonsDb?: DatabaseSync };
let studioReady = false;

function openDatabase() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "lessons.db"));
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'EUR',
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      social TEXT NOT NULL DEFAULT '',
      occupation TEXT NOT NULL DEFAULT '',
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'child',
      subject_default TEXT NOT NULL DEFAULT 'math',
      platform_default TEXT NOT NULL DEFAULT 'paper',
      location_default TEXT NOT NULL DEFAULT 'in_person',
      price_cents INTEGER NOT NULL DEFAULT 0,
      billing_mode TEXT NOT NULL DEFAULT 'per_lesson',
      school TEXT NOT NULL DEFAULT '',
      grade TEXT NOT NULL DEFAULT '',
      interests TEXT NOT NULL DEFAULT '',
      ambitions TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      student_pin_hash TEXT,
      student_pin_salt TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
    CREATE TABLE IF NOT EXISTS client_parents (
      client_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      PRIMARY KEY (client_id, parent_id),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      occurred_on TEXT NOT NULL,
      subject TEXT NOT NULL,
      platform TEXT NOT NULL,
      location TEXT NOT NULL,
      materials TEXT NOT NULL DEFAULT '',
      homework TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      paid_on TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      lessons_added INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      parent_name TEXT NOT NULL,
      parent_email TEXT NOT NULL,
      parent_phone TEXT NOT NULL DEFAULT '',
      parent_social TEXT NOT NULL DEFAULT '',
      parent_occupation TEXT NOT NULL DEFAULT '',
      child_name TEXT NOT NULL,
      school TEXT NOT NULL DEFAULT '',
      grade TEXT NOT NULL DEFAULT '',
      interests TEXT NOT NULL DEFAULT '',
      ambitions TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT 'math',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feedback_notes (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      client_id TEXT,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS feedback_requests (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      client_id TEXT,
      teacher_id TEXT NOT NULL,
      open_question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      pace INTEGER,
      following_score INTEGER,
      homework_score INTEGER,
      overall INTEGER,
      open_answer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      answered_at TEXT,
      FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS magic_links (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      user_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  const teachers = db.prepare("SELECT COUNT(*) AS n FROM teachers").get() as { n: number };
  if (!teachers.n) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO teachers (id, name, email, phone, currency, locale, created_at)
       VALUES (?, 'Dimitar', ?, '', 'EUR', 'en', ?)`,
    ).run(cryptoId(), TEACHER_EMAIL, now);
  }

  return db;
}

export function getDb() {
  if (!globalForDb.lessonsDb) globalForDb.lessonsDb = openDatabase();
  if (!studioReady) {
    studioReady = true;
    try {
      ensureStudio();
    } catch (error) {
      studioReady = false;
      throw error;
    }
  }
  return globalForDb.lessonsDb;
}

function one<T>(sql: string, ...params: SqlValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

function many<T>(sql: string, ...params: SqlValue[]): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

function run(sql: string, ...params: SqlValue[]) {
  getDb().prepare(sql).run(...params);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

function passwordMatches(password: string, hash: string | null, salt: string | null) {
  if (!password || !hash || !salt) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function setPasswordIfEmpty(table: "teachers" | "parents" | "clients", id: string, password: string) {
  const row = one<{ password_hash: string | null }>(`SELECT password_hash FROM ${table} WHERE id = ?`, id);
  if (row?.password_hash) return;
  const { hash, salt } = hashPassword(password);
  run(`UPDATE ${table} SET password_hash = ?, password_salt = ? WHERE id = ?`, hash, salt, id);
}

function daysAgo(count: number) {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  local.setUTCDate(local.getUTCDate() - count);
  return local.toISOString().slice(0, 10);
}

function clientByName(teacherId: string, name: string) {
  return one<Client>(
    "SELECT * FROM clients WHERE teacher_id = ? AND lower(name) = lower(?) ORDER BY created_at ASC",
    teacherId,
    name,
  );
}

function codeTaken(code: string) {
  return Boolean(
    one("SELECT 1 AS ok FROM teachers WHERE public_code = ?", code) ||
      one("SELECT 1 AS ok FROM parents WHERE public_code = ?", code) ||
      one("SELECT 1 AS ok FROM clients WHERE public_code = ?", code),
  );
}

function mintCode() {
  let code = "";
  do {
    code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  } while (code === "000000" || codeTaken(code));
  return code;
}

function fillPublicCodes() {
  for (const table of ["teachers", "parents", "clients"] as const) {
    const rows = many<{ id: string; public_code: string | null }>(`SELECT id, public_code FROM ${table}`);
    for (const row of rows) {
      if (row.public_code) continue;
      run(`UPDATE ${table} SET public_code = ? WHERE id = ?`, mintCode(), row.id);
    }
  }
}

export function getParentByCode(code: string) {
  return one<Parent>(
    "SELECT id, name, email, phone, social, occupation, locale, public_code FROM parents WHERE public_code = ?",
    code,
  );
}

export function markPaysForSelf(clientId: string) {
  const client = one<Client>("SELECT * FROM clients WHERE id = ?", clientId);
  if (!client?.public_code) return;
  let parent = getParentByCode(client.public_code);
  if (!parent) {
    const email = `self.${client.public_code}@lessons.local`;
    parent = upsertParent({
      name: client.name,
      email,
      phone: "",
      social: "",
      occupation: "",
      publicCode: client.public_code,
    });
  }
  linkParent(client.id, parent.id);
}

function ensureColumn(table: string, column: string, type: string) {
  const db = globalForDb.lessonsDb;
  if (!db) return;
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

function fillLessons(
  clientId: string,
  rows: { days: number; subject: string; materials: string; homework: string; location?: string }[],
) {
  if (listLessons(clientId).length > 0) return;
  for (const row of rows) {
    insertLesson({
      clientId,
      occurredOn: daysAgo(row.days),
      subject: row.subject,
      platform: "paper",
      location: row.location ?? "in_person",
      materials: row.materials,
      homework: row.homework,
    });
  }
}

function ensureStudio() {
  ensureColumn("teachers", "public_code", "TEXT");
  ensureColumn("parents", "public_code", "TEXT");
  ensureColumn("clients", "public_code", "TEXT");
  ensureColumn("lessons", "duration_hours", "REAL NOT NULL DEFAULT 1");
  ensureColumn("registrations", "portrait", "TEXT NOT NULL DEFAULT 'girl'");
  ensureColumn("feedback_notes", "archived", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("feedback_requests", "archived", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("teachers", "password_hash", "TEXT");
  ensureColumn("teachers", "password_salt", "TEXT");
  ensureColumn("parents", "password_hash", "TEXT");
  ensureColumn("parents", "password_salt", "TEXT");
  ensureColumn("clients", "student_email", "TEXT");
  ensureColumn("clients", "password_hash", "TEXT");
  ensureColumn("clients", "password_salt", "TEXT");
  globalForDb.lessonsDb?.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS clients_student_email ON clients(student_email) WHERE student_email IS NOT NULL AND student_email != '';
    CREATE UNIQUE INDEX IF NOT EXISTS teachers_public_code ON teachers(public_code) WHERE public_code IS NOT NULL AND public_code != '';
    CREATE UNIQUE INDEX IF NOT EXISTS parents_public_code ON parents(public_code) WHERE public_code IS NOT NULL AND public_code != '';
    CREATE UNIQUE INDEX IF NOT EXISTS clients_public_code ON clients(public_code) WHERE public_code IS NOT NULL AND public_code != '';
  `);
  fillPublicCodes();

  const teacherAccount = demoAccount("teacher");
  const teacher = getTeacherByEmail(teacherAccount.email) ?? getTeacher();
  if (!teacher) return;
  if (!teacher.phone.trim()) {
    run("UPDATE teachers SET phone = ? WHERE id = ?", "+359 88 123 4567", teacher.id);
  }
  setPasswordIfEmpty("teachers", teacher.id, teacherAccount.password);

  const parentAccount = demoAccount("parent");
  const parent = upsertParent({
    name: parentAccount.name,
    email: parentAccount.email,
    phone: "+359 88 555 0101",
    social: "",
    occupation: "Architect",
  });
  setPasswordIfEmpty("parents", parent.id, parentAccount.password);

  const studentAccount = demoAccount("student");
  let boris = one<Client>("SELECT * FROM clients WHERE lower(student_email) = ?", studentAccount.email);
  if (!boris) boris = clientByName(teacher.id, studentAccount.name);
  if (!boris) {
    const id = insertClient({
      teacherId: teacher.id,
      name: studentAccount.name,
      kind: "child",
      subject: "math",
      platform: "paper",
      location: "in_person",
      priceCents: 2500,
      billingMode: "prepaid",
      school: "125 SU",
      grade: "7",
      interests: "Chess and football",
      ambitions: "Wants to study architecture",
    });
    boris = getClient(id);
  }
  if (boris) {
    run(
      `UPDATE clients SET
         student_email = ?,
         billing_mode = 'prepaid',
         price_cents = CASE WHEN price_cents = 0 THEN 2500 ELSE price_cents END,
         school = CASE WHEN school = '' THEN '125 SU' ELSE school END,
         grade = CASE WHEN grade = '' THEN '7' ELSE grade END,
         interests = CASE WHEN interests = '' THEN 'Chess and football' ELSE interests END,
         ambitions = CASE WHEN ambitions = '' THEN 'Wants to study architecture' ELSE ambitions END
       WHERE id = ?`,
      studentAccount.email,
      boris.id,
    );
    setPasswordIfEmpty("clients", boris.id, studentAccount.password);
    linkParent(boris.id, parent.id);
    fillLessons(boris.id, [
      {
        days: 12,
        subject: "math",
        materials: "Fractions with the same denominator",
        homework: "Page 12, exercises 1–4",
      },
      {
        days: 5,
        subject: "math",
        materials: "Equations with one unknown",
        homework: "Finish the three examples we started",
      },
    ]);
    const added = one<{ n: number }>(
      "SELECT COALESCE(SUM(lessons_added), 0) AS n FROM payments WHERE client_id = ?",
      boris.id,
    );
    if (!added?.n) {
      insertPayment({ clientId: boris.id, paidOn: daysAgo(14), amountCents: 10000, lessonsAdded: 4 });
    }
  }

  let anna = clientByName(teacher.id, "Anna");
  if (!anna) {
    const id = insertClient({
      teacherId: teacher.id,
      name: "Anna",
      kind: "child",
      subject: "english",
      platform: "notes",
      location: "online",
      priceCents: 2000,
      billingMode: "prepaid",
      school: "32 SU",
      grade: "5",
      interests: "Stories and drawing",
      ambitions: "",
    });
    anna = getClient(id);
  }
  if (anna) {
    fillLessons(anna.id, [
      { days: 9, subject: "english", materials: "Past simple in a short story", homework: "Write six sentences about yesterday", location: "online" },
      { days: 4, subject: "english", materials: "Reading: a page from the book", homework: "Read the next page aloud", location: "online" },
      { days: 1, subject: "english", materials: "Questions with did", homework: "", location: "online" },
    ]);
    const added = one<{ n: number }>(
      "SELECT COALESCE(SUM(lessons_added), 0) AS n FROM payments WHERE client_id = ?",
      anna.id,
    );
    if (!added?.n) {
      insertPayment({ clientId: anna.id, paidOn: daysAgo(20), amountCents: 8000, lessonsAdded: 4 });
    }
  }

  let elena = clientByName(teacher.id, "Elena");
  if (!elena) {
    const id = insertClient({
      teacherId: teacher.id,
      name: "Elena",
      kind: "adult",
      subject: "math",
      platform: "paper",
      location: "in_person",
      priceCents: 3000,
      billingMode: "per_lesson",
      school: "",
      grade: "",
      interests: "Going back to university maths",
      ambitions: "",
    });
    elena = getClient(id);
  }
  if (elena) {
    fillLessons(elena.id, [
      { days: 8, subject: "math", materials: "Percentages in everyday prices", homework: "The three shop problems" },
      { days: 2, subject: "math", materials: "Linear functions", homework: "Sketch the two graphs" },
    ]);
  }

  if (listNotesForParent(parent.id).length === 0) {
    insertFeedbackNote(parent.id, boris?.id ?? null, "Boris is enjoying the lessons. The pace feels right.");
  }
  const requests = listRequestsForParent(parent.id);
  if (boris && !requests.some((item) => item.status === "answered")) {
    insertFeedbackRequest({
      parentId: parent.id,
      clientId: boris.id,
      teacherId: teacher.id,
      openQuestion: "What should I change?",
    });
    const created = listRequestsForParent(parent.id).find((item) => item.status === "open");
    if (created) {
      answerFeedbackRequest(created.id, {
        pace: 4,
        following: 5,
        homework: 4,
        overall: 5,
        openAnswer: "A bit more practice problems, please.",
      });
    }
  }
  if (boris && !listRequestsForParent(parent.id).some((item) => item.status === "open")) {
    insertFeedbackRequest({
      parentId: parent.id,
      clientId: boris.id,
      teacherId: teacher.id,
      openQuestion: "What should I change?",
    });
  }

  const signupEmail = "lina@example.com";
  if (!one("SELECT 1 AS ok FROM registrations WHERE parent_email = ?", signupEmail)) {
    insertRegistration({
      parent_name: "Lina Kovacheva",
      parent_email: signupEmail,
      parent_phone: "+359 88 200 3344",
      parent_social: "",
      parent_occupation: "Designer",
      child_name: "Mila",
      school: "18 SU",
      grade: "4",
      interests: "Puzzles",
      ambitions: "",
      subject: "math",
      portrait: "girl",
    });
  }

  if (elena) markPaysForSelf(elena.id);
}

type PasswordRow = { id: string; password_hash: string | null; password_salt: string | null };

export function authenticate(email: string, password: string): { role: Role; userId: string } | undefined {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return undefined;

  const teacher = one<PasswordRow>(
    "SELECT id, password_hash, password_salt FROM teachers WHERE email = ?",
    normalized,
  );
  if (teacher && passwordMatches(password, teacher.password_hash, teacher.password_salt)) {
    return { role: "teacher", userId: teacher.id };
  }

  const parent = one<PasswordRow>(
    "SELECT id, password_hash, password_salt FROM parents WHERE email = ?",
    normalized,
  );
  if (parent && passwordMatches(password, parent.password_hash, parent.password_salt)) {
    return { role: "parent", userId: parent.id };
  }

  const student = one<PasswordRow>(
    "SELECT id, password_hash, password_salt FROM clients WHERE lower(student_email) = ? AND status = 'active'",
    normalized,
  );
  if (student && passwordMatches(password, student.password_hash, student.password_salt)) {
    return { role: "student", userId: student.id };
  }

  return undefined;
}

export function cryptoId() {
  return randomBytes(16).toString("hex");
}

export function nowIso() {
  return new Date().toISOString();
}

export function transaction(fn: () => void) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function withStats(client: Client): ClientCard {
  const lessons = one<{ n: number }>("SELECT COUNT(*) AS n FROM lessons WHERE client_id = ?", client.id);
  const payments = one<{ amount: number; added: number }>(
    "SELECT COALESCE(SUM(amount_cents), 0) AS amount, COALESCE(SUM(lessons_added), 0) AS added FROM payments WHERE client_id = ?",
    client.id,
  );
  return {
    ...client,
    stats: summarize(
      client.billing_mode,
      client.price_cents,
      lessons?.n ?? 0,
      payments?.amount ?? 0,
      payments?.added ?? 0,
      one<{ n: number }>("SELECT COALESCE(SUM(duration_hours), 0) AS n FROM lessons WHERE client_id = ?", client.id)?.n ?? 0,
    ),
  };
}

export function getTeacher() {
  return one<Teacher>("SELECT id, name, email, phone, currency, locale, public_code FROM teachers LIMIT 1");
}

export function getTeacherById(id: string) {
  return one<Teacher>("SELECT id, name, email, phone, currency, locale, public_code FROM teachers WHERE id = ?", id);
}

export function getTeacherByEmail(email: string) {
  return one<Teacher>(
    "SELECT id, name, email, phone, currency, locale, public_code FROM teachers WHERE email = ?",
    email,
  );
}

export function updateTeacher(id: string, input: Pick<Teacher, "name" | "email" | "phone" | "currency">) {
  run(
    "UPDATE teachers SET name = ?, email = ?, phone = ?, currency = ? WHERE id = ?",
    input.name,
    input.email,
    input.phone,
    input.currency,
    id,
  );
}

export function updateTeacherLocale(id: string, locale: string) {
  run("UPDATE teachers SET locale = ? WHERE id = ?", locale, id);
}

export function getParentById(id: string) {
  return one<Parent>(
    "SELECT id, name, email, phone, social, occupation, locale, public_code FROM parents WHERE id = ?",
    id,
  );
}

export function getParentByEmail(email: string) {
  return one<Parent>(
    "SELECT id, name, email, phone, social, occupation, locale, public_code FROM parents WHERE email = ?",
    email,
  );
}

export function updateParentLocale(id: string, locale: string) {
  run("UPDATE parents SET locale = ? WHERE id = ?", locale, id);
}

export function emailTaken(email: string, except?: { role: "teacher" | "parent"; id: string }) {
  const teacher = getTeacherByEmail(email);
  if (teacher && !(except?.role === "teacher" && except.id === teacher.id)) return true;
  const parent = getParentByEmail(email);
  if (parent && !(except?.role === "parent" && except.id === parent.id)) return true;
  const student = one<{ id: string }>(
    "SELECT id FROM clients WHERE lower(student_email) = ? AND status = 'active'",
    email,
  );
  return Boolean(student);
}

export function upsertParent(input: {
  name: string;
  email: string;
  phone: string;
  social: string;
  occupation: string;
  publicCode?: string;
}) {
  const existing = getParentByEmail(input.email);
  if (existing) {
    run(
      `UPDATE parents
       SET name = CASE WHEN ? != '' THEN ? ELSE name END,
           phone = CASE WHEN ? != '' THEN ? ELSE phone END,
           social = CASE WHEN ? != '' THEN ? ELSE social END,
           occupation = CASE WHEN ? != '' THEN ? ELSE occupation END
       WHERE id = ?`,
      input.name,
      input.name,
      input.phone,
      input.phone,
      input.social,
      input.social,
      input.occupation,
      input.occupation,
      existing.id,
    );
    return getParentById(existing.id)!;
  }

  const id = cryptoId();
  run(
    `INSERT INTO parents (id, name, email, phone, social, occupation, locale, public_code, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'en', ?, ?)`,
    id,
    input.name || input.email,
    input.email,
    input.phone,
    input.social,
    input.occupation,
    input.publicCode || mintCode(),
    nowIso(),
  );
  return getParentById(id)!;
}

export function linkParent(clientId: string, parentId: string) {
  run("INSERT OR IGNORE INTO client_parents (client_id, parent_id) VALUES (?, ?)", clientId, parentId);
}

export function parentLinkedTo(parentId: string, clientId: string) {
  return Boolean(
    one(
      "SELECT 1 AS ok FROM client_parents WHERE parent_id = ? AND client_id = ?",
      parentId,
      clientId,
    ),
  );
}

export function listClients(teacherId: string) {
  return many<Client>(
    "SELECT * FROM clients WHERE teacher_id = ? AND status = 'active' ORDER BY name COLLATE NOCASE",
    teacherId,
  ).map(withStats);
}

export function getClient(id: string) {
  const client = one<Client>("SELECT * FROM clients WHERE id = ?", id);
  return client ? withStats(client) : undefined;
}

export function insertClient(input: {
  teacherId: string;
  name: string;
  kind: string;
  subject: string;
  platform: string;
  location: string;
  priceCents: number;
  billingMode: string;
  school: string;
  grade: string;
  interests: string;
  ambitions: string;
}) {
  const id = cryptoId();
  run(
    `INSERT INTO clients (
      id, teacher_id, name, kind, subject_default, platform_default, location_default,
      price_cents, billing_mode, school, grade, interests, ambitions, status, public_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    id,
    input.teacherId,
    input.name,
    input.kind,
    input.subject,
    input.platform,
    input.location,
    input.priceCents,
    input.billingMode,
    input.school,
    input.grade,
    input.interests,
    input.ambitions,
    mintCode(),
    nowIso(),
  );
  return id;
}

export function updateClient(
  id: string,
  input: {
    name: string;
    kind: string;
    subject: string;
    platform: string;
    location: string;
    priceCents: number;
    billingMode: string;
    school: string;
    grade: string;
    interests: string;
    ambitions: string;
  },
) {
  run(
    `UPDATE clients SET
      name = ?, kind = ?, subject_default = ?, platform_default = ?, location_default = ?,
      price_cents = ?, billing_mode = ?, school = ?, grade = ?, interests = ?, ambitions = ?
     WHERE id = ?`,
    input.name,
    input.kind,
    input.subject,
    input.platform,
    input.location,
    input.priceCents,
    input.billingMode,
    input.school,
    input.grade,
    input.interests,
    input.ambitions,
    id,
  );
}

export function setStudentPin(clientId: string, pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  run("UPDATE clients SET student_pin_hash = ?, student_pin_salt = ? WHERE id = ?", hash, salt, clientId);
}

export function clearStudentPin(clientId: string) {
  run("UPDATE clients SET student_pin_hash = NULL, student_pin_salt = NULL WHERE id = ?", clientId);
}

export function matchStudent(name: string, pin: string) {
  const wanted = name.trim().toLowerCase();
  if (!wanted || !pin) return undefined;
  const candidates = many<Client>(
    "SELECT * FROM clients WHERE student_pin_hash IS NOT NULL AND status = 'active'",
  ).filter((client) => client.name.trim().toLowerCase() === wanted);

  const matches = candidates.filter((client) => {
    if (!client.student_pin_hash || !client.student_pin_salt) return false;
    const next = scryptSync(pin, client.student_pin_salt, 32);
    const prev = Buffer.from(client.student_pin_hash, "hex");
    if (next.length !== prev.length) return false;
    return timingSafeEqual(next, prev);
  });

  return matches.length === 1 ? matches[0] : undefined;
}

export function listParentsOfClient(clientId: string) {
  return many<Parent>(
    `SELECT p.id, p.name, p.email, p.phone, p.social, p.occupation, p.locale, p.public_code
     FROM parents p
     JOIN client_parents cp ON cp.parent_id = p.id
     WHERE cp.client_id = ?
     ORDER BY p.name COLLATE NOCASE`,
    clientId,
  );
}

export function listClientsOfParent(parentId: string) {
  return many<Client>(
    `SELECT c.* FROM clients c
     JOIN client_parents cp ON cp.client_id = c.id
     WHERE cp.parent_id = ? AND c.status = 'active'
     ORDER BY c.name COLLATE NOCASE`,
    parentId,
  ).map(withStats);
}

export function insertLesson(input: {
  clientId: string;
  occurredOn: string;
  subject: string;
  platform: string;
  location: string;
  materials: string;
  homework: string;
  durationHours?: number;
}) {
  const hours = input.durationHours && input.durationHours > 0 ? input.durationHours : 1;
  run(
    `INSERT INTO lessons (
      id, client_id, occurred_on, subject, platform, location, materials, homework, duration_hours, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    cryptoId(),
    input.clientId,
    input.occurredOn,
    input.subject,
    input.platform,
    input.location,
    input.materials,
    input.homework,
    hours,
    nowIso(),
  );
}

export function listLessons(clientId: string) {
  return many<Lesson>(
    "SELECT * FROM lessons WHERE client_id = ? ORDER BY occurred_on DESC, created_at DESC",
    clientId,
  );
}

export function getLesson(id: string) {
  return one<Lesson>("SELECT * FROM lessons WHERE id = ?", id);
}

export function deleteLesson(id: string) {
  run("DELETE FROM lessons WHERE id = ?", id);
}

export function insertPayment(input: {
  clientId: string;
  paidOn: string;
  amountCents: number;
  lessonsAdded: number;
}) {
  run(
    `INSERT INTO payments (id, client_id, paid_on, amount_cents, lessons_added, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    cryptoId(),
    input.clientId,
    input.paidOn,
    input.amountCents,
    input.lessonsAdded,
    nowIso(),
  );
}

export function listPayments(clientId: string) {
  return many<Payment>(
    "SELECT * FROM payments WHERE client_id = ? ORDER BY paid_on DESC, created_at DESC",
    clientId,
  );
}

export function getPayment(id: string) {
  return one<Payment>("SELECT * FROM payments WHERE id = ?", id);
}

export function deletePayment(id: string) {
  run("DELETE FROM payments WHERE id = ?", id);
}

export function insertRegistration(input: Omit<Registration, "id" | "status" | "created_at">) {
  const id = cryptoId();
  run(
    `INSERT INTO registrations (
      id, parent_name, parent_email, parent_phone, parent_social, parent_occupation,
      child_name, school, grade, interests, ambitions, subject, portrait, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    id,
    input.parent_name,
    input.parent_email,
    input.parent_phone,
    input.parent_social,
    input.parent_occupation,
    input.child_name,
    input.school,
    input.grade,
    input.interests,
    input.ambitions,
    input.subject,
    input.portrait === "boy" ? "boy" : "girl",
    nowIso(),
  );
  return id;
}

export function listPendingRegistrations() {
  return many<Registration>(
    "SELECT * FROM registrations WHERE status = 'pending' ORDER BY created_at ASC",
  );
}

export function getRegistration(id: string) {
  return one<Registration>("SELECT * FROM registrations WHERE id = ?", id);
}

export function setRegistrationStatus(id: string, status: "accepted" | "declined") {
  run("UPDATE registrations SET status = ? WHERE id = ?", status, id);
}

export function pendingRegistrationCount() {
  return one<{ n: number }>("SELECT COUNT(*) AS n FROM registrations WHERE status = 'pending'")?.n ?? 0;
}

export function insertFeedbackNote(parentId: string, clientId: string | null, body: string) {
  run(
    "INSERT INTO feedback_notes (id, parent_id, client_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
    cryptoId(),
    parentId,
    clientId,
    body,
    nowIso(),
  );
}

const noteSelect = `
  SELECT n.id, n.parent_id, n.client_id, n.body, n.created_at, n.archived,
         p.name AS parent_name, c.name AS client_name
  FROM feedback_notes n
  JOIN parents p ON p.id = n.parent_id
  LEFT JOIN clients c ON c.id = n.client_id
`;

export function listFeedbackNotes() {
  return many<FeedbackNote>(`${noteSelect} ORDER BY n.created_at DESC`);
}

export function listNotesForParent(parentId: string) {
  return many<FeedbackNote>(`${noteSelect} WHERE n.parent_id = ? ORDER BY n.created_at DESC`, parentId);
}

export function listNotesForClient(clientId: string) {
  return many<FeedbackNote>(
    `${noteSelect}
     WHERE n.client_id = ?
        OR (n.client_id IS NULL AND n.parent_id IN (SELECT parent_id FROM client_parents WHERE client_id = ?))
     ORDER BY n.created_at DESC`,
    clientId,
    clientId,
  );
}

export function insertFeedbackRequest(input: {
  parentId: string;
  clientId: string;
  teacherId: string;
  openQuestion: string;
}) {
  run(
    `INSERT INTO feedback_requests (
      id, parent_id, client_id, teacher_id, open_question, status, open_answer, created_at
    ) VALUES (?, ?, ?, ?, ?, 'open', '', ?)`,
    cryptoId(),
    input.parentId,
    input.clientId,
    input.teacherId,
    input.openQuestion,
    nowIso(),
  );
}

const requestSelect = `
  SELECT r.*, p.name AS parent_name, c.name AS client_name
  FROM feedback_requests r
  JOIN parents p ON p.id = r.parent_id
  LEFT JOIN clients c ON c.id = r.client_id
`;

export function listFeedbackRequests() {
  return many<FeedbackRequest>(`${requestSelect} ORDER BY r.created_at DESC`);
}

export function listRequestsForParent(parentId: string) {
  return many<FeedbackRequest>(`${requestSelect} WHERE r.parent_id = ? ORDER BY r.created_at DESC`, parentId);
}

export function getFeedbackRequest(id: string) {
  return one<FeedbackRequest>("SELECT * FROM feedback_requests WHERE id = ?", id);
}

export function answerFeedbackRequest(
  id: string,
  input: { pace: number; following: number; homework: number; overall: number; openAnswer: string },
) {
  run(
    `UPDATE feedback_requests
     SET status = 'answered', pace = ?, following_score = ?, homework_score = ?, overall = ?,
         open_answer = ?, answered_at = ?
     WHERE id = ?`,
    input.pace,
    input.following,
    input.homework,
    input.overall,
    input.openAnswer,
    nowIso(),
    id,
  );
}

export function setFeedbackArchived(kind: "request" | "note", id: string, archived: boolean) {
  const table = kind === "request" ? "feedback_requests" : "feedback_notes";
  run(`UPDATE ${table} SET archived = ? WHERE id = ?`, archived ? 1 : 0, id);
}

export function openRequestCount() {
  return one<{ n: number }>("SELECT COUNT(*) AS n FROM feedback_requests WHERE status = 'open' AND archived = 0")?.n ?? 0;
}

export type MagicLink = {
  token: string;
  email: string;
  role: "teacher" | "parent";
  user_id: string;
  locale: string;
  expires_at: string;
  used_at: string | null;
};

export type SessionRow = {
  id: string;
  role: Role;
  user_id: string;
  created_at: string;
  expires_at: string;
};

export function createMagicLink(input: { email: string; role: "teacher" | "parent"; userId: string; locale: string }) {
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  run(
    `INSERT INTO magic_links (token, email, role, user_id, locale, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    token,
    input.email,
    input.role,
    input.userId,
    input.locale,
    expires,
  );
  return token;
}

export function consumeMagicLink(token: string) {
  const link = one<MagicLink>(
    "SELECT * FROM magic_links WHERE token = ? AND used_at IS NULL AND expires_at > ?",
    token,
    nowIso(),
  );
  if (!link) return undefined;
  run("UPDATE magic_links SET used_at = ? WHERE token = ?", nowIso(), token);
  return link;
}

export function createSession(role: Role, userId: string) {
  const id = randomBytes(24).toString("hex");
  const created = nowIso();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  run(
    "INSERT INTO sessions (id, role, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    id,
    role,
    userId,
    created,
    expires,
  );
  return one<SessionRow>("SELECT * FROM sessions WHERE id = ?", id)!;
}

export function getSessionRow(id: string) {
  return one<SessionRow>("SELECT * FROM sessions WHERE id = ? AND expires_at > ?", id, nowIso());
}

export function deleteSession(id: string) {
  run("DELETE FROM sessions WHERE id = ?", id);
}
