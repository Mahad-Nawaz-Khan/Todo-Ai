import type { NextApiRequest, NextApiResponse } from "next";

import { getAccessTokenTtlSeconds, getSessionCookieName, mintAccessToken, verifySession } from "@/lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sessionToken = req.cookies[getSessionCookieName()];
  const session = verifySession(sessionToken);

  if (!session) {
    res.status(401).json({ detail: "Unauthorized" });
    return;
  }

  const accessToken = mintAccessToken(session.user);
  res.status(200).json({
    accessToken,
    expiresIn: getAccessTokenTtlSeconds(),
    user: session.user,
  });
}
