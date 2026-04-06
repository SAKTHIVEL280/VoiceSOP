'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Mic,
    Menu,
    X
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import FeedbackModal from '@/components/ui/FeedbackModal';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [profile, setProfile] = useState<Record<string, string> | null>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

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
                router.push('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

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
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <Link href="/" className="block">
                    <span className="text-xl font-serif italic text-brand-red tracking-tight">VoiceSOP</span>
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar — desktop: always visible, mobile: slide-over */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 bg-white border-r border-gray-200 flex-col justify-between
                transform transition-transform duration-200 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'}
                md:translate-x-0
            `}>
                <div className="p-6 pt-16 md:pt-6">
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
                                    onClick={() => setMobileMenuOpen(false)}
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
                        onClick={() => { setMobileMenuOpen(false); setIsFeedbackOpen(true); }}
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all w-full text-left"
                    >
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
                            <Settings size={20} className="rotate-12" /> {/* Or MessageSquare if imported */}
                        </div>

                        <span className="font-medium">Feedback / Bugs</span>
                    </button>

                    <button
                        onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all w-full text-left"
                    >
                        <LogOut size={20} className="rotate-180" />
                        <span className="font-medium">Sign Out</span>
                    </button>

                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-off-black hover:bg-gray-50 rounded-xl transition-all">
                        <span className="w-5" />
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {profile && (
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setMobileMenuOpen(false)}
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
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0" data-lenis-prevent>
                {children}
            </main>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
    );
}
