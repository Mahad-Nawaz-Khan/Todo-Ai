import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const callbackUrl = new URL("/api/oauth/callback/google", req.url);
  callbackUrl.search = new URL(req.url).search;
  return NextResponse.redirect(callbackUrl);
}
