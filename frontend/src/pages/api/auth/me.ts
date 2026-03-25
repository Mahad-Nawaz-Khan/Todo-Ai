import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionCookieName, mintAccessToken, verifySession } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sessionToken = req.cookies[getSessionCookieName()];
  const session = verifySession(sessionToken);

  if (!session) {
    res.status(401).json({ detail: "Unauthorized" });
    return;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    res.status(200).json({ detail: "No API URL configured" });
    return;
  }

  const accessToken = mintAccessToken(session.user);

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    res.status(502).json({ detail: "Failed to reach backend auth service" });
    return;
  }

  const contentType = response.headers.get("content-type") || "application/json";
  const bodyText = await response.text();

  res.status(response.status);
  res.setHeader("Content-Type", contentType);
  res.send(bodyText);
}
