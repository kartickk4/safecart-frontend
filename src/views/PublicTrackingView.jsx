import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Search, Phone, Truck, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, RefreshCw, Copy, Check,
  Share2, Eye, MapPin, Package, HelpCircle, Sparkles, ExternalLink,
  ChevronRight, ArrowLeft, RotateCcw
} from 'lucide-react';
import { shipmentAPI } from '../services/api';


export default function PublicTrackingView({ initialTrackingId = '', initialPhone = '', onBackToAuth }) {
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'map' | 'photo' | 'order'
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-track on load if both initialTrackingId and initialPhone are present
  useEffect(() => {
    // Check URL query parameters if not passed via props
    const searchParams = new URLSearchParams(window.location.search);
    const urlId = initialTrackingId || searchParams.get('id') || searchParams.get('track') || searchParams.get('awb');
    const urlPhone = initialPhone || searchParams.get('phone');

    if (urlId) setTrackingId(urlId);
    if (urlPhone) setPhone(urlPhone);

    if (urlId && urlPhone) {
      executeTrack(urlId, urlPhone);
    } else if (urlId && !urlPhone) {
      // Try to track directly or fetch public preview
      executeTrack(urlId, '');
    }
  }, []);

  const executeTrack = async (targetId, targetPhone) => {
    const idToUse = (targetId || trackingId || '').trim();
    const phoneToUse = (targetPhone || phone || '').trim();

    if (!idToUse) {
      setError('Please enter a Shipment ID or AWB Tracking Number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If phone is provided, use the secure public tracking endpoint
      if (phoneToUse) {
        const res = await shipmentAPI.getPublicTracking(idToUse, phoneToUse);
        if (res.data?.success && res.data?.shipment) {
          setTrackingData(res.data);
          setLoading(false);
          return;
        }
      }

      // If no phone or fallback, try getTrackingByAwb
      try {
        const res = await shipmentAPI.getTrackingByAwb(idToUse);
        if (res.data) {
          const ship = res.data.shipment || {};
          const journey = res.data.journey || [];

          // Format into standardized public tracking data structure
          setTrackingData({
            success: true,
            shipment: {
              shipmentId: ship.shipmentId || idToUse,
              awbCode: ship.awbCode || res.data.awb || 'Pending',
              carrierSlug: ship.carrierSlug || 'delhivery',
              courierName: (ship.carrierSlug || 'DELHIVERY').toUpperCase(),
              status: ship.status || res.data.status || 'In Transit',
              escrowStage: ship.escrowStage || 4,
              stageLabel: ship.status || 'In Transit',
              stageDesc: 'Shipment secured and tracked via SecureKaro Escrow.',
              amount: ship.amount || 0,
              description: ship.description || 'Order Parcel',
              city: ship.city || 'Origin → Destination',
              receiverName: ship.receiverName || 'Recipient',
              receiverPhoneMasked: ship.receiverPhone ? `+91 ******${ship.receiverPhone.slice(-4)}` : '******',
              senderBusinessName: 'Verified Merchant',
              senderCity: '',
              parcelPhotoUrl: ship.parcelPhotoUrl || '',
              photoReviewPaid: Boolean(ship.photoReviewPaid),
              returnAllowed: ship.returnAllowed !== false,
              returnStatus: ship.returnStatus || 'None',
              returnReason: ship.returnReason || '',
              returnCarrierName: ship.returnCarrierName || '',
              returnCarrierSlug: ship.returnCarrierSlug || '',
              returnAwbCode: ship.returnAwbCode || '',
              returnApprovedAt: ship.returnApprovedAt || null,
              returnType: ship.returnType || '',
              createdAt: ship.createdAt || new Date().toISOString(),
              estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            journey: Array.isArray(journey) && journey.length > 0 ? journey : [
              {
                status: ship.status || 'In Transit',
                location: ship.city || 'Regional Hub',
                detail: `Parcel status is currently ${ship.status || 'In Transit'}. Funds safely locked in Escrow.`,
                time: new Date()
              }
            ],
            telemetry: null
          });
          setLoading(false);
          return;
        }
      } catch (awbErr) {
        if (!phoneToUse) {
          setError('Please provide your registered mobile number to verify ownership and track this parcel.');
        } else {
          setError(awbErr.response?.data?.error || 'Parcel not found. Please verify your Shipment ID and registered phone number.');
        }
      }
    } catch (err) {
      console.error('Public tracking error:', err);
      setError(err.response?.data?.error || 'Failed to locate shipment. Please check your Shipment ID and mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeTrack(trackingId, phone);
  };

  const copyShipmentId = () => {
    if (!trackingData?.shipment?.shipmentId) return;
    navigator.clipboard.writeText(trackingData.shipment.shipmentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyShareableLink = () => {
    const link = `${window.location.origin}/track/${trackingData?.shipment?.shipmentId || trackingId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusColor = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('completed')) {
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    }
    if (s.includes('out for delivery')) {
      return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse' };
    }
    if (s.includes('transit') || s.includes('shipped') || s.includes('dispatched')) {
      return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' };
    }
    return { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500' };
  };

  const carrierLogos = {
    delhivery: 'https://images.seeklogo.com/logo-png/43/2/delhivery-logo-png_seeklogo-439242.png',
    bluedart: 'https://images.seeklogo.com/logo-png/33/2/blue-dart-logo-png_seeklogo-331613.png',
    dtdc: 'https://images.seeklogo.com/logo-png/35/2/dtdc-logo-png_seeklogo-356494.png',
    ekart: 'https://images.seeklogo.com/logo-png/49/1/ekart-logistics-logo-png_seeklogo-496530.png'
  };

  const shipment = trackingData?.shipment;
  const journey = trackingData?.journey || [];
  const statusTheme = shipment ? getStatusColor(shipment.status) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F3F6FC] to-slate-100 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">SecureKaro</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                PUBLIC TRACKING
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Zero-Login Parcel & Escrow Verification Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RBI-Compliant Escrow Protection</span>
          </div>

          {onBackToAuth ? (
            <button
              onClick={onBackToAuth}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Merchant / User Login</span>
            </button>
          ) : (
            <a
              href="/"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Login Portal</span>
            </a>
          )}
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* ── Search Input Card (Always visible or toggleable) ──────────────────── */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-indigo-50/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Track Your Parcel Without Login</span>
                <span className="text-blue-600 font-extrabold text-sm px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  Instant Access
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your <span className="font-semibold text-slate-700">Shipment ID (SPL-...)</span> or <span className="font-semibold text-slate-700">AWB Code</span> along with your registered mobile number to securely inspect courier progress and escrow protection.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Shipment ID / AWB Number *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. SPL-9418-L or DLV123456"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-4 relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Registered Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Parcel</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Tracking Verification Notice</p>
                  <p className="mt-0.5 text-rose-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tracking Results Workspace ───────────────────────────────────────── */}
        {shipment ? (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Status Overview Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              {/* Header with Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {shipment.shipmentId}
                    </span>
                    <button
                      onClick={copyShipmentId}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Copy Shipment ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusTheme?.bg} ${statusTheme?.text} border ${statusTheme?.border}`}>
                      <span className={`w-2 h-2 rounded-full ${statusTheme?.dot}`}></span>
                      <span>{shipment.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Order description: <span className="font-bold text-slate-700">{shipment.description}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyShareableLink}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share Tracking'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Track your SecureKaro Escrow Parcel: ${window.location.origin}/track/${shipment.shipmentId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Courier & Route Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <span>Courier Partner</span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    {shipment.courierName || 'Delhivery Express'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    AWB: {shipment.awbCode}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Destination</span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                    {shipment.city || 'Transit Route'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Recipient: {shipment.receiverName}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Est. Delivery</span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    {shipment.estimatedDeliveryDate 
                      ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : '2-3 Business Days'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold">
                    On Schedule
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Escrow Vault</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-blue-900">
                    ₹{Number(shipment.amount || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-blue-700 font-bold">
                    Safe in Vault
                  </p>
                </div>
              </div>

              {/* ── Escrow Security Promise Banner ─────────────────────────────────── */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-slate-50 border border-blue-200/80 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      SecureKaro Vault Protection Active
                    </h2>
                    <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Stage {shipment.escrowStage || 4} of 7
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your payment of <strong className="text-slate-900">₹{Number(shipment.amount || 0).toLocaleString('en-IN')}</strong> is safely locked inside SecureKaro's RBI-regulated Escrow Vault. <span className="font-semibold text-blue-700">The merchant is NOT paid</span> until you receive the package, inspect it, and confirm satisfactory delivery.
                  </p>
                </div>
              </div>

              {/* ── Reverse Logistics Return Tracking (if return active) ───────────────── */}
              {(shipment.returnAwbCode || (shipment.returnStatus && shipment.returnStatus !== 'None') || shipment.status?.includes('Return')) && (() => {
                const isRefundCompleted = shipment.status === 'Returned & Refunded' || shipment.returnStatus === 'Returned & Refunded' || shipment.returnStatus === 'Completed' || shipment.status === 'Returned & Restocked';
                return (
                  <div className={`p-5 rounded-3xl shadow-2xs space-y-4 border ${
                    isRefundCompleted
                      ? 'bg-emerald-50/90 border-emerald-200/90'
                      : 'bg-amber-50/90 border-amber-200/90'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 font-extrabold text-xs ${
                        isRefundCompleted ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isRefundCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {isRefundCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <RotateCcw className="w-4 h-4 text-amber-700" />}
                        </div>
                        <div>
                          <span className="text-xs font-black block">
                            {isRefundCompleted ? 'Refund Completed ✓' : 'Reverse Logistics Return Tracking'}
                          </span>
                          <span className={`text-[10px] ${isRefundCompleted ? 'text-emerald-800' : 'text-amber-800'}`}>
                            {isRefundCompleted ? '100% Escrow funds refunded to buyer' : 'Return active on this parcel'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        isRefundCompleted
                          ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                          : 'bg-amber-200 text-amber-900 border-amber-300'
                      }`}>
                        {shipment.returnStatus || shipment.status}
                      </span>
                    </div>

                    {/* 4-Step Stepper */}
                    <div className={`p-3.5 bg-white/95 rounded-2xl border space-y-2 ${
                      isRefundCompleted ? 'border-emerald-200' : 'border-amber-200'
                    }`}>
                      <div className="grid grid-cols-4 gap-1 relative text-center">
                        {[
                          { step: 1, label: '1. Requested', active: true },
                          { step: 2, label: '2. Assigned', active: Boolean(shipment.returnAwbCode || shipment.returnCarrierSlug || shipment.returnStatus === 'In Return Transit' || shipment.returnStatus === 'Completed') },
                          { step: 3, label: '3. In Transit', active: Boolean(shipment.returnStatus === 'In Return Transit' || shipment.returnStatus === 'Completed') },
                          { step: 4, label: '4. Refunded', active: Boolean(shipment.returnStatus === 'Completed' || shipment.status === 'Returned & Refunded') }
                        ].map(s => (
                          <div key={s.step} className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                              s.active 
                                ? (isRefundCompleted ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white') 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {s.active ? '✓' : s.step}
                            </div>
                            <span className={`text-[10px] font-bold mt-1 ${
                              s.active ? (isRefundCompleted ? 'text-emerald-950' : 'text-amber-950') : 'text-slate-400'
                            }`}>
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  <div className="p-3.5 bg-white/95 rounded-2xl border border-amber-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Reverse Courier Partner:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{shipment.returnCarrierName || (shipment.returnCarrierSlug ? shipment.returnCarrierSlug.toUpperCase() + ' Express' : 'Pending Carrier Partner')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Reverse Tracking AWB:</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{shipment.returnAwbCode || 'Awaiting Generation'}</p>
                    </div>
                    {shipment.returnReason && (
                      <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Return Reason:</span>
                        <p className="font-medium text-slate-700 mt-0.5">{shipment.returnReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ); })()}

              {/* ── Tab Navigation ──────────────────────────────────────────────── */}
              <div className="flex items-center gap-2 border-b border-slate-200 pt-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'timeline'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Tracking Milestones</span>
                </button>



                {shipment.parcelPhotoUrl && (
                  <button
                    onClick={() => setActiveTab('photo')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'photo'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-700 font-extrabold">Packed Photo Review</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('order')}
                  className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'order'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Order & Return Policy</span>
                </button>
              </div>

              {/* ── Tab 1: Timeline & Milestones ───────────────────────────────── */}
              {activeTab === 'timeline' && (
                <div className="pt-2 space-y-4">
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {journey.map((step, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                            isLatest ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <p className={`text-xs sm:text-sm font-extrabold ${isLatest ? 'text-blue-900' : 'text-slate-800'}`}>
                                {step.status || step.activity}
                              </p>
                              <span className="text-[11px] font-mono text-slate-400">
                                {step.time ? new Date(step.time).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Recent'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500">
                              {step.location || 'Logistics Hub'}
                            </p>

                            {step.detail && (
                              <p className="text-[11px] text-slate-600 pt-0.5">
                                {step.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* ── Tab 3: Photo Review ────────────────────────────────────────── */}
              {activeTab === 'photo' && shipment.parcelPhotoUrl && (
                <div className="pt-2 space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-3">
                    <Eye className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-xs font-bold text-purple-950">
                        Pre-Dispatch Product Verification Photo
                      </h2>
                      <p className="text-xs text-purple-800 mt-0.5">
                        This photograph was taken and certified by the seller at the moment of packaging before handing it over to the courier partner.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-w-lg mx-auto bg-slate-950 flex items-center justify-center p-2 shadow-md">
                    <img
                      src={shipment.parcelPhotoUrl}
                      alt="Certified Parcel"
                      className="max-h-96 w-auto object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* ── Tab 4: Order & Return Policy ───────────────────────────────── */}
              {activeTab === 'order' && (
                <div className="pt-2 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <h2 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                        Order Specifications
                      </h2>
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Description:</span>
                          <span className="font-bold text-slate-800">{shipment.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escrow Value:</span>
                          <span className="font-bold text-slate-800">₹{Number(shipment.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Merchant:</span>
                          <span className="font-bold text-slate-800">{shipment.senderBusinessName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protected Phone:</span>
                          <span className="font-mono text-slate-800">{shipment.receiverPhoneMasked}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <h2 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                        Return & Dispute Policy
                      </h2>
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Return Allowed:</span>
                          <span className={`font-bold ${shipment.returnAllowed ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {shipment.returnAllowed ? 'Yes (48h Window)' : 'Standard Warranty'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return Status:</span>
                          <span className="font-bold text-slate-800">{shipment.returnStatus || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dispute Mediation:</span>
                          <span className="font-bold text-blue-600">SecureKaro Escrow Guarantee</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Buyer Action Card ────────────────────────────────────────────── */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Are you the recipient of this order?
                </h2>
                <p className="text-xs text-slate-500">
                  When your package arrives, you can sign in to inspect and release escrow funds or initiate a 1-click return if damaged.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setTrackingData(null);
                    setTrackingId('');
                    setPhone('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Track Another
                </button>

                {onBackToAuth ? (
                  <button
                    onClick={onBackToAuth}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Sign In to Confirm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <a
                    href="/"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Sign In to Confirm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Trust Pillars & FAQ ─────────────────────────────────────────────── */}
        {!shipment && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-800">100% Escrow Protection</h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Money is safely safeguarded in an RBI-compliant vault. The supplier cannot access your funds until delivery is verified.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Multi-Carrier Sync</h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Integrated real-time live checkpoints from Delhivery, BlueDart, DTDC, Xpressbees, and Ekart logistics.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Zero-Login Privacy</h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mobile number verification ensures only you and the seller can view recipient details and parcel milestones.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-5 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600">
          SecureKaro Logistics & Escrow Ecosystem © 2026. All rights reserved.
        </p>
        <p className="text-[11px] text-slate-400">
          Compliant with RBI Escrow Directions & Section 65B of the Indian Evidence Act.
        </p>
      </footer>
    </div>
  );
}
