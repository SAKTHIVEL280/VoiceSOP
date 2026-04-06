'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // Dashboard pages rely on native container scrolling; keep wheel behavior native.
        if (pathname.startsWith('/dashboard')) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            syncTouch: false, // Changed to false: Let native touch scrolling handle mobile (smoother/bug-free)
            touchMultiplier: 2,
            // Keep nested scroll containers working with wheel input.
            prevent: (node) => {
                return !!node?.closest?.('[data-lenis-prevent]');
            },
        });

        lenis.on('scroll', ScrollTrigger.update);

        const raf = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(raf);

        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.destroy();
            gsap.ticker.remove(raf);
        };
    }, [pathname]);

    return <>{children}</>;
}
