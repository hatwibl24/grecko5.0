'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid, Edges } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { X, Mail, Brain, Target, Cpu, Zap, GraduationCap } from 'lucide-react'

interface LandingProps {
  onLoginWithEmail: () => void
  onSignupWithEmail: () => void
  onGoogleAuth: () => void
}

/* ===================== 3D CORE ===================== */
const BlueprintCore = ({ scroll }: { scroll: any }) => {
  const meshRef = useRef<any>(null)
  const groupRef = useRef<any>(null)

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return

    const s = scroll.get()
    meshRef.current.rotation.y += 0.005 + s * 0.04
    meshRef.current.rotation.x += 0.003

    const zoom = 1 + s * 3.5
    groupRef.current.scale.set(zoom, zoom, zoom)
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2
  })

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
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

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#7000ff" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

/* ===================== INFO SECTION ===================== */
interface InfoSectionProps {
  title: string
  subtitle: string
  details: string[]
  progress: any
  range: number[]
  icon: React.ComponentType<any>
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, subtitle, details, progress, range, icon: Icon }) => {
  const opacity = useTransform(progress, range, [0, 1, 1, 0])
  const y = useTransform(progress, range, [80, 0, 0, -80])
  const scale = useTransform(progress, range, [0.9, 1, 1, 0.9])

  return (
    <motion.section style={{ opacity, y, scale }} className="h-screen flex flex-col justify-center items-center px-6 text-center">
      <div className="mb-6 p-5 rounded-3xl bg-blue-600/10 border border-blue-400/20 backdrop-blur-xl">
        <Icon className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-5xl font-black text-white mb-4">{title}</h2>
      <p className="text-blue-200 text-xl max-w-xl mb-10">{subtitle}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {details.map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
            <div className="text-blue-500 font-mono text-[10px] mb-2">Module {i + 1}</div>
            <p className="text-white text-sm">{item}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

/* ===================== LANDING ===================== */
export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 20 })

  const TEXTS = ['improve your grades', 'raise your GPA', 'master your courses', 'ace your exams']

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
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timer)
  }, [displayText, isDeleting, textIndex])

  return (
    <div ref={containerRef} className="bg-[#020205] relative overflow-x-hidden">
      {/* 3D BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={2.5} />
          <Grid infiniteGrid fadeDistance={40} position={[0, -2, 0]} />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
        {/* HERO */}
        <section className="h-screen flex flex-col justify-center items-center text-center px-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-8xl font-black text-white mb-4">Grecko</h1>
            <div className="text-3xl text-white/80">
              The smart way to {displayText}
              <span className="text-blue-400 animate-pulse">|</span>
            </div>
          </motion.div>
        </section>

        <InfoSection
          range={[0.1, 0.25, 0.35, 0.45]}
          progress={smoothProgress}
          icon={Target}
          title="Predictive GPA Engineering"
          subtitle="Treat your degree like an engineering system."
          details={['Live GPA blueprint', 'Exact grades required', 'Early failure detection']}
        />

        <InfoSection
          range={[0.4, 0.55, 0.65, 0.75]}
          progress={smoothProgress}
          icon={Cpu}
          title="Automated Mastery"
          subtitle="Convert material into structured knowledge."
          details={['AI flashcards', 'Mastery quizzes', 'Visual modules']}
        />

        <InfoSection
          range={[0.7, 0.85, 0.9, 0.95]}
          progress={smoothProgress}
          icon={Brain}
          title="AI Mentor"
          subtitle="Context-aware academic guidance."
          details={['Strategic advice', 'Performance analysis', '24/7 mentorship']}
        />

        {/* CTA */}
        <section className="h-screen flex justify-center items-center">
          <div className="bg-blue-900/10 p-12 rounded-[3rem] text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-6 text-white" />
            <button
              onClick={() => setAuthModal('signup')}
              className="bg-white text-black font-bold px-12 py-4 rounded-full"
            >
              Sign Up
            </button>
          </div>
        </section>
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0c] p-10 rounded-3xl relative"
            >
              <button onClick={() => setAuthModal(null)} className="absolute top-6 right-6">
                <X />
              </button>
              <button onClick={onGoogleAuth} className="w-full mb-4 flex items-center justify-center gap-2">
                <Zap /> Google Auth
              </button>
              <button
                onClick={() => {
                  authModal === 'signup' ? onSignupWithEmail() : onLoginWithEmail()
                  setAuthModal(null)
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Mail /> Email Auth
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
