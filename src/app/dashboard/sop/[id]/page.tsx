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
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

import { generateSOPPDF } from '@/utils/pdfGenerator';
import { generateSOPMarkdown } from '@/utils/markdownGenerator';

export default function SOPViewPage() {
    const params = useParams();
    const id = params.id as string;
    const supabase = createClient();

    const [sop, setSop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedSop, setEditedSop] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSOP = async () => {
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

    const toggleStep = (id: number) => {
        setCompletedSteps(prev =>
            prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        if (!sop) return;
        generateSOPPDF(sop);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from('sops')
            .update({
                title: editedSop.title,
                content: editedSop.content,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error saving SOP:', error);
            alert('Failed to save changes.');
        } else {
            setSop(JSON.parse(JSON.stringify(editedSop))); // Update local display state
            setIsEditing(false);
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
            {/* Header / Actions */}
            <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 transition-all">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedSop.title}
                                onChange={(e) => setEditedSop({ ...editedSop, title: e.target.value })}
                                className="text-xl font-bold text-off-black border-b border-gray-300 focus:border-brand-red focus:outline-none bg-transparent w-full"
                            />
                        ) : (
                            <h1 className="text-xl font-bold text-off-black">{sop.title}</h1>
                        )}

                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(sop.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
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
                                <audio controls src={sop.audio_url} className="h-10 w-64 mr-4 rounded-full bg-gray-50 text-xs" />
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Edit3 size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => sop && generateSOPMarkdown(sop)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-off-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <FileText size={16} />
                                Export MD
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-off-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Download size={16} />
                                Export PDF
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Content Scrollable Area */}
            <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
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
                        {/* Purpose Card */}
                        <div className="bg-warm-grey/10 rounded-xl p-6 mb-8 border border-warm-grey/20">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                <FileText size={16} /> Purpose
                            </h2>
                            {isEditing ? (
                                <textarea
                                    value={editedSop.content?.purpose || ''}
                                    onChange={(e) => setEditedSop({
                                        ...editedSop,
                                        content: { ...editedSop.content, purpose: e.target.value }
                                    })}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-lg text-off-black leading-relaxed focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none min-h-[100px]"
                                />
                            ) : (
                                <p className="text-lg text-off-black leading-relaxed">
                                    {sop.content?.purpose}
                                </p>
                            )}
                        </div>

                        {/* Steps List */}
                        <div className="space-y-8 relative">
                            {/* Vertical Connecting Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10" />

                            {steps.map((step: any, index: number) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={step.id || index}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 relative group"
                                >
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => !isEditing && toggleStep(step.id || index)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all flex-shrink-0 z-10 ${completedSteps.includes(step.id || index)
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'bg-white border-off-black text-off-black group-hover:bg-off-black group-hover:text-white'
                                                }`}
                                            disabled={isEditing}
                                        >
                                            {completedSteps.includes(step.id || index) ? <CheckSquare size={18} /> : index + 1}
                                        </button>

                                        <div className="flex-1 pt-1">
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={step.title}
                                                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                                                        className="w-full font-bold text-xl text-off-black border-b border-gray-200 focus:border-brand-red outline-none pb-1"
                                                        placeholder="Step Title"
                                                    />
                                                    <textarea
                                                        value={step.description}
                                                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                                                        className="w-full text-gray-600 border border-gray-200 rounded-lg p-2 focus:border-brand-red outline-none min-h-[80px]"
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
                                                <>
                                                    <h3 className={`text-xl font-bold mb-2 transition-colors ${completedSteps.includes(step.id || index) ? 'text-gray-400 line-through' : 'text-off-black'}`}>
                                                        {step.title}
                                                    </h3>
                                                    <p className={`text-gray-600 leading-relaxed mb-4 ${completedSteps.includes(step.id || index) ? 'opacity-50' : ''}`}>
                                                        {step.description}
                                                    </p>

                                                    {step.warning && (
                                                        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                                                            <span className="font-medium">{step.warning}</span>
                                                        </div>
                                                    )}
                                                    {step.link && (
                                                        <a href={step.link.url} className="inline-flex items-center gap-2 text-brand-red font-medium hover:underline text-sm mt-3">
                                                            <Share2 size={14} />
                                                            {step.link.text}
                                                        </a>
                                                    )}
                                                    {step.checklist && (
                                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-3">
                                                            {step.checklist.map((item: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                                                    <div className="w-4 h-4 border border-gray-300 rounded bg-white" />
                                                                    {item}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
