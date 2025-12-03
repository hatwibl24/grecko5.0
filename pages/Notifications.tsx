
import React from 'react';
import { Bell, BookOpen, Calendar, Info, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Notification, PageRoute } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onNavigate: (route: PageRoute) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAllRead, onDelete, onNavigate }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'course': return <BookOpen className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'assignment':
        onNavigate('study-tools');
        break;
      case 'course':
        onNavigate('courses');
        break;
      case 'system':
         // If it's about profile, go there, otherwise dashboard
         if (notification.title.toLowerCase().includes('profile') || notification.message.toLowerCase().includes('profile')) {
             onNavigate('profile');
         } else {
             onNavigate('dashboard');
         }
        break;
      default:
        onNavigate('dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500">Stay updated with your academic progress</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onMarkAllRead} className="text-xs">
              <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell className="w-8 h-8 text-slate-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 text-sm mt-1">No new notifications at the moment.</p>
          </div>
        )}
        
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 flex gap-4 transition-all hover:shadow-md cursor-pointer group relative hover:border-blue-200 dark:hover:border-blue-900 ${notification.read ? 'opacity-70 bg-slate-50 dark:bg-zinc-900/50 hover:opacity-100' : 'border-l-4 border-l-primary bg-white dark:bg-zinc-900'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.read ? 'bg-slate-100 dark:bg-zinc-800' : 'bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700'}`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={`text-sm font-semibold ${notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                  {notification.title}
                </h3>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{notification.time}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                {notification.message}
              </p>
            </div>
            
             {/* Hover indicator arrow */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
              }}
              className="self-start p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all z-10"
              title="Dismiss"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};
