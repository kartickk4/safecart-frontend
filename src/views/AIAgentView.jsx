import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bot, Send, RotateCcw, Upload, X, Zap, Package, Truck, 
  CheckCircle2, Sparkles, FileSpreadsheet, Shield, ArrowRight,
  AlertCircle, RefreshCw, Mic, MicOff, Volume2, VolumeX, Radio,
  Copy, Check, ExternalLink, ArrowUpRight, Clock, HelpCircle, ChevronRight,
  Phone, PhoneCall, MessageCircle, Headphones
} from "lucide-react";
import BulkUploadPanel from "../components/BulkUploadPanel";
import { useVoiceAgent } from "../utils/useVoiceAgent";

const rawApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const API_BASE = rawApi.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
const SESSION_KEY = "sk_agent_session";
const SK_LOGO = "/logo.jpg";

const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatMessage = (text) => {
  if (!text) return "";
  // SECURITY: Escape HTML first to prevent XSS, then apply safe formatting
  const safe = escapeHtml(text);
  let html = safe.replace(/\*([^*]+)\*/g, "<strong class='font-bold text-slate-900'>$1</strong>");
  html = html.replace(/\n/g, "<br/>");
  return html;
};

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-1 px-1">
    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
);

const CarrierCard = ({ quotes, selectedSlug, onSelect }) => {
  if (!quotes?.length) return null;
  return (
    <div className="bg-gradient-to-b from-indigo-50/60 to-white border border-indigo-100/90 rounded-2xl p-4 mt-3 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-100/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Truck size={13} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
            Available Courier Partners
          </span>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
          Shiprocket Engine
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {quotes.map((q, i) => {
          const isSelected = selectedSlug === q.slug;
          return (
            <button
              key={q.slug || i}
              type="button"
              onClick={() => onSelect(q)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                }`}>
                  <Truck size={17} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    {q.name}
                    {q.isLowest && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wide border border-emerald-200">
                        Lowest Rate
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>Est. Delivery: {q.eta || "2-4 Days"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-slate-900">
                    ₹{q.price?.toLocaleString("en-IN") || q.price}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Protection Included</div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? "bg-indigo-600 text-white" : "border-2 border-slate-300"
                }`}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, onCarrierSelect, selectedCarrierSlug, onRetry }) => {
  const isAgent = msg.role === "agent";
  const isError = msg.isError;
  const [copied, setCopied] = useState(false);

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 items-start animate-fade-in ${isAgent ? "flex-row" : "flex-row-reverse"}`}>
      {isAgent && (
        <div className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden shadow-xs border flex items-center justify-center mt-1 ${
          isError ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200/90 ring-2 ring-indigo-50"
        }`}>
          {isError ? (
            <AlertCircle size={16} />
          ) : (
            <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      <div className={`max-w-[82%] sm:max-w-[75%] flex flex-col gap-1.5 ${isAgent ? "items-start" : "items-end"}`}>
        <div
          className={`p-4 text-[13.5px] leading-relaxed transition-all shadow-xs ${
            isAgent
              ? isError
                ? "bg-rose-50/90 border border-rose-200/80 text-rose-900 rounded-2xl rounded-tl-xs"
                : "bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-tl-xs shadow-slate-100"
              : "bg-gradient-to-r from-[#1E56E3] to-[#4F46E5] text-white font-medium rounded-2xl rounded-tr-xs shadow-indigo-500/20"
          }`}
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
        />

        {/* Carrier Quotes Widget */}
        {msg.showCarriers && msg.carrierQuotes?.length > 0 && (
          <div className="w-full max-w-md">
            <CarrierCard 
              quotes={msg.carrierQuotes} 
              selectedSlug={selectedCarrierSlug} 
              onSelect={onCarrierSelect} 
            />
          </div>
        )}

        {/* Shipment Created Celebration Badge */}
        {msg.shipmentId && (
          <div className="w-full max-w-md bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/90 rounded-2xl p-4 mt-2 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Shipment Booked Successfully
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    Delivery Protected
                  </span>
                </div>
                
                <div className="mt-2 flex items-center gap-2 bg-white/90 border border-emerald-200/80 rounded-xl px-3 py-2">
                  <div className="text-xs text-slate-600 font-medium">Tracking ID:</div>
                  <div className="text-xs font-mono font-black text-slate-900 flex-1 truncate">
                    {msg.shipmentId}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAwb(msg.shipmentId)}
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                    title="Copy Tracking ID"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Payment link dispatched to buyer via WhatsApp & SMS.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Support Helpline Escalation Card (Rendered ONLY when escalation triggered as last resort) */}
        {isAgent && msg.showSupport && (
          <div className="w-full max-w-md bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white border border-indigo-200/90 rounded-2xl p-4 mt-2 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Phone size={13} />
                </div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Merchant Support Desk
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live 9am - 9pm
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <PhoneCall size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toll-Free Helpline</div>
                    <div className="text-xs font-black text-slate-900 font-mono">1800-123-SAFE (7233)</div>
                  </div>
                </div>
                <a
                  href="tel:18001237233"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Phone size={12} />
                  <span>Call Now</span>
                </a>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <MessageCircle size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp & Phone Desk</div>
                    <div className="text-xs font-black text-slate-900 font-mono">+91 70442 55626</div>
                  </div>
                </div>
                <a
                  href="https://wa.me/917044255626?text=Hi%20SecureKaro%20Support,%20I%20need%20assistance%20with%20my%20shipment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1 pt-1 font-medium">
                <span>Email: support@securekaro.in</span>
                <span className="text-indigo-600 font-bold">Fast Escalation</span>
              </div>
            </div>
          </div>
        )}

        {/* Retry on Error */}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 transition"
          >
            <RotateCcw size={12} />
            <span>Reset and Try Again</span>
          </button>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] font-semibold text-slate-400 px-1 ${isAgent ? "text-left" : "text-right"}`}>
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
      </div>
    </div>
  );
};

const QUICK_REPLIES = {
  0: ["📦 Book Shipment", "🔍 Track Recent Order", "💰 My Wallet", "🔄 Replacement Guide", "🛡️ RTO Rules", "⚡ Defect Discount", "🎁 My Referral Code"],
  1: ["Cancel Booking", "How does Delivery Protection work?", "Replacement Guide"],
  7: ["Prepaid Order", "Cash on Delivery (COD)"],
  8: ["Yes, Enable RTO Protection", "No, Skip RTO"],
  9: ["Yes, Allow Returns", "No, Final Sale"],
  10: ["Confirm Courier", "Change Courier"],
  11: ["Confirm & Book", "Change Courier", "Edit Address", "Edit Payment", "Toggle RTO", "Edit Dimensions", "Edit Amount", "Toggle Return", "Edit Name", "Edit Phone", "Edit Pincode"],
  12: ["Book Another Shipment", "Track Recent Order", "Check Wallet"]
};

const QUICK_REPLY_KEYWORDS = {
  '📦 Book Shipment':           'Book a new shipment',
  '🔍 Track Recent Order':      'Track my recent order',
  '💰 My Wallet':               'What is my wallet balance?',
  '🔄 Replacement Guide':       'How does replacement work?',
  '🛡️ RTO Rules':               'Explain RTO protection rules',
  '⚡ Defect Discount':          'How does defect partial discount work?',
  '📞 Call Support':            'Call merchant support helpline',
  '🎁 My Referral Code':        'What is my referral code?',
  'Cancel Booking':             'cancel',
  'How does Delivery Protection work?': 'How does delivery protection work?',
  'Check Wallet':               'What is my wallet balance?',
  'Track Recent Order':         'Track my recent order',
  'Prepaid Order':              '1',
  'Prepaid Protection':         '1',
  'Prepaid Escrow':             '1',
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

const CapCard = ({ icon: Icon, title, desc, gradient, iconColor }) => (
  <div className="bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200/90 rounded-2xl p-3 flex gap-3 items-start transition-all duration-200 shadow-2xs hover:shadow-xs group">
    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${gradient} ${iconColor} shadow-2xs transition-transform group-hover:scale-105`}>
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
        {title}
      </div>
      <div className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2 font-normal">
        {desc}
      </div>
    </div>
  </div>
);

export default function AIAgentView({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY) || "");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [step, setStep] = useState(0);
  const [showBulk, setShowBulk] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleVoiceFinal = useCallback((finalText) => {
    if (finalText) {
      setInput(finalText);
    }
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
  } = useVoiceAgent({
    onFinalTranscript: handleVoiceFinal
  });

  useEffect(() => {
    if (isListening && liveTranscript) {
      setInput(liveTranscript);
    }
  }, [isListening, liveTranscript]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  useEffect(() => { 
    if (!initialized) { 
      setInitialized(true); 
      sendMessage("", true); 
    } 
  }, []);

  const getToken = () => localStorage.getItem("securekaro_token") || localStorage.getItem("skToken") || localStorage.getItem("token") || "";

  const sendMessage = useCallback(async (userText = "", isInit = false) => {
    if (!userText.trim() && !isInit) return;
    if (isLoading) return;

    const token = getToken();
    if (!token) {
      setMessages(prev => [
        ...prev, 
        { 
          role: "agent", 
          content: "Please log in to your merchant account to use the AI Agent.", 
          timestamp: new Date(),
          isError: true
        }
      ]);
      return;
    }

    if (userText.trim()) {
      setMessages(prev => [...prev, { role: "user", content: userText.trim(), timestamp: new Date() }]);
    }
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userText.trim(), sessionId: sessionId || undefined })
      });

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const d = await res.json();
          if (d.error) errMsg = d.error;
        } catch (e2) {
          // ignore
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.sessionId) { 
        setSessionId(data.sessionId); 
        localStorage.setItem(SESSION_KEY, data.sessionId); 
      }
      setStep(data.step || 0);
      if (data.selectedCarrier?.slug) {
        setSelectedCarrier(data.selectedCarrier);
      }

      setMessages(prev => [
        ...prev, 
        { 
          role: "agent", 
          content: data.reply || "Ready for next step.", 
          timestamp: new Date(), 
          showCarriers: !!data.carrierQuotes?.length, 
          carrierQuotes: data.carrierQuotes, 
          selectedCarrier: data.selectedCarrier, 
          shipmentId: data.createdShipmentId,
          showSupport: !!data.showSupport
        }
      ]);

      if (data.reply) {
        speak(data.reply);
      }
    } catch (err) {
      if (sessionId) {
        localStorage.removeItem(SESSION_KEY);
        setSessionId("");
      }
      const isNetworkErr = err?.message?.includes("Failed to fetch") || err?.name === "TypeError";
      const errMsg = isNetworkErr
        ? "Cannot connect to the SecureKaro backend server (http://localhost:5001). Please check that your backend server is running (`npm run dev` in safecart-backend)."
        : `Notice: ${err.message || "Something went wrong while connecting to the assistant."}`;
      setMessages(prev => [
        ...prev, 
        { 
          role: "agent", 
          content: errMsg, 
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [sessionId, isLoading]);

  const handleCarrierSelect = (c) => { 
    setSelectedCarrier(c); 
    sendMessage(c.name); 
  };

  const handleReset = () => {
    setMessages([]); 
    setSessionId(""); 
    setSelectedCarrier(null); 
    setStep(0);
    localStorage.removeItem(SESSION_KEY); 
    setInitialized(false);
    setTimeout(() => { 
      setInitialized(true); 
      sendMessage("", true); 
    }, 100);
  };

  const handleQuickReply = useCallback((label) => {
    const keyword = QUICK_REPLY_KEYWORDS[label] || label;
    if (isLoading) return;
    const token = getToken();
    if (!token) return;
    setMessages(prev => [...prev, { role: "user", content: label, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);
    fetch(`${API_BASE}/api/v1/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: keyword, sessionId: sessionId || undefined })
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Agent error");
        if (d.sessionId) { setSessionId(d.sessionId); localStorage.setItem(SESSION_KEY, d.sessionId); }
        setStep(d.step || 0);
        if (d.selectedCarrier?.slug) setSelectedCarrier(d.selectedCarrier);
        setMessages(prev => [...prev, {
          role: "agent", content: d.reply || "Ready for next step.", timestamp: new Date(),
          showCarriers: !!d.carrierQuotes?.length, carrierQuotes: d.carrierQuotes,
          selectedCarrier: d.selectedCarrier, shipmentId: d.createdShipmentId
        }]);
        if (d.reply) speak(d.reply);
      })
      .catch(err => {
        setMessages(prev => [...prev, { role: "agent", content: `Error: ${err.message}`, timestamp: new Date(), isError: true }]);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
  }, [sessionId, isLoading]);

  const currentQR = QUICK_REPLIES[step] || [];

  return (
    <div className="flex h-full min-h-0 bg-slate-50 font-sans overflow-hidden select-none">
      
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-80 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-xl flex flex-col overflow-hidden hidden lg:flex shadow-2xs">
        
        {/* Header Hero Banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-br from-[#1E56E3] via-indigo-600 to-indigo-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md shadow-indigo-950/30 ring-2 ring-white/50 shrink-0 overflow-hidden">
              <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                SecureKaro AI
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.2 rounded-full border border-white/20">
                  v2.4
                </span>
              </div>
              <div className="text-xs text-indigo-100/90 font-medium">
                Autonomous Courier Dispatch
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-white/95">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neural Engine Online</span>
          </div>
        </div>

        {/* Scrollable Capabilities & Metrics */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Quick Upload CTA */}
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/80 text-indigo-900 transition-all duration-150 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet size={16} />
              </div>
              <div className="text-left">
                <div className="text-xs font-black">Bulk Excel Upload</div>
                <div className="text-[10px] text-indigo-600 font-semibold">Upload 100+ Orders</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Session Metrics */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Session Activity</span>
              <span className="text-indigo-600 font-bold">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-base font-black text-slate-900">{messages.length}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Msgs</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-base font-black text-indigo-600">{step}/10</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Step</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-base font-black text-emerald-600">
                  {messages.filter(m => m.shipmentId).length}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Booked</div>
              </div>
            </div>
          </div>

          {/* Capabilities List */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
              Autonomous Features
            </div>
            <div className="space-y-2">
              <CapCard
                icon={Package}
                title="Smart Booking"
                desc="Conversational prompt to create verified courier parcels"
                gradient="bg-indigo-50"
                iconColor="text-indigo-600"
              />
              <CapCard
                icon={Zap}
                title="Payment Dispatch"
                desc="Auto-sends WhatsApp & SMS payment links to buyer"
                gradient="bg-amber-50"
                iconColor="text-amber-600"
              />
              <CapCard
                icon={Truck}
                title="Rate Optimizer"
                desc="Live comparisons across Delhivery, DTDC, Shadowfax"
                gradient="bg-emerald-50"
                iconColor="text-emerald-600"
              />
              <CapCard
                icon={Shield}
                title="Delivery Protection"
                desc="100% buyer inspection & safe seller payout window"
                gradient="bg-purple-50"
                iconColor="text-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <button
            type="button"
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-98"
          >
            <RotateCcw size={14} />
            <span>Reset Conversation</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CHAT VIEW ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Top Navbar */}
        <header className="px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10 shadow-2xs">
          
          {/* Left Title & Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 p-0.5 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
              <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                <span className="truncate">SecureKaro AI Agent</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60 shrink-0">
                  <Sparkles size={11} className="text-indigo-600" />
                  Neural Solver v2.5
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Autonomous Shipping & Dispute Solver</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Voice Readout Toggle */}
            <button
              type="button"
              onClick={toggleVoiceEnabled}
              title={voiceEnabled ? "Voice Readout: Active (Click to mute)" : "Voice Readout: Inactive (Click to hear AI responses)"}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                voiceEnabled
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs"
                  : "bg-slate-100/80 hover:bg-slate-200/70 border-slate-200 text-slate-600"
              }`}
            >
              {voiceEnabled ? <Volume2 size={14} className="text-emerald-600" /> : <VolumeX size={14} />}
              <span className="hidden md:inline">{voiceEnabled ? "Voice Readout: ON" : "Voice Readout"}</span>
            </button>

            {/* Speaking Stop Button */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                title="Stop current speech"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold cursor-pointer transition animate-pulse"
              >
                <Radio size={13} />
                <span className="hidden sm:inline">Stop</span>
              </button>
            )}

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              title="Start fresh conversation"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>

            {/* Exit AI Agent */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer ml-0.5 sm:ml-1"
                title="Return to Dashboard / Orders"
              >
                <ArrowRight size={13} className="rotate-180 text-slate-500" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </header>

        {/* ── MESSAGES CHAT STREAM ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 bg-gradient-to-b from-slate-50/50 via-white to-indigo-50/20">
          
          {/* Empty State Hero Prompt Starter */}
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1E56E3] to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 mb-5 ring-4 ring-indigo-50">
                <Sparkles size={28} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                How can I assist your business today?
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-7">
                I can auto-book shipments, provide live tracking telemetry, check your wallet balance, and solve replacement, defect & RTO disputes.
              </p>

              {/* Starter Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                {[
                  {
                    title: "Book New Parcel",
                    desc: "Step-by-step or paste all details in 1 shot",
                    icon: Package,
                    action: () => sendMessage("Book a new shipment")
                  },
                  {
                    title: "Track Live Order",
                    desc: "Real-time telemetry, AWB & milestones",
                    icon: Truck,
                    action: () => sendMessage("Track my recent order")
                  },
                  {
                    title: "Wallet & Payouts",
                    desc: "Check available balance & active shipments",
                    icon: Zap,
                    action: () => sendMessage("What is my wallet balance?")
                  },
                  {
                    title: "Replacement Guide",
                    desc: "4-step verified return & swap protocol",
                    icon: RotateCcw,
                    action: () => sendMessage("How does replacement work?")
                  },
                  {
                    title: "Defect Discount",
                    desc: "Offer 15%-30% partial refund & save reverse shipping",
                    icon: Sparkles,
                    action: () => sendMessage("How does defect partial discount work?")
                  },
                  {
                    title: "RTO Protection",
                    desc: "₹40 seller relief credit & anti-rejection rules",
                    icon: Shield,
                    action: () => sendMessage("Explain RTO protection rules")
                  }
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={item.action}
                      className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 text-left transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                          <ItemIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render All Messages */}
          {messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              msg={msg} 
              onCarrierSelect={handleCarrierSelect} 
              selectedCarrierSlug={selectedCarrier?.slug}
              onRetry={handleReset}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs">
                <TypingDots />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* ── QUICK REPLIES BAR ── */}
        {currentQR.length > 0 && !isLoading && (
          <div className="px-6 py-2.5 bg-slate-50/90 border-t border-slate-200/70 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-500" />
              Suggested:
            </span>
            {currentQR.map(qr => (
              <button
                key={qr}
                type="button"
                onClick={() => handleQuickReply(qr)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-600 border border-slate-300 hover:border-indigo-600 text-slate-700 hover:text-white text-xs font-bold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* ── BOTTOM INPUT BOX ── */}
        <footer className="p-3 sm:p-5 pb-20 md:pb-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0">
          
          {/* Active Voice Waveform Indicator */}
          {isListening && (
            <div className="flex items-center justify-between p-3 mb-3 bg-rose-50/90 border border-rose-200 rounded-2xl animate-fade-in shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-800">
                  Listening to voice input... speak clearly
                </span>
                <div className="flex items-center gap-1 ml-2">
                  {[12, 20, 8, 24, 16, 10, 18].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-rose-500 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (input.trim()) sendMessage(input);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Done & Send
                </button>
              </div>
            </div>
          )}

          {/* Main Floating Input Enclosure */}
          <div className="relative max-w-4xl mx-auto flex items-center gap-2 bg-slate-50 focus-within:bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/15 rounded-2xl p-1.5 pl-4 transition-all duration-200 shadow-xs">
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={
                isLoading 
                  ? "AI reasoning..." 
                  : isListening 
                    ? "Listening to voice..." 
                    : "Ask AI Agent: book shipment, track order, check wallet..."
              }
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-2"
            />

            {/* Voice Input Microphone */}
            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              title={isListening ? "Stop voice listening" : "Speak your message"}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white shadow-xs animate-pulse"
                  : "bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Bulk Upload Icon Button */}
            <button
              type="button"
              onClick={() => setShowBulk(true)}
              title="Bulk Excel Upload"
              className="w-9 h-9 rounded-xl bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} />
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-[#1E56E3] to-[#4F46E5] text-white shadow-md shadow-indigo-500/25 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <Send size={16} />
            </button>
          </div>

          {/* Quick Prompts Footnote */}
          <div className="flex items-center justify-center gap-2 mt-2 text-[10px] sm:text-[11px] text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-500">Quick:</span>
            <button
              type="button"
              onClick={() => sendMessage("Book a new shipment")}
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "Book shipment"
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => sendMessage("Track my recent order")}
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "Track order"
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => sendMessage("What is my wallet balance?")}
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "My wallet"
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => sendMessage("How does replacement work?")}
              className="hidden sm:inline hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "Replacement guide"
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => sendMessage("Explain RTO protection rules")}
              className="hidden sm:inline hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "RTO rules"
            </button>
          </div>
        </footer>

        {/* ── BULK UPLOAD MODAL ── */}
        {showBulk && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-2xl animate-fade-in">
              <BulkUploadPanel 
                onClose={() => setShowBulk(false)} 
                onUpload={() => setShowBulk(false)} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
