import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber / CountUp Component
 * 
 * High-performance, physics-eased numeric counter for wallet balances and financial figures.
 * - Interruptible: seamlessly animates between balance updates without resetting to 0.
 * - Smooth ease-out exponential easing curve (Emil Kowalski / Apple design principles).
 * - Full support for Indian rupee numbering system (en-IN: 1,00,000).
 * - Respects prefers-reduced-motion for accessibility.
 */
export default function AnimatedNumber({
  value = 0,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
  showDecimalsSplit = false,
  decimalClassName = 'text-sm font-normal opacity-75',
  className = '',
  formatIndian = true
}) {
  const target = typeof value === 'number' && !isNaN(value) ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(target);
  const prevValueRef = useRef(target);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(target);
      prevValueRef.current = target;
      return;
    }

    const startValue = prevValueRef.current;
    const diff = target - startValue;

    // If change is zero, keep target
    if (diff === 0) {
      setDisplayValue(target);
      return;
    }

    // Cancel any in-flight animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out exponential: 1 - 2^(-10t)
      // Rapid acceleration with gentle organic settling
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + diff * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
        prevValueRef.current = target;
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [target, duration]);

  // Format the integer and decimal parts
  const num = Math.abs(displayValue);
  const isNegative = displayValue < 0;

  const formattedStr = formatIndian
    ? new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num)
    : num.toFixed(decimals);

  if (showDecimalsSplit && decimals > 0) {
    const parts = formattedStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '00';

    return (
      <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
        {isNegative && '-'}
        {prefix && <span>{prefix}</span>}
        <span>{integerPart}</span>
        <span className={decimalClassName}>.{decimalPart}</span>
        {suffix && <span>{suffix}</span>}
      </span>
    );
  }

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {isNegative && '-'}
      {prefix}
      {formattedStr}
      {suffix}
    </span>
  );
}

/**
 * Convenience export for currency balance display
 * e.g. <AnimatedBalance value={12500} showDecimals />
 */
export function AnimatedBalance({
  value = 0,
  prefix = '₹',
  decimals = 0,
  showDecimalsSplit = false,
  decimalClassName = 'text-xs md:text-sm font-normal opacity-70',
  className = '',
  duration = 950
}) {
  return (
    <AnimatedNumber
      value={value}
      prefix={prefix}
      decimals={decimals}
      showDecimalsSplit={showDecimalsSplit}
      decimalClassName={decimalClassName}
      className={className}
      duration={duration}
      formatIndian={true}
    />
  );
}
