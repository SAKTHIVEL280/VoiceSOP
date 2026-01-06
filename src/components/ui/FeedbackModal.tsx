'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, AlertTriangle, Lightbulb, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [type, setType] = useState('feedback'); // feedback, bug, other
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, subject, message }),
            });

            if (!response.ok) throw new Error('Failed to send');

            toast.success("Feedback sent! Thank you.");
            setSubject('');
            setMessage('');
            onClose();
        } catch (error) {
            toast.error("Failed to send feedback. Please try again.");
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 pointer-events-auto border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-serif italic text-off-black">Send Feedback</h2>
                                    <p className="text-sm text-gray-500">Help us improve VoiceSOP</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type Selection */}
                                <div className="flex gap-2 p-1 bg-gray-50 rounded-lg">
                                    {[
                                        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                                        { id: 'bug', label: 'Report Bug', icon: AlertTriangle },
                                        { id: 'feature', label: 'Feature', icon: Lightbulb },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = type === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setType(item.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${isSelected
                                                    ? 'bg-white text-brand-red shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <Icon size={14} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none"
                                        placeholder="Brief summary..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-[120px]"
                                        placeholder="Tell us what's on your mind..."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white hover:bg-red-600 rounded-xl font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSending ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
