import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  MessageSquare, 
  X, 
  Clock, 
  Trash2, 
  Menu, 
  Loader2, 
  Sparkles, 
  StopCircle,
  ArrowDown // Added for scroll-to-bottom
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

const AiIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 4V20M4 12H20" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 7L7 17" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M7 7L17 17" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <defs>
      <linearGradient id="ai-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
  </svg>
);

const LoadingDots = () => (
  <div className="flex space-x-1 p-2">
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
  </div>
);

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
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    
    // Reset if content changes drastically or start new stream
    if (displayedContent === '' || !content.startsWith(displayedContent.substring(0, 10))) {
         wordsRef.current = content.split(/(?=[ \n])/);
         indexRef.current = 0;
         setDisplayedContent('');
    }

    intervalRef.current = setInterval(() => {
      if (indexRef.current < wordsRef.current.length) {
        setDisplayedContent((prev) => prev + wordsRef.current[indexRef.current]);
        indexRef.current++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      }
    }, 20); 

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
  const [showScrollButton, setShowScrollButton] = useState(false); // For arrow button
  
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUPABASE_PROJECT_URL = 'https://uopitdnufrnxkhhhdtxk.supabase.co';

  // --- PERSISTENCE LOGIC (Fixing Reset Issue) ---
  useEffect(() => {
    // 1. On Mount: Check if we have a saved session ID
    const savedSessionId = localStorage.getItem('grecko_active_session_id');
    if (savedSessionId && savedSessionId !== 'new') {
        setActiveSessionId(savedSessionId);
        loadSessionMessages(savedSessionId);
    }
    if (user.id) fetchSessions();
  }, [user.id]);

  useEffect(() => {
    // 2. On Change: Save the current session ID
    if (activeSessionId) {
        localStorage.setItem('grecko_active_session_id', activeSessionId);
    }
  }, [activeSessionId]);

  // --- SCROLL LOGIC ---
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if we are more than 300px away from bottom
    const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isDistanceFromBottom);
  };

  useEffect(() => {
    // Auto-scroll only if we are already near bottom or it's a new message
    scrollToBottom();
  }, [currentMessages, isTyping, isStreaming]);

  // --- MARKDOWN & API ---
  const MarkdownComponents = {
    h1: ({children}: any) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 pl-4 border-l-4 border-blue-500">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-xl font-semibold text-zinc-100 mt-5 mb-3">{children}</h2>,
    ul: ({children}: any) => <ul className="list-disc pl-5 space-y-2 my-4 text-zinc-300">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal pl-5 space-y-2 my-4 text-zinc-300">{children}</ol>,
    li: ({children}: any) => <li className="pl-1 leading-relaxed">{children}</li>,
    table: ({children}: any) => (
      <div className="overflow-x-auto my-6 border border-zinc-800 rounded-xl bg-zinc-900/20">
        <table className="w-full text-left text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({children}: any) => <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-xs">{children}</thead>,
    th: ({children}: any) => <th className="px-4 py-3 border-b border-zinc-800 tracking-wider">{children}</th>,
    td: ({children}: any) => <td className="px-4 py-3 border-b border-zinc-800/50 text-zinc-300 whitespace-nowrap">{children}</td>,
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

  const invokeAiAssistant = useCallback(async (payload: any, signal?: AbortSignal) => {
    const { data: { session }, error } = await (supabase.auth as any).getSession();
    if (error || !session) throw new Error("Please log in.");

    const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal
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
    // Try cache first
    const cached = sessionStorage.getItem(`grecko_chat_${sessionId}`);
    if (cached) {
      setCurrentMessages(JSON.parse(cached).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      // Don't return, fetch updates in background? For now return to be fast.
      // return; 
    }

    setIsLoadingHistory(true);
    if (!cached) setCurrentMessages([]); // Only clear if no cache
    try {
      const data = await invokeAiAssistant({ type: 'get_messages', session_id: sessionId });
      if (data?.messages) {
        const mappedMessages = data.messages.map((m: any) => ({
          id: m.id.toString(),
          role: m.role,
          text: m.message,
          timestamp: new Date(m.created_at)
        }));
        setCurrentMessages(mappedMessages);
        sessionStorage.setItem(`grecko_chat_${sessionId}`, JSON.stringify(mappedMessages));
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
    localStorage.removeItem('grecko_active_session_id'); // Clear persisted ID
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteChat = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    setSessions(prev => prev.filter(s => s.id !== sid));
    sessionStorage.removeItem(`grecko_chat_${sid}`);
    if (activeSessionId === sid) handleNewChat();
    try { await supabase.from('chat_sessions').delete().eq('id', sid); } catch (err) { console.error(err); }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setIsStreaming(false);
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
   
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setCurrentMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setIsStreaming(false);
    scrollToBottom();

    abortControllerRef.current = new AbortController();

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

      const data = await invokeAiAssistant(payload, abortControllerRef.current.signal);
      if (data.error) throw new Error(data.error);

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: data.text, timestamp: new Date() };
      setCurrentMessages(prev => [...prev, aiMsg]);
      setIsStreaming(true);

      if (activeSessionId === 'new' && data.session_id) {
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setCurrentMessages(prev => [...prev, { 
            id: Date.now().toString(), role: 'ai', text: "Connection error. Please try again.", timestamp: new Date() 
        }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* 1. SIDEBAR */}
      <div className={`absolute inset-y-0 left-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-8 pl-2 mt-2">
                <h2 className="font-bold text-white text-lg tracking-tight">History</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <button onClick={handleNewChat} className="flex items-center gap-3 w-full p-3 bg-white text-black hover:bg-zinc-200 rounded-xl mb-6 transition-all font-semibold text-sm shadow-lg shadow-white/5 active:scale-95">
                <MessageSquare className="w-4 h-4" /> New Chat
            </button>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {sessions.map(session => (
                    <div key={session.id} onClick={() => handleSelectChat(session)} className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}>
                        <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                        <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{session.title}</div>
                            <div className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {session.updatedAt.toLocaleDateString()}
                            </div>
                        </div>
                        <button onClick={(e) => handleDeleteChat(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" />}

      {/* 2. HEADER */}
      <div className="flex-none h-16 px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/90 to-transparent sticky top-0">
        <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-white tracking-tight">Grecko AI</span>
        </div>
      </div>

      {/* 3. CHAT AREA */}
      {/* Fixed: Use flex-col and justify-end to push messages to bottom (no empty top space) */}
      <div 
        className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto w-full pb-8 min-h-full flex flex-col justify-end pt-4">
            
            {/* Empty State / Welcome Screen */}
            {currentMessages.length === 0 && !isLoadingHistory && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500 mb-20">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
                        <AiIcon size={32} />
                    </div>
                    <h1 className="text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3">
                        Hi, {user.name.split(' ')[0]}
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-8">
                        {['Analyze my grades', 'What is due this week?', 'Quiz me on Biology', 'Study plan'].map((s, i) => (
                            <button key={i} onClick={() => handleSend(undefined, s)} className="p-4 text-sm text-zinc-400 bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-800 rounded-xl transition-all text-left flex items-center gap-3 group">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                </div>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isLoadingHistory && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}

            <div className="space-y-10">
                {currentMessages.map((msg, idx) => {
                    const isLastMessage = idx === currentMessages.length - 1;
                    const isAi = msg.role === 'ai';
                    const shouldStream = isLastMessage && isAi && isStreaming;

                    return (
                        <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isAi ? 'justify-end' : 'justify-start'}`}>
                            {isAi ? (
                                <div className="flex gap-4 w-full max-w-3xl pr-2 md:pr-10">
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                            <AiIcon size={18} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-zinc-300 mb-2">Grecko AI</div>
                                        <div className="prose prose-invert prose-p:leading-relaxed prose-headings:text-zinc-100 prose-a:text-blue-400 max-w-none text-zinc-300 text-[15px]">
                                            <StreamableMarkdown content={msg.text} isStreaming={shouldStream} onComplete={() => setIsStreaming(false)} components={MarkdownComponents} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800/80 text-zinc-100 px-5 py-3 rounded-[24px] rounded-tr-sm border border-transparent hover:border-zinc-700 transition-colors shadow-sm">
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            )}
                        </div>
                    );
                })}

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
                {/* Invisible ref to scroll to */}
                <div ref={messagesEndRef} className="h-1" />
            </div>
        </div>
      </div>

      {/* 4. SCROLL TO BOTTOM BUTTON (Floating) */}
      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 p-3 bg-zinc-800/90 backdrop-blur border border-zinc-700 rounded-full text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all z-30 animate-in fade-in zoom-in"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* 5. INPUT AREA */}
      {/* Added pb-24 to keep input above bottom nav on mobile */}
      <div className="flex-none px-4 pb-24 mb-4 pt-4 bg-gradient-to-t from-black via-black to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
            <form 
                onSubmit={(e) => handleSend(e)} 
                className="group relative flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-2 border border-zinc-800 shadow-2xl transition-all duration-300 focus-within:border-zinc-600 focus-within:bg-zinc-900/95"
            >
                {/* FIXED: Removed default outline/ring to kill the "blue square" effect */}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 text-white placeholder-zinc-500 text-[15px] h-full py-2 pl-4 w-full"
                    disabled={isTyping && !isStreaming} 
                />

                {isTyping || isStreaming ? (
                    <button 
                        type="button" 
                        onClick={handleStop}
                        className="p-2 rounded-full bg-zinc-800 text-zinc-400 mr-1 hover:text-white hover:bg-red-500/20 transition-all"
                    >
                        {/* Changed to StopCircle but ensures no weird border */}
                        <StopCircle className="w-5 h-5 animate-pulse" />
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
