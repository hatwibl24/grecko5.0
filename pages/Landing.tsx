'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Float, Stars } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X, Mail, ChevronRight, ChevronLeft, Target, Cpu, Brain, Zap, GraduationCap, TrendingUp, Activity } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 1. REAL ANIMATED GRAPH COMPONENT ===================== */
const LiveTrendGraph = () => {
  return (
    <div className="w-full h-48 bg-black/40 rounded-xl border border-blue-500/20 relative overflow-hidden flex items-end p-4">
      {/* Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* The Moving Line */}
      <svg className="w-full h-full z-10 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
        <motion.path
          d="M0,50 C20,45 30,30 50,25 C70,20 80,10 100,5"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Glowing Dot at the end */}
        <motion.circle 
            cx="100" cy="5" r="3" fill="#60a5fa"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 2 }}
        >
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        </motion.circle>
      </svg>
      
      {/* Area under curve gradient */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.5 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent clip-path-custom"
        style={{ clipPath: 'polygon(0 100%, 0% 100%, 100% 10%, 100% 100%)' }} 
      />
    </div>
  )
}

/* ===================== 2. TYPING TEXT EFFECT COMPONENT ===================== */
const TypingEffect = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("")
  
  // Reset when scrolled into view logic would go here, 
  // but for simplicity we run on mount/viewport entry
  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, index + 1))
      index++
      if (index > text.length) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [text])

  return <span>{displayed}<span className="animate-pulse">|</span></span>
}

/* ===================== 3. AMBIENT BACKGROUND (SUBTLE) ===================== */
const BackgroundScene = () => {
  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[4, -2, -10]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[5, 0.1, 16, 100]} />
          <meshBasicMaterial color="#1e40af" transparent opacity={0.2} />
        </mesh>
      </Float>
    </group>
  )
}

/* ===================== 4. REFACTORED VERTICAL SECTION ===================== */
const FeatureSection = ({ title, subtitle, icon: Icon, children, delay = 0 }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-20%" }}
      transition={{ duration: 0.8, delay }}
      className="w-full max-w-2xl mx-auto mb-32 px-6 flex flex-col items-center text-center"
    >
      <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.2)]">
        <Icon className="w-10 h-10 text-blue-400" />
      </div>
      
      <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{title}</h2>
      <p className="text-blue-100 text-lg md:text-xl font-medium mb-10 leading-relaxed max-w-lg opacity-90">
        {subtitle}
      </p>

      {/* VISUAL CONTAINER (BELOW TEXT) */}
      <div className="w-full transform transition-all duration-500 hover:scale-[1.02]">
        {children}
      </div>
    </motion.div>
  )
}

/* ===================== MAIN COMPONENT ===================== */
export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null)
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'use' | null>(null)
  
  // Hero Typing Logic
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const TEXTS = ['ENGINEER YOUR GPA', 'GUARANTEE YOUR GRADES', 'MASTER YOUR DEGREE']

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

  // Policy Content (Abbreviated for brevity, logic remains same)
  const getPolicyContent = () => { /* ... Keep your existing policy text logic here ... */ return <div className="text-slate-300">Policy Content Loaded</div> };
  const getPolicyTitle = () => { /* ... Keep your existing title logic here ... */ return "Policy" };

  return (
    <div className="bg-[#020205] min-h-screen relative overflow-x-hidden font-sans selection:bg-blue-500/30 pb-32">
      
      {/* 1. TOP HEADER (FIXED) */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#020205]/80 backdrop-blur-md border-b border-white/5">
        <div className="text-2xl font-black text-white tracking-tighter italic">GRECKO</div>
        <button 
          onClick={() => setAuthModalMode('login')}
          className="text-sm font-bold text-white/80 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10"
        >
          Sign In
        </button>
      </header>

      {/* 2. BACKGROUND 3D (Subtle & Fixed) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.5} />
          <BackgroundScene />
        </Canvas>
      </div>

      {/* 3. SCROLL CONTENT */}
      <div className="relative z-10 pt-32">
        
        {/* HERO */}
        <section className="min-h-[90vh] flex flex-col justify-center items-center text-center px-4 mb-20">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <h1 className="text-[15vw] md:text-[12vw] font-black text-white leading-none tracking-tighter mb-4">
              GRECKO
            </h1>
            <div className="h-10 md:h-16">
               <span className="text-xl md:text-3xl text-blue-400 font-mono font-bold">
                 {displayText}
                 <span className="animate-pulse">_</span>
               </span>
            </div>
            <p className="text-white/50 mt-8 max-w-md mx-auto">
              The Strategic Academic Operating System.
            </p>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-20 text-white/30"
          >
            <ChevronRight className="rotate-90 w-8 h-8" />
          </motion.div>
        </section>

        {/* SECTION 1: PREDICTIVE GPA (With Animated Graph) */}
        <FeatureSection 
          title="Predictive GPA"
          subtitle="Set your target. Watch the app calculate the exact path to hit your 4.0."
          icon={Target}
        >
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-xs text-blue-400 font-mono tracking-widest mb-1">CURRENT TRAJECTORY</div>
                <div className="text-5xl font-black text-white">3.8<span className="text-blue-500">2</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50 font-mono mb-1">TARGET</div>
                <div className="text-2xl font-bold text-white">4.00</div>
              </div>
            </div>
            {/* The Live Graph */}
            <LiveTrendGraph />
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {[94, 98, 92, 100].map((score, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 min-w-[80px] text-center border border-white/5">
                  <div className="text-[10px] text-white/40">Quiz {i+1}</div>
                  <div className="font-bold text-white">{score}%</div>
                </div>
              ))}
            </div>
          </div>
        </FeatureSection>

        {/* SECTION 2: AUTOMATED MASTERY (With Progress Animation) */}
        <FeatureSection 
          title="Automated Mastery"
          subtitle="AI Flashcards and Quizzes that adapt to your retention level in real-time."
          icon={Cpu}
        >
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
            
            <div className="space-y-6">
              {['Biology 101', 'Chemistry Lab', 'Calculus II'].map((subject, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between text-sm font-bold text-white">
                      <span>{subject}</span>
                      <span className="text-purple-400">Mastery: {85 + i*5}%</span>
                   </div>
                   <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${85 + i*5}%` }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                   </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
               <button className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2">
                  <Zap className="w-4 h-4 fill-black" /> START MASTERY SESSION
               </button>
            </div>
          </div>
        </FeatureSection>

        {/* SECTION 3: AI MENTOR (High Contrast & Typing) */}
        <FeatureSection 
          title="AI Mentor"
          subtitle="24/7 Strategic advice. It knows your grades, your goals, and exactly what you need to study next."
          icon={Brain}
        >
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white">Grecko AI</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Online
                </div>
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-2xl rounded-tl-none mb-4">
              <p className="text-blue-100 font-medium text-lg leading-relaxed">
                <TypingEffect text="I've analyzed your recent Chem quiz. To maintain your 4.0, you need to score at least a 94% on the Final. I've prepared a focused study set for you." />
              </p>
            </div>

            <div className="flex gap-2">
               <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors">
                  Show Study Set
               </button>
               <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors">
                  Calculate Odds
               </button>
            </div>
          </div>
        </FeatureSection>
      </div>

      {/* 4. BOTTOM FLOATING BAR (Sticky CTA) */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4 pb-8 pointer-events-none flex justify-center">
        <div className="w-full max-w-md pointer-events-auto flex flex-col gap-3">
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="bg-[#0f286e]/80 backdrop-blur-xl border border-white/20 p-2 rounded-[2rem] shadow-2xl flex items-center p-2 pr-2"
           >
              <button 
                 onClick={() => setAuthModalMode('signup')}
                 className="flex-1 bg-white text-black font-bold py-4 rounded-full text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                 Get Started
              </button>
           </motion.div>
           
           {/* Footer Links (Small) */}
           <div className="flex justify-center gap-4 text-[10px] text-white/40 font-medium uppercase tracking-widest bg-black/50 backdrop-blur-md py-2 rounded-full w-fit mx-auto px-6">
              <button onClick={() => setActivePolicy('privacy')} className="hover:text-white">Privacy</button>
              <button onClick={() => setActivePolicy('terms')} className="hover:text-white">Terms</button>
           </div>
        </div>
      </div>

      {/* 5. AUTH MODAL (Exact Reimplementation) */}
      <AnimatePresence>
        {authModalMode && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[2rem] p-6 shadow-2xl relative"
            >
               <button onClick={() => setAuthModalMode(null)} className="absolute top-6 right-6 text-white/50 hover:text-white">
                 <X />
               </button>
               
               <div className="text-center my-8">
                 <h2 className="text-3xl font-black text-white mb-2">
                    {authModalMode === 'signup' ? 'Join Grecko' : 'Welcome Back'}
                 </h2>
                 <p className="text-white/50">Your academic command center awaits.</p>
               </div>

               <div className="space-y-3">
                 <button onClick={onGoogleAuth} className="w-full py-4 bg-white text-black font-bold rounded-xl flex justify-center items-center gap-3">
                    <Zap className="fill-black w-4 h-4"/> Continue with Google
                 </button>
                 <button onClick={() => { authModalMode === 'signup' ? onSignupWithEmail() : onLoginWithEmail() }} className="w-full py-4 bg-white/10 text-white font-bold rounded-xl border border-white/10">
                    Use Email Address
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 6. POLICY MODAL (Same logic as before, just kept concise for this view) */}
      {/* ... Insert your existing policy modal code here ... */}
    </div>
  )
}

