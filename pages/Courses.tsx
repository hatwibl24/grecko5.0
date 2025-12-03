import React, { useState, useEffect, useRef } from 'react';
import { Search, Lock, ArrowLeft, Download, Check, X, BookOpen } from 'lucide-react';
import { Card, Button, Modal } from '../components/UI';
import { Course } from '../types';
import { supabase } from '../lib/supabase';
import { PaymentModal } from '../components/PaymentModal';

const AiIcon = ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M18 18L6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>);

interface CoursesProps { courses: Course[]; onPurchase: (courseId: string) => void; onOpenReader: (id: string) => void; }

// UPDATED: Changed onDownloadPdf to accept the full Course object
interface CourseItemProps { course: Course; onDownloadPdf: (course: Course) => void; onOpenReader: (id: string) => void; onPurchase: (course: Course) => void; }

const CourseItem: React.FC<CourseItemProps> = ({ course, onDownloadPdf, onOpenReader, onPurchase }) => (
  <Card className="p-0 overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
    <div className="h-28 md:h-32 overflow-hidden relative bg-slate-100 dark:bg-zinc-800 shrink-0"><img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />{course.isOwned && (<div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Owned</div>)}<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /></div>
    <div className="p-3 md:p-4 flex-1 flex flex-col"><div className="flex justify-between items-start gap-2 mb-1 md:mb-2"><h3 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white leading-tight line-clamp-2">{course.title}</h3></div><p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mb-3 md:mb-4 line-clamp-2 flex-1">{course.description}</p><div className="flex items-center justify-between text-xs text-slate-400 mb-3 md:mb-4"><span className="bg-slate-100 dark:bg-zinc-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px] md:max-w-[120px] text-[10px] md:text-xs">{course.author}</span></div><div className="pt-2 md:pt-3 border-t border-slate-100 dark:border-zinc-800 mt-auto">{course.isOwned ? (<div className="flex flex-col md:flex-row gap-2 w-full"><Button variant="secondary" className="flex-1 h-8 md:h-9 text-[10px] md:text-xs px-0" onClick={() => onDownloadPdf(course)}><Download className="w-3 h-3 mr-1.5" /> PDF</Button><Button variant="primary" className="flex-1 h-8 md:h-9 text-[10px] md:text-xs px-0 bg-green-600 hover:bg-green-700 border-green-600" onClick={() => onOpenReader(course.id)}>Open</Button></div>) : (<div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2 md:gap-0"><span className="font-bold text-sm md:text-lg text-slate-900 dark:text-white">${course.price}</span><Button size="sm" onClick={() => onPurchase(course)} className="bg-blue-600 hover:bg-blue-700 text-white border-none h-8 md:h-9 text-[10px] md:text-xs px-3 md:px-4 font-bold shadow-blue-500/20 shadow-lg w-full md:w-auto whitespace-nowrap">Buy Now</Button></div>)}</div></div>
  </Card>
);

export const Courses: React.FC<CoursesProps> = ({ courses, onPurchase, onOpenReader }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePurchaseClick = (course: Course) => {
    setSelectedCourse(course);
  };

  const handlePaymentSuccess = () => {
    if (selectedCourse) {
      onPurchase(selectedCourse.id);
      setSelectedCourse(null);
    }
  };

  // --- NEW: REAL PDF GENERATION LOGIC ---
  const handleDownloadPdf = (course: Course) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to download the PDF.");
        return;
    }

    const htmlContent = `
        <html>
        <head>
            <title>${course.title} - Syllabus</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                h1 { color: #2563EB; border-bottom: 2px solid #eee; padding-bottom: 15px; font-size: 28px; }
                .meta { color: #666; margin-bottom: 30px; font-size: 14px; background: #f9fafb; padding: 10px; border-radius: 8px; }
                img.cover { width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee; }
                .content { font-size: 16px; }
                .content h2 { margin-top: 30px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                .content p { margin-bottom: 15px; }
                .content img { max-width: 100%; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
                @media print {
                   body { -webkit-print-color-adjust: exact; }
                   img { max-width: 100%; page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>${course.title}</h1>
            <div class="meta">
                <strong>Author:</strong> ${course.author} &nbsp;|&nbsp; <strong>Course ID:</strong> ${course.id}
            </div>
            ${course.image ? `<img src="${course.image}" class="cover" />` : ''}
            
            <div class="content">
                ${course.content || '<p><i>No written content available for this course yet.</i></p>'}
            </div>

            <div class="footer">
                Generated by Grecko Learning Platform
            </div>

            <script>
                // Automatically trigger print dialog then close window
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        // window.close(); // Optional: Close after printing
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredCourses = courses.filter(course => (course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.author.toLowerCase().includes(searchQuery.toLowerCase())));
  const ownedCourses = filteredCourses.filter(c => c.isOwned);
  const marketplaceCourses = filteredCourses.filter(c => !c.isOwned);

  return (
    <div className="space-y-8 pb-32 md:pb-20">
      <div className="flex flex-col gap-6"><div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Courses</h1><p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Access your content and explore the marketplace</p></div><div className="w-full md:w-96 relative group z-10"><div className="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-[28px] transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"><Search className="w-5 h-5 text-slate-400 ml-5 shrink-0" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search titles or authors..." className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3.5 outline-none border-none focus:ring-0 text-sm rounded-[28px]" />{searchQuery && (<button onClick={() => setSearchQuery('')} className="mr-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>)}</div></div></div></div>
      {ownedCourses.length > 0 && (<section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"><h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><BookOpen className="w-4 h-4 text-primary" /></div> My Learning</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">{ownedCourses.map(course => (<CourseItem key={course.id} course={course} onDownloadPdf={handleDownloadPdf} onOpenReader={onOpenReader} onPurchase={handlePurchaseClick} />))}</div></section>)}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"><div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{searchQuery ? 'Search Results' : 'Explore Marketplace'}</h2><span className="text-xs text-slate-500">{marketplaceCourses.length} {marketplaceCourses.length === 1 ? 'course' : 'courses'}</span></div>{marketplaceCourses.length === 0 && ownedCourses.length === 0 ? (<div className="text-center py-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-zinc-900/50"><div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-slate-300 dark:text-slate-500" /></div><h3 className="text-lg font-medium text-slate-900 dark:text-white">No courses found</h3><p className="text-slate-500 text-sm mt-1">Try adjusting your search terms</p><Button variant="ghost" className="mt-6" onClick={() => setSearchQuery('')}>Clear Search</Button></div>) : (<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">{marketplaceCourses.map(course => (<CourseItem key={course.id} course={course} onDownloadPdf={handleDownloadPdf} onOpenReader={onOpenReader} onPurchase={handlePurchaseClick} />))}</div>)}</section>
      {selectedCourse && <PaymentModal price={selectedCourse.price.toString()} courseId={selectedCourse.id} courseTitle={selectedCourse.title} onClose={() => setSelectedCourse(null)} onSuccess={handlePaymentSuccess} />}
    </div>
  );
};

export const CourseReader: React.FC<{ courseId: string, onBack: () => void, courses?: Course[] }> = ({ courseId, onBack, courses }) => {
  const course = courses?.find(c => c.id === courseId);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [question, setQuestion] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState<{top: number, left: number} | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setAiMenuOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
  useEffect(() => {
    const handleMouseUp = () => { const selection = window.getSelection(); if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) { const range = selection.getRangeAt(0); const rect = range.getBoundingClientRect(); setSelectionPos({ top: rect.top - 50, left: rect.left + (rect.width / 2) }); setSelectedText(selection.toString()); } };
    const handleInteraction = (e: Event) => { if (e.type === 'scroll') setSelectionPos(null); };
    document.addEventListener('mouseup', handleMouseUp); document.addEventListener('keyup', handleMouseUp); window.addEventListener('scroll', handleInteraction, true);
    return () => { document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('keyup', handleMouseUp); window.removeEventListener('scroll', handleInteraction, true); };
  }, []);

  const handleAiRequest = async (type: 'summarize' | 'key_points' | 'explain' | 'examples' | 'question', customPrompt?: string) => {
    if (!course?.content) return;
    setAiMenuOpen(false); setIsLoading(true); if (type !== 'question') setShowQuestionInput(false);
    try {
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch(`${(supabase as any).supabaseUrl}/functions/v1/ai-assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ type: 'text-analysis', action: type, text: selectedText || course.content, context: selectedText ? course.content : undefined, prompt: customPrompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAiResult({ title: type === 'question' ? 'Answer' : type.replace('_', ' '), content: data.text });
      if (type !== 'question') { window.getSelection()?.removeAllRanges(); setSelectedText(''); setSelectionPos(null); }
    } catch (error) { console.error(error); setAiResult({ title: "Error", content: "Sorry, I couldn't process that request right now." }); } finally { setIsLoading(false); if (type === 'question') setShowQuestionInput(false); }
  };

  if (!course) return <div>Course not found</div>;
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-zinc-800 pb-4 shrink-0"><button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 dark:text-white" /></button><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">{course.title}</h2><p className="text-sm text-slate-500">Chapter 1: Introduction</p></div></div>
      <div className="flex-1 overflow-y-auto relative scroll-smooth pb-32" onScroll={() => setSelectionPos(null)}><div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-2xl shadow-sm prose dark:prose-invert prose-slate prose-headings:font-bold prose-a:text-blue-600 mb-20 selection:bg-primary/30 selection:text-inherit break-words"><div dangerouslySetInnerHTML={{ __html: course.content || '' }} /></div></div>
      {selectionPos && (<div className="fixed z-50 transform -translate-x-1/2 animate-in fade-in zoom-in duration-200" style={{ top: selectionPos.top, left: selectionPos.left }}><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowQuestionInput(true); }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform ring-1 ring-white/10"><AiIcon className="w-4 h-4" /> Ask AI</button><div className="w-3 h-3 bg-slate-900 dark:bg-white transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5 shadow-sm"></div></div>)}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4" ref={menuRef}>
        {aiMenuOpen && (<div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-3 w-64 animate-in slide-in-from-right-5 fade-in duration-200 mb-2 ring-1 ring-black/20 mr-2"><div className="px-3 py-3 text-sm font-medium text-white border-b border-white/10 mb-2">Hello, how can I help you?</div><div className="space-y-1">{['summarize', 'key_points', 'explain'].map(action => (<button key={action} onClick={() => handleAiRequest(action as any)} className="w-full text-left px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-200 hover:text-white transition-all capitalize">{action.replace('_', ' ')}</button>))}<button onClick={() => { setAiMenuOpen(false); setShowQuestionInput(true); }} className="w-full text-left px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-200 hover:text-white transition-all">Ask a question</button></div></div>)}
        <button onClick={() => { setAiMenuOpen(!aiMenuOpen); setShowQuestionInput(false); }} className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${aiMenuOpen ? 'bg-slate-700 text-white' : 'bg-slate-600/80 backdrop-blur-md text-white border border-white/20'}`}>{aiMenuOpen ? <X className="w-6 h-6" /> : <AiIcon className="w-8 h-8" />}</button>
      </div>
      {isLoading && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"><div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center"><div className="relative w-16 h-16"><div className="absolute inset-0 border-4 border-slate-200 dark:border-zinc-800 rounded-full"></div><div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><AiIcon className="w-6 h-6 text-primary animate-pulse" /></div></div><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyzing Content</h3><p className="text-sm text-slate-500">The AI is generating your response...</p></div></div></div>)}
      <Modal isOpen={!!aiResult} onClose={() => setAiResult(null)} title={aiResult?.title || ''}><div className="prose dark:prose-invert prose-sm max-w-none max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"><div className="whitespace-pre-wrap leading-relaxed">{aiResult?.content}</div></div><div className="mt-6 flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800"><Button onClick={() => setAiResult(null)}>Close</Button></div></Modal>
      <Modal isOpen={showQuestionInput} onClose={() => setShowQuestionInput(false)} title={selectedText ? "Ask about selection" : "Ask AI a Question"}><div className="space-y-4">{selectedText && (<div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg"><p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Selected Context</p><p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-3">"{selectedText}"</p></div>)}<textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What does the author mean by..." className="w-full p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 min-h-[120px] focus:ring-2 focus:ring-primary focus:outline-none dark:text-white resize-none" autoFocus /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowQuestionInput(false)}>Cancel</Button><Button onClick={() => handleAiRequest('question', question)} disabled={!question.trim()} className="flex items-center gap-2"><AiIcon className="w-4 h-4" /> Ask AI</Button></div></div></Modal>
    </div>
  );
};