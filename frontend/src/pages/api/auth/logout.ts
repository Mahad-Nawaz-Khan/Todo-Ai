import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionCookieName } from "@/lib/auth";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cookie = `${getSessionCookieName()}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", cookie);

  res.status(200).json({ success: true });
}
