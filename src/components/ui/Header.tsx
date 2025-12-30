'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useUI } from '@/context/UIContext';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { hasEntered } = useUI();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        setIsMenuOpen(false);
    };

    const navLinks = user
        ? [
            { label: "Index", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Pricing", href: "/pricing" }
        ]
        : [
            { label: "Index", href: "/" },
            { label: "Pricing", href: "/pricing" },
            { label: "Login", href: "/login" }
        ];

    // If not entered, don't show anything (or show minimal overlay if needed by design, but typically hidden)
    if (!hasEntered) return null;

    return (
        <header className="fixed top-0 right-0 z-[60] p-8 flex items-center gap-8 mix-blend-difference text-white">

            {/* Minimal Top Right Links (Visible initially) */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="hidden md:flex items-center gap-6 text-sm tracking-wider uppercase font-medium border border-white/20 rounded-full px-8 py-3 bg-black/5 backdrop-blur-md shadow-sm"
            >
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group relative overflow-hidden inline-block h-[32px] transition-colors ${pathname === link.href ? 'text-brand-red opacity-100' : 'text-white/70 hover:text-white hover:opacity-100'} border border-transparent hover:border-white/20 rounded-full px-4 py-1.5`}
                    >
                        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:-translate-y-[150%]">
                            {link.label}
                        </span>
                        <span className="absolute left-0 top-0 w-full h-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] translate-y-[150%] group-hover:translate-y-0 font-serif italic capitalize tracking-normal">
                            {link.label.toLowerCase()}
                        </span>
                    </Link>
                ))}
            </motion.nav>

            {/* Menu Toggle Button (The "Dots" or User Icon) */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                onClick={() => setIsMenuOpen(true)}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            >
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                </div>
            </motion.button>

            {/* Full Screen / Side Panel Overlay Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        />

                        {/* Side Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", ease: [0.76, 0, 0.24, 1], duration: 0.8 }}
                            className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-[#1a1a1a] text-[#e0e0e0] z-[80] p-12 flex flex-col justify-between shadow-2xl"
                        >
                            {/* Close Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex flex-col gap-6 mt-12">
                                <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Navigation</p>
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + (index * 0.1), duration: 0.5 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block text-5xl md:text-6xl font-serif italic hover:text-brand-red transition-colors hover:translate-x-4 duration-300"
                                        >
                                            <span className="text-lg not-italic font-sans text-white/30 mr-6 align-top">0{index + 1}</span>
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                {user && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-4 text-3xl font-serif text-white/50 hover:text-red-500 mt-8 transition-colors group"
                                        >
                                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-red-500/50">
                                                <LogOut size={20} />
                                            </div>
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="mt-auto pt-12 border-t border-white/10 flex flex-col gap-4 text-white/40 text-sm font-light">
                                <div className="flex justify-between">
                                    <span>Instagram</span>
                                    <span>Twitter</span>
                                    <span>LinkedIn</span>
                                </div>
                                <p>VoiceSOP © {new Date().getFullYear()}</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
