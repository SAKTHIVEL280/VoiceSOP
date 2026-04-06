'use client';

import Footer from '@/components/sections/Footer';
import { useState } from 'react';
import { Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Message sent! We\'ll get back to you soon.');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to send message.');
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
            <div className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <p className="text-brand-red text-sm font-medium uppercase tracking-widest mb-3">Get in Touch</p>
                        <h1 className="text-4xl sm:text-5xl font-serif italic text-off-black mb-4">Contact Us</h1>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Have a question, feedback, or need help? We&apos;d love to hear from you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {/* Info Cards */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                            <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
                                <Mail size={22} className="text-brand-red" />
                            </div>
                            <h3 className="font-bold text-off-black mb-1">Email</h3>
                            <p className="text-gray-500 text-sm">support@voicesop.com</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                            <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={22} className="text-brand-red" />
                            </div>
                            <h3 className="font-bold text-off-black mb-1">Feedback</h3>
                            <p className="text-gray-500 text-sm">We value your suggestions</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                            <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
                                <Clock size={22} className="text-brand-red" />
                            </div>
                            <h3 className="font-bold text-off-black mb-1">Response Time</h3>
                            <p className="text-gray-500 text-sm">Within 24 hours</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm max-w-2xl mx-auto">
                        <h2 className="text-2xl font-serif italic text-off-black mb-8">Send us a message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                                <input
                                    id="contact-subject"
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                                <textarea
                                    id="contact-message"
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all resize-none"
                                    placeholder="Tell us more..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3.5 bg-off-black text-white rounded-xl font-medium hover:bg-brand-red transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
