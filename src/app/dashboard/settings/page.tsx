'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User, Shield, Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<{
        subscription_tier?: string;
        full_name?: string;
        free_sop_monthly_limit?: number;
        free_sop_monthly_used?: number;
        free_sop_month_key?: string;
        free_sop_storage_limit?: number;
    } | null>(null);
    const [usageCount, setUsageCount] = useState(0);
    const [email, setEmail] = useState('');
    const supabase = useMemo(() => createClient(), []);
    const [fullName, setFullName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setProfile(data);
                    setFullName(data.full_name || '');

                    const now = new Date();
                    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
                    if (data.free_sop_month_key !== monthKey && data.subscription_tier !== 'pro') {
                        await supabase
                            .from('profiles')
                            .update({ free_sop_monthly_used: 0, free_sop_month_key: monthKey })
                            .eq('id', user.id);
                        data.free_sop_monthly_used = 0;
                        data.free_sop_month_key = monthKey;
                    }

                    // Fetch Usage
                    setUsageCount(data.free_sop_monthly_used || 0);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [supabase]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        if (fullName.length > 100) {
            setMessage({ type: 'error', text: 'Name must be 100 characters or less.' });
            setIsSaving(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
            // Update local profile state
            setProfile({ ...profile, full_name: fullName });
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-brand-red" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8 border-b border-gray-100 pb-4 sm:pb-6">
                <h1 className="text-2xl sm:text-3xl font-serif italic text-off-black mb-1 sm:mb-2">Settings</h1>
                <p className="text-sm sm:text-base text-gray-500">Manage your account preferences and subscription.</p>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <User size={20} className="text-off-black" />
                            </div>
                            <h2 className="text-lg font-bold text-off-black">Profile Information</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all w-full sm:w-auto ${isSaving
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-off-black text-white hover:bg-gray-800 shadow-lg'
                                }`}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-sans transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-sans cursor-not-allowed"
                            />
                        </div>
                    </div>
                </section>

                {/* Subscription Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-red/10 rounded-lg">
                            <Wallet size={20} className="text-brand-red" />
                        </div>
                        <h2 className="text-lg font-bold text-off-black">Subscription & Usage</h2>
                    </div>

                    <div className="flex items-center justify-between bg-warm-grey/10 p-4 rounded-xl mb-6">
                        <div>
                            <span className="block font-bold text-off-black capitalize">
                                {profile?.subscription_tier || 'Free'} Plan
                            </span>
                            <span className="text-sm text-gray-500">
                                {profile?.subscription_tier === 'pro'
                                    ? 'Unlimited AI Generation'
                                    : `Basic AI Generation (${profile?.free_sop_monthly_limit || 3} tries / month, ${profile?.free_sop_storage_limit || 1} stored SOP)`}
                            </span>
                        </div>
                        {profile?.subscription_tier !== 'pro' && (
                            <Link href="/pricing" className="text-brand-red font-bold hover:underline">
                                Upgrade
                            </Link>
                        )}
                    </div>

                    {/* Usage Bar */}
                    {profile?.subscription_tier !== 'pro' && (
                        <div className="mt-2">
                            <div className="flex justify-between text-sm mb-2 font-medium text-gray-600">
                                <span>Free Usage (This Month)</span>
                                <span className={usageCount >= (profile?.free_sop_monthly_limit || 3) ? 'text-brand-red' : ''}>{usageCount} / {profile?.free_sop_monthly_limit || 3} tries</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${usageCount >= (profile?.free_sop_monthly_limit || 3) ? 'bg-brand-red' : 'bg-gray-800'}`}
                                    style={{ width: `${Math.min((usageCount / (profile?.free_sop_monthly_limit || 3)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            {usageCount >= (profile?.free_sop_monthly_limit || 3) && (
                                <p className="text-xs text-brand-red mt-2 font-medium flex items-center gap-1">
                                    <AlertTriangle size={12} /> Monthly tries used. Next reset occurs next month.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Storage cap for free plan: {profile?.free_sop_storage_limit || 1} SOP.</p>
                        </div>
                    )}
                </section>

                {/* Coming Soon */}
                <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100 border-dashed text-center">
                    <p className="text-gray-400 italic">More settings coming soon...</p>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm mt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Shield size={20} className="text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold text-red-900">Danger Zone</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="block font-bold text-red-900">Delete Account</span>
                            <span className="text-sm text-red-700/70">
                                Permanently remove all your data and SOPs.
                            </span>
                        </div>
                        <button
                            disabled={isSaving}
                            onClick={async () => {
                                if (confirm("WARNING: This will permanently delete ALL your SOPs and your account data. This cannot be undone. Are you sure?")) {
                                    setIsSaving(true);
                                    try {
                                        const response = await fetch('/api/delete-account', {
                                            method: 'DELETE',
                                        });

                                        if (!response.ok) {
                                            const data = await response.json();
                                            throw new Error(data.error || 'Deletion failed');
                                        }

                                        // Sign out and redirect after server-side deletion
                                        await supabase.auth.signOut();
                                        window.location.href = '/';
                                    } catch (err) {
                                        console.error('Error deleting account:', err);
                                        setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
                                        setIsSaving(false);
                                    }
                                }
                            }}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
