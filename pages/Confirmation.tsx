import React, { useMemo, useState } from 'react'
import { CheckCircle, ArrowRight, ShieldCheck, RefreshCcw } from 'lucide-react'
import { Card, Button } from '../components/UI'

interface ConfirmationProps {
  onContinue: () => void | Promise<void>
  verifiedEmail?: string
  onResendEmail?: () => void | Promise<void>
}

export const Confirmation: React.FC<ConfirmationProps> = ({
  onContinue,
  verifiedEmail,
  onResendEmail,
}) => {
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  const maskedEmail = useMemo(() => {
    if (!verifiedEmail) return null
    const [name, domain] = verifiedEmail.split('@')
    if (!domain) return verifiedEmail

    const safeName =
      name.length <= 2
        ? `${name[0] ?? ''}*`
        : `${name[0]}***${name.slice(-1)}`

    return `${safeName}@${domain}`
  }, [verifiedEmail])

  const handleContinue = async () => {
    try {
      setLoading(true)
      await onContinue()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!onResendEmail) return
    try {
      setResending(true)
      setResendDone(false)
      await onResendEmail()
      setResendDone(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background ambience (static, no motion) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-green-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Grecko</h1>
          <p className="text-slate-400 text-sm mt-2">
            Account verification
          </p>
        </div>

        <Card className="p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-green-500/20 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>

            <div className="flex-1" role="status" aria-live="polite">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Email verified
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Your account is verified. You can now access all Grecko features.
              </p>

              {maskedEmail && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Verified for: <span className="font-medium">{maskedEmail}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <p className="font-semibold mb-1">Account security</p>
              <p>
                Your data is protected. Next step: set up your academic profile and start learning.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleContinue}
              disabled={loading}
              fullWidth
              size="lg"
              className="group shadow-xl shadow-primary/20"
            >
              {loading ? 'Opening dashboard…' : 'Continue to Dashboard'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center justify-between text-xs">
              {onResendEmail ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors disabled:opacity-60"
                >
                  {resending ? 'Resending…' : 'Resend verification email'}
                </button>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Resend not available
                </span>
              )}

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {resendDone && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                Verification email sent.
              </p>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          If you still can’t access your dashboard, log out and log back in.
        </p>
      </div>
    </div>
  )
}
