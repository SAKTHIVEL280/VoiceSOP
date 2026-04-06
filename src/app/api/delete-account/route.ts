import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE() {
    try {
        // 1. Authenticate the requesting user via cookies
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deletionLimit = await checkRateLimit(`delete-account:user:${user.id}`, 1, 60_000);
        if (!deletionLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many deletion attempts. Please wait and try again.' },
                { status: 429, headers: { 'Retry-After': String(deletionLimit.retryAfterSeconds) } }
            );
        }

        const userId = user.id;

        // 2. Get all SOPs to find audio files for cleanup
        const { data: userSops } = await supabaseAdmin
            .from('sops')
            .select('audio_url')
            .eq('user_id', userId);

        // 3. Delete audio files from storage
        if (userSops) {
            const filePaths = userSops
                .filter(s => s.audio_url)
                .map(s => {
                    if (s.audio_url.startsWith('http')) {
                        // Legacy: extract path from full URL
                        try {
                            const url = new URL(s.audio_url);
                            const parts = url.pathname.split('/audio-recordings/');
                            return parts[1] || null;
                        } catch {
                            return null;
                        }
                    }
                    // New format: already a storage path
                    return s.audio_url;
                })
                .filter((p): p is string => p !== null);

            if (filePaths.length > 0) {
                await supabaseAdmin.storage.from('audio-recordings').remove(filePaths);
            }
        }

        // 4. Delete SOPs and profile (using admin client to bypass RLS)
        await supabaseAdmin.from('sops').delete().eq('user_id', userId);
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        // 5. Delete the auth.users entry (fully removes the user)
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteUserError) {
            console.error('Failed to delete auth user:', deleteUserError);
            return NextResponse.json({ error: 'Failed to fully delete account.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json({ error: 'Account deletion failed. Please try again.' }, { status: 500 });
    }
}
