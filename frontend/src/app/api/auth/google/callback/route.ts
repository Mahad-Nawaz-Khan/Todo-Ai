import { NextRequest, NextResponse } from "next/server";

import { handleProviderCallback } from "@/lib/auth-api";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.next();
    await handleProviderCallback("google", req as unknown as Parameters<typeof handleProviderCallback>[1], res as unknown as Parameters<typeof handleProviderCallback>[2]);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=google_auth_failed", req.url));
  }
}