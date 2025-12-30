'use client';

import React, { useEffect, useState } from 'react';
import { Settings, User, Bell, Shield, Wallet, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [email, setEmail] = useState('');
    const supabase = createClient();

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
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

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

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <User size={20} className="text-off-black" />
                        </div>
                        <h2 className="text-lg font-bold text-off-black">Profile Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                defaultValue={profile?.full_name || ''}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 font-sans"
                                readOnly // For now read-only unless we implement update logic
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
                        <h2 className="text-lg font-bold text-off-black">Subscription</h2>
                    </div>

                    <div className="flex items-center justify-between bg-warm-grey/10 p-4 rounded-xl">
                        <div>
                            <span className="block font-bold text-off-black capitalize">
                                {profile?.subscription_tier || 'Free'} Plan
                            </span>
                            <span className="text-sm text-gray-500">
                                {profile?.subscription_tier === 'pro'
                                    ? 'Billed monthly'
                                    : 'Upgrade to unlock more features'}
                            </span>
                        </div>
                        <button className="text-brand-red font-bold hover:underline">
                            {profile?.subscription_tier === 'pro' ? 'Manage' : 'Upgrade'}
                        </button>
                    </div>
                </section>

                {/* Coming Soon */}
                <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100 border-dashed text-center">
                    <p className="text-gray-400 italic">More settings coming soon...</p>
                </section>
            </div>
        </div>
    );
}
