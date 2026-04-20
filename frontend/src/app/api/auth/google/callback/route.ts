import { NextRequest, NextResponse } from "next/server";

import { buildUserFromProfile, getSessionCookieName, signSession } from "@/lib/auth";

const OAUTH_STATE_COOKIE = "google_oauth_state";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  try {
    if (!code || !state || !clientId || !clientSecret || !stateCookie) {
      throw new Error("Missing OAuth callback data");
    }

    const parsedState = JSON.parse(stateCookie) as { state: string; redirectTarget?: string };
    if (parsedState.state !== state) {
      throw new Error("Invalid OAuth state");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      throw new Error(`Google token exchange failed with status ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("Google access token missing");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });

    if (!profileRes.ok) {
      throw new Error(`Google profile fetch failed with status ${profileRes.status}`);
    }

    const profile = await profileRes.json() as {
      id: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      name?: string;
      picture?: string;
    };

    const user = buildUserFromProfile({
      provider: "google",
      providerUserId: profile.id,
      email: profile.email ?? null,
      firstName: profile.given_name ?? null,
      lastName: profile.family_name ?? null,
      name: profile.name ?? null,
      imageUrl: profile.picture ?? null,
    });

    const token = signSession({ user });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const redirectTarget = parsedState.redirectTarget && parsedState.redirectTarget.startsWith("/")
      ? parsedState.redirectTarget
      : "/";
    const response = NextResponse.redirect(new URL(redirectTarget, req.url));
    response.headers.set(
      "Set-Cookie",
      `${getSessionCookieName()}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`
    );
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    const response = NextResponse.redirect(new URL("/sign-in?error=google_auth_failed", req.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    console.error("Google OAuth callback error", error);
    return response;
  }
}
