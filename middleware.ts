import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Protect everything except the homepage and static assets
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)",
  ],
}

