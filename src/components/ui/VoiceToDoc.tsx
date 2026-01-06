'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface VoiceToDocProps {
    isHovering: boolean;
}

export default function VoiceToDoc({ isHovering }: VoiceToDocProps) {
    const barCount = 12;
    const bars = Array.from({ length: barCount });

    // Mouse Tracking for Waveform Reactivity
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let animationFrameId: number;
        const handleMouseMove = (e: MouseEvent) => {
            // Throttle with rAF
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                setMousePos({ x: e.clientX, y: e.clientY });
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        }
    }, []);

    return (
        <div ref={containerRef} className="flex items-center justify-center mb-8 relative w-64 h-64">
            {/* Waveform -> Document Transformation */}
            <div className="relative w-40 h-52 flex items-center justify-center">

                {/* Visual "Paper" Background (Appears on Hover) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: isHovering ? 1 : 0,
                        scale: isHovering ? 1 : 0.8,
                        height: isHovering ? 180 : 60,
                        width: isHovering ? 140 : 20,
                        y: isHovering ? 0 : 0
                    }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                    className="absolute bg-white rounded-lg shadow-2xl border border-gray-100"
                    style={{ zIndex: 0 }}
                />

                {/* Bars / Lines */}
                {bars.map((_, i) => (
                    <Bar
                        key={i}
                        index={i}
                        total={barCount}
                        isHovering={isHovering}
                        mousePos={mousePos}
                    />
                ))}
            </div>
        </div>
    );
}

function Bar({ index, total, isHovering, mousePos }: {
    index: number,
    total: number,
    isHovering: boolean,
    mousePos: { x: number, y: number }
}) {
    const waveGap = 12;
    const waveWidth = 4;

    const barRef = useRef<HTMLDivElement>(null);
    const [scaleFactor, setScaleFactor] = useState(1);

    // Calculate reactivity
    useEffect(() => {
        if (isHovering || !barRef.current) {
            if (scaleFactor !== 1) setScaleFactor(1);
            return;
        }

        const rect = barRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dist = Math.hypot(mousePos.x - centerX, mousePos.y - centerY);
        const triggerRange = 600;

        if (dist < triggerRange) {
            const proximity = 1 - (dist / triggerRange);
            const effect = proximity * proximity;
            setScaleFactor(1 + effect * 2.2);
        } else {
            setScaleFactor(1);
        }

    }, [mousePos, isHovering]); // This dependency is what triggers the cascade

    // Document Props
    const docGap = 12;
    const docStartY = -60;

    const isHeader = index === 0;
    const isShort = index === total - 1 || index === 4 || index === 8;

    // Base Wave Height
    const baseWaveHeight = 16 + Math.abs(Math.sin(index * 123.4)) * 32;

    return (
        <motion.div
            ref={barRef}
            // Removed layout prop to reduce risk of recursion/thrashing during high-freq updates
            initial={false}
            animate={{
                // Position
                x: isHovering ? 0 : (index * waveGap) - (total * waveGap) / 2 + waveGap / 2,
                y: isHovering ? docStartY + (index * docGap) : 0,

                // Dimensions
                width: isHovering
                    ? (isHeader ? 80 : isShort ? 60 : 100)
                    : waveWidth * (isHovering ? 1 : Math.min(scaleFactor, 1.2)),

                height: isHovering
                    ? (isHeader ? 8 : 4)
                    : baseWaveHeight * scaleFactor,

                // Style
                backgroundColor: isHovering
                    ? (isHeader ? '#1a1a1a' : '#9ca3af')
                    : `rgba(255, 77, 77, ${Math.min(1, 0.6 + (scaleFactor - 1))})`,

                borderRadius: isHovering ? 2 : 4,
            }}
            transition={{
                type: "spring", stiffness: 120, damping: 14,
                // Layout duration is irrelevant if layout prop is gone, but keeping just in case.
            }}
            className="absolute z-10"
        >
            {!isHovering && (
                <motion.div
                    animate={{
                        height: [
                            "100%",
                            "60%",
                            "100%"
                        ]
                    }}
                    transition={{
                        duration: 1.2 + (index * 0.05),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.1,
                    }}
                    style={{ width: '100%', height: '100%', borderRadius: 4, backgroundColor: 'inherit' }}
                />
            )}
        </motion.div>
    );
}
