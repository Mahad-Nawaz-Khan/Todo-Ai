import type { NextApiRequest, NextApiResponse } from "next";

import { handleProviderCallback } from "@/lib/auth-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await handleProviderCallback("github", req, res);
  } catch {
    res.redirect("/sign-in?error=github_auth_failed");
  }
}
