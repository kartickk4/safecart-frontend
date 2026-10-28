import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  QrCode, 
  Send, 
  ShieldCheck, 
  Coins, 
  Zap, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ExternalLink,
  Award,
  Star,
  Truck,
  ArrowUpRight
} from 'lucide-react';
import { profileAPI } from '../services/api';

export default function ReferralView({ user, onUpdateUser, onNavigateToWallet, onNavigateToCreateShipment }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [calculatorCount, setCalculatorCount] = useState(5);
  const [openFaq, setOpenFaq] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.getReferralStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const referralCode = stats?.referralCode || user?.referralCode || 'SK-GROWTH';
  const referralLink = (stats?.referralLink && !stats.referralLink.includes('undefined')) 
    ? stats.referralLink 
    : `${window.location.origin}/signup?ref=${referralCode}`;
  const totalReferred = Number(stats?.totalReferred || 0);
  const earnedReferrals = Number(stats?.earnedReferrals || 0);
  const pendingReferrals = Number(stats?.pendingReferrals || Math.max(0, totalReferred - earnedReferrals));
  const totalEarnedCash = earnedReferrals * 30;
  const currentWalletBalance = Number(stats?.walletBalance ?? user?.walletBalance ?? 0);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const shareText = `Hey! Start shipping with SecureKaro — India's premier 100% fraud-proof logistics escrow platform. Use my referral code "${referralCode}" to get instant escrow protection & zero setup fee: ${referralLink}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Sign up on SecureKaro with code ${referralCode} for zero-fraud escrow shipping!`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SecureKaro Logistics Escrow',
          text: `Use my invite code ${referralCode} to ship securely with 0% escrow fraud:`,
          url: referralLink,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const faqs = [
    {
      q: 'How does the ₹30 referral reward work?',
      a: 'Share your referral code or direct link with any merchant, supplier, or buyer. When they sign up and their first shipment is marked as successfully delivered, ₹30 real cash is immediately credited into your SecureKaro Wallet.'
    },
    {
      q: 'Can I withdraw my referral earnings to my Bank Account or UPI?',
      a: 'Yes, absolutely! The ₹30 cash reward is deposited directly to your withdrawable Wallet balance. You can withdraw it instantly to your registered Bank Account or UPI ID via the Wallet section.'
    },
    {
      q: 'Can I use my referral reward cash to pay for booking shipments?',
      a: 'Yes! Whenever you create or book courier shipments on SecureKaro, your available Wallet balance can be used directly to pay for shipping charges and courier freight.'
    },
    {
      q: 'Is there any limit to how many merchants I can invite?',
      a: 'There is zero limit! You can invite as many suppliers, ecommerce merchants, and WhatsApp/Instagram sellers as you want. You earn ₹30 for every single friend who completes their first delivery.'
    },
    {
      q: 'When do my referred sellers need to complete their first shipment?',
      a: 'There is no expiration! Once your friend joins using your referral link or code, your ₹30 reward is unlocked the moment their first shipment reaches confirmed delivery.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 sm:py-8 space-y-5 sm:space-y-8 select-none">
      
      {/* ── HERO BANNER: AMBASSADOR WALLET CASH BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 border border-emerald-200/90 shadow-sm p-5 sm:p-7 text-slate-900">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 -mb-16 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Text / Value Proposition */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-black tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>SECUREKARO REFERRAL CASH PROGRAM</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug text-slate-900">
              Give Safety,{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#1E56E3] bg-clip-text text-transparent">
                Earn ₹30 Wallet Cash
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
              Invite merchant suppliers & buyers to SecureKaro. When their first shipment is safely delivered, you instantly receive <strong className="text-slate-900 font-bold">₹30 Real Cash</strong> deposited directly into your Wallet balance — withdrawable to your Bank/UPI or usable to pay courier shipping fees.
            </p>

            {/* Quick benefit tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>₹30 cash per delivered order</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Withdraw to UPI / Bank</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pay for Courier Shipping</span>
              </span>
            </div>
          </div>

          {/* Right Hero Card: Ambassador Reward Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shadow-xs">
                    <Gift className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">Your Invite Pass</span>
                    <span className="text-xs font-bold text-slate-800">Single-Click Merchant Sharing</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">₹30</span>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Per Friend</span>
                </div>
              </div>

              {/* Referral Code Showcase */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  UNIQUE REFERRAL CODE
                </label>
                <div className="flex items-center justify-between gap-2.5 bg-emerald-50/70 border border-emerald-300/80 rounded-xl p-2.5 sm:p-3">
                  <span className="text-lg sm:text-xl font-black font-mono tracking-widest text-slate-900">
                    {loading ? '...' : referralCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    <span>{copiedCode ? 'COPIED!' : 'COPY CODE'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Social Channels */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  INSTANT ONE-TAP SHARE
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Share with merchant friends on WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleTelegramShare}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Share in merchant groups on Telegram"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </button>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition active:scale-95 cursor-pointer"
                    title="Show in-person QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>

              {/* Direct Link Copier */}
              <div className="pt-0.5">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="bg-transparent border-none outline-none flex-1 font-mono text-[11px] text-slate-600 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="text-[11px] font-black text-[#1E56E3] hover:text-blue-700 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── 4-STAT PERFORMANCE DASHBOARD (2x2 on Mobile, 4x1 on Desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Invited */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2.5 sm:space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Invited</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono">
              {loading ? '...' : totalReferred}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500">accounts</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Via your referral link</p>
        </div>

        {/* Stat 2: Delivered & Converted */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2.5 sm:space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">Delivered</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-emerald-600 font-mono">
              {loading ? '...' : earnedReferrals}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              Qualified ✓
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Completed 1st delivery</p>
        </div>

        {/* Stat 3: In Transit / Pending */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2.5 sm:space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider truncate">In Transit</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-amber-600 font-mono">
              {loading ? '...' : pendingReferrals}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500">pipeline</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">₹{pendingReferrals * 40} pending</p>
        </div>

        {/* Stat 4: Total Wallet Cash Earned */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-50/60 to-white text-slate-900 border border-emerald-200/90 shadow-sm space-y-2.5 sm:space-y-3 hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">Referral Cash</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10">
            <span className="text-xl sm:text-3xl font-black text-emerald-900 font-mono">
              ₹{loading ? '...' : totalEarnedCash}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
              In Wallet ✓
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              Balance: <strong className="text-slate-900 font-bold">₹{currentWalletBalance.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

      </div>

      {/* ── 3-STEP VISUAL ROADMAP ── */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-black text-[#1E56E3] uppercase tracking-wider block">HOW REFERRAL REWARDS WORK</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">3 Easy Steps to Earn Withdrawable Wallet Cash</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            100% Automated Backend Escrow Tracking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-b from-blue-50/60 to-white border border-blue-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1E56E3] text-white flex items-center justify-center font-black text-base shadow-md shadow-blue-500/20">
              1
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Invite a Merchant Friend</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share your referral link or custom promo code with suppliers, D2C brand owners, or boutique sellers on WhatsApp.
            </p>
            <div className="pt-2 text-[11px] font-bold text-[#1E56E3] flex items-center gap-1">
              <span>Code auto-applied on signup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-white border border-indigo-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20">
              2
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">They Ship with Escrow</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your referred friend creates and dispatches their first parcel shipment with SecureKaro milestone escrow protection.
            </p>
            <div className="pt-2 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
              <span>Zero risk for both parties</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20">
              3
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Instant ₹30 Wallet Cash</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon confirmed delivery at destination, ₹30 is instantly added to your withdrawable Wallet balance.
            </p>
            <div className="pt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span>Withdraw to Bank or Pay Shipping</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </div>

      {/* ── DUAL SECTION: REWARD CALCULATOR + WALLET ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        
        {/* Left: Interactive Earnings Calculator */}
        <div className="lg:col-span-6 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>EARNINGS ESTIMATOR</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Interactive Referral Calculator</h2>
            <p className="text-xs text-slate-500">Estimate how much wallet cash you can generate by sharing SecureKaro.</p>
          </div>

          {/* Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Invited Merchants:</span>
              <span className="text-xl font-black text-emerald-600 font-mono">{calculatorCount} Merchants</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={calculatorCount}
              onChange={(e) => setCalculatorCount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>1 (₹30)</span>
              <span>5 (₹150)</span>
              <span>15 (₹450)</span>
              <span>25 (₹750)</span>
            </div>
          </div>

          {/* Calculated Output Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/90 text-slate-900 space-y-3.5 shadow-2xs">
            <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estimated Cash Earned</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">₹{calculatorCount * 30}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">₹30 × {calculatorCount} orders</span>
              </div>
              <div className="pl-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shipping Freight Offset</span>
                <span className="text-3xl font-black text-indigo-600 font-mono">
                  ~{Math.floor((calculatorCount * 30) / 60)} Parcels
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                  Free shipping covers or direct cash
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-medium">Ambassador Milestone:</span>
              <span className="font-extrabold text-emerald-800">
                {calculatorCount >= 6 ? 'Gold VIP Ambassador 🏆' : calculatorCount >= 3 ? 'Silver Partner 🌟' : 'Starter Advocate 🚀'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Wallet Cash Actions Hub */}
        <div className="lg:col-span-6 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-blue-50/40 to-white border border-emerald-200/80 shadow-sm space-y-5 sm:space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              <Wallet className="w-3.5 h-3.5 text-emerald-700" />
              <span>YOUR WALLET HUB</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Referral Wallet Cash</h2>
            <p className="text-xs text-slate-500">Every ₹30 earned is added directly to your withdrawable balance with 0 lock-in.</p>
          </div>

          {/* Balance Showcase Card */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600">Total Referral Cash Credited</span>
              <span className="font-mono font-black text-emerald-600 text-sm">₹{totalEarnedCash}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Available Wallet Balance</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  ₹{currentWalletBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Ready to Use ✓
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onNavigateToWallet && onNavigateToWallet()}
              className="py-3.5 px-4 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw to UPI / Bank</span>
            </button>

            <button
              onClick={() => onNavigateToCreateShipment && onNavigateToCreateShipment()}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Pay for Courier Shipping</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 font-semibold pt-1">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Direct Bank/UPI Disbursals
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Zero Lock-in or Expiry
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Offset Shipping Freight
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Transparent Transaction History
            </span>
          </div>
        </div>

      </div>

      {/* ── AMBASSADOR TIERS ── */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block">REWARD RECOGNITION</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Ambassador Progression Tiers</h2>
          <p className="text-xs text-slate-500">Earn higher recognition as your merchant network expands.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Tier 1 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            earnedReferrals < 3 
              ? 'bg-blue-50/50 border-[#1E56E3] ring-2 ring-blue-100 shadow-sm' 
              : 'bg-slate-50/60 border-slate-200 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#1E56E3] px-2 py-0.5 rounded-full">
                0-2 REFERRALS
              </span>
              {earnedReferrals < 3 && <span className="text-xs font-bold text-[#1E56E3]">Current Tier</span>}
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Starter Advocate</h4>
            <p className="text-xs text-slate-500 mt-1">Earn ₹30 cash on every verified merchant delivery.</p>
            <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs font-bold text-slate-700">
              Perk: ₹30 Wallet Cash per order
            </div>
          </div>

          {/* Tier 2 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            earnedReferrals >= 3 && earnedReferrals < 6
              ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-100 shadow-sm' 
              : 'bg-slate-50/60 border-slate-200 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                3-5 REFERRALS
              </span>
              {earnedReferrals >= 3 && earnedReferrals < 6 && <span className="text-xs font-bold text-purple-700">Current Tier</span>}
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Silver Partner</h4>
            <p className="text-xs text-slate-500 mt-1">Accelerated payout verification and priority customer support.</p>
            <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs font-bold text-purple-700">
              Perk: Priority Support + Instant Credit
            </div>
          </div>

          {/* Tier 3 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            earnedReferrals >= 6 
              ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-100 shadow-sm' 
              : 'bg-slate-50/60 border-slate-200 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                6+ REFERRALS
              </span>
              {earnedReferrals >= 6 && <span className="text-xs font-bold text-amber-700">Current Tier</span>}
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Gold VIP Ambassador</h4>
            <p className="text-xs text-slate-500 mt-1">Dedicated Key Account Manager and customized merchant shipping discounts.</p>
            <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs font-bold text-amber-800">
              Perk: Dedicated Key Account Manager
            </div>
          </div>

        </div>
      </div>

      {/* ── FREQUENTLY ASKED QUESTIONS ── */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">SUPPORT & DETAILS</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Referral Program FAQ</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-extrabold text-slate-800 text-xs sm:text-sm hover:text-[#1E56E3] transition cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-[#1E56E3]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed pr-6 animate-fadeIn">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── QR CODE MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">Scan to Register</span>
              <button 
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Generated QR Code Display */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(referralLink)}&margin=10`}
                alt="Referral QR Code"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Referral Code</span>
              <span className="text-2xl font-black font-mono text-[#1E56E3] tracking-widest block">{referralCode}</span>
              <p className="text-[11px] text-slate-400">Point phone camera at this QR code to sign up with your code pre-filled.</p>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
