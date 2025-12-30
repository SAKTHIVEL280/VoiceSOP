'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock, Trash2, Edit3, Search } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface SOP {
    id: number;
    title: string;
    date: string;
    created_at: string;
    steps: number;
    duration: string;
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
                .order('created_at', { ascending: false })
                .eq('is_deleted', false);

            if (data) {
                const formattedSops = data.map((sop: any) => ({
                    id: sop.id,
                    title: sop.title,
                    date: new Date(sop.created_at).toLocaleDateString(),
                    created_at: sop.created_at,
                    steps: sop.content?.steps?.length || 0,
                    duration: '0:00' // Placeholder calculation
                }));
                setSops(formattedSops);
            }
            setLoading(false);
        };
        fetchSOPs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this SOP?')) return;

        // Optimistic update
        setSops(prev => prev.filter(s => s.id !== id));

        const { error } = await supabase
            .from('sops')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) {
            console.error('Error deleting SOP:', error);
            alert('Failed to delete SOP');
            // In a real app, revert optimistic update here
        }
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
                <div className="flex gap-4">
                    <Link
                        href="/dashboard/new"
                        className="bg-brand-red text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                    >
                        <Plus size={20} />
                        New SOP
                    </Link>
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
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all shadow-sm bg-white appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="alphabetical">Alphabetical</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card (Always Visible) */}
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
                            <p className="text-sm text-gray-500">{sop.date}</p>
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
            {filteredSops.length === 0 && sops.length > 0 && (
                <div className="text-center py-12 text-gray-500">
                    No SOPs match your search.
                </div>
            )}
        </div>
    );
}
