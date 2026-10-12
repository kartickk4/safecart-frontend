import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2, ShieldCheck, Sparkles, Wallet, Smartphone,
  ArrowRight, ChevronRight, Copy, Check, X,
  Gift, Star, Lock, Shield, CheckCheck, Package, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

export default function ConfirmedWithCashback({
  resultData,
  parcelInfo,
  cashback,
  hasCashback,
  isLucky,
  isBonus,
  returnWindowChoice
}) {
  const [scratchState, setScratchState] = useState('idle'); // 'idle' | 'scratching' | 'revealed'
  const [showAppModal, setShowAppModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [swooshVisible, setSwooshVisible] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const foilPainted = useRef(false);

  const shipmentId = resultData?.shipmentId || parcelInfo?.shipmentId || '—';
  const productName = parcelInfo?.description || 'Parcel Item';
  const orderAmount = parcelInfo?.amount || 0;

  // Use the real cashback amount from backend (₹3-6)
  const cashbackAmount = Number(cashback?.amount) || 3;
  const totalBalance = Number(cashback?.totalBalance || cashbackAmount);
  const minWithdrawal = cashback?.minWithdrawal || 50;
  const neededForWithdrawal = Math.max(0, minWithdrawal - totalBalance);
  const progressPercent = Math.min(100, Math.round((totalBalance / minWithdrawal) * 100));
  const isRevealed = scratchState === 'revealed';

  // ── Celebration ─────────────────────────────────────────────────────────────
  const celebrate = useCallback(() => {
    try {
      confetti({
        particleCount: isLucky ? 90 : 60,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#ffffff'],
        disableForReducedMotion: true
      });
      setTimeout(() => {
        confetti({ particleCount: 30, angle: 60, spread: 45, origin: { x: 0.05, y: 0.6 }, colors: ['#4285f4', '#34a853'] });
        confetti({ particleCount: 30, angle: 120, spread: 45, origin: { x: 0.95, y: 0.6 }, colors: ['#fbbc04', '#ea4335'] });
      }, 200);
    } catch {}
    // Swoosh animation trigger
    setSwooshVisible(true);
    // Count-up for small amounts (3–6)
    let n = 0;
    const iv = setInterval(() => {
      n++;
      setDisplayAmount(n);
      if (n >= cashbackAmount) clearInterval(iv);
    }, 120);
    try { window.navigator?.vibrate?.([50, 30, 70]); } catch {}
  }, [cashbackAmount, isLucky, isBonus]);

  // ── Paint foil on canvas (Google Pay blue style) ─────────────────────────────
  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Google Pay blue gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#5c9ce8');
    grad.addColorStop(0.4, '#4285f4');
    grad.addColorStop(0.7, '#3367d6');
    grad.addColorStop(1, '#2851a3');
    ctx.fillStyle = grad;
    ctx.roundRect ? ctx.roundRect(0, 0, w, h, 24) : ctx.fillRect(0, 0, w, h);
    ctx.fill();

    // Floating icon helper
    const drawIcon = (x, y, size, type, alpha = 0.3) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#a8c7fa';
      ctx.strokeStyle = '#a8c7fa';
      ctx.lineWidth = size * 0.12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'rupee') {
        // ₹ symbol
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₹', x, y);
      } else if (type === 'star') {
        // 4-point star
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 - Math.PI / 2;
          const r = i % 2 === 0 ? size / 2 : size / 5;
          if (i === 0) ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
          else ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
      } else if (type === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size / 2.5, y);
        ctx.lineTo(x, y + size / 2);
        ctx.lineTo(x - size / 2.5, y);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'cross') {
        ctx.beginPath();
        ctx.moveTo(x - size / 2, y);
        ctx.lineTo(x + size / 2, y);
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x, y + size / 2);
        ctx.stroke();
      } else if (type === 'bag') {
        // Simple bag shape
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - size/2, y - size*0.2, size, size*0.75, 4) : ctx.rect(x - size/2, y - size*0.2, size, size*0.75);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - size*0.2, size*0.28, Math.PI, 0);
        ctx.stroke();
      } else if (type === 'medal') {
        // Medal / award
        ctx.beginPath();
        ctx.arc(x, y + size*0.15, size*0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - size*0.15, y - size*0.4);
        ctx.lineTo(x, y - size*0.15);
        ctx.lineTo(x + size*0.15, y - size*0.4);
        ctx.stroke();
      } else if (type === 'trophy') {
        // Cup silhouette
        ctx.beginPath();
        ctx.moveTo(x - size*0.3, y - size*0.5);
        ctx.lineTo(x + size*0.3, y - size*0.5);
        ctx.quadraticCurveTo(x + size*0.4, y, x, y + size*0.2);
        ctx.quadraticCurveTo(x - size*0.4, y, x - size*0.3, y - size*0.5);
        ctx.fill();
        ctx.fillRect(x - size*0.1, y + size*0.2, size*0.2, size*0.3);
        ctx.fillRect(x - size*0.25, y + size*0.48, size*0.5, size*0.08);
      }
      ctx.restore();
    };

    // Draw floating background icons (Google Pay feel)
    drawIcon(80, 70, 36, 'star', 0.22);
    drawIcon(w - 90, 60, 30, 'medal', 0.2);
    drawIcon(55, h - 80, 34, 'trophy', 0.18);
    drawIcon(w - 70, h - 70, 38, 'bag', 0.2);
    drawIcon(w * 0.5, 50, 28, 'rupee', 0.25);
    drawIcon(130, h / 2 - 10, 22, 'diamond', 0.2);
    drawIcon(w - 130, h / 2, 20, 'circle', 0.18);
    drawIcon(w * 0.3, h - 50, 18, 'cross', 0.2);
    drawIcon(w * 0.72, h - 55, 22, 'star', 0.18);

    // Corner small sparks
    const drawSpark = (x, y, r, alpha = 0.5) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#bbd4fb';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
      ctx.restore();
    };
    drawSpark(28, 28, 9, 0.55);
    drawSpark(w - 28, 28, 9, 0.55);
    drawSpark(32, h - 32, 7, 0.45);
    drawSpark(w - 32, h - 32, 7, 0.45);

    // Centre instruction text
    const cx = w / 2, cy = h / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;
    ctx.fillText('Scratch card', cx, cy - 12);
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.shadowBlur = 0;
    ctx.fillText('Rewarded for using SafeCart', cx, cy + 14);
    ctx.restore();

    foilPainted.current = true;
  }, [isLucky, isBonus]);

  useEffect(() => {
    if (hasCashback && !isRevealed) {
      paintFoil();
    }
  }, [hasCashback, isRevealed, paintFoil]);

  // ── Scratch logic ────────────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return [(src.clientX - rect.left) * sx, (src.clientY - rect.top) * sy];
  };

  const erasePt = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 50) transparent++;
    }
    if (transparent / (data.length / 64) > 0.3) {
      setScratchState('revealed');
      celebrate();
    }
  };

  const onDown = (e) => {
    if (isRevealed) return;
    e.preventDefault();
    isDrawing.current = true;
    setScratchState('scratching');
    const [x, y] = getPos(e, canvasRef.current);
    erasePt(x, y);
  };

  const onMove = (e) => {
    if (!isDrawing.current || isRevealed) return;
    e.preventDefault();
    const [x, y] = getPos(e, canvasRef.current);
    erasePt(x, y);
    checkReveal();
  };

  const onUp = () => {
    isDrawing.current = false;
    if (scratchState === 'scratching') setScratchState('idle');
  };

  const revealNow = () => {
    setScratchState('revealed');
    celebrate();
  };

  const copyId = () => { navigator.clipboard?.writeText?.(shipmentId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); };
  const copyLink = () => { navigator.clipboard?.writeText?.(window.location.origin); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2500); };

  return (
    <>
      {/* ── Page Shell ─────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-[#f4f6f9] flex items-start sm:items-center justify-center py-8 px-4">
        <div className="w-full max-w-md space-y-3">

          {/* ── Top Success Header Card ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Emerald strip */}
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

            <div className="p-6 text-center space-y-3">
              {/* Checkmark */}
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">Delivery Confirmed</h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {returnWindowChoice === 'confirm_and_close'
                    ? 'Escrow funds have been released to the seller.'
                    : 'Your 24-hour inspection window is now active.'}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Escrow Delivery Verified
              </div>
            </div>
          </div>

          {/* ── Order Summary Card ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Summary</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500">Tracking ID</span>
                <button
                  onClick={copyId}
                  className="flex items-center gap-1.5 text-sm font-mono font-semibold text-slate-800 hover:text-slate-900 group"
                >
                  {shipmentId}
                  {copiedId
                    ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                    : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  }
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500">Item</span>
                <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{productName}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500">Order Value</span>
                <span className="text-sm font-bold text-slate-900">₹{Number(orderAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* ── Scratch Card Cashback Block ─────────────────────────────────── */}
          {hasCashback && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Delivery Reward</span>
                </div>
                {isLucky ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Exclusive
                  </span>
                ) : isBonus ? (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    Promotional
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Assured
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* The Scratch Card — Google Pay Style */}
                <style>{`
                  @keyframes gpay-swoosh {
                    0% { transform: translateY(60%) scale(0.7) rotate(-6deg); opacity: 0; }
                    60% { transform: translateY(-8%) scale(1.06) rotate(2deg); opacity: 1; }
                    100% { transform: translateY(0%) scale(1) rotate(0deg); opacity: 1; }
                  }
                  @keyframes gpay-amount-pop {
                    0% { transform: scale(0.5); opacity: 0; }
                    70% { transform: scale(1.18); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .gpay-swoosh { animation: gpay-swoosh 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                  .gpay-amount-pop { animation: gpay-amount-pop 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
                `}</style>

                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ height: 210 }}>
                  {/* BLUE BACKGROUND — always visible */}
                  <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, #5c9ce8 0%, #4285f4 45%, #3367d6 75%, #2851a3 100%)' }} />

                  {/* FLOATING ICONS LAYER (always visible) */}
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={420}
                    className="absolute inset-0 w-full h-full"
                    style={{ touchAction: 'none', cursor: isRevealed ? 'default' : 'crosshair', pointerEvents: isRevealed ? 'none' : 'auto' }}
                    onMouseDown={!isRevealed ? onDown : undefined}
                    onMouseMove={!isRevealed ? onMove : undefined}
                    onMouseUp={!isRevealed ? onUp : undefined}
                    onMouseLeave={!isRevealed ? onUp : undefined}
                    onTouchStart={!isRevealed ? onDown : undefined}
                    onTouchMove={!isRevealed ? onMove : undefined}
                    onTouchEnd={!isRevealed ? onUp : undefined}
                  />

                  {/* WHITE SWOOSH REVEAL — appears after scratching */}
                  {isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* White blob swoosh */}
                      <div
                        className={`gpay-swoosh absolute`}
                        style={{
                          width: '88%',
                          height: '78%',
                          background: 'white',
                          borderRadius: '50% 50% 48% 52% / 55% 55% 45% 45%',
                          boxShadow: '0 8px 32px rgba(66,133,244,0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          padding: '12px 16px',
                        }}
                      >
                        {/* Cashback Won label */}
                        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest leading-none">Cashback Won! 🎉</p>

                        {/* Amount */}
                        <div className="gpay-amount-pop flex items-baseline gap-0.5">
                          <span className="text-2xl font-black text-slate-900" style={{ color: '#1a1a2e' }}>₹</span>
                          <span className="text-[44px] font-black leading-none tabular-nums" style={{ color: '#1a1a2e' }}>
                            {isRevealed ? (displayAmount || cashbackAmount) : cashbackAmount}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 text-center leading-tight">
                          {isLucky ? '🌟 Lucky bonus on SafeCart delivery' : 'Instant wallet credit on delivery'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pre-reveal center text (on blue) */}
                  {!isRevealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                    </div>
                  )}
                </div>

                {/* Bottom hint bar */}
                {!isRevealed ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Gift className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Scratch card</p>
                        <p className="text-[11px] text-slate-500">Rewarded for completing delivery</p>
                      </div>
                    </div>
                    <button
                      onClick={revealNow}
                      className="shrink-0 text-xs font-bold text-white bg-[#4285f4] hover:bg-[#3367d6] shadow-sm px-3.5 py-2 rounded-lg transition active:scale-95"
                    >
                      Reveal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ₹{cashbackAmount} cashback added to wallet
                    </span>
                    <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                      REF-{shipmentId.slice(-5)}
                    </span>
                  </div>
                )}

                {/* Wallet progress */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-slate-400" />
                      Wallet Balance
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{totalBalance}
                      <span className="text-slate-400 font-normal text-xs"> / ₹{minWithdrawal}</span>
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {neededForWithdrawal > 0
                        ? `₹${neededForWithdrawal} more to unlock UPI withdrawal`
                        : '🎉 Eligible for UPI withdrawal!'}
                    </span>
                    <span>Min ₹50</span>
                  </div>

                  <button
                    onClick={() => setShowAppModal(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold">Withdraw via UPI</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Action Buttons ──────────────────────────────────────────────── */}
          <div className="space-y-2">
            <a
              href={`/tracking?id=${encodeURIComponent(shipmentId)}`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <Package className="w-4 h-4 text-slate-500" />
              Track My Parcel
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
            </a>

            <a
              href="/"
              className="block text-center text-xs text-slate-400 hover:text-slate-600 py-2 transition"
            >
              Back to Dashboard
            </a>
          </div>

          {/* Security footer */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pb-2">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* ── UPI Withdrawal Modal ─────────────────────────────────────────────── */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-slate-200 shadow-2xl overflow-hidden">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Withdraw to UPI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Via SecureKaro mobile app</p>
              </div>
              <button
                onClick={() => setShowAppModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance row */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-600">Wallet Balance</span>
              <span className="text-lg font-bold text-emerald-700">₹{totalBalance}.00</span>
            </div>

            {/* QR + info */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs shrink-0">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.origin : 'https://securekaro.in'}
                    size={72}
                    level="M"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Scan to install the app</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Login with your phone number — your wallet syncs automatically.
                  </p>
                </div>
              </div>

              {/* UPI apps */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Works with</p>
                <div className="flex gap-2">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <span key={app} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{app}</span>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <p className="text-[11px] text-slate-400 leading-relaxed">
                UPI payouts require the app for 2-factor security. Minimum payout is ₹50.
              </p>

              {/* CTA */}
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
              >
                {copiedLink ? (
                  <><Check className="w-4 h-4 text-emerald-400" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy App Link</>
                )}
              </button>

              <button
                onClick={() => setShowAppModal(false)}
                className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
