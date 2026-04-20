import { NextRequest, NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "github_oauth_state";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL("/sign-in?error=github_auth_failed", req.url));
  }

  const state = crypto.randomUUID();
  const redirectTarget = req.nextUrl.searchParams.get("redirect_url") || "/";
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "user:email",
    state,
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, redirectTarget }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
