import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "user:email",
    state,
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
  response.cookies.set("oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
