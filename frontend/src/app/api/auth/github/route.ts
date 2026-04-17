import { NextRequest, NextResponse } from "next/server";

import { authenticateProvider } from "@/lib/auth-api";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.next();
    await authenticateProvider("github", req as unknown as Parameters<typeof authenticateProvider>[1], res as unknown as Parameters<typeof authenticateProvider>[2]);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=github_auth_failed", req.url));
  }
}