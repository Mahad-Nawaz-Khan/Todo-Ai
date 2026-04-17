import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionCookieName, mintAccessToken, verifySession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value ?? null;
  const session = verifySession(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const accessToken = mintAccessToken(session.user);

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/profile-image/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "not_found" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "backend_unavailable" }, { status: 502 });
  }
}