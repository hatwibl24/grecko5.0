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
                  <p className="text-red-300 font-medium text-sm leading-relaxed">
                      <strong>Important:</strong> Violation of these rules may result in immediate account suspension or permanent termination.
                  </p>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">6. Account Termination</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko may suspend or terminate user accounts that violate these Terms.</li>
                  <li>Users may request deletion of their account, at which point all associated data will be removed from Supabase.</li>
                  <li>Users whose accounts are terminated may not attempt to create new accounts to circumvent suspensions.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">7. Data Collection and Privacy</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko collects user information, including name, email, password (encrypted), GPA, school grade, uploaded assignments, notes, and AI-generated content.</li>
                  <li>Data is stored securely in Supabase and used only for app functionality, AI processing, account management, and customer support.</li>
                  <li>Grecko does not sell user data. For more details, see the Privacy Policy.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">8. Service Availability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko may experience maintenance, updates, or downtime.</li>
                  <li>While we strive to provide uninterrupted service, Grecko does not guarantee 100% availability.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">9. Limitation of Liability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>The app and its services are provided “as is” without warranties of any kind.</li>
                  <li>Grecko is not responsible for academic outcomes, data loss, or any damages arising from the use of the app.</li>
                  <li>Users agree to use the app at their own risk.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">10. Changes to Terms</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko may update these Terms from time to time.</li>
                  <li>Major changes will be communicated to users via the app.</li>
                  <li>Continued use of the app after updates constitutes acceptance of the revised Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">11. Governing Law</h3>
              <p>These Terms are governed by the laws of the jurisdiction in which Grecko operates. Users agree that any disputes will be resolved in accordance with those laws.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">12. Contact Information</h3>
              <p>For questions or concerns regarding these Terms, contact:</p>
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
                <p>Welcome to Grecko, an educational app designed for middle school and above. These Terms of Use explain how you can use the app, what features are available, and what is expected of you as a user. By using Grecko, you agree to follow these rules.</p>
            </div>
            
            <div className="w-full h-px bg-white/10" />
            
            <section>
              <h3 className="font-bold text-white mb-3 text-lg">1. Creating Your Account</h3>
              <p className="mb-2 font-medium">To use Grecko:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Sign Up:</strong> Provide your name, email address, school grade, and optionally your GPA. Create a secure password. By signing up, you agree to the Terms of Use and the Privacy Policy.</li>
                  <li><strong>Profile Setup (Optional):</strong> You can add a short bio or learning goals. This helps Grecko provide more personalized AI study suggestions.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">2. Uploading and Managing Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>You can upload assignments, notes, and study materials to keep track of your work.</li>
                  <li>All uploaded content is securely stored in Supabase.</li>
                  <li>You own your content, but by uploading it, you allow Grecko to use it for app functionality, like AI suggestions and assignment tracking.</li>
                  <li>You can delete content or your account at any time.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">3. Using AI Study Tools</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko provides AI-generated summaries, suggestions, and study tips.</li>
                  <li>AI tools analyze your uploaded content or learning level to give helpful insights.</li>
                  <li>AI content is educational; it may not always be 100% accurate, so verify important information.</li>
                  <li>Misusing AI (e.g., generating inappropriate content) is prohibited.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">4. Tracking Progress</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko allows you to track assignments, grades, and study progress.</li>
                  <li>You can view past uploads, AI suggestions, and your GPA history.</li>
                  <li>Data is stored securely and used only to enhance your learning experience.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">5. Community Rules</h3>
              <p className="mb-2">To keep Grecko safe and helpful for everyone:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Do not upload harmful, illegal, or abusive content.</li>
                  <li>Do not cheat, plagiarize, or use AI-generated content dishonestly.</li>
                  <li>Respect other users; harassment, hate speech, or offensive content is prohibited.</li>
              </ul>
              <p className="mt-3 text-sm italic bg-white/5 p-3 rounded-lg border border-white/5">Grecko may remove content or suspend accounts that violate these rules.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">6. Account Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Keep your login credentials secure.</li>
                  <li>You are responsible for everything that happens under your account.</li>
                  <li>Report any security issues or unauthorized access to <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a> immediately.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">7. Service Availability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>The app may occasionally be unavailable due to updates or maintenance.</li>
                  <li>Features may change as the app improves.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">8. Privacy and Data</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko collects name, email, password (encrypted), GPA, school grade, assignments, notes, and AI-generated content.</li>
                  <li>All data is stored securely in Supabase.</li>
                  <li>Data is used only for AI suggestions, assignment tracking, account management, and support.</li>
                  <li>Users can request updates, deletion, or access to their data at any time via <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">9. Limitations</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko cannot guarantee academic results or learning outcomes.</li>
                  <li>You are responsible for your own studies and verifying AI suggestions.</li>
                  <li>Grecko is not liable for lost content or errors in AI-generated content.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">10. Account Termination</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Accounts may be suspended or deleted for violating rules.</li>
                  <li>You may request deletion of your account at any time, and all data will be removed from Supabase.</li>
                  <li>Terminated users may not create new accounts to bypass rules.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">11. Changes to Terms</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li>Grecko may update these Terms from time to time.</li>
                  <li>Users will be notified of major updates in the app.</li>
                  <li>Continued use after updates constitutes agreement to the revised Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">12. Achieving Your GPA with Grecko (Layman’s Terms)</h3>
              <p className="mb-2">Grecko is designed to help you achieve your desired GPA. For example, if you have only a few remaining tests or assignments, the app analyzes the subjects or tasks you have left and provides guidance to help you reach the GPA you want.</p>
              <p className="mb-2">You can start using Grecko at the beginning of the semester, mid-term, or any point during your studies, though we recommend starting at the beginning of the term for the best results.</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-500">
                  <li><strong>Mid-term use:</strong> Grecko focuses on your remaining subjects or assessments to help you maximize your grades and reach your goal.</li>
                  <li><strong>Beginning of term use:</strong> Grecko reviews all your subjects for the term and provides guidance to help you achieve your desired GPA across all courses.</li>
              </ul>
              <p className="mt-2">Grecko works by analyzing your coursework and providing tailored support to help you excel in your subjects and meet your academic goals.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-3 text-lg">13. Contact</h3>
              <p>For questions, feedback, or support, contact:</p>
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

  return (
    <div ref={containerRef} className="bg-[#020205] min-h-screen relative overflow-x-hidden font-sans selection:bg-blue-500/30 pb-32">
      
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
