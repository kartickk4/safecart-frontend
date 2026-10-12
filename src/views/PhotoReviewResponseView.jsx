import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Camera, ShieldCheck, RefreshCw, ArrowRight, Sparkles, Truck, Package, MapPin } from 'lucide-react';
import { shipmentAPI } from '../services/api';

/**
 * PhotoReviewResponseView
 * Accessed via: /photo-review/:shipmentId/accept  → opt into ₹2 photo review
 *               /photo-review/:shipmentId/skip    → refuse photo review, automatically advance to next step (parcel sent to receiver)
 *
 * Opened from the WhatsApp/SMS quick-reply link sent when shipment is booked or funded.
 */
export default function PhotoReviewResponseView({ shipmentId, action }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success_accept' | 'success_skip' | 'already_done' | 'error'
  const [shipment, setShipment] = useState(null);
  const [statusAdvanced, setStatusAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (shipmentId && action) {
      handlePhotoReviewAction();
    }
  }, [shipmentId, action]);

  const handlePhotoReviewAction = async () => {
    setStatus('loading');
    try {
      let res;
      if (action === 'accept') {
        res = await shipmentAPI.optInPhotoReview(shipmentId);
        setShipment(res.data?.shipment);
        if (res.data?.message?.toLowerCase().includes('already')) {
          setStatus('already_done');
        } else {
          setStatus('success_accept');
        }
      } else {
        res = await shipmentAPI.refusePhotoReview(shipmentId);
        const ship = res.data?.shipment;
        setShipment(ship);
        setStatusAdvanced(Boolean(res.data?.statusAdvanced || ship?.status === 'In Transit'));
        setStatus('success_skip');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const goToPayPage = () => {
    window.location.href = `/pay/${shipmentId}`;
  };

  const goToTracking = () => {
    window.location.href = `/?tab=tracking&awb=${shipment?.awbCode || ''}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-5" />
        <p className="text-sm font-bold text-blue-200 tracking-wide uppercase animate-pulse">
          {action === 'accept' ? 'Activating Photo Review...' : 'Processing your choice...'}
        </p>
      </div>
    );
  }

  if (status === 'success_accept') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
              <Camera className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">📸 Parcel Photo Verification is Active</h1>
            <p className="text-sm text-blue-200 leading-relaxed">
              Parcel & product photo verification is <span className="font-bold text-emerald-400">mandatory for all shipments</span> on SecureKaro at ₹0 extra fee. The seller is required to capture and upload a verified photo before courier dispatch.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" /> Standard Escrow Protection
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">1.</span>Seller must upload a verified photo of packed items before handover.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">2.</span>Courier partner collects the parcel and advances tracking to In Transit.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">3.</span>Your payment remains 100% safe in RBI-regulated escrow until delivery is confirmed.</li>
            </ul>
          </div>
          {shipment?.shipmentId && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Shipment: #{shipment.shipmentId}</span>
              <span className="capitalize">{shipment.carrierSlug || 'Delhivery'}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {shipment?.awbCode && (
              <button onClick={goToTracking} className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
                <Truck className="w-4 h-4" />
                <span>Track Parcel</span>
              </button>
            )}
            <button onClick={goToPayPage} className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/40 transition flex items-center justify-center gap-2 cursor-pointer">
              <span>View Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success_skip') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
              <Camera className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">📸 Parcel Photo Verification Active</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Parcel photo verification is <strong className="text-emerald-400">mandatory for all shipments</strong> at no extra cost. Your shipment is safely progressing under full escrow protection.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" /> Next Steps
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The seller will upload clear parcel proof before courier dispatch. You can track this shipment anytime via the tracking ID or view your escrow status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {shipment?.awbCode && (
              <button onClick={goToTracking} className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
                <Truck className="w-4 h-4" />
                <span>Track Parcel</span>
              </button>
            )}
            <button onClick={goToPayPage} className="flex-1 py-3.5 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer">
              <span>View Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'already_done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white">Already Activated</h1>
          <p className="text-sm text-slate-400">Photo review was already activated for this shipment. No further action needed.</p>
          <button onClick={goToPayPage} className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
            <span>Go to Payment</span><ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
          <XCircle className="w-9 h-9 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePhotoReviewAction} className="flex-1 py-3 px-5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={goToPayPage} className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
            Pay Page <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
