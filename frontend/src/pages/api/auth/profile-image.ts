import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionCookieName, mintAccessToken, verifySession } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sessionToken = req.cookies[getSessionCookieName()];
  const session = verifySession(sessionToken);

  if (!session) {
    res.status(401).json({ detail: "Unauthorized" });
    return;
  }

  const userId = req.query.userId;
  if (typeof userId !== "string" || !userId) {
    res.status(400).json({ detail: "Missing userId" });
    return;
  }

  const accessToken = mintAccessToken(session.user);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile-image/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => null);

  if (!response || !response.ok) {
    res.status(response?.status || 404).end();
    return;
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(buffer);
}
