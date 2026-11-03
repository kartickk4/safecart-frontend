import React, { useState, useEffect } from 'react';
import { ChevronUp, Sparkles, X, ArrowUp } from 'lucide-react';

export default function BottomNavGuide({
  isOpen,
  onOpenEdit,
  onDismiss
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for natural entrance after page loads
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !visible) return null;

  return (
    <div className="md:hidden fixed bottom-[72px] left-3 right-3 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-3.5 shadow-2xl border border-blue-500/30 relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Animated Swipe Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex flex-col items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5 text-blue-400 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Tip
              </span>
            </div>
            <h4 className="text-xs font-black text-white">
              Long press any tab to customize or swap
            </h4>
            <p className="text-[10.5px] text-slate-300 mt-0.5 leading-snug">
              Hold any button to rearrange, or swap with <span className="text-white font-bold">Tracking, Return, Notifications</span> or <span className="text-white font-bold">Refer & Earn</span> anytime!
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => {
                  onDismiss();
                  onOpenEdit();
                }}
                className="px-3 py-1 bg-[#1E56E3] hover:bg-[#1649CC] active:scale-95 text-white rounded-lg text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Customize Now</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onDismiss}
                className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>

          {/* Dismiss 'x' button */}
          <button
            onClick={onDismiss}
            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white transition-colors"
            title="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Downward indicator triangle pointing at the bottom bar handle */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-950 rotate-45 border-r border-b border-blue-500/30" />
      </div>
    </div>
  );
}

