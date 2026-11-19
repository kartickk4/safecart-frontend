import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * TextReveal — Progressive AI Token Reveal Animation (Apple & Linear Grade)
 * 
 * Features:
 * - Word & markdown token streaming with smooth micro-blur entrance
 * - Pulsing glowing AI gradient caret during streaming
 * - Click-to-skip instant reveal for power users
 * - Full WCAG 2.1 AA & prefers-reduced-motion compliance
 * - Preserves bold formatting (*text*), line breaks, and emojis
 * 
 * @param {string} text - Message text to reveal
 * @param {boolean} animate - Whether to animate (true for new agent messages, false for history/user)
 * @param {number} speed - Milliseconds per tick (default: 18ms)
 * @param {boolean} isAgent - Whether message is from AI Agent (influences caret & styling)
 * @param {function} onComplete - Callback fired when text finishes revealing
 * @param {string} className - Optional container styling
 */
export default function TextReveal({
  text = '',
  animate = true,
  speed = 18,
  isAgent = true,
  onComplete,
  className = ''
}) {
  // Check system prefers-reduced-motion setting
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Split text into tokens (words, markdown bold *...*, newlines, spaces)
  const tokens = useMemo(() => {
    if (!text) return [];
    // Regex splits by: bold blocks (*...*), newlines (\n), or whitespace words
    const regex = /(\*[^*]+\*|\n|\s+)/g;
    const rawParts = String(text).split(regex);
    const result = [];
    for (let part of rawParts) {
      if (!part) continue;
      result.push(part);
    }
    return result;
  }, [text]);

  const shouldAnimate = animate && !prefersReducedMotion && tokens.length > 0;
  const [visibleCount, setVisibleCount] = useState(shouldAnimate ? 0 : tokens.length);
  const [isFinished, setIsFinished] = useState(!shouldAnimate);
  const timerRef = useRef(null);

  // Click anywhere on text to instantly skip animation and reveal 100%
  const handleSkip = useCallback(() => {
    if (!isFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      setVisibleCount(tokens.length);
      setIsFinished(true);
      if (typeof onComplete === 'function') onComplete();
    }
  }, [isFinished, tokens.length, onComplete]);

  useEffect(() => {
    // If not animating, reveal all instantly
    if (!shouldAnimate) {
      setVisibleCount(tokens.length);
      setIsFinished(true);
      return;
    }

    // Reset state for new text
    setVisibleCount(0);
    setIsFinished(false);

    // Adaptive speed: If text is long (>60 tokens), reveal 2-3 tokens per step
    const stepSize = tokens.length > 120 ? 3 : tokens.length > 60 ? 2 : 1;
    const tickInterval = Math.max(12, speed);

    timerRef.current = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + stepSize;
        if (next >= tokens.length) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          if (typeof onComplete === 'function') {
            setTimeout(onComplete, 50);
          }
          return tokens.length;
        }
        return next;
      });
    }, tickInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, shouldAnimate, tokens.length, speed, onComplete]);

  // Render visible tokens
  const renderedTokens = useMemo(() => {
    const slice = tokens.slice(0, visibleCount);
    return slice.map((token, index) => {
      // Line breaks
      if (token === '\n') {
        return <br key={`nl-${index}`} />;
      }
      
      // Pure spaces
      if (/^\s+$/.test(token)) {
        return <span key={`sp-${index}`}>{token}</span>;
      }

      // Bold markdown (*text*)
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        const inner = token.slice(1, -1);
        return (
          <strong 
            key={`b-${index}`} 
            className={`font-bold ${isAgent ? 'text-slate-900' : 'text-white'} text-reveal-token`}
          >
            {inner}
          </strong>
        );
      }

      // Normal word
      return (
        <span 
          key={`w-${index}`} 
          className="text-reveal-token"
        >
          {token}
        </span>
      );
    });
  }, [tokens, visibleCount, isAgent]);

  return (
    <div
      onClick={handleSkip}
      className={`relative select-text ${!isFinished ? 'cursor-pointer' : ''} ${className}`}
      title={!isFinished ? "Click to reveal full message" : undefined}
      role="region"
      aria-live="polite"
    >
      {renderedTokens}

      {/* Pulsing AI Caret while streaming */}
      {shouldAnimate && !isFinished && (
        <span 
          className="ai-typing-caret" 
          aria-hidden="true" 
        />
      )}
    </div>
  );
}
