'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import VoiceToDoc from './VoiceToDoc';

interface EnterScreenProps {
    onEnter: () => void;
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
    const [clicked, setClicked] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const handleClick = () => {
        setClicked(true);
        // Delay triggering parent onEnter to allow internal exit animations to play
        setTimeout(onEnter, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                    scale: clicked ? 1.1 : 1,
                    opacity: clicked ? 0 : 1
                }}
                transition={{
                    duration: clicked ? 0.8 : 1,
                    ease: clicked ? "easeInOut" : "easeOut"
                }}
                className="flex flex-col items-center justify-center gap-6"
            >
                {/* Logo or Brand */}
                <h1 className="text-4xl md:text-6xl font-serif tracking-tighter">
                    Voice<span className="text-brand-red">SOP</span>
                </h1>

                <p className="text-white/40 text-sm tracking-widest uppercase mb-8">
                    The Voice-First Standard Operating Procedure
                </p>

                {/* Voice to Doc Visualization */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                    className="flex justify-center"
                >
                    <VoiceToDoc isHovering={isHovering} />
                </motion.div>

                {/* Enter Button / Interaction Hint */}
                {/* Matches Hero CTA Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
                >
                    <button
                        onClick={handleClick}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className="group relative overflow-hidden bg-[#FF4D4D] text-white border-2 border-[#FF4D4D] px-8 py-3 rounded-full font-medium uppercase tracking-wider hover:bg-transparent hover:text-[#FF4D4D] transition-colors duration-300 min-w-[220px]"
                    >
                        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:-translate-y-[150%]">
                            Enter Experience
                        </span>
                        <span className="absolute left-0 top-0 w-full h-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] translate-y-[150%] group-hover:translate-y-0 font-serif italic text-lg capitalize tracking-normal">
                            Enter Experience
                        </span>
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
