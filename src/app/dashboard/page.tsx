'use client';


import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock, Trash2, Edit3, Search, Tag } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import HeroButton from '@/components/ui/HeroButton';
import CustomSortDropdown from '@/components/ui/CustomSortDropdown';

interface SOP {
    id: number;
    title: string;
    date: string;
    created_at: string;
    steps: number;
    duration: string;
    tags: string[];
}

export default function DashboardPage() {
    const [sops, setSops] = useState<SOP[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const supabase = createClient();

    useEffect(() => {
        const fetchSOPs = async () => {
            const { data, error } = await supabase
                .from('sops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching SOPs:', error);
                toast.error('Failed to load SOPs');
            }

            if (data) {
                const formattedSops = data.map((sop: any) => ({
                    id: sop.id,
                    title: sop.title,
                    date: new Date(sop.created_at).toLocaleDateString(),
                    created_at: sop.created_at,
                    steps: sop.content?.steps?.length || 0,
                    duration: '0:00', // Placeholder calculation
                    tags: sop.tags || []
                }));
                setSops(formattedSops);
            }
            setLoading(false);
        };

        fetchSOPs();

        // Realtime Subscription
        const channel = supabase
            .channel('sops_dashboard_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sops',
                },
                (payload) => {
                    fetchSOPs();
                }
            )
            .subscribe();

        // Focus Revalidation (Refetch when user comes back to tab)
        const handleFocus = () => {
            fetchSOPs();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleDelete = async (id: number) => {
        // Simple confirm for now, better to use a modal but this is still native.
        // For a true "non-native" feel we'd need a Dialog component. To save time/complexity, 
        // we will stick to a toast-based "Delete" OR assume user is sure if they clicked trash. 
        // Let's rely on standard confirm but use toast for success.
        if (!confirm('Are you sure you want to delete this SOP?')) return;

        // Optimistic update
        setSops(prev => prev.filter(s => s.id !== id));
        toast.promise(
            (async () => {
                const { error } = await supabase
                    .from('sops')
                    .delete() // Hard Delete: Permanently remove row
                    .eq('id', id);
                if (error) throw error;
            })(),
            {
                loading: 'Deleting...',
                success: 'SOP deleted permanently',
                error: 'Failed to delete SOP'
            }
        );
    };

    const filteredSops = sops
        .filter(sop => sop.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
            return 0;
        });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif italic text-off-black mb-2">My SOPs</h1>
                    <p className="text-gray-500">Manage and organize your standard operating procedures.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Usage Badge (Free Tier Only) */}
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Free Plan</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <span className={`${sops.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length >= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                                {sops.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-400">3</span>
                            <span className="text-gray-400 text-xs ml-0.5">SOPs</span>
                        </div>
                    </div>

                    <HeroButton
                        href="/dashboard/new"
                        text="New SOP"
                        className="px-6 py-3 min-w-[160px]"
                    />
                </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search SOPs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all shadow-sm"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    )}
                </div>
                <div className="w-full md:w-48">
                    <CustomSortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: 'newest', label: 'Newest First' },
                            { value: 'oldest', label: 'Oldest First' },
                            { value: 'alphabetical', label: 'Alphabetical' }
                        ]}
                    />
                </div>
            </div>


            {/* Empty State Logic */}
            {
                !loading && sops.length === 0 && !searchTerm && (
                    <EmptyState />
                )
            }

            {/* Grid only shows if we have SOPs or if we are searching (and finding 0) */}
            {
                (sops.length > 0 || searchTerm) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create New Card (Always Visible unless completely empty state shown?) 
                        Actually, keeps "Create New" card even if filtering?
                        If searching and 0 results, we show "No SOPs match".
                        If 0 SOPs total (fresh user), we show EmptyState.
                    */}

                        {/* Create New Card (Only show if NOT searching, or maybe always?)
                        Let's show it always unless it's the pure EmptyState
                    */}
                        {!searchTerm && sops.length > 0 && (
                            <Link
                                href="/dashboard/new"
                                className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-12 text-gray-400 hover:border-brand-red hover:text-brand-red hover:bg-red-50/50 transition-all duration-300 group cursor-pointer h-[280px]"
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-brand-red/10 flex items-center justify-center mb-4 transition-colors">
                                    <Plus size={32} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="font-bold text-lg">Create New SOP</span>
                                <span className="text-sm mt-2 opacity-70">Record voice to generate</span>
                            </Link>
                        )}

                        {/* Real SOP Cards */}
                        {filteredSops.map((sop) => (
                            <div key={sop.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between h-[280px] group cursor-pointer relative overflow-hidden">
                                {/* Card Hover Border Effect */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-brand-red transition-colors duration-300"></div>

                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-warm-grey/10 rounded-lg text-off-black">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex gap-1">
                                            <Link
                                                href={`/dashboard/sop/${sop.id}`}
                                                className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-colors z-20"
                                                title="Edit SOP"
                                            >
                                                <Edit3 size={18} />
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault(); // Prevent Link navigation
                                                    handleDelete(sop.id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors z-20"
                                                title="Delete SOP"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <Link href={`/dashboard/sop/${sop.id}`} className="block">
                                        <h3 className="text-xl font-bold text-off-black mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
                                            {sop.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 mb-3">{sop.date}</p>

                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        {sop.tags.slice(0, 2).map((tag, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center gap-1">
                                                {tag === 'Draft' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                                                {tag}
                                            </span>
                                        ))}
                                        {sop.tags.length > 2 && <span className="text-xs text-gray-400">+{sop.tags.length - 2}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4 mt-4">
                                    <span className="flex items-center gap-1">
                                        <span className="font-bold">{sop.steps}</span> steps
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {sop.duration}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            {
                filteredSops.length === 0 && sops.length > 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No SOPs match your search.
                    </div>
                )
            }
        </div >
    );
}
