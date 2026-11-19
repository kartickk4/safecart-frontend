import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * TextReveal — Progressive AI Token Reveal Animation (Apple & Linear Grade)
 * 
 * Features:
 * - Line-aware markdown parsing with ZERO cross-line bleeding or asterisk swallowing
 * - Structured section headers, bullet lists with hanging indents, and callout sub-items
 * - Preserves bold formatting (**text** and *text*), code blocks, and emojis
 * - Progressive streaming token entrance with glowing AI gradient caret
 * - Click-to-skip instant reveal
 * - WCAG 2.1 AA & prefers-reduced-motion compliance
 */

/**
 * Parses markdown message into lines and inline tokens with zero cross-line bleeding.
 */
function parseMessageStructure(rawText) {
  if (!rawText) return { lines: [], totalTokens: 0 };
  const rawLines = String(rawText).split(/\r?\n/);
  let globalCount = 0;

  const parsedLines = rawLines.map((lineText, lineIdx) => {
    const trimmed = lineText.trim();
    if (!trimmed) {
      return { 
        type: 'empty', 
        lineIdx, 
        tokens: [], 
        startIndex: globalCount, 
        endIndex: globalCount 
      };
    }

    // Recognize headers: starts with standard logistics emoji or #
    const isHeader = /^([🚨⚡⚠️📊💰⚖️🎁🔒📦🔄🛡️🤝👋📍🏆🔍💡]|#{1,3}\s)/.test(trimmed);
    const isBullet = /^[•\-\*]\s+/.test(trimmed) || /^[0-9]+[️⃣\.]\s*/.test(trimmed);
    const isSubItem = /^\s*└/.test(lineText);

    let contentToTokenize = lineText;
    let bulletPrefix = null;

    if (isSubItem) {
      const match = lineText.match(/^(\s*└\s*)(.*)$/);
      if (match) {
        bulletPrefix = '└';
        contentToTokenize = match[2];
      }
    } else if (isBullet) {
      const match = trimmed.match(/^([•\-\*]|[0-9]+[️⃣\.])\s+(.*)$/);
      if (match) {
        bulletPrefix = match[1];
        contentToTokenize = match[2];
      }
    }

    // Tokenize line content: strictly bounded inside the single line
    // Matches: **bold**, *italic/bold*, `code`, non-whitespace words, whitespace
    const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|[^\s*`]+|\s+)/g;
    const rawTokens = contentToTokenize.match(regex) || [];
    
    const lineTokens = rawTokens.filter(t => t !== '').map((raw) => {
      let type = 'word';
      let content = raw;

      if (/^\s+$/.test(raw)) {
        type = 'space';
      } else if (raw.startsWith('**') && raw.endsWith('**') && raw.length >= 4) {
        type = 'bold';
        content = raw.slice(2, -2);
      } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length >= 2) {
        type = 'bold';
        content = raw.slice(1, -1);
      } else if (raw.startsWith('`') && raw.endsWith('`') && raw.length >= 2) {
        type = 'code';
        content = raw.slice(1, -1);
      }

      const tokenObj = {
        globalIndex: globalCount,
        type,
        content,
        raw
      };
      globalCount++;
      return tokenObj;
    });

    return {
      type: isHeader ? 'header' : isSubItem ? 'subitem' : isBullet ? 'bullet' : 'paragraph',
      lineIdx,
      bulletPrefix,
      tokens: lineTokens,
      startIndex: lineTokens.length > 0 ? lineTokens[0].globalIndex : globalCount,
      endIndex: globalCount
    };
  });

  return { lines: parsedLines, totalTokens: globalCount };
}

export default function TextReveal({
  text = '',
  animate = true,
  speed = 18,
  isAgent = true,
  onProgress,
  onComplete,
  className = ''
}) {
  // Check system prefers-reduced-motion setting
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Parse structured lines and tokens
  const { lines, totalTokens } = useMemo(() => {
    return parseMessageStructure(text);
  }, [text]);

  const shouldAnimate = animate && !prefersReducedMotion && totalTokens > 0;
  const [visibleCount, setVisibleCount] = useState(shouldAnimate ? 0 : totalTokens);
  const [isFinished, setIsFinished] = useState(!shouldAnimate);
  const timerRef = useRef(null);

  // Click anywhere on text to instantly skip animation and reveal 100%
  const handleSkip = useCallback(() => {
    if (!isFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      setVisibleCount(totalTokens);
      setIsFinished(true);
      if (typeof onProgress === 'function') onProgress();
      if (typeof onComplete === 'function') onComplete();
    }
  }, [isFinished, totalTokens, onProgress, onComplete]);

  useEffect(() => {
    // If not animating, reveal all instantly
    if (!shouldAnimate) {
      setVisibleCount(totalTokens);
      setIsFinished(true);
      return;
    }

    // Reset state for new text
    setVisibleCount(0);
    setIsFinished(false);

    // Adaptive speed: If text is long (>60 tokens), reveal 2-3 tokens per step
    const stepSize = totalTokens > 120 ? 3 : totalTokens > 60 ? 2 : 1;
    const tickInterval = Math.max(12, speed);

    timerRef.current = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + stepSize;
        if (typeof onProgress === 'function') {
          onProgress();
        }
        if (next >= totalTokens) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          if (typeof onComplete === 'function') {
            setTimeout(onComplete, 50);
          }
          return totalTokens;
        }
        return next;
      });
    }, tickInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, shouldAnimate, totalTokens, speed, onProgress, onComplete]);

  // Helper to render an individual token
  const renderToken = useCallback((token) => {
    if (token.type === 'space') {
      return <span key={token.globalIndex}>{token.raw}</span>;
    }

    if (token.type === 'bold') {
      return (
        <strong 
          key={token.globalIndex} 
          className={`font-bold ${isAgent ? 'text-slate-900' : 'text-white'} text-reveal-token`}
        >
          {token.content}
        </strong>
      );
    }

    if (token.type === 'code') {
      return (
        <code 
          key={token.globalIndex} 
          className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-xs text-reveal-token"
        >
          {token.content}
        </code>
      );
    }

    return (
      <span 
        key={token.globalIndex} 
        className="text-reveal-token"
      >
        {token.content}
      </span>
    );
  }, [isAgent]);

  // Caret component
  const Caret = () => (
    <span 
      className="inline-block w-1.5 h-3.5 ml-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-xs align-middle text-reveal-caret animate-pulse" 
      aria-hidden="true" 
    />
  );

  return (
    <div
      onClick={handleSkip}
      className={`relative select-text space-y-1.5 ${!isFinished ? 'cursor-pointer' : ''} ${className}`}
      title={!isFinished ? "Click to reveal full message" : undefined}
      role="region"
      aria-live="polite"
    >
      {lines.map((line) => {
        // If line hasn't been reached yet, don't render it
        if (visibleCount < line.startIndex) {
          return null;
        }

        // Empty line -> paragraph spacer
        if (line.type === 'empty') {
          return <div key={line.lineIdx} className="h-1.5 sm:h-2" />;
        }

        // Filter visible tokens on this line
        const visibleTokens = line.tokens.filter(t => t.globalIndex < visibleCount);
        const isStreamingOnThisLine = shouldAnimate && !isFinished && visibleCount >= line.startIndex && visibleCount <= line.endIndex;

        // Header line
        if (line.type === 'header') {
          return (
            <div 
              key={line.lineIdx} 
              className="font-extrabold text-[13.5px] sm:text-sm text-slate-900 mt-2.5 first:mt-0 mb-1 flex items-center gap-1.5 flex-wrap leading-snug"
            >
              {visibleTokens.map(renderToken)}
              {isStreamingOnThisLine && <Caret />}
            </div>
          );
        }

        // Bullet line (hanging indent)
        if (line.type === 'bullet') {
          return (
            <div key={line.lineIdx} className="flex items-start gap-2 py-0.5 ml-0.5 text-slate-800">
              <span className="text-indigo-600 font-bold shrink-0 mt-0.5 select-none text-xs">
                {line.bulletPrefix || '•'}
              </span>
              <div className="flex-1 min-w-0 leading-relaxed">
                {visibleTokens.map(renderToken)}
                {isStreamingOnThisLine && <Caret />}
              </div>
            </div>
          );
        }

        // Sub-item (indented action status callout)
        if (line.type === 'subitem') {
          return (
            <div 
              key={line.lineIdx} 
              className="ml-4 sm:ml-5 pl-2.5 py-1 my-0.5 border-l-2 border-indigo-300 bg-indigo-50/70 rounded-r-lg text-xs font-semibold text-indigo-950 flex items-center gap-1.5 flex-wrap"
            >
              <span className="text-indigo-500 font-bold select-none">└</span>
              <div className="flex-1 min-w-0 leading-normal">
                {visibleTokens.map(renderToken)}
                {isStreamingOnThisLine && <Caret />}
              </div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={line.lineIdx} className="leading-relaxed text-slate-700">
            {visibleTokens.map(renderToken)}
            {isStreamingOnThisLine && <Caret />}
          </p>
        );
      })}
    </div>
  );
}
