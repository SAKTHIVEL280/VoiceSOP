'use client';

import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';

const menuItems = [
    { label: "Features", href: "#features" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "#pricing" },
    { label: "Login", href: "/login" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const linksRef = useRef<HTMLDivElement>(null);
    const timeline = useRef<GSAPTimeline | null>(null);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Menu Animation
    useGSAP(() => {
        if (!overlayRef.current || !linksRef.current) return;

        timeline.current = gsap.timeline({ paused: true })
            .to(overlayRef.current, {
                y: '0%',
                duration: 0.6,
                ease: "power3.inOut"
            })
            .from(linksRef.current.children, {
                y: 50,
                opacity: 0,
                duration: 0.4,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.2");

    }, { scope: menuRef });

    useEffect(() => {
        if (timeline.current) {
            if (isOpen) {
                timeline.current.play();
            } else {
                timeline.current.reverse();
            }
        }
    }, [isOpen]);

    return (
        <nav
            ref={menuRef}
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled && !isOpen ? 'py-4 bg-white/80 backdrop-blur-md border-b border-black/5' : 'py-6 bg-transparent'
                }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center relative z-50">
                {/* Logo */}
                <Link href="/" className="text-2xl font-serif italic font-bold text-brand-red mix-blend-difference z-50">
                    VoiceSOP
                </Link>

                {/* Menu Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-off-black text-white hover:bg-brand-red transition-colors z-50"
                >
                    <span className="text-sm font-medium uppercase tracking-wider">
                        {isOpen ? "Close" : "Menu"}
                    </span>
                    <div className="relative w-4 h-4">
                        <Menu
                            size={16}
                            className={`absolute top-0 left-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                        />
                        <X
                            size={16}
                            className={`absolute top-0 left-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                        />
                    </div>
                </button>
            </div>

            {/* Fullscreen Overlay */}
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-off-black z-40 translate-y-[-100%] flex flex-col justify-center items-center"
            >
                <div ref={linksRef} className="flex flex-col gap-8 items-center">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="text-5xl md:text-7xl font-serif italic text-warm-grey hover:text-brand-red transition-colors duration-300 flex items-center gap-4 group"
                        >
                            <span className="opacity-0 group-hover:opacity-100 -ml-12 transition-opacity duration-300">
                                <ArrowRight size={40} className="text-brand-red" />
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="absolute bottom-12 left-0 w-full text-center text-gray-500 font-sans text-sm tracking-widest uppercase opacity-50">
                    © 2024 VoiceSOP
                </div>
            </div>
        </nav>
    );
}
