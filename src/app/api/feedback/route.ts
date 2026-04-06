import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
    try {
        // 1. IP-level rate limit
        const clientIp = getClientIp(req.headers);
        const ipLimit = await checkRateLimit(`feedback:ip:${clientIp}`, 10, 60_000);
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
            );
        }

        const body = await req.json();
        const { subject, message, type } = body;

        // 2. Input validation
        if (
            !subject || !message || !type ||
            typeof subject !== 'string' ||
            typeof message !== 'string' ||
            typeof type !== 'string'
        ) {
            return NextResponse.json(
                { error: 'Missing required fields: subject, message, type' },
                { status: 400 }
            );
        }
        if (subject.length > 200 || message.length > 5000 || type.length > 20) {
            return NextResponse.json(
                { error: 'Input exceeds maximum allowed length' },
                { status: 400 }
            );
        }
        const allowedTypes = ['feedback', 'bug', 'feature'];
        if (!allowedTypes.includes(type.toLowerCase())) {
            return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
        }

        // 3. Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 4. Per-user rate limit
        const userLimit = await checkRateLimit(`feedback:user:${user.id}`, 5, 60_000);
        if (!userLimit.allowed) {
            return NextResponse.json(
                { error: 'Feedback limit reached. Please wait and try again.' },
                { status: 429, headers: { 'Retry-After': String(userLimit.retryAfterSeconds) } }
            );
        }

        // 5. Fetch profile for sender name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

        const senderName = escapeHtml(profile?.full_name || 'Unknown User');
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
        const safeType = escapeHtml(type);

        // 6. Verify email config
        const feedbackEmail = process.env.FEEDBACK_EMAIL;
        const fromDomain = process.env.RESEND_FROM_EMAIL || 'VoiceSOP Feedback <onboarding@resend.dev>';
        if (!feedbackEmail) {
            return NextResponse.json(
                { error: 'Feedback service is not configured.' },
                { status: 500 }
            );
        }

        // 7. Send email
        const { data: emailData, error: resendError } = await resend.emails.send({
            from: fromDomain,
            to: [feedbackEmail],
            subject: `[${safeType.toUpperCase()}] ${safeSubject}`,
            html: `
                <h3>New Feedback from VoiceSOP</h3>
                <p><strong>Full Name:</strong> ${senderName}</p>
                <p><strong>User Email:</strong> ${escapeHtml(user.email || '')}</p>
                <p><strong>User ID:</strong> ${escapeHtml(user.id)}</p>
                <p><strong>Type:</strong> ${safeType}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>${safeMessage}</p>
            `,
        });

        if (resendError) {
            console.error('Resend error:', resendError);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: emailData });
    } catch (error: unknown) {
        console.error('Feedback API error:', error);
        return NextResponse.json(
            { error: 'Failed to send feedback. Please try again.' },
            { status: 500 }
        );
    }
}
