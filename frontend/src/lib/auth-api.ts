import type { NextApiRequest, NextApiResponse } from "next";

import type { AppUser } from "@/lib/auth";
import { getSessionCookieName, signSession } from "@/lib/auth";
import { configuredPassport } from "@/lib/passport";

function buildSessionCookie(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${getSessionCookieName()}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
}

export function setSessionCookie(res: NextApiResponse, user: AppUser) {
  const token = signSession({ user });
  res.setHeader("Set-Cookie", buildSessionCookie(token));
}

export function authenticateProvider(provider: "google" | "github", req: NextApiRequest, res: NextApiResponse) {
  const options = provider === "google" ? { scope: ["profile", "email"], session: false } : { scope: ["user:email"], session: false };
  return configuredPassport.authenticate(provider, options)(req, res);
}

export async function handleProviderCallback(
  provider: "google" | "github",
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await new Promise<AppUser>((resolve, reject) => {
    configuredPassport.authenticate(provider, { session: false }, (error: unknown, authUser?: AppUser) => {
      if (error) {
        reject(error);
        return;
      }
      if (!authUser) {
        reject(new Error("Authentication failed"));
        return;
      }
      resolve(authUser);
    })(req, res);
  });

  setSessionCookie(res, user);
  res.redirect("/");
}

