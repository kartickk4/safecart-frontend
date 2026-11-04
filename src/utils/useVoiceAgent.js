import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Clean and normalize text so speech synthesis sounds smooth,
 * natural, friendly, and casual like Gemini/ChatGPT without mechanical halts.
 */
export function cleanAndSmoothTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1. Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Normalize URLs
  text = text.replace(/https?:\/\/\S+/g, 'the link');

  // 3. Remove quotes, markdown bold/italic/code syntax
  text = text.replace(/[*_~#|"]/g, '');
  text = text.replace(/`/g, '');

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
  text = text.replace(/([a-zA-Z0-9]+)\s*:\s*/g, '$1, ');

  // 10. Numbered list items: " 1. " -> " 1, "
  text = text.replace(/(^|\n|\s)(\d+)\.\s+/g, '$1$2, ');

  // 11. Remove emojis & special bullet symbols
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
  text = text.replace(/[•●▪▫★☆✓✔✕✖⚡✨📦🚚💰🛡️🎁🏷️🔔📞💬]/gu, ' ');

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
  text = text.replace(/,\s*\./g, '.');
  text = text.replace(/\s*,\s*/g, ', ');
  text = text.replace(/\s+/g, ' ');

  return text.trim();
}

/**
 * Select a smooth, sweet, casual female voice like Gemini or ChatGPT.
 * Prioritizes high-quality Neural / Natural online female voices
 * (Jenny, Aria, Sonia, Google US/UK Female, Samantha Enhanced, Neerja).
 */
export function selectSweetCasualFemaleVoice(voices, preferredName = null) {
  if (!voices || voices.length === 0) return null;

  // Strict blacklist of male voices
  const maleKeywords = [
    'male', 'david', 'mark', 'george', 'ravi', 'guy', 'christopher',
    'eric', 'ryan', 'james', 'stefan', 'richard', 'sean', 'mitchell',
    'steffan', 'paul', 'deep', 'man', 'boy', 'prabhat', 'madhav', 'ajay'
  ];

  const isNotMale = (v) => {
    const nameLower = (v.name || '').toLowerCase();
    return !maleKeywords.some(m => nameLower.includes(m));
  };

  // If user selected a specific voice preference
  if (preferredName) {
    const matched = voices.find(v => v.name === preferredName);
    if (matched) return matched;
  }

  // Priority 1: Top-tier Neural voices matching ChatGPT/Gemini conversational warmth
  const preferredFemaleVoiceNames = [
    'jenny online (natural)',
    'aria online (natural)',
    'sonia online (natural)',
    'michelle online (natural)',
    'neerja online (natural)',
    'heera online (natural)',
    'google uk english female',
    'google us english',
    'google english',
    'samantha (enhanced)',
    'samantha',
    'siri female',
    'karen',
    'serena',
    'victoria',
    'tessa',
    'jenny',
    'aria',
    'sonia',
    'neerja'
  ];

  for (const nameCandidate of preferredFemaleVoiceNames) {
    const found = voices.find(v => 
      isNotMale(v) && 
      (v.lang.startsWith('en') || v.lang.includes('IN')) && 
      v.name.toLowerCase().includes(nameCandidate)
    );
    if (found) return found;
  }

  // Priority 2: Any English voice containing "natural" or "neural" that is not male
  const anyNatural = voices.find(v => 
    isNotMale(v) && 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural'))
  );
  if (anyNatural) return anyNatural;

  // Priority 3: Any English voice explicitly labeled 'female' / 'woman'
  const explicitFemaleVoice = voices.find(v => 
    isNotMale(v) && 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
  );
  if (explicitFemaleVoice) return explicitFemaleVoice;

  // Priority 4: Indian English voice that is not male
  const indianNonMaleVoice = voices.find(v => 
    (v.lang === 'en-IN' || v.lang.replace('_', '-').startsWith('en-IN')) && 
    isNotMale(v) &&
    !v.name.toLowerCase().includes('zira')
  );
  if (indianNonMaleVoice) return indianNonMaleVoice;

  // Priority 5: Any non-Zira English voice
  const nonZiraEnglish = voices.find(v => 
    v.lang.startsWith('en') && 
    isNotMale(v) && 
    !v.name.toLowerCase().includes('zira')
  );
  if (nonZiraEnglish) return nonZiraEnglish;

  return voices.find(v => isNotMale(v)) || voices[0] || null;
}

/**
 * useVoiceAgent Hook
 * Provides advanced speech-to-text with microphone volume analysis,
 * and conversational text-to-speech with Gemini/ChatGPT warmth.
 */
export function useVoiceAgent({ onFinalTranscript, autoSend = false } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for live waveform
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('sk_agent_voice_enabled') === 'true';
  });

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const keepAliveTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const isListeningRef = useRef(false);

  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem('sk_agent_voice_name') || '';
  });

  // Preload and keep speech synthesis voices synchronized
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

  // Keep Chrome/Edge speech synthesis alive for long responses
  const startKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8500);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  // Stop microphone stream and audio level visualizer
  const releaseMicStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start real-time audio volume visualizer meter
  const startAudioMeter = useCallback((stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Audio meter initialization notice:', e);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const isMobile = typeof navigator !== 'undefined' && 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const recognition = new SpeechRecognition();
      // On mobile browsers, continuous: true crashes or disconnects. Use false on mobile.
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setMicError('');
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

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (finalText) {
          if (onFinalTranscript) {
            onFinalTranscript(finalText.trim());
          }
          if (autoSend || isMobile) {
            try { recognition.stop(); } catch (e) {}
          }
        } else if (interimText) {
          // If paused for 2.2s after speaking, consider final
          silenceTimerRef.current = setTimeout(() => {
            if (interimText.trim() && onFinalTranscript) {
              onFinalTranscript(interimText.trim());
              try { recognition.stop(); } catch (e) {}
            }
          }, 2200);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'audio-capture') {
          setMicError('No microphone detected. Please plug in a microphone or headset.');
        } else if (event.error === 'network') {
          setMicError('Speech recognition network error. Please check your internet connection.');
        }
        setIsListening(false);
        isListeningRef.current = false;
        releaseMicStream();
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        releaseMicStream();
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
      releaseMicStream();
    };
  }, [onFinalTranscript, autoSend, releaseMicStream]);

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

  // Start voice listening with explicit getUserMedia check
  const startListening = useCallback(async () => {
    setMicError('');
    setLiveTranscript('');

    // Stop ongoing speech readout before listening to the user
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      stopKeepAlive();
      setIsSpeaking(false);
    }

    // 1. Request microphone permission via getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        startAudioMeter(stream);
      } catch (err) {
        console.warn('getUserMedia error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('Microphone permission blocked. Please click the lock/settings icon in your browser address bar and set Microphone to "Allow".');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMicError('No microphone found on this device. Please connect a headset or mic.');
        } else {
          setMicError('Could not start microphone: ' + (err.message || 'Permission required'));
        }
        return;
      }
    }

    // 2. Start Speech Recognition
    if (!recognitionRef.current) {
      setMicError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      releaseMicStream();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // If already running, abort and re-start cleanly
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch (e2) {}
        }, 200);
      } catch (e2) {}
    }
  }, [startAudioMeter, stopKeepAlive, releaseMicStream]);

  // Stop voice listening cleanly
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
    releaseMicStream();
  }, [releaseMicStream]);

  // Speak agent response aloud
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    stopKeepAlive();

    const cleanedText = cleanAndSmoothTextForSpeech(text);
    if (!cleanedText) return;

    const currentVoices = (availableVoices && availableVoices.length > 0)
      ? availableVoices
      : window.speechSynthesis.getVoices();
    const sweetFemaleVoice = selectSweetCasualFemaleVoice(currentVoices, selectedVoiceName);

    const isRoboticLegacy = sweetFemaleVoice && 
      (sweetFemaleVoice.name.toLowerCase().includes('zira') || 
       (!sweetFemaleVoice.name.toLowerCase().includes('natural') && 
        !sweetFemaleVoice.name.toLowerCase().includes('google') && 
        !sweetFemaleVoice.name.toLowerCase().includes('samantha')));

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Warm, natural pace and pitch matching Gemini / ChatGPT voice agents
    utterance.rate = 0.98;
    utterance.pitch = isRoboticLegacy ? 1.0 : 1.02;
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
  }, [voiceEnabled, availableVoices, selectedVoiceName, startKeepAlive, stopKeepAlive]);

  // Test voice sample
  const testVoice = useCallback((voiceName) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const sample = "Hi Kartick! I am your SecureKaro AI assistant. I am ready to book, track, and protect your shipments.";
    const currentVoices = window.speechSynthesis.getVoices();
    const voice = selectSweetCasualFemaleVoice(currentVoices, voiceName);

    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.rate = 0.98;
    utterance.pitch = 1.02;
    utterance.volume = 0.95;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'en-IN';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop current speech playback
  const stopSpeaking = useCallback(() => {
    stopKeepAlive();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [stopKeepAlive]);

  const changeVoice = useCallback((voiceName) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('sk_agent_voice_name', voiceName);
  }, []);

  return {
    isSupported,
    isListening,
    liveTranscript,
    isSpeaking,
    voiceEnabled,
    micError,
    clearMicError: () => setMicError(''),
    audioLevel,
    availableVoices,
    selectedVoiceName,
    changeVoice,
    testVoice,
    toggleVoiceEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
