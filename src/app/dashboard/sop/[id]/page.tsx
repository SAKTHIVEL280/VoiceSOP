'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Download,
    Edit3,
    ArrowLeft,
    CheckSquare,
    AlertTriangle,
    Clock,
    Share2,
    FileText,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import CustomAudioPlayer from '@/components/ui/CustomAudioPlayer';

import { generatePDF } from '@/utils/pdfGenerator';
import { generateMarkdown } from '@/utils/markdownGenerator';

interface SOPContent {
    purpose?: string;
    scope?: string;
    detailed_context?: string;
    prerequisites?: string[];
    steps?: { title: string; description: string; warnings?: string; warning?: string; checklist?: string[] }[];
    glossary?: { term: string; definition: string }[];
    warnings?: string[];
    checklist?: string[];
    [key: string]: unknown;
}

interface SOP {
    id: string;
    title: string;
    content: SOPContent;
    audio_url?: string;
    tags?: string[];
    is_favorite?: boolean;
    created_at: string;
    updated_at?: string;
    [key: string]: unknown;
}

export default function SOPViewPage() {
    const params = useParams();
    const id = params.id as string;
    const supabase = useMemo(() => createClient(), []);

    const [sop, setSop] = useState<SOP | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
    const [audioSignedUrl, setAudioSignedUrl] = useState<string | null>(null);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedSop, setEditedSop] = useState<SOP | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSOP = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile (Plan Info)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setUserPlan(profile.subscription_tier || 'free');
            }

            if (!id) return;
            const { data } = await supabase
                .from('sops')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSop(data as SOP);
                setEditedSop(JSON.parse(JSON.stringify(data)) as SOP);

                // Resolve audio URL: new SOPs store a storage path, old ones may have full URLs
                if (data.audio_url) {
                    const isFullUrl = data.audio_url.startsWith('http');
                    if (isFullUrl) {
                        // Legacy: try to extract path and create signed URL
                        try {
                            const url = new URL(data.audio_url);
                            const parts = url.pathname.split('/audio-recordings/');
                            if (parts[1]) {
                                const { data: signed } = await supabase.storage
                                    .from('audio-recordings')
                                    .createSignedUrl(parts[1], 3600);
                                setAudioSignedUrl(signed?.signedUrl || data.audio_url);
                            } else {
                                setAudioSignedUrl(data.audio_url);
                            }
                        } catch {
                            setAudioSignedUrl(data.audio_url);
                        }
                    } else {
                        // New format: storage path directly
                        const { data: signed } = await supabase.storage
                            .from('audio-recordings')
                            .createSignedUrl(data.audio_url, 3600);
                        setAudioSignedUrl(signed?.signedUrl || null);
                    }
                }
            }
            setLoading(false);
        };
        fetchSOP();
    }, [id, supabase]);

    // Determine if we show advanced fields
    const isPro = userPlan === 'pro';


    const toggleStep = (id: number) => {
        setCompletedSteps(prev =>
            prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
        );
    };

    const handleExportPDF = () => {
        if (!sop) return;
        generatePDF(sop.title, sop.content as Parameters<typeof generatePDF>[1]);
    };

    const handleExportMD = () => {
        if (!sop) return;
        generateMarkdown(sop.title, sop.content as Parameters<typeof generateMarkdown>[1]);
    };

    const handleSave = async () => {
        if (!editedSop || !sop) return;
        setIsSaving(true);

        if (!editedSop.title.trim()) {
            toast.error("Title cannot be empty");
            setIsSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/save-sop', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: editedSop.title,
                    content: editedSop.content,
                    tags: sop.tags,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to save changes.');
            } else {
                setSop(JSON.parse(JSON.stringify(editedSop)));
                setIsEditing(false);
                toast.success('SOP saved successfully');
            }
        } catch {
            toast.error('Failed to save changes.');
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        if (!sop) return;
        setEditedSop(JSON.parse(JSON.stringify(sop)));
        setIsEditing(false);
    };

    // Helper to update step fields
    const updateStep = (index: number, field: string, value: string) => {
        if (!editedSop) return;
        const newSop = { ...editedSop, content: { ...editedSop.content } };
        if (!newSop.content.steps) newSop.content.steps = [];
        newSop.content.steps[index] = { ...newSop.content.steps[index], [field]: value };
        setEditedSop(newSop as SOP);
    };

    if (loading) {
        // ... (existing loading)
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (!sop || !editedSop) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-400">SOP Not Found</h1>
                <Link href="/dashboard" className="mt-4 text-brand-red hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    const isProcessing = !sop.content;
    const steps = isEditing ? (editedSop.content?.steps || []) : (sop.content?.steps || []);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header / Actions - Increased z-index to 50 to prevent overlap issues */}
            <header className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50 transition-all">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1 min-w-0"> {/* min-w-0 ensures truncation works in flex child */}
                        {sop.tags?.includes('Draft') && (
                            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded-full border border-yellow-200">
                                <Loader2 size={12} className="animate-spin" />
                                Draft / Processing
                            </div>
                        )}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedSop.title}
                                onChange={(e) => setEditedSop({ ...editedSop, title: e.target.value })}
                                className="text-xl font-bold text-off-black border-b border-gray-300 focus:border-brand-red focus:outline-none bg-transparent w-full"
                            />
                        ) : (
                            <h1 className="text-xl font-bold text-off-black truncate pr-4">{sop.title}</h1>
                        )}

                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(sop.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-2 bg-brand-red text-white hover:bg-red-600 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <>
                                {audioSignedUrl && (
                                    <div className="hidden md:block mr-1">
                                        <CustomAudioPlayer src={audioSignedUrl} />
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Edit3 size={16} />
                                    <span className="hidden md:inline">Edit</span>
                                </button>
                                <button
                                    onClick={handleExportMD}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-off-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <FileText size={16} />
                                    <span className="hidden md:inline">MD</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-off-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Download size={16} />
                                    <span className="hidden md:inline">PDF</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Audio player on its own row on mobile */}
                {!isEditing && audioSignedUrl && (
                    <div className="mt-3 md:hidden">
                        <CustomAudioPlayer src={audioSignedUrl} />
                    </div>
                )}
            </header>

            {/* Content Scrollable Area */}
            <main
                className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full"
                data-lenis-prevent // Critical: Tells Lenis to let this element scroll naturally
            >
                {isProcessing ? (
                    // ... (existing processing state)
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mb-6"></div>
                        <h2 className="text-2xl font-serif italic text-off-black mb-2">Processing Audio...</h2>
                        <p className="text-gray-500 max-w-md">
                            Our AI is currently listening to your recording and extracting the steps.
                            This usually takes about a minute.
                        </p>
                        <p className="text-xs text-gray-400 mt-8">Refresh the page to check again.</p>
                    </div>
                ) : (
                    <>
                        {/* Document Meta Section (Scope, Prerequisites, Roles) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {/* Purpose & Scope */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                        <FileText size={14} /> Purpose
                                    </h3>
                                    {isEditing ? (
                                        <textarea
                                            value={editedSop.content?.purpose || ''}
                                            onChange={(e) => setEditedSop({
                                                ...editedSop,
                                                content: { ...editedSop.content, purpose: e.target.value }
                                            })}
                                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm leading-relaxed text-off-black focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-20"
                                        />
                                    ) : (
                                        <p className="text-sm leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                            {sop.content?.purpose}
                                        </p>
                                    )}
                                </section>

                                {/* PRO FEATURE: SCOPE */}
                                {isPro ? (
                                    (sop.content?.scope || isEditing) && (
                                        <section>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                                <Share2 size={14} /> Scope <span className="bg-brand-red/10 text-brand-red text-[10px] px-1.5 py-0.5 rounded ml-2">PRO</span>
                                            </h3>
                                            {isEditing ? (
                                                <textarea
                                                    value={editedSop.content?.scope || ''}
                                                    onChange={(e) => setEditedSop({
                                                        ...editedSop,
                                                        content: { ...editedSop.content, scope: e.target.value }
                                                    })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm leading-relaxed text-off-black focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-20"
                                                    placeholder="Define the scope of this SOP..."
                                                />
                                            ) : (
                                                <p className="text-sm leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                                    {sop.content?.scope}
                                                </p>
                                            )}
                                        </section>
                                    )
                                ) : (
                                    <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50/50">
                                        <p className="text-xs text-gray-500 mb-2 font-bold">Scope & Detailed Context (Pro)</p>
                                        <Link href="/dashboard/settings" className="text-xs text-brand-red hover:underline">Upgrade to Unlock</Link>
                                    </div>
                                )}
                            </div>

                            {/* Prerequisites & Roles */}
                            <div className="space-y-6">
                                {/* PRO FEATURE: PREREQUISITES */}
                                {isPro ? (
                                    ((sop.content?.prerequisites?.length ?? 0) > 0 || isEditing) && (
                                        <section className="bg-blue-50/30 rounded-xl p-5 border border-blue-100/50">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-3 flex items-center gap-2">
                                                <AlertTriangle size={14} /> Prerequisites <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded ml-2">PRO</span>
                                            </h3>
                                            <ul className="space-y-2">
                                                {(isEditing ? (editedSop.content?.prerequisites || []) : (sop.content?.prerequisites || [])).map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                        {isEditing ? (
                                                            <input
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const newPrereqs = [...(editedSop.content.prerequisites || [])];
                                                                    newPrereqs[i] = e.target.value;
                                                                    setEditedSop({ ...editedSop, content: { ...editedSop.content, prerequisites: newPrereqs } });
                                                                }}
                                                                className="bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none w-full"
                                                            />
                                                        ) : item}
                                                    </li>
                                                ))}
                                                {isEditing && (
                                                    <button
                                                        onClick={() => setEditedSop({ ...editedSop, content: { ...editedSop.content, prerequisites: [...(editedSop.content.prerequisites || []), ''] } })}
                                                        className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1"
                                                    >
                                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">+</div> Add Prerequisite
                                                    </button>
                                                )}
                                            </ul>
                                        </section>
                                    )
                                ) : (
                                    <div className="border border-dashed border-blue-100 rounded-lg p-4 text-center bg-blue-50/30 h-full flex flex-col items-center justify-center">
                                        <p className="text-xs text-blue-400 mb-2 font-bold">Prerequisites & Roles (Pro)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 my-8" />

                        {/* Steps List */}
                        <div className="space-y-12 relative max-w-3xl mx-auto">
                            {/* Vertical Connecting Line */}
                            <div className="absolute left-6.75 top-6 bottom-6 w-0.5 bg-gray-100 -z-10" />

                            {steps.map((step, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={index}
                                    className="relative group"
                                >
                                    <div className="flex gap-4 md:gap-8">
                                        {/* Step Number Bubble */}
                                        <button
                                            onClick={() => !isEditing && toggleStep(index)}
                                            className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-sm md:text-lg border-2 transition-all shrink-0 z-10 shadow-sm ${completedSteps.includes(index)
                                                ? 'bg-green-500 border-green-500 text-white shadow-green-200'
                                                : 'bg-white border-gray-100 text-gray-400 group-hover:border-brand-red group-hover:text-brand-red'
                                                }`}
                                            disabled={isEditing}
                                        >
                                            {completedSteps.includes(index) ? <CheckSquare size={24} /> : (index + 1).toString().padStart(2, '0')}
                                        </button>

                                        <div className="flex-1 pt-1">
                                            {isEditing ? (
                                                <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={step.title}
                                                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                                                        className="w-full font-bold text-lg text-off-black border-b border-gray-200 focus:border-brand-red outline-none pb-2 bg-transparent"
                                                        placeholder="Step Title"
                                                    />
                                                    <textarea
                                                        value={step.description}
                                                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                                                        className="w-full text-gray-600 border border-gray-200 rounded-lg p-3 focus:border-brand-red outline-none min-h-20 text-sm bg-white"
                                                        placeholder="Step Description"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={step.warning || ''}
                                                        onChange={(e) => updateStep(index, 'warning', e.target.value)}
                                                        className="w-full text-sm text-red-600 border border-red-100 bg-red-50 rounded-lg p-2 focus:border-red-300 outline-none"
                                                        placeholder="Add Warning (Optional)"
                                                    />
                                                </div>
                                            ) : (
                                                <div className={`transition-opacity duration-300 ${completedSteps.includes(index) ? 'opacity-50' : 'opacity-100'}`}>
                                                    <h3 className="text-lg font-bold text-off-black mb-3 group-hover:text-brand-red transition-colors">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                                                        {step.description}
                                                    </p>

                                                    {step.warning && (
                                                        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 mb-4">
                                                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                                            <span className="font-medium">{step.warning}</span>
                                                        </div>
                                                    )}

                                                    {step.checklist && step.checklist.length > 0 && (
                                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Checklist</h4>
                                                            <div className="space-y-3">
                                                                {step.checklist.map((item: string, i: number) => (
                                                                    <label key={i} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer group/check">
                                                                        <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red/20" />
                                                                        <span className="group-hover/check:text-gray-900 transition-colors">{item}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Glossary Section */}
                        {isPro && sop.content?.glossary && sop.content.glossary.length > 0 && (
                            <>
                                <div className="border-t border-gray-100 my-12" />
                                <section className="max-w-3xl mx-auto bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                                        <FileText size={16} /> Glossary <span className="bg-brand-red/10 text-brand-red text-[10px] px-1.5 py-0.5 rounded ml-2">PRO</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {sop.content.glossary.map((term, i) => (
                                            <div key={i}>
                                                <dt className="font-bold text-off-black text-sm mb-1">{term.term}</dt>
                                                <dd className="text-sm text-gray-600 leading-relaxed">{term.definition}</dd>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
