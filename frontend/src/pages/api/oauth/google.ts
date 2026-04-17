import type { NextApiRequest, NextApiResponse } from "next";

import { authenticateProvider } from "@/lib/auth-api";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return authenticateProvider("google", req, res);
}
