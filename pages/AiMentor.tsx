import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ArrowDown,
  Info
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

interface InvokePayload {
  type: 'chat' | 'list_sessions' | 'get_messages';
  session_id?: string;
  prompt?: string;
  history?: Array<{ role: string; text: string }>;
  context?: any;
}

// --- CONSTANTS ---
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SUPABASE_PROJECT_URL = 'https://uopitdnufrnxkhhhdtxk.supabase.co';

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

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse px-2 sm:px-4">
    {[1, 2].map((i) => (
      <div key={i} className="flex gap-4">
        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    ))}
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
  const [displayedContent, setDisplayedContent] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordIndexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const lastContentLengthRef = useRef(0);

  useEffect(() => {
    // If not streaming, show full content immediately
    if (!isStreaming) {
      setDisplayedContent(content);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Split into words (preserving spaces and newlines)
    const words = content.match(/\S+\s*/g) || [];
    
    // Only reset if content actually changed significantly (not just appended)
    const contentGrew = content.length > lastContentLengthRef.current;
    const isAppending = contentGrew && content.startsWith(displayedContent);
    
    if (!isAppending && wordIndexRef.current > 0) {
      // Content changed unexpectedly, reset
      wordIndexRef.current = 0;
      setDisplayedContent('');
    }
    
    wordsRef.current = words;
    lastContentLengthRef.current = content.length;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (wordIndexRef.current < wordsRef.current.length) {
        const newContent = wordsRef.current.slice(0, wordIndexRef.current + 1).join('');
        setDisplayedContent(newContent);
        wordIndexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onComplete) onComplete();
      }
    }, 25); // Optimized timing for smooth streaming

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isStreaming, onComplete, displayedContent]);

  return (
    <div className="min-h-[20px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AiMentor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-black text-white p-8">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- MAIN COMPONENT ---

const AiMentorComponent: React.FC<AiMentorProps> = ({ 
  user, 
  assignments, 
  academicGoals, 
  quizResults, 
  courses, 
  onViewCourse 
}) => {
  
  // --- STATE ---
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('new');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);
  
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- MEMOIZED VALUES (Performance Optimization) ---
  const filteredAssignments = useMemo(() => 
    assignments.filter(a => !a.completed).slice(0, 10).map(a => ({
      title: a.title,
      dueDate: a.dueDate,
      course: a.course
    })),
    [assignments]
  );

  const mappedCourses = useMemo(() => 
    courses.map(c => ({ title: c.title, id: c.id })),
    [courses]
  );

  // --- CACHE UTILITIES ---
  const getCacheKey = (sessionId: string) => `grecko_chat_${sessionId}`;
  const getTimestampKey = (sessionId: string) => `${getCacheKey(sessionId)}_timestamp`;

  const isCacheValid = (sessionId: string): boolean => {
    const timestamp = sessionStorage.getItem(getTimestampKey(sessionId));
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  const setCache = (sessionId: string, messages: ChatMessage[]) => {
    sessionStorage.setItem(getCacheKey(sessionId), JSON.stringify(messages));
    sessionStorage.setItem(getTimestampKey(sessionId), Date.now().toString());
  };

  const getCache = (sessionId: string): ChatMessage[] | null => {
    if (!isCacheValid(sessionId)) return null;
    const cached = sessionStorage.getItem(getCacheKey(sessionId));
    if (!cached) return null;
    return JSON.parse(cached).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  };

  // --- PERSISTENCE LOGIC (Session Bug Fix) ---
  useEffect(() => {
    const initializeSession = async () => {
      const savedSessionId = localStorage.getItem('grecko_active_session_id');
      
      if (savedSessionId && savedSessionId !== 'new') {
        setActiveSessionId(savedSessionId);
        await loadSessionMessages(savedSessionId);
      }
      
      if (user.id) {
        await fetchSessions();
      }
    };
    
    initializeSession();
  }, [user.id]);

  useEffect(() => {
    if (activeSessionId && activeSessionId !== 'new') {
      localStorage.setItem('grecko_active_session_id', activeSessionId);
    } else {
      localStorage.removeItem('grecko_active_session_id');
    }
  }, [activeSessionId]);

  // --- SCROLL LOGIC ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isDistanceFromBottom);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping, isStreaming, scrollToBottom]);

  // --- MARKDOWN COMPONENTS ---
  const MarkdownComponents = useMemo(() => ({
    h1: ({children}: any) => <h1 className="text-xl sm:text-2xl font-bold text-white mt-6 mb-4 pl-4 border-l-4 border-blue-500">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 mt-5 mb-3">{children}</h2>,
    ul: ({children}: any) => <ul className="list-disc pl-5 space-y-2 my-4 text-zinc-300">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal pl-5 space-y-2 my-4 text-zinc-300">{children}</ol>,
    li: ({children}: any) => <li className="pl-1 leading-relaxed">{children}</li>,
    table: ({children}: any) => (
      <div className="overflow-x-auto my-6 border border-zinc-800 rounded-xl bg-zinc-900/20">
        <table className="w-full text-left text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({children}: any) => <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-xs">{children}</thead>,
    th: ({children}: any) => <th className="px-3 sm:px-4 py-3 border-b border-zinc-800 tracking-wider">{children}</th>,
    td: ({children}: any) => <td className="px-3 sm:px-4 py-3 border-b border-zinc-800/50 text-zinc-300 whitespace-nowrap">{children}</td>,
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
  }), [onViewCourse]);

  // --- API LOGIC ---
  const invokeAiAssistant = useCallback(async (payload: InvokePayload, signal?: AbortSignal) => {
    const { data: { session }, error: sessionError } = await (supabase.auth as any).getSession();
    if (sessionError || !session) {
      throw new Error("Authentication required. Please log in.");
    }

    const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Network request failed');
    }
    
    return await response.json();
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await invokeAiAssistant({ type: 'list_sessions' });
      if (data?.sessions) {
        setSessions(data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title || 'New Chat',
          updatedAt: new Date(s.created_at)
        })));
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load chat history');
    }
  }, [invokeAiAssistant]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    // Try cache first
    const cached = getCache(sessionId);
    if (cached) {
      setCurrentMessages(cached);
      return;
    }

    setIsLoadingHistory(true);
    setCurrentMessages([]);
    
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
        setCache(sessionId, mappedMessages);
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [invokeAiAssistant]);

  const handleSelectChat = useCallback((session: ChatSession) => {
    if (activeSessionId !== session.id) {
      setActiveSessionId(session.id);
      loadSessionMessages(session.id);
    }
    setSidebarOpen(false);
  }, [activeSessionId, loadSessionMessages]);

  const handleNewChat = useCallback(() => {
    setActiveSessionId('new');
    setCurrentMessages([]);
    setError(null);
    localStorage.removeItem('grecko_active_session_id');
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleDeleteChat = useCallback(async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    
    setSessions(prev => prev.filter(s => s.id !== sid));
    sessionStorage.removeItem(getCacheKey(sid));
    sessionStorage.removeItem(getTimestampKey(sid));
    
    if (activeSessionId === sid) {
      handleNewChat();
    }
    
    try {
      await supabase.from('chat_sessions').delete().eq('id', sid);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [activeSessionId, handleNewChat]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setIsStreaming(false);
  }, []);

  const handleSend = useCallback(async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
   
    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: textToSend, 
      timestamp: new Date() 
    };
    
    setCurrentMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setIsStreaming(false);
    setError(null);
    scrollToBottom();

    abortControllerRef.current = new AbortController();

    try {
      const payload: InvokePayload = {
        type: 'chat',
        session_id: activeSessionId === 'new' ? undefined : activeSessionId,
        prompt: textToSend,
        history: currentMessages.slice(-6).map(m => ({ role: m.role, text: m.text })),
        context: {
          user: { 
            name: user.name, 
            grade: user.grade, 
            school: user.school 
          },
          assignments: filteredAssignments,
          courses: mappedCourses,
          limitations: {
            physical: "I cannot perform lab experiments, draw on physical whiteboards, or interact with objects in the real world. My interactions are limited to text-based assistance.",
            cognition: "My responses are generated from patterns in training data. While I can synthesize information in novel ways and analyze problems systematically, I don't possess genuine human intuition, spontaneous creativity, or the ability to develop fundamentally new theories beyond recombining existing knowledge."
          }
        }
      };

      const data = await invokeAiAssistant(payload, abortControllerRef.current.signal);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: data.text, 
        timestamp: new Date() 
      };
      
      setCurrentMessages(prev => {
        const updated = [...prev, aiMsg];
        if (activeSessionId !== 'new') {
          setCache(activeSessionId, updated);
        }
        return updated;
      });
      
      setIsStreaming(true);

      if (activeSessionId === 'new' && data.session_id) {
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = err.message || "Connection error. Please try again.";
        setError(errorMsg);
        setCurrentMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'ai', 
          text: errorMsg, 
          timestamp: new Date() 
        }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [input, activeSessionId, currentMessages, user, filteredAssignments, mappedCourses, invokeAiAssistant, fetchSessions, scrollToBottom]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      // Escape to close sidebar
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat, sidebarOpen]);

  // --- RENDER ---

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div 
        className={`absolute inset-y-0 left-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Chat history sidebar"
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-8 pl-2 mt-2">
            <h2 className="font-bold text-white text-lg tracking-tight">History</h2>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleNewChat} 
            className="flex items-center gap-3 w-full p-3 bg-white text-black hover:bg-zinc-200 rounded-xl mb-6 transition-all font-semibold text-sm shadow-lg shadow-white/5 active:scale-95"
            aria-label="Start new chat"
          >
            <MessageSquare className="w-4 h-4" /> 
            New Chat
            <kbd className="ml-auto text-xs opacity-60">⌘K</kbd>
          </button>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {sessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => handleSelectChat(session)} 
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  activeSessionId === session.id 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectChat(session)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{session.title}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> 
                    {session.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteChat(e, session.id)} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" 
          aria-hidden="true"
        />
      )}

      {/* HEADER */}
      <div className="flex-none h-16 px-3 sm:px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/90 to-transparent sticky top-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open chat history"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <span className="font-bold text-base sm:text-lg text-white tracking-tight">Grecko AI</span>
        </div>
        <button
          onClick={() => setShowLimitations(true)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="About Grecko AI"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* CHAT AREA */}
      <div 
        className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-0 scroll-smooth" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="max-w-3xl mx-auto w-full pb-8 min-h-full flex flex-col justify-end pt-4">
          
          {/* Empty State */}
          {currentMessages.length === 0 && !isLoadingHistory && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500 mb-20">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
                <AiIcon size={32} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3">
                Hi, {user.name.split(' ')[0]}
              </h1>
              <p className="text-zinc-500 text-sm mb-8">How can I help you study today?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  'Analyze my grades', 
                  'What is due this week?', 
                  'Quiz me on Biology', 
                  'Study plan'
                ].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(undefined, s)} 
                    className="p-3 sm:p-4 text-sm text-zinc-400 bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-800 rounded-xl transition-all text-left flex items-center gap-3 group"
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

          {isLoadingHistory && <SkeletonLoader />}

          <div className="space-y-6 sm:space-y-10">
            {currentMessages.map((msg, idx) => {
              const isLastMessage = idx === currentMessages.length - 1;
              const isAi = msg.role === 'ai';
              const shouldStream = isLastMessage && isAi && isStreaming;

              return (
                <div 
                  key={msg.id} 
                  className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                    !isAi ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {isAi ? (
                    <div className="flex gap-3 sm:gap-4 w-full max-w-3xl pr-2 md:pr-10">
                      <div className="shrink-0 mt-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                          <AiIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2">Grecko AI</div>
                        <div className="prose prose-invert prose-sm sm:prose-base prose-p:leading-relaxed prose-headings:text-zinc-100 prose-a:text-blue-400 max-w-none text-zinc-300">
                          <StreamableMarkdown 
                            content={msg.text} 
                            isStreaming={shouldStream} 
                            onComplete={() => setIsStreaming(false)} 
                            components={MarkdownComponents} 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800/80 text-zinc-100 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[20px] sm:rounded-[24px] rounded-tr-sm border border-transparent hover:border-zinc-700 transition-colors shadow-sm">
                      <div className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 sm:gap-4 max-w-3xl animate-pulse">
                <div className="shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <AiIcon size={16} className="opacity-50 sm:w-[18px] sm:h-[18px]" />
                  </div>
                </div>
                <div className="flex items-center h-8">
                  <LoadingDots />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </div>

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 sm:bottom-24 right-4 sm:right-6 p-2.5 sm:p-3 bg-zinc-800/90 backdrop-blur border border-zinc-700 rounded-full text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all z-30 animate-in fade-in zoom-in"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* INPUT AREA */}
      <div className="flex-none px-3 sm:px-4 pb-20 sm:pb-24 mb-3 sm:mb-4 pt-3 sm:pt-4 bg-gradient-to-t from-black via-black to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
          <form 
            onSubmit={(e) => handleSend(e)} 
            className="group relative flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-2 border border-zinc-800 shadow-2xl transition-all duration-300 focus-within:border-zinc-600 focus-within:bg-zinc-900/95"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm sm:text-[15px] py-2 pl-3 sm:pl-4 
                         focus:outline-none focus:ring-0 border-none"
              disabled={isTyping && !isStreaming}
              aria-label="Message input"
            />

            {isTyping || isStreaming ? (
              <button 
                type="button" 
                onClick={handleStop}
                className="p-2 rounded-full bg-zinc-800 text-zinc-400 mr-1 hover:text-white hover:bg-red-500/20 transition-all"
                aria-label="Stop generating"
              >
                <StopCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
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
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </form>
          <div className="text-center mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-zinc-600 font-medium">
            Grecko AI can make mistakes. Check important info.
          </div>
        </div>
      </div>

      {/* LIMITATIONS MODAL */}
      {showLimitations && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">What Grecko AI Can & Can't Do</h3>
              <button 
                onClick={() => setShowLimitations(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            
            <div className="space-y-4 text-zinc-300 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-green-500">✓</span> What I Can Do:
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li>Help you understand complex topics and study for exams</li>
                  <li>Analyze your academic progress and suggest improvements</li>
                  <li>Create personalized study plans and quiz you on material</li>
                  <li>Provide writing feedback and homework assistance</li>
                  <li>Answer questions about your courses and assignments</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">✗</span> Current Limitations:
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li>
                    <strong className="text-zinc-200">Physical Interaction:</strong> I can't perform lab experiments with you, draw complex diagrams on a physical whiteboard, or point to objects in the real world to explain concepts. My interactions are limited to text.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Intuition & Original Thought:</strong> My "intelligence" comes from patterns and data I've been trained on. While I can generate novel combinations of ideas and think critically within my parameters, I don't possess genuine human intuition, serendipitous creativity, or the ability to form truly new, out-of-the-box theories without prior data to draw from.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Real-time Information:</strong> My knowledge has a cutoff date and I can't browse the internet for current events unless specifically enabled.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Personal Experience:</strong> I don't have emotions, personal experiences, or consciousness like humans do.
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <p className="text-xs text-zinc-400 text-center">
                <strong className="text-zinc-300">Remember:</strong> Grecko AI is designed to assist and enhance your learning, not replace your own thinking and effort.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Export with Error Boundary
export const AiMentor: React.FC<AiMentorProps> = (props) => (
  <ErrorBoundary>
    <AiMentorComponent {...props} />
  </ErrorBoundary>
);
