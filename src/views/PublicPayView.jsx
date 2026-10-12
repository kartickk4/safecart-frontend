import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, ArrowRight, ExternalLink,
  Package, RotateCcw, AlertCircle, RefreshCw
} from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function PublicPayView({ shipmentId, onPaymentComplete }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    setLoading(true);
    setError('');
    const targetId = shipmentId || window.location.pathname.split('/pay/')[1] || 'SPL-5396-U';

    try {
      // Fetch public shipment data via tracking endpoint
      const res = await shipmentAPI.getTrackingByAwb(targetId.trim());
      if (res.data && res.data.shipment) {
        const ship = res.data.shipment;
        setShipment(ship);

        // Check if already paid
        if (ship.status === 'Payment Received' || ship.escrowStage >= 3) {
          setPaidSuccess(true);
          setLoading(false);
          return;
        }

        // If Cashfree / Gateway link exists, automatically redirect
        if (ship.paymentLink && ship.paymentLink.startsWith('http')) {
          setRedirecting(true);
          setLoading(false);
          // Auto-redirect to integrated payment gateway
          window.location.replace(ship.paymentLink);
          return;
        }
      } else {
        setError(`Order #${targetId} could not be found.`);
      }
    } catch (err) {
      console.warn('Could not fetch real shipment:', err);
      setError('Unable to load payment details. Please check the link or contact the seller.');
    } finally {
      setLoading(false);
    }
  };

  const baseAmount = Number(shipment?.amount || 0);
  const orderAmount = baseAmount > 0 ? baseAmount.toLocaleString('en-IN') : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#1E56E3] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-600 mt-4 uppercase tracking-wider">
          Connecting to Payment Gateway...
        </p>
      </div>
    );
  }

  // State A: Already Paid
  if (paidSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F4F7FC] to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Payment Secured in Escrow
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Payment Completed!
            </h2>
            <p className="text-xs text-slate-600">
              ₹{orderAmount} is safely held under SecureKaro Escrow protection. The seller has been notified to dispatch your parcel.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-mono font-bold text-slate-900">{shipment?.shipmentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protection:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Lock className="w-3 h-3" /> SecureKaro Vault Protected
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-slate-800">{shipment?.status || 'Payment Confirmed'}</span>
            </div>
          </div>

          <a
            href={`/track/${shipment?.shipmentId || ''}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-black text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            <span>Track Your Parcel</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // State B: Redirecting to Integrated Cashfree Payment Gateway
  if (redirecting || (shipment?.paymentLink && shipment.paymentLink.startsWith('http'))) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F4F7FC] to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center border border-blue-200">
            <RefreshCw className="w-8 h-8 animate-spin text-[#1E56E3]" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E56E3] text-[11px] font-black border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cashfree Verified Gateway</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Redirecting to Payment Gateway
            </h2>
            <p className="text-xs text-slate-500">
              Transferring you securely to pay ₹{orderAmount} via UPI, Cards, or NetBanking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-mono font-bold text-slate-900">{shipment?.shipmentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-900">₹{orderAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Lock className="w-3 h-3" /> 256-bit Encrypted Escrow
              </span>
            </div>
          </div>

          <a
            href={shipment?.paymentLink}
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-black text-sm shadow-xl shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            <span>Proceed to Payment Gateway</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <p className="text-[11px] text-slate-400">
            If you are not redirected automatically within 3 seconds, please tap the button above.
          </p>
        </div>
      </div>
    );
  }

  // State C: Error or Non-Prepaid Order
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F4F7FC] to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {error || 'No Online Payment Required'}
          </h2>
          <p className="text-xs text-slate-500">
            {shipment?.paymentMode === 'cod'
              ? 'This order is booked under Cash on Delivery (COD). Please pay the courier agent upon arrival.'
              : error || 'This shipment does not require online escrow payment.'}
          </p>
        </div>

        {shipment?.shipmentId && (
          <a
            href={`/track/${shipment.shipmentId}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-black text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            <span>View Shipment Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
