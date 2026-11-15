import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, Lock, Boxes, Sparkles } from 'lucide-react';

export default function WelcomeAnimationModal({ isOpen, user, isNewUser, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1); // 1: authenticating, 2: synchronizing, 3: ready

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStep(1);
      return;
    }

    // Stage 1: Security & Session Check
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStep(1);
    }, 150);

    // Stage 2: Synchronizing Services & Workspaces
    const timer2 = setTimeout(() => {
      setProgress(85);
      setStep(2);
    }, 750);

    // Stage 3: Ready & Initialized
    const timer3 = setTimeout(() => {
      setProgress(100);
      setStep(3);
    }, 1450);

    // Auto-advance into dashboard after 2.6s
    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const rawName = user?.fullName || user?.name || '';
  const userName = rawName ? rawName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Merchant');
  const roleName = user?.role || user?.activeRole || 'Supplier';
  const isSupplier = roleName === 'Supplier';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Professional Glassmorphic Modal */}
      <div className="relative w-full max-w-[380px] bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] text-center overflow-hidden transition-all duration-300 animate-in zoom-in-95">
        
        {/* Top Crisp Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#1E56E3] to-sky-500"></div>

        {/* Central Brand Logo Badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/10 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-blue-500/10 p-2 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="SecureKaro"
              className="w-10 h-10 rounded-xl object-cover"
            />
            {step === 3 ? (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            ) : (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1E56E3] text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Status Pill */}
        <div className="mb-3">
          {step < 3 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200/70">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>{step === 1 ? 'Securing Session...' : 'Loading Services...'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/70 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isNewUser ? 'Account Initialized' : 'Session Authenticated'}</span>
            </div>
          )}
        </div>

        {/* Dynamic Titles */}
        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {step === 3 
              ? `Welcome back, ${userName}` 
              : 'Initializing SecureKaro'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {step === 3
              ? `Your ${isSupplier ? 'Supplier' : 'Receiver'} portal is ready to use.`
              : 'Verifying end-to-end delivery protection & credentials.'}
          </p>
        </div>

        {/* High-Precision Progress Track */}
        <div className="space-y-1.5 mb-5">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className="bg-gradient-to-r from-[#1E56E3] to-sky-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5">
            <span>
              {step === 1 && 'Authenticating tokens...'}
              {step === 2 && 'Syncing courier services...'}
              {step === 3 && 'Workspace ready'}
            </span>
            <span className="text-slate-700 font-mono font-bold">{progress}%</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={onComplete}
            disabled={step < 3}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              step === 3
                ? 'bg-[#1E56E3] hover:bg-[#1649CC] text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>
              {step === 3 
                ? (isSupplier ? 'Launch Shipping Dashboard' : 'Open Orders & Deliveries') 
                : 'Preparing Workspace...'}
            </span>
            <ArrowRight className={`w-3.5 h-3.5 ${step === 3 ? 'transition-transform group-hover:translate-x-0.5' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
