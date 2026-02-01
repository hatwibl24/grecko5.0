import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  Plus, 
  MessageSquare, 
  X, 
  Clock, 
  Trash2, 
  Menu, 
  Loader2, 
  Sparkles, 
  StopCircle 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, User, Assignment, AcademicGoals, QuizResult, Course } from '../types';
import { supabase } from '../lib/supabase';

// --- TYPES ---

interface AiMentorProps {
  user: User;
  assignments: Assignment[];
  academicGoals: AcademicGoals;
  quizResults: QuizResult[];
  courses: Course[];
  onViewCourse: (courseId: string) => void;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}

// --- CUSTOM COMPONENTS ---

/**
 * Gemini-style Gradient Icon
 */
const AiIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 4V20M4 12H20" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 7L7 17" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M7 7L17 17" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <defs>
      <linearGradient id="ai-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" /> {/* Blue-400 */}
        <stop offset="1" stopColor="#A78BFA" /> {/* Purple-400 */}
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Loading Animation Dots
 */
const LoadingDots = () => (
  <div className="flex space-x-1 p-2">
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
  </div>
);

/**
 * StreamableMarkdown
 * Simulates word-by-word streaming for the 'Living' AI feel.
 */
const StreamableMarkdown = ({ 
  content, 
  isStreaming, 
  onComplete,
  components 
}: { 
  content: string; 
  isStreaming: boolean; 
  onComplete?: () => void;
  components: any;
}) => {
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? '' : content);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // Initialize streaming
    wordsRef.current = content.split(/(?=[ \n])/); // Split preserving whitespace
    indexRef.current = 0;
    setDisplayedContent('');

    intervalRef.current = setInterval(() => {
      if (indexRef.current < wordsRef.current.length) {
        setDisplayedContent((prev) => prev + wordsRef.current[indexRef.current]);
        indexRef.current++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      }
    }, 20); // Adjust speed here (lower = faster)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, isStreaming, onComplete]);

  return (
    <div className="min-h-[20px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const AiMentor: React.FC<AiMentorProps> = ({ user, assignments, academicGoals, quizResults, courses, onViewCourse }) => {
  
  // --- STATE ---
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('new');
  
  // Status Flags
  const [isTyping, setIsTyping] = useState(false); // Waiting for API
  const [isStreaming, setIsStreaming] = useState(false); // Visual typing effect
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Data
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  
  // UI Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_PROJECT_URL = 'https://uopitdnufrnxkhhhdtxk.supabase.co'; // Ensure this matches your env

  const WELCOME_MESSAGES = [
    "Ready to boost your GPA?",
    "Let's break down your next assignment.",
    "Review your recent quiz performance.",
    "Plan your study schedule for the week.",
  ];

  const SUGGESTIONS = [
    "Analyze my grades",
    "What is due this week?",
    "Quiz me on my Biology notes",
    "Create a study plan"
  ];

  // --- MARKDOWN RENDERER CONFIGURATION ---
  
  const MarkdownComponents = {
    // 1. Headers: Added thick blue border
    h1: ({children}: any) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 pl-4 border-l-4 border-blue-500">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-xl font-semibold text-zinc-100 mt-5 mb-3">{children}</h2>,
    
    // 2. Lists -> Cards: 'ul' becomes a grid, 'li' becomes a card
    ul: ({children}: any) => <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">{children}</ul>,
    li: ({children}: any) => (
      <li className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 hover:border-blue-500/30 hover:bg-zinc-800/60 transition-all flex flex-col justify-center text-sm leading-relaxed shadow-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 mt-1">•</span>
          <span className="text-zinc-300">{children}</span>
        </div>
      </li>
    ),
    
    // 3. Tables: Wrapped in styled container
    table: ({children}: any) => (
      <div className="overflow-x-auto my-6 border border-zinc-800 rounded-xl bg-zinc-900/20">
        <table className="w-full text-left text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({children}: any) => <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-xs">{children}</thead>,
    th: ({children}: any) => <th className="px-4 py-3 border-b border-zinc-800 tracking-wider">{children}</th>,
    td: ({children}: any) => <td className="px-4 py-3 border-b border-zinc-800/50 text-zinc-300 whitespace-nowrap">{children}</td>,
    
    // 4. Links: Handle Course Navigation
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      if (href?.startsWith('course:')) {
        return (
          <button 
            onClick={() => onViewCourse(href.split(':')[1])} 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:text-blue-300 text-sm font-medium border border-blue-500/20 hover:border-blue-500/40 transition-colors mx-1"
          >
            {children}
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>;
    },
    
    p: ({children}: any) => <p className="mb-4 last:mb-0 leading-7 text-zinc-300">{children}</p>,
    strong: ({children}: any) => <strong className="text-white font-semibold">{children}</strong>,
    code: ({children}: any) => <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (user.id) fetchSessions();
  }, [user.id]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentMessages, isTyping, isStreaming, input]); // Added input to dependency to ensure view stays down when typing

  // --- API LOGIC ---

  const invokeAiAssistant = useCallback(async (payload: any) => {
    const { data: { session }, error } = await (supabase.auth as any).getSession();
    if (error || !session) throw new Error("Please log in.");

    const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await invokeAiAssistant({ type: 'list_sessions' });
      if (data?.sessions) {
        setSessions(data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title || 'New Chat',
          updatedAt: new Date(s.created_at)
        })));
      }
    } catch (err) { console.error(err); }
  };

  const loadSessionMessages = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setCurrentMessages([]);
    try {
      const data = await invokeAiAssistant({ type: 'get_messages', session_id: sessionId });
      if (data?.messages) {
        setCurrentMessages(data.messages.map((m: any) => ({
          id: m.id.toString(),
          role: m.role,
          text: m.message,
          timestamp: new Date(m.created_at)
        })));
      }
    } catch (err) { console.error(err); } 
    finally { setIsLoadingHistory(false); }
  };

  const handleSelectChat = (session: ChatSession) => {
    if (activeSessionId !== session.id) {
      setActiveSessionId(session.id);
      loadSessionMessages(session.id);
    }
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveSessionId('new');
    setCurrentMessages([]);
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteChat = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    
    // Optimistic UI update
    setSessions(prev => prev.filter(s => s.id !== sid));
    if (activeSessionId === sid) handleNewChat();
    
    try {
      await supabase.from('chat_sessions').delete().eq('id', sid);
    } catch (err) { 
      console.error(err); 
      fetchSessions(); // Revert on error
    }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
   
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setCurrentMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true); // Show "Thinking..."
    setIsStreaming(false);

    try {
      const payload = {
        type: 'chat',
        session_id: activeSessionId === 'new' ? undefined : activeSessionId,
        prompt: textToSend,
        history: currentMessages.slice(-6).map(m => ({ role: m.role, text: m.text })),
        context: {
          user: { name: user.name, grade: user.grade, school: user.school },
          assignments: assignments.filter(a => !a.completed).slice(0, 10).map(a => ({ title: a.title, dueDate: a.dueDate, course: a.course })),
          courses: courses.map(c => ({ title: c.title, id: c.id }))
        }
      };

      const data = await invokeAiAssistant(payload);
      if (data.error) throw new Error(data.error);

      // Create AI message placeholder
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: data.text, timestamp: new Date() };
      
      setCurrentMessages(prev => [...prev, aiMsg]);
      setIsStreaming(true); // Trigger typewriter effect

      if (activeSessionId === 'new' && data.session_id) {
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err: any) {
      setCurrentMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        text: "I'm sorry, I encountered an error connecting to the server. Please try again.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* 1. SIDEBAR (Glassmorphism & Clean) */}
      <div 
        className={`absolute inset-y-0 left-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-8 pl-2 mt-2">
                <h2 className="font-bold text-white text-lg tracking-tight">History</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <button onClick={handleNewChat} className="flex items-center gap-3 w-full p-3 bg-white text-black hover:bg-zinc-200 rounded-xl mb-6 transition-all font-semibold text-sm shadow-lg shadow-white/5 active:scale-95">
                <Plus className="w-4 h-4" /> New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {sessions.map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => handleSelectChat(session)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            activeSessionId === session.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                        <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{session.title}</div>
                            <div className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {session.updatedAt.toLocaleDateString()}
                            </div>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteChat(e, session.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" />}

      {/* 2. HEADER */}
      <div className="flex-none h-16 px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/90 to-transparent sticky top-0">
        <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Grecko <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">AI</span>
            </span>
        </div>
      </div>

      {/* 3. CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth" ref={scrollContainerRef}>
        <div className="max-w-3xl mx-auto w-full pb-8 min-h-full flex flex-col pt-4">
            
            {/* Empty State / Welcome Screen */}
            {currentMessages.length === 0 && !isLoadingHistory && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500 -mt-10">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
                        <AiIcon size={32} />
                    </div>
                    <h1 className="text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3">
                        Hi, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-zinc-500 text-lg mb-10 h-8 font-light">
                      {WELCOME_MESSAGES[Math.floor(Date.now() / 4000) % WELCOME_MESSAGES.length]}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                        {SUGGESTIONS.map((s, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSend(undefined, s)} 
                                className="p-4 text-sm text-zinc-400 bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-800 rounded-xl transition-all text-left flex items-center gap-3 group"
                            >
                                <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                </div>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading History */}
            {isLoadingHistory && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}

            {/* Message List */}
            <div className="space-y-10">
                {currentMessages.map((msg, idx) => {
                    const isLastMessage = idx === currentMessages.length - 1;
                    const isAi = msg.role === 'ai';
                    
                    // Only stream if it's the very last message, it's AI, and streaming is active
                    const shouldStream = isLastMessage && isAi && isStreaming;

                    return (
                        <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isAi ? 'justify-end' : 'justify-start'}`}>
                            
                            {/* --- AI MESSAGE (Clean, No Bubble, Full Width) --- */}
                            {isAi && (
                                <div className="flex gap-4 w-full max-w-3xl pr-2 md:pr-10">
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                            <AiIcon size={18} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-zinc-300 mb-2">Grecko AI</div>
                                        <div className="prose prose-invert prose-p:leading-relaxed prose-headings:text-zinc-100 prose-a:text-blue-400 max-w-none text-zinc-300 text-[15px]">
                                            <StreamableMarkdown 
                                                content={msg.text} 
                                                isStreaming={shouldStream}
                                                onComplete={() => setIsStreaming(false)} // Stop streaming when done
                                                components={MarkdownComponents}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- USER MESSAGE (Sleek Right Aligned) --- */}
                            {!isAi && (
                                <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800/80 text-zinc-100 px-5 py-3 rounded-[24px] rounded-tr-sm border border-transparent hover:border-zinc-700 transition-colors shadow-sm">
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Processing Indicator (Before Text Arrives) */}
                {isTyping && (
                    <div className="flex gap-4 max-w-3xl animate-pulse">
                        <div className="shrink-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <AiIcon size={18} className="opacity-50" />
                            </div>
                        </div>
                        <div className="flex items-center h-8">
                             <LoadingDots />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 4. INPUT AREA (Compact Capsule) */}
      <div className="flex-none px-4 pb-6 pt-4 bg-gradient-to-t from-black via-black to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
            <form 
                onSubmit={(e) => handleSend(e)} 
                className="group relative flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-2 border border-zinc-800 shadow-2xl transition-all duration-300 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 focus-within:shadow-blue-900/10 focus-within:bg-zinc-900/90"
            >
                {/* Context / Attachment Placeholder */}
                <button type="button" className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors ml-1">
                    <Plus className="w-5 h-5" />
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-[15px] h-full py-2 pl-1"
                    disabled={isTyping}
                />

                {isTyping || isStreaming ? (
                    <button type="button" className="p-2 rounded-full bg-zinc-800 text-zinc-400 mr-1 animate-pulse cursor-default">
                        <StopCircle className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 mr-1 ${
                            input.trim() 
                            ? 'bg-white text-black hover:bg-zinc-200 hover:scale-105 shadow-lg' 
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                )}
            </form>
            <div className="text-center mt-3 text-[11px] text-zinc-600 font-medium">
                Grecko AI can make mistakes. Check important info.
            </div>
        </div>
      </div>

    </div>
  );
};
