import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

/**
 * SplashScreen Component
 * Inspired by high-craft Indian logistics & fintech mobile apps (Parcel, Zepto, PhonePe).
 * Features:
 * - Crisp minimalist canvas with diagonal isometric road tracks
 * - Animated delivery vehicle & parcel box vector with floating speed dashes
 * - Premium SecureKaro typography & shield emblem
 * - Interactive status pill ("Signing you in...", "Connecting to cloud...")
 * - Smooth spring/fade exit animation
 */
export default function SplashScreen({ onComplete, isSlowServer = false, onSkip }) {
  const [stage, setStage] = useState(0); // 0: enter, 1: authenticating, 2: ready, 3: exit
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Stage sequence
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 1200);

    // If server is not stuck/slow, automatically finish after ~2.2s
    let tExit;
    if (!isSlowServer) {
      tExit = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 400); // 400ms CSS transition
      }, 2200);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (tExit) clearTimeout(tExit);
    };
  }, [isSlowServer, onComplete]);

  const handleManualSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onSkip) onSkip();
      else if (onComplete) onComplete();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-slate-900 select-none overflow-hidden transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Background Abstract Isometric Road Grid (Inspired by Parcel Ref Image) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.45]">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Diagonal Road Strip */}
          <path
            d="M-50 250 L350 650 L450 550 L50 150 Z"
            fill="url(#roadGradient)"
            opacity="0.25"
          />
          {/* Road Track Guidelines */}
          <line x1="-30" y1="230" x2="370" y2="630" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />
          <line x1="70" y1="130" x2="470" y2="530" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />
          <line x1="20" y1="180" x2="420" y2="580" stroke="#94A3B8" strokeWidth="2" strokeDasharray="12 12" />

          {/* Abstract Grid Crossings */}
          <rect x="80" y="240" width="180" height="260" rx="16" stroke="#E2E8F0" strokeWidth="1.2" transform="rotate(-30 80 240)" />
          <rect x="140" y="320" width="100" height="140" rx="12" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" transform="rotate(-30 140 320)" />

          <defs>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── Top Header / Status Bar Filler ── */}
      <div className="w-full pt-8 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Secure Network</span>
        </div>
        {isSlowServer && (
          <button
            onClick={handleManualSkip}
            className="text-xs font-bold text-[#1E56E3] hover:underline flex items-center gap-1"
          >
            Skip to App <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Center Hero: Animated Logistics Vehicle & Brand Wordmark ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-sm w-full text-center my-auto">
        {/* Animated Delivery Bike / Courier Vector Illustration */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl animate-pulse"></div>

          {/* Delivery Vehicle SVG */}
          <svg
            className="w-36 h-36 relative z-10 transition-transform duration-700 ease-out transform"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Speed Dash Lines behind vehicle */}
            <g className="opacity-60">
              <path d="M22 65 H38" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="x1" values="10;24;10" dur="1s" repeatCount="indefinite" />
                <animate attributeName="x2" values="28;42;28" dur="1s" repeatCount="indefinite" />
              </path>
              <path d="M12 85 H32" stroke="#1E56E3" strokeWidth="3.5" strokeLinecap="round">
                <animate attributeName="x1" values="5;18;5" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="x2" values="25;38;25" dur="0.8s" repeatCount="indefinite" />
              </path>
              <path d="M26 102 H42" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="x1" values="14;28;14" dur="1.1s" repeatCount="indefinite" />
                <animate attributeName="x2" values="32;46;32" dur="1.1s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Courier Delivery Van / Bike Body */}
            <g>
              {/* Main Vehicle Chassis / Van Body */}
              <rect x="42" y="48" width="68" height="48" rx="10" fill="#1E56E3" />
              {/* Cab / Windshield */}
              <path d="M110 60 L126 72 V96 H110 V60 Z" fill="#0D38A8" />
              <path d="M112 64 L123 73 H112 V64 Z" fill="#E0F2FE" />
              
              {/* Parcel Storage Box Highlight with Checkmark */}
              <rect x="48" y="54" width="34" height="36" rx="6" fill="#FFFFFF" fillOpacity="0.95" />
              <path d="M56 72 L63 79 L74 65" stroke="#1E56E3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Express Speed Stripe */}
              <path d="M86 58 H104 V64 H86 Z" fill="#FBBF24" />

              {/* Headlight beam */}
              <polygon points="126,80 155,70 155,95 126,86" fill="#FEF08A" fillOpacity="0.35" />

              {/* Wheels */}
              <g className="animate-spin" style={{ transformOrigin: '58px 96px', animationDuration: '0.8s' }}>
                <circle cx="58" cy="96" r="14" fill="#0F172A" />
                <circle cx="58" cy="96" r="6" fill="#F8FAFC" />
                <circle cx="58" cy="96" r="2" fill="#0F172A" />
              </g>
              <g className="animate-spin" style={{ transformOrigin: '116px 96px', animationDuration: '0.8s' }}>
                <circle cx="116" cy="96" r="14" fill="#0F172A" />
                <circle cx="116" cy="96" r="6" fill="#F8FAFC" />
                <circle cx="116" cy="96" r="2" fill="#0F172A" />
              </g>
            </g>

            {/* Floating Shield Badge Top-Right */}
            <g transform="translate(108, 22)">
              <circle cx="16" cy="16" r="16" fill="#10B981" />
              <path d="M11 16 L15 20 L22 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>

        {/* Wordmark (Inspired by "Parcel" Bold Aesthetic) */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-sans">
              Secure<span className="text-[#1E56E3]">Karo</span>
            </h1>
          </div>

          <p className="text-xs font-semibold text-slate-500 tracking-wide max-w-[260px] mx-auto leading-relaxed">
            Send, track and protect every parcel across India — in a few taps.
          </p>
        </div>
      </div>

      {/* ── Bottom Section: Native Status Pill & Progress ── */}
      <div className="w-full pb-10 px-6 flex flex-col items-center relative z-10">
        {!isSlowServer ? (
          <div className="w-full max-w-xs flex flex-col items-center gap-3">
            {/* Native App Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100/80 border border-slate-200/80 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E56E3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E56E3]"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {stage === 0 ? 'Starting SecureKaro...' : stage === 1 ? 'Signing you in...' : 'Ready'}
              </span>
            </div>

            {/* Smooth Loading Progress Bar */}
            <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E56E3] rounded-full transition-all duration-700 ease-out"
                style={{ width: stage === 0 ? '25%' : stage === 1 ? '70%' : '100%' }}
              ></div>
            </div>
          </div>
        ) : (
          /* Slow Server Alert Card (Graceful Free-Tier Wakeup) */
          <div className="w-full max-w-sm p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-sm text-left space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Connecting to Cloud Backend...</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Cold Boot
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 leading-relaxed">
              Our cloud instance is spinning up from idle mode (takes ~15–25s). Your session and orders are safe.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-amber-200/70">
              <button
                onClick={handleManualSkip}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Continue Anyway
              </button>
              <span className="text-[10px] text-amber-600 font-medium">Auto-retrying in background</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
          SafeCart Escrow & Logistics Protocol
        </div>
      </div>
    </div>
  );
}
