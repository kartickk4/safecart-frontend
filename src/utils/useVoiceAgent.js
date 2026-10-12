import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Helper: Clean and normalize text so speech synthesis sounds smooth,
 * natural, friendly, and casual without mechanical halts or stuck pauses.
 */
export function cleanAndSmoothTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1. Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Normalize URLs
  text = text.replace(/https?:\/\/\S+/g, 'the link');

  // 3. Remove quotes, markdown bold/italic/code syntax early so words flow smoothly
  text = text.replace(/[\*_~`#|"]/g, '');

  // 4. Normalize currencies naturally for smooth casual Indian / global flow
  text = text.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 rupees');
  text = text.replace(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees');
  text = text.replace(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 dollars');

  // 5. Units & abbreviations
  text = text.replace(/\b(\d+)\s*kg\b/gi, '$1 kilograms');
  text = text.replace(/\b(\d+)\s*gm?\b/gi, '$1 grams');
  text = text.replace(/\b(\d+)\s*h\b/gi, '$1 hours');
  text = text.replace(/\b(\d+)\s*hr\b/gi, '$1 hours');
  text = text.replace(/\b(\d+)\s*mins?\b/gi, '$1 minutes');

  // 6. Slashes between words/options: "ok / confirm" -> "ok or confirm"
  text = text.replace(/\s*\/\s*/g, ' or ');

  // 7. Number ranges: (1-2) -> 1 to 2
  text = text.replace(/\b(\d+)\s*-\s*(\d+)\b/g, '$1 to $2');

  // 8. Hash before numbers: #1234 -> number 1234
  text = text.replace(/#(\d+)/g, 'number $1');

  // 9. Colons after labels -> soft pause e.g. "Receiver:" -> "Receiver,"
  // Prevents the robotic TTS halt on colons
  text = text.replace(/([a-zA-Z0-9]+)\s*:\s*/g, '$1, ');

  // 10. Numbered list items: " 1. " -> " 1, "
  text = text.replace(/(^|\n|\s)(\d+)\.\s+/g, '$1$2, ');

  // 11. Remove emojis & special bullet symbols
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
  text = text.replace(/[✅❌🚀📦🚚💰📱📍👤📮⚖️⏱️🏆✓🛡️👋💳🎁👑✨•●▪️▫️▶️➡️👉]/gu, ' ');

  // 12. Dashes and em-dashes -> gentle breath pause
  text = text.replace(/[—–]/g, ', ');
  text = text.replace(/\s+-\s+/g, ', ');

  // 13. Parentheses -> gentle conversational aside
  text = text.replace(/\(([^)]+)\)/g, ', $1, ');

  // 14. Newlines -> gentle comma pauses instead of hard periods
  text = text.replace(/([.?!])\s*\n+/g, '$1 ');
  text = text.replace(/\n+/g, ', ');

  // 15. Clean up duplicate punctuation & spacing
  text = text.replace(/,(\s*,)+/g, ',');
  text = text.replace(/\.(\s*\.)+/g, '.');
  text = text.replace(/[,\s]*\./g, '.');
  text = text.replace(/\s*,\s*/g, ', ');
  text = text.replace(/\s+/g, ' ');

  return text.trim();
}

/**
 * Helper: Select a smooth, sweet, casual female voice.
 * Prioritizes high-quality Neural / Natural online female voices (like Jenny, Neerja, Aria, Google)
 * which feature relaxed pacing, natural breath, and human-like inflection.
 * Strictly excludes male voices and avoids robotic legacy desktop voices.
 */
export function selectSweetCasualFemaleVoice(voices) {
  if (!voices || voices.length === 0) return null;

  // 1. Strict blacklist of male voices
  const maleKeywords = [
    'male', 'david', 'mark', 'george', 'ravi', 'guy', 'christopher',
    'eric', 'ryan', 'james', 'stefan', 'richard', 'sean', 'mitchell',
    'steffan', 'paul', 'deep', 'man', 'boy', 'prabhat', 'madhav'
  ];

  const isNotMale = (v) => {
    const nameLower = (v.name || '').toLowerCase();
    return !maleKeywords.some(m => nameLower.includes(m));
  };

  // 2. High priority: Modern Neural / Natural online female voices (sweet, human, relaxed)
  const preferredFemaleVoiceNames = [
    'jenny online (natural)',
    'neerja online (natural)',
    'aria online (natural)',
    'sonia online (natural)',
    'michelle online (natural)',
    'emma online (natural)',
    'libby online (natural)',
    'ana online (natural)',
    'google uk english female',
    'google us english',
    'google english',
    'samantha',
    'karen',
    'serena',
    'victoria',
    'tessa',
    'moira',
    'neerja',
    'heera',
    'jenny',
    'aria',
    'sonia',
    'michelle'
  ];

  for (const nameCandidate of preferredFemaleVoiceNames) {
    const found = voices.find(v => 
      isNotMale(v) && 
      (v.lang.startsWith('en') || v.lang.includes('IN')) && 
      v.name.toLowerCase().includes(nameCandidate)
    );
    if (found) return found;
  }

  // 3. Any English voice containing "natural" or "neural" that is not male
  const anyNatural = voices.find(v => 
    isNotMale(v) && 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural'))
  );
  if (anyNatural) return anyNatural;

  // 4. Any English voice explicitly labeled 'female' / 'woman' / 'girl'
  const explicitFemaleVoice = voices.find(v => 
    isNotMale(v) && 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('girl'))
  );
  if (explicitFemaleVoice) return explicitFemaleVoice;

  // 5. Any Indian English voice that is not male (excluding Zira if possible)
  const indianNonMaleVoice = voices.find(v => 
    (v.lang === 'en-IN' || v.lang.replace('_', '-').startsWith('en-IN')) && 
    isNotMale(v) &&
    !v.name.toLowerCase().includes('zira')
  );
  if (indianNonMaleVoice) return indianNonMaleVoice;

  // 6. Any English voice that is not male (excluding Zira if possible)
  const nonZiraEnglish = voices.find(v => 
    v.lang.startsWith('en') && 
    isNotMale(v) && 
    !v.name.toLowerCase().includes('zira')
  );
  if (nonZiraEnglish) return nonZiraEnglish;

  // 7. Last resort fallback
  const anyNonMale = voices.find(v => isNotMale(v));
  return anyNonMale || voices[0] || null;
}

/**
 * useVoiceAgent Hook
 * Provides speech-to-text (voice recognition) and text-to-speech (read aloud)
 * for the AI Shipping Agent.
 */
export function useVoiceAgent({ onFinalTranscript, autoSend = false } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('sk_agent_voice_enabled') === 'true';
  });

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const keepAliveTimerRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Preload and keep speech synthesis voices synchronized across all browsers
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      } catch (e) {}
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }
    };
  }, []);

  // Helper to keep Chrome/Edge speech synthesis alive during long utterances
  const startKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 9000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian names, locations, and pincodes

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        const currentText = (finalText || interimText).trim();
        if (currentText) {
          setLiveTranscript(currentText);
        }

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (finalText && onFinalTranscript) {
          onFinalTranscript(finalText.trim());
          if (autoSend) {
            // Stop listening after sending
            recognition.stop();
          }
        } else if (interimText) {
          // If paused for 2.2 seconds after speaking, consider final
          silenceTimerRef.current = setTimeout(() => {
            if (interimText.trim() && onFinalTranscript) {
              onFinalTranscript(interimText.trim());
              recognition.stop();
            }
          }, 2200);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition notice:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [onFinalTranscript, autoSend]);

  // Persist voice response preference
  const toggleVoiceEnabled = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem('sk_agent_voice_enabled', String(next));
      if (!next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        stopKeepAlive();
        setIsSpeaking(false);
      }
      return next;
    });
  }, [stopKeepAlive]);

  // Start voice listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    // Stop any ongoing speech readout before listening to the user
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      stopKeepAlive();
      setIsSpeaking(false);
    }
    setLiveTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      // If already started, stop and restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (e2) {}
    }
  }, [stopKeepAlive]);

  // Stop voice listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Speak agent response aloud using a smooth, sweet, casual female voice
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Cancel any previous utterance and stop keepalive
    window.speechSynthesis.cancel();
    stopKeepAlive();

    const cleanedText = cleanAndSmoothTextForSpeech(text);
    if (!cleanedText) return;

    // Pick sweetest available casual female voice
    const currentVoices = (availableVoices && availableVoices.length > 0)
      ? availableVoices
      : window.speechSynthesis.getVoices();
    const sweetFemaleVoice = selectSweetCasualFemaleVoice(currentVoices);

    // If it's a legacy robotic desktop voice (e.g. old Zira), avoid pitch shifting to prevent harsh tinny artifacts
    const isRoboticLegacy = sweetFemaleVoice && 
      (sweetFemaleVoice.name.toLowerCase().includes('zira') || 
       (!sweetFemaleVoice.name.toLowerCase().includes('natural') && 
        !sweetFemaleVoice.name.toLowerCase().includes('google') && 
        !sweetFemaleVoice.name.toLowerCase().includes('samantha')));

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Rate: 0.97 provides a casual, conversational, relaxed rhythm
    utterance.rate = 0.97;

    // Pitch: 1.04 gives a sweet, youthful, warm inflection without digital hardness
    utterance.pitch = isRoboticLegacy ? 1.0 : 1.04;

    // Volume: 0.95 gives comfortable, soft warmth
    utterance.volume = 0.95;

    if (sweetFemaleVoice) {
      utterance.voice = sweetFemaleVoice;
      utterance.lang = sweetFemaleVoice.lang || 'en-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      startKeepAlive();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopKeepAlive();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech synthesis notice:', e.error);
      }
      setIsSpeaking(false);
      stopKeepAlive();
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, availableVoices, startKeepAlive, stopKeepAlive]);

  // Stop current speech playback
  const stopSpeaking = useCallback(() => {
    stopKeepAlive();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [stopKeepAlive]);

  return {
    isSupported,
    isListening,
    liveTranscript,
    isSpeaking,
    voiceEnabled,
    toggleVoiceEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
