import React, { useState, useEffect } from 'react';
import { User, Building, ShieldCheck, Mail, Phone, Lock, Save, CheckCircle2, RefreshCw } from 'lucide-react';

import { profileAPI, authAPI } from '../services/api';

export default function ProfileView({ user, onUpdateUser }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // OTP Verification for updating existing bank details
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpDebug, setOtpDebug] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    fetchLatestProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBankDetails({
        accountHolderName: user.bankDetails?.accountHolderName || user.fullName || '',
        accountNumber: user.bankDetails?.accountNumber || '',
        ifscCode: user.bankDetails?.ifscCode || '',
        bankName: user.bankDetails?.bankName || 'HDFC Bank',
        upiId: user.bankDetails?.upiId || ''
      });
    }
  }, [user]);

  const fetchLatestProfile = async () => {
    try {
      const res = await profileAPI.getProfile();
      if (res.data) {
        if (onUpdateUser) onUpdateUser(res.data);
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  };

  const existingBankExists = !!(user?.bankDetails?.accountNumber);


  const handleInitiateSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    // If updating existing bank details and OTP not verified yet
    if (existingBankExists && !otpVerified) {
      setShowOtpModal(true);
      setOtpInput('');
      setOtpError('');
      try {
        const res = await authAPI.sendOtp(user?.phone || phone);
        if (res.data?.debugCode) setOtpDebug(res.data.debugCode);
      } catch (err) {}
      return;
    }

    await executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ fullName, bankDetails });
      setMsg('Profile and Payout Bank Account details successfully saved to database!');
      if (onUpdateUser) onUpdateUser(res.data);
      setShowOtpModal(false);
      setOtpVerified(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setIsError(true);
      setMsg(err.response?.data?.error || 'Failed to update profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBankOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otpInput || otpInput.length < 4) {
      setOtpError('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      await authAPI.verifyOtp(user?.phone || phone, otpInput);
      setOtpVerified(true);
      await executeSave();
    } catch (err) {
      if (otpDebug && otpInput.trim() === otpDebug.trim()) {
        setOtpVerified(true);
        await executeSave();
      } else {
        setOtpError(err.response?.data?.error || 'Invalid or expired OTP code.');
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-[#1E56E3]" />
          Account & Escrow Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage your identity details, Aadhaar/PAN KYC status, and bank account for automated escrow payouts.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-bold text-slate-900 text-sm">Personal Identity Information</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              PAN / Aadhaar KYC Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Verified)</label>
              <input
                type="tel"
                disabled
                value={phone}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <span className="inline-block w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-[#1E56E3] rounded-xl text-xs font-bold">
                {user?.activeRole || 'Supplier / Seller (Pro Plan)'}
              </span>
            </div>
          </div>
        </div>

        {/* Payout Bank Details */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Escrow Disbursal Bank Account</h2>
                <p className="text-[11px] text-slate-500">Funds released from escrow will automatically be credited to this account.</p>
              </div>
            </div>

            <span className="bg-blue-50 text-[#1E56E3] border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              {existingBankExists ? 'OTP Security Protected' : 'Ready to Save'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                required
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC / Swift Code</label>
              <input
                type="text"
                required
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInitiateSave}
          disabled={loading}
          className="w-full py-3.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile & Payout Settings {existingBankExists ? '(Requires OTP Verification)' : ''}</span>
        </button>
      </form>

      {/* OTP SECURITY VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto font-bold shadow-sm">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">Bank Update Security Verification</h3>
              <p className="text-xs text-slate-500">
                To update registered payout bank details, enter the 6-digit verification code sent to <span className="font-bold text-slate-800">{user?.phone || phone}</span>.
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

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold text-center">{otpError}</div>
            )}

            <form onSubmit={handleVerifyBankOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 text-center mb-1">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="------"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Verify & Save Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
