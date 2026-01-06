'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;

        if (!cursor || !follower) return;

        // Center initially - ensure they are hidden until movement
        gsap.set([cursor, follower], { xPercent: -50, yPercent: -50, scale: 0 });

        let xTo = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
        let yTo = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });

        let followerX = gsap.quickTo(follower, "x", { duration: 0.6, ease: "power3" });
        let followerY = gsap.quickTo(follower, "y", { duration: 0.6, ease: "power3" });

        let prevX = 0;
        let prevY = 0;
        let angle = 0;
        let scaleX = 1;
        let scaleY = 1;

        // Timeout to reset shape when stopped
        let resetTimer: NodeJS.Timeout;

        const onMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;

            // Show cursor on first move
            if (gsap.getProperty(cursor, "scale") === 0) {
                gsap.to([cursor, follower], { scale: 1, duration: 0.3 });
            }

            // Velocity calc
            const dx = clientX - prevX;
            const dy = clientY - prevY;
            const velocity = Math.sqrt(dx * dx + dy * dy);
            const maxStretch = 3.0; // Higher max stretch for more "jelly"

            // Calculate angle and squeeze
            if (velocity > 0.1) {
                angle = Math.atan2(dy, dx) * (180 / Math.PI);

                // Stretch based on speed (significantly exaggerated)
                const stretch = Math.min(velocity * 0.04, 1.5);
                scaleX = 1 + stretch;
                scaleY = 1 - stretch * 0.4; // More squash 
            }

            // Move elements
            xTo(clientX);
            yTo(clientY);
            followerX(clientX);
            followerY(clientY);

            // Animate shape deformation
            gsap.to(follower, {
                rotation: angle,
                scaleX: scaleX,
                scaleY: scaleY,
                duration: 0.5,
                overwrite: 'auto'
            });

            prevX = clientX;
            prevY = clientY;

            // Reset when stopped
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
                gsap.to(follower, {
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.3)"
                });
            }, 100);
        };

        window.addEventListener('mousemove', onMouseMove);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            clearTimeout(resetTimer);
        };
    }, { scope: cursorRef });

    return (
        <div className="hidden md:block">
            {/* Inner Dot */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
            />
            {/* Outer Follower - Jelly Effect */}
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-10 h-10 border-[1.5px] border-white rounded-full pointer-events-none z-[9998] mix-blend-difference will-change-transform"
            />

            <style jsx global>{`
                @media (min-width: 768px) {
                    body, a, button, input, textarea {
                        cursor: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
