import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = request.nextUrl.searchParams.get("next") || "/dashboard";
  const nextPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
}