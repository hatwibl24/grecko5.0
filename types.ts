
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  gpa: number;
  school?: string;
  bio?: string;
  academicLevel?: string;
  grade?: string; 
  role?: 'student' | 'admin';
}

export interface Course {
  id: string;
  title: string;
  price: number;
  image: string; 
  isOwned: boolean;
  author: string;
  description: string;
  content?: string;
  isPublished?: boolean;
}

export interface QuizResult {
  id: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  course: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface AcademicGoals {
  currentGpa: number;
  targetGpa: number;
  coursesTaken: number;
  totalCourses: number;
  coursesRemaining: number;
  requiredGpa: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'course' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export type PageRoute = 'auth' | 'dashboard' | 'courses' | 'reader' | 'study-tools' | 'mentor' | 'profile' | 'visual-learning' | 'notifications' | 'admin';
