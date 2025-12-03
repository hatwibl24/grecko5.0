
import React, { useState } from 'react';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '../components/UI';
import { supabase } from '../lib/supabase';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await (supabase.auth as any).updateUser({ password: password });
      if (error) throw error;
      setSuccess(true);
      
      // Clear URL hash to remove recovery token traces
      window.history.replaceState({}, document.title, "/");
      
      // Redirect after short delay
      setTimeout(() => {
          window.location.reload(); // Reloads to clear recovery state and enter app as logged in user
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
              <Card className="w-full max-w-md p-8 text-center space-y-4 animate-in zoom-in-95 border-green-500/20 bg-zinc-900/50 backdrop-blur-xl">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Password Updated</h2>
                  <p className="text-slate-500">Your password has been changed successfully. Logging you in...</p>
              </Card>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
       {/* Background elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Grecko</h1>
            <p className="text-blue-200/80">Secure Account Recovery</p>
        </div>

        <Card className="p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Set New Password</h2>
                <p className="text-slate-500 text-sm">Please create a new secure password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input 
                    type="password"
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4"/>}
                    placeholder="••••••••"
                    required
                />
                <Input 
                    type="password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4"/>}
                    placeholder="••••••••"
                    required
                />
                
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                    Update Password <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </form>
        </Card>
      </div>
    </div>
  );
};
