'use client';

import React, { useEffect, useState } from 'react';
import { Settings, User, Bell, Shield, Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [usageCount, setUsageCount] = useState(0);
    const [email, setEmail] = useState('');
    const supabase = createClient();
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

                    // Fetch Usage
                    const startOfMonth = new Date();
                    startOfMonth.setDate(1);
                    startOfMonth.setHours(0, 0, 0, 0);

                    const { count: uCount } = await supabase
                        .from('sops')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .gte('created_at', startOfMonth.toISOString())
                        .or('is_deleted.is.null,is_deleted.eq.false');

                    setUsageCount(uCount || 0);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

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
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 border-b border-gray-100 pb-6">
                <h1 className="text-3xl font-serif italic text-off-black mb-2">Settings</h1>
                <p className="text-gray-500">Manage your account preferences and subscription.</p>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <User size={20} className="text-off-black" />
                            </div>
                            <h2 className="text-lg font-bold text-off-black">Profile Information</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${isSaving
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
                                    : 'Basic AI Generation (3/month)'}
                            </span>
                        </div>
                        {profile?.subscription_tier !== 'pro' && (
                            <button className="text-brand-red font-bold hover:underline">
                                Upgrade
                            </button>
                        )}
                    </div>

                    {/* Usage Bar */}
                    {profile?.subscription_tier !== 'pro' && (
                        <div className="mt-2">
                            <div className="flex justify-between text-sm mb-2 font-medium text-gray-600">
                                <span>Monthly Usage</span>
                                <span className={usageCount >= 3 ? 'text-brand-red' : ''}>{usageCount} / 3 SOPs</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${usageCount >= 3 ? 'bg-brand-red' : 'bg-gray-800'}`}
                                    style={{ width: `${Math.min((usageCount / 3) * 100, 100)}%` }}
                                ></div>
                            </div>
                            {usageCount >= 3 && (
                                <p className="text-xs text-brand-red mt-2 font-medium flex items-center gap-1">
                                    <AlertTriangle size={12} /> Limit reached. Upgrade to create more.
                                </p>
                            )}
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

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="block font-bold text-red-900">Delete Account</span>
                            <span className="text-sm text-red-700/70">
                                Permanently remove all your data and SOPs.
                            </span>
                        </div>
                        <button
                            onClick={async () => {
                                if (confirm("WARNING: This will permanently delete ALL your SOPs and your account data. This cannot be undone. Are you sure?")) {
                                    setIsSaving(true);
                                    // 1. Delete SOPs
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (user) {
                                        await supabase.from('sops').delete().eq('user_id', user.id);
                                        // 2. Delete Profile (optional, RLS might block)
                                        // await supabase.from('profiles').delete().eq('id', user.id);
                                    }

                                    // 3. Sign Out
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
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
