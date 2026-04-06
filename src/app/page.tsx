"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EnterScreen from "@/components/ui/EnterScreen";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import UseCases from "@/components/sections/UseCases";
import Pricing from "@/components/sections/Pricing";
import Footer from "@/components/sections/Footer";
import ProblemStatement from "@/components/sections/ProblemStatement";
import { useUI } from "@/context/UIContext";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/canvas/Scene"), { ssr: false });

export default function Home() {
  const { hasEntered, setHasEntered } = useUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    setHasEntered(true);
  };

  return (
    <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
      <AnimatePresence>
        {mounted && !hasEntered && (
          <EnterScreen onEnter={handleEnter} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        >
          <source src="/bg.webm" type="video/webm" />
        </video>

        {/* Scene Container - Fades in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hasEntered ? 1 : 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Scene />
        </motion.div>
      </div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasEntered ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Hero startAnimation={hasEntered} />
        <ProblemStatement />
        <Features />
        <UseCases />
        <Pricing />
        <Footer />
      </motion.div>
    </main>
  );
}
