import { NextRequest, NextResponse } from "next/server";

import { buildUserFromProfile, getSessionCookieName, signSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=no_code", req.url));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || "",
        client_secret: process.env.GITHUB_CLIENT_SECRET || "",
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/sign-in?error=token_exchange_failed", req.url));
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("GitHub token exchange error:", tokenData.error);
      return NextResponse.redirect(new URL("/sign-in?error=token_exchange_failed", req.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/sign-in?error=profile_fetch_failed", req.url));
    }

    const profile = await profileRes.json();

    // Fetch primary email (GitHub doesn't always include it)
    let email: string | null = profile.email;
    if (!email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (emailRes.ok) {
        const emails = await emailRes.json();
        const primary = (emails as { email: string; primary: boolean; verified: boolean }[]).find(
          (e) => e.primary && e.verified
        );
        email = primary?.email || null;
      }
    }

    const user = buildUserFromProfile({
      provider: "github",
      providerUserId: String(profile.id),
      email,
      firstName: null,
      lastName: null,
      name: profile.name || profile.login || null,
      imageUrl: profile.avatar_url || null,
    });

    const token = signSession({ user });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const response = NextResponse.redirect(new URL("/", req.url));
    response.headers.set(
      "Set-Cookie",
      `${getSessionCookieName()}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`
    );
    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(new URL("/sign-in?error=github_auth_failed", req.url));
  }
}
