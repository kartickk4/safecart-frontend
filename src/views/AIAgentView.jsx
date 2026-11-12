import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, Bot, Send, RotateCcw, Upload, X, Zap, Package, Truck, Printer, 
  CheckCircle2, Sparkles, FileSpreadsheet, Shield, ArrowRight,
  AlertCircle, RefreshCw, Mic, MicOff, Volume2, VolumeX, Radio,
  Copy, Check, ExternalLink, ArrowUpRight, Clock, HelpCircle, ChevronRight,
  Phone, PhoneCall, MessageCircle, Settings, Sliders, ChevronDown, Play,
  Lock, ArrowLeft
} from "lucide-react";
import BulkUploadPanel from "../components/BulkUploadPanel";
import CarrierLogo from "../components/CarrierLogo";
import { useVoiceAgent } from "../utils/useVoiceAgent";

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('securekaro.in') || host.includes('onrender.com')) {
      return 'https://safecart-backend-1.onrender.com';
    }
  }
  const rawApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
  return rawApi.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
};
const API_BASE = getApiBase();
const SESSION_KEY = "sk_agent_session";
const CHAT_CACHE_KEY = "sk_agent_messages_cache";
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

const formatCleanCarrierName = (q) => {
  const raw = q?.name || q?.rawName || q?.courierPartner || '';
  let clean = String(raw)
    .replace(/\s*\(via\s+nimbus(?:post)?\)/gi, '')
    .replace(/_stressed/gi, '')
    .replace(/\bDS\b/g, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:k\.?g\.?|kg|gms?|g)\b/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!clean) {
    const slugFallback = String(q?.baseSlug || q?.slug || '').replace(/^(nimbus_|direct_|shiprocket_)/, '').replace(/_/g, ' ').trim();
    clean = slugFallback ? slugFallback.replace(/\b\w/g, c => c.toUpperCase()) : 'Express Courier';
  }
  if (/^ekart$/i.test(clean)) return 'Ekart Logistics';
  if (/^amazon/i.test(clean) && !/shipping/i.test(clean)) return clean.replace(/^amazon/i, 'Amazon');
  return clean;
};

const formatCarrierPrice = (price) => {
  const num = Number(price || 0);
  if (Number.isInteger(num)) return num.toLocaleString("en-IN");
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatCarrierEta = (eta) => {
  if (!eta) return "2–4 Days";
  return String(eta).replace(/^Delivery by\s+/i, "Est. ");
};

const CarrierCard = ({ quotes, selectedSlug, onSelect }) => {
  if (!quotes?.length) return null;
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden mt-3 shadow-xs">
      <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 truncate">
            Select Courier Partner
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            ({quotes.length})
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live Rates
        </span>
      </div>

      <div className="p-2.5 flex flex-col gap-2">
        {quotes.map((q, i) => {
          const isSelected = selectedSlug === q.slug;
          const displayName = formatCleanCarrierName(q);
          const isDirect = Boolean(
            q.isDirectShadowfax ||
            q.isDirectDelhivery ||
            q.aggregator === "shadowfax_direct" ||
            q.aggregator === "delhivery_direct"
          );
          const isNimbus = q.aggregator === "nimbuspost" || String(q.slug || "").startsWith("nimbus_");
          const sourceLabel = isDirect ? "Direct" : (isNimbus ? "NimbusPost" : (q.mode || ""));

          return (
            <button
              key={q.slug || i}
              type="button"
              onClick={() => onSelect(q)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-blue-50/60 border-[#1E56E3] ring-1 ring-[#1E56E3]/25 shadow-2xs"
                  : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CarrierLogo slug={q.baseSlug || q.slug} name={displayName} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-slate-900 truncate leading-snug">
                    {displayName}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                      <Clock size={11} className="text-slate-400 shrink-0" />
                      <span>{formatCarrierEta(q.eta)}</span>
                    </span>
                    {sourceLabel && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        isDirect
                          ? "bg-blue-50 text-[#1E56E3] border-blue-200/80"
                          : "bg-slate-100 text-slate-600 border-slate-200/80"
                      }`}>
                        {sourceLabel}
                      </span>
                    )}
                    {q.isLowest && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200/80">
                        Lowest Rate
                      </span>
                    )}
                    {!q.isLowest && q.isCostToDeliverWinner && (
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-200/80">
                        Best Value
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-slate-900 tabular-nums">
                    ₹{formatCarrierPrice(q.price)}
                  </div>
                  {q.isDirectShadowfax && q.isCod && (
                    <div className="text-[10px] font-semibold text-emerald-600">₹0 COD Fee</div>
                  )}
                </div>
                <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? "bg-[#1E56E3] text-white" : "border-2 border-slate-300 bg-white"
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

  const handleCopyText = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
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

      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col gap-1.5 ${isAgent ? "items-start" : "items-end"}`}>
        {/* Render Attached Image Preview */}
        {msg.imagePreview && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs max-w-[240px] bg-white p-1">
            <img src={msg.imagePreview} alt="Order attachment" className="w-full max-h-48 object-cover rounded-xl" />
          </div>
        )}

        <div className="relative group">
          <div
            className={`p-4 text-[13.5px] leading-relaxed transition-all shadow-xs ${
              isAgent
                ? isError
                  ? "bg-rose-50/90 border border-rose-200/80 text-rose-900 rounded-2xl rounded-tl-xs"
                  : "bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-tl-xs shadow-slate-100"
                : "bg-gradient-to-r from-[#1E56E3] to-[#4338CA] text-white font-medium rounded-2xl rounded-tr-xs shadow-indigo-500/20"
            }`}
            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
          />

          {isAgent && !isError && (
            <button
              type="button"
              onClick={() => handleCopyText(msg.content)}
              title="Copy message"
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 p-1 rounded-lg shadow-xs cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
          )}
        </div>

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
                    onClick={() => handleCopyText(msg.shipmentId)}
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                    title="Copy Tracking ID"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Courier pickup auto-scheduled • Verification active.
                </div>

                {/* ── INLINE 4x6 SHIPPING LABEL & 1-CLICK ACTIONS ── */}
                <div className="mt-3 pt-2.5 border-t border-emerald-200/70 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://securekaro.in/api/v1/shipments/${msg.shipmentId}/label`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print 4x6 Label</span>
                  </a>
                  <a
                    href={`https://securekaro.in/api/v1/shipments/${msg.shipmentId}/label?format=pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-2.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    title="Download 4x6 PDF"
                  >
                    <span>PDF</span>
                    <ArrowUpRight size={12} />
                  </a>
                  <a
                    href={`https://securekaro.in/track?id=${msg.shipmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-2.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    title="View live journey"
                  >
                    <Truck size={12} />
                    <span>Track</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Support Helpline Escalation Card */}
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 transition cursor-pointer"
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
  0: ["Book Shipment", "Track Order", "My Wallet", "Weight Shield", "NDR Alerts", "RTO Rules"],
  1: ["Cancel Booking", "Delivery Protection", "Replacement Guide"],
  7: ["Prepaid Order", "Cash on Delivery (COD)"],
  8: ["Yes, Enable RTO Protection", "No, Skip RTO"],
  9: ["Yes, Allow Returns", "No, Final Sale"],
  10: ["Confirm Courier", "Change Courier"],
  11: ["Confirm & Book", "Change Courier", "Switch to COD", "Enable RTO", "Enable Return", "Edit Details"],
  12: ["Book Another Shipment", "Track Recent Order", "Check Wallet"]
};

const QUICK_REPLY_KEYWORDS = {
  'Book Shipment':              'Book a new shipment',
  '📦 Book Shipment':           'Book a new shipment',
  'Track Order':                'Track my recent order',
  '🚚 Track Order':             'Track my recent order',
  'My Wallet':                  'What is my wallet balance?',
  '💰 My Wallet':               'What is my wallet balance?',
  'Weight Shield':              'How does Weight Shield work?',
  'NDR Alerts':                 'Show active NDR shipments',
  'RTO Rules':                  'Explain RTO protection rules',
  '🛡️ RTO Rules':               'Explain RTO protection rules',
  '🔄 Replacement Guide':       'How does replacement work?',
  'Replacement Guide':          'How does replacement work?',
  'Delivery Protection':        'How does delivery protection work?',
  '✨ Defect Discount':          'How does defect partial discount work?',
  'Cancel Booking':             'cancel',
  'Check Wallet':               'What is my wallet balance?',
  'Track Recent Order':         'Track my recent order',
  'Prepaid Order':              '1',
  'Cash on Delivery (COD)':      '2',
  'Yes, Enable RTO Protection':  'yes',
  'No, Skip RTO':               'no',
  'Yes, Allow Returns':         'yes',
  'No, Final Sale':             'no',
  'Confirm Courier':            'confirm',
  'Confirm & Book':             'confirm',
  'Change Courier':             'change courier',
  'Switch to COD':              'switch to cod',
  'Switch to Prepaid':          'switch to prepaid',
  'Enable RTO':                 'enable rto',
  'Disable RTO':                'disable rto',
  'Toggle RTO':                 'toggle rto',
  'Enable Return':              'enable return',
  'Disable Return':             'disable return',
  'Toggle Return':              'toggle return',
  'Edit Details':               'edit',
  'Edit Payment':               'edit mode',
  'Edit Dimensions':            'edit dims',
  'Edit Name':                  'edit name',
  'Edit Phone':                 'edit phone',
  'Edit Address':               'edit address',
  'Edit Pincode':               'edit pincode',
  'Edit Amount':                'edit amount',
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
  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CHAT_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => { try { localStorage.removeItem(SESSION_KEY); return sessionStorage.getItem(SESSION_KEY) || ""; } catch (_) { return ""; } });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [step, setStep] = useState(0);
  const [collectedData, setCollectedData] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showMicHelp, setShowMicHelp] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const selectedImageRef = useRef(null);

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  // Client-side image resize and compression (max 1200px, 85% quality JPEG)
  const processImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg',
          previewUrl: compressedDataUrl,
          name: file.name || 'Order_Screenshot.jpg'
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard Paste Support (Ctrl+V / Cmd+V for WhatsApp Web & Screenshot clips)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

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
    micError,
    clearMicError,
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
    if (messages && messages.length > 0) {
      try {
        sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages));
      } catch (_) {}
    }
  }, [messages]);

  useEffect(() => { 
    if (!initialized) { 
      setInitialized(true); 
      // Only send initial greeting if there are no existing restored messages
      const hasCached = messages && messages.length > 0;
      if (!hasCached) {
        sendMessage("", true); 
      }
    } 
  }, [initialized, messages]);

  const getToken = () => localStorage.getItem("securekaro_token") || localStorage.getItem("skToken") || localStorage.getItem("token") || "";

  const sendMessage = useCallback(async (userText = "", isInit = false) => {
    if (!userText.trim() && !isInit && !selectedImageRef.current) return;
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

    const activeImage = selectedImageRef.current;
    if (activeImage) {
      setSelectedImage(null);
    }

    if (userText.trim() || activeImage) {
      setMessages(prev => [
        ...prev, 
        { 
          role: "user", 
          content: userText.trim() || "📸 Scanned Order Screenshot", 
          imagePreview: activeImage?.previewUrl,
          timestamp: new Date() 
        }
      ]);
    }
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userText.trim(), sessionId: sessionId || undefined, imageBase64: activeImage?.base64, imageMimeType: activeImage?.mimeType })
      });

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const d = await res.json();
          if (d.error) errMsg = d.error;
        } catch (e2) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.sessionId) { 
        setSessionId(data.sessionId); 
        try { sessionStorage.setItem(SESSION_KEY, data.sessionId); } catch (_) {} 
      }
      setStep(data.step || 0);
      if (data.collectedData) {
        setCollectedData(data.collectedData);
      }
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
        try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (_) {}
        setSessionId("");
      }
      const isNetworkErr = err?.message?.includes("Failed to fetch") || err?.name === "TypeError";
      const errMsg = isNetworkErr
        ? "Cannot connect to the SecureKaro backend server. Please verify your connection or try again."
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
  }, [sessionId, isLoading, speak]);

  const handleCarrierSelect = (c) => { 
    setSelectedCarrier(c); 
    sendMessage(c.name); 
  };

  const handleReset = () => {
    setMessages([]); 
    setSessionId(""); 
    setSelectedCarrier(null); 
    setCollectedData(null);
    setStep(0);
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (_) {} 
    try { sessionStorage.removeItem(CHAT_CACHE_KEY); } catch(_) {}
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
        if (d.sessionId) { setSessionId(d.sessionId); try { sessionStorage.setItem(SESSION_KEY, d.sessionId); } catch (_) {} }
        setStep(d.step || 0);
        if (d.collectedData) setCollectedData(d.collectedData);
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
  }, [sessionId, isLoading, speak]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const currentQR = step === 11
    ? [
        "Confirm & Book",
        "Change Courier",
        collectedData?.paymentMode === "cod" ? "Switch to Prepaid" : "Switch to COD",
        ...(collectedData?.paymentMode !== "cod"
          ? [collectedData?.rtoProtectionEnabled ? "Disable RTO" : "Enable RTO"]
          : []),
        collectedData?.returnAllowed ? "Disable Return" : "Enable Return",
        "Edit Details"
      ]
    : (QUICK_REPLIES[step] || []);

  return (
    <div className="flex h-full min-h-0 bg-slate-50 font-sans overflow-hidden select-none">
      
      {/* ── LEFT DESKTOP SIDEBAR ── */}
      <aside className="w-80 shrink-0 border-r border-slate-200/80 bg-white flex flex-col overflow-hidden hidden lg:flex shadow-2xs">
        
        {/* Header Banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-br from-[#1E56E3] via-indigo-600 to-indigo-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md shadow-indigo-950/30 ring-2 ring-white/50 shrink-0 overflow-hidden">
              <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                SecureKaro AI
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded-full border border-white/20">
                  v2.5
                </span>
              </div>
              <div className="text-xs text-indigo-100/90 font-medium">
                Logistics Dispatch Copilot
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-white/95">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neural Engine Live (1.2s)</span>
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
                <div className="text-base font-black text-indigo-600">{step}/12</div>
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
                desc="Conversational prompt or WhatsApp text to create courier parcels"
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
        
        {/* ── REDESIGNED UPPER HEADER & BUTTONS ── */}
        <header className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20 shadow-xs">
          
          {/* Left Title & Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                title="Back to Previous View"
              >
                <ArrowLeft size={15} />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#1E56E3] to-indigo-700 p-0.5 shadow-sm shadow-indigo-500/20 overflow-hidden shrink-0 flex items-center justify-center">
              <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                <span className="truncate">SecureKaro Copilot</span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">1.2s Fast Neural Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Polished Action Button Group */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Voice Response Toggle Pill */}
            <button
              type="button"
              onClick={toggleVoiceEnabled}
              title={voiceEnabled ? "Voice Speech: Active (Click to mute)" : "Voice Speech: Inactive (Click to hear voice aloud)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border ${
                voiceEnabled
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-400/30 active:scale-95"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/90 active:scale-95"
              }`}
            >
              {voiceEnabled ? (
                <>
                  <Volume2 size={13} className="animate-pulse" />
                  <span className="hidden sm:inline">Voice: ON</span>
                </>
              ) : (
                <>
                  <VolumeX size={13} className="text-slate-400" />
                  <span className="hidden sm:inline">Voice: OFF</span>
                </>
              )}
            </button>

            {/* Speaking Stop Pill (Only when speaking) */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                title="Stop current speech playback"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-500/30 cursor-pointer transition animate-pulse active:scale-95"
              >
                <Radio size={12} />
                <span>Stop</span>
              </button>
            )}

            {/* Voice Audio Settings Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                title="Voice & Audio Settings (Gemini / ChatGPT Voice)"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  showVoiceSettings
                    ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                    : "border-slate-200/90 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs active:scale-95"
                }`}
              >
                <Sliders size={14} />
              </button>

              {/* Voice Settings Dropdown */}
              {showVoiceSettings && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 z-30 animate-fade-in text-left">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo-600" />
                      Voice Assistant Engine
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVoiceSettings(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2.5 leading-snug">
                    Natural Neural voice tuned for warm conversational cadence like ChatGPT & Gemini.
                  </p>

                  <div className="space-y-1.5 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        changeVoice("");
                        testVoice("");
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl border text-left text-xs font-bold transition hover:bg-indigo-50/50 border-slate-200"
                    >
                      <div>
                        <div className="text-slate-800">Auto Neural (Recommended)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Gemini/ChatGPT style warmth</div>
                      </div>
                      <Play size={12} className="text-indigo-600 shrink-0" />
                    </button>

                    {availableVoices.slice(0, 5).map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => {
                          changeVoice(v.name);
                          testVoice(v.name);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                          selectedVoiceName === v.name
                            ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900"
                            : "hover:bg-slate-50 border-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate font-medium">{v.name}</div>
                          <div className="text-[10px] text-slate-400">{v.lang}</div>
                        </div>
                        <Play size={11} className="text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => testVoice(selectedVoiceName)}
                    className="w-full py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} fill="white" />
                    <span>Test Voice Speech</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              title="Start fresh conversation"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200/90 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </header>

        {/* ── MESSAGES CHAT STREAM ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 bg-gradient-to-b from-slate-50/50 via-white to-indigo-50/20">
          
          {/* Empty State Hero Prompt Starter */}
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1E56E3] to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 mb-4 ring-4 ring-indigo-50">
                <Sparkles size={28} className="animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                SecureKaro Shipping Copilot
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                Paste customer WhatsApp chats, scan an address chit, speak via microphone, or ask shipping & delivery rules.
              </p>

              {/* Starter Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left">
                {[
                  {
                    title: "1-Click WhatsApp Order",
                    desc: "Paste customer WhatsApp address & details",
                    icon: Package,
                    action: () => sendMessage("Rajesh Kumar, 9876543210, House 42 Green Park Extension, New Delhi 110016, 1 Denim Jacket, COD Rs 1800, 900g")
                  },
                  {
                    title: "Scan Address / Chit",
                    desc: "Upload photo or screenshot with Gemini Vision",
                    icon: Camera,
                    action: () => fileInputRef.current?.click()
                  },
                  {
                    title: "Track Package",
                    desc: "Live milestones & delivery telemetry",
                    icon: Truck,
                    action: () => sendMessage("Track my recent order")
                  },
                  {
                    title: "Wallet & Remittances",
                    desc: "Check available balance & COD on hold",
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
                    title: "RTO Protection",
                    desc: "₹140 seller relief credit & anti-rejection rules",
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

        {/* ── CONTEXTUAL ACTION STRIP (Single crisp rail, never double-stacked) ── */}
        {currentQR.length > 0 && !isLoading && (
          <div className="px-3.5 sm:px-6 py-2 bg-slate-50/95 border-t border-slate-200/75 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 animate-dock-reveal">
            <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0 uppercase tracking-wider font-mono">
              {step === 11 ? 'Actions' : 'Quick'}
            </span>
            {currentQR.map(qr => {
              const isPrimary = qr === "Confirm & Book" || qr === "Confirm Courier" || qr === "Book Shipment";
              const isActiveToggle = qr === "Disable RTO" || qr === "Disable Return";
              return (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-150 press-spring cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                    isPrimary
                      ? "bg-[#1E56E3] hover:bg-[#1646C2] text-white border border-[#1E56E3] shadow-xs"
                      : isActiveToggle
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  {isActiveToggle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  {qr}
                </button>
              );
            })}
          </div>
        )}

        {/* ── PRO COMPOSER DOCK ── */}
        <footer className="px-3 sm:px-6 pt-2.5 pb-24 md:pb-5 border-t border-slate-200/80 bg-white shrink-0">

          {/* Active Voice Waveform Indicator */}
          {isListening && (
            <div className="max-w-4xl mx-auto mb-2.5 flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-rose-50/90 border border-rose-200 rounded-2xl animate-dock-reveal">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <span className="absolute inset-0 rounded-full bg-rose-500 mic-ripple" />
                  <Mic size={13} className="relative z-10" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-rose-950 flex items-center gap-2">
                    <span>Listening</span>
                    <div className="flex items-center gap-0.5 h-4">
                      {[1, 2, 3, 4, 5, 6, 7].map((barIdx) => {
                        const dynamicHeight = Math.max(4, Math.min(18, Math.round((audioLevel / 100) * 18 * (0.45 + (barIdx % 3) * 0.28))));
                        return (
                          <span
                            key={barIdx}
                            className="w-[3px] bg-rose-500 rounded-full transition-all duration-75"
                            style={{ height: `${dynamicHeight}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {liveTranscript && (
                    <div className="text-[11px] text-rose-700 font-medium truncate max-w-[200px] sm:max-w-sm">
                      "{liveTranscript}"
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition press-spring cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (input.trim()) sendMessage(input);
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 transition press-spring cursor-pointer shadow-xs"
                >
                  Send Voice
                </button>
              </div>
            </div>
          )}

          {/* Selected Screenshot / Photo OCR Preview */}
          {selectedImage && (
            <div className="max-w-4xl mx-auto mb-2.5 flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-2xl animate-dock-reveal">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-white">
                <img src={selectedImage.previewUrl} alt="Order preview" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 h-1 bg-blue-500/80 shadow-[0_0_8px_rgba(30,86,227,0.8)] scan-sweep-line pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  <span className="truncate">Order Photo Attached</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Press Send to extract address & ask only missing fields
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition press-spring cursor-pointer"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Hidden file input for camera / image selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processImageFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          {/* Tactile 2-Tier Composer Shell (Full-width typing + Precision Utility Rail) */}
          <div className="max-w-4xl mx-auto rounded-2xl bg-slate-50/70 focus-within:bg-white border border-slate-200/95 focus-within:border-slate-400 focus-within:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] transition-all duration-200">
            <div className="px-3.5 pt-2.5 pb-1">
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
                    ? "Thinking..."
                    : isListening
                      ? "Listening — speak recipient details..."
                      : "Paste WhatsApp order, address, or ask a question..."
                }
                disabled={isLoading}
                className="w-full bg-transparent border-none text-[13px] sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1 font-medium"
              />
            </div>

            <div className="px-2.5 pb-2 pt-1 flex items-center justify-between gap-2">
              {/* Left Utility Cluster: Mic, Scan Camera, Excel Sheet */}
              <div className="flex items-center gap-1.5">
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleMicClick}
                  title={isListening ? "Stop voice listening" : "Speak order details"}
                  className={`group relative h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 press-spring cursor-pointer ${
                    isListening
                      ? "bg-rose-600 text-white border border-rose-600 shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90"
                  }`}
                >
                  {isListening && (
                    <span className="absolute inset-0 rounded-xl bg-rose-500/40 mic-ripple pointer-events-none" />
                  )}
                  <span className={`relative z-10 flex items-center justify-center transition-transform duration-200 ${!isListening ? "group-hover:scale-110" : ""}`}>
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </span>
                  <span className="relative z-10 hidden sm:inline">
                    {isListening ? "Stop" : "Voice"}
                  </span>
                </button>

                {/* Camera / Scan Screenshot Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Scan order photo or WhatsApp screenshot (Ctrl+V)"
                  className={`group relative h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 press-spring cursor-pointer ${
                    selectedImage
                      ? "bg-slate-900 text-white border border-slate-900 shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90"
                  }`}
                >
                  <span className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
                    <Camera size={15} />
                    {selectedImage && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                  </span>
                  <span className="hidden sm:inline">Scan</span>
                </button>

                {/* Bulk Excel Sheet Button */}
                <button
                  type="button"
                  onClick={() => setShowBulk(true)}
                  title="Bulk Excel / CSV Upload"
                  className="group h-9 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/90 hover:border-emerald-200 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 press-spring cursor-pointer"
                >
                  <span className="transition-transform duration-200 group-hover:-translate-y-0.5">
                    <FileSpreadsheet size={15} />
                  </span>
                  <span className="hidden sm:inline">Sheet</span>
                </button>
              </div>

              {/* Right Side: Subtle Shortcut + Morphing Send Button */}
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/70">
                  Enter ↵
                </span>

                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  aria-label="Send message"
                  className={`group h-9 min-w-[40px] px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isLoading
                      ? "bg-[#1E56E3] text-white cursor-wait opacity-90"
                      : (input.trim() || selectedImage)
                        ? "bg-[#1E56E3] hover:bg-[#1646C2] text-white shadow-[0_4px_12px_-2px_rgba(30,86,227,0.4)] hover:shadow-[0_6px_16px_-2px_rgba(30,86,227,0.5)] press-spring cursor-pointer"
                        : "bg-slate-200/80 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="hidden sm:inline">Sending</span>
                    </>
                  ) : (
                    <>
                      <Send
                        size={14}
                        className={`transition-transform duration-200 ${
                          (input.trim() || selectedImage)
                            ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ultra-clean Quick Prompt Hints */}
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 mt-2 text-[10px] sm:text-[11px] text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={() => sendMessage("Rajesh Kumar, 9876543210, House 42 Green Park Extension, New Delhi 110016, 1 Denim Jacket, COD Rs 1800, 900g")}
              className="font-semibold text-slate-600 hover:text-[#1E56E3] hover:bg-slate-100 px-2 py-0.5 rounded-md cursor-pointer transition"
            >
              Try 1-Click Sample Order
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => sendMessage("Mera wallet balance kitna hai?")}
              className="hover:text-slate-700 transition cursor-pointer"
            >
              Mera wallet balance?
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => sendMessage("How many pincodes does SecureKaro cover?")}
              className="hover:text-slate-700 transition cursor-pointer"
            >
              Pincode coverage?
            </button>
          </div>
        </footer>
      </main>

      {/* ── MICROPHONE PERMISSION GUIDE MODAL ── */}
      {(micError || showMicHelp) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock size={26} />
            </div>
            
            <h3 className="text-base font-black text-slate-900 mb-1">
              Microphone Permission Needed
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Browsers and phone operating systems strictly require you to grant permission once so you can speak to the AI Assistant.
            </p>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left space-y-2.5 mb-4 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-slate-700">
                  Look at your browser URL bar at the top and tap the <strong>Lock / Settings icon (🔒 / ⚙️)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-slate-700">
                  Find <strong>Microphone</strong> in Permissions and switch it to <strong>"Allow"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-slate-700">
                  Tap <strong>"Try Again"</strong> below to start speaking!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  clearMicError();
                  setShowMicHelp(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMicError();
                  setShowMicHelp(false);
                  startListening();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#1E56E3] to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/25 hover:opacity-95 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK UPLOAD MODAL BACKDROP ── */}
      {showBulk && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBulk(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative border border-slate-200">
            <BulkUploadPanel
              onClose={() => setShowBulk(false)}
              onSuccess={() => {
                setShowBulk(false);
                sendMessage("Check status of my bulk orders");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
