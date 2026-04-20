import { NextRequest, NextResponse } from "next/server";

import { buildUserFromProfile, getSessionCookieName, signSession } from "@/lib/auth";

const OAUTH_STATE_COOKIE = "github_oauth_state";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  try {
    if (!code || !state || !clientId || !clientSecret || !stateCookie) {
      throw new Error("Missing OAuth callback data");
    }

    const parsedState = JSON.parse(stateCookie) as { state: string; redirectTarget?: string };
    if (parsedState.state !== state) {
      throw new Error("Invalid OAuth state");
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      throw new Error(`GitHub token exchange failed with status ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("GitHub access token missing");
    }

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!profileRes.ok) {
      throw new Error(`GitHub profile fetch failed with status ${profileRes.status}`);
    }

    const profile = await profileRes.json() as {
      id: number;
      email?: string | null;
      name?: string | null;
      login?: string | null;
      avatar_url?: string | null;
    };

    let email = profile.email ?? null;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });

      if (emailsRes.ok) {
        const emails = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        const preferred = emails.find((item) => item.primary && item.verified) ?? emails.find((item) => item.verified) ?? emails[0];
        email = preferred?.email ?? null;
      }
    }

    const [firstName, ...rest] = (profile.name || "").split(" ").filter(Boolean);
    const user = buildUserFromProfile({
      provider: "github",
      providerUserId: String(profile.id),
      email,
      firstName: firstName || null,
      lastName: rest.length ? rest.join(" ") : null,
      name: profile.name ?? profile.login ?? null,
      imageUrl: profile.avatar_url ?? null,
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
    const response = NextResponse.redirect(new URL("/sign-in?error=github_auth_failed", req.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    console.error("GitHub OAuth callback error", error);
    return response;
  }
}
