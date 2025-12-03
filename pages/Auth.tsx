
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface AuthProps {
  onLogin: (user: User) => void; 
  onBack: () => void;
  initialView?: 'login' | 'signup';
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack, initialView = 'login' }) => {
  const { signInWithGoogle, resetPassword } = useAuth();
  const { addToast } = useToast();
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sync view if prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await (supabase.auth as any).signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;
      
    } catch (error: any) {
      // Specific Error Handling as requested
      if (error.message.includes('Invalid login credentials')) {
        addToast("Invalid email or password. Please try again.", 'error');
      } else if (error.message.includes('Email not confirmed')) {
        addToast("Email not confirmed. Check your inbox or resend confirmation.", 'info');
      } else {
        addToast(error.message || "Something went wrong. Please try later.", 'error');
      }
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match!", 'warning');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data, error } = await (supabase.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            grade: formData.grade
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        addToast("Account created! Please check your email to confirm your account.", 'success');
        setView('login');
      } else {
        // Logged in automatically
      }

    } catch (error: any) {
      addToast(error.message || "Error signing up", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(formData.email);
      addToast("Password reset link sent! Check your email.", 'success');
      setView('login');
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#1e3a8a] p-6 relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center gap-2 z-20"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      {/* Decorative ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Grecko</h1>
          <p className="text-blue-200/80">Your smart student companion</p>
        </div>

        <Card className="backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 shadow-xl border-white/10">
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1 text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
                <p className="text-sm text-slate-500">Sign in to continue</p>
              </div>
              
              <Input 
                name="email"
                type="email" 
                label="Email Address" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />}
                required 
              />
              <Input 
                name="password"
                type={showPassword ? "text" : "password"} 
                label="Password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                icon={<Lock className="w-5 h-5" />}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required 
              />
              
              <div className="flex justify-end">
                <button type="button" onClick={() => setView('forgot')} className="text-sm font-medium text-primary hover:text-primary-dark">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading}>Sign In with Email</Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <Button type="button" variant="secondary" fullWidth onClick={signInWithGoogle} className="flex gap-2 justify-center">
                 <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                 Google
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-500">Don't have an account? </span>
                <button type="button" onClick={() => setView('signup')} className="font-medium text-primary hover:text-primary-dark">Sign Up</button>
              </div>
            </form>
          )}

          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
               <div className="space-y-1 text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create Account</h2>
                <p className="text-sm text-slate-500">Join Grecko to boost your grades</p>
              </div>

              <Input 
                name="name"
                label="Full Name" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleChange}
                icon={<UserIcon className="w-5 h-5" />} 
                required 
              />
              <Input 
                name="email"
                type="email" 
                label="Email" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />} 
                required 
              />
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Grade Level</label>
                 <select 
                    name="grade" 
                    value={formData.grade} 
                    onChange={handleChange} 
                    className="w-full rounded-xl border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 px-4 border"
                    required
                 >
                    <option value="">Select Grade</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                 </select>
              </div>

              <Input 
                name="password"
                type="password" 
                label="Password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                icon={<Lock className="w-5 h-5" />} 
                required 
              />
              <Input 
                name="confirmPassword"
                type="password" 
                label="Confirm Password" 
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<Lock className="w-5 h-5" />} 
                required 
              />

              <Button type="submit" fullWidth isLoading={isLoading}>Create Account</Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <Button type="button" variant="secondary" fullWidth onClick={signInWithGoogle} className="flex gap-2 justify-center">
                 <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                 Google
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <button type="button" onClick={() => setView('login')} className="font-medium text-primary hover:text-primary-dark">Sign In</button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
               <div className="space-y-1 text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reset Password</h2>
                <p className="text-sm text-slate-500">Enter your email to receive instructions</p>
              </div>
              <Input 
                name="email"
                type="email" 
                label="Email Address" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />} 
                required 
              />
              <Button fullWidth variant="primary" onClick={handleForgot} isLoading={isLoading}>Send Reset Link</Button>
              <Button fullWidth variant="ghost" onClick={() => setView('login')}>Back to Sign In</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
