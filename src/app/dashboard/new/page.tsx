'use client';

import React, { useState } from 'react';
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
    const supabase = createClient();

    React.useEffect(() => {
        const checkLimits = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check Subscription Tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            // Check SOP Count (this month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('sops')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth.toISOString());

            const limit = 3;
            const tier = profile?.subscription_tier || 'free';

            if (tier === 'free' && (count || 0) >= limit) {
                setIsLimitReached(true);
            }
            setCheckingLimit(false);
        };
        checkLimits();
    }, []);

    const handleGeneration = async (audioBlob: Blob, transcript: string) => {
        setIsGenerating(true);
        let createdSopId = null;

        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 2. Upload Audio
            const filename = `${user.id}/${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('audio-recordings')
                .upload(filename, audioBlob);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('audio-recordings')
                .getPublicUrl(filename);

            // 4. Create SOP Record (DRAFT STATE)
            const { data: sopData, error: dbError } = await supabase
                .from('sops')
                .insert({
                    user_id: user.id,
                    title: 'Untitled SOP (Processing)',
                    audio_url: publicUrl,
                    tags: ['Draft', 'Processing']
                })
                .select()
                .single();

            if (dbError) throw dbError;
            createdSopId = sopData.id;

            // 5. Call AI Generation API
            const apiResponse = await fetch('/api/generate-sop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioUrl: publicUrl,
                    sopId: sopData.id,
                    transcript: transcript
                }),
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                console.error("AI Generation failed:", errorData);
                throw new Error(errorData.error || "AI Generation Failed");
            }

            // 6. Redirect on Success
            toast.success("SOP Generated successfully!");
            router.push(`/dashboard/sop/${sopData.id}`);
            router.refresh();

        } catch (error: any) {
            console.error("Error creating SOP:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.log("Raw Error:", error);

            if (error.message.includes("quota")) {
                toast.error("Monthly quota reached. Upgrade to Pro!");
                setIsLimitReached(true);
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
            <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
                <div className="bg-red-50 p-6 rounded-full mb-6">
                    <Loader2 size={48} className="text-brand-red" />
                </div>
                <h1 className="text-3xl font-serif italic text-off-black mb-4">Monthly Limit Reached</h1>
                <p className="text-gray-600 max-w-md mb-8">
                    You have reached the limit of 3 SOPs for this month on the Free plan.
                    Upgrade to Pro for unlimited SOPs.
                </p>
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
        <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-3xl font-serif italic text-off-black mb-2">Record New SOP</h1>
                <p className="text-gray-500">
                    Explain the process clearly. Our AI will handle the formatting, numbering, and structure.
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <VoiceRecorder onComplete={handleGeneration} />
            </div>
        </div>
    );
}
