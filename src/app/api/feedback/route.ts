import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY || 're_HJKUytyG_33fssLhYFtRDbE43CcJGyD46');

export async function POST(req: NextRequest) {
    try {
        const { subject, message, type } = await req.json();

        // 1. Authenticate User
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        // Fetch Profile for Full Name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const senderName = profile?.full_name || 'Unknown User';

        // 2. Send Email
        const { data, error: resendError } = await resend.emails.send({
            from: 'VoiceSOP Feedback <onboarding@resend.dev>', // Use default testing domain or verified domain
            to: ['sakthivel.hsr06@gmail.com'],
            subject: `[${type.toUpperCase()}] ${subject}`,
            html: `
                <h3>New Feedback from VoiceSOP</h3>
                <p><strong>Full Name:</strong> ${senderName}</p>
                <p><strong>User Email:</strong> ${user.email}</p>
                <p><strong>User ID:</strong> ${user.id}</p>
                <p><strong>Type:</strong> ${type}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        if (resendError) {
            console.error("Resend Error:", resendError);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
