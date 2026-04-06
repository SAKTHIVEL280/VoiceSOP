import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })

                    supabaseResponse = NextResponse.next({
                        request,
                    })

                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    const { data: { user } } = await supabase.auth.getUser()

    // Protect dashboard routes — redirect unauthenticated users to login
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', request.nextUrl.pathname)
        const redirectResponse = NextResponse.redirect(loginUrl)
        supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
            redirectResponse.cookies.set(name, value)
        })
        return redirectResponse
    }

    // Keep authenticated users out of login page
    if (user && request.nextUrl.pathname === '/login') {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        const redirectResponse = NextResponse.redirect(dashboardUrl)
        supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
            redirectResponse.cookies.set(name, value)
        })
        return redirectResponse
    }

    return supabaseResponse
}
