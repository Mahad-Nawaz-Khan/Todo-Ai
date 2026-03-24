import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionCookieName, verifySession } from "@/lib/auth";
import type { AuthSessionResponse } from "@/types/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse<AuthSessionResponse>) {
  const sessionToken = req.cookies[getSessionCookieName()];
  const session = verifySession(sessionToken);

  if (!session) {
    res.status(200).json({ authenticated: false, user: null });
    return;
  }

  res.status(200).json({
    authenticated: true,
    user: session.user,
  });
}
