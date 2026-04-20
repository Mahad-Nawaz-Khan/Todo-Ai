import { NextRequest, NextResponse } from "next/server";

import { buildUserFromProfile, getSessionCookieName, signSession } from "@/lib/auth";
import { configuredPassport } from "@/lib/passport";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=no_code", req.url));
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.redirect(new URL("/sign-in?error=token_exchange_failed", req.url));
    }

    const tokens = await tokenRes.json();

    // Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/sign-in?error=profile_fetch_failed", req.url));
    }

    const profile = await profileRes.json();
    const user = buildUserFromProfile({
      provider: "google",
      providerUserId: String(profile.id),
      email: profile.email || null,
      firstName: profile.given_name || null,
      lastName: profile.family_name || null,
      name: profile.name || null,
      imageUrl: profile.picture || null,
    });

    // Sign session and set cookie
    const token = signSession({ user });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const response = NextResponse.redirect(new URL("/", req.url));
    response.headers.set(
      "Set-Cookie",
      `${getSessionCookieName()}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`
    );
    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/sign-in?error=google_auth_failed", req.url));
  }
}
