import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function sanitizeRedirectPath(path: string): string {
    // Only allow relative paths starting with / and no protocol tricks
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
        return '/dashboard';
    }
    return path;
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = sanitizeRedirectPath(searchParams.get('next') ?? '/dashboard')
    const appOrigin = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${appOrigin}${next}`)
        }
    }

    return NextResponse.redirect(`${appOrigin}/login?error=auth_code_error`)
}
