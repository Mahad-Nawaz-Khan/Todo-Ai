import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();

  cookieStore.delete(cookieName);

  return NextResponse.json({ success: true });
}