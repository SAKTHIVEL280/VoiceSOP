'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Mic
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import FeedbackModal from '@/components/ui/FeedbackModal';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const supabase = createClient();

    const router = useRouter(); // Ensure useRouter is imported from 'next/navigation' at the top if not already

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Only fetch profile if we have a user
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(data);
        };

        checkUser();

        // Subscribe to auth changes to auto-redirect on logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/login');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
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
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col justify-between">
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
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-off-black text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        className={`${isActive ? 'text-brand-red' : ''} transition-transform duration-300 ${item.icon === Mic
                                                ? 'group-hover:scale-110 group-hover:text-brand-red'
                                                : 'group-hover:rotate-90'
                                            }`}
                                    />
                                    <span className={`font-medium ${isActive ? 'font-sans' : 'font-sans'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all w-full text-left"
                    >
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
                            <Settings size={20} className="rotate-12" /> {/* Or MessageSquare if imported */}
                        </div>

                        <span className="font-medium">Feedback / Bugs</span>
                    </button>

                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-off-black hover:bg-gray-50 rounded-xl transition-all">
                        <LogOut size={20} className="rotate-180" />
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {profile && (
                        <Link
                            href="/dashboard/settings"
                            className="mt-6 flex items-center gap-3 p-3 bg-warm-grey/50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-off-black text-white flex items-center justify-center font-bold text-sm">
                                {getInitials(profile.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-off-black truncate">
                                    {profile.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate capitalize">
                                    {profile.subscription_tier || 'Free'} Plan
                                </p>
                            </div>
                            <Settings size={16} className="text-gray-400" />
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
    );
}
