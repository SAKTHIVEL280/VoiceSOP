import Footer from '@/components/sections/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service - VoiceSOP',
    description: 'VoiceSOP Terms of Service. Read our terms and conditions for using the platform.',
};

export default function TermsPage() {
    return (
        <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
            <div className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <p className="text-brand-red text-sm font-medium uppercase tracking-widest mb-3">Legal</p>
                        <h1 className="text-4xl sm:text-5xl font-serif italic text-off-black mb-4">Terms of Service</h1>
                        <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">1. Acceptance of Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                By accessing or using VoiceSOP (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you and VoiceSOP.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">2. Description of Service</h2>
                            <p className="text-gray-600 leading-relaxed">
                                VoiceSOP is an AI-powered platform that converts voice recordings into structured Standard Operating Procedures (SOPs). The Service includes audio recording, audio file upload, AI transcription, AI-generated SOP creation, and SOP management features.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">3. Account Registration</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">To use VoiceSOP, you must:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                <li>Create an account using a valid email address or OAuth provider</li>
                                <li>Provide accurate and complete information</li>
                                <li>Be at least 18 years of age</li>
                                <li>Maintain the security of your account credentials</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                You are solely responsible for all activity that occurs under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">4. Subscription Plans</h2>
                            <h3 className="text-lg font-bold text-off-black mb-2">4.1 Free Plan</h3>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                <li>Up to 3 SOP generations per month</li>
                                <li>1 stored SOP at a time</li>
                                <li>Basic SOP structure (title, purpose, roles, steps)</li>
                            </ul>
                            <h3 className="text-lg font-bold text-off-black mt-4 mb-2">4.2 Pro Plan</h3>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                <li>Unlimited SOP generations</li>
                                <li>Unlimited stored SOPs</li>
                                <li>Full SOP structure including scope, prerequisites, and glossary</li>
                                <li>Priority AI processing via Google Gemini</li>
                                <li>Team collaboration features (coming soon)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">5. Payment Terms</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                Pro subscriptions are billed on a recurring monthly basis. Payments are processed securely through Razorpay.
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1">
                                <li>Subscriptions automatically renew unless cancelled before the billing date</li>
                                <li>Prices are listed in INR and are inclusive of applicable taxes</li>
                                <li>You may cancel your subscription at any time through your account settings</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">6. User Content</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                You retain full ownership of all audio recordings, transcriptions, and SOPs you create using the Service (&quot;User Content&quot;). By using the Service, you grant us a limited license to process your content solely for the purpose of providing the Service.
                            </p>
                            <p className="text-gray-600 leading-relaxed">You agree not to upload content that:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>Violates any law or regulation</li>
                                <li>Infringes on intellectual property rights of others</li>
                                <li>Contains malicious code or harmful content</li>
                                <li>Is intended to abuse or manipulate the AI system</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">7. AI-Generated Content Disclaimer</h2>
                            <p className="text-gray-600 leading-relaxed">
                                SOPs generated by VoiceSOP are created using artificial intelligence and may contain inaccuracies. You are responsible for reviewing, verifying, and editing all AI-generated content before use. VoiceSOP does not guarantee the accuracy, completeness, or suitability of generated SOPs for any specific purpose, including safety-critical processes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">8. Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To the maximum extent permitted by law, VoiceSOP shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claim shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">9. Termination</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may suspend or terminate your account at our discretion if you violate these Terms. Upon termination, your right to use the Service ceases immediately. You may delete your account at any time, which will result in the permanent removal of all your data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">10. Governing Law</h2>
                            <p className="text-gray-600 leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">11. Changes to Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We reserve the right to modify these Terms at any time. We will notify users of material changes through the Service. Continued use after such notification constitutes acceptance of the revised Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif italic text-off-black mb-3">12. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">
                                For questions about these Terms, please reach out via{' '}
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
