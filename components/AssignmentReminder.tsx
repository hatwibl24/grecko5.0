import React from 'react';
import { Clock, CheckCircle, X, Calendar, AlertTriangle } from 'lucide-react';
import { Assignment } from '../types';
import { Button } from './UI';

interface AssignmentReminderProps {
  assignment: Assignment;
  isOpen: boolean;
  onComplete: (id: string) => void;
  onSnooze: () => void;
}

export const AssignmentReminder: React.FC<AssignmentReminderProps> = ({ assignment, isOpen, onComplete, onSnooze }) => {
  if (!isOpen) return null;

  const dueDate = new Date(assignment.dueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
        <div className="bg-amber-500 p-4 flex items-center gap-3 text-white">
          <div className="p-2 bg-white/20 rounded-full animate-pulse"><AlertTriangle className="w-6 h-6" /></div>
          <div><h3 className="font-bold text-lg leading-tight">Assignment Due Soon!</h3><p className="text-amber-100 text-xs font-medium">Don't lose your streak.</p></div>
          <button onClick={onSnooze} className="ml-auto text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{assignment.title}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Calendar className="w-4 h-4" /><span>{assignment.course}</span></div>
            </div>
            <div className="text-right">
                <span className="block text-2xl font-bold text-amber-500">{diffDays <= 0 ? 'Today' : `${diffDays} Day${diffDays > 1 ? 's' : ''}`}</span>
                <span className="text-xs text-slate-400 uppercase font-bold">Remaining</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 text-sm text-slate-600 dark:text-slate-300">Have you finished this task? Mark it as done to clear it from your active list.</div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="ghost" onClick={onSnooze} className="h-12 border-2 border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"><Clock className="w-4 h-4 mr-2" /> Remind Later</Button>
            <Button onClick={() => onComplete(assignment.id)} className="h-12 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20"><CheckCircle className="w-4 h-4 mr-2" /> Yes, It's Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
};