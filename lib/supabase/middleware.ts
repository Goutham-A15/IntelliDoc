import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If user is logged in and on the homepage or an auth page (but NOT the update-password page), redirect them to the dashboard.
  if (user && (pathname === "/" || (pathname.startsWith("/auth") && pathname !== "/auth/update-password"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is not logged in and trying to access a protected route, redirect to the homepage.
  if (
    !user &&
    pathname !== "/" &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return supabaseResponse
}