import type { NextApiRequest, NextApiResponse } from "next";

import { buildUserFromProfile } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ detail: "Method not allowed" });
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ detail: "Email and password are required" });
    return;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    res.status(500).json({ detail: "API URL not configured" });
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/email/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }

    // Build AppUser from the backend response and set session cookie
    const user = buildUserFromProfile({
      provider: "email",
      providerUserId: `email:${email.toLowerCase()}`,
      email: data.email,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
    });

    setSessionCookie(res, user);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ detail: "Login failed" });
  }
}
