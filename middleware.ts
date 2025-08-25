import createMiddleware from "next-intl/middleware"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { locales, defaultLocale } from "./i18n"

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
})

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Extract locale from pathname
  const pathnameLocale = pathname.split("/")[1]
  const locale = locales.includes(pathnameLocale as any)
    ? pathnameLocale
    : defaultLocale

  // Define protected routes
  const isProtectedRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/profile")

  const isAuthRoute =
    pathname.includes("/login") || pathname.includes("/signup")

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing auth routes with active session
  if (isAuthRoute && session) {
    const url = req.nextUrl.clone()

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    // Redirect based on user role
    if (profile?.role === "admin" || profile?.role === "super_admin") {
      url.pathname = `/${locale}/admin/dashboard`
    } else {
      url.pathname = `/${locale}/dashboard`
    }

    return NextResponse.redirect(url)
  }

  // Apply internationalization middleware
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - ... if they start with `/api`, `/_next` or `/_vercel`
    // - ... the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // However, match all pathnames within `/users`, including the ones with a dot
    "/([\\w-]+)?/users/(.+)",
  ],
}
