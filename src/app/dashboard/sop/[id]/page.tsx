'use client';

import React, { useState, useEffect } from 'react';
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

export default function SOPViewPage() {
    const params = useParams();
    const id = params.id as string;
    const supabase = createClient();

    const [sop, setSop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
    const [hasUsedTrial, setHasUsedTrial] = useState(false);
    const [showProPreview, setShowProPreview] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedSop, setEditedSop] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSOP = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile (Plan Info)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setUserPlan(profile.subscription_tier || 'free');
                setHasUsedTrial(profile.has_used_pro_trial || false);
            }

            if (!id) return;
            const { data, error } = await supabase
                .from('sops')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setSop(data);
                setEditedSop(JSON.parse(JSON.stringify(data))); // Deep copy for editing
            }
            setLoading(false);
        };
        fetchSOP();
    }, [id]);

    const activateTrial = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setShowProPreview(true);
        setHasUsedTrial(true);

        // Update DB
        await supabase.from('profiles').update({ has_used_pro_trial: true }).eq('id', user.id);
        toast.success("Pro View activated for this session!");
    };

    // Determine if we show advanced fields
    const isPro = userPlan === 'pro' || showProPreview; // If pro user OR previewing


    const toggleStep = (id: number) => {
        setCompletedSteps(prev =>
            prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
        );
    };

    const handleExportPDF = () => {
        if (!sop) return;
        generatePDF(sop.title, sop.content);
    };

    const handleExportMD = () => {
        if (!sop) return;
        generateMarkdown(sop.title, sop.content);
    };

    const handleSave = async () => {
        setIsSaving(true);

        if (!editedSop.title.trim()) {
            toast.error("Title cannot be empty");
            setIsSaving(false);
            return;
        }

        const { error } = await supabase
            .from('sops')
            .update({
                title: editedSop.title,
                content: editedSop.content,
                updated_at: new Date().toISOString(),
                // Remove 'Draft' tag if present
                tags: sop.tags?.filter((t: string) => t !== 'Draft') || []
            })
            .eq('id', id);

        if (error) {
            console.error('Error saving SOP:', error);
            toast.error('Failed to save changes.');
        } else {
            setSop(JSON.parse(JSON.stringify(editedSop))); // Update local display state
            setIsEditing(false);
            toast.success('SOP saved successfully');
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        setEditedSop(JSON.parse(JSON.stringify(sop))); // Revert changes
        setIsEditing(false);
    };

    // Helper to update step fields
    const updateStep = (index: number, field: string, value: string) => {
        const newSop = { ...editedSop };
        if (!newSop.content.steps) newSop.content.steps = [];
        newSop.content.steps[index] = { ...newSop.content.steps[index], [field]: value };
        setEditedSop(newSop);
    };

    if (loading) {
        // ... (existing loading)
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (!sop) {
        // ... (existing not found)
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
            <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 transition-all">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
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

                <div className="flex items-center gap-3 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-brand-red text-white hover:bg-red-600 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            {sop.audio_url && (
                                <div className="mr-2">
                                    <CustomAudioPlayer src={sop.audio_url} />
                                </div>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Edit3 size={16} />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                                onClick={handleExportMD}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-off-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <FileText size={16} />
                                <span className="hidden sm:inline">Export MD</span>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-off-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Content Scrollable Area */}
            <main
                className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full"
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
                                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm leading-relaxed text-off-black focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-[80px]"
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
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm leading-relaxed text-off-black focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-[80px]"
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
                                        {!hasUsedTrial ? (
                                            <button
                                                onClick={activateTrial}
                                                className="text-xs bg-off-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                                            >
                                                Preview Pro View (1-Time)
                                            </button>
                                        ) : (
                                            <Link href="/dashboard/settings" className="text-xs text-brand-red hover:underline">Upgrade to Unlock</Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Prerequisites & Roles */}
                            <div className="space-y-6">
                                {/* PRO FEATURE: PREREQUISITES */}
                                {isPro ? (
                                    (sop.content?.prerequisites?.length > 0 || isEditing) && (
                                        <section className="bg-blue-50/30 rounded-xl p-5 border border-blue-100/50">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-3 flex items-center gap-2">
                                                <AlertTriangle size={14} /> Prerequisites <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded ml-2">PRO</span>
                                            </h3>
                                            <ul className="space-y-2">
                                                {(isEditing ? (editedSop.content?.prerequisites || []) : sop.content?.prerequisites).map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
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
                            <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-100 -z-10" />

                            {steps.map((step: any, index: number) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={step.id || index}
                                    className="relative group"
                                >
                                    <div className="flex gap-8">
                                        {/* Step Number Bubble */}
                                        <button
                                            onClick={() => !isEditing && toggleStep(step.id || index)}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border-2 transition-all flex-shrink-0 z-10 shadow-sm ${completedSteps.includes(step.id || index)
                                                ? 'bg-green-500 border-green-500 text-white shadow-green-200'
                                                : 'bg-white border-gray-100 text-gray-400 group-hover:border-brand-red group-hover:text-brand-red'
                                                }`}
                                            disabled={isEditing}
                                        >
                                            {completedSteps.includes(step.id || index) ? <CheckSquare size={24} /> : (index + 1).toString().padStart(2, '0')}
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
                                                        className="w-full text-gray-600 border border-gray-200 rounded-lg p-3 focus:border-brand-red outline-none min-h-[80px] text-sm bg-white"
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
                                                <div className={`transition-opacity duration-300 ${completedSteps.includes(step.id || index) ? 'opacity-50' : 'opacity-100'}`}>
                                                    <h3 className="text-lg font-bold text-off-black mb-3 group-hover:text-brand-red transition-colors">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                                                        {step.description}
                                                    </p>

                                                    {step.warning && (
                                                        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 mb-4">
                                                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
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
                                        {sop.content.glossary.map((term: any, i: number) => (
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
