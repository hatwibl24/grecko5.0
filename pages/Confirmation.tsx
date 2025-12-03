
import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, Button } from '../components/UI';
import confetti from 'canvas-confetti';

interface ConfirmationProps {
  onContinue: () => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({ onContinue }) => {
  
  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
           <h1 className="text-4xl font-bold text-white tracking-tight">Grecko</h1>
        </div>

        <Card className="p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-green-500/20 shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 animate-in bounce-in duration-700">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Email Verified!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
                Your account has been successfully verified. You now have full access to all Grecko features.
            </p>

            <div className="w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-8 border border-slate-100 dark:border-zinc-800 flex items-start gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-bold mb-1">Account Secure</p>
                    <p>Your data is protected. You can now set up your academic profile and start learning.</p>
                </div>
            </div>

            <Button onClick={onContinue} fullWidth size="lg" className="group shadow-xl shadow-primary/20">
                Continue to Dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
        </Card>
      </div>
    </div>
  );
};
