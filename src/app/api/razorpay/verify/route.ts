import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// We must use the Admin client because this is a webhook/server API verifying data
// and we need to forcefully update the user profile even if their auth token isn't in this direct request.
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            userId,
            planId
        } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error("Missing razorpay secret");

        // Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // Signature is valid. Update the database!
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                subscription_tier: planId, // 'pro' or 'team'
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating profile after payment:', updateError);
            throw new Error('Failed to update user profile');
        }

        return NextResponse.json({ success: true, message: 'Payment verified and profile updated.' });
    } catch (error: any) {
        console.error('Razorpay Verify Error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
