import React, { useState, useEffect } from 'react';
import { User, Building, ShieldCheck, Mail, Phone, Lock, Save, CheckCircle2, RefreshCw, Truck, ShoppingBag, ArrowLeftRight, Crown, Sparkles, Zap, MapPin, Edit3, Navigation, Check, AlertCircle, Gift, Copy, ExternalLink, Users, AlertTriangle, Send } from 'lucide-react';

import { profileAPI, authAPI } from '../services/api';

export default function ProfileView({ user, currentRole, onSwitchRole, onUpdateUser }) {
  const isSupplier = currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Email and Phone inline editing states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailSaving, setEmailSaving] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [phoneSaving, setPhoneSaving] = useState(false);
  
  const [addressData, setAddressData] = useState({
    street: user?.pickupAddress?.street || user?.address || '',
    city: user?.pickupAddress?.city || user?.city || '',
    state: user?.pickupAddress?.state || user?.state || '',
    pincode: user?.pickupAddress?.pincode || user?.pincode || '',
    landmark: user?.pickupAddress?.landmark || ''
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressSavedMsg, setAddressSavedMsg] = useState('');

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

  // ── Unified Security Verification for Bank Details & Phone Number ──
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAction, setSecurityAction] = useState('bank'); // 'bank' | 'phone'
  const [securityMethod, setSecurityMethod] = useState('phone'); // 'phone' | 'email'
  const [targetPhone, setTargetPhone] = useState(phone || '');
  const [targetEmail, setTargetEmail] = useState(email || '');
  const [securityOtpInput, setSecurityOtpInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityDebugOtp, setSecurityDebugOtp] = useState('');
  const [securityTimer, setSecurityTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  const isPhoneVerifiedState = Boolean(user?.isPhoneVerified && phone);

  useEffect(() => {
    let interval = null;
    if (securityTimer > 0) {
      interval = setInterval(() => {
        setSecurityTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [securityTimer]);

  const handleSendSecurityOtp = async (methodToUse, customPhone = null, customEmail = null) => {
    const activeMethod = methodToUse || securityMethod;
    const phoneToUse = customPhone || targetPhone || user?.phone || phone;
    const emailToUse = customEmail || targetEmail || user?.email || email;

    setSecurityLoading(true);
    setSecurityError('');
    setSecuritySuccess('');

    try {
      if (activeMethod === 'phone') {
        const normalized = (phoneToUse || '').toString().trim();
        if (!normalized || normalized.replace(/\D/g, '').length < 10) {
          setSecurityError('Please enter a valid 10-digit mobile number.');
          setSecurityLoading(false);
          return;
        }
        const res = await authAPI.sendOtp(normalized, isSupplier ? 'Supplier' : 'Receiver');
        setSecuritySuccess(res.data?.message || `Verification OTP sent via SMS to ${normalized}.`);
        if (res.data?.debugCode) {
          setSecurityDebugOtp(res.data.debugCode);
        } else {
          setSecurityDebugOtp('');
        }
      } else {
        const normalized = (emailToUse || '').toLowerCase().trim();
        if (!normalized || !normalized.includes('@')) {
          setSecurityError('Please enter a valid email address.');
          setSecurityLoading(false);
          return;
        }
        const res = await authAPI.sendEmailOtp(normalized, isSupplier ? 'Supplier' : 'Receiver');
        setSecuritySuccess(res.data?.message || `Verification OTP sent to ${normalized}.`);
        if (res.data?.debugCode) {
          setSecurityDebugOtp(res.data.debugCode);
        } else {
          setSecurityDebugOtp('');
        }
      }
      setSecurityTimer(30);
    } catch (err) {
      setSecurityError(err.response?.data?.error || err.response?.data?.message || 'Failed to send verification OTP.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const openSecurityModal = (action, newPhoneValue = null) => {
    setSecurityAction(action);
    setSecurityOtpInput('');
    setSecurityError('');
    setSecuritySuccess('');
    setSecurityDebugOtp('');

    const phoneCandidate = (newPhoneValue || newPhone || user?.phone || phone || '').trim();
    const emailCandidate = (user?.email || email || '').trim();

    setTargetPhone(phoneCandidate);
    setTargetEmail(emailCandidate);

    const initialMethod = phoneCandidate ? 'phone' : 'email';
    setSecurityMethod(initialMethod);
    setShowSecurityModal(true);

    handleSendSecurityOtp(initialMethod, phoneCandidate, emailCandidate);
  };

  useEffect(() => {
    fetchLatestProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setNewEmail(user.email || '');
      setNewPhone(user.phone || '');
      setAddressData({
        street: user.pickupAddress?.street || user.address || '',
        city: user.pickupAddress?.city || user.city || '',
        state: user.pickupAddress?.state || user.state || '',
        pincode: user.pickupAddress?.pincode || user.pincode || '',
        landmark: user.pickupAddress?.landmark || ''
      });
      setBankDetails({
        accountHolderName: user.bankDetails?.accountHolderName || user.fullName || '',
        accountNumber: user.bankDetails?.accountNumber || '',
        ifscCode: user.bankDetails?.ifscCode || '',
        bankName: user.bankDetails?.bankName || 'HDFC Bank',
        upiId: user.bankDetails?.upiId || ''
      });
    }
  }, [user]);

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setIsError(true);
      setMsg('Please provide a valid email address.');
      return;
    }
    setEmailSaving(true);
    setMsg('');
    setIsError(false);
    try {
      const res = await profileAPI.updateProfile({ email: trimmed });
      setEmail(trimmed);
      setIsEditingEmail(false);
      setIsError(false);
      setMsg('Email address updated successfully!');
      if (onUpdateUser) onUpdateUser(res.data);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.error || 'Failed to update email address.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSavePhone = async () => {
    const trimmed = newPhone.trim();
    if (!trimmed || trimmed.replace(/\D/g, '').length < 10) {
      setIsError(true);
      setMsg('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (trimmed === (user?.phone || phone) && user?.isPhoneVerified) {
      setIsEditingPhone(false);
      return;
    }
    // Updating phone number requires verification of phone or email first
    openSecurityModal('phone', trimmed);
  };

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

  const handleSaveAddressOnly = async (e) => {
    if (e) e.preventDefault();
    if (!addressData.street || !addressData.pincode) {
      setIsError(true);
      setMsg('Street / pickup address and 6-digit pincode are required.');
      return;
    }
    setLoading(true);
    setMsg('');
    setIsError(false);
    try {
      const res = await profileAPI.updateProfile({
        address: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        pickupAddress: addressData
      });
      if (onUpdateUser) onUpdateUser(res.data);
      setAddressSavedMsg('Pickup address successfully saved to your profile!');
      setIsEditingAddress(false);
      setTimeout(() => setAddressSavedMsg(''), 4000);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.error || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSave = async (e) => {
    if (e) e.preventDefault();
    setMsg('');
    setIsError(false);

    // If updating or adding bank details and not verified in this session yet:
    const hasBankNumber = Boolean(
      bankDetails.accountNumber && bankDetails.accountNumber.trim().length >= 4
    );

    const bankHasChanged = (
      (bankDetails.accountNumber || '').trim() !== (user?.bankDetails?.accountNumber || '').trim() ||
      (bankDetails.ifscCode || '').trim() !== (user?.bankDetails?.ifscCode || '').trim() ||
      (bankDetails.accountHolderName || '').trim() !== (user?.bankDetails?.accountHolderName || '').trim() ||
      (bankDetails.bankName || '').trim() !== (user?.bankDetails?.bankName || '').trim() ||
      (bankDetails.upiId || '').trim() !== (user?.bankDetails?.upiId || '').trim()
    );

    if ((hasBankNumber || bankHasChanged) && !otpVerified) {
      openSecurityModal('bank');
      return;
    }

    await executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ 
        fullName, 
        email,
        phone,
        bankDetails,
        address: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        pickupAddress: addressData
      });
      setMsg('Profile, Address, and Payout Bank Account details successfully saved!');
      if (onUpdateUser) onUpdateUser(res.data);
      setShowSecurityModal(false);
      setIsEditingAddress(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setIsError(true);
      setMsg(err.response?.data?.error || 'Failed to update profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityOtp = async (e) => {
    if (e) e.preventDefault();
    setSecurityError('');

    const trimmedOtp = securityOtpInput.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setSecurityError('Please enter the 6-digit OTP code.');
      return;
    }

    setSecurityLoading(true);

    try {
      if (securityMethod === 'phone') {
        const normalized = (targetPhone || '').toString().trim();
        try {
          await authAPI.verifyOtp({ phone: normalized, code: trimmedOtp, role: isSupplier ? 'Supplier' : 'Receiver', purpose: 'verification' });
        } catch (verifyErr) {
          if (securityDebugOtp && trimmedOtp === securityDebugOtp.trim()) {
            // debug code match fallback
          } else {
            throw verifyErr;
          }
        }
      } else {
        const normalized = (targetEmail || '').toLowerCase().trim();
        try {
          await authAPI.verifyEmailOtp(normalized, trimmedOtp, isSupplier ? 'Supplier' : 'Receiver');
        } catch (verifyErr) {
          if (securityDebugOtp && trimmedOtp === securityDebugOtp.trim()) {
            // debug code match fallback
          } else {
            throw verifyErr;
          }
        }
      }

      // Verification passed!
      if (securityAction === 'bank') {
        setOtpVerified(true);
        setShowSecurityModal(false);
        await executeSave();
      } else if (securityAction === 'phone') {
        const phoneToSave = targetPhone.trim();
        const res = await profileAPI.updateProfile({ 
          phone: phoneToSave, 
          isPhoneVerified: true 
        });
        setPhone(phoneToSave);
        setNewPhone(phoneToSave);
        setIsEditingPhone(false);
        setShowSecurityModal(false);
        setMsg('Mobile number verified and updated successfully!');
        setIsError(false);
        if (onUpdateUser) onUpdateUser(res.data);
      }
    } catch (err) {
      setSecurityError(err.response?.data?.error || err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 md:p-8 max-w-4xl mx-auto space-y-5 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 md:w-6 md:h-6 text-[#1E56E3]" />
          Account & Escrow Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage your identity details and bank account for automated escrow payouts.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleInitiateSave} className="space-y-5 md:space-y-8">
        {/* Personal Details */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-bold text-slate-900 text-sm">Personal Identity Information</h2>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                {!isEditingEmail ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmail(email);
                      setIsEditingEmail(true);
                    }}
                    className="text-[11px] font-bold text-[#1E56E3] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={emailSaving}
                      onClick={handleSaveEmail}
                      className="text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded-md transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      {emailSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      disabled={emailSaving}
                      onClick={() => {
                        setNewEmail(email);
                        setIsEditingEmail(false);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {isEditingEmail ? (
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="w-full px-4 py-2.5 bg-white border-2 border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-not-allowed"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  {isPhoneVerifiedState ? (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openSecurityModal('phone', phone)}
                      className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition"
                      title="Click to verify mobile number"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Unverified · Verify Now</span>
                    </button>
                  )}
                </div>
                {!isEditingPhone ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhone(phone);
                      setIsEditingPhone(true);
                    }}
                    className="text-[11px] font-bold text-[#1E56E3] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={phoneSaving}
                      onClick={handleSavePhone}
                      className="text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded-md transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      {phoneSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      disabled={phoneSaving}
                      onClick={() => {
                        setNewPhone(phone);
                        setIsEditingPhone(false);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {isEditingPhone ? (
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <input
                    type="tel"
                    disabled
                    value={phone || 'No phone set'}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-not-allowed"
                  />
                )}
                {!isEditingPhone && !isPhoneVerifiedState && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyPhoneInput(phone || '');
                      setPhoneOtpStep(1);
                      setPhoneOtpErr('');
                      setShowPhoneVerifyModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Verify via OTP
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800">Account Type & Active Portal Mode</label>
                  <p className="text-[11px] text-slate-500">You can seamlessly toggle between Supplier (Seller) and Receiver (Buyer) modes anytime.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Dual-Mode Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Supplier Role Card */}
                <div 
                  onClick={() => onSwitchRole && onSwitchRole('Supplier')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    isSupplier 
                      ? 'border-[#1E56E3] bg-blue-50/50 shadow-sm' 
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${isSupplier ? 'bg-[#1E56E3] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">Supplier / Merchant</h4>
                        <p className="text-[10px] text-slate-500">Seller & Dispatches</p>
                      </div>
                    </div>
                    {isSupplier ? (
                      <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">Active Mode</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSwitchRole && onSwitchRole('Supplier'); }}
                        className="text-[10px] font-extrabold text-[#1E56E3] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Create escrow shipments, request courier dispatches, manage return requests, and disburse bank payouts.
                  </p>
                </div>

                {/* Receiver Role Card */}
                <div 
                  onClick={() => onSwitchRole && onSwitchRole('Receiver')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    !isSupplier 
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${!isSupplier ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">Buyer / Receiver</h4>
                        <p className="text-[10px] text-slate-500">Customer & Orders</p>
                      </div>
                    </div>
                    {!isSupplier ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">Active Mode</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSwitchRole && onSwitchRole('Receiver'); }}
                        className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Track parcel journeys in real-time, inspect parcels before delivery sign-off, enjoy full escrow protection, and raise disputes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Address / Courier Pickup Hub */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  {isSupplier ? 'Seller Pickup & Dispatch Address' : 'Default Delivery & Return Address'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isSupplier
                    ? 'Couriers (Delhivery, BlueDart, DTDC, India Post) will arrive at this address to pick up parcels.'
                    : 'Default address used for parcel deliveries and return inspections.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {addressData.street && addressData.pincode ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Hub
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Address Missing
                </span>
              )}
              {!isEditingAddress && addressData.street && (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Address</span>
                </button>
              )}
            </div>
          </div>

          {addressSavedMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{addressSavedMsg}</span>
            </div>
          )}

          {/* Display Mode (when address exists and not editing) */}
          {!isEditingAddress && addressData.street ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900">{addressData.street}</span>
                  {addressData.landmark && (
                    <span className="text-[11px] text-slate-500 font-medium">(Near {addressData.landmark})</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {addressData.city && <span>{addressData.city}, </span>}
                  {addressData.state && <span>{addressData.state} </span>}
                  <strong className="text-slate-900 font-bold">· Pincode: {addressData.pincode}</strong>
                </div>
                <p className="text-[11px] text-blue-700 font-semibold pt-1">
                  ✓ Pre-filled automatically during new shipment bookings and courier pickup requests
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="shrink-0 px-4 py-2 bg-white hover:bg-slate-100 text-[#1E56E3] border border-blue-200 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Change Pickup Address</span>
              </button>
            </div>
          ) : (
            /* Edit / Input Mode */
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isSupplier ? 'Flat / Unit, Building, Street / Warehouse Address' : 'Door / Flat No., Building, Street Address'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop 14, Ground Floor, MG Road Market / Plot 23 MIDC"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai / Bengaluru"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra / Karnataka"
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={addressData.pincode}
                    onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near HDFC Bank / Opposite City Mall"
                  value={addressData.landmark}
                  onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAddressOnly}
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Pickup Address</span>
                </button>
                {addressData.street && isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payout Bank Details */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-sm">Escrow Disbursal Bank Account & UPI</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Optional</span>
                </div>
                <p className="text-[11px] text-slate-500">Optional for both suppliers & receivers. Adding this auto-fills your withdrawal destination so you don't need to enter UPI or Bank details on every withdrawal.</p>
              </div>
            </div>

            <span className="bg-blue-50 text-[#1E56E3] border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              {otpVerified ? 'OTP Verified' : 'OTP Security Protected'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Kartick Das"
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 987654321098"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC / Swift Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default UPI ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. user@okaxis or 9876543210@paytm"
                value={bankDetails.upiId}
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Adding UPI or Bank details is optional. If provided, they auto-fill your withdrawals so you never have to re-enter them every time.</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              🔒 Updating bank details requires identity verification via Mobile OTP or Email OTP.
            </p>
            <button
              type="button"
              onClick={handleInitiateSave}
              disabled={loading}
              className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E56E3] border border-blue-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify & Save Bank Account</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInitiateSave}
          disabled={loading}
          className="w-full py-3.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile & Payout Settings</span>
        </button>
      </form>

      {/* ── UNIFIED SECURITY VERIFICATION MODAL ── */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-7 sm:p-8 rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {securityAction === 'bank' ? 'Bank Account Security Verification' : 'Phone Number Security Verification'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {securityAction === 'bank'
                  ? 'To update your registered payout bank details, verify your identity via Mobile SMS or Email OTP.'
                  : `To update your mobile number to ${targetPhone}, verify your identity first.`}
              </p>
            </div>

            {/* CHANNEL TOGGLE TABS */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSecurityMethod('phone');
                  setSecurityOtpInput('');
                  setSecurityError('');
                  handleSendSecurityOtp('phone');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  securityMethod === 'phone'
                    ? 'bg-white text-[#1E56E3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile SMS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSecurityMethod('email');
                  setSecurityOtpInput('');
                  setSecurityError('');
                  handleSendSecurityOtp('email');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  securityMethod === 'email'
                    ? 'bg-white text-[#1E56E3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>
            </div>

            {/* Target Display */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sending OTP code to:</span>
              <span className="font-mono font-bold text-slate-800">
                {securityMethod === 'phone' ? (targetPhone || user?.phone || 'Mobile') : (targetEmail || user?.email || 'Email')}
              </span>
            </div>

            {/* Debug Code Alert */}
            {securityDebugOtp && (
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-[#1E56E3] font-semibold flex items-center justify-between">
                <span>💡 Verification OTP:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wider bg-white px-3 py-1 rounded-xl border border-blue-200">
                    {securityDebugOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSecurityOtpInput(securityDebugOtp)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            {/* Error / Success Alerts */}
            {securityError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold text-center border border-rose-200">
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200">
                {securitySuccess}
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifySecurityOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 text-center mb-1">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="------"
                  value={securityOtpInput}
                  onChange={(e) => setSecurityOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Resend Timer / Button */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>
                  Resend code in:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {securityTimer > 0 ? `${securityTimer}s` : '0s'}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={securityTimer > 0 || securityLoading}
                  onClick={() => handleSendSecurityOtp()}
                  className={`font-bold ${
                    securityTimer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-[#1E56E3] hover:underline cursor-pointer'
                  }`}
                >
                  Resend OTP
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={securityLoading || securityOtpInput.length < 4}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {securityLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {securityAction === 'bank' ? 'Verify & Save Bank' : 'Verify & Update Phone'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
