"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import HeroButton from "@/components/ui/HeroButton";

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ startAnimation = true }: { startAnimation?: boolean }) {
    const containerRef = useRef<HTMLElement>(null);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, [supabase]);

    useLayoutEffect(() => {
        if (!startAnimation) return;

        const ctx = gsap.context(() => {
            // Simple reveal animation
            gsap.from(".hero-reveal", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, [startAnimation]);

    return (
        <section ref={containerRef} className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-32 overflow-hidden pointer-events-none">

            {/* LEFT: Title Area - MOVED UP FURTHER & RIGHT */}
            {/* Increased negative margin to -mt-80 (Up). Adjusted ml-16 (Right). */}
            <div className="flex-1 z-10 pointer-events-auto lg:-mt-80 lg:ml-16">
                {/* Voice-to-SOP: Darker (text-black) and Bolder (font-extrabold) */}
                <p className="hero-reveal font-mono text-xs font-extrabold tracking-[0.2em] uppercase mb-4 text-black ml-2">
                    Voice-to-SOP
                </p>
                {/* Added lg:ml-12 to offset the title to the right of the label */}
                <h1 className="hero-reveal text-[18vw] lg:text-[14vw] leading-[0.8] font-serif text-[#FF4D4D] tracking-tighter mix-blend-multiply lg:ml-12">
                    Voice<span className="italic font-light">SOP</span>
                </h1>
            </div>

            {/* RIGHT: Copy & CTA - MOVED DOWN & LEFT */}
            {/* Increased mt to 96 (Down). Reduced mr-40 to mr-10 to allow full width (fix wrapping). Removed max-w constraint. */}
            {/* No max-w means it will take available flex space. Combined with small mr-10, this guarantees space. */}
            <div className="flex-1 lg:mt-96 lg:mr-10 z-10 pointer-events-auto">
                {/* Headline: Bolder (font-bold) and Larger (text-4xl) */}
                {/* Added <br> for forced break to keep '60 seconds' on line 2 */}
                <h2 className="hero-reveal text-4xl font-serif font-bold italic leading-tight text-gray-900 mb-6">
                    "Turn messy voice notes into <br className="hidden lg:block" /> professional SOPs in 60 seconds."
                </h2>
                <p className="hero-reveal text-gray-600 mb-10 leading-relaxed">
                    A web app that converts voice recordings into professionally formatted Standard Operating Procedures with AI—saving business owners 4+ hours per document.
                </p>

                <div className="hero-reveal flex items-center gap-4">
                    <div className="hero-reveal flex items-center gap-4">
                        <HeroButton
                            onClick={() => router.push(user ? '/dashboard/new' : '/login')}
                            text={user ? 'Create New SOP' : 'Start Creating Free'}
                            className="min-w-[260px]"
                        />
                        <button className="bg-white border text-black px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                            Watch Demo
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
