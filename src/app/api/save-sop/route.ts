import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function PATCH(req: NextRequest) {
    try {
        // Rate limit
        const clientIp = getClientIp(req.headers);
        const ipLimit = await checkRateLimit(`save-sop:ip:${clientIp}`, 30, 60_000);
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests.' },
                { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
            );
        }

        // Auth
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, content, tags } = body;

        if (!id || !title || !content) {
            return NextResponse.json({ error: 'Missing required fields: id, title, content' }, { status: 400 });
        }
        if (typeof title !== 'string' || title.trim().length === 0 || title.length > 500) {
            return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
        }

        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from('sops')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
        }
        if (existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch user tier
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .maybeSingle();

        const tier = profile?.subscription_tier || 'free';

        // Sanitize content — strip pro-only fields for free users
        const safeContent = { ...content };
        if (tier === 'free') {
            delete safeContent.scope;
            delete safeContent.prerequisites;
            delete safeContent.glossary;
        }

        // Persist
        const { error: updateError } = await supabase
            .from('sops')
            .update({
                title: title.trim(),
                content: safeContent,
                updated_at: new Date().toISOString(),
                tags: Array.isArray(tags)
                    ? tags.filter((t: string) => t !== 'Draft' && t !== 'Processing')
                    : [],
            })
            .eq('id', id);

        if (updateError) {
            console.error('SOP save error:', updateError);
            return NextResponse.json({ error: 'Failed to save SOP.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Save SOP error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
