import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, MessageSquare, X, Clock, Trash2, Menu, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, User, Assignment, AcademicGoals, QuizResult, Course } from '../types';
import { supabase } from '../lib/supabase';
// Custom AI Icon
const AiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 18L6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);
const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text.replace(/```[\w-]*\n([\s\S]*?)```/g, '$1')
             .replace(/`([^`]+)`/g, '$1')
             .replace(/\*\*(.*?)\*\*/g, '$1')
             .trim();
};
const formatAiResponse = (text: string, onViewCourse: (id: string) => void) => {
  if (!text) return null;
  const regex = /\[([^\]]+)\]\(course:([^\)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    const title = match[1];
    const courseId = match[2];
    parts.push(
      <button
        key={`btn-${match.index}`}
        onClick={() => onViewCourse(courseId)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-500 font-medium mx-1 border border-blue-500/20"
      >
        <span className="underline">{title}</span>
      </button>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  return parts;
};
// --- ROTATING TEXT CONSTANTS ---
const WELCOME_MESSAGES = [
  "Ready to improve your GPA?",
  "Let's raise your quiz scores.",
  "Need help organizing assignments?",
  "Time to master your courses.",
  "Ask me for a study plan."
];
const SUGGESTION_POOL = [
  "How can I improve my GPA?",
  "Analyze my quiz performance.",
  "Create a study schedule for me.",
  "Summarize my pending tasks.",
  "Give me a motivation boost.",
  "Explain my lowest grade subject.",
  "Quiz me on my recent courses.",
  "What should I focus on today?",
  "Help me prepare for exams."
];
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
const SUPABASE_PROJECT_URL = 'https://uopitdnufrnxkhhhdtxk.supabase.co';
export const AiMentor: React.FC<AiMentorProps> = ({ user, assignments, academicGoals, quizResults, courses, onViewCourse }) => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('new');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
 
  // Rotating Text State
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([]);
 
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Rotate Welcome Message
  useEffect(() => {
    const interval = setInterval(() => {
      setWelcomeIndex((prev) => (prev + 1) % WELCOME_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  // Shuffle Suggestions
  useEffect(() => {
    const shuffleSuggestions = () => {
      const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
      setDisplayedSuggestions(shuffled.slice(0, 3));
    };
   
    shuffleSuggestions(); // Initial
    const interval = setInterval(shuffleSuggestions, 8000); // Change every 8s
   
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (user.id) fetchSessions();
  }, [user.id]);
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [currentMessages, isTyping, isLoadingHistory]);
  // Helper function to call Edge Function directly with Authorization header
  const invokeAiAssistant = async (payload: any) => {
    const { data: { session }, error: sessionError } = await (supabase.auth as any).getSession();
    if (sessionError || !session) {
      console.error("No active user session");
      throw new Error("You must be logged in to use the AI Assistant.");
    }
    const token = session.access_token;
    try {
      const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge Function Error (Non-2xx):", errorText);
        throw new Error(`AI Error (${response.status}): ${errorText || 'Unknown error'}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      throw error;
    }
  };
  const fetchSessions = async () => {
    try {
      const data = await invokeAiAssistant({ type: 'list_sessions' });
      if (data && data.sessions) {
        setSessions(data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title || 'Conversation',
          updatedAt: new Date(s.created_at)
        })));
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };
  const loadSessionMessages = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setCurrentMessages([]);
    try {
      const data = await invokeAiAssistant({ type: 'get_messages', session_id: sessionId });
      if (data && data.messages) {
        setCurrentMessages(data.messages.map((m: any) => ({
          id: m.id.toString(),
          role: m.role,
          text: m.message,
          timestamp: new Date(m.created_at)
        })));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  const handleSelectChat = (session: ChatSession) => {
    if (activeSessionId === session.id) {
        setSidebarOpen(false);
        return;
    }
    setActiveSessionId(session.id);
    setSidebarOpen(false);
    loadSessionMessages(session.id);
  };
  const handleNewChat = () => {
    setActiveSessionId('new');
    setCurrentMessages([]);
    setSidebarOpen(false);
  };
  const handleDeleteChat = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation(); // Prevents clicking the row behind the button
   
    // CLICK TEST: Specific popup to verify button click
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    // 1. Optimistic Update (Remove it from screen immediately)
    const previousSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== sid));
   
    if (activeSessionId === sid) {
        handleNewChat();
    }
    try {
      // 2. Delete directly from Supabase (Cascade delete handles messages)
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sid);
      if (error) throw error;
     
    } catch (err: any) {
      console.error("Delete failed:", err);
      // Revert UI if it failed
      setSessions(previousSessions);
      alert(`Failed to delete chat: ${err.message || 'Unknown error'}`);
    }
  };
  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
   
    const tempId = Date.now().toString();
    const userMsg: ChatMessage = { id: tempId, role: 'user', text: textToSend, timestamp: new Date() };
    setCurrentMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const payload = {
            type: 'chat',
            session_id: activeSessionId === 'new' ? undefined : activeSessionId,
            prompt: textToSend,
            history: currentMessages.slice(-6).map(m => ({ role: m.role, text: m.text })),
            context: {
                user: {
                    name: user.name,
                    grade: user.grade,
                    school: user.school,
                    bio: user.bio,
                    academicLevel: user.academicLevel
                },
                academicGoals,
                assignments: {
                    pending: assignments.filter(a => !a.completed).map(a => ({ title: a.title, dueDate: a.dueDate, course: a.course })),
                    completed: assignments.filter(a => a.completed).slice(0, 10).map(a => ({ title: a.title, course: a.course }))
                },
                quizResults: quizResults.slice(0, 10).map(q => ({ courseName: q.courseName, score: q.score, date: q.date })),
               
                // --- UPDATE HERE ONLY: Pass extra course details ---
                courses: courses.map(c => ({
                    title: c.title,
                    id: c.id,
                    isOwned: c.isOwned,
                    price: c.price,
                    description: c.description
                }))
            }
      };
      const data = await invokeAiAssistant(payload);
      if (data.error) throw new Error(data.error);
      const aiResponseText = data.text || "I'm not sure how to respond.";
      const returnedSessionId = data.session_id;
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: aiResponseText, timestamp: new Date() };
      setCurrentMessages(prev => [...prev, aiMsg]);
      if (activeSessionId === 'new' && returnedSessionId) {
        setActiveSessionId(returnedSessionId);
        fetchSessions();
      }
    } catch (err: any) {
      console.error("Chat Failed:", err);
      setCurrentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Error: ${err.message || 'Something went wrong.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  return (
    <div className="flex flex-col h-full relative bg-black text-slate-200 font-sans selection:bg-slate-800 overflow-hidden pb-16 md:pb-0">
      {/* Sidebar */}
      <div className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-zinc-900/95 border-r border-zinc-800 z-50 transform transition-transform duration-300 p-4 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6 pl-2">
          <h2 className="text-lg font-bold text-white">Chat History</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <button onClick={handleNewChat} className="flex items-center gap-3 w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mb-6 transition-colors shadow-lg shadow-blue-900/20">
          <div className="bg-white/20 p-1 rounded-lg"><Plus className="w-4 h-4" /></div><span className="font-medium">New Chat</span>
        </button>
        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
          {sessions.length === 0 ? <div className="text-center text-slate-500 text-sm mt-10">No past conversations</div> : sessions.map(session => (
            <div key={session.id} onClick={() => handleSelectChat(session)} className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-zinc-800 text-white' : 'text-slate-400 hover:bg-zinc-800/50 hover:text-slate-200'}`}>
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{session.title}</div>
                <div className="text-xs text-slate-600 group-hover:text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.updatedAt).toLocaleDateString()}</div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, session.id)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                title="Delete Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Window */}
      <div className="flex-none p-4 z-20 flex items-center bg-black/50 backdrop-blur-md border-b border-zinc-800">
        <button onClick={() => setSidebarOpen(true)} className="pointer-events-auto text-zinc-400 hover:text-white p-2 -ml-2 mb-2"><Menu className="w-6 h-6" /></button>
        <span className="ml-2 font-bold text-white mb-2">Grecko AI</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 scroll-smooth" ref={scrollContainerRef}>
        {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full pt-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500">Loading conversation...</p>
            </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 -mt-12 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6"><AiIcon className="w-8 h-8 text-zinc-400" /></div>
            <h1 className="text-3xl md:text-4xl font-medium text-white mb-3">Hi, {user.name.split(' ')[0]}</h1>
            {/* Dynamic Welcome Message */}
            <p key={welcomeIndex} className="text-slate-400 max-w-md mx-auto text-lg animate-in fade-in duration-500 slide-in-from-bottom-2">
               {WELCOME_MESSAGES[welcomeIndex]}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 pt-4">
            {currentMessages.map(msg => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-white'}`}>
                  {msg.role === 'user' ? <span className="font-bold text-xs">{user.name.charAt(0)}</span> : <AiIcon className="w-5 h-5 text-white" />}
                </div>
                <div className={`flex-1 max-w-[85%] rounded-2xl p-3 md:p-4 leading-relaxed text-sm md:text-base break-words overflow-hidden ${msg.role === 'user' ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20' : 'bg-zinc-900 text-slate-200 border border-zinc-800'}`}>
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{msg.role === 'ai' ? formatAiResponse(msg.text, onViewCourse) : msg.text}</div>
                </div>
              </div>
            ))}
            {isTyping && <div className="text-center text-sm text-slate-500 animate-pulse">Grecko is thinking...</div>}
          </div>
        )}
      </div>
      {/* Input */}
      <div className="flex-none p-4 md:p-6 bg-black border-t border-zinc-900 z-30">
        <div className="max-w-3xl mx-auto pointer-events-auto">
         
          {/* Rotating Suggestion Chips (Only visible when no messages) */}
          {currentMessages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar mask-gradient">
                {displayedSuggestions.map((suggestion, idx) => (
                    <button
                      key={`${suggestion}-${idx}`}
                      onClick={() => handleSend(undefined, suggestion)}
                      className="whitespace-nowrap px-4 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 rounded-full text-xs md:text-sm text-slate-300 hover:text-white transition-all animate-in fade-in zoom-in duration-300 flex items-center gap-2 backdrop-blur-sm"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      {suggestion}
                    </button>
                ))}
            </div>
          )}
          <form onSubmit={(e) => handleSend(e)} className="relative w-full">
            <div className="relative flex items-center bg-zinc-900 rounded-[26px] px-4 py-3 border border-zinc-800 transition-colors focus-within:border-zinc-700 shadow-xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your grades, next assignment, or study plan..."
                className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none border-none ring-0 focus:ring-0 focus:outline-none h-6 text-base w-full"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`p-2 rounded-full transition-all duration-200 ml-2 flex items-center justify-center shrink-0 ${(!input.trim() || isTyping) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-slate-200 active:scale-95'}`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
