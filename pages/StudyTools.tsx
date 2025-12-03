import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Card, Button, Input, Modal } from '../components/UI';
import { 
  Brain, Layers, Play, Pause, RotateCcw, CheckCircle2, 
  Plus, Clock, AlertCircle, ChevronLeft, ChevronRight, 
  Check, X, Trophy, RefreshCw, Lock, Loader2, Settings2, 
  Info, Minimize2, Flame, CloudRain, Volume2 
} from 'lucide-react';
import { Assignment, Course, QuizResult, QuizQuestion, Flashcard } from '../types';
import { supabase } from '../lib/supabase';

interface StudyToolsProps {
  assignments: Assignment[];
  courses: Course[];
  onAdd: (assignment: Assignment) => void;
  onToggle: (id: string) => void;
  onAddQuizResult: (result: QuizResult) => void;
}

export const StudyTools: React.FC<StudyToolsProps> = ({ assignments, courses, onAdd, onToggle, onAddQuizResult }) => {
  const [activeTab, setActiveTab] = useState('Practice');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-none">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Study Tools</h1>
      </div>
      <div className="flex-none">
         <Tabs tabs={['Practice', 'Focus']} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      
      {activeTab === 'Practice' && <PracticeTab courses={courses} onAddQuizResult={onAddQuizResult} />}
      {activeTab === 'Focus' && <FocusTab assignments={assignments} onAdd={onAdd} onToggle={onToggle} />}
    </div>
  );
};

// --- PRACTICE TAB (Quizzes & Flashcards) ---
const PracticeTab = ({ courses, onAddQuizResult }: { courses: Course[], onAddQuizResult: (result: QuizResult) => void }) => {
  const [view, setView] = useState<'menu' | 'course_select' | 'active'>('menu');
  const [mode, setMode] = useState<'quiz' | 'flashcards' | null>(null); 
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
  const [flashcardCount, setFlashcardCount] = useState(10);

  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Flashcard State
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const hasSavedResult = useRef(false);

  const handleModeSelect = (selectedMode: 'quiz' | 'flashcards') => {
      setMode(selectedMode);
      setView('course_select');
  };

  const handleCourseSelect = async (course: Course) => {
    if (!course.isOwned) {
      setShowPurchaseModal(true);
      return;
    }
    setActiveCourse(course);
    setIsGenerating(true);
    
    try {
        const { data: { session } } = await (supabase.auth as any).getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await fetch(`${(supabase as any).supabaseUrl}/functions/v1/ai-assistant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                type: mode, 
                courseId: course.id,
                courseTitle: course.title,
                courseDescription: course.description,
                courseContent: course.content || '',
                count: mode === 'quiz' ? 10 : flashcardCount
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Edge function error");

        if (mode === 'quiz') {
            if (Array.isArray(data.data) && data.data.length > 0) {
                setQuestions(data.data);
                setQuizStep(0);
                setQuizScore(0);
                setSelectedOption(null);
                setIsAnswerChecked(false);
                setUserAnswers({});
                hasSavedResult.current = false;
                setView('active');
            } else {
                throw new Error("Empty quiz response from AI");
            }
        } else if (mode === 'flashcards') {
            if (Array.isArray(data.data) && data.data.length > 0) {
                setGeneratedFlashcards(data.data);
                setFcIndex(0);
                setIsFlipped(false);
                setView('active');
            } else {
                throw new Error("Empty flashcard response from AI");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error generating content. Please try again.");
        setIsGenerating(false); 
    } finally {
        if (view !== 'active') {
           setIsGenerating(false);
        }
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(index);
    setIsAnswerChecked(true);
    
    setUserAnswers(prev => ({...prev, [quizStep]: index}));

    if (index === questions[quizStep].correct) {
      setQuizScore(prev => prev + 1);
    }
    setTimeout(() => {
        handleNextQuestion();
    }, 1500);
  };

  const handleNextQuestion = () => {
    setQuizStep(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerChecked(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFcIndex(prev => (prev + 1) % generatedFlashcards.length);
    }, 300);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFcIndex(prev => (prev - 1 + generatedFlashcards.length) % generatedFlashcards.length);
    }, 300);
  };

  const isQuizFinished = mode === 'quiz' && view === 'active' && questions.length > 0 && quizStep >= questions.length;

  useEffect(() => {
    if (isQuizFinished && !hasSavedResult.current && activeCourse) {
        const percentage = Math.round((quizScore / questions.length) * 100);
        onAddQuizResult({
            id: Date.now().toString(),
            courseName: activeCourse.title,
            score: percentage,
            totalQuestions: questions.length,
            date: new Date().toLocaleDateString()
        });
        hasSavedResult.current = true;
    }
  }, [isQuizFinished, quizScore, questions.length, activeCourse, onAddQuizResult]);

  if (isGenerating) {
     return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 animate-in fade-in h-[400px]">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-900 dark:text-white font-medium text-lg">Generating {mode === 'quiz' ? 'Quiz' : 'Flashcards'}...</p>
            <p className="text-slate-500 text-sm mt-1">Analyzing {activeCourse?.title}...</p>
        </div>
     );
  }

  // 1. Menu View
  if (view === 'menu') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
        <Card onClick={() => handleModeSelect('flashcards')} className="cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-all group relative overflow-hidden h-[240px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Layers className="w-32 h-32 text-purple-600 dark:text-purple-400 transform rotate-12" /></div>
            <div className="bg-purple-100 dark:bg-purple-900/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
            <div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Flashcards</h3><p className="text-sm text-slate-500 dark:text-slate-400">Instantly generate study sets from your courses.</p></div>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-sm mt-4 group-hover:translate-x-1 transition-transform">Start Learning <ChevronRight className="w-4 h-4 ml-1" /></div>
        </Card>
        <Card onClick={() => handleModeSelect('quiz')} className="cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all group relative overflow-hidden h-[240px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Brain className="w-32 h-32 text-blue-600 dark:text-blue-400 transform -rotate-12" /></div>
            <div className="bg-blue-100 dark:bg-blue-900/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
            <div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Practice Quiz</h3><p className="text-sm text-slate-500 dark:text-slate-400">10 Questions to test your mastery.</p></div>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm mt-4 group-hover:translate-x-1 transition-transform">Take Quiz <ChevronRight className="w-4 h-4 ml-1" /></div>
        </Card>
      </div>
    );
  }

  // 2. Course Select View
  if (view === 'course_select') {
     return (
        <div className="animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><ChevronLeft className="w-6 h-6 text-slate-900 dark:text-white" /></button><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Select a Course</h2><p className="text-sm text-slate-500">Source material for your {mode}</p></div></div>
            {mode === 'flashcards' && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl flex items-center gap-4 border border-slate-200 dark:border-zinc-800">
                    <Settings2 className="w-5 h-5 text-slate-400" />
                    <div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Number of cards:</span>{[5, 10, 15, 20].map(num => (<button key={num} onClick={() => setFlashcardCount(num)} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${flashcardCount === num ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-slate-600 dark:text-slate-400'}`}>{num}</button>))}</div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.length === 0 && <p className="col-span-3 text-center text-slate-500 py-10">No courses available. Go to the marketplace to add some!</p>}
                {courses.map(course => (
                    <div key={course.id} onClick={() => handleCourseSelect(course)} className={`relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg flex items-center gap-4 ${course.isOwned ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-primary dark:hover:border-primary' : 'bg-slate-50 dark:bg-zinc-900/50 border-dashed border-slate-300 dark:border-zinc-800 opacity-75 hover:opacity-100'}`}>
                        <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-zinc-800 overflow-hidden shrink-0"><img src={course.image} alt={course.title} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-900 dark:text-white truncate">{course.title}</h3>{!course.isOwned && (<div className="mt-1 flex items-center text-[10px] font-bold text-amber-500 uppercase"><Lock className="w-3 h-3 mr-1" /> Locked</div>)}</div>
                    </div>
                ))}
            </div>
            <Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Course Locked"><div className="text-center space-y-4 py-4"><div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-500"><Lock className="w-8 h-8" /></div><h3>Purchase Required</h3><Button fullWidth onClick={() => { setShowPurchaseModal(false); }}>Go to Marketplace</Button></div></Modal>
        </div>
     );
  }

  // 3. Active Quiz View
  if (view === 'active' && mode === 'quiz') {
      if (isQuizFinished) {
          return (
             <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 py-10">
                 <div className="text-center">
                    <div className="relative inline-block mb-4"><Trophy className="w-24 h-24 text-yellow-500 mx-auto drop-shadow-xl" /><div className="absolute -top-2 -right-2 bg-primary text-white font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">{Math.round((quizScore / questions.length) * 100)}%</div></div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Quiz Completed!</h2>
                    <p className="text-slate-500">You scored {quizScore} out of {questions.length}</p>
                 </div>
                 <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                     <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Review Answers</h3></div>
                     <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                         {questions.map((q, idx) => {
                             const userAnswer = userAnswers[idx];
                             const isCorrect = userAnswer === q.correct;
                             return (
                                 <div key={idx} className="p-5 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                     <div className="flex gap-3 mb-3">
                                         <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{idx + 1}</div>
                                         <p className="font-medium text-slate-900 dark:text-white">{q.question}</p>
                                     </div>
                                     <div className="pl-9 space-y-3">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                             <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50 text-red-800 dark:text-red-200'}`}><span className="text-xs uppercase font-bold opacity-70 block mb-1">Your Answer</span>{q.options[userAnswer] || "Skipped"}</div>
                                             {!isCorrect && (<div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50 text-blue-800 dark:text-blue-200"><span className="text-xs uppercase font-bold opacity-70 block mb-1">Correct Answer</span>{q.options[q.correct]}</div>)}
                                         </div>
                                         {q.explanation && (<div className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-zinc-800 p-3 rounded-lg"><span className="font-bold not-italic">Why: </span> {q.explanation}</div>)}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4"><Button variant="secondary" onClick={() => setView('menu')} icon={<RotateCcw className="w-4 h-4"/>}>Menu</Button><Button onClick={() => { setView('course_select'); setMode('quiz'); }} icon={<RefreshCw className="w-4 h-4"/>}>Try Another</Button></div>
             </div>
          )
      }
      const question = questions[quizStep];
      return (
         <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
             <div className="flex items-center justify-between mb-8"><Button variant="ghost" onClick={() => { if(confirm("Quit quiz?")) setView('menu'); }} className="text-slate-500">Quit</Button><div className="text-sm font-bold text-slate-900 dark:text-white">Question {quizStep + 1} <span className="text-slate-400 font-normal">/ {questions.length}</span></div></div>
             <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${((quizStep) / questions.length) * 100}%` }} /></div>
             <div className="min-h-[200px] flex items-center justify-center py-8"><h2 className="text-xl md:text-2xl font-bold text-center text-slate-900 dark:text-white leading-relaxed">{question.question}</h2></div>
             <div className="grid grid-cols-1 gap-3">{question.options.map((opt, idx) => { let statusClass = "border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-zinc-800"; if (isAnswerChecked) { if (idx === question.correct) statusClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"; else if (idx === selectedOption) statusClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 opacity-60"; else statusClass = "border-slate-200 dark:border-zinc-800 opacity-50"; } return (<button key={idx} disabled={isAnswerChecked} onClick={() => handleQuizAnswer(idx)} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium text-slate-700 dark:text-slate-200 ${statusClass}`}><div className="flex items-center justify-between"><span>{opt}</span>{isAnswerChecked && idx === question.correct && <CheckCircle2 className="w-5 h-5 text-green-500" />} {isAnswerChecked && idx === selectedOption && idx !== question.correct && <X className="w-5 h-5 text-red-500" />}</div></button>); })}</div>
             {isAnswerChecked && question.explanation && (<div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl animate-in slide-in-from-bottom-2"><div className="flex items-start gap-3"><Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" /><div><p className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-1">Explanation</p><p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{question.explanation}</p></div></div></div>)}
         </div>
      );
  }

  // 4. Active Flashcard View (FIXED MOBILE 3D FLIP WITHOUT GHOSTING)
  if (view === 'active' && mode === 'flashcards') {
      const card = generatedFlashcards[fcIndex];
      return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center justify-between mb-6"><Button variant="ghost" onClick={() => setView('menu')} className="text-slate-500">Exit</Button><div className="text-sm font-bold text-slate-900 dark:text-white">{fcIndex + 1} / {generatedFlashcards.length}</div></div>
            
            {/* FIXED 3D CONTAINER */}
            <div 
                className="flex-1 relative group" 
                style={{ perspective: '1000px', WebkitPerspective: '1000px' }}
            >
                <div 
                    className="w-full h-full relative"
                    style={{ 
                        transformStyle: 'preserve-3d', 
                        WebkitTransformStyle: 'preserve-3d',
                        transition: 'transform 0.6s', 
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        cursor: 'pointer'
                    }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* FRONT */}
                    <div 
                        className="absolute inset-0 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                        style={{ 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(0deg) translateZ(1px)', // Pushes front forward
                            WebkitTransform: 'rotateY(0deg) translateZ(1px)' 
                        }}
                    >
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden select-none"><span className="text-8xl font-black text-slate-900 dark:text-white -rotate-45 transform scale-150">Grecko</span></div>
                        
                        <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-wider text-slate-400">Term</span>
                        <h2 className="relative text-3xl md:text-4xl font-bold text-slate-900 dark:text-white z-10 select-none">{card.front}</h2>
                        <p className="absolute bottom-6 text-sm text-slate-400 animate-pulse">Tap to flip</p>
                    </div>

                    {/* BACK */}
                    <div 
                        className="absolute inset-0 bg-purple-600 dark:bg-purple-900 border-2 border-purple-500 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
                        style={{ 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden', 
                            transform: 'rotateY(180deg) translateZ(1px)', // Pushes back forward when flipped
                            WebkitTransform: 'rotateY(180deg) translateZ(1px)'
                        }}
                    >
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] overflow-hidden select-none"><span className="text-8xl font-black text-white -rotate-45 transform scale-150">Grecko</span></div>

                        <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-wider text-purple-200">Definition</span>
                        <p className="relative text-xl md:text-2xl font-medium leading-relaxed z-10 select-none">{card.back}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center gap-8 mt-8"><button onClick={prevCard} className="p-4 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"><ChevronLeft className="w-6 h-6" /></button><div className="h-12 w-[1px] bg-slate-200 dark:bg-zinc-800"></div><button onClick={nextCard} className="p-4 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"><ChevronRight className="w-6 h-6" /></button></div>
        </div>
      );
  }

  return null;
};

const FocusTab = ({ assignments, onAdd, onToggle }: { assignments: Assignment[], onAdd: (a: Assignment) => void, onToggle: (id: string) => void }) => {
  const [newAssignment, setNewAssignment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseName, setCourseName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.trim()) return;
    onAdd({
      id: Date.now().toString(),
      title: newAssignment,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      completed: false,
      course: courseName || 'General'
    });
    setNewAssignment("");
    setDueDate("");
    setCourseName("");
  };

  return (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-6">
              <div className="flex items-center justify-between mb-6"><h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Tasks & Assignments</h3></div>
              <form onSubmit={handleAdd} className="flex gap-2 mb-6"><Input placeholder="Add new task..." value={newAssignment} onChange={(e) => setNewAssignment(e.target.value)} className="flex-1" /><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40 hidden md:block" /><Button type="submit" size="sm" icon={<Plus className="w-4 h-4"/>}>Add</Button></form>
              <div className="space-y-3">{assignments.length === 0 && (<div className="text-center py-10 text-slate-500">No active tasks. Great job!</div>)}{assignments.map(task => (<div key={task.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${task.completed ? 'bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 opacity-60' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900'}`}><div className="flex items-center gap-4"><button onClick={() => onToggle(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-zinc-600 hover:border-blue-500'}`}>{task.completed && <Check className="w-4 h-4 text-white" />}</button><div><div className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{task.title}</div><div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5"><span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{task.course}</span>{task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}</div></div></div></div>))}</div>
           </Card>
        </div>
        {/* Focus Timer */}
        <div><FocusTimer /></div>
     </div>
  );
};

const getSmartRecommendation = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! You usually focus best with a 25m session now.";
    if (hour < 17) return "Afternoon slump? Try a short 15m sprint to get moving.";
    return "Evening study detected. Aim for 45m to finish your goals.";
};
  
const FocusTimer = () => {
      const [duration, setDuration] = useState(25);
      const [timeLeft, setTimeLeft] = useState(25 * 60);
      const [isActive, setIsActive] = useState(false);
      const [mode, setMode] = useState<'focus' | 'break'>('focus');
      const [task, setTask] = useState('');
      const [sound, setSound] = useState<'none' | 'rain' | 'fire'>('none');
      const [isFullScreen, setIsFullScreen] = useState(false);
      const [showDistractionModal, setShowDistractionModal] = useState(false);
      const [recommendation, setRecommendation] = useState('');
      const audioRef = useRef<HTMLAudioElement | null>(null);
  
      const soundUrls: Record<'none' | 'rain' | 'fire', string> = {
          none: '',
          rain: 'https://www.orangefreesounds.com/wp-content/uploads/2016/10/Rain-white-noise.mp3',
          fire: 'https://orangefreesounds.com/wp-content/uploads/2024/11/Fire-crackling-sound-effect.mp3'
      };
  
      useEffect(() => {
          setRecommendation(getSmartRecommendation());
      }, []);
  
      useEffect(() => {
          const handleVisibilityChange = () => {
              if (document.hidden && isActive) {
                  setIsActive(false); 
                  if (audioRef.current) audioRef.current.pause();
                  setShowDistractionModal(true);
              }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);
          return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, [isActive]);
  
      useEffect(() => {
          let interval: any = null;
          if (isActive && timeLeft > 0) {
              interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
          } else if (timeLeft === 0) {
              setIsActive(false);
              if (audioRef.current) audioRef.current.pause();
              
              if (mode === 'focus') {
                  if (Notification.permission === "granted") {
                      new Notification("Focus Session Complete", { body: "Time for a break!" });
                  }
                  setMode('break');
                  setDuration(5);
                  setTimeLeft(5 * 60);
              } else {
                  setMode('focus');
                  setDuration(25);
                  setTimeLeft(25 * 60);
              }
          }
          return () => { if (interval) clearInterval(interval); };
      }, [isActive, timeLeft, mode]);
  
      useEffect(() => {
          if (isActive && sound !== 'none' && !showDistractionModal) {
              if (!audioRef.current) {
                  audioRef.current = new Audio(soundUrls[sound]);
                  audioRef.current.loop = true;
              } else if (audioRef.current.src !== soundUrls[sound]) {
                  audioRef.current.src = soundUrls[sound];
              }
              audioRef.current.play().catch(e => console.log("Audio play failed (interaction required)", e));
          } else if (audioRef.current) {
              audioRef.current.pause();
          }
      }, [isActive, sound, showDistractionModal]);
  
      const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };
  
      const startSession = () => {
          if (!task.trim() && mode === 'focus') {
              alert('Please attach a task first to make this session count!');
              return;
          }
          setIsActive(true);
          setIsFullScreen(true);
          if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch((e) => console.log(e));
          }
      };
  
      const exitSession = () => {
          setIsActive(false);
          setIsFullScreen(false);
          if (document.exitFullscreen && document.fullscreenElement) {
              document.exitFullscreen();
          }
      };
  
      const progress = timeLeft / (duration * 60);
      const radius = 180; 
      const circumference = 2 * Math.PI * radius;
  
      // 1. SETUP VIEW (Small Card)
      if (!isFullScreen) {
          return (
              <Card className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  
                  <div className="space-y-6 w-full relative z-10">
                      <div className="space-y-2">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                              <Clock className="w-8 h-8 text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold">Focus Timer</h3>
                          <p className="text-slate-400 text-xs italic">"{recommendation}"</p>
                      </div>
  
                      <div className="text-left space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Your Objective</label>
                          <Input
                              placeholder="What are you working on?"
                              value={task}
                              onChange={(e) => setTask(e.target.value)}
                              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                          />
                      </div>
  
                      <div className="text-left space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Environment</label>
                          <div className="grid grid-cols-3 gap-2">
                              {[
                                  { id: 'none', icon: Volume2, label: 'Silent' },
                                  { id: 'rain', icon: CloudRain, label: 'Rain' },
                                  { id: 'fire', icon: Flame, label: 'Fire' }
                              ].map((s) => (
                                  <button
                                      key={s.id}
                                      onClick={() => setSound(s.id as any)}
                                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                          sound === s.id 
                                          ? 'bg-blue-600 border-blue-500 text-white' 
                                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                      }`}
                                  >
                                      <s.icon className="w-5 h-5 mb-1" />
                                      <span className="text-[10px] uppercase font-bold">{s.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
  
                      <Button fullWidth onClick={startSession} className="h-12 bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">
                          <Play className="w-5 h-5 mr-2" /> Start Focus Session
                      </Button>
                  </div>
              </Card>
          );
      }
  
      // 2. MODERN FULL SCREEN VIEW
      return (
          <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center text-white animate-in fade-in duration-700">
              
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" /> 
                    <stop offset="100%" stopColor="#3b82f6" /> 
                  </linearGradient>
                  <linearGradient id="gradient-break" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
  
              <div className={`absolute inset-0 transition-opacity duration-1000 ${sound === 'fire' ? 'opacity-20 bg-orange-900/40 mix-blend-overlay' : 'opacity-0'}`}></div>
              <div className={`absolute inset-0 transition-opacity duration-1000 ${sound === 'rain' ? 'opacity-20 bg-blue-900/40 mix-blend-overlay' : 'opacity-0'}`}></div>
              <div className="absolute inset-0 bg-radial-gradient from-blue-900/10 to-transparent opacity-50 pointer-events-none"></div>
  
              <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
                  <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                      </div>
                      <span className="text-sm font-light tracking-[0.2em] uppercase text-slate-300">{mode} Mode</span>
                  </div>
                  <button onClick={exitSession} className="group p-3 rounded-full hover:bg-white/5 transition-all">
                      <Minimize2 className="w-5 h-5 text-slate-400 group-hover:text-white" />
                  </button>
              </div>
  
              <div className="relative z-10 flex flex-col items-center justify-center">
                  
                  <div className="relative w-[450px] h-[450px] flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="225"
                                cy="225"
                                r={radius}
                                stroke="#1e293b"
                                strokeWidth="2"
                                fill="none"
                            />
                            <circle
                                cx="225"
                                cy="225"
                                r={radius}
                                stroke={mode === 'focus' ? "url(#gradient-focus)" : "url(#gradient-break)"}
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - progress)}
                                className="transition-all duration-1000 ease-linear"
                                style={{ 
                                    filter: `drop-shadow(0 0 15px ${mode === 'focus' ? 'rgba(34, 211, 238, 0.3)' : 'rgba(52, 211, 153, 0.3)'})` 
                                }}
                            />
                        </svg>
  
                        <div className="flex flex-col items-center justify-center animate-in zoom-in-50 duration-700">
                             <div className="text-[120px] leading-none font-light tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 select-none">
                                 {formatTime(timeLeft)}
                             </div>
                             
                             <div className="mt-8 flex items-center gap-6">
                                <button 
                                    onClick={() => {
                                        setIsActive(!isActive);
                                    }}
                                    className="group flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
                                >
                                    {isActive ? 
                                        <Pause className="w-6 h-6 fill-white text-white" /> : 
                                        <Play className="w-6 h-6 fill-white text-white ml-1" />
                                    }
                                </button>
                             </div>
                        </div>
                  </div>
  
                  <div className="mt-4 text-center space-y-2 opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-forwards" style={{ animationDelay: '200ms' }}>
                      <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">Current Focus</p>
                      <h2 className="text-3xl font-light text-white/90 max-w-2xl px-4 leading-relaxed">
                          {task || "Deep Work Session"}
                      </h2>
                  </div>
              </div>
  
              <Modal isOpen={showDistractionModal} onClose={() => {}} title="">
                  <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-red-500/20">
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                          <AlertCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Focus Broken!</h2>
                      <p className="text-slate-500 mb-6">
                          You switched tabs. The timer was paused to keep you accountable.
                          <br/>Are you ready to get back to work?
                      </p>
                      <Button 
                          fullWidth 
                          size="lg"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => { 
                              setShowDistractionModal(false); 
                              setIsActive(true); 
                              if(sound !== 'none' && audioRef.current) audioRef.current.play();
                          }}
                      >
                          Resume Session
                      </Button>
                      <button 
                          onClick={() => { setShowDistractionModal(false); exitSession(); }}
                          className="mt-4 text-sm text-slate-400 hover:text-slate-600 underline"
                      >
                          I give up (End Session)
                      </button>
                  </div>
              </Modal>
          </div>
      );
  };