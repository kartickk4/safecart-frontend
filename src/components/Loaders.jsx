import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown, Shield, RefreshCw } from 'lucide-react';

/* ==========================================================================
   1. SPINNER LOADER (Inline & Modular)
   ========================================================================== */
export function SpinnerLoader({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  label = null 
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };

  const colorMap = {
    primary: 'border-blue-100 border-t-[#1E56E3] text-[#1E56E3]',
    white: 'border-white/30 border-t-white text-white',
    slate: 'border-slate-200 border-t-slate-700 text-slate-700',
    emerald: 'border-emerald-100 border-t-emerald-600 text-emerald-600',
    amber: 'border-amber-100 border-t-amber-600 text-amber-600'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status">
      <div 
        className={`${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.primary} rounded-full animate-spin shrink-0`} 
      />
      {label && <span className="text-xs font-semibold text-slate-600 select-none">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/* ==========================================================================
   2. SKELETON LOADERS (Content Shimmer Placeholders)
   ========================================================================== */
export function CarrierCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 animate-pulse select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="w-28 h-4 rounded-md bg-slate-100 skeleton-shimmer" />
            <div className="w-20 h-3 rounded-md bg-slate-100 skeleton-shimmer" />
          </div>
        </div>
        <div className="space-y-1 text-right flex flex-col items-end">
          <div className="w-16 h-5 rounded-md bg-slate-100 skeleton-shimmer" />
          <div className="w-12 h-3 rounded-md bg-slate-100 skeleton-shimmer" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <div className="w-24 h-3.5 rounded-md bg-slate-100 skeleton-shimmer" />
        <div className="w-20 h-3.5 rounded-md bg-slate-100 skeleton-shimmer" />
      </div>
    </div>
  );
}

export function ShipmentRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3 animate-pulse select-none">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 skeleton-shimmer shrink-0" />
        <div className="space-y-2">
          <div className="w-32 h-4 rounded-md bg-slate-100 skeleton-shimmer" />
          <div className="w-44 h-3 rounded-md bg-slate-100 skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-1.5 text-right flex flex-col items-end">
        <div className="w-16 h-4 rounded-md bg-slate-100 skeleton-shimmer" />
        <div className="w-14 h-3 rounded-md bg-slate-100 skeleton-shimmer" />
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 animate-pulse select-none">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-slate-100 skeleton-shimmer" />
        <div className="w-14 h-4 rounded-full bg-slate-100 skeleton-shimmer" />
      </div>
      <div className="space-y-1.5">
        <div className="w-24 h-6 rounded-md bg-slate-100 skeleton-shimmer" />
        <div className="w-32 h-3 rounded-md bg-slate-100 skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonLoader({ type = 'carrier', count = 3 }) {
  const items = Array.from({ length: count });

  if (type === 'carrier') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <CarrierCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'shipment') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <ShipmentRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'metric') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((_, i) => (
        <div key={i} className="w-full h-12 rounded-xl bg-slate-100 skeleton-shimmer" />
      ))}
    </div>
  );
}

/* ==========================================================================
   3. PROGRESS BAR LOADERS (Top Viewport & Step-Based)
   ========================================================================== */
export function TopProgressBar({ active = false, progress = null }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-transparent overflow-hidden pointer-events-none"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={progress ?? undefined}
    >
      {progress !== null ? (
        <div 
          className="h-full bg-gradient-to-r from-[#1E56E3] via-indigo-500 to-sky-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(30,86,227,0.6)]"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      ) : (
        <div className="h-full w-full bg-blue-100/40 relative">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-[#1E56E3] to-transparent animate-top-progress shadow-[0_0_8px_rgba(30,86,227,0.7)]" />
        </div>
      )}
    </div>
  );
}

export function StepProgressBar({ steps = [], currentStep = 0, className = '' }) {
  if (!steps.length) return null;
  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className={`w-full space-y-2 select-none ${className}`}>
      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span className="text-[#1E56E3]">{steps[currentStep] || ''}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div 
          className="h-full bg-gradient-to-r from-[#1E56E3] to-indigo-600 rounded-full transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   4. PULSING LOADERS (AI Typing Dots & Live Status Beacon)
   ========================================================================== */
export function PulsingDots({ label = null, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 bg-slate-100/90 px-2.5 py-1.5 rounded-full border border-slate-200/60">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="w-1.5 h-1.5 rounded-full bg-[#1E56E3]" 
            style={{ 
              animation: 'typingDot 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.2}s`
            }} 
          />
        ))}
      </div>
      {label && <span className="text-xs font-bold text-slate-500">{label}</span>}
    </div>
  );
}

export function PulsingBeacon({ color = 'blue', label = null }) {
  const colorMap = {
    blue: { ping: 'bg-blue-400', dot: 'bg-[#1E56E3]' },
    emerald: { ping: 'bg-emerald-400', dot: 'bg-emerald-500' },
    amber: { ping: 'bg-amber-400', dot: 'bg-amber-500' },
    rose: { ping: 'bg-rose-400', dot: 'bg-rose-500' }
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <span className="inline-flex items-center gap-1.5 select-none">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.ping} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.dot}`} />
      </span>
      {label && <span className="text-[11px] font-bold text-slate-600">{label}</span>}
    </span>
  );
}

/* ==========================================================================
   5. BUTTON LOADER (Interactive Action Buttons with Micro-Spinner)
   ========================================================================== */
export function ButtonLoader({
  loading = false,
  loadingText = 'Processing...',
  icon = null,
  children,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const variantStyles = {
    primary: 'bg-[#1E56E3] hover:bg-[#1649CC] text-white shadow-md shadow-blue-500/20 active:scale-[0.98]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-[0.98]',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-[0.98]',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 active:scale-[0.98]'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <SpinnerLoader size="sm" color={variant === 'outline' || variant === 'secondary' ? 'primary' : 'white'} />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

/* ==========================================================================
   6. FULL SCREEN LOADER (Backdrop-Blur Critical Transitions)
   ========================================================================== */
export function FullScreenLoader({ 
  show = true, 
  title = 'Processing securely...', 
  subtitle = 'Please do not refresh or close this tab',
  step = null 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Animated Brand Emblem */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#1E56E3]/20 animate-ping" />
          <div className="w-16 h-16 rounded-2xl bg-[#1E56E3] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 relative">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Dynamic Step / Spinner */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <SpinnerLoader size="sm" color="primary" />
          <span className="text-xs font-bold text-[#1E56E3]">
            {step || 'Securing transaction...'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   7. PULL-TO-REFRESH LOADER (Mobile Native Elastic Refresh)
   ========================================================================== */
export function PullToRefresh({ 
  onRefresh, 
  children, 
  className = '', 
  pullThreshold = 65 
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    // Only allow pull-down if user is already at the very top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop || (containerRef.current ? containerRef.current.scrollTop : 0);
    if (scrollTop <= 2 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (!startYRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    if (delta > 0) {
      // Elastic resistance formula
      const distance = Math.min(pullThreshold * 1.5, Math.pow(delta, 0.85) * 1.5);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!startYRef.current || isRefreshing) return;

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      // Trigger subtle haptic vibration if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(25); } catch (_) {}
      }

      try {
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
      } catch (err) {
        console.warn('Pull-to-refresh error:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = 0;
  };

  const rotation = Math.min(180, (pullDistance / pullThreshold) * 180);
  const progressRatio = Math.min(1, pullDistance / pullThreshold);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative ${className}`}
    >
      {/* Pull Indicator Pill */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 z-40 transition-all pointer-events-none flex items-center justify-center"
        style={{
          transform: `translate(-50%, ${pullDistance - 45}px)`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200/90 flex items-center justify-center text-[#1E56E3]">
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E56E3]" />
          ) : (
            <ArrowDown 
              className="w-4 h-4 transition-transform duration-100" 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                opacity: 0.3 + progressRatio * 0.7 
              }} 
            />
          )}
        </div>
      </div>

      {/* Main Content with subtle pushdown */}
      <div 
        style={{ 
          transform: isRefreshing ? `translateY(${pullThreshold * 0.6}px)` : pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none',
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default {
  SpinnerLoader,
  SkeletonLoader,
  TopProgressBar,
  StepProgressBar,
  PulsingDots,
  PulsingBeacon,
  ButtonLoader,
  FullScreenLoader,
  PullToRefresh
};

