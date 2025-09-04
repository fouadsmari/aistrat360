import createMiddleware from "next-intl/middleware"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./src/i18n/routing"

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  // First, handle internationalization
  let response = intlMiddleware(req)

  // If intl middleware wants to redirect, respect that
  if (response.status === 307 || response.status === 308) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  // Check authentication - use getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  // Extract locale from pathname with strict validation
  const pathnameLocale = pathname.split("/")[1]

  // Validate locale against whitelist of allowed locales
  const validLocales = ["fr", "en"] // Explicit whitelist
  const locale = validLocales.includes(pathnameLocale)
    ? pathnameLocale
    : routing.defaultLocale

  // Define protected routes
  const isProtectedRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/profile")

  const isAdminRoute = pathname.includes("/admin")

  const isAuthRoute =
    pathname.includes("/login") || pathname.includes("/signup")

  // Redirect to login if accessing protected route without user
  if (isProtectedRoute && !user) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // Check admin access for authenticated users
  if (isAdminRoute && user) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // If user is not admin or super_admin, redirect to regular dashboard
    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}/dashboard`
      return NextResponse.redirect(url)
    }
  }

  // Redirect to dashboard if accessing auth routes with active user
  if (isAuthRoute && user) {
    const url = req.nextUrl.clone()

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Redirect based on user role
    if (profile?.role === "admin" || profile?.role === "super_admin") {
      url.pathname = `/${locale}/admin/dashboard`
    } else {
      url.pathname = `/${locale}/dashboard`
    }

    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - ... if they start with `/api`, `/_next` or `/_vercel`
    // - ... the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
