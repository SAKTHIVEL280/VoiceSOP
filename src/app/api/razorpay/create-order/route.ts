import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const clientIp = getClientIp(req.headers);
        const ipLimit = await checkRateLimit(`razorpay-order:ip:${clientIp}`, 10, 60_000);
        if (!ipLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await req.json(); // e.g. "pro" or "team"

        let amount = 0;
        if (planId === 'pro') amount = 499 * 100; // Razorpay needs paise (499 INR)
        else if (planId === 'team') amount = 9999 * 100; // 9999 INR
        else return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        const options = {
            amount,
            currency: 'INR',
            receipt: `rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
            notes: {
                userId: user.id,
                planId: planId,
            }
        };

        const order = await razorpay.orders.create(options);

        // Fetch User Profile to pre-fill Checkout Form
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID, // Send securely to frontend
            prefill: {
                name: profile?.full_name || '',
                email: user.email || '',
            }
        });
    } catch (error: any) {
        console.error('Razorpay Create Order Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
