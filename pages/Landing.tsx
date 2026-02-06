'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Edges, Float } from '@react-three/drei'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X, Mail, ChevronRight, Target, Cpu, Brain, Zap, AlertTriangle, ChevronLeft } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 1. ORIGINAL 3D BLUEPRINT CORE ===================== */
const BlueprintCore = ({ scroll }: { scroll: any }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const mesh = meshRef.current as any
    const group = groupRef.current as any
    if (!mesh || !group) return

    const s = scroll.get()
    
    // Original rotation logic linked to scroll
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

/* ===================== 2. REAL ANIMATED GRAPH COMPONENT ===================== */
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
        className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent"
        style={{ clipPath: 'polygon(0 100%, 0% 100%, 100% 10%, 100% 100%)' }} 
      />
    </div>
  )
}

/* ===================== 3. TYPING TEXT EFFECT COMPONENT ===================== */
const TypingEffect = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("")
  
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

/* ===================== 4. VERTICAL SECTION (Fixed Layout) ===================== */
const FeatureSection = ({ title, subtitle, icon: Icon, children, delay = 0 }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-10%" }} // Re-triggers on scroll
      transition={{ duration: 0.8, delay }}
      className="w-full max-w-2xl mx-auto mb-40 px-6 flex flex-col items-center text-center relative z-10"
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
  
  // 1. SCROLL HOOKS FOR 3D ENGINE
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 25 })

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

  // ===================== POLICY CONTENT INJECTION =====================
  const getPolicyTitle = () => {
    switch(activePolicy) {
        case 'privacy': return "Privacy Policy";
        case 'terms': return "Terms of Service";
        case 'use': return "Terms of Use";
        default: return "";
    }
  }

  const getPolicyContent = () => {
    const contactEmail = "greckoinfor@gmail.com";

    switch(activePolicy) {
      case 'privacy':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed text-left">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>At Grecko, your privacy is our priority. This Privacy Policy explains what information we collect from users, how we use it, how we protect it, and your rights regarding your data when using Grecko. By using Grecko, you agree to the practices described in this policy.</p>
            </div>
            
            <div className="w-full h-px bg-white/10" />
            
            <section>
              <h3 className="font-bold text-white mb-3 text-lg">1. Information We Collect</h3>
              <p className="mb-2 font-medium">Grecko collects information that is necessary to provide and improve our educational services:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Personal Information Provided by Users:</strong> Name, Email address, Password (stored securely using encryption), School grade and academic GPA.</li>
                  <li><strong>User-Generated Content:</strong> Uploaded assignments, notes, and other study materials, AI-generated study suggestions, summaries, or responses.</li>
              </ul>
              <p className="mt-3 text-sm italic bg-white/5 p-3 rounded-lg border border-white/5">Note: All information is collected only to provide the educational features of Grecko.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">2. How We Use Your Information</h3>
              <p className="mb-2 font-medium">We use your information strictly to support your learning and account functionality:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Account Creation & Management:</strong> Manage user accounts and allow login securely.</li>
                  <li><strong>AI Learning Assistance:</strong> Generate AI study suggestions and educational content personalized for you.</li>
                  <li><strong>Assignment & Content Storage:</strong> Store and retrieve uploaded assignments, notes, and AI responses.</li>
                  <li><strong>Customer Support:</strong> Respond to inquiries or issues regarding account access, assignments, or app functionality.</li>
                  <li><strong>Security:</strong> Protect accounts from unauthorized access.</li>
              </ul>
              <p className="mt-2 font-medium text-white">Grecko does not use your data for advertising or sell it to third parties.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">3. How We Store & Protect Data</h3>
              <p className="mb-2 font-medium">Your data is stored securely and handled carefully:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Supabase Database:</strong> All user data, including assignments and AI-generated content, is stored securely in Supabase.</li>
                  <li><strong>Encrypted Passwords:</strong> Passwords are encrypted to prevent unauthorized access.</li>
                  <li><strong>Access Control:</strong> Only authorized systems or personnel can access user data for app functionality or support.</li>
                  <li><strong>Backups & Security Measures:</strong> Regular backups and security updates ensure your information is safe.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">4. Sharing of Data</h3>
              <p className="mb-2 font-medium">We respect your privacy. Your data is only shared in the following limited cases:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Trusted Services:</strong> With Supabase for secure data storage and email services for account notifications.</li>
                  <li><strong>Legal Requirements:</strong> If required by law or legal process.</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user information may be transferred under privacy-compliant procedures.</li>
              </ul>
              <p className="mt-2 font-medium text-white">We never sell your data to third parties.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">5. User Rights and Choices</h3>
              <p className="mb-2 font-medium">You have the right to control your data:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold.</li>
                  <li><strong>Correction:</strong> Update or correct personal information, including name, email, or GPA.</li>
                  <li><strong>Deletion:</strong> Delete your account and remove all associated data from Grecko.</li>
                  <li><strong>Contact:</strong> Any requests regarding data can be made via <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">6. Data Retention</h3>
              <p>We keep your data only as long as needed to provide our services. Once your account is deleted or your data is no longer necessary, it is securely removed from Supabase.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">7. Changes to This Privacy Policy</h3>
              <p>We may update this Privacy Policy from time to time to reflect changes in our app or legal requirements. Major changes will be communicated in the app. Continued use of Grecko constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">8. Contact Us</h3>
              <p>For any questions, concerns, or requests regarding this Privacy Policy or your data, contact:</p>
              <p className="mt-2 bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-500/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed text-left">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>These Terms of Service (“Terms”) govern your use of the Grecko app and related services. By accessing or using Grecko, you agree to comply with these Terms. Please read them carefully.</p>
            </div>
            
            <div className="w-full h-px bg-white/10" />
            
            <section>
              <h3 className="font-bold text-white mb-3 text-lg">1. Acceptance of Terms</h3>
              <p className="mb-2 font-medium">By creating an account or using Grecko, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Provide accurate and truthful information, including your name, email address, school grade, and GPA.</li>
                  <li>Comply with these Terms and all applicable laws.</li>
                  <li>Use Grecko in a responsible and respectful manner.</li>
              </ul>
              <p className="mt-2">If you do not agree with these Terms, you may not use Grecko.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">2. User Accounts</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Users must register an account to access the app’s features.</li>
                  <li>Users are responsible for maintaining the confidentiality of their login credentials.</li>
                  <li>Users are responsible for all activity that occurs under their account.</li>
                  <li>Grecko reserves the right to suspend or terminate accounts for violations of these Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">3. User-Generated Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Ownership:</strong> Users retain full ownership of all content uploaded to the app, including assignments, notes, and other study materials.</li>
                  <li><strong>License to Grecko:</strong> By uploading content, users grant Grecko a non-exclusive license to store, display, and use such content for app functionality, including AI processing, assignment management, and account display.</li>
                  <li><strong>Prohibited Content:</strong> Content that is illegal, abusive, harmful, or violates any laws may be removed by Grecko at its discretion.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">4. AI-Generated Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko provides AI-generated study suggestions, summaries, and recommendations for educational purposes.</li>
                  <li>AI-generated content may not always be accurate, complete, or suitable for all situations. Users are responsible for verifying important information.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">5. Prohibited Activities</h3>
              <p className="mb-2">Users are prohibited from:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Hacking, reverse engineering, or attempting to disrupt the app.</li>
                  <li>Spamming or sending unsolicited messages.</li>
                  <li>Impersonating other users or Grecko staff.</li>
                  <li>Misusing AI features to generate inappropriate or harmful content.</li>
                  <li>Engaging in academic dishonesty, including cheating, plagiarism, or submitting AI-generated content as original work.</li>
              </ul>
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p>Violations of these rules may result in immediate account termination.</p>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">6. Payments and Subscriptions</h3>
              <p>Grecko may offer premium features or subscription services. Payments are processed securely through our payment provider. By purchasing, you agree to any additional payment terms provided at the time of purchase.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">7. Limitation of Liability</h3>
              <p>Grecko is provided “as is” without warranties of any kind. Grecko is not liable for academic outcomes, lost data, or damages arising from use of the app.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">8. Termination</h3>
              <p>Grecko reserves the right to suspend or terminate access to the app at any time for violations of these Terms.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">9. Contact</h3>
              <p>If you have questions about these Terms, contact:</p>
              <p className="mt-2 bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-500/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      case 'use':
        return (
          <div className="space-y-8 text-slate-300 leading-relaxed text-left">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>These Terms of Use describe how Grecko can be used responsibly and effectively for educational purposes. By using Grecko, you agree to the following guidelines:</p>
            </div>
            
            <div className="w-full h-px bg-white/10" />
            
            <section>
              <h3 className="font-bold text-white mb-3 text-lg">1. Educational Purpose Only</h3>
              <p>Grecko is intended solely as an educational support platform. It should not be used to facilitate cheating, plagiarism, or academic dishonesty.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">2. Responsible Use of AI</h3>
              <p>AI-generated suggestions are meant to help you study more effectively, not replace your own learning. Always verify important content.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">3. Uploading Content</h3>
              <p>Only upload content you own or are authorized to use. Do not upload copyrighted or sensitive information.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">4. Community Guidelines</h3>
              <p>Use respectful language when interacting with support or other users. Harassment or abuse is not tolerated.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">5. Data Security</h3>
              <p>Keep your login credentials secure.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">6. Updates</h3>
              <p>We may update these Terms of Use as features evolve. Continued use of Grecko means you accept the updates.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">7. Contact</h3>
              <p>For any questions, contact:</p>
              <p className="mt-2 bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-500/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  const platformHighlights = [
    {
      title: 'GPA Intelligence',
      description: 'Forecast outcomes, track every assessment, and map the clearest route to your target GPA.',
      icon: Target,
    },
    {
      title: 'Adaptive Study Tools',
      description: 'Flashcards, quizzes, and notes that adapt to how you learn, not just what you learn.',
      icon: Cpu,
    },
    {
      title: 'Always-on Mentor',
      description: 'A calm AI advisor that aligns daily study with your long-term academic goals.',
      icon: Brain,
    },
  ]

  return (
    <div ref={containerRef} className="bg-[#020205] min-h-screen relative overflow-x-hidden font-sans selection:bg-blue-500/30 pb-32">
      
      {/* 1. TOP HEADER (FIXED) */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-5 flex justify-between items-center bg-[#05050a]/70 backdrop-blur-xl border-b border-white/5">
        <div className="text-lg sm:text-xl font-semibold text-white tracking-[0.2em] uppercase">Grecko</div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
          <a href="#platform" className="hover:text-white transition-colors">Platform</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#mentor" className="hover:text-white transition-colors">Mentor</a>
        </nav>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAuthModalMode('login')}
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 bg-white/5"
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthModalMode('signup')}
            className="hidden sm:inline-flex text-sm font-semibold text-black bg-white rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(255,255,255,0.18)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* 2. RESTORED 3D BACKGROUND (BLUEPRINT CORE) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2.5} />
          <Grid 
            infiniteGrid 
            fadeDistance={50} 
            position={[0, -2, 0]} 
            cellColor="#0044ff" 
            sectionColor="#00f0ff" 
          />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      {/* 3. SCROLL CONTENT */}
      <div className="relative z-10 pt-32">
        
        {/* HERO */}
        <section id="top" className="min-h-[92vh] flex flex-col justify-center items-center text-center px-6 mb-24">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-xs md:text-sm uppercase tracking-[0.4em] text-white/45 mb-6">
              Student Companion Platform
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-[7.5rem] font-semibold text-white leading-[0.95] tracking-tight mb-6">
              Create calm focus
              <span className="block text-white/90">for every semester.</span>
            </h1>
            <div className="h-10 md:h-16">
               <span className="text-xl md:text-3xl text-blue-400 font-mono font-bold">
                 {displayText}
                 <span className="animate-pulse">_</span>
               </span>
            </div>
            <p className="text-white/60 mt-8 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
              Grecko keeps your plan, progress, and study momentum in one elegant workspace, so you always know what to do next.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setAuthModalMode('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold shadow-[0_20px_60px_rgba(255,255,255,0.18)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Create your account
              </button>
              <button
                onClick={() => setAuthModalMode('login')}
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/15 text-white/80 font-semibold hover:text-white hover:border-white/40 transition-colors"
              >
                Sign in
              </button>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/35">
              Built for students who want clarity
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

        {/* PLATFORM OVERVIEW */}
        <section id="platform" className="px-6 mb-32">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Platform</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-white">All of your academic tools, one calm interface.</h2>
              </div>
              <p className="text-white/50 max-w-xl leading-relaxed">
                Grecko blends planning, performance tracking, and intelligent study support into a refined experience that feels effortless.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {platformHighlights.map((highlight) => {
                const Icon = highlight.icon
                return (
                  <div
                    key={highlight.title}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{highlight.title}</h3>
                    <p className="text-white/50 leading-relaxed">{highlight.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <div id="features" />
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
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            <div className="space-y-6 relative z-10">
              {['Biology 101', 'Chemistry Lab', 'Calculus II'].map((subject, i) => (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="space-y-2"
                >
                   <div className="flex justify-between text-sm font-bold text-white">
                      <span>{subject}</span>
                      <span className="text-purple-400">Mastery: {85 + i*5}%</span>
                   </div>
                   <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${85 + i*5}%` }}
                        transition={{ duration: 1.6, delay: 0.3 + i * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-10 bg-white/40 blur-md"
                        initial={{ x: '-40%' }}
                        animate={{ x: '160%' }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                      />
                   </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
               >
                  <Zap className="w-4 h-4 fill-black" /> START MASTERY SESSION
               </motion.button>
            </div>
          </div>
        </FeatureSection>

        {/* SECTION 3: AI MENTOR (High Contrast & Typing) */}
        <div id="mentor" />
        <FeatureSection 
          title="AI Mentor"
          subtitle="24/7 Strategic advice. It knows your grades, your goals, and exactly what you need to study next."
          icon={Brain}
        >
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl text-left relative overflow-hidden">
            <motion.div
              aria-hidden="true"
              className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl"
              animate={{ y: [0, 12, 0], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <motion.div
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center"
                animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 0 rgba(59,130,246,0)', '0 0 20px rgba(59,130,246,0.6)', '0 0 0 rgba(59,130,246,0)'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Brain className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <div className="font-bold text-white">Grecko AI</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Online
                </div>
              </div>
            </div>

            {/* Chat Bubble */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-2xl rounded-tl-none mb-4 relative z-10"
            >
              <p className="text-blue-100 font-medium text-lg leading-relaxed">
                <TypingEffect text="I've analyzed your recent Chem quiz. To maintain your 4.0, you need to score at least a 94% on the Final. I've prepared a focused study set for you." />
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex gap-2 relative z-10"
            >
               <motion.button
                 whileHover={{ y: -2 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
               >
                  Show Study Set
               </motion.button>
               <motion.button
                 whileHover={{ y: -2 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
               >
                  Calculate Odds
               </motion.button>
            </motion.div>
          </div>
        </FeatureSection>
        
        {/* 5. NEW DESKTOP FOOTER CTA (Visible only on Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center py-24 px-4 text-center z-10 relative">
             <div className="max-w-xl w-full">
                <h2 className="text-4xl font-black text-white mb-8">Ready to dominate?</h2>
                <button 
                  onClick={() => setAuthModalMode('signup')}
                  className="w-full bg-white text-black font-black text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Start Your Semester
                </button>
                <div className="flex justify-center gap-6 mt-8 text-sm text-white/30 font-bold uppercase tracking-widest">
                  <button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors">Privacy</button>
                  <button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors">Terms</button>
                  <button onClick={() => setActivePolicy('use')} className="hover:text-white transition-colors">Use</button>
                </div>
             </div>
        </div>
      </div>

      {/* 4. BOTTOM FLOATING BAR (Sticky CTA - Mobile Only) */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4 pb-8 pointer-events-none flex justify-center md:hidden">
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
           
           {/* Footer Links (Mobile Small) */}
           <div className="flex justify-center gap-4 text-[10px] text-white/40 font-medium uppercase tracking-widest bg-black/50 backdrop-blur-md py-2 rounded-full w-fit mx-auto px-6">
              <button onClick={() => setActivePolicy('privacy')} className="hover:text-white">Privacy</button>
              <button onClick={() => setActivePolicy('terms')} className="hover:text-white">Terms</button>
           </div>
        </div>
      </div>

      {/* 5. AUTH MODAL */}
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
      
      {/* 6. POLICY MODAL (Full Screen Slide Up) */}
      <AnimatePresence>
        {activePolicy && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] bg-[#0a0a0c] flex flex-col"
          >
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                     <button onClick={() => setActivePolicy(null)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        {/* Corrected Back Icon */}
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
