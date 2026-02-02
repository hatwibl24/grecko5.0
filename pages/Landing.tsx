'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Float } from '@react-three/drei'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X, Target, Cpu, Brain, Zap, Activity, ScanLine, Smartphone } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 1. TS-SAFE 3D BACKGROUND ===================== */
// FIXED: Switched to meshStandardMaterial to resolve TS2322 errors.
const BlueprintCore = ({ scroll }: { scroll: any }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

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

/* ===================== 2. GRAPH COMPONENT ===================== */
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
        <motion.circle 
            cx="100" cy="5" r="3" fill="#fff"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 2 }}
        >
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

/* ===================== 3. MEMORY HEATMAP (MASTERY) ===================== */
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
            className="aspect-square rounded-[2px] bg-white/10"
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-[10px] text-white/30 font-mono">
        <span>CHEM 101</span>
        <span>LAST SYNC: 2M AGO</span>
      </div>
    </div>
  )
}

/* ===================== 4. TACTICAL SCANNER (AI MENTOR) ===================== */
const TacticalScanner = () => {
  return (
    <div className="w-full h-64 bg-[#050505] rounded-xl border border-white/10 relative overflow-hidden group">
        {/* Background "Document" Text */}
        <div className="absolute inset-0 p-6 opacity-30 select-none pointer-events-none filter blur-[1px]">
            <p className="text-[10px] text-justify leading-relaxed text-white font-mono">
                The reaction kinetics suggested a first-order dependency on substrate concentration. 
                However, deviations at high molarity indicate enzyme saturation. 
                To optimize the outcome, we must reconsider the thermal coefficients...
                (Data corrupted)... recalculating trajectory... 
                academic performance index indicates a 14% drop in output efficiency.
                Recommended course of action: immediate review of Unit 4.
            </p>
            <p className="text-[10px] text-justify leading-relaxed text-white font-mono mt-4">
               TARGET GPA: 4.0 // CURRENT STATUS: AT RISK
               MISSING ASSIGNMENTS: 0
               UPCOMING EXAMS: 2
            </p>
        </div>

        {/* The Scanning Bar */}
        <motion.div 
            className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* The "Clear" Zone (Revealed by scanner) */}
        <motion.div 
            className="absolute inset-0 p-6 z-10 bg-black/50"
            style={{ 
                maskImage: 'linear-gradient(to bottom, transparent, black 40%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 40%, black 50%, transparent 60%)'
            }}
            animate={{ WebkitMaskPositionY: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
             {/* This layer reveals the text cleanly as the bar passes */}
        </motion.div>

        {/* Pop-up Insights */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 items-end">
            <motion.div 
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="bg-blue-500/10 border border-blue-500/50 px-3 py-2 rounded text-[10px] text-blue-200 font-mono backdrop-blur-md"
            >
                ⚠️ Weakness Detected: Unit 4
            </motion.div>
            <motion.div 
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="bg-white/10 border border-white/20 px-3 py-2 rounded text-[10px] text-white font-mono backdrop-blur-md"
            >
                Review Strategy Generated
            </motion.div>
        </div>
    </div>
  )
}

/* ===================== 5. FEATURE SECTION LAYOUT ===================== */
const FeatureSection = ({ title, subtitle, icon: Icon, children, delay = 0 }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-15%" }}
      transition={{ duration: 0.8, delay }}
      className="w-full max-w-2xl mx-auto mb-40 px-6 flex flex-col relative z-10"
    >
      <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{title}</h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-md font-light">
                {subtitle}
              </p>
          </div>
      </div>

      <div className="w-full transform transition-all duration-700 hover:scale-[1.01]">
        {children}
      </div>
    </motion.div>
  )
}

/* ===================== MAIN LANDING PAGE ===================== */
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
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timer)
  }, [displayText, isDeleting, textIndex])

  return (
    <div ref={containerRef} className="bg-[#000] min-h-screen relative overflow-x-hidden font-sans selection:bg-white/20 pb-32">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="text-xl font-bold text-white tracking-tight">Grecko.</div>
        <button 
          onClick={() => setAuthModalMode('login')}
          className="text-xs font-medium text-white hover:bg-white/10 transition-colors px-4 py-2 rounded-full border border-white/10"
        >
          Sign In
        </button>
      </header>

      {/* 3D CANVAS BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.5} />
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            cellColor="#333" 
            sectionColor="#444" 
            cellSize={1}
            sectionSize={5}
            position={[0, -2, 0]} 
          />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="relative z-10 pt-32">
        
        {/* HERO */}
        <section className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{duration: 0.8}}>
            <h1 className="text-[12vw] md:text-[8vw] font-bold text-white leading-none tracking-tighter mb-6 opacity-90">
              GRECKO
            </h1>
            <div className="h-8 md:h-12 flex items-center justify-center gap-2">
               <span className="text-lg md:text-2xl text-white/70 font-light tracking-wide">
                 {displayText}
                 <span className="animate-pulse">|</span>
               </span>
            </div>
            <p className="text-white/40 mt-6 max-w-sm mx-auto text-sm md:text-base leading-relaxed">
              The operating system for high-performance students.
            </p>
          </motion.div>
        </section>

        {/* SECTION 1: PREDICTIVE GPA */}
        <FeatureSection 
          title="Predictive GPA"
          subtitle="Visualize the exact mathematical path to your 4.0 target."
          icon={Target}
        >
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-[10px] text-white/40 font-mono tracking-widest mb-1 uppercase">Projected Outcome</div>
                <div className="text-4xl font-medium text-white tracking-tight">3.82</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40 font-mono mb-1 uppercase">Target</div>
                <div className="text-xl font-medium text-white/80">4.00</div>
              </div>
            </div>
            <LiveTrendGraph />
          </div>
        </FeatureSection>

        {/* SECTION 2: AUTOMATED MASTERY */}
        <FeatureSection 
          title="Automated Mastery"
          subtitle="Adaptive retention tracking. We map exactly what you know and what you're losing."
          icon={Cpu}
        >
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-1 shadow-2xl">
             <MasteryHeatmap />
          </div>
        </FeatureSection>

        {/* SECTION 3: TACTICAL AI */}
        <FeatureSection 
          title="Tactical AI"
          subtitle="Strategic analysis of your coursework. It finds weaknesses before the exam does."
          icon={Brain}
        >
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-1 shadow-2xl">
            <TacticalScanner />
          </div>
        </FeatureSection>
        
        {/* DESKTOP FOOTER */}
        <div className="hidden md:flex flex-col items-center justify-center py-32 px-4 text-center z-10 relative border-t border-white/5 bg-black">
             <div className="max-w-xl w-full">
                <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Serious about your grades?</h2>
                <button 
                  onClick={() => setAuthModalMode('signup')}
                  className="w-full bg-white text-black font-bold text-lg py-5 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Start Semester
                </button>
             </div>
        </div>
      </div>

      {/* MOBILE FLOATING BUTTON */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-6 pointer-events-none flex justify-center md:hidden">
         <motion.button 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             onClick={() => setAuthModalMode('signup')}
             className="pointer-events-auto w-full max-w-xs bg-white text-black font-bold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
          >
             Get Started
          </motion.button>
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authModalMode && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative"
            >
               <button onClick={() => setAuthModalMode(null)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                 <X size={20} />
               </button>
               
               <div className="text-center mb-8 mt-2">
                 <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {authModalMode === 'signup' ? 'Initialize Account' : 'Welcome Back'}
                 </h2>
                 <p className="text-white/40 text-sm">Access your academic dashboard.</p>
               </div>

               <div className="space-y-3">
                 <button onClick={onGoogleAuth} className="w-full py-4 bg-white text-black font-bold rounded-xl flex justify-center items-center gap-3 hover:bg-gray-100 transition-colors">
                    <Zap className="fill-black w-4 h-4"/> Continue with Google
                 </button>
                 <button onClick={() => { authModalMode === 'signup' ? onSignupWithEmail() : onLoginWithEmail() }} className="w-full py-4 bg-transparent text-white font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                    Use Email
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
