import React, { useState, useEffect } from 'react';
import { Book, Calculator, Sparkles, TrendingUp, Trophy, Plus, Trash2, RotateCcw, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, CartesianGrid } from 'recharts';
import { Card, Button, Modal } from '../components/UI';
import { User, PageRoute, AcademicGoals, Assignment, QuizResult, Course } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: User;
  onNavigate: (route: PageRoute) => void;
  academicGoals: AcademicGoals;
  updateGoals: (goals: AcademicGoals) => void;
  assignments: Assignment[];
  quizResults: QuizResult[];
}

// Custom Icon for AI Advisor
const AiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 18L6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

interface CourseInput {
  id: string;
  name: string;
  grade: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, academicGoals, updateGoals, assignments, quizResults }) => {
  // Calculator State
  const { currentGpa, targetGpa, coursesTaken, totalCourses, requiredGpa } = academicGoals;
  
  // Real Data State
  const [gpaHistory, setGpaHistory] = useState<{label: string, value: number}[]>([]);
  const [suggestions, setSuggestions] = useState<Course[]>([]);

  // Modal State
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [modalCourses, setModalCourses] = useState<CourseInput[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        // 1. Fetch GPA History
        const { data: history } = await supabase.from('gpa_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        
        if (history && history.length > 0) {
            setGpaHistory(history.map(h => ({ 
                // Format Date nicely (e.g., "Nov 12") or use semester name if available
                label: h.semester || new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
                value: h.gpa 
            })));
        } else {
             // Fallback: Use current GPA as a single point if no history
             setGpaHistory([{ label: 'Start', value: currentGpa || 0 }]);
        }

        // 2. Fetch Suggestions (Random courses not owned)
        const { data: owned } = await supabase.from('user_courses').select('course_id').eq('user_id', user.id);
        const ownedIds = owned?.map(o => o.course_id) || [];
        
        let query = supabase.from('courses').select('*').eq('is_published', true).limit(3);
        if (ownedIds.length > 0) {
            query = query.not('id', 'in', `(${ownedIds.join(',')})`);
        }
        
        const { data: suggestedCourses } = await query;
        if (suggestedCourses) {
            setSuggestions(suggestedCourses.map(c => ({
                id: c.id,
                title: c.title,
                price: c.price,
                image: c.image,
                isOwned: false,
                author: c.author,
                description: c.description
            })));
        }
    };
    fetchData();
  }, [user.id]); // Removed currentGpa dependency to avoid infinite loops with graph updates

  // Calculate required GPA based on inputs
  const calculateRequired = (current: number, target: number, taken: number, remaining: number): string => {
      if (remaining <= 0) return '---';
      const currentPoints = current * taken;
      const totalTargetPoints = target * (taken + remaining);
      const neededPoints = totalTargetPoints - currentPoints;
      const req = neededPoints / remaining;
      return req.toFixed(2);
  };

  const handleGoalChange = (field: keyof AcademicGoals, value: number) => {
      let newGoals = { ...academicGoals, [field]: value };
      
      const taken = field === 'coursesTaken' ? value : newGoals.coursesTaken;
      const total = field === 'totalCourses' ? value : newGoals.totalCourses;
      const remaining = Math.max(0, total - taken);
      newGoals.coursesRemaining = remaining;

      const newRequired = calculateRequired(newGoals.currentGpa, newGoals.targetGpa, taken, remaining);
      updateGoals({ ...newGoals, requiredGpa: newRequired });
  };

  // Ensure initial calculation on mount
  useEffect(() => {
     const remaining = Math.max(0, totalCourses - coursesTaken);
     if (requiredGpa === '0.00' && coursesTaken > 0) {
         const newRequired = calculateRequired(currentGpa, targetGpa, coursesTaken, remaining);
         updateGoals({ ...academicGoals, coursesRemaining: remaining, requiredGpa: newRequired });
     }
  }, []);

  // Modal Logic
  const addCourse = () => setModalCourses([...modalCourses, { id: Date.now().toString(), name: '', grade: 4.0 }]);
  const removeCourse = (id: string) => setModalCourses(modalCourses.filter(c => c.id !== id));
  const updateCourse = (id: string, field: keyof CourseInput, value: any) => setModalCourses(modalCourses.map(c => c.id === id ? { ...c, [field]: value } : c));
  
  const calculateModalGpa = () => {
    const totalPts = modalCourses.reduce((acc, c) => acc + c.grade, 0);
    return modalCourses.length > 0 ? (totalPts / modalCourses.length).toFixed(2) : '0.00';
  };

  // --- UPDATED: SAVE LOGIC ---
  const applyCalculatedGpa = async () => {
    const gpa = parseFloat(calculateModalGpa());
    const count = modalCourses.length;
    const remaining = Math.max(0, totalCourses - count);
    const newRequired = calculateRequired(gpa, targetGpa, count, remaining);
    
    const label = `Calc ${new Date().toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;

    // 1. Update UI Immediately (Optimistic)
    setGpaHistory(prev => [...prev, { label, value: gpa }]);
    updateGoals({
        ...academicGoals,
        currentGpa: gpa,
        coursesTaken: count,
        coursesRemaining: remaining,
        requiredGpa: newRequired
    });
    setIsCalcModalOpen(false);

    // 2. Save to Database (Persistent History)
    if (user) {
        const { error } = await supabase.from('gpa_history').insert({ 
            user_id: user.id, 
            gpa: gpa, 
            semester: label 
        });

        if (error) {
            console.error("Failed to save GPA History:", error.message);
            alert("Could not save history to database. Please check console.");
        }
    }
  };

  const isImpossible = parseFloat(requiredGpa) > 4.0;
  const isEasy = parseFloat(requiredGpa) < currentGpa;
  const coursesRemaining = Math.max(0, totalCourses - coursesTaken);

  const priorityAssignment = assignments
    .filter(a => !a.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const recentQuiz = quizResults[0];

  const quizChartData = quizResults.slice(0, 7).reverse().map((r, idx) => ({
    label: `Q${idx + 1}`,
    score: r.score
  }));

  return (
    <div className="space-y-6 pb-8">
      <div className="text-center md:text-left space-y-0.5">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GPA Hub</h1>
         <p className="text-sm text-slate-500 dark:text-slate-400">Your Academic Performance Dashboard</p>
      </div>

      <Card className="bg-slate-100/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 p-5">
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-3 mr-auto">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Calculator</h3>
                        <p className="text-[10px] text-slate-500">Set your academic goals</p>
                    </div>
                </div>

                <div className="flex gap-4">
                     <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Subjects Offered</label>
                         <input type="number" value={totalCourses} onChange={e => handleGoalChange('totalCourses', parseInt(e.target.value) || 0)} className="w-full md:w-32 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Subjects Completed</label>
                         <input type="number" value={coursesTaken} onChange={e => handleGoalChange('coursesTaken', parseInt(e.target.value) || 0)} className="w-full md:w-32 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                     </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Current GPA</label>
                    <div className="relative">
                      <input type="number" step="0.01" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg pl-3 pr-9 py-2.5 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={currentGpa} onChange={e => handleGoalChange('currentGpa', parseFloat(e.target.value))} />
                      <button onClick={() => setIsCalcModalOpen(true)} className="absolute right-1.5 top-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Calculate exact GPA from course list">
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                </div>

                <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Target GPA</label>
                    <input type="number" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={targetGpa} onChange={e => handleGoalChange('targetGpa', parseFloat(e.target.value))} step="0.1" />
                </div>

                <div className="flex-[1.2] space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Avg. GPA Needed (Remaining)</label>
                    <div className={`w-full px-4 py-2.5 rounded-lg font-bold text-sm border flex items-center justify-between transition-colors ${isImpossible ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                        <span>{requiredGpa}</span>
                        {isImpossible && <span className="text-[10px] opacity-75 uppercase font-bold">Unreachable</span>}
                        {(!isImpossible && isEasy) && <Sparkles className="w-4 h-4 text-yellow-300" />}
                        {(!isImpossible && !isEasy) && <span className="text-[10px] opacity-75 font-medium">Goal</span>}
                    </div>
                </div>
            </div>

             <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                {isImpossible 
                  ? "The target GPA is unreachable with the number of remaining subjects. Try increasing your Subjects Offered or adjusting the Target."
                  : `To reach a GPA of ${targetGpa}, you need to average a ${requiredGpa} in your remaining ${coursesRemaining} subjects.`}
             </div>
        </div>
      </Card>

      <Modal isOpen={isCalcModalOpen} onClose={() => setIsCalcModalOpen(false)} title="Calculate Current GPA">
        <div className="space-y-4">
           <div className="flex justify-between items-end mb-2">
              <p className="text-sm text-slate-500">Add your completed courses to calculate unweighted GPA.</p>
              <Button size="sm" onClick={addCourse} variant="secondary" className="py-1 px-3 h-8 text-xs"><Plus className="w-3 h-3 mr-1" /> Add Course</Button>
           </div>
           <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {modalCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-2">
                   <input placeholder="Course Name" className="flex-1 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-blue-500 transition-all" value={course.name} onChange={(e) => updateCourse(course.id, 'name', e.target.value)} />
                   <div className="w-20 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">GPA</span>
                      <input type="number" step="0.1" max="4.0" className="w-full bg-slate-50 dark:bg-zinc-800 border-transparent rounded-lg pl-8 pr-2 py-2 text-sm font-medium text-center focus:ring-2 focus:ring-blue-500 transition-all" value={course.grade} onChange={(e) => updateCourse(course.id, 'grade', parseFloat(e.target.value))} />
                   </div>
                   <button onClick={() => removeCourse(course.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
           </div>
           <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                 <div className="text-xs text-slate-500 uppercase font-bold">Calculated GPA</div>
                 <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateModalGpa()}</div>
              </div>
              <div className="flex gap-2">
                 <Button variant="ghost" onClick={() => setModalCourses([])} title="Clear All"><RotateCcw className="w-4 h-4" /></Button>
                 <Button onClick={applyCalculatedGpa}>Use this GPA</Button>
              </div>
           </div>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GPA Trend Chart */}
        <Card className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> GPA Trend</h3>
          </div>
          {/* Explicit height wrapper to fix Recharts width warning */}
          <div className="w-full h-[250px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaHistory.length > 0 ? gpaHistory : [{label: 'Start', value: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 4.0]} tickCount={5} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', padding: '8px' }} />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quiz Scores Chart */}
        <Card className="flex flex-col p-5">
           <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Quiz Scores</h3>
          </div>
          {/* Explicit height wrapper to fix Recharts width warning */}
          <div className="w-full h-[250px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizChartData.length > 0 ? quizChartData : [{label: 'No Data', score: 0}]} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                 <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', padding: '8px' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {quizChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.score >= 90 ? '#2563EB' : '#60A5FA'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Quiz Results */}
      <Card className="overflow-hidden p-0">
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
           <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Quiz Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course</th>
                <th className="px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-zinc-800">
              {quizResults.length === 0 ? (
                 <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-500 text-sm">No quiz attempts yet. Go to Study Tools to start one!</td></tr>
              ) : (
                quizResults.map((result) => (
                  <tr key={result.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{result.date}</td>
                    <td className="px-5 py-3"><div className="font-medium text-slate-900 dark:text-white">{result.courseName}</div></td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${result.score >= 90 ? 'text-green-600 dark:text-green-400' : result.score >= 70 ? 'text-slate-700 dark:text-slate-200' : 'text-red-500'}`}>{result.score}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Grid: AI Advisor & Course Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Advisor */}
        <Card className="bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 p-5 relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
            <div className="shrink-0">
               <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-800 shadow-sm flex items-center justify-center">
                  <AiIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
               </div>
            </div>
            <div className="space-y-1 flex-1">
               <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">AI Advisor</h3>
               <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                 Based on your plan, you need an average grade of <span className="font-bold text-blue-600 dark:text-blue-400">{requiredGpa}</span> in your remaining {coursesRemaining} subjects to reach {targetGpa}.
                 {recentQuiz && <div className="mt-2">I noticed you recently scored <span className={`font-bold ${recentQuiz.score < 75 ? 'text-amber-500' : 'text-green-500'}`}>{recentQuiz.score}%</span> in {recentQuiz.courseName}.</div>}
                 {priorityAssignment && !recentQuiz && <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800/30 flex items-start gap-2 animate-in fade-in"><Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold">Study Focus:</span> You have <span className="font-medium">{priorityAssignment.title}</span> due soon.</p></div></div>}
               </div>
               <div className="pt-2">
                 <Button variant="ghost" className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs font-medium hover:bg-transparent" onClick={() => onNavigate('mentor')}>Chat with Advisor &rarr;</Button>
               </div>
            </div>
          </div>
        </Card>

        {/* Course Suggestions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Recommended Courses</h3>
            <Book className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {suggestions.length === 0 ? (
                <div className="text-xs text-slate-500 italic">Explore the marketplace to find new courses.</div>
            ) : (
                suggestions.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-pointer" onClick={() => onNavigate('courses')}>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};