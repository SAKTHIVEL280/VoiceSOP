import Footer from '@/components/sections/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund & Cancellation Policy - VoiceSOP',
    description: 'VoiceSOP Refund and Cancellation Policy. Understand our refund process for subscriptions.',
};

export default function RefundPage() {
    return (
        <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
            <div className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <p className="text-brand-red text-sm font-medium uppercase tracking-widest mb-3">Legal</p>
                        <h1 className="text-4xl sm:text-5xl font-serif italic text-off-black mb-4">Refund &amp; Cancellation Policy</h1>
                        <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">1. Overview</h2>
                            <p className="text-gray-600 leading-relaxed">
                                This Refund and Cancellation Policy outlines the terms for subscription cancellations and refund requests for VoiceSOP&apos;s paid plans. We strive to ensure complete customer satisfaction and handle all refund requests fairly and promptly.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">2. Free Plan</h2>
                            <p className="text-gray-600 leading-relaxed">
                                The Free plan requires no payment and can be used indefinitely within its usage limits. No refund policy applies to the Free plan.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">3. Pro Plan Cancellation</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">You may cancel your Pro subscription at any time:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Navigate to <strong>Dashboard → Settings</strong> and click &quot;Cancel Subscription&quot;</li>
                                <li>Your Pro features will remain active until the end of your current billing period</li>
                                <li>After the billing period ends, your account will automatically revert to the Free plan</li>
                                <li>Your existing SOPs will remain accessible, but you may need to delete SOPs to comply with Free plan storage limits</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">4. Refund Eligibility</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">Refunds may be issued in the following circumstances:</p>

                            <div className="bg-white rounded-xl p-6 border border-gray-100 mb-4">
                                <h3 className="text-lg font-bold text-off-black mb-2">✓ Eligible for Refund</h3>
                                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                    <li>Duplicate or accidental charges</li>
                                    <li>Service was completely unavailable for an extended period during your billing cycle</li>
                                    <li>You were charged after cancelling your subscription</li>
                                    <li>First-time subscribers within 7 days of purchase who have not extensively used the Service</li>
                                </ul>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-off-black mb-2">✗ Not Eligible for Refund</h3>
                                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                    <li>Change of mind after the 7-day window</li>
                                    <li>Dissatisfaction with AI-generated output quality (AI results vary by input quality)</li>
                                    <li>Failure to cancel before automatic renewal</li>
                                    <li>Account suspension due to Terms of Service violation</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">5. How to Request a Refund</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">To request a refund:</p>
                            <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                                <li>Visit our <Link href="/contact" className="text-brand-red hover:underline">Contact Page</Link></li>
                                <li>Include your registered email address and the reason for your refund request</li>
                                <li>Our team will review your request within 3–5 business days</li>
                                <li>Approved refunds will be processed to your original payment method within 5–10 business days</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">6. Refund Processing</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Approved refunds are processed via Razorpay back to your original payment method. The timeline for the refund to appear in your account depends on your bank or payment provider, but typically takes 5–10 business days after approval.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">7. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">
                                For any questions regarding refunds or cancellations, please reach out via{' '}
                                <Link href="/contact" className="text-brand-red hover:underline">our contact page</Link>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
