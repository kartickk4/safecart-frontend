import React, { useState } from 'react';
import { X, ShieldCheck, IndianRupee, QrCode, CreditCard, Landmark, CheckCircle2, Lock, ArrowRight, RefreshCw } from 'lucide-react';

export default function PaymentCheckoutModal({ shipmentId = 'PSF-2026-00841', amount = 3420, receiverName = 'Kartick Das', isOpen, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('kartick@upi');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Safecart Escrow Payment</h2>
                <p className="text-xs text-slate-500">Order ID: <span className="font-mono font-bold text-slate-900">{shipmentId}</span></p>
              </div>
            </div>

            {/* Escrow Amount Highlight */}
            <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount to Lock in Escrow</span>
                <span className="text-2xl font-black text-slate-900 font-mono">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                RBI Protected Vault
              </span>
            </div>

            {/* Payment Method Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Integrated Payment Gateway</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'upi'
                      ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">UPI / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'netbanking'
                      ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Landmark className="w-5 h-5" />
                  <span className="text-xs">Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'card'
                      ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card</span>
                </button>
              </div>
            </div>

            {/* Payment Gateway Form / QR Code */}
            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                  <div className="w-32 h-32 bg-white p-2 border border-slate-200 rounded-xl mx-auto flex items-center justify-center shadow-sm">
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Scan QR using Google Pay, PhonePe, Paytm, or BHIM</p>

                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 text-center focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Select Your Bank</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900">
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="sbi">State Bank of India (SBI)</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8921"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry</label>
                      <input type="text" placeholder="08/28" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                      <input type="password" maxLength="3" placeholder="•••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{Number(amount).toLocaleString('en-IN')} Into Escrow Vault</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Payment Secured in Escrow!</h3>
              <p className="text-xs text-slate-500 mt-1">₹{Number(amount).toLocaleString('en-IN')} successfully transferred into Safecart RBI Escrow Vault for shipment <span className="font-mono font-bold text-slate-800">{shipmentId}</span>.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Done & Return to Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
