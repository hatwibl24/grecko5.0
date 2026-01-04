'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Edges, Float } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X, Mail, Brain, Target, Cpu, ChevronLeft, TrendingUp, BookOpen, MessageSquare, AlertTriangle } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 3D CORE ENGINE ===================== */
const BlueprintCore = ({ scroll }: { scroll: any }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const mesh = meshRef.current as any
    const group = groupRef.current as any
    if (!mesh || !group) return

    const s = scroll.get()
    
    // Rotation logic
    mesh.rotation.y += 0.005 + s * 0.05
    mesh.rotation.x += 0.003

    // Dynamic Zoom based on scroll
    const zoom = 1 + s * 2.5
    group.scale.set(zoom, zoom, zoom)
    group.position.y = Math.sin(state.clock.elapsedTime) * 0.1
  })

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2, 1]} />
          <meshStandardMaterial
            color="#00f0ff"
            wireframe
            transparent
            opacity={0.3}
            emissive="#0044ff"
            emissiveIntensity={4}
          />
          <Edges color="#00f0ff" />
        </mesh>
      </Float>

      {/* Orbital Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.8, 0.01, 16, 100]} />
        <meshBasicMaterial color="#7000ff" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

/* ===================== FEATURE SECTIONS ===================== */
const InfoSection = ({ title, subtitle, details, progress, range, icon: Icon, dashboardSnippet }: any) => {
  const opacity = useTransform(progress, range, [0, 1, 1, 0])
  const scale = useTransform(progress, range, [0.8, 1, 1, 0.8])
  const x = useTransform(progress, range, [100, 0, 0, -100])

  return (
    <motion.section
      style={{ opacity, scale }}
      className="h-screen w-full flex flex-col md:flex-row items-center justify-between px-6 md:px-24 sticky top-0 pointer-events-none"
    >
      {/* Left Side: Content */}
      <div className="max-w-xl z-20 pointer-events-auto mt-20 md:mt-0">
        <div className="mb-6 inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-xl">
          <Icon className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">{title}</h2>
        <p className="text-blue-200 text-lg md:text-xl mb-10 leading-relaxed">{subtitle}</p>
        
        <div className="grid grid-cols-1 gap-4">
          {details.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              <p className="text-white text-sm font-medium">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Dashboard Snippet */}
      <motion.div style={{ x }} className="hidden md:block w-96 bg-black/40 border border-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl z-20">
        {dashboardSnippet}
      </motion.div>
    </motion.section>
  )
}

/* ===================== MAIN COMPONENT ===================== */
export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null)
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'use' | null>(null)
  
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 25 })

  const TEXTS = ['engineer your GPA', 'guarantee your grades', 'master your degree', 'ace every exam']

  // Typing Effect Logic
  useEffect(() => {
    const full = TEXTS[textIndex]
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(full.slice(0, displayText.length + 1))
        if (displayText === full) setTimeout(() => setIsDeleting(true), 1500)
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

  // Policy Content Logic (From Original)
  const getPolicyContent = () => {
    const contactEmail = "greckoinfor@gmail.com";
    switch(activePolicy) {
      case 'privacy':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed">
             <div><p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p><p>At Grecko, your privacy is our priority. This Privacy Policy explains what information we collect...</p></div>
             <div className="w-full h-px bg-zinc-800" />
             <section><h3 className="font-bold text-white mb-3 text-lg">1. Information We Collect</h3><ul className="list-disc pl-5 space-y-2 marker:text-slate-400"><li><strong>Personal Information:</strong> Name, Email, GPA.</li><li><strong>User Content:</strong> Assignments, notes.</li></ul></section>
             <section><h3 className="font-bold text-white mb-3 text-lg">2. How We Use Data</h3><p>Strictly to support your learning, generate AI suggestions, and manage your account.</p></section>
             {/* ... (Abbreviated for brevity, normally full text here) ... */}
             <section><h3 className="font-bold text-white mb-3 text-lg">Contact</h3><p>Email: <a href={`mailto:${contactEmail}`} className="text-blue-400">{contactEmail}</a></p></section>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed">
             <div><p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p><p>These Terms govern your use of Grecko. By using the app, you agree to these terms.</p></div>
             <div className="w-full h-px bg-zinc-800" />
             <section><h3 className="font-bold text-white mb-3 text-lg">1. Acceptance</h3><p>You agree to provide accurate information and use Grecko responsibly.</p></section>
             <section><h3 className="font-bold text-white mb-3 text-lg">Prohibited Activities</h3><div className="p-4 bg-red-900/20 border border-red-900/30 rounded-xl flex gap-3"><AlertTriangle className="text-red-400 shrink-0"/><p className="text-red-300 text-sm">Violation leads to suspension.</p></div></section>
          </div>
        );
      case 'use':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed">
             <div><p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p><p>Welcome to Grecko. These Terms of Use explain how you can use the app.</p></div>
             <div className="w-full h-px bg-zinc-800" />
             <section><h3 className="font-bold text-white mb-3 text-lg">Achieving Your GPA</h3><p>Grecko helps you engineer your GPA by analyzing remaining tasks.</p></section>
          </div>
        );
      default: return null;
    }
  };

  const getPolicyTitle = () => {
    switch(activePolicy) {
      case 'privacy': return "Privacy Policy";
      case 'terms': return "Terms of Service";
      case 'use': return "Terms of Use";
      default: return "";
    }
  }

  return (
    <div ref={containerRef} className="bg-[#020205] relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* 3D BACKGROUND (FIXED) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={2.5} />
          <Grid infiniteGrid fadeDistance={50} position={[0, -2, 0]} cellColor="#0044ff" sectionColor="#00f0ff" />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      {/* FIXED BOTTOM CTA (Original Style) */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-6 pointer-events-none flex flex-col items-center justify-end pb-8">
        <div className="w-full max-w-md pointer-events-auto">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0f286e]/60 backdrop-blur-md rounded-[2rem] p-6 pb-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
             <button 
               onClick={() => setAuthModalMode('signup')}
               className="w-full bg-white text-slate-900 font-bold text-lg py-4 rounded-full shadow-lg hover:bg-slate-50 active:scale-[0.98] transition-all mb-4"
             >
               Sign up
             </button>
             
             <button 
               onClick={() => setAuthModalMode('login')}
               className="w-full text-white font-medium hover:text-blue-200 transition-colors text-sm"
             >
               I have an account
             </button>
          </motion.div>

          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-blue-200/60 font-medium tracking-wide">
            <button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors">Terms of Service</button>
            <button onClick={() => setActivePolicy('use')} className="hover:text-white transition-colors">Terms of Use</button>
          </div>
        </div>
      </div>

      {/* SCROLL CONTENT */}
      <div className="relative z-10 pb-40">
        
        {/* HERO SECTION */}
        <section className="h-screen flex flex-col justify-center items-center text-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
            <h1 className="text-[15vw] md:text-[12vw] font-black text-white leading-none tracking-tighter">Grecko</h1>
            <div className="text-xl md:text-3xl text-blue-400 font-mono mt-4">
              THE SMART WAY TO <span className="text-white underline decoration-blue-500">{displayText}</span>
              <span className="animate-pulse">|</span>
            </div>
          </motion.div>
        </section>

        {/* SECTION 1: PREDICTIVE GPA */}
        <InfoSection
          range={[0.1, 0.25, 0.35, 0.45]}
          progress={smoothProgress}
          icon={Target}
          title="Predictive GPA Engineering"
          subtitle="Treat your degree like an engineering project. Grecko uses math to guarantee your outcome."
          details={['Set Target GPA (e.g., 4.0)', 'Live GPA Trend Tracking', 'Calculates required grades for every task']}
          dashboardSnippet={
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-xs text-blue-400 font-mono">TARGET_GPA</span>
                  <span className="text-3xl font-black text-white">4.00</span>
               </div>
               <div className="h-24 w-full bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="text-blue-500 w-12 h-12 opacity-50" />
               </div>
               <div className="text-center p-2 bg-blue-600 rounded-lg text-[10px] font-bold">
                 REQUIRED AVERAGE: 94%
               </div>
            </div>
          }
        />

        {/* SECTION 2: AUTOMATED MASTERY */}
        <InfoSection
          range={[0.4, 0.55, 0.65, 0.75]}
          progress={smoothProgress}
          icon={Cpu}
          title="Automated Mastery"
          subtitle="Don't just read. Convert course material into high-fidelity knowledge units."
          details={['Instant AI Flashcard generation', '10-Question Mastery Tests', 'Visual Learning Modules']}
          dashboardSnippet={
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-500/20 rounded-lg"><BookOpen className="text-purple-400 w-5 h-5"/></div>
                 <span className="text-sm font-bold">Biology Module 04</span>
               </div>
               <div className="space-y-2">
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 w-3/4" />
                 </div>
                 <div className="flex justify-between text-[10px] text-white/50">
                    <span>RETENTION LEVEL</span>
                    <span>75%</span>
                 </div>
               </div>
               <div className="w-full py-2 bg-white text-black text-[10px] font-black rounded-lg uppercase text-center">Start Quiz</div>
            </div>
          }
        />

        {/* SECTION 3: AI MENTOR */}
        <InfoSection
          range={[0.7, 0.8, 0.9, 0.95]}
          progress={smoothProgress}
          icon={Brain}
          title="Context-Aware Mentor"
          subtitle="A personal academic consultant that has access to your real-time performance data."
          details={['Strategic GPA improvement advice', 'Performance failure detection', '24/7 Guidance on any subject']}
          dashboardSnippet={
            <div className="space-y-3">
               <div className="p-3 bg-blue-600 rounded-t-xl rounded-br-xl text-[11px]">
                 "You need a 92% on your next Chem quiz to keep your 4.0 target."
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center"><MessageSquare className="w-3 h-3 text-black"/></div>
                  <div className="h-3 w-24 bg-white/10 rounded-full" />
               </div>
            </div>
          }
        />

        {/* EXTRA SECTION: THE BLUEPRINT (Bridge to Footer) */}
        <section className="h-screen flex flex-col justify-center items-center text-center px-6">
          <div className="max-w-2xl bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
             <h3 className="text-3xl font-black text-white mb-4">The Strategic OS</h3>
             <p className="text-blue-200 mb-6">
               Grecko isn't just a place to store notes. It sits on top of your existing schoolwork to provide the infrastructure—the math and the logic—needed to guarantee a specific grade outcome.
             </p>
             <div className="flex justify-center gap-4 text-xs font-mono text-blue-400">
               <span>• DATA DRIVEN</span>
               <span>• INFRASTRUCTURE</span>
               <span>• OUTCOME FOCUSED</span>
             </div>
          </div>
          <div className="h-40" /> {/* Spacer for fixed footer */}
        </section>

      </div>

      {/* AUTH MODAL (Restored Original) */}
      <AnimatePresence>
        {authModalMode && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0c] rounded-[2rem] p-6 shadow-2xl relative border border-white/10"
            >
              <button
                onClick={() => setAuthModalMode(null)}
                className="absolute top-5 right-5 p-1 bg-zinc-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 mt-2">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {authModalMode === 'signup' ? 'Sign up' : 'Sign in'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {authModalMode === 'signup' 
                    ? 'Create your account to start improving your grades' 
                    : 'Sign in to continue improving your grades'}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    onGoogleAuth();
                    setAuthModalMode(null);
                  }}
                  className="w-full bg-white text-black font-semibold text-lg py-3.5 rounded-full flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {authModalMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </button>

                <button
                  onClick={() => {
                    if (authModalMode === 'signup') {
                      onSignupWithEmail();
                    } else {
                      onLoginWithEmail();
                    }
                    setAuthModalMode(null);
                  }}
                  className="w-full bg-black border border-white/20 text-white font-semibold text-lg py-3.5 rounded-full flex items-center justify-center gap-3 hover:bg-zinc-900 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  {authModalMode === 'signup' ? 'Sign up with Email' : 'Sign in with Email'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POLICY MODAL (Full Screen Slide Up) */}
      <AnimatePresence>
        {activePolicy && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[#0a0a0c] flex flex-col"
          >
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                     <button onClick={() => setActivePolicy(null)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <ChevronLeft className="w-6 h-6" />
                     </button>
                     <h2 className="text-xl font-bold text-white">{getPolicyTitle()}</h2>
                </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-2xl mx-auto pb-12">
                   {getPolicyContent()}

                   <div className="mt-12 pt-8 border-t border-white/10">
                        <button 
                            onClick={() => setActivePolicy(null)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                        >
                            I understand
                        </button>
                   </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


