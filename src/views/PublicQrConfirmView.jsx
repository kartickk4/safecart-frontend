import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Package, Phone, ShieldCheck, AlertTriangle,
  Loader2, Clock, Lock, KeyRound, RotateCcw, ArrowRight,
  MessageSquare, RefreshCw, ChevronRight, Check, Sparkles, HelpCircle,
  AlertCircle, ShieldAlert, ArrowLeft, Camera, CreditCard, Building2,
  Upload, X, Image as ImageIcon, CheckCircle, Gift
} from 'lucide-react';
import { shipmentAPI } from '../services/api';
import { uploadImageToHost } from '../services/imageUpload';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ConfirmedWithCashback from '../components/ConfirmedWithCashback';

export default function PublicQrConfirmView({ qrToken }) {
  // ── Component State ────────────────────────────────────────────────────────
  const [token, setToken] = useState(qrToken || '');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [parcelInfo, setParcelInfo] = useState(null);
  const [infoError, setInfoError] = useState('');

  // Step 1: Phone input
  const [phoneInput, setPhoneInput] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Step 2: OTP & Decision
  const [step, setStep] = useState('phone'); // 'phone' | 'otp_and_action' | 'confirmed' | 'returned'
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [actionChoice, setActionChoice] = useState('confirm'); // 'confirm' | 'return'
  const [returnWindowChoice, setReturnWindowChoice] = useState('keep_open_24h'); // 'keep_open_24h' | 'confirm_and_close'

  // ── 3-Option Return System State ──
  const [returnType, setReturnType] = useState('replacement'); // 'replacement' | 'partial_discount' | 'full_refund'
  const [returnReason, setReturnReason] = useState('Defective / Damaged product received');
  const [returnComments, setReturnComments] = useState('');

  // Option 2: Partial Discount evidence
  const [defectPhoto, setDefectPhoto] = useState('');
  const [uploadingDefectPhoto, setUploadingDefectPhoto] = useState(false);
  const [defectDescription, setDefectDescription] = useState('');

  // Option 3: Full Refund payout details
  const [refundMethod, setRefundMethod] = useState('upi'); // 'upi' | 'bank'
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Result state
  const [resultData, setResultData] = useState(null);

  // Resend OTP countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Return already applied auto-redirect countdown (5s)
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Auto-redirect to return tracking if return is already applied
  useEffect(() => {
    if (step !== 'return_already_applied') return;
    if (redirectCountdown <= 0) {
      const targetId = parcelInfo?.shipmentId;
      if (targetId && typeof window !== 'undefined') {
        window.location.href = `/tracking?id=${encodeURIComponent(targetId)}&tab=return`;
      }
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, redirectCountdown, parcelInfo?.shipmentId]);

  // ── Load parcel info from QR token on mount ────────────────────────────────
  useEffect(() => {
    // If qrToken was not passed as prop, try to parse from URL pathname or search
    let resolvedToken = qrToken;
    if (!resolvedToken && typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/qr-confirm\/([^/]+)/);
      if (match && match[1]) {
        resolvedToken = decodeURIComponent(match[1]);
      } else {
        const search = new URLSearchParams(window.location.search);
        resolvedToken = search.get('qr') || '';
      }
    }

    if (resolvedToken) {
      setToken(resolvedToken);
      fetchQrInfo(resolvedToken);
    } else {
      setLoadingInfo(false);
      setInfoError('Missing QR token. Please scan the QR label inside your package.');
    }
  }, [qrToken]);

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const fetchQrInfo = async (tkn) => {
    setLoadingInfo(true);
    setInfoError('');
    try {
      const res = await shipmentAPI.publicQrGetInfo(tkn);
      setParcelInfo(res.data);
      if (res.data?.isReplacement) {
        if (res.data?.inboxQrUsed || res.data?.deliveryConfirmed) {
          setStep('already_confirmed');
        } else {
          setStep('phone');
        }
        return;
      }
      const isReturnApplied = Boolean(
        res.data?.status === 'Return Requested' ||
        res.data?.returnRequested ||
        res.data?.returnStatus === 'Requested' ||
        res.data?.returnStatus === 'Approved' ||
        res.data?.status === 'Return In Transit' ||
        res.data?.status === 'Returned & Refunded'
      );
      if (isReturnApplied) {
        setStep('return_already_applied');
      } else if (res.data?.inboxQrUsed) {
        setStep('already_confirmed');
      }
    } catch (err) {
      console.warn('Failed to fetch QR info:', err);
      const serverMsg = err.response?.data?.error;
      const netMsg = err.code === 'ERR_NETWORK' || !err.response
        ? 'Cannot reach backend server. Please verify your internet connection or ensure your mobile phone and PC are on the same Wi-Fi network.'
        : null;
      setInfoError(serverMsg || netMsg || 'Invalid or expired QR code. Please verify the code inside the package.');
    } finally {
      setLoadingInfo(false);
    }
  };

  // ── STEP 1: Verify Phone & Send OTP ────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');

    const clean = phoneInput.trim().replace(/\D/g, '');
    if (!clean) {
      setPhoneError('Please enter your 10-digit registered mobile number or last 4 digits.');
      return;
    }
    if (clean.length !== 10 && clean.length !== 4) {
      setPhoneError('Please enter either your full 10-digit number or just the last 4 digits.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await shipmentAPI.publicQrSendOtp(token, { phone: clean });
      if (res.data?.success) {
        if (res.data._devOtp) {
          setDevOtp(res.data._devOtp);
        }
        if (res.data.shipment) {
          setParcelInfo(prev => ({ ...(prev || {}), ...res.data.shipment }));
        }
        setStep('otp_and_action');
        setResendCooldown(45);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setPhoneError(err.response?.data?.error || 'Failed to send OTP. Please check your number.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    setActionError('');
    try {
      const clean = phoneInput.trim().replace(/\D/g, '');
      const res = await shipmentAPI.publicQrSendOtp(token, { phone: clean });
      if (res.data?.success) {
        if (res.data._devOtp) setDevOtp(res.data._devOtp);
        setResendCooldown(45);
        alert('A new OTP has been sent to your registered phone number.');
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── STEP 2: Submit Decision (Confirm or Return) with verified OTP ──────────
  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setActionError('');

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setActionError('Please enter the 6-digit OTP received on your mobile phone.');
      return;
    }

    if (actionChoice === 'return') {
      if (!returnReason.trim()) {
        setActionError('Please select a reason for returning the parcel.');
        return;
      }

      if (!defectPhoto) {
        setActionError('Uploading photo proof of the package/item is mandatory for refund, partial return, and replacement requests.');
        return;
      }

      if (returnType === 'full_refund') {
        if (refundMethod === 'upi') {
          if (!upiId.trim() || !upiId.includes('@')) {
            setActionError('Please provide a valid UPI ID (e.g. mobile@upi or name@okaxis) to receive your escrow refund.');
            return;
          }
        } else {
          if (!accountHolderName.trim()) {
            setActionError('Please enter Account Holder Name for bank payout.');
            return;
          }
          if (!accountNumber.trim() || accountNumber.trim().length < 6) {
            setActionError('Please enter a valid bank account number (minimum 6 digits).');
            return;
          }
          if (accountNumber.trim() !== confirmAccountNumber.trim()) {
            setActionError('Bank account numbers do not match. Please re-enter.');
            return;
          }
          if (!ifscCode.trim() || ifscCode.trim().length < 5) {
            setActionError('Please enter a valid IFSC code (e.g. HDFC0001234).');
            return;
          }
        }
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        phone: phoneInput.trim().replace(/\D/g, ''),
        otp: cleanOtp,
        action: actionChoice,
        ...(actionChoice === 'confirm' ? {
          choice: returnWindowChoice
        } : {
          returnReason: returnReason,
          returnType: returnType,
          comments: returnComments.trim(),
          defectPhotoUrl: defectPhoto || '',
          defectDescription: defectDescription || returnComments.trim() || '',
          bankDetails: returnType === 'full_refund' ? {
            accountHolderName: accountHolderName.trim() || parcelInfo?.receiverName || '',
            accountNumber: refundMethod === 'bank' ? accountNumber.trim() : '',
            ifscCode: refundMethod === 'bank' ? ifscCode.trim().toUpperCase() : '',
            bankName: refundMethod === 'bank' ? bankName.trim() : '',
            upiId: refundMethod === 'upi' ? upiId.trim() : ''
          } : null
        })
      };

      const res = await shipmentAPI.publicQrConfirm(token, payload);
      if (res.data?.success) {
        setResultData(res.data);
        if (actionChoice === 'confirm') {
          setStep('confirmed');
        } else {
          setStep('returned');
        }
      }
    } catch (err) {
      console.error('Submit Action error:', err);
      setActionError(err.response?.data?.error || 'Failed to process your request. Please check the OTP and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── RENDER HELPERS ─────────────────────────────────────────────────────────

  // Loading initial QR state
  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Verifying Parcel QR Code</h2>
          <p className="text-xs text-slate-500">Connecting to SecureKaro Escrow Network to load your order details...</p>
        </div>
      </div>
    );
  }

  // QR Code invalid or error
  if (infoError && !parcelInfo) {
    const isNetworkErr = infoError.toLowerCase().includes('cannot reach') || infoError.toLowerCase().includes('connect') || infoError.toLowerCase().includes('network');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-5">
          <div className={`w-14 h-14 rounded-2xl ${isNetworkErr ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center mx-auto`}>
            {isNetworkErr ? <RefreshCw className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isNetworkErr ? 'Connection Issue' : 'Invalid or Expired QR Code'}
            </h2>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{infoError}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-left space-y-1">
            <p className="font-bold text-slate-800">{isNetworkErr ? 'Troubleshooting tips:' : 'Need assistance?'}</p>
            {isNetworkErr ? (
              <>
                <p>1. Ensure your phone and computer are connected to the same Wi-Fi.</p>
                <p>2. Keep this tab open and click Retry below.</p>
              </>
            ) : (
              <>
                <p>1. Check if the QR code was scanned clearly from inside the parcel box.</p>
                <p>2. If you have an account, log in to your buyer portal to confirm delivery or track parcel.</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (token) fetchQrInfo(token);
              }}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <a
              href="/"
              className="flex-1 py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition flex items-center justify-center"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Already confirmed state
  if (step === 'already_confirmed') {
    const isReturnAlreadyApplied = Boolean(
      parcelInfo?.status === 'Return Requested' ||
      parcelInfo?.returnRequested === true ||
      parcelInfo?.returnStatus === 'Requested' ||
      parcelInfo?.returnStatus === 'Approved' ||
      parcelInfo?.status === 'Return In Transit' ||
      parcelInfo?.status === 'Returned & Refunded'
    );

    const isRefundCompleted = Boolean(
      parcelInfo?.status === 'Returned & Refunded' ||
      parcelInfo?.returnStatus === 'Returned & Refunded' ||
      parcelInfo?.returnStatus === 'Completed' ||
      parcelInfo?.status === 'Returned & Restocked'
    );

    const isWindowOpen = !isReturnAlreadyApplied &&
      parcelInfo?.returnAllowed !== false &&
      !parcelInfo?.returnWindowClosed &&
      (!parcelInfo?.returnWindowExpiresAt || new Date() < new Date(parcelInfo?.returnWindowExpiresAt)) &&
      !['Released', 'Cancelled', 'Returned & Refunded', 'Return Requested', 'Return In Transit'].includes(parcelInfo?.status);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-block mb-2">
              Already Signed Off
            </span>
            <h2 className="text-xl font-black text-slate-900">Delivery Already Confirmed</h2>
            <p className="text-xs text-slate-500 mt-2">
              This parcel delivery was verified and confirmed on:
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1 font-mono">
              {parcelInfo?.inboxQrConfirmedAt ? new Date(parcelInfo.inboxQrConfirmedAt).toLocaleString('en-IN') : 'Previously'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Tracking ID:</span>
              <span className="font-bold text-slate-900 font-mono">{parcelInfo?.shipmentId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Item:</span>
              <span className="font-bold text-slate-900">{parcelInfo?.description}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Escrow Value:</span>
              <span className="font-extrabold text-emerald-700 font-mono">₹{parcelInfo?.amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Return Already Applied State Banner */}
          {isReturnAlreadyApplied && (
            <div className={`p-4 rounded-2xl text-left space-y-3 shadow-xs border ${
              isRefundCompleted
                ? 'bg-emerald-50/90 border-emerald-300'
                : 'bg-amber-50/90 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black flex items-center gap-1.5 ${
                  isRefundCompleted ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                  {isRefundCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <RotateCcw className="w-4 h-4 text-amber-600" />}
                  {isRefundCompleted ? 'Refund Completed ✓' : 'Return Already Applied'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isRefundCompleted ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isRefundCompleted ? '100% Refunded' : (parcelInfo?.returnStatus || parcelInfo?.status || 'Requested')}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isRefundCompleted ? 'text-emerald-800' : 'text-amber-800'}`}>
                {isRefundCompleted
                  ? '100% of escrow funds have been successfully refunded to your buyer wallet.'
                  : 'A return request has already been filed for this package. Your escrow payment is safely locked under Escrow protection.'}
              </p>
              <div className={`p-3 bg-white rounded-xl text-xs space-y-1.5 border ${
                isRefundCompleted ? 'border-emerald-200' : 'border-amber-200'
              }`}>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Resolution Chosen:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {parcelInfo?.returnType === 'replacement' ? '🔄 1. Replacement' : parcelInfo?.returnType === 'partial_discount' ? '🏷️ 2. Partial Refund' : '💰 3. Full Refund'}
                  </span>
                </div>
                {parcelInfo?.returnReason && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Reason:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">{parcelInfo.returnReason}</span>
                  </div>
                )}
                {isRefundCompleted && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Refund Status:</span>
                    <span className="font-bold text-emerald-700">Credited to Wallet</span>
                  </div>
                )}
              </div>
              <a
                href={`/tracking?id=${encodeURIComponent(parcelInfo?.shipmentId || '')}&tab=return`}
                className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRefundCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isRefundCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{isRefundCompleted ? 'Refund Completed • View Details' : 'View Live Return Status & Tracking'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Active 24-Hour Return Window Card with 3 Options */}
          {isWindowOpen && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  24-Hour Return Window Active
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  3 Options Available
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Found an issue with the product? You are protected under Escrow and can choose any of the 3 return resolutions:
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10.5px] font-bold text-slate-800">
                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center shadow-xs">
                  <div className="text-base">🔄</div>
                  <div className="mt-0.5">1. Replacement</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center shadow-xs">
                  <div className="text-base">🏷️</div>
                  <div className="mt-0.5">2. Partial Refund</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-amber-200 text-center shadow-xs">
                  <div className="text-base">💰</div>
                  <div className="mt-0.5">3. Full Refund</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionChoice('return');
                  setStep('phone');
                  setActionError('');
                }}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>File Return / Resolution Request</span>
              </button>
            </div>
          )}

          <a
            href="/"
            className="w-full py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition block"
          >
            Access Buyer Escrow Portal
          </a>
        </div>
      </div>
    );
  }

  // Return already applied dedicated screen with auto-redirect
  if (step === 'return_already_applied') {
    const isRefundCompleted = Boolean(
      parcelInfo?.status === 'Returned & Refunded' ||
      parcelInfo?.returnStatus === 'Returned & Refunded' ||
      parcelInfo?.returnStatus === 'Completed' ||
      parcelInfo?.status === 'Returned & Restocked'
    );
    const chosenType = parcelInfo?.returnType || returnType || 'full_refund';
    const typeLabel = chosenType === 'replacement'
      ? '1. Replacement'
      : chosenType === 'partial_discount'
      ? '2. Discounted Price / Partial Refund'
      : '3. Full Refund';
    const typeEmoji = chosenType === 'replacement' ? '🔄' : chosenType === 'partial_discount' ? '🏷️' : '💰';

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isRefundCompleted
          ? 'bg-gradient-to-b from-emerald-50/70 via-white to-slate-50'
          : 'bg-gradient-to-b from-amber-50/70 via-white to-slate-50'
      }`}>
        <div className={`bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 border ${
          isRefundCompleted ? 'border-emerald-200/90' : 'border-amber-200/90'
        }`}>
          <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center mx-auto shadow-lg ${
            isRefundCompleted ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-amber-500 shadow-amber-500/30'
          }`}>
            {isRefundCompleted ? <CheckCircle2 className="w-9 h-9" /> : <RotateCcw className="w-9 h-9" />}
          </div>

          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold mb-2 border ${
              isRefundCompleted
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}>
              {isRefundCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />}
              <span>{isRefundCompleted ? 'Refund Completed ✓' : 'Return Request Active'}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {isRefundCompleted ? 'Refund Completed' : 'Return Already Applied'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {isRefundCompleted
                ? '100% of escrow funds have been successfully refunded to your buyer wallet.'
                : 'A return or resolution request is already in progress for this parcel. Your payment remains safely locked in SecureKaro Escrow.'
              }
            </p>
          </div>

          <div className={`p-4 rounded-2xl text-left space-y-2 text-xs border ${
            isRefundCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
          }`}>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tracking ID:</span>
              <span className="font-bold text-slate-900 font-mono">{parcelInfo?.shipmentId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Resolution Type:</span>
              <span className="font-black text-slate-900 flex items-center gap-1">
                <span>{typeEmoji}</span>
                <span>{typeLabel}</span>
              </span>
            </div>
            {parcelInfo?.returnReason && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Return Reason:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{parcelInfo.returnReason}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600">
              <span>Current Status:</span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[10.5px] ${
                isRefundCompleted ? 'text-emerald-900 bg-emerald-200/80' : 'text-amber-900 bg-amber-200/80'
              }`}>
                {isRefundCompleted ? '100% Refunded' : (parcelInfo?.returnStatus || parcelInfo?.status || 'Return Requested')}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>{isRefundCompleted ? 'Refund Payout:' : 'Escrow Security:'}</span>
              <span className="font-extrabold text-emerald-700">
                ₹{parcelInfo?.amount?.toLocaleString('en-IN') || '—'} {isRefundCompleted ? 'Credited to Wallet' : 'Frozen Under Protection'}
              </span>
            </div>
          </div>

          {/* Auto-redirect countdown indicator */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-semibold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1E56E3] animate-pulse" />
              <span>{isRefundCompleted ? 'Redirecting to Refund Details...' : 'Redirecting to Return Status...'}</span>
            </div>
            <span className="font-mono font-black text-sm bg-blue-200/70 px-2 py-0.5 rounded-lg text-blue-950">
              {redirectCountdown}s
            </span>
          </div>

          {/* Direct Redirection Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={`/tracking?id=${encodeURIComponent(parcelInfo?.shipmentId || '')}&tab=return`}
              className={`w-full py-3.5 px-4 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                isRefundCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
              }`}
            >
              {isRefundCompleted ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>{isRefundCompleted ? 'Go to Refund Details Now' : 'Go to Return Status & Tracking Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`/track?id=${encodeURIComponent(parcelInfo?.shipmentId || '')}&tab=return`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition block"
            >
              Buyer Public Tracking (No Login)
            </a>

            <a
              href="/"
              className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold transition block"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Confirmed success state — with scratch card cashback animation (or replacement complete screen)
  if (step === 'confirmed') {
    if (parcelInfo?.isReplacement || resultData?.isReplacement) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-block mb-2">
                🔄 Replacement Verified
              </span>
              <h2 className="text-xl font-black text-slate-900">Replacement Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You have successfully inspected and verified your replacement parcel using the In-Box QR Code &amp; SMS OTP.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tracking ID:</span>
                <span className="font-bold text-slate-900 font-mono">{parcelInfo?.shipmentId || resultData?.shipmentId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Status:</span>
                <span className="font-bold text-emerald-700">Order Completed &amp; Released</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Escrow Settlement:</span>
                <span className="font-bold text-slate-900">Disbursed to Seller</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium text-left flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1E56E3] shrink-0" />
              <span>Replacement completed under SafeCart Escrow Protection. Thank you!</span>
            </div>

            <a
              href={`/tracking?id=${encodeURIComponent(parcelInfo?.shipmentId || resultData?.shipmentId || '')}`}
              className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition block shadow-sm"
            >
              View Order Tracking
            </a>
          </div>
        </div>
      );
    }

    const cashback = resultData?.cashback;
    const isLucky = cashback?.isLucky || cashback?.tier === 'lucky';
    const isBonus = cashback?.isBonus || cashback?.tier === 'marketing_bonus';
    const hasCashback = cashback && cashback.amount > 0;

    return (
      <ConfirmedWithCashback
        resultData={resultData}
        parcelInfo={parcelInfo}
        cashback={cashback}
        hasCashback={hasCashback}
        isLucky={isLucky}
        isBonus={isBonus}
        returnWindowChoice={returnWindowChoice}
      />
    );
  }

  // Return requested success state
  if (step === 'returned') {
    const chosenType = resultData?.returnType || returnType;
    const typeLabel = chosenType === 'replacement'
      ? '1. Replacement'
      : chosenType === 'partial_discount'
      ? '2. Discounted Price / Partial Refund'
      : '3. Full Refund';
    const typeEmoji = chosenType === 'replacement' ? '🔄' : chosenType === 'partial_discount' ? '🏷️' : '💰';

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-2xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
            <RotateCcw className="w-9 h-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Escrow Protected Return</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Return Request Submitted</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              The merchant has been alerted. Your payment remains safely frozen in SecureKaro Escrow.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Tracking ID:</span>
              <span className="font-bold text-slate-900 font-mono">{resultData?.shipmentId || parcelInfo?.shipmentId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Selected Option:</span>
              <span className="font-black text-amber-900 flex items-center gap-1">
                <span>{typeEmoji}</span>
                <span>{typeLabel}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Return Reason:</span>
              <span className="font-bold text-slate-900">{resultData?.returnReason || returnReason}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Escrow Security:</span>
              <span className="font-black text-emerald-700">₹{parcelInfo?.amount?.toLocaleString('en-IN') || '—'} Frozen Under Protection</span>
            </div>
          </div>

          {/* Customized resolution next steps */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-left text-xs text-slate-600 space-y-2">
            <p className="font-bold text-blue-900">What happens next for {typeLabel}?</p>
            {chosenType === 'replacement' && (
              <>
                <p>1. The seller reviews your replacement request in their Return Orders portal.</p>
                <p>2. Once dispatched, a replacement courier parcel will be shipped to your address.</p>
                <p>3. If seller cannot fulfill replacement, 100% full escrow refund is automatically triggered.</p>
              </>
            )}
            {chosenType === 'partial_discount' && (
              <>
                <p>1. The seller reviews your uploaded defect photo and notes.</p>
                <p>2. The seller proposes a negotiated discount/refund offer to compensate for the defect.</p>
                <p>3. Once you accept, the partial discount is credited directly to you and you keep the item.</p>
              </>
            )}
            {chosenType === 'full_refund' && (
              <>
                <p>1. The seller reviews your full return application in their Return Orders portal.</p>
                <p>2. Reverse courier pickup is scheduled directly from your doorstep.</p>
                <p>3. 100% of escrow funds will be disbursed to your provided payout account once picked up.</p>
              </>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`/tracking?id=${encodeURIComponent(resultData?.shipmentId || parcelInfo?.shipmentId || '')}&tab=return`}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Track Return Status Live</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition block"
            >
              Access Buyer Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN INTERACTIVE FLOW: Step 1 (Phone) OR Step 2 (OTP & Confirm/Return) ──
  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Brand Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#1E56E3] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            SK
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-base tracking-tight">SecureKaro</span>
              <span className="text-[10px] font-bold bg-blue-50 text-[#1E56E3] border border-blue-200 px-1.5 py-0.2 rounded">
                Parcel Sign-Off
              </span>
            </div>
            <p className="text-[11px] text-slate-400">In-Box Genuine Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Escrow Protected</span>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Parcel Summary Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                In-Box Delivery QR
              </span>
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                {parcelInfo?.shipmentId || 'PSF-ORDER'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {parcelInfo?.description || 'Parcel Delivery Verification'}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Receiver: <span className="font-semibold text-white">{parcelInfo?.receiverName || 'Buyer'}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Protected Escrow</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  ₹{parcelInfo?.amount?.toLocaleString('en-IN') || '—'}
                </span>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="pt-2 flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1.5 font-bold ${step === 'phone' ? 'text-blue-400' : 'text-emerald-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'phone' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {step === 'phone' ? '1' : '✓'}
                </span>
                <span>Phone Verify</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <div className={`flex items-center gap-1.5 font-bold ${step === 'otp_and_action' ? 'text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'otp_and_action' ? 'bg-blue-500 text-white' : 'bg-white/20 text-slate-300'}`}>
                  2
                </span>
                <span>OTP & Decision</span>
              </div>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* ── STEP 1: Phone Verification ──────────────────────────────── */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Verify Your Registered Mobile
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    To prevent fraudulent sign-offs, enter your registered phone number (or just the last 4 digits) to receive a one-time SMS verification code.
                  </p>
                  {parcelInfo?.maskedPhone && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2 text-xs text-blue-900 font-medium">
                      <Phone className="w-4 h-4 text-[#1E56E3] shrink-0" />
                      <span>
                        Registered on this parcel: <strong className="font-mono">{parcelInfo.maskedPhone}</strong> (ends with <strong className="font-mono">{parcelInfo.last4}</strong>)
                      </span>
                    </div>
                  )}
                </div>

                {phoneError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Number or Last 4 Digits
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="e.g. 9876543210 or 3210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    You can enter your full 10-digit mobile number or simply the last 4 digits ({parcelInfo?.last4 || '••••'}).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full py-3.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Sending SMS OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP Verification & Confirm vs Return Choice ───────── */}
            {step === 'otp_and_action' && (
              <form onSubmit={handleSubmitAction} className="space-y-6">
                {/* Back / Phone info bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setActionError(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change phone ({phoneInput})</span>
                  </button>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    SMS Sent
                  </span>
                </div>

                {actionError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Dev OTP helper for rapid testing without active SMS gateway */}
                {devOtp && (
                  <div
                    onClick={() => setOtp(devOtp)}
                    className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-medium cursor-pointer hover:bg-amber-100/70 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Demo Mode OTP: <strong className="font-mono text-sm tracking-widest">{devOtp}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold underline">Click to auto-fill</span>
                  </div>
                )}

                {/* OTP Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || sendingOtp}
                      onClick={handleResendOtp}
                      className="text-[11px] font-bold text-[#1E56E3] hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend SMS OTP'}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 font-mono tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    A 6-digit verification code has been dispatched to your mobile number.
                  </p>
                </div>

                {/* Choose Action: Confirm Delivery vs Return Parcel */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    {parcelInfo?.isReplacement ? 'Replacement Parcel Verification' : 'Select Your Delivery Action'}
                  </label>

                  {parcelInfo?.isReplacement ? (
                    <div className="p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/70 shadow-sm text-left space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                            <RotateCcw className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">Verify Replacement Parcel</h4>
                            <p className="text-[11px] font-semibold text-indigo-700">
                              {parcelInfo.replacementCarrierName || 'Delhivery Express'} • AWB: {parcelInfo.replacementAwbCode || 'REP-AWB'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-300 px-2 py-0.5 rounded-full">
                          Fast-Track Exchange
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Please inspect your fresh replacement item. By submitting the 6-digit OTP above, you confirm the replacement parcel has arrived in good condition and release the escrow funds to the seller.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Confirm Delivery Card */}
                      <div
                        onClick={() => setActionChoice('confirm')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                          actionChoice === 'confirm'
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${actionChoice === 'confirm' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                            {actionChoice === 'confirm' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">Confirm Delivery</h4>
                            {parcelInfo?.cashbackEligible && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300/80 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                <span>Up to ₹10</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Parcel received safely. Unlocks instant scratch card reward!
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Return Parcel Card */}
                      <div
                        onClick={() => {
                          if (parcelInfo?.returnAllowed === false) {
                            alert('The seller has disabled returns for this parcel.');
                            return;
                          }
                          const isAlready = Boolean(
                            parcelInfo?.status === 'Return Requested' ||
                            parcelInfo?.returnRequested ||
                            parcelInfo?.returnStatus === 'Requested' ||
                            parcelInfo?.returnStatus === 'Approved' ||
                            parcelInfo?.status === 'Return In Transit' ||
                            parcelInfo?.status === 'Returned & Refunded'
                          );
                          if (isAlready) {
                            setStep('return_already_applied');
                            return;
                          }
                          setActionChoice('return');
                        }}
                        className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                          parcelInfo?.returnAllowed === false
                            ? 'border-slate-200 bg-slate-100/70 cursor-not-allowed opacity-60'
                            : actionChoice === 'return'
                            ? 'border-amber-500 bg-amber-50/50 shadow-sm cursor-pointer'
                            : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <RotateCcw className="w-5 h-5" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${actionChoice === 'return' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
                            {actionChoice === 'return' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">Return Parcel</h4>
                            {Boolean(
                              parcelInfo?.status === 'Return Requested' ||
                              parcelInfo?.returnRequested ||
                              parcelInfo?.returnStatus === 'Requested' ||
                              parcelInfo?.returnStatus === 'Approved' ||
                              parcelInfo?.status === 'Return In Transit' ||
                              parcelInfo?.status === 'Returned & Refunded'
                            ) ? (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
                                Already Applied
                              </span>
                            ) : parcelInfo?.returnAllowed === false && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Defective, damaged, or wrong item delivered.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-form: When Confirm is selected */}
                {actionChoice === 'confirm' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                    {/* Instant Cashback Incentive Banner */}
                    {parcelInfo?.cashbackEligible && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-emerald-500/10 border border-amber-200/90 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                              <span>Instant Delivery Reward</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300/80 px-2 py-0.5 rounded-full font-black">
                                Up to ₹10 Cashback
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800/90 mt-0.5">
                              Verify your parcel to unlock an assured scratch card directly into your wallet.
                            </p>
                          </div>
                        </div>
                        <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                      </div>
                    )}

                    <label className="block text-xs font-bold text-emerald-950">
                      Choose Return Window Option
                    </label>

                    <div
                      onClick={() => parcelInfo?.returnAllowed !== false && setReturnWindowChoice('keep_open_24h')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                        parcelInfo?.returnAllowed === false
                          ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-50'
                          : returnWindowChoice === 'keep_open_24h'
                          ? 'border-[#1E56E3] bg-white text-slate-900 shadow-xs'
                          : 'border-emerald-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Keep 24h Return Window Open</span>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1">
                          Confirms delivery now. You keep 24 hours to thoroughly test the product before escrow releases to seller.
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-[#1E56E3]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Gives you access to all 3 options (🔄 Replacement, 🏷️ Partial Refund, 💰 Full Refund) for 24h.</span>
                        </div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${returnWindowChoice === 'keep_open_24h' ? 'border-[#1E56E3] bg-[#1E56E3]' : 'border-slate-300'}`}>
                        {returnWindowChoice === 'keep_open_24h' && <span className="w-1 h-1 rounded-full bg-white"></span>}
                      </div>
                    </div>

                    <div
                      onClick={() => setReturnWindowChoice('confirm_and_close')}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                        returnWindowChoice === 'confirm_and_close'
                          ? 'border-emerald-600 bg-white text-slate-900 shadow-xs'
                          : 'border-emerald-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">Confirm & Release Escrow Immediately</span>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Close return window right now and release payment instantly to seller.
                        </p>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${returnWindowChoice === 'confirm_and_close' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                        {returnWindowChoice === 'confirm_and_close' && <span className="w-1 h-1 rounded-full bg-white"></span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: When Return is selected (3 Resolution Options) */}
                {actionChoice === 'return' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-4">
                    {/* Resolution Header */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-amber-700" />
                          <span>Select Desired Return Resolution</span>
                        </label>
                        <span className="text-[10px] font-bold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full">
                          3 Options
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Choose how you would like SecureKaro and the seller to resolve your parcel issue:
                      </p>
                    </div>

                    {/* The 3 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Option 1: Replacement */}
                      <button
                        type="button"
                        onClick={() => setReturnType('replacement')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition relative flex flex-col justify-between ${
                          returnType === 'replacement'
                            ? 'border-[#1E56E3] bg-blue-50/90 shadow-md shadow-blue-100 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">🔄</span>
                            {returnType === 'replacement' && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900">1. Replacement</h4>
                          <span className="text-[9.5px] font-bold text-blue-700 bg-blue-100/70 px-1 py-0.2 rounded inline-block mt-0.5">
                            Fresh Unit
                          </span>
                          <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                            Seller ships a brand-new replacement parcel. If rejected or unavailable, 100% full escrow refund is triggered.
                          </p>
                        </div>
                      </button>

                      {/* Option 2: Partial Discount */}
                      <button
                        type="button"
                        onClick={() => setReturnType('partial_discount')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition relative flex flex-col justify-between ${
                          returnType === 'partial_discount'
                            ? 'border-amber-500 bg-amber-100/70 shadow-md shadow-amber-100 ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">🏷️</span>
                            {returnType === 'partial_discount' && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white px-1.5 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900">2. Discounted Price</h4>
                          <span className="text-[9.5px] font-bold text-amber-800 bg-amber-200/70 px-1 py-0.2 rounded inline-block mt-0.5">
                            Partial Refund
                          </span>
                          <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                            Keep the item and receive a partial cash refund for minor damage or defects without the hassle of shipping back.
                          </p>
                        </div>
                      </button>

                      {/* Option 3: Full Refund */}
                      <button
                        type="button"
                        onClick={() => setReturnType('full_refund')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition relative flex flex-col justify-between ${
                          returnType === 'full_refund'
                            ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-100 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">💰</span>
                            {returnType === 'full_refund' && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900">3. Full Refund</h4>
                          <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded inline-block mt-0.5">
                            100% Money Back
                          </span>
                          <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                            Schedule reverse courier pickup and receive 100% of your escrow payment (₹{parcelInfo?.amount?.toLocaleString('en-IN')}) back.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* ── MANDATORY EVIDENCE PHOTO & DETAILS (All Return Types) ── */}
                    <div className="p-3.5 rounded-2xl bg-amber-100/60 border border-amber-300/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-amber-700" />
                          <span>Package / Defect Evidence Photo</span>
                          <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Mandatory for all returns
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Option A: Take Camera Photo */}
                        <button
                          type="button"
                          disabled={uploadingDefectPhoto}
                          onClick={() => setCameraModalOpen(true)}
                          className={`px-3.5 py-2.5 border rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                            uploadingDefectPhoto
                              ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-wait'
                              : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50 shadow-xs'
                          }`}
                        >
                          {uploadingDefectPhoto ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-amber-700" />
                              <span>Take Camera Photo</span>
                            </>
                          )}
                        </button>

                        {/* Option B: Upload from Gallery (no capture attribute so gallery opens) */}
                        <label className={`px-3.5 py-2.5 border rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          uploadingDefectPhoto
                            ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-wait'
                            : 'bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border-amber-300 shadow-xs'
                        }`}>
                          <ImageIcon className="w-4 h-4 text-amber-700" />
                          <span>Upload from Gallery</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingDefectPhoto}
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingDefectPhoto(true);
                              setActionError('');
                              try {
                                const { url } = await uploadImageToHost(file, `defect-${parcelInfo?.shipmentId || 'photo'}`);
                                if (url) {
                                  setDefectPhoto(url);
                                } else {
                                  setActionError('Could not upload photo. Please try again.');
                                }
                              } catch (err) {
                                console.error('Defect upload error:', err);
                                setActionError('Failed to upload image. Please try again.');
                              } finally {
                                setUploadingDefectPhoto(false);
                              }
                            }}
                          />
                        </label>

                        {defectPhoto && !uploadingDefectPhoto && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Photo Attached</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setDefectPhoto('')}
                              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {defectPhoto && (
                        <div className="relative inline-block mt-1">
                          <img
                            src={defectPhoto}
                            alt="Defect Preview"
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border-2 border-amber-300 shadow-sm"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Package / Defect Details
                        </label>
                        <textarea
                          rows="2"
                          value={defectDescription}
                          onChange={(e) => setDefectDescription(e.target.value)}
                          placeholder="Describe the issue, defect, or package condition for verification..."
                          className="w-full text-xs border border-amber-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* ── CONDITIONAL SUB-FORM: Option 3 Full Refund Payout Details ── */}
                    {returnType === 'full_refund' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-emerald-700" />
                            <span>Escrow Refund Payout Destination</span>
                            <span className="text-rose-600">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-800">
                            100% Refund: ₹{parcelInfo?.amount?.toLocaleString('en-IN') || '—'}
                          </span>
                        </div>

                        {/* Payout Method Toggle */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRefundMethod('upi')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              refundMethod === 'upi'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span>UPI ID (Instant)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundMethod('bank')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              refundMethod === 'bank'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50/50'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Bank Account</span>
                          </button>
                        </div>

                        {refundMethod === 'upi' ? (
                          <div>
                            <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                              Enter Your UPI ID
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 9876543210@upi or name@okaxis"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value.trim())}
                              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="text-[10.5px] text-emerald-700 mt-1">
                              Refund will be disbursed directly to this VPA upon courier reverse pickup.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                                Account Holder Name
                              </label>
                              <input
                                type="text"
                                placeholder={parcelInfo?.receiverName || "Account holder name as per bank"}
                                value={accountHolderName}
                                onChange={(e) => setAccountHolderName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                                  Account Number
                                </label>
                                <input
                                  type="text"
                                  placeholder="Bank Account Number"
                                  value={accountNumber}
                                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                                  Confirm Account Number
                                </label>
                                <input
                                  type="password"
                                  placeholder="Re-enter Account Number"
                                  value={confirmAccountNumber}
                                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                                  IFSC Code
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. SBIN0001234"
                                  maxLength={11}
                                  value={ifscCode}
                                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                                  Bank Name (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. State Bank of India"
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Common Return Reason */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">
                        Reason for Return
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Defective / Damaged product received">Defective / Damaged product received</option>
                        <option value="Wrong item or size delivered">Wrong item or size delivered</option>
                        <option value="Product not as described on store">Product not as described on store</option>
                        <option value="Missing parts or accessories">Missing parts or accessories</option>
                        <option value="Parcel outer seal was tampered/opened">Parcel outer seal was tampered/opened</option>
                        <option value="Quality not acceptable / Buyer remorse">Quality not acceptable / Buyer remorse</option>
                      </select>
                    </div>

                    {/* Optional Comments */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">
                        Notes / Comments (Optional)
                      </label>
                      <textarea
                        rows="2"
                        value={returnComments}
                        onChange={(e) => setReturnComments(e.target.value)}
                        placeholder="Please describe the damage or issue with the item in detail..."
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`w-full py-4 px-6 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                    actionChoice === 'confirm'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying OTP & Submitting...</span>
                    </>
                  ) : actionChoice === 'confirm' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Delivery & Sign-Off</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Submit Return Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-xl mx-auto w-full text-center mt-6 text-xs text-slate-400">
        <p>Protected by SecureKaro Escrow &amp; Smart-Path Milestone Logistics</p>
        <p className="text-[11px] mt-0.5">Need help? Log in to your SecureKaro account or contact support.</p>
      </footer>

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        title="Take Defect Evidence Photo"
        subtitle="Position the product defect clearly in the frame and snap a photo"
        onClose={() => setCameraModalOpen(false)}
        onCapture={async (file) => {
          setUploadingDefectPhoto(true);
          setActionError('');
          try {
            const { url } = await uploadImageToHost(file, `defect-${parcelInfo?.shipmentId || 'photo'}`);
            if (url) {
              setDefectPhoto(url);
            } else {
              setActionError('Could not upload photo. Please try again.');
            }
          } catch (err) {
            console.error('Defect upload error:', err);
            setActionError('Failed to upload image. Please try again.');
          } finally {
            setUploadingDefectPhoto(false);
          }
        }}
      />
    </div>
  );
}