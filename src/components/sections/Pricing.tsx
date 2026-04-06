'use client';

import React, { useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Script from 'next/script';

const plans = [
    {
        name: "Free",
        inrPrice: "₹0",
        usdPrice: "$0",
        period: "/forever",
        description: "Perfect for testing the waters.",
        features: ["3 free SOP generations per month", "Store 1 SOP at a time", "PDF Export"],
        cta: "Start Free",
        highlight: false,
        href: "/login",
        planId: "free"
    },
    {
        name: "Pro",
        inrPrice: "₹499",
        usdPrice: "$10",
        period: "/month",
        description: "For serious business owners.",
        features: ["Unlimited SOPs", "Advanced Formatting (ISO Standard)", "Scope, Roles & Glossary Sections", "Priority Support"],
        cta: "Get Pro",
        highlight: true,
        href: "#",
        planId: "pro"
    },
    {
        name: "Team",
        inrPrice: "₹9,999",
        usdPrice: "$129",
        period: "/month",
        description: "For scaling agencies.",
        features: ["Everything in Pro", "5 Team Members", "Shared Library", "Custom Branding"],
        cta: "Contact Sales",
        highlight: false,
        href: "/contact",
        planId: "team"
    }
];

export default function Pricing() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

    const handleCheckout = async (planId: string) => {
        if (planId === 'free') {
            router.push('/login');
            return;
        }

        try {
            setLoadingPlan(planId);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please sign in or create an account to upgrade.");
                router.push("/login?next=/pricing");
                return;
            }

            if (planId === 'team') {
                // Keep team plan as redirect to contact for now, or open razorpay if you want Team to be self-serve:
                // If we want self-serve Team, we remove this. For now let's make it self-serve since we built the API for it.
            }

            const res = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            const orderHeader = await res.json();
            if (!res.ok) throw new Error(orderHeader.error || "Failed to create order");

            const options = {
                key: orderHeader.key_id,
                amount: orderHeader.amount,
                currency: orderHeader.currency,
                name: "VoiceSOP",
                description: `Upgrade to ${planId.toUpperCase()}`,
                order_id: orderHeader.id,
                prefill: orderHeader.prefill,
                theme: {
                    color: "#D32F2F" // brand-red
                },
                handler: async function (response: any) {
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            userId: user.id,
                            planId
                        })
                    });
                    if (verifyRes.ok) {
                        toast.success("Payment successful! Upgraded to " + planId.toUpperCase());
                        router.push('/dashboard');
                        router.refresh();
                    } else {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error("Payment failed: " + response.error.description);
            });
            rzp.open();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingPlan(null);
        }
    };

    const country = useMemo<'IN' | 'US'>(() => {
        if (typeof navigator === 'undefined') return 'US';
        const locale = (navigator.language || '').toLowerCase();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        return locale.includes('in') || timezone.includes('Asia/Kolkata') ? 'IN' : 'US';
    }, []);

    const displayPlans = useMemo(
        () => plans.map((plan) => ({
            ...plan,
            price: country === 'IN' ? plan.inrPrice : plan.usdPrice,
        })),
        [country]
    );

    return (
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative z-10 animate-fade-in-up">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif mb-4 sm:mb-6">Simple, transparent pricing</h2>
                    <p className="text-base sm:text-xl text-gray-600">Start for free, upgrade when you scale. No hidden fees.</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">Prices shown for: {country === 'IN' ? 'India' : 'United States'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                    {displayPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col ${plan.highlight ? 'bg-off-black text-white border-off-black shadow-2xl md:scale-105 z-10' : 'bg-white text-off-black border-gray-200'}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-red text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-serif">{plan.price}</span>
                                <span className="opacity-60 ml-1">{plan.period}</span>
                            </div>
                            <p className={`mb-8 leading-relaxed ${plan.highlight ? 'opacity-80' : 'text-gray-600'}`}>
                                {plan.description}
                            </p>

                            <ul className="flex-grow space-y-4 mb-8">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check size={20} className={plan.highlight ? 'text-brand-red' : 'text-green-600'} />
                                        <span className="text-sm font-medium">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(plan.planId)}
                                disabled={loadingPlan === plan.planId}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.highlight
                                    ? 'bg-brand-red hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/30'
                                    : 'bg-gray-100 hover:bg-gray-200 text-off-black'
                                    }`}>
                                {loadingPlan === plan.planId ? <Loader2 size={20} className="animate-spin" /> : plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
