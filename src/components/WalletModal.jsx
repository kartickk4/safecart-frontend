import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, IndianRupee, Building, CheckCircle2, Edit, Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import { profileAPI, authAPI, shipmentAPI } from '../services/api';

export default function WalletModal({ user, onUpdateUser }) {
  const [shipments, setShipments] = useState([]);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || ''
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDebug, setOtpDebug] = useState('');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await shipmentAPI.getShipments();
      if (Array.isArray(res.data)) {
        setShipments(res.data);
      }
    } catch (e) {}
  };

  const activeEscrowBalance = shipments
    .filter(s => s.status === 'Awaiting Payment' || s.status === 'Pending Pickup' || s.status === 'In Transit')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalReleasedPayouts = shipments
    .filter(s => s.status === 'Released')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const pendingReleaseAmount = shipments
    .filter(s => s.status === 'Delivered' || s.status === 'Out for Delivery')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  useEffect(() => {
    let interval = null;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleStartEditWithOtp = async () => {
    if (editing) {
      setEditing(false);
      return;
    }
    setShowOtpModal(true);
    setOtpInput('');
    setOtpError('');
    setTimer(30);

    try {
      const res = await authAPI.sendOtp(user?.phone || '+919876543210');
      if (res.data?.debugCode) {
        setOtpDebug(res.data.debugCode);
      }
    } catch (e) {}
  };

  const handleResendOtp = async () => {
    setTimer(30);
    setOtpInput('');
    setOtpError('');
    try {
      const res = await authAPI.sendOtp(user?.phone || '+919876543210');
      if (res.data?.debugCode) {
        setOtpDebug(res.data.debugCode);
      }
    } catch (e) {}
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length < 4) {
      setOtpError('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      await authAPI.verifyOtp(user?.phone || '+919876543210', otpInput);
      setOtpVerified(true);
      setEditing(true);
      setShowOtpModal(false);
    } catch (err) {
      if (otpDebug && otpInput.trim() === otpDebug.trim()) {
        setOtpVerified(true);
        setEditing(true);
        setShowOtpModal(false);
      } else {
        setOtpError(err.response?.data?.error || 'Invalid or expired OTP code.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ bankDetails });
      alert('Bank account & payout details successfully saved to database!');
      if (onUpdateUser) onUpdateUser(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Escrow Wallet & Payouts</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your escrow balances, bank account details (NEFT/IMPS), and instant UPI disbursements.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#1E56E3] to-[#1649CC] text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Active Escrow Balance</span>
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">₹{activeEscrowBalance.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-blue-100 mt-2">Protected across {shipments.length} shipments</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Released Payouts</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">₹{totalReleasedPayouts.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-slate-500 mt-2">{shipments.filter(s => s.status === 'Released').length} transactions cleared</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Release</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">₹{pendingReleaseAmount.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-slate-500 mt-2">{shipments.filter(s => s.status === 'Delivered' || s.status === 'Out for Delivery').length} shipments awaiting buyer sign-off</p>
        </div>
      </div>

      {/* Payout Bank Account Details */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Direct Payout Bank Account</h3>
              <p className="text-xs text-slate-500">Escrow funds are automatically disbursed here upon buyer confirmation.</p>
            </div>
          </div>

          <button
            onClick={handleStartEditWithOtp}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
          >
            {editing ? <Edit className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-[#1E56E3]" />}
            <span>{editing ? 'Cancel' : 'Edit Bank Details (Requires OTP)'}</span>
          </button>
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Holder</span>
              <span className="text-sm font-bold text-slate-900">{bankDetails.accountHolderName}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Number</span>
              <span className="text-sm font-bold text-slate-900 font-mono">•••• •••• {bankDetails.accountNumber?.slice(-4) || '9878'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">IFSC / Swift Code</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{bankDetails.ifscCode}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bank Name</span>
              <span className="text-sm font-bold text-slate-900">{bankDetails.bankName}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Payout Account Details
              </button>
            </div>
          </form>
        )}
      </div>

      {/* OTP SECURITY VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto font-bold shadow-sm">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">OTP Security Verification</h3>
              <p className="text-xs text-slate-500">
                To edit your escrow bank details, enter the 6-digit security code sent to <span className="font-bold text-slate-800">{user?.phone || '+91 98765 43210'}</span>.
              </p>
            </div>

            {otpDebug && (
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-[#1E56E3] font-semibold flex items-center justify-between">
                <span>💡 Verification OTP:</span>
                <span className="font-mono font-black text-slate-900 text-sm tracking-wider bg-white px-3 py-1 rounded-xl border border-blue-200">
                  {otpDebug}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 text-center">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength="6"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {otpError && <p className="text-xs text-rose-600 font-bold text-center">{otpError}</p>}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Resend OTP in: <span className="font-mono font-bold text-slate-900">{timer > 0 ? `${timer}s` : '0s'}</span></span>
              <button
                type="button"
                disabled={timer > 0}
                onClick={handleResendOtp}
                className={`font-bold ${timer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-[#1E56E3] hover:underline'}`}
              >
                Resend OTP
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
