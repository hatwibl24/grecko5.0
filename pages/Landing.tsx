import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Grid, Float, Edges, MeshDistortMaterial } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import * as THREE from 'three';
import { X, Mail, Brain, Target, Cpu, Zap, GraduationCap, ChevronRight } from 'lucide-react';

interface LandingProps {
  onLoginWithEmail: () => void;
  onSignupWithEmail: () => void;
  onGoogleAuth: () => void;
}

// --- 3D BLUEPRINT COMPONENTS ---

const BlueprintCore = ({ scroll }: { scroll: any }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    const s = scroll.get();
    // Rotate and "Scale up" as we enter the OS
    meshRef.current.rotation.y += 0.005 + (s * 0.04);
    meshRef.current.rotation.x += 0.003;
    const zoomScale = 1 + s * 3.5;
    groupRef.current.scale.set(zoomScale, zoomScale, zoomScale);
    // Vertical drift
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {/* Central "Command Hub" */}
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
      
      {/* Data Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#7000ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// --- SCROLL CONTENT SECTION ---

const InfoSection = ({ title, subtitle, details, progress, range, icon: Icon }: {
  title: string;
  subtitle: string;
  details: string[];
  progress: any;
  range: [number, number, number, number];
  icon: any;
}) => {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [80, 0, 0, -80]);
  const scale = useTransform(progress, range, [0.9, 1, 1, 0.9]);

  return (
    <motion.section style={{ opacity, y, scale }} className="h-screen flex flex-col justify-center items-center px-6 text-center">
      <div className="mb-6 p-5 rounded-3xl bg-blue-600/10 border border-blue-400/20 backdrop-blur-xl">
        <Icon className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-5xl font-black text-white tracking-tighter mb-4">{title}</h2>
      <p className="text-blue-200 text-xl max-w-xl font-light mb-10 leading-relaxed">{subtitle}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {details.map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-left backdrop-blur-md">
            <div className="text-blue-500 font-mono text-[10px] uppercase tracking-widest mb-2">Module {i+1}</div>
            <p className="text-white font-medium text-sm leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 20 });

  const ROTATING_TEXTS = ["improve your grades", "raise your GPA", "master your courses", "ace your exams"];

  useEffect(() => {
    const currentFullText = ROTATING_TEXTS[textIndex];
    let timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        if (displayText === currentFullText) setTimeout(() => setIsDeleting(true), 2000);
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
        }
      }
    }, isDeleting ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex]);

  return (
    <div ref={containerRef} className="bg-[#020205] relative selection:bg-blue-500/30 overflow-x-hidden font-sans">
      
      {/* 1. THE 3D BLUEPRINT LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} color="#00f0ff" intensity={2.5} />
          
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            sectionSize={5} 
            sectionColor="#0044ff" 
            cellColor="#001133" 
            position={[0, -2, 0]} 
          />
          <BlueprintCore scroll={smoothProgress} />
        </Canvas>
      </div>

      {/* 2. THE CONTENT LAYER */}
      <div className="relative z-10">
        
        {/* HERO */}
        <section className="h-screen flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <h1 className="text-8xl font-black text-white tracking-tighter mb-4">Grecko</h1>
            <p className="text-blue-500 font-mono tracking-[0.4em] uppercase text-[10px] mb-8">Strategic Academic Operating System</p>
            <div className="text-2xl md:text-3xl font-bold text-white/80 h-10">
              The smart way to {displayText}<span className="animate-pulse text-blue-400">|</span>
            </div>
          </motion.div>
          <div className="absolute bottom-12 flex flex-col items-center opacity-30">
             <div className="w-px h-20 bg-gradient-to-b from-blue-500 to-transparent" />
          </div>
        </section>

        {/* SECTION 1: GPA ENGINEERING */}
        <InfoSection 
          range={[0.1, 0.25, 0.35, 0.45]}
          progress={smoothProgress}
          icon={Target}
          title="Predictive GPA Engineering"
          subtitle="Stop wondering. Treat your degree like an engineering project with guaranteed outcomes."
          details={[
            "Input 'Subjects Offered' vs 'Completed' to generate your Live GPA Blueprint.",
            "Set a 4.0 target; we calculate every specific assignment grade needed to hit it.",
            "Visual GPA Trend projection identifies slips before they happen."
          ]}
        />

        {/* SECTION 2: AUTOMATED MASTERY */}
        <InfoSection 
          range={[0.4, 0.55, 0.65, 0.75]}
          progress={smoothProgress}
          icon={Cpu}
          title="Automated Mastery Tools"
          subtitle="Turn raw study material into organized data for deeper retention."
          details={[
            "AI Flashcards: Instantly generated from your course notes and textbooks.",
            "Mastery Quizzes: 10-question logic tests to verify knowledge before exams.",
            "Visual Modules: High-fidelity organization for Chemistry, Biology, and Math."
          ]}
        />

        {/* SECTION 3: AI MENTORSHIP */}
        <InfoSection 
          range={[0.7, 0.85, 0.9, 0.95]}
          progress={smoothProgress}
          icon={Brain}
          title="Context-Aware AI Mentor"
          subtitle="A strategic consultant with direct access to your academic performance data."
          details={[
            "Strategic Advice: Ask 'How can I improve?' for data-driven study paths.",
            "Performance Analysis: The AI detects which modules need 20% more focus.",
            "24/7 Consultation: Constant guidance to keep you on the path to success."
          ]}
        />

        {/* CTA FINAL FOOTER */}
        <section className="h-screen flex flex-col items-center justify-center px-6">
          <motion.div 
            whileInView={{ scale: [0.9, 1.02, 1] }}
            className="w-full max-w-md bg-blue-900/10 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 shadow-2xl text-center"
          >
            <GraduationCap className="w-16 h-16 text-white mx-auto mb-8" />
            <h2 className="text-4xl font-bold text-white mb-10 tracking-tight text-white">Access Command Center</h2>
            <button 
              onClick={() => setAuthModal('signup')}
              className="w-full bg-white text-black font-black py-5 rounded-full hover:bg-blue-50 transition-all mb-4 text-lg shadow-xl"
            >
              Sign Up
            </button>
            <button 
              onClick={() => setAuthModal('login')}
              className="text-blue-300 font-medium hover:text-white transition-colors"
            >
              I have an account
            </button>
          </motion.div>

          <div className="mt-16 flex gap-10 text-[10px] font-bold text-blue-200/30 uppercase tracking-[0.3em]">
            <button className="hover:text-blue-400 transition-colors">Privacy</button>
            <button className="hover:text-blue-400 transition-colors">Terms</button>
            <button className="hover:text-blue-400 transition-colors">Support</button>
          </div>
        </section>
      </div>

      {/* AUTH MODAL INTEGRATION */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020205]/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0c] border border-white/10 p-10 rounded-[2.5rem] w-full max-w-sm relative"
            >
              <button onClick={() => setAuthModal(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-white text-center mb-10 text-white">{authModal === 'signup' ? 'Create Account' : 'Welcome Back'}</h3>
              <div className="space-y-4">
                <button 
                  onClick={onGoogleAuth}
                  className="w-full bg-white text-black font-bold py-4 rounded-full flex justify-center gap-3 items-center hover:bg-zinc-200 transition-colors shadow-lg"
                >
                  <Zap className="w-4 h-4 fill-current"/> Google Auth
                </button>
                <button 
                  onClick={() => {
                    if (authModal === 'signup') onSignupWithEmail();
                    else onLoginWithEmail();
                    setAuthModal(null);
                  }}
                  className="w-full bg-zinc-900 text-white font-bold py-4 rounded-full flex justify-center gap-3 items-center border border-white/5 hover:bg-zinc-800 transition-colors shadow-lg"
                >
                  <Mail className="w-4 h-4"/> Email Auth
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
