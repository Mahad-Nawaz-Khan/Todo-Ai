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

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "backend_error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "backend_unavailable" }, { status: 502 });
  }
}
