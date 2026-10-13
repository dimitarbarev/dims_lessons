import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionRow, type Role, type SessionRow } from "./db";

export const SESSION_COOKIE = "dl_session";

export type Session = SessionRow;

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return getSessionRow(id) ?? null;
}

export async function requireSession(role: Role): Promise<Session> {
  const session = await getSession();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/login", locale });
    throw new Error("Redirect failed");
  }
  if (session.role !== role) {
    redirect({ href: homeFor(session.role), locale });
    throw new Error("Redirect failed");
  }
  return session;
}

export function homeFor(role: Role) {
  if (role === "teacher") return "/today";
  if (role === "parent") return "/family";
  return "/my";
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
