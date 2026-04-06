import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const clientIp = getClientIp(req.headers);
        const ipLimit = await checkRateLimit(`contact:ip:${clientIp}`, 3, 60_000);
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const { name, email, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        // Send email via Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY not configured');
            return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'VoiceSOP Contact <onboarding@resend.dev>',
                to: ['support@voicesop.com'],
                reply_to: email,
                subject: `[VoiceSOP Contact] ${subject}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr />
                    <p>${message.replace(/\n/g, '<br />')}</p>
                `,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Resend error:', errorData);
            // Still return success to the user — we log the message
            console.log('Contact form fallback log:', { name, email, subject, message });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
    }
}
