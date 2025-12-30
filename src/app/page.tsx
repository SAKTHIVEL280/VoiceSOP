"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import EnterScreen from "@/components/ui/EnterScreen";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import UseCases from "@/components/sections/UseCases";
import Pricing from "@/components/sections/Pricing";
import Footer from "@/components/sections/Footer";
import ProblemStatement from "@/components/sections/ProblemStatement";
import Scene from "@/components/canvas/Scene";
import { useUI } from "@/context/UIContext";

export default function Home() {
  const { hasEntered, setHasEntered } = useUI();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We can still do some pre-checks or loading simulation here if desired
    // But referencing UIContext is immediate. we might want to ensure mounted.
    setIsLoading(false);
  }, []);

  const handleEnter = () => {
    setHasEntered(true);
  };

  return (
    <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
      <AnimatePresence>
        {!hasEntered && !isLoading && (
          <EnterScreen onEnter={handleEnter} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 contrast-125 saturate-0"
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
