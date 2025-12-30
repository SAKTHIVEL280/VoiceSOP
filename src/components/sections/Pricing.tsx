'use client';

import React from 'react';
import { Check } from 'lucide-react';

const plans = [
    {
        name: "Free",
        price: "₹0",
        period: "/forever",
        description: "Perfect for testing the waters.",
        features: ["3 SOPs per month", "Basic AI processing", "PDF Export"],
        cta: "Start Free",
        highlight: false
    },
    {
        name: "Pro",
        price: "₹499",
        period: "/month",
        description: "For serious business owners.",
        features: ["Unlimited SOPs", "Advanced Formatting", "Markdown Export", "Priority Support"],
        cta: "Get Pro",
        highlight: true
    },
    {
        name: "Team",
        price: "₹9,999",
        period: "/month",
        description: "For scaling agencies.",
        features: ["Everything in Pro", "5 Team Members", "Shared Library", "Custom Branding"],
        cta: "Contact Sales",
        highlight: false
    }
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 px-6 relative z-10 animate-fade-in-up">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-serif mb-6">Simple, transparent pricing</h2>
                    <p className="text-xl text-gray-600">Start for free, upgrade when you scale. No hidden fees.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative p-8 rounded-3xl border flex flex-col ${plan.highlight ? 'bg-off-black text-white border-off-black shadow-2xl scale-105 z-10' : 'bg-white text-off-black border-gray-200'}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-red text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-serif">{plan.price}</span>
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
                                onClick={() => alert("Payment integration coming soon! (Waiting for API Keys)")}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${plan.highlight
                                    ? 'bg-brand-red hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/30'
                                    : 'bg-gray-100 hover:bg-gray-200 text-off-black'
                                    }`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
