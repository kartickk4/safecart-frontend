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
  0: ["📦 Book Shipment", "🚚 Track Order", "💰 My Wallet", "🔄 Replacement Guide", "🛡️ RTO Rules", "✨ Defect Discount"],
  1: ["Cancel Booking", "How does Delivery Protection work?", "Replacement Guide"],
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Clear any legacy stored agent chat on startup so sessions always start fresh
  useEffect(() => {
    try {
      sessionStorage.removeItem(CHAT_CACHE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [step, setStep] = useState(0);
  const [collectedData, setCollectedData] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
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
    isListening,
    liveTranscript,
    micError,
    clearMicError,
    audioLevel,
    startListening,
    stopListening
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
  }, [initialized]);

  // Restart chat fresh if the user suspended their phone/tab for >15 minutes
  useEffect(() => {
    let lastActive = Date.now();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const awayTimeMs = Date.now() - lastActive;
        if (awayTimeMs > 15 * 60 * 1000) {
          handleReset();
        }
      } else {
        lastActive = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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
  }, [sessionId, isLoading]);

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
      })
      .catch(err => {
        setMessages(prev => [...prev, { role: "agent", content: `Error: ${err.message}`, timestamp: new Date(), isError: true }]);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
  }, [sessionId, isLoading]);

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
                title="Instant Dispatch"
                desc="Wallet-settled Prepaid & COD booking with immediate pickup"
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
        
        {/* ── UPPER HEADER ── */}
        <header className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
          
          {/* Left Identity & Live Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 transition-all press-spring cursor-pointer"
                title="Back to Previous View"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200/90 bg-white p-0.5 shadow-2xs shrink-0">
              <img src={SK_LOGO} alt="SecureKaro" className="w-full h-full object-cover rounded-[10px]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">SecureKaro Copilot</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-[#1E56E3] border border-blue-200/70 shrink-0">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {step > 0 && step < 12
                  ? "Booking in progress • Multi-carrier rates"
                  : "29,000+ Pincodes • Instant Booking"}
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              title="Start fresh conversation"
              className="group h-9 px-3 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all press-spring cursor-pointer"
            >
              <RotateCcw size={14} className="transition-transform duration-200 group-hover:-rotate-45" />
              <span className="hidden sm:inline">New Chat</span>
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

        {/* ── QUICK SUGGESTION PILLS ── */}
        {currentQR.length > 0 && !isLoading && (
          <div className="px-4 sm:px-6 py-2 bg-slate-50/90 border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Sparkles size={11} className="text-indigo-500" />
              Suggested:
            </span>
            {currentQR.map(qr => {
              const isActiveToggle = qr === "Disable RTO" || qr === "Disable Return";
              return (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${
                    isActiveToggle
                      ? "bg-emerald-50 hover:bg-emerald-600 border-emerald-300 hover:border-emerald-600 text-emerald-700 hover:text-white"
                      : "bg-white hover:bg-indigo-600 border-slate-300 hover:border-indigo-600 text-slate-700 hover:text-white"
                  }`}
                >
                  {isActiveToggle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  {qr}
                </button>
              );
            })}
          </div>
        )}

        {/* ── BOTTOM COMMAND DOCK (Single-row floating pill + pro button micro-animations) ── */}
        <footer className="p-3 sm:p-5 pb-24 md:pb-6 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0">
          
          {/* Quick Action Capsule Row */}
          <div className="max-w-4xl mx-auto mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { label: '📦 Book Shipment', query: 'Book shipment' },
              { label: '🛡️ Weight Shield', query: 'How does Weight Shield work?' },
              { label: '🚨 NDR Alerts', query: 'Show active NDR shipments' },
              { label: '📊 Shipping Rates', query: 'Cost to deliver' },
              { label: '💰 My Wallet', query: 'What is my wallet balance?' },
              { label: '🔍 Track Order', query: 'Track my recent order' }
            ].map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(qp.query)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Active Voice Waveform Indicator */}
          {isListening && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center justify-between p-3 bg-rose-50/95 border border-rose-200 rounded-2xl animate-dock-reveal shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span>Listening to your voice...</span>
                    <div className="flex items-end gap-1 h-5">
                      {[1, 2, 3, 4, 5, 6, 7].map((barIdx) => {
                        const dynamicHeight = Math.max(6, Math.min(24, Math.round((audioLevel / 100) * 24 * (0.5 + (barIdx % 3) * 0.3))));
                        return (
                          <div
                            key={barIdx}
                            className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                            style={{ height: `${dynamicHeight}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {liveTranscript && (
                    <div className="text-[11px] text-rose-700 font-medium truncate max-w-xs mt-0.5">
                      "{liveTranscript}"
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (input.trim()) sendMessage(input);
                  }}
                  className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Done & Send
                </button>
              </div>
            </div>
          )}

          {/* Selected Screenshot / Photo OCR Preview */}
          {selectedImage && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center gap-3 p-2.5 bg-gradient-to-r from-indigo-50/95 to-blue-50/90 border border-indigo-200/90 rounded-2xl shadow-xs animate-dock-reveal">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-indigo-200 shrink-0 bg-white shadow-xs">
                <img src={selectedImage.previewUrl} alt="Order preview" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 h-1 bg-indigo-500/80 shadow-[0_0_8px_rgba(79,70,229,0.8)] scan-sweep-line pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-600 shrink-0" />
                  <span className="truncate">Order Screenshot Attached</span>
                </div>
                <div className="text-[11px] text-indigo-600/90 truncate">
                  Ready to scan with Gemini Vision • Press Send or type note
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition cursor-pointer"
                title="Remove image"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Elevated Floating Single-Row Command Dock */}
          <div className="relative max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2 bg-slate-50 focus-within:bg-white border border-slate-300/90 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-full p-2 pl-4 sm:pl-5 transition-all duration-200 shadow-sm shadow-slate-200/60">
            
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
                  ? "AI thinking (1.2s)..." 
                  : isListening 
                    ? "Listening to voice..." 
                    : "Paste WhatsApp order, ask in English/Hindi, or track..."
              }
              disabled={isLoading}
              className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1.5 font-medium"
            />

            {/* Tactile Microphone Button with Concentric Ripple Animation */}
            <button
              type="button"
              onClick={handleMicClick}
              title={isListening ? "Stop voice listening" : "Speak to AI Agent (Microphone)"}
              className={`group relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 press-spring cursor-pointer ${
                isListening
                  ? "bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/35 ring-4 ring-rose-200"
                  : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/90 hover:border-indigo-200 shadow-2xs"
              }`}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-rose-500/50 mic-ripple pointer-events-none" />
              )}
              <span className={`relative z-10 transition-transform duration-200 ${!isListening ? "group-hover:scale-110" : ""}`}>
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </span>
            </button>

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

            {/* Scan Order Screenshot / Photo OCR Button with Lens Tilt */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload order photo or chit (Ctrl+V paste supported)"
              className={`group relative w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 press-spring cursor-pointer ${
                selectedImage
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-200"
                  : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-200 shadow-2xs"
              }`}
            >
              <span className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
                <Camera size={17} />
                {selectedImage && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
                )}
              </span>
            </button>

            {/* Bulk Upload Sheet Button with Float Lift */}
            <button
              type="button"
              onClick={() => setShowBulk(true)}
              title="Bulk Excel Upload (100+ Orders)"
              className="group w-10 h-10 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200/90 hover:border-emerald-200 flex items-center justify-center shrink-0 transition-all duration-200 press-spring cursor-pointer shadow-2xs"
            >
              <span className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                <FileSpreadsheet size={17} />
              </span>
            </button>

            {/* Send Button with Launch Glide & Loading Spin */}
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className={`group w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 press-spring ${
                isLoading
                  ? "bg-[#1E56E3] text-white cursor-wait shadow-md shadow-indigo-500/30"
                  : (input.trim() || selectedImage)
                    ? "bg-gradient-to-r from-[#1E56E3] via-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/45 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              {isLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send
                  size={16}
                  className={`transition-transform duration-200 ${
                    (input.trim() || selectedImage)
                      ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105"
                      : ""
                  }`}
                />
              )}
            </button>
          </div>

          {/* Quick Prompts Footnote */}
          <div className="flex items-center justify-center gap-2 mt-2.5 text-[10px] sm:text-[11px] text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-500">Quick:</span>
            <button
              type="button"
              onClick={() => sendMessage("Rajesh Kumar, 9876543210, House 42 Green Park Extension, New Delhi 110016, 1 Denim Jacket, COD Rs 1800, 900g")}
              className="font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 transition"
            >
              ⚡ 1-Click WhatsApp Order
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 transition flex items-center gap-1"
            >
              <Camera size={12} />
              📸 Scan Chit
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => sendMessage("Mera wallet balance kitna hai?")}
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              "Mera balance?"
            </button>
            <span>•</span>
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
