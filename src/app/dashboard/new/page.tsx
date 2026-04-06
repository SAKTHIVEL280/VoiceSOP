'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/ui/VoiceRecorder';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewSOPPage() {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkingLimit, setCheckingLimit] = useState(true);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [freeUsage, setFreeUsage] = useState<{ used: number; limit: number; storageUsed: number; storageLimit: number } | null>(null);
    const [limitMessage, setLimitMessage] = useState('');
    const supabase = useMemo(() => createClient(), []);

    const getCurrentMonthKey = () => {
        const now = new Date();
        return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    React.useEffect(() => {
        const checkLimits = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check Subscription Tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const monthKey = getCurrentMonthKey();
            let used = profile?.free_sop_monthly_used ?? 0;
            const limit = profile?.free_sop_monthly_limit ?? 3;
            const storageLimit = profile?.free_sop_storage_limit ?? 1;
            const tier = profile?.subscription_tier || 'free';

            if (tier === 'free' && profile?.free_sop_month_key !== monthKey) {
                used = 0;
                await supabase
                    .from('profiles')
                    .update({ free_sop_monthly_used: 0, free_sop_month_key: monthKey })
                    .eq('id', user.id);
            }

            const { count: storageUsed } = await supabase
                .from('sops')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            setFreeUsage({ used, limit, storageUsed: storageUsed || 0, storageLimit });

            if (tier === 'free') {
                if (used >= limit) {
                    setLimitMessage('You used all 3 free generation tries for this month.');
                    setIsLimitReached(true);
                } else if ((storageUsed || 0) >= storageLimit) {
                    setLimitMessage('Free plan allows only one stored SOP at a time. Delete your existing SOP to continue.');
                    setIsLimitReached(true);
                }
            }
            setCheckingLimit(false);
        };
        checkLimits();
    }, [supabase]);

    const handleGeneration = async (audioBlob: Blob, transcript: string) => {
        setIsGenerating(true);
        let createdSopId = null;

        try {
            let resolvedTranscript = transcript.trim();

            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 1b. Enforce free plan rules before upload (monthly tries + one stored SOP)
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier, free_sop_monthly_limit, free_sop_monthly_used, free_sop_month_key, free_sop_storage_limit')
                .eq('id', user.id)
                .single();

            if ((profile?.subscription_tier || 'free') === 'free') {
                const monthKey = getCurrentMonthKey();
                const used = profile?.free_sop_month_key === monthKey ? (profile?.free_sop_monthly_used || 0) : 0;
                const limit = profile?.free_sop_monthly_limit || 3;
                const storageLimit = profile?.free_sop_storage_limit || 1;

                const { count: storageUsed } = await supabase
                    .from('sops')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (used >= limit) {
                    throw new Error('monthly_limit');
                }
                if ((storageUsed || 0) >= storageLimit) {
                    throw new Error('storage_limit');
                }
            }

            // 1c. Auto-transcribe audio when transcript is missing/too short.
            if (resolvedTranscript.length <= 10) {
                const formData = new FormData();
                formData.append('file', audioBlob, 'input-audio.webm');

                const transcribeResponse = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData,
                });

                const transcribeData = await transcribeResponse.json();
                if (!transcribeResponse.ok) {
                    throw new Error(transcribeData.error || 'transcription_failed');
                }

                resolvedTranscript = (transcribeData.text || '').trim();
                if (resolvedTranscript.length <= 10) {
                    throw new Error('transcription_too_short');
                }
            }

            // 2. Upload Audio
            const filename = `${user.id}/${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('audio-recordings')
                .upload(filename, audioBlob);

            if (uploadError) throw uploadError;

            // 3. Store the storage path (signed URLs are generated on-the-fly when viewing)
            const storagePath = filename;

            // 4. Create SOP Record (DRAFT STATE)
            const { data: sopData, error: dbError } = await supabase
                .from('sops')
                .insert({
                    user_id: user.id,
                    title: 'Untitled SOP (Processing)',
                    audio_url: storagePath,
                    tags: ['Draft', 'Processing']
                })
                .select()
                .single();

            if (dbError) throw dbError;
            createdSopId = sopData.id;

            // 5. Call AI Generation API (30-second timeout)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            let apiResponse: Response;
            try {
                apiResponse = await fetch('/api/generate-sop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audioUrl: storagePath,
                        sopId: sopData.id,
                        transcript: resolvedTranscript,
                    }),
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                console.error("AI Generation failed:", errorData);
                throw new Error(errorData.error || "AI Generation Failed");
            }

            // 6. Redirect on Success
            toast.success("SOP Generated successfully!");
            router.push(`/dashboard/sop/${sopData.id}`);
            router.refresh();

        } catch (error: unknown) {
            console.error("Error creating SOP:", error);

            if (error instanceof Error && error.message.includes("monthly_limit")) {
                toast.error("You used all 3 free tries for this month. Upgrade to Pro.");
                setIsLimitReached(true);
            } else if (error instanceof Error && error.message.includes("storage_limit")) {
                toast.error("Free plan allows only one stored SOP. Delete existing SOP first.");
                setIsLimitReached(true);
            } else if (error instanceof Error && error.message.includes("transcription")) {
                toast.error("Could not auto-transcribe this audio. Please try a clearer file.");
            } else {
                toast.error("Generation possibly failed. Saved as Draft.");
                if (createdSopId) {
                    router.push(`/dashboard/sop/${createdSopId}`);
                }
            }
            setIsGenerating(false);
        }
    };

    if (checkingLimit) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
        );
    }

    if (isLimitReached) {
        return (
            <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
                <div className="bg-red-50 p-6 rounded-full mb-6">
                    <Loader2 size={48} className="text-brand-red" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif italic text-off-black mb-3 sm:mb-4">Free Plan Limit</h1>
                <p className="text-gray-600 max-w-md mb-8">
                    {limitMessage || 'You reached the free plan limit.'}
                </p>
                {freeUsage && (
                    <p className="text-sm text-gray-500 mb-6">Monthly tries: {freeUsage.used} / {freeUsage.limit} · Stored SOPs: {freeUsage.storageUsed} / {freeUsage.storageLimit}</p>
                )}
                <button
                    onClick={() => router.push('/#pricing')}
                    className="bg-brand-red text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition-colors shadow-lg"
                >
                    Upgrade to Pro
                </button>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-gray-500 hover:text-gray-800 text-sm font-medium"
                >
                    Go Back to Dashboard
                </button>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 size={48} className="text-brand-red" />
                </motion.div>
                <h2 className="mt-8 text-2xl font-serif italic text-off-black">Structuring your SOP...</h2>
                <p className="text-gray-500 mt-2">AI is identifying steps, checklists, and warnings.</p>

                <div className="mt-8 font-mono text-sm text-gray-400 space-y-1 text-center">
                    <motion.div animate={{ opacity: [0, 1] }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Transcribing audio...
                    </motion.div>
                    <motion.div animate={{ opacity: [0, 1] }} transition={{ delay: 1.5 }} className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Extracting key steps...
                    </motion.div>
                    <motion.div animate={{ opacity: [0, 1] }} transition={{ delay: 2.5 }} className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Formatting document...
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
            <div className="mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif italic text-off-black mb-1 sm:mb-2">Create New SOP</h1>
                <p className="text-sm sm:text-base text-gray-500">
                    Record now or upload an audio file, then provide transcript details. Our AI will handle formatting, numbering, and structure.
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <VoiceRecorder onComplete={handleGeneration} />
            </div>
        </div>
    );
}
