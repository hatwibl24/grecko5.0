'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Float } from '@react-three/drei'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X, Target, Cpu, Brain, Zap, Activity } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 1. BUILD-SAFE 3D BACKGROUND ===================== */
const BlueprintCore = ({ scroll }: { scroll: any }) => {
  // Using 'any' for the ref type here is the "Nuclear Option" to ensure 
  // the build never fails on Three.js property lookups.
  const meshRef = useRef<any>(null)
  const groupRef = useRef<any>(null)

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return

    const s = scroll.get()
    
    // Smooth, heavy rotation for premium feel
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1

    // Subtle breathing effect based on scroll
    const zoom = 1 + s * 0.5
    groupRef.current.scale.set(zoom, zoom, zoom)
  })

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh ref={meshRef} rotation={[0.5, 0.5, 0]}>
          <boxGeometry args={[3.5, 2, 0.1]} />
          <meshStandardMaterial 
            color="#111111"
            roughness={0.1}
            metalness={0.8}
            transparent={true}
            opacity={0.3}
            wireframe={true}
            emissive="#222222"
            emissiveIntensity={0.2}
          />
        </mesh>
      </Float>
    </group>
  )
}

/* ===================== 2. DATA GRAPH ===================== */
const LiveTrendGraph = () => {
  return (
    <div className="w-full h-48 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden flex items-end p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      <svg className="w-full h-full z-10 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
        <motion.path
          d="M0,50 C20,45 30,30 50,25 C70,20 80,10 100,5"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.circle cx="100" cy="5" r="3" fill="#fff">
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        </motion.circle>
      </svg>
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.2 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"
        style={{ clipPath: 'polygon(0 100%, 0% 100%, 100% 10%, 100% 100%)' }} 
      />
    </div>
  )
}

/* ===================== 3. MEMORY HEATMAP (REPLACES GENERIC BARS) ===================== */
const MasteryHeatmap = () => {
  return (
    <div className="w-full bg-[#050505] rounded-xl border border-white/10 p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-white/40 tracking-widest uppercase">Retention Matrix</span>
        </div>
        <span className="text-emerald-400 text-sm font-bold">92% Optimal</span>
      </div>

      <div className="grid grid-cols-8 gap-1.5 md:gap-2">
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scale: 0.9 }}
            whileInView={{ 
              opacity: [0.1, 0.5, 0.2], 
              backgroundColor: i % 4 === 0 ? '#34d399' : '#ffffff', 
            }}
            transition={{ 
              duration: Math.random() * 2 + 1.5, 
              repeat: Infinity, 
              delay: i * 0.05 
            }}
            className="aspect-square rounded-[1px] bg-white/10"
          />
        ))}
      </div>
    </div>
  )
}

/* ===================== 4. TACTICAL SCANNER (REPLACES CHAT BUBBLES) ===================== */
const TacticalScanner = () => {
  return (
    <div className="w-full h-64 bg-[#050505] rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 p-6 opacity-20 filter blur-[0.5px]">
            <p className="text-[9px] text-justify leading-relaxed text-white font-mono uppercase tracking-tighter">
                Analysis: Organic Chemistry II. Current trajectory suggests 74% retention of carboxylic acid derivatives. 
                Anomaly detected in week 4 metabolic pathways. Adjusting focus... 
                Recalculating study intervals... Optimal session: 45m.
                API status: Active. GPA forecast: 3.94.
            </p>
        </div>

        {/* The Scanning Line */}
        <motion.div 
            className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded text-[10px] text-blue-200 font-mono backdrop-blur-sm"
            >
                [SCANNING_CURVE]
            </motion.div>
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 border border-white/10 px-3 py-1.5 rounded text-[10px] text-white/70 font-mono backdrop-blur-sm"
            >
                INSIGHT_READY
            </motion.div>
        </div>
    </div>
  )
}

/* ===================== 5. FEATURE SECTION WRAPPER ===================== */
const FeatureSection = ({ title, subtitle, icon: Icon, children }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-2xl mx-auto mb-32 px-6 flex flex-col relative z-10"
    >
      <div className="flex items-center gap-4 mb-8">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <Icon className="w-5 h-5 text-white/80" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">{title}</h2>
      </div>
      <p className="text-white/40 text-base mb-8 font-light leading-relaxed">
        {subtitle}
      </p>
      <div className="w-full bg-[#080808] border border-white/5 rounded-2xl p-1 overflow-hidden">
        {children}
      </div>
    </motion.div>
  )
}

/* ===================== MAIN COMPONENT ===================== */
export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 25 })

  // Typing Logic
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const TEXTS = ['Engineer Your GPA', 'Secure Your Degree', 'Analyze Your Odds']

  useEffect(() => {
    const full = TEXTS[textIndex]
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(full.slice(0, displayText.length + 1))
        if (displayText === full) setTimeout(() => setIsDeleting(true), 2000)
      } else {
        setDisplayText(full.slice(0, displayText.length - 1))
        if (!displayText) {
          setIsDeleting(false)
          setTextIndex((i) => (i + 1) % TEXTS.length)
        }
      }
    }, isDeleting ? 30 : 60)
    return () => clearTimeout(timer)
  }, [displayText, isDeleting, textIndex])

  return (
    <div ref={containerRef} className="bg-[#000] min-h-screen relative overflow-x-hidden font-sans selection:bg-white/20">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-black/40 backdrop-blur-xl">
        <div className="text-lg font-bold text-white tracking-tighter">GRECKO.</div>
        <button 
          onClick={() => setAuthModalMode('login')}
          className="text-[11px] font-bold text-white uppercase tracking-widest hover:text-white/60 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* 3D BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.5} />
          <Grid 
            infiniteGrid 
            fadeDistance={30} 
            cellColor="#222" 
            sectionColor="#333" 
            cellSize={1}
            sectionSize={4}
            position={[0, -1.5, 0]} 
          />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      <div className="relative z-10">
        
        {/* HERO */}
        <section className="h-screen flex flex-col justify-center items-center text-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{duration: 1.5}}>
            <h1 className="text-[14vw] md:text-[10vw] font-bold text-white leading-none tracking-tighter mb-4">
              GRECKO
            </h1>
            <div className="h-6 flex items-center justify-center font-mono text-white/50 text-xs md:text-sm tracking-[0.2em] uppercase">
                {displayText}<span className="animate-pulse">_</span>
            </div>
          </motion.div>
        </section>

        {/* CONTENT SECTIONS */}
        <div className="pb-40">
            <FeatureSection 
              title="Predictive Analytics"
              subtitle="Stop guessing. Our engine calculates your final GPA based on live assignment weighting."
              icon={Target}
            >
              <LiveTrendGraph />
            </FeatureSection>

            <FeatureSection 
              title="Memory Matrix"
              subtitle="Active recall visualization. Know exactly when you're about to forget a concept."
              icon={Cpu}
            >
              <MasteryHeatmap />
            </FeatureSection>

            <FeatureSection 
              title="Tactical AI"
              subtitle="The mentor that actually reads your syllabus. Strategic insight, zero fluff."
              icon={Brain}
            >
              <TacticalScanner />
            </FeatureSection>
        </div>

        {/* FOOTER CTA */}
        <section className="py-40 flex flex-col items-center bg-gradient-to-t from-white/[0.02] to-transparent">
            <h3 className="text-white text-3xl font-bold mb-8 tracking-tight">Ready for Precision?</h3>
            <button 
                onClick={() => setAuthModalMode('signup')}
                className="bg-white text-black px-12 py-4 rounded-full font-bold hover:scale-105 transition-transform"
            >
                Join the Private Beta
            </button>
        </section>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {authModalMode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 relative"
            >
               <button onClick={() => setAuthModalMode(null)} className="absolute top-6 right-6 text-white/20 hover:text-white">
                 <X size={18} />
               </button>
               <h2 className="text-xl font-bold text-white mb-8 text-center uppercase tracking-widest">
                 {authModalMode}
               </h2>
               <div className="space-y-4">
                 <button onClick={onGoogleAuth} className="w-full py-4 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest">
                    Google Auth
                 </button>
                 <button onClick={() => authModalMode === 'signup' ? onSignupWithEmail() : onLoginWithEmail()} className="w-full py-4 bg-transparent text-white border border-white/10 rounded-xl text-xs uppercase tracking-widest">
                    Email Auth
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
