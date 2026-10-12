import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Lock,
  RefreshCw,
  Building2,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { walletAPI } from '../services/api';

export default function RechargeModal({ isOpen, onClose, currentBalance = 0, onSuccess }) {
  if (!isOpen) return null;

  const currentNum = Number(currentBalance) || 0;
  const isNegative = currentNum < 0;
  const absDue = Math.abs(currentNum);

  // Suggested amounts
  const defaultAmount = isNegative ? Math.ceil(absDue + 200) : 500;
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const numAmount = parseFloat(amount) || 0;

  // Fee calculation: 1.9% for Card or Net Banking, 0% for UPI
  const isCardOrNetBanking = paymentMode === 'CARD' || paymentMode === 'NETBANKING';
  const feeRate = isCardOrNetBanking ? 0.019 : 0;
  const gatewayFee = isCardOrNetBanking ? parseFloat(((numAmount * 1.9) / 100).toFixed(2)) : 0;
  const totalPayable = parseFloat((numAmount + gatewayFee).toFixed(2));
  const projectedBalance = currentNum + numAmount;

  const handlePresetSelect = (val) => {
    setAmount(val.toString());
    setError('');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    if (numAmount < 10) {
      setError('Minimum recharge amount is ₹10.');
      return;
    }
    if (numAmount > 100000) {
      setError('Maximum single recharge is ₹1,00,000.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create recharge order with fee breakdown
      const orderRes = await walletAPI.createRechargeOrder({
        amount: numAmount,
        paymentMethod: paymentMode.toLowerCase(),
        gatewayFee,
        totalPayable
      });

      const orderData = orderRes.data;

      // 2. Simulate / verify checkout payment completion
      const simPaymentId = `PAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      const verifyRes = await walletAPI.verifyPayment({
        orderId: orderData.orderId,
        paymentId: simPaymentId,
        amount: numAmount,
        fee: gatewayFee,
        totalPaid: totalPayable,
        gateway: 'cashfree',
        paymentMode: paymentMode,
        signature: 'sim_verified_sig'
      });

      if (verifyRes.data && verifyRes.data.success) {
        setSuccessData({
          amount: numAmount,
          gatewayFee,
          totalPaid: totalPayable,
          paymentMode,
          newBalance: verifyRes.data.walletBalance,
          transactionId: verifyRes.data.transaction?.gatewayPaymentId || simPaymentId,
          date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });

        if (onSuccess) {
          onSuccess(verifyRes.data.walletBalance, numAmount);
        }
      } else {
        setError(verifyRes.data?.error || 'Payment verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Recharge Error:', err);
      setError(err.response?.data?.error || 'Failed to process payment. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 md:p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-black tracking-tight text-white">
                  Recharge Seller Wallet
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Instant Credit
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Top up balance to unlock COD &amp; Offline courier bookings
              </p>
            </div>
          </div>

          {/* Current Balance Ribbon */}
          <div className={`mt-4 p-3 rounded-2xl border flex items-center justify-between backdrop-blur-sm ${
            isNegative 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' 
              : 'bg-white/10 border-white/15 text-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              {isNegative ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium">
                {isNegative ? 'Outstanding Courier Dues:' : 'Current Active Balance:'}
              </span>
            </div>
            <span className={`text-base font-black tracking-tight ${isNegative ? 'text-rose-300' : 'text-emerald-400'}`}>
              {isNegative ? `-₹${absDue.toFixed(2)}` : `₹${currentNum.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5">
          {successData ? (
            /* Professional Receipt / Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Recharge Successful!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  ₹{successData.amount.toFixed(2)} has been credited instantly to your seller escrow balance.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-left space-y-2.5 text-xs shadow-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Credited to Wallet</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{successData.amount.toFixed(2)}</span>
                </div>
                {successData.gatewayFee > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Payment Gateway Fee (1.9%)</span>
                    <span className="font-bold text-amber-700">₹{successData.gatewayFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Amount Paid</span>
                  <span className="font-black text-blue-700 text-sm">₹{successData.totalPaid.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-slate-600">
                  <span>New Active Balance</span>
                  <span className="font-black text-emerald-600 text-base">₹{successData.newBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 pt-1 text-[11px]">
                  <span>Payment Reference</span>
                  <span className="font-mono text-slate-800 font-medium">{successData.transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled Instantly
                  </span>
                </div>
              </div>

              {isNegative && successData.newBalance >= 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold text-left">
                  🎉 Courier dues cleared! COD and Offline shipment bookings are now fully unlocked.
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
              >
                Done &amp; Continue
              </button>
            </div>
          ) : (
            /* Recharge Form */
            <form onSubmit={handlePay} className="space-y-5">
              {/* If Negative: Dues Clearing Presets */}
              {isNegative && (
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5">
                  <div className="text-xs font-black text-amber-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Recovery Recommendations:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetSelect(Math.ceil(absDue))}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition text-left flex flex-col ${
                        numAmount === Math.ceil(absDue)
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-800 border-amber-300 hover:bg-amber-100/50'
                      }`}
                    >
                      <span>Clear Exact Dues</span>
                      <span className="text-sm font-black mt-0.5">₹{Math.ceil(absDue)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect(Math.ceil(absDue + 500))}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition text-left flex flex-col ${
                        numAmount === Math.ceil(absDue + 500)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>Clear + ₹500 Topup</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-black">Best</span>
                      </span>
                      <span className="text-sm font-black mt-0.5">₹{Math.ceil(absDue + 500)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select or Enter Recharge Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 font-black text-xl text-slate-900 outline-none transition"
                  />
                </div>

                {/* Standard Preset Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {[200, 500, 1000, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        numAmount === preset
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Payment Method
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {paymentMode === 'UPI' ? 'Zero processing surcharge' : '1.9% gateway fee applies'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* 1. UPI Instant */}
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer relative overflow-hidden ${
                      paymentMode === 'UPI'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-black">UPI Instant</span>
                    <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100/90 border border-emerald-300/60 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Zero Fees
                    </span>
                  </button>

                  {/* 2. Debit / Credit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CARD')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer relative overflow-hidden ${
                      paymentMode === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-black">Debit / Card</span>
                    <span className="text-[9px] text-amber-800 font-extrabold bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.5 rounded-full">
                      +1.9% Fee
                    </span>
                  </button>

                  {/* 3. Net Banking */}
                  <button
                    type="button"
                    onClick={() => setPaymentMode('NETBANKING')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer relative overflow-hidden ${
                      paymentMode === 'NETBANKING'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-black">Net Banking</span>
                    <span className="text-[9px] text-amber-800 font-extrabold bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.5 rounded-full">
                      +1.9% Fee
                    </span>
                  </button>
                </div>
              </div>

              {/* Contextual Payment Details Panel */}
              {paymentMode === 'UPI' && (
                <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600">Supported UPI Applications:</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> 100% Free Instant Top-Up
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'CRED UPI'].map((app) => (
                      <span key={app} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {paymentMode === 'CARD' && (
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        A <span className="font-bold">1.9% gateway convenience fee (+₹{gatewayFee.toFixed(2)})</span> applies to Debit &amp; Credit Cards.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('UPI')}
                        className="mt-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-800 underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ Switch to UPI Instant to recharge with 0% Fee (Save ₹{gatewayFee.toFixed(2)})
                      </button>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Accepted Cards:</span>
                    <span className="font-semibold text-slate-700">Visa • Mastercard • RuPay • Maestro</span>
                  </div>
                </div>
              )}

              {paymentMode === 'NETBANKING' && (
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        A <span className="font-bold">1.9% banking gateway fee (+₹{gatewayFee.toFixed(2)})</span> is charged for Net Banking transactions.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('UPI')}
                        className="mt-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-800 underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ Switch to UPI Instant to save ₹{gatewayFee.toFixed(2)}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-600 mb-1.5">Select Your Bank:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            selectedBank === bank
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Institutional Summary Breakdown Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2.5 text-xs shadow-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Recharge Amount (Added to Wallet)</span>
                  <span className="font-black text-slate-900 text-sm">₹{numAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium flex items-center gap-1">
                    Payment Gateway Processing Fee
                    {isCardOrNetBanking && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                        1.9%
                      </span>
                    )}
                  </span>
                  {isCardOrNetBanking ? (
                    <span className="font-bold text-amber-700">
                      +₹{gatewayFee.toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                      FREE (₹0.00) <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Projected Active Balance</span>
                  <span className={`font-black text-xs ${projectedBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{projectedBalance.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-black text-sm text-slate-900 block">Total Payable Now</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isCardOrNetBanking ? 'Includes 1.9% gateway surcharge' : 'Zero surcharge via UPI'}
                    </span>
                  </div>
                  <span className="text-blue-700 font-black text-lg">
                    ₹{totalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Pay Button */}
              <button
                type="submit"
                disabled={loading || numAmount < 10}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-blue-200" />
                    <span>
                      Pay ₹{totalPayable.toFixed(2)} &amp; Recharge Instantly
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust & Compliance Footer */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium pt-1">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>RBI-Compliant Gateway</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Credit</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
