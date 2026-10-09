"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const ASSETS = [
  { ref: "ast_01H9Z7F_rwa_prop", type: "COMMERCIAL_REAL_ESTATE", allocated: 84.2 },
  { ref: "ast_81B2X9C_art_fund", type: "FINE_ART_COLLECTION", allocated: 62.0 },
  { ref: "ast_44L1M2K_pvt_cred", type: "PRIVATE_CREDIT_YIELD", allocated: 100.0 },
  { ref: "ast_99T5R1N_solar_ix", type: "RENEWABLE_ENERGY_INFRA", allocated: 45.5 },
];

export default function Home() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % ASSETS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentAsset = ASSETS[index];

  return (
    <main className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-50 p-4 sm:p-8 md:p-12 selection:bg-zinc-800 selection:text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 border border-zinc-800">
        {/* Left Panel */}
        <div className="p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between">
          <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-16">
            3rdfloor
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-balance mb-6">
              Infrastructure for programmable ownership.
            </h1>
            <p className="text-zinc-400 text-sm md:text-base text-pretty mb-10 leading-relaxed">
              3rdfloor is a Solana-native platform that enables companies to create, launch, and manage tokenized real-world asset investment offerings throughout their lifecycle.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button className="h-9 px-5 bg-zinc-50 text-zinc-950 text-[13px] font-medium transition-transform active:scale-[0.96] hover:bg-zinc-200">
                Start Building
              </button>
              <a href="#" className="h-9 px-5 flex items-center border border-zinc-800 text-zinc-300 text-[13px] font-medium hover:bg-zinc-900 transition-colors">
                Documentation
              </a>
            </div>
          </div>

          <div className="mt-16 font-mono text-[10px] text-zinc-600 flex gap-4 uppercase tracking-wider">
            <span>[SYS_READY]</span>
            <span>Solana</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-8 md:p-12 lg:p-16 bg-zinc-900/20 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30 pointer-events-none"
            style={{ maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)' }}
          />
          
          <div className="w-full max-w-[320px] relative z-10 border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-6 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/50">
              <span className="font-mono text-[10px] text-zinc-500">OFFERING_CONFIG</span>
              <span className="font-mono text-[10px] text-emerald-500 flex items-center gap-2">
                <span className="size-1.5 bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="relative h-[160px] font-mono text-xs tabular-nums">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentAsset.ref}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 absolute inset-0 w-full"
                >
                  <div>
                    <div className="text-zinc-600 text-[10px] mb-1">ASSET_REF</div>
                    <div className="text-zinc-300 truncate">{currentAsset.ref}</div>
                  </div>
                  
                  <div>
                    <div className="text-zinc-600 text-[10px] mb-1">ASSET_CLASS</div>
                    <div className="text-zinc-300">{currentAsset.type}</div>
                  </div>

                  <div>
                    <div className="text-zinc-600 text-[10px] mb-2">CAP_TABLE</div>
                    <div className="flex justify-between text-zinc-500 mb-1 text-[10px]">
                      <span>Allocated</span>
                      <span className="text-zinc-300">{currentAsset.allocated.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 overflow-hidden">
                      <motion.div 
                        className="h-full bg-zinc-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentAsset.allocated}%` }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-800/50 flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-600">NETWORK</span>
              <span className="text-zinc-300">Solana Mainnet-Beta</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
