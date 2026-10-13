import { NextResponse, type NextRequest } from "next/server";

function redirectTo(request: NextRequest, path: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "") ?? "http";
  const base = host ? `${proto}://${host}` : request.nextUrl.origin;
  return NextResponse.redirect(new URL(path, base), 303);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  return redirectTo(request, `/${locale}/login`);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> },
) {
  return GET(request, context);
}
