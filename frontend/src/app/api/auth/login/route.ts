import { NextRequest, NextResponse } from "next/server";

import { signSession, getSessionCookieName, buildUserFromProfile } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/email/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({ detail: data.detail || "Login failed" }, { status: res.status });
    }

    const data = await res.json();

    // Build a session user from the backend response
    const user = buildUserFromProfile({
      provider: "email",
      providerUserId: String(data.user?.id || data.id || email),
      email: data.user?.email || data.email || email,
      firstName: data.user?.first_name || data.first_name || null,
      lastName: data.user?.last_name || data.last_name || null,
      name: data.user?.name || data.name || null,
    });

    const token = signSession({ user });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const response = NextResponse.json({ success: true });
    response.headers.set(
      "Set-Cookie",
      `${getSessionCookieName()}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`
    );
    return response;
  } catch {
    return NextResponse.json({ detail: "Something went wrong" }, { status: 500 });
  }
}