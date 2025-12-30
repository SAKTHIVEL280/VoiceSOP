'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Mic
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const navItems = [
        { label: 'My SOPs', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Record New', href: '/dashboard/new', icon: Mic },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    // Helper for initials
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="flex h-screen bg-warm-grey/30">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
                <div className="p-6">
                    <Link href="/" className="block mb-10">
                        <span className="text-2xl font-serif italic text-brand-red tracking-tight">VoiceSOP</span>
                    </Link>

                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-off-black text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-brand-red' : ''} />
                                    <span className={`font-medium ${isActive ? 'font-sans' : 'font-sans'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-100 flex flex-col gap-2">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-off-black hover:bg-gray-50 rounded-xl transition-all">
                        <LogOut size={20} className="rotate-180" /> {/* Rotate to point left */}
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {profile && (
                        <div className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red font-bold text-sm">
                                {getInitials(profile.full_name)}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-off-black truncate" title={profile.full_name}>
                                    {profile.full_name || 'User'}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                    {profile.subscription_tier || 'Free'} Plan
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
