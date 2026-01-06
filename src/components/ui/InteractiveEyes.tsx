'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface InteractiveEyesProps {
    isHovering: boolean;
}

// Heart Shape Path
const heartPath = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const Eye = ({ eyeRef, pupilRef, isHovering }: { eyeRef: React.RefObject<HTMLDivElement | null>, pupilRef: React.RefObject<HTMLDivElement | null>, isHovering: boolean }) => (
    <div
        ref={eyeRef}
        className="relative w-20 h-28 bg-[#ffffff] rounded-[50%] flex items-center justify-center overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)]"
        style={{
            boxShadow: "inset 0 0 15px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.2)"
        }}
    >
        {/* Moving Pupil Group */}
        <motion.div
            ref={pupilRef}
            className="relative flex items-center justify-center w-full h-full will-change-transform"
            animate={isHovering ? { scale: 1.1 } : { scale: 1 }}
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
    const leftPupilRef = useRef<HTMLDivElement>(null);
    const rightPupilRef = useRef<HTMLDivElement>(null);

    // Track hover state in ref for the animation loop
    const isHoveringRef = useRef(isHovering);
    useEffect(() => {
        isHoveringRef.current = isHovering;
    }, [isHovering]);

    useEffect(() => {
        let animationFrameId: number;
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(updateEyes);
            }
        };

        const updateEyes = () => {
            updateEye(leftEyeRef, leftPupilRef, mouseX, mouseY);
            updateEye(rightEyeRef, rightPupilRef, mouseX, mouseY);
            animationFrameId = 0;
        };

        const updateEye = (
            eyeRef: React.RefObject<HTMLDivElement | null>,
            pupilRef: React.RefObject<HTMLDivElement | null>,
            mx: number,
            my: number
        ) => {
            if (!eyeRef.current || !pupilRef.current) return;

            // If hovering, lock to center (Heart Mode)
            if (isHoveringRef.current) {
                pupilRef.current.style.transform = `translate(0px, 0px)`;
                return;
            }

            const rect = eyeRef.current.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;

            const angle = Math.atan2(my - eyeCenterY, mx - eyeCenterX);
            const distance = Math.min(
                15,
                Math.hypot(mx - eyeCenterX, my - eyeCenterY) / 8
            );

            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            pupilRef.current.style.transform = `translate(${x}px, ${y}px)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="flex gap-6 mb-8">
            <Eye eyeRef={leftEyeRef} pupilRef={leftPupilRef} isHovering={isHovering} />
            <Eye eyeRef={rightEyeRef} pupilRef={rightPupilRef} isHovering={isHovering} />
        </div>
    );
}
