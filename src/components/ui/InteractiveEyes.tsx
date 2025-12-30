'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface InteractiveEyesProps {
    isHovering: boolean;
}

// Heart Shape Path
const heartPath = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const Eye = ({ eyeRef, lookPos, isHovering }: { eyeRef: React.RefObject<HTMLDivElement | null>, lookPos: { x: number, y: number }, isHovering: boolean }) => (
    <div
        ref={eyeRef}
        className="relative w-20 h-28 bg-[#ffffff] rounded-[50%] flex items-center justify-center overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)]"
        style={{
            boxShadow: "inset 0 0 15px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.2)"
        }}
    >
        {/* Moving Group */}
        <motion.div
            className="relative flex items-center justify-center w-full h-full"
            animate={isHovering ? "heart" : "normal"}
            variants={{
                normal: {
                    x: lookPos.x,
                    y: lookPos.y,
                    scale: 1,
                },
                heart: {
                    x: 0,
                    y: 0,
                    scale: 1.1,
                }
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
        >
            {/* Pupil / Heart Container Wrapper */}
            <div className="relative flex items-center justify-center w-14 h-20">

                {/* Normal State: Black Oval Pupil with Glint */}
                <motion.div
                    animate={{ opacity: isHovering ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-14 h-20 bg-black rounded-[50%] relative flex items-center justify-center shadow-md">
                        {/* Glint: White Little Circle in Top Right */}
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full blur-[0.5px]"></div>
                    </div>
                </motion.div>

                {/* Hover State: Red Heart */}
                <motion.div
                    animate={{ opacity: isHovering ? 1 : 0, scale: isHovering ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="w-full h-full fill-current text-[#FF4D4D] drop-shadow-md"
                    >
                        <path d={heartPath} />
                    </svg>
                </motion.div>

            </div>
        </motion.div>
    </div>
);

export default function InteractiveEyes({ isHovering }: InteractiveEyesProps) {
    const leftEyeRef = useRef<HTMLDivElement>(null);
    const rightEyeRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const calculateLookPos = (eyeRef: React.RefObject<HTMLDivElement | null>) => {
        if (!eyeRef.current) return { x: 0, y: 0 };

        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const angle = Math.atan2(mousePos.y - eyeCenterY, mousePos.x - eyeCenterX);
        const distance = Math.min(
            15,
            Math.hypot(mousePos.x - eyeCenterX, mousePos.y - eyeCenterY) / 8
        );

        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
        };
    };

    const leftLook = calculateLookPos(leftEyeRef);
    const rightLook = calculateLookPos(rightEyeRef);

    return (
        <div className="flex gap-6 mb-8">
            <Eye eyeRef={leftEyeRef} lookPos={leftLook} isHovering={isHovering} />
            <Eye eyeRef={rightEyeRef} lookPos={rightLook} isHovering={isHovering} />
        </div>
    );
}
