import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgentChatBubble from './AgentChatBubble';
import CarrierComparisonCard from './CarrierComparisonCard';
import BulkUploadPanel from './BulkUploadPanel';
import { Bot, RefreshCw, X, FileSpreadsheet, Send, Mic, MicOff, Volume2, VolumeX, Maximize2, Minimize2, Sparkles, Package, MessageSquare, Zap, ArrowLeftRight, MoveVertical, EyeOff, Eye } from 'lucide-react';
import { useVoiceAgent } from '../utils/useVoiceAgent';

const rawApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_BASE = rawApi.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
const SESSION_KEY = 'sk_agent_session';
const SK_LOGO = '/logo.jpg';

/**
 * AgentWidget — Floating AI agent chat widget with light friendly styling.
 */
const AgentWidget = ({ onNavigate }) => {
  const [isOpen, setIsOpen]             = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]           = useState('');
  const [sessionId, setSessionId]   = useState(() => localStorage.getItem(SESSION_KEY) || '');
  const [isLoading, setIsLoading]   = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [step, setStep]             = useState(0);
  const [showBulk, setShowBulk]     = useState(false);
  const [hasNewMsg, setHasNewMsg]   = useState(false);
  const [pulse, setPulse]           = useState(true);
  
  // ── Positioning & Ergonomics States ──
  const [dockSide, setDockSide]       = useState(() => localStorage.getItem('sk_fab_dock') || 'right');
  const [showTooltip, setShowTooltip] = useState(() => localStorage.getItem('sk_fab_tooltip') !== 'hidden');
  const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('sk_fab_minimized') === 'true');
  const [vOffset, setVOffset]         = useState(() => Number(localStorage.getItem('sk_fab_v_offset')) || 24);
  const [showControls, setShowControls] = useState(false);

  const toggleDockSide = (e) => {
    e.stopPropagation();
    const next = dockSide === 'right' ? 'left' : 'right';
    setDockSide(next);
    localStorage.setItem('sk_fab_dock', next);
  };

  const cycleVOffset = (e) => {
    e.stopPropagation();
    const next = vOffset === 24 ? 96 : vOffset === 96 ? 170 : 24;
    setVOffset(next);
    localStorage.setItem('sk_fab_v_offset', String(next));
  };

  const handleDismissTooltip = (e) => {
    e.stopPropagation();
    setShowTooltip(false);
    localStorage.setItem('sk_fab_tooltip', 'hidden');
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    const next = !isMinimized;
    setIsMinimized(next);
    localStorage.setItem('sk_fab_minimized', String(next));
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleOpenAiAgentPage = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('ai-agent');
    } else {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'ai-agent' }));
    }
  };

  // ── Voice Agent ──
  const handleVoiceFinal = useCallback((finalText) => {
    if (finalText) setInput(finalText);
  }, []);

  const {
    isSupported: isVoiceSupported,
    isListening,
    liveTranscript,
    isSpeaking,
    voiceEnabled,
    toggleVoiceEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useVoiceAgent({ onFinalTranscript: handleVoiceFinal });

  // Sync live transcript → input box
  useEffect(() => {
    if (isListening && liveTranscript) setInput(liveTranscript);
  }, [isListening, liveTranscript]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pulse the FAB every 4 seconds if not opened
  useEffect(() => {
    if (isOpen) { setPulse(false); return; }
    const interval = setInterval(() => setPulse(p => !p), 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Listen for external trigger to open widget
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-agent-widget', handleOpen);
    return () => window.removeEventListener('open-agent-widget', handleOpen);
  }, []);

  // Auto-greet on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && !sessionId) {
      sendMessage('', true);
    }
  }, [isOpen]);

  // ESC key exits fullscreen
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const getToken = () => localStorage.getItem('securekaro_token') || localStorage.getItem('skToken') || localStorage.getItem('token') || '';

  const sendMessage = useCallback(async (userText = '', isInit = false) => {
    if (!userText.trim() && !isInit) return;
    if (isLoading) return;

    const token = getToken();
    if (!token) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Please log in to use the AI Agent.',
        timestamp: new Date()
      }]);
      return;
    }

    if (userText.trim()) {
      setMessages(prev => [...prev, {
        role: 'user',
        content: userText.trim(),
        timestamp: new Date()
      }]);
    }
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userText.trim(),
          sessionId: sessionId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent error');

      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_KEY, data.sessionId);
      }
      setStep(data.step || 0);

      if (data.selectedCarrier?.slug) {
        setSelectedCarrier(data.selectedCarrier);
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.reply,
        timestamp: new Date(),
        showCarriers: !!data.carrierQuotes?.length,
        carrierQuotes: data.carrierQuotes,
        selectedCarrier: data.selectedCarrier,
        shipmentId: data.createdShipmentId
      }]);

      if (data.reply) speak(data.reply);

      if (!isOpen) setHasNewMsg(true);
    } catch (err) {
      const isNetworkErr = err?.message?.includes("Failed to fetch") || err?.name === "TypeError";
      const errMsg = isNetworkErr
        ? "Cannot connect to the SecureKaro backend server (http://localhost:5001). Please ensure your backend is running (`npm run dev` in safecart-backend)."
        : `Error: ${err.message || 'Something went wrong.'}`;
      setMessages(prev => [...prev, {
        role: 'agent',
        content: errMsg,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [sessionId, isLoading, isOpen]);

  const handleCarrierSelect = (carrier) => {
    setSelectedCarrier(carrier);
    sendMessage(carrier.name);
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId('');
    setSelectedCarrier(null);
    setStep(0);
    localStorage.removeItem(SESSION_KEY);
    setTimeout(() => sendMessage('', true), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const QUICK_REPLIES = {
    7: ['Prepaid (Online Link)', 'Cash on Delivery (COD)'],
    8: ['Yes, Enable RTO Protection', 'No, Skip RTO'],
    9: ['Yes, Allow Returns', 'No, Final Sale'],
    10: ['Confirm Courier', 'Change Courier'],
    11: ['Confirm & Book', 'Change Courier', 'Edit Address', 'Edit Payment', 'Toggle RTO', 'Edit Dimensions', 'Edit Amount', 'Toggle Return', 'Edit Name', 'Edit Phone', 'Edit Pincode'],
    12: ['Book Another Shipment']
  };

  // Maps display label → exact keyword backend expects
  const QUICK_REPLY_KEYWORDS = {
    'Prepaid (Online Link)':      '1',
    'Prepaid Order':              '1',
    'Prepaid (Online)':            '1',
    'Cash on Delivery (COD)':      '2',
    'Yes, Enable RTO Protection':  'yes',
    'No, Skip RTO':               'no',
    'Yes, Allow Returns':         'yes',
    'No, Final Sale':             'no',
    'Confirm Courier':            'confirm',
    'Confirm & Book':             'confirm',
    'Change Courier':             'change courier',
    'Edit Payment':               'edit mode',
    'Toggle RTO':                 'toggle rto',
    'Edit Dimensions':            'edit dims',
    'Edit Name':                  'edit name',
    'Edit Phone':                 'edit phone',
    'Edit Address':               'edit address',
    'Edit Pincode':               'edit pincode',
    'Edit Amount':                'edit amount',
    'Toggle Return':              'toggle return',
    'Edit Return':                'toggle return',
    'Book Another Shipment':      'Book Another Shipment'
  };

  const currentQuickReplies = QUICK_REPLIES[step] || [];

  const handleQuickReply = (label) => {
    const keyword = QUICK_REPLY_KEYWORDS[label] || label;
    // Show the friendly label to the user but send the backend keyword
    if (isLoading) return;
    const token = getToken();
    if (!token) return;
    setMessages(prev => [...prev, { role: 'user', content: label, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);
    fetch(`${API_BASE}/api/v1/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: keyword, sessionId: sessionId || undefined })
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Agent error');
        if (d.sessionId) { setSessionId(d.sessionId); localStorage.setItem(SESSION_KEY, d.sessionId); }
        setStep(d.step || 0);
        if (d.selectedCarrier?.slug) setSelectedCarrier(d.selectedCarrier);
        setMessages(prev => [...prev, {
          role: 'agent', content: d.reply, timestamp: new Date(),
          showCarriers: !!d.carrierQuotes?.length, carrierQuotes: d.carrierQuotes,
          selectedCarrier: d.selectedCarrier, shipmentId: d.createdShipmentId
        }]);
        if (d.reply) speak(d.reply);
        if (!isOpen) setHasNewMsg(true);
      })
      .catch(err => {
        setMessages(prev => [...prev, { role: 'agent', content: `Error: ${err.message}`, timestamp: new Date() }]);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
  };

  /* FAB when closed */
  if (!isOpen) {
    const isDockRight = dockSide === 'right';

    return (
      <>
        <style>{`
          @keyframes tooltipBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes fabPulseRing{0%{box-shadow:0 0 0 0 rgba(99,102,241,0.5),0 8px 20px rgba(79,70,229,0.4)}70%{box-shadow:0 0 0 10px rgba(99,102,241,0),0 8px 20px rgba(79,70,229,0.4)}100%{box-shadow:0 0 0 0 rgba(99,102,241,0),0 8px 20px rgba(79,70,229,0.4)}}
          .sk-fab-toolbtn {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 9999px;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 700;
            color: #475569;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
            white-space: nowrap;
          }
          .sk-fab-toolbtn:hover {
            background: #f8fafc;
            color: #4f46e5;
            border-color: #c7d2fe;
            transform: translateY(-1px);
          }
        `}</style>

        <div
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          style={{
            position: 'fixed',
            bottom: `${vOffset}px`,
            [dockSide]: '24px',
            zIndex: 40, // Below z-50 modals, drawers, and bottom bars
            display: 'flex',
            flexDirection: 'column',
            alignItems: isDockRight ? 'flex-end' : 'flex-start',
            gap: '8px',
            transition: 'bottom 0.25s cubic-bezier(0.16,1,0.3,1), right 0.25s ease, left 0.25s ease'
          }}
        >
          {/* Quick Reposition & Minimize Toolbar (Revealed on hover or when tooltip is open) */}
          {(showControls || isMinimized) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              padding: '4px 6px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
              animation: 'bubbleFadeIn 0.15s ease'
            }}>
              <button
                type="button"
                onClick={toggleDockSide}
                title={isDockRight ? 'Move to Left Side' : 'Move to Right Side'}
                className="sk-fab-toolbtn"
              >
                <ArrowLeftRight size={11} className="text-indigo-600" />
                <span>{isDockRight ? 'Dock Left' : 'Dock Right'}</span>
              </button>

              <button
                type="button"
                onClick={cycleVOffset}
                title="Move Up/Down to avoid blocking buttons"
                className="sk-fab-toolbtn"
              >
                <MoveVertical size={11} className="text-indigo-600" />
                <span>{vOffset === 24 ? 'Move Up' : vOffset === 96 ? 'Higher' : 'Reset'}</span>
              </button>

              <button
                type="button"
                onClick={toggleMinimize}
                title={isMinimized ? 'Expand Button' : 'Minimize to Mini Icon'}
                className="sk-fab-toolbtn"
              >
                {isMinimized ? <Maximize2 size={11} className="text-indigo-600" /> : <EyeOff size={11} className="text-slate-500" />}
                <span>{isMinimized ? 'Expand' : 'Hide'}</span>
              </button>
            </div>
          )}

          {/* Minimized Mini Tab View */}
          {isMinimized ? (
            <div
              onClick={handleOpenAiAgentPage}
              title="Click to Open AI Agent (or click Expand to restore full button)"
              style={{
                background: '#ffffff',
                border: '1.5px solid #c7d2fe',
                borderRadius: '9999px',
                padding: '6px 14px',
                boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Sparkles size={11} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca' }}>AI Agent</span>
              <button
                type="button"
                onClick={toggleMinimize}
                title="Restore full button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Maximize2 size={12} />
              </button>
            </div>
          ) : (
            <>
              {/* Dismissible Tooltip Banner */}
              {showTooltip && (
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: '14px',
                  padding: '6px 10px 6px 12px',
                  color: '#4f46e5',
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.15)',
                  whiteSpace: 'nowrap',
                  animation: 'tooltipBounce 2s ease-in-out infinite',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div onClick={handleOpenAiAgentPage} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} /> Book a Shipment with AI
                  </div>
                  <button
                    type="button"
                    onClick={handleDismissTooltip}
                    title="Dismiss prompt"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      marginLeft: '2px'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Main Circular FAB Button */}
              <button
                type="button"
                onClick={handleOpenAiAgentPage}
                title="Open AI Shipping Agent"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: pulse ? 'fabPulseRing 2s ease-out infinite' : 'none',
                  boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <img src={SK_LOGO} alt="SecureKaro" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                {hasNewMsg && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    border: '2.5px solid #fff'
                  }} />
                )}
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  const panelStyle = isFullscreen ? {
    position: 'fixed', inset: 0, width: '100vw', height: '100vh',
    borderRadius: 0, zIndex: 10000, display: 'flex', flexDirection: 'column',
    background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif',
    animation: 'widgetFSIn 0.25s cubic-bezier(0.22,1,0.36,1)'
  } : {
    position: 'fixed', bottom: '24px', right: '24px',
    width: '400px', height: showBulk ? 'auto' : '600px', maxHeight: '88vh',
    zIndex: 9999, display: 'flex', flexDirection: 'column',
    background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '22px',
    boxShadow: '0 24px 50px -12px rgba(99,102,241,0.18), 0 8px 24px -4px rgba(0,0,0,0.07)',
    animation: 'widgetSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif'
  };

  return (
    <>
      <style>{`
        @keyframes bubbleFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tooltipBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes widgetSlideIn{from{opacity:0;transform:translateY(24px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes widgetFSIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        @keyframes micPulseAnim{0%,100%{box-shadow:0 0 0 0 rgba(225,29,72,0.45)}50%{box-shadow:0 0 0 7px rgba(225,29,72,0)}}
        @keyframes soundBarAnim{0%{transform:scaleY(0.3)}100%{transform:scaleY(1.4)}}
        .agent-input:focus{outline:none!important}
        .agent-wrap:focus-within{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important}
        .aw-iconbtn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;flex-shrink:0;transition:all 0.15s ease;color:#fff}
        .aw-iconbtn:hover{background:rgba(255,255,255,0.32)!important}
        .aw-qr:hover{background:#eef2ff!important;transform:translateY(-1px)}
        .aw-send:hover:not(:disabled){transform:scale(1.05)}
      `}</style>

      {isFullscreen && <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,23,42,0.35)', backdropFilter:'blur(4px)' }} />}

      <div style={panelStyle}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* SecureKaro Logo Avatar */}
            <div style={{
              width: isFullscreen ? '44px' : '38px',
              height: isFullscreen ? '44px' : '38px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.5)',
              overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <img src={SK_LOGO} alt="SecureKaro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '14px' }}>
                SecureKaro Agent
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}/>
                <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '600' }}>Online · AI Powered</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setShowBulk(b => !b)}
              title="Bulk Excel Upload"
              className="aw-iconbtn"
              style={{ background: showBulk ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)' }}
            >
              <FileSpreadsheet size={15} />
            </button>

            {/* Voice Readout Toggle */}
            <button type="button" className="aw-iconbtn" onClick={toggleVoiceEnabled}
              title={voiceEnabled ? 'Voice Readout: ON — click to mute' : 'Voice Readout: OFF — click to enable'}
              style={{ background: voiceEnabled ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.18)', border: voiceEnabled ? '1px solid rgba(74,222,128,0.5)' : 'none' }}>
              {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Stop Speaking — only shown when TTS is active */}
            {isSpeaking && (
              <button type="button" className="aw-iconbtn" onClick={stopSpeaking} title="Stop Speaking"
                style={{ background: 'rgba(239,68,68,0.2)' }}>
                <VolumeX size={15} />
              </button>
            )}

            {/* Reset */}
            <button type="button" className="aw-iconbtn" onClick={handleReset} title="New Conversation"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <RefreshCw size={14} />
            </button>

            {/* Fullscreen Toggle */}
            <button type="button" className="aw-iconbtn" onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Mode'}
              style={{ background: isFullscreen ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.18)' }}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close */}
            <button type="button" className="aw-iconbtn" onClick={() => { setIsOpen(false); setIsFullscreen(false); }} title="Close"
              style={{ background: 'rgba(239,68,68,0.2)' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Bulk Panel */}
        {showBulk ? (
          <div style={{ padding: '12px', overflowY: 'auto', flex: 1, background: '#f8faff' }}>
            <BulkUploadPanel
              onClose={() => setShowBulk(false)}
              onUpload={() => { setShowBulk(false); }}
            />
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px 8px',
              display: 'flex',
              flexDirection: 'column',
              background: '#f8faff'
            }}>
              {messages.length === 0 && !isLoading && (
                <div style={{ textAlign: 'center', marginTop: isFullscreen ? '80px' : '40px', color: '#64748b' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #c7d2fe',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
                    margin: '0 auto 16px'
                  }}>
                    <img src={SK_LOGO} alt="SecureKaro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <p style={{ fontWeight: '800', color: '#1e293b', margin: '0 0 6px', fontSize: '16px' }}>Hi! I'm your AI Shipping Assistant</p>
                  <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '260px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                    Book shipments, compare carriers, and track orders — just by chatting!
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { icon: <Package size={12} />, label: 'Book Shipment' },
                      { icon: <Zap size={12} />, label: 'Compare Carriers' },
                      { icon: <MessageSquare size={12} />, label: 'Bulk Upload' }
                    ].map(c => (
                      <span key={c.label} style={{
                        background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '20px', color: '#4f46e5',
                        padding: '5px 11px', fontSize: '11px', fontWeight: '700',
                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                      }}>{c.icon}{c.label}</span>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx}>
                  <AgentChatBubble
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />

                  {msg.role === 'agent' && msg.showCarriers && msg.carrierQuotes?.length > 0 && (
                    <div style={{ marginLeft: '40px', marginBottom: '8px' }}>
                      <CarrierComparisonCard
                        quotes={msg.carrierQuotes}
                        selectedSlug={selectedCarrier?.slug}
                        onSelect={handleCarrierSelect}
                      />
                    </div>
                  )}

                  {msg.shipmentId && (
                    <div style={{
                      marginLeft: '40px', marginBottom: '8px',
                      background: '#ecfdf5',
                      border: '1.5px solid #a7f3d0',
                      borderRadius: '14px', padding: '12px'
                    }}>
                      <p style={{ color: '#065f46', fontWeight: '800', margin: '0 0 4px', fontSize: '13px' }}>
                        Shipment Created!
                      </p>
                      <p style={{ color: '#334155', margin: 0, fontSize: '12px' }}>
                        ID: <strong style={{ color: '#0f172a' }}>{msg.shipmentId}</strong>
                      </p>
                      <p style={{ color: '#059669', margin: '4px 0 0', fontSize: '11px', fontWeight: '600' }}>
                        Payment link dispatched via WhatsApp & SMS
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.2)',
                    border: '1.5px solid #e0e7ff', background: '#ffffff'
                  }}>
                    <img src={SK_LOGO} alt="SecureKaro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    background: '#ffffff', borderRadius: '4px 16px 16px 16px',
                    padding: '10px 16px', border: '1.5px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1',
                          animation: `bubbleFadeIn 0.8s ease-in-out ${i * 0.2}s infinite alternate`
                        }}/>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {currentQuickReplies.length > 0 && !isLoading && (
              <div style={{
                display: 'flex', gap: '6px', padding: '6px 14px 8px', flexWrap: 'wrap',
                background: '#f8faff', borderTop: '1px solid #e2e8f0'
              }}>
                {currentQuickReplies.map(qr => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => handleQuickReply(qr)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #c7d2fe',
                      borderRadius: '16px',
                      color: '#4f46e5',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: '700'
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* ── Voice listening banner ── */}
            {isListening && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff1f2', borderTop:'1.5px solid #fecdd3', padding:'8px 14px', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#e11d48', animation:'micPulseAnim 1.2s infinite' }} />
                  <span style={{ color:'#be123c', fontSize:'12px', fontWeight:'700' }}>Listening... Speak now</span>
                  <div style={{ display:'flex', gap:'2px', alignItems:'center' }}>
                    {[0.4,0.8,1.2,0.6,0.9].map((d,i) => <div key={i} style={{ width:'3px', height:'13px', borderRadius:'2px', background:'#e11d48', animation:'soundBarAnim 0.8s ease-in-out '+(d*0.2)+'s infinite alternate' }} />)}
                  </div>
                </div>
                <button type="button" onClick={stopListening} style={{ background:'#fee2e2', border:'none', borderRadius:'8px', color:'#be123c', fontSize:'11px', fontWeight:'700', padding:'4px 8px', cursor:'pointer' }}>Cancel</button>
              </div>
            )}

            {/* Input Bar */}
            <div style={{
              padding: isFullscreen ? '14px max(5vw, 24px) 18px' : '10px 14px 12px',
              borderTop: '1.5px solid #e2e8f0',
              flexShrink: 0,
              background: '#ffffff'
            }}>
              <div 
                className="agent-wrap"
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '4px 4px 4px 12px',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              >
                <input
                  ref={inputRef}
                  className="agent-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isLoading ? "Agent thinking..." : isListening ? "Listening... speak now" : "Type or speak your message..."}
                  disabled={isLoading}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#1e293b', fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                {/* Mic Button */}
                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={() => isListening ? stopListening() : startListening()}
                    title={isListening ? 'Stop voice input' : 'Voice input'}
                    style={{
                      width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                      background: isListening ? '#fee2e2' : '#eef2ff',
                      border: `1.5px solid ${isListening ? '#fca5a5' : '#c7d2fe'}`,
                      color: isListening ? '#e11d48' : '#4f46e5',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.18s',
                      animation: isListening ? 'micPulse 1.5s infinite' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                      : '#e2e8f0',
                    border: 'none', 
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: input.trim() && !isLoading ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Bulk upload shortcut */}
              <button
                type="button"
                onClick={() => setShowBulk(true)}
                style={{
                  width: '100%', marginTop: '6px', background: 'transparent',
                  border: 'none', color: '#6366f1', fontSize: '11px',
                  cursor: 'pointer', padding: '2px', fontWeight: '600'
                }}
              >
                📋 Upload Excel for bulk shipments
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AgentWidget;
