import { NextRequest, NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "google_oauth_state";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin;

  if (!clientId) {
    return NextResponse.redirect(new URL("/sign-in?error=google_auth_failed", req.url));
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  const redirectTarget = req.nextUrl.searchParams.get("redirect_url") || "/";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile email",
    state,
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, redirectTarget }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
