import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionCookieName, verifySession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value ?? null;
  const session = verifySession(sessionToken);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({ authenticated: true, user: session.user });
}