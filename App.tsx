import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, PenTool, User as UserIcon,
  Bell, Menu, LogOut, ChevronLeft, Video, ShieldCheck
} from 'lucide-react';

import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import { Courses, CourseReader } from './pages/Courses';
import StudyTools from './pages/StudyTools';
import AiMentor from './pages/AiMentor';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import VisualLearning from './pages/VisualLearning'; // ✅ FIXED
import Admin from './pages/Admin'; // ✅ FIXED
import UpdatePassword from './pages/UpdatePassword';
import Confirmation from './pages/Confirmation';

import { PageRoute, Assignment, AcademicGoals, Course, QuizResult, Notification } from './types';
import { Button } from './components/UI';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { AssignmentReminder } from './components/AssignmentReminder';


const AiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 18L6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export default function App() {
  const { user, signOut, isAdmin, isRecovery, loading: authLoading, signInWithGoogle } = useAuth();
  const [appState, setAppState] = useState<'landing' | 'auth' | 'app' | 'confirmation'>('landing');
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>('login');
  const [route, setRoute] = useState<PageRoute>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [academicGoals, setAcademicGoals] = useState<AcademicGoals>({
    currentGpa: 0, targetGpa: 4.0, coursesTaken: 0, totalCourses: 0, coursesRemaining: 0, requiredGpa: '0.00'
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [urgentAssignment, setUrgentAssignment] = useState<Assignment | null>(null);

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);
  useEffect(() => {
    if (window.location.hash.includes('type=')) setAppState('confirmation');
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user) { setAppState(prev => prev === 'confirmation' ? 'confirmation' : 'app'); fetchUserData(); }
      else if (appState === 'app') setAppState('landing');
    }
  }, [user, authLoading]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: goals } = await supabase.from('academic_goals').select('*').eq('user_id', user.id).maybeSingle();
      if (goals) setAcademicGoals({ currentGpa: goals.current_gpa || 0, targetGpa: goals.target_gpa || 4.0, coursesTaken: goals.courses_taken || 0, totalCourses: goals.total_courses || 0, coursesRemaining: goals.courses_remaining || 0, requiredGpa: goals.required_gpa || '0.00' });
     
      const { data: assigns } = await supabase.from('assignments').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
      if (assigns) {
        setAssignments(assigns.map(a => ({ id: a.id, title: a.title, course: a.course, dueDate: a.due_date, completed: a.completed })));
        for (const a of assigns) {
            const diff = (new Date(a.due_date).getTime() - new Date().getTime()) / 36e5;
            if (!a.completed && diff > 0 && diff <= 48 && !sessionStorage.getItem(`snoozed-${a.id}`)) { setUrgentAssignment({id:a.id,title:a.title,course:a.course,dueDate:a.due_date,completed:a.completed}); break; }
        }
      }
     
      const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs.map(n => ({ id: n.id, type: n.type, title: n.title, message: n.message, time: new Date(n.created_at).toLocaleDateString(), read: n.is_read })));
     
      const { data: quizzes } = await supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (quizzes) setQuizResults(quizzes.map(q => ({ id: q.id, courseName: q.course_name, score: q.score, totalQuestions: q.total_questions, date: new Date(q.created_at).toLocaleDateString() })));
     
      await fetchCourses();
    } catch (e) { console.error(e); }
  };

  const fetchCourses = async () => {
    if (!user) return;
    const { data: all } = await supabase.from('courses').select('*').eq('is_published', true);
    const { data: owned } = await supabase.from('user_courses').select('course_id').eq('user_id', user.id);
    const ownedIds = new Set(owned?.map(o => o.course_id));
    if (all) setCourses(all.map(c => ({ ...c, isOwned: ownedIds.has(c.id), image: c.image || 'https://via.placeholder.com/400' })));
  };

  const handleUpdateGoals = async (g: AcademicGoals) => { setAcademicGoals(g); if(user) await supabase.from('academic_goals').upsert({ user_id: user.id, current_gpa: g.currentGpa, target_gpa: g.targetGpa, courses_taken: g.coursesTaken, total_courses: g.totalCourses, courses_remaining: g.coursesRemaining, required_gpa: g.requiredGpa }); };
  const handleAddAssignment = async (a: Assignment) => { setAssignments([...assignments, a]); if(user) { const {data} = await supabase.from('assignments').insert({ user_id: user.id, title: a.title, course: a.course, due_date: a.dueDate, completed: a.completed }).select().single(); if(data) setAssignments(prev => prev.map(x => x.id === a.id ? {...x, id: data.id} : x)); } };
  const handleToggleAssignment = async (id: string) => { const updated = assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a); setAssignments(updated); const task = updated.find(a => a.id === id); if(task && user) await supabase.from('assignments').update({ completed: task.completed }).eq('id', id); };
  const handlePurchaseCourse = async (cid: string) => { if(!user) return; await supabase.from('user_courses').insert({ user_id: user.id, course_id: cid }); setCourses(c => c.map(x => x.id === cid ? { ...x, isOwned: true } : x)); fetchUserData(); };
  
  // --- UPDATED QUIZ STORAGE FUNCTION ---
  const handleAddQuizResult = async (r: QuizResult) => {
    // 1. Update UI Immediately
    setQuizResults([r, ...quizResults]);
    
    // 2. Save to Database
    if (user) {
      const { error } = await supabase.from('quiz_results').insert({
        user_id: user.id,
        course_name: r.courseName,
        score: r.score,
        total_questions: r.totalQuestions
      });

      if (error) {
        console.error("Failed to save quiz result:", error.message);
      } else {
        console.log("Quiz saved successfully.");
      }
    }
  };

  const handleMarkAllNotificationsRead = () => setNotifications([]);
  const handleDeleteNotification = (id: string) => setNotifications(n => n.filter(x => x.id !== id));
  const handleCompleteAssignment = (id: string) => { setAssignments(p => p.map(a => a.id === id ? { ...a, completed: true } : a)); setUrgentAssignment(null); if(user) supabase.from('assignments').update({ completed: true }).eq('id', id); };
  const handleSnoozeAssignment = () => { if(urgentAssignment) { sessionStorage.setItem(`snoozed-${urgentAssignment.id}`, 'true'); setUrgentAssignment(null); } };
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  const NavItem = ({ id, icon, label, onClick }: { id: PageRoute, icon: React.ReactNode, label: string, onClick?: () => void }) => {
    const isActive = route === id;
    return (
      <button onClick={() => { setRoute(id); if (onClick) onClick(); }} className={`flex flex-col md:flex-row items-center md:space-x-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${isActive ? 'text-primary bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
        <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>{icon}</div>
        <span className={`text-[10px] md:text-sm font-medium mt-1 md:mt-0`}>{label}</span>
      </button>
    );
  };

  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white flex-col gap-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p>Loading Grecko...</p></div>;
  if (isRecovery) return <UpdatePassword />;
  if (appState === 'confirmation') return <Confirmation onContinue={() => { window.history.replaceState(null, '', ' '); setAppState('app'); }} />;
  if (appState === 'landing') return <Landing onLoginWithEmail={() => { setAuthInitialView('login'); setAppState('auth'); }} onSignupWithEmail={() => { setAuthInitialView('signup'); setAppState('auth'); }} onGoogleAuth={signInWithGoogle} />;
  if (appState === 'auth') return <Auth onLogin={(u) => { setAppState('app'); }} onBack={() => setAppState('landing')} initialView={authInitialView} />;
  if (!user) return null;
  
  // LAYOUT LOGIC
  const isFullPage = route === 'mentor' || route === 'visual-learning';
  
  return (
    // ROOT: h-screen overflow-hidden prevents body scroll, enables scrolling in main
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-50 flex flex-col md:flex-row relative">
     
      {urgentAssignment && <AssignmentReminder assignment={urgentAssignment} isOpen={true} onComplete={handleCompleteAssignment} onSnooze={handleSnoozeAssignment} />}
     
      {/* DESKTOP SIDEBAR: Static full-height */}
      <aside className="hidden md:flex flex-none w-64 bg-zinc-900 border-r border-zinc-800 flex-col">
        <div className="p-6 flex items-center space-x-3 cursor-pointer" onClick={() => setRoute('dashboard')}><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div><span className="text-xl font-bold text-white tracking-tight">Grecko</span></div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavItem id="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem id="courses" icon={<BookOpen className="w-5 h-5" />} label="Courses" />
          <NavItem id="visual-learning" icon={<Video className="w-5 h-5" />} label="Visual Learning" />
          <NavItem id="study-tools" icon={<PenTool className="w-5 h-5" />} label="Study Tools" />
          <NavItem id="mentor" icon={<AiIcon className="w-5 h-5" />} label="AI Mentor" />
          <NavItem id="profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" />
          {isAdmin && (<div className="pt-4 mt-4 border-t border-zinc-800"><NavItem id="admin" icon={<ShieldCheck className="w-5 h-5 text-red-500" />} label="Admin Panel" /></div>)}
        </nav>
        <div className="p-4 border-t border-zinc-800 space-y-2"><div className="flex items-center space-x-3 p-3"><img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt="User" className="w-8 h-8 rounded-full bg-slate-200 object-cover" /><div className="flex-1 overflow-hidden"><p className="text-sm font-medium text-white truncate">{user.name}</p></div><button onClick={() => signOut()} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button></div></div>
      </aside>
      
      {/* MOBILE HEADER */}
      {!isFullPage && (
        <header className="flex md:hidden flex-none items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div><span className="font-bold text-lg text-white">Grecko</span></div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setRoute('notifications')} className="text-slate-400 relative"><Bell className="w-6 h-6" />{unreadNotificationsCount > 0 && (<span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse"></span>)}</button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400"><Menu className="w-6 h-6" /></button>
          </div>
        </header>
      )}
      
      {/* MOBILE MENU MODAL */}
      {isMobileMenuOpen && (<div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} /><div className="absolute right-0 top-0 bottom-0 w-64 bg-zinc-900 shadow-2xl p-6 animate-in slide-in-from-right duration-200 flex flex-col"><div className="flex justify-between items-center mb-8"><h2 className="text-lg font-bold text-white">Menu</h2><button onClick={() => setIsMobileMenuOpen(false)}><ChevronLeft className="w-6 h-6 text-white" /></button></div><div className="space-y-4 flex-1"><button onClick={() => { setRoute('profile'); setIsMobileMenuOpen(false); }} className="flex items-center space-x-3 text-slate-300 w-full p-2 hover:bg-zinc-800 rounded-lg"><UserIcon className="w-5 h-5" /> <span>Profile</span></button>{isAdmin && (<button onClick={() => { setRoute('admin'); setIsMobileMenuOpen(false); }} className="flex items-center space-x-3 text-red-400 w-full p-2 hover:bg-zinc-800 rounded-lg"><ShieldCheck className="w-5 h-5" /> <span>Admin Panel</span></button>)}</div><div className="pt-4 border-t border-zinc-800 space-y-4"><Button variant="danger" fullWidth onClick={() => signOut()} className="flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Log Out</Button></div></div></div>)}
      
      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 relative w-full overflow-y-auto ${isFullPage ? 'h-[100dvh] overflow-hidden bg-black' : ''}`}>
          <div className={`w-full ${isFullPage ? 'h-full overflow-hidden' : 'p-4 md:p-8 pb-32 md:pb-8'}`}>
              <div className={`${isFullPage ? 'h-full w-full' : 'max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300'}`}>
                  {route === 'dashboard' && <Dashboard user={user} onNavigate={setRoute} academicGoals={academicGoals} updateGoals={handleUpdateGoals} assignments={assignments} quizResults={quizResults} />}
                  {route === 'courses' && <Courses courses={courses} onPurchase={handlePurchaseCourse} onOpenReader={(id) => { setSelectedCourseId(id); setRoute('reader'); }} />}
                  {route === 'reader' && selectedCourseId && <CourseReader courseId={selectedCourseId} onBack={() => setRoute('courses')} courses={courses} />}
                  {route === 'visual-learning' && <VisualLearning onNavigateToCourse={() => setRoute('courses')} />}
                  {route === 'study-tools' && <StudyTools assignments={assignments} courses={courses} onAdd={handleAddAssignment} onToggle={handleToggleAssignment} onAddQuizResult={handleAddQuizResult} />}
                  {route === 'mentor' && <AiMentor user={user} assignments={assignments} academicGoals={academicGoals} quizResults={quizResults} courses={courses} onViewCourse={(id) => { const course = courses.find(c => c.id === id); if (course?.isOwned) { setSelectedCourseId(id); setRoute('reader'); } else { setRoute('courses'); } }} />}
                  {route === 'profile' && <Profile user={user} onLogout={() => signOut()} onUpdateUser={async (updates) => { await supabase.from('profiles').update(updates).eq('id', user.id); }} />}
                  {route === 'notifications' && <Notifications notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onDelete={handleDeleteNotification} onNavigate={setRoute} />}
                  {route === 'admin' && <Admin user={user} onNavigate={setRoute} />}
              </div>
          </div>
      </main>
      
      {/* MOBILE BOTTOM NAV - Fixed Layer */}
      <nav className={`${isFullPage ? 'bg-black/90 border-t-0 text-white' : 'bg-zinc-900 border-t border-zinc-800'} md:hidden fixed bottom-0 left-0 right-0 px-2 py-2 flex justify-between items-center z-50 pb-safe transition-colors`}>
        <NavItem id="dashboard" icon={<LayoutDashboard className="w-6 h-6" />} label="Home" />
        <NavItem id="courses" icon={<BookOpen className="w-6 h-6" />} label="Courses" />
        <NavItem id="visual-learning" icon={<Video className="w-6 h-6" />} label="Watch" />
        <NavItem id="study-tools" icon={<PenTool className="w-6 h-6" />} label="Tools" />
        <NavItem id="mentor" icon={<AiIcon className="w-6 h-6" />} label="Mentor" />
      </nav>
    </div>
  );
}
