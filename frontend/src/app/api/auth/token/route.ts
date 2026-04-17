import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionCookieName, mintAccessToken, verifySession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value ?? null;
  const session = verifySession(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const accessToken = mintAccessToken(session.user);
  return NextResponse.json({ accessToken });
}