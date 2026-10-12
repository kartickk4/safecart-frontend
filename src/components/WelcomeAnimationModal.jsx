import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ShoppingBag, ArrowRight, PartyPopper, Lock, Zap } from 'lucide-react';

export default function WelcomeAnimationModal({ isOpen, user, isNewUser, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1); // 1: preparing, 2: customizing, 3: welcome

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStep(1);
      return;
    }

    // Stage 1: Security & Session Check
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStep(1);
    }, 200);

    // Stage 2: Customizing Workspace
    const timer2 = setTimeout(() => {
      setProgress(80);
      setStep(2);
    }, 900);

    // Stage 3: Welcome Celebration
    const timer3 = setTimeout(() => {
      setProgress(100);
      setStep(3);
    }, 1800);

    // Auto navigate after 3.2s
    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const userName = user?.name || user?.fullName || 'Friend';
  const roleName = user?.role || user?.activeRole || 'Member';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/20 backdrop-blur-md animate-in fade-in duration-300 select-none">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-sky-200/40 rounded-full blur-[90px] pointer-events-none animate-pulse"></div>

      {/* Main Compact Friendly White Card */}
      <div className="relative w-full max-w-[360px] bg-white/95 backdrop-blur-2xl border border-slate-100/90 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(30,86,227,0.15)] text-center overflow-hidden transition-all duration-300 animate-in zoom-in-95">
        
        {/* Soft Colorful Accent Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 rounded-t-full"></div>

        {/* Decorative Floating Dots / Sparkles */}
        <div className="absolute top-4 right-4 text-amber-400 animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute bottom-4 left-4 text-sky-400 animate-pulse">
          <Zap className="w-4 h-4" />
        </div>

        {/* Compact Icon Badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {/* Animated Background Ring */}
          <div className="absolute inset-0 rounded-2xl bg-blue-100/80 animate-ping opacity-60"></div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-sky-400 to-emerald-400 opacity-20 blur-sm"></div>

          {/* Central Friendly Badge */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E56E3] via-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 border border-white/50 transform transition-transform duration-500 hover:scale-105">
            {step < 3 ? (
              <div className="relative">
                <ShoppingBag className="w-8 h-8 text-white animate-pulse" />
                <ShieldCheck className="w-4 h-4 text-emerald-300 absolute -bottom-0.5 -right-0.5 bg-[#1E56E3] rounded-full" />
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-amber-300 animate-bounce" />
                <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Stage Content */}
        <div className="space-y-2 mb-4">
          {step === 1 && (
            <>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold">
                <Lock className="w-3 h-3 text-blue-500 animate-spin" />
                <span>Securing Session</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Setting up your safe space...
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-[260px] mx-auto">
                Verifying bank-grade escrow encryption & payment protection.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Customizing Portal</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Preparing your dashboard...
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-[260px] mx-auto">
                Loading shipments, tracking services & wallet integrations.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-extrabold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isNewUser ? 'Account Ready 🎉' : 'Welcome Back!'}</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E56E3] via-blue-600 to-sky-500">SecureKaro!</span>
              </h2>

              <p className="text-sm text-slate-700 font-bold">
                Hello, <span className="text-[#1E56E3] font-extrabold">{userName}</span> 👋
              </p>
              <p className="text-[11px] text-slate-500 font-medium max-w-[260px] mx-auto">
                Your <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{roleName}</span> portal is ready.
              </p>
            </>
          )}
        </div>

        {/* Compact Progress Bar */}
        <div className="space-y-1 mb-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
            <div
              className="bg-gradient-to-r from-sky-400 via-[#1E56E3] to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
            <span>{step === 3 ? 'Ready!' : 'Initializing...'}</span>
            <span className="text-slate-600 font-extrabold">{progress}%</span>
          </div>
        </div>

        {/* Compact CTA Button */}
        {step === 3 && (
          <button
            onClick={onComplete}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1E56E3] via-blue-600 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 border border-white/20 transition-all duration-200 flex items-center justify-center gap-1.5 group active:scale-[0.98]"
          >
            <span>Jump into Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
}
