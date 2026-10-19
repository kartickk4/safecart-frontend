import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, ShieldCheck, Box, Upload, ArrowRight, AlertTriangle,
  Lock, RotateCcw, Package, Clock, ShieldAlert, Sparkles, RefreshCw,
  ChevronRight, AlertCircle, HelpCircle, Check, Info, QrCode, Camera, Building
} from 'lucide-react';
import { shipmentAPI, profileAPI } from '../services/api';
import QrScannerModal from '../components/QrScannerModal';

export default function DeliveryConfirmView({ onConfirmed, user }) {
  // Navigation & selection state
  const [shipmentId, setShipmentId] = useState('');
  const [availableShipments, setAvailableShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [selectedShipmentData, setSelectedShipmentData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // QR Scanning State
  const [showScanner, setShowScanner] = useState(false);
  const [scannedVerified, setScannedVerified] = useState(false);
  const [scannedToken, setScannedToken] = useState('');

  // Active Tab: 'confirm' | 'return'
  const [activeTab, setActiveTab] = useState('confirm');

  // Confirm Form State
  const [confirmChoice, setConfirmChoice] = useState('keep_open_24h'); // 'confirm_and_close' | 'keep_open_24h'
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('Parcel arrived safely. Outer package intact and verified.');

  // Return Form State
  const [returnReason, setReturnReason] = useState('Defective / Damaged product received');
  const [returnType, setReturnType] = useState('full_refund'); // 'full_refund' | 'replacement' | 'partial_discount'
  const [defectDescription, setDefectDescription] = useState('');
  const [defectPhotoUrl, setDefectPhotoUrl] = useState('');

  // Refund Bank Details State (Mandatory when applying for full refund)
  const [refundBankDetails, setRefundBankDetails] = useState({
    payoutMethod: 'bank',
    accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    confirmAccountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || ''
  });
  const [isEditingRefundBank, setIsEditingRefundBank] = useState(false);

  useEffect(() => {
    if (user?.bankDetails) {
      setRefundBankDetails(prev => ({
        ...prev,
        accountHolderName: user.bankDetails?.accountHolderName || user.fullName || prev.accountHolderName,
        accountNumber: user.bankDetails?.accountNumber || prev.accountNumber,
        confirmAccountNumber: user.bankDetails?.accountNumber || prev.confirmAccountNumber,
        ifscCode: user.bankDetails?.ifscCode || prev.ifscCode,
        bankName: user.bankDetails?.bankName || prev.bankName,
        upiId: user.bankDetails?.upiId || prev.upiId,
        payoutMethod: user.bankDetails?.upiId && !user.bankDetails?.accountNumber ? 'upi' : 'bank'
      }));
    }
  }, [user]);

  // Execution & Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successType, setSuccessType] = useState('confirm'); // 'confirm' | 'return'
  const [successMessage, setSuccessMessage] = useState('');

  // ── Fetch user's incoming shipments on mount ──────────────────────────────
  useEffect(() => {
    fetchMyIncomingShipments();
  }, []);

  const fetchMyIncomingShipments = async () => {
    setLoadingShipments(true);
    try {
      const res = await shipmentAPI.getShipments();
      if (Array.isArray(res.data)) {
        // Filter for deliverable / eligible shipments
        const incoming = res.data.filter(s =>
          ['Out for Delivery', 'In Transit', 'Reached Destination Hub', 'Delivered', 'Pending Pickup'].includes(s.status)
        );
        setAvailableShipments(incoming);

        // Pre-select first deliverable shipment if available
        if (incoming.length > 0 && !shipmentId) {
          setShipmentId(incoming[0].shipmentId);
          loadShipmentDetails(incoming[0].shipmentId);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch shipments for receiver:', err);
    } finally {
      setLoadingShipments(false);
    }
  };

  // ── Load specific shipment details when shipmentId changes ─────────────────
  const loadShipmentDetails = async (id) => {
    if (!id || !id.trim()) return;
    setLoadingDetails(true);
    setError('');
    try {
      const res = await shipmentAPI.getShipmentById(id.trim());
      const ship = res.data?.shipment || res.data;
      setSelectedShipmentData(ship);

      if (ship?.returnAllowed === false) {
        setConfirmChoice('confirm_and_close');
        if (activeTab === 'return') {
          setActiveTab('confirm');
        }
      }
    } catch (err) {
      console.warn('Could not load shipment details:', err);
      setSelectedShipmentData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleShipmentSelect = (id) => {
    setShipmentId(id);
    setScannedVerified(false);
    loadShipmentDetails(id);
  };

  const handleQrScanSuccess = async ({ token, shipmentId: scannedId, rawText }) => {
    setLoadingDetails(true);
    setError('');
    setScannedVerified(false);
    try {
      if (token) {
        setScannedToken(token);
        const res = await shipmentAPI.publicQrGetInfo(token);
        if (res.data?.shipmentId) {
          setShipmentId(res.data.shipmentId);
          setSelectedShipmentData(res.data);
          setScannedVerified(true);
          return;
        }
      }

      const id = scannedId || (rawText && rawText.startsWith('SPL-') ? rawText : null);
      if (id) {
        setShipmentId(id);
        await loadShipmentDetails(id);
        setScannedVerified(true);
      } else if (token) {
        setShipmentId(token);
        await loadShipmentDetails(token);
        setScannedVerified(true);
      }
    } catch (err) {
      console.warn('QR scan processing warning:', err);
      const fallback = scannedId || token || rawText;
      if (fallback) {
        setShipmentId(fallback);
        loadShipmentDetails(fallback);
        setScannedVerified(true);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  // ── SUBMIT: Confirm Delivery ───────────────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!shipmentId.trim()) {
      setError('Please provide a valid Shipment Tracking ID.');
      return;
    }
    if (isDeliveryAlreadyConfirmed) {
      setError(`Parcel already confirmed. ${isReturnWindowClosed ? 'Return window is closed and payment has been settled.' : '24-hour return window is currently active.'}`);
      return;
    }
    setActionLoading(true);
    setError('');

    try {
      const res = await shipmentAPI.confirmDelivery(shipmentId.trim(), confirmChoice);
      setSuccess(true);
      setSuccessType('confirm');
      setSuccessMessage(
        confirmChoice === 'confirm_and_close'
          ? 'Parcel confirmed and return window closed! Payment released to the seller.'
          : 'Delivery confirmed! Your 24-hour return window is now active.'
      );
      if (onConfirmed) onConfirmed();
    } catch (err) {
      console.error('Confirm Delivery Error:', err);
      setError(err.response?.data?.error || 'Failed to confirm delivery. Only the receiver of the shipment can confirm delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── SUBMIT: Close Return Window Early ──────────────────────────────────────
  const handleCloseReturnWindowEarly = async () => {
    if (!shipmentId.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await shipmentAPI.closeReturnWindow(shipmentId.trim());
      setSuccess(true);
      setSuccessType('confirm');
      setSuccessMessage('Return window closed early! Payment released to the seller.');
      await loadShipmentDetails(shipmentId.trim());
      if (onConfirmed) onConfirmed();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close return window.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── SUBMIT: Request Return ─────────────────────────────────────────────────
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!shipmentId.trim()) {
      setError('Please provide a valid Shipment Tracking ID.');
      return;
    }
    if (selectedShipmentData?.returnAllowed === false) {
      setError('Returns have been disabled by the seller for this shipment.');
      return;
    }

    if (!defectPhotoUrl.trim()) {
      setError('Uploading photo proof of the package/item is mandatory for refund, partial return, and replacement requests.');
      return;
    }

    const hasExistingBank = Boolean(
      (user?.bankDetails?.accountNumber && user.bankDetails.accountNumber.trim().length >= 6) ||
      (user?.bankDetails?.upiId && user.bankDetails.upiId.trim().includes('@'))
    );

    let bankPayload = null;
    if (returnType === 'full_refund') {
      if (!hasExistingBank || isEditingRefundBank) {
        if (refundBankDetails.payoutMethod === 'bank') {
          const acc = (refundBankDetails.accountNumber || '').trim();
          const confirmAcc = (refundBankDetails.confirmAccountNumber || '').trim();
          const ifsc = (refundBankDetails.ifscCode || '').trim().toUpperCase();
          const holder = (refundBankDetails.accountHolderName || user?.fullName || '').trim();
          if (!holder) {
            setError('Please enter your Account Holder Name.');
            return;
          }
          if (!acc || acc.length < 6) {
            setError('Please enter a valid bank account number (minimum 6 digits).');
            return;
          }
          if (acc !== confirmAcc) {
            setError('Bank account numbers do not match. Please re-enter.');
            return;
          }
          if (!ifsc || ifsc.length < 5) {
            setError('Please enter a valid IFSC code (e.g. HDFC0001234).');
            return;
          }
          bankPayload = {
            accountHolderName: holder,
            accountNumber: acc,
            ifscCode: ifsc,
            bankName: (refundBankDetails.bankName || 'Bank').trim(),
            upiId: (refundBankDetails.upiId || '').trim()
          };
        } else {
          const upi = (refundBankDetails.upiId || '').trim();
          const holder = (refundBankDetails.accountHolderName || user?.fullName || '').trim();
          if (!upi || !upi.includes('@')) {
            setError('Please enter a valid UPI ID (e.g., yourname@okhdfcbank).');
            return;
          }
          bankPayload = {
            upiId: upi,
            accountHolderName: holder,
            accountNumber: user?.bankDetails?.accountNumber || '',
            ifscCode: user?.bankDetails?.ifscCode || '',
            bankName: user?.bankDetails?.bankName || ''
          };
        }

        try {
          await profileAPI.updateProfile({ bankDetails: bankPayload });
          if (user) {
            user.bankDetails = { ...(user.bankDetails || {}), ...bankPayload };
          }
        } catch (profErr) {
          console.warn('Bank save notice:', profErr);
        }
      } else {
        bankPayload = user?.bankDetails;
      }
    }

    setActionLoading(true);
    setError('');

    try {
      const payload = {
        reason: returnReason,
        returnType: returnType,
        defectDescription: defectDescription.trim(),
        defectPhotoUrl: defectPhotoUrl.trim(),
        bankDetails: bankPayload
      };

      const res = await shipmentAPI.requestReturn(shipmentId.trim(), payload);
      setSuccess(true);
      setSuccessType('return');
      setSuccessMessage('Return application submitted! Bank payout details saved and seller notified.');
      setIsEditingRefundBank(false);
      if (onConfirmed) onConfirmed();
    } catch (err) {
      console.error('Request Return Error:', err);
      setError(err.response?.data?.error || 'Failed to submit return request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const isReturnAlreadyApplied = Boolean(
    selectedShipmentData && (
      selectedShipmentData.status === 'Return Requested' ||
      selectedShipmentData.returnRequested === true ||
      selectedShipmentData.returnStatus === 'Requested' ||
      selectedShipmentData.returnStatus === 'Approved' ||
      selectedShipmentData.status === 'Return In Transit' ||
      selectedShipmentData.status === 'Returned & Refunded'
    )
  );

  const isRefundCompleted = Boolean(
    selectedShipmentData && (
      selectedShipmentData.status === 'Returned & Refunded' ||
      selectedShipmentData.returnStatus === 'Returned & Refunded' ||
      selectedShipmentData.returnStatus === 'Completed' ||
      selectedShipmentData.status === 'Returned & Restocked'
    )
  );

  const isDeliveryAlreadyConfirmed = Boolean(
    selectedShipmentData && (
      selectedShipmentData.deliveryConfirmed === true ||
      selectedShipmentData.status === 'Released' ||
      selectedShipmentData.returnWindowChoice === 'ImmediateClose' ||
      (selectedShipmentData.deliveryConfirmedAt && selectedShipmentData.status === 'Delivered') ||
      selectedShipmentData.inboxQrUsed === true
    )
  );

  const isReturnWindowClosed = Boolean(
    selectedShipmentData && (
      selectedShipmentData.returnWindowClosed === true ||
      selectedShipmentData.status === 'Released' ||
      selectedShipmentData.returnWindowChoice === 'ImmediateClose' ||
      (selectedShipmentData.returnWindowExpiresAt && new Date() >= new Date(selectedShipmentData.returnWindowExpiresAt))
    )
  );

  const returnAllowed = selectedShipmentData ? selectedShipmentData.returnAllowed !== false : true;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span>Buyer Delivery Sign-Off & Return Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect your delivered package and either confirm receipt to complete delivery or file a return request under SecureKaro buyer protection.
        </p>
      </div>

      {/* ── IN-BOX QR SCANNER HERO BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#1E56E3] p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shrink-0 shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold tracking-tight">In-Box QR Code Scanner</h3>
              <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Instant Sign-Off
              </span>
            </div>
            <p className="text-xs text-white/85 font-medium mt-1 leading-relaxed">
              Open your package and scan the tamper-evident QR confirmation slip placed inside to verify physical delivery and complete sign-off.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-black text-xs shadow-lg transition flex items-center justify-center gap-2.5 shrink-0 group hover:scale-[1.02] active:scale-[0.98] relative z-10"
        >
          <Camera className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>Scan In-Box QR Code</span>
        </button>
      </div>

      {!success ? (
        <div className="space-y-6">
          {/* Quick Select from Receiver's Active Parcels */}
          {availableShipments.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Select from Your Incoming Parcels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {availableShipments.map((ship) => {
                  const isShipConfirmed = ship.deliveryConfirmed || ship.status === 'Released' || ship.inboxQrUsed;
                  return (
                    <div
                      key={ship.shipmentId}
                      onClick={() => handleShipmentSelect(ship.shipmentId)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left ${
                        shipmentId === ship.shipmentId
                          ? 'border-[#1E56E3] bg-blue-50/50 shadow-xs'
                          : 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {ship.shipmentId}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 font-mono">
                          ₹{ship.amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {ship.description || 'Secure Order'}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-semibold">{ship.status}</span>
                        {isShipConfirmed ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[9px]">
                            Confirmed ✓
                          </span>
                        ) : (
                          <span className="text-[#1E56E3] font-bold">Select →</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Action Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Top Shipment Identifier Input */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shipment Tracking ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PSF-2026-00839"
                    value={shipmentId}
                    onChange={(e) => {
                      setShipmentId(e.target.value);
                      if (e.target.value.length >= 8) {
                        loadShipmentDetails(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadShipmentDetails(shipmentId)}
                  disabled={loadingDetails || !shipmentId.trim()}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  {loadingDetails ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Fetch Details</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 shrink-0 group"
                  title="Scan In-Box QR Code"
                >
                  <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Scan QR</span>
                </button>
              </div>

              {/* Scanned Verified Status Banner */}
              {scannedVerified && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In-Box QR Code Verified — Physical package authenticity confirmed.</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              )}

              {/* Order summary badge */}
              {selectedShipmentData && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {selectedShipmentData.description || 'Secure Protected Order'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: <strong className="text-slate-700">{selectedShipmentData.status}</strong> • Order Value: <strong className="text-emerald-700 font-mono">₹{selectedShipmentData.amount?.toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>
                  {!returnAllowed && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Returns Disabled by Seller
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mode Tabs: Confirm Delivery vs Request Return */}
            <div className="border-b border-slate-200/80 bg-slate-50/50 px-6 pt-3 flex gap-4">
              <button
                type="button"
                onClick={() => { setActiveTab('confirm'); setError(''); }}
                className={`pb-3 px-2 text-xs font-extrabold border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'confirm'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Option 1: Confirm Delivery</span>
                {isDeliveryAlreadyConfirmed && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Already Confirmed ✓
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={!returnAllowed}
                onClick={() => {
                  if (!returnAllowed) return;
                  setActiveTab('return');
                  setError('');
                }}
                className={`pb-3 px-2 text-xs font-extrabold border-b-2 transition flex items-center gap-2 ${
                  !returnAllowed
                    ? 'border-transparent text-slate-300 cursor-not-allowed'
                    : activeTab === 'return'
                    ? isRefundCompleted
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {isRefundCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <RotateCcw className="w-4 h-4" />}
                <span>{isRefundCompleted ? 'Option 2: Refund Completed' : isReturnAlreadyApplied ? 'Option 2: Return Already Applied' : 'Option 2: Request Return'}</span>
                {isRefundCompleted ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Settled ✓
                  </span>
                ) : isReturnAlreadyApplied ? (
                  <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Applied
                  </span>
                ) : !returnAllowed ? (
                  <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.2 rounded font-normal">
                    Disabled
                  </span>
                ) : null}
              </button>
            </div>

            {/* TAB 1: CONFIRM DELIVERY (OR PARCEL ALREADY CONFIRMED) */}
            {activeTab === 'confirm' && isDeliveryAlreadyConfirmed ? (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border-2 border-emerald-300 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900">
                            Parcel Already Confirmed
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            Verified ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          Delivery sign-off has already been completed for this parcel.
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed On</span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {selectedShipmentData?.deliveryConfirmedAt 
                          ? new Date(selectedShipmentData.deliveryConfirmedAt).toLocaleString('en-IN')
                          : selectedShipmentData?.inboxQrConfirmedAt
                          ? new Date(selectedShipmentData.inboxQrConfirmedAt).toLocaleString('en-IN')
                          : 'Previously Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Return Window Status Card */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-2">
                        {isReturnWindowClosed ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Return Window Closed — Escrow Released</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                            <span>24-Hour Return Window Currently Active</span>
                          </>
                        )}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isReturnWindowClosed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800 font-mono'
                      }`}>
                        {isReturnWindowClosed ? 'Settled' : 'Active Protection'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isReturnWindowClosed
                        ? 'The return window for this parcel is closed. Escrow funds have been successfully released to the seller.'
                        : `Your 24-hour buyer inspection window is open until ${new Date(selectedShipmentData?.returnWindowExpiresAt || Date.now()).toLocaleString('en-IN')}. Escrow funds remain safely held. If satisfied with the parcel, you can close the return window early to release funds immediately.`}
                    </p>

                    {!isReturnWindowClosed && (
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCloseReturnWindowEarly}
                          disabled={actionLoading}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          <span>Close Return Window Early &amp; Release Funds Now</span>
                        </button>

                        {returnAllowed && (
                          <button
                            type="button"
                            onClick={() => { setActiveTab('return'); setError(''); }}
                            className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-[#1E56E3] font-bold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Switch to Return (Option 2)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-6 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Parcel Already Confirmed</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'confirm' ? (
              <form onSubmit={handleConfirm} className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Confirm Parcel Delivery & Release Escrow
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your return window preference and rate your delivery experience.
                  </p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Delivery Condition & Experience Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition ${
                          rating >= star
                            ? 'bg-amber-400 text-slate-900 shadow-sm'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return Window Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Return Window Option
                  </label>

                  {/* Choice 1: Keep 24h Window Open */}
                  <div
                    onClick={() => returnAllowed && setConfirmChoice('keep_open_24h')}
                    className={`p-4 rounded-2xl border-2 transition flex items-start justify-between gap-3 ${
                      !returnAllowed
                        ? 'border-slate-200 bg-slate-100/70 cursor-not-allowed opacity-60'
                        : confirmChoice === 'keep_open_24h'
                        ? 'border-[#1E56E3] bg-blue-50/50 cursor-pointer shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          Confirm without closing Return window
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          24h Hold (Recommended)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Confirm delivery now. You keep a 24-hour return window to inspect and test the contents before funds are released to the seller.
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${!returnAllowed ? 'border-slate-300 bg-slate-200' : confirmChoice === 'keep_open_24h' ? 'border-[#1E56E3] bg-[#1E56E3] text-white' : 'border-slate-300'}`}>
                      {returnAllowed && confirmChoice === 'keep_open_24h' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </div>
                  </div>

                  {/* Choice 2: Confirm and Close Immediately */}
                  <div
                    onClick={() => setConfirmChoice('confirm_and_close')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                      confirmChoice === 'confirm_and_close'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          Confirm and close the Return window
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Immediate Release
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Confirm parcel and immediately release escrow funds to the seller's wallet.
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${confirmChoice === 'confirm_and_close' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                      {confirmChoice === 'confirm_and_close' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </div>
                  </div>
                </div>

                {/* Inspection Comments */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmation Notes / Inspection Comments
                  </label>
                  <textarea
                    rows="2"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Outer seal intact, product verified..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !shipmentId.trim()}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Parcel Delivery</span>
                    </>
                  )}
                </button>
              </form>
            ) : null}

            {/* TAB 2: REQUEST RETURN FORM OR RETURN ALREADY APPLIED / REFUND COMPLETED */}
            {activeTab === 'return' && isReturnAlreadyApplied ? (
              <div className="p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-200">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
                  isRefundCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isRefundCompleted ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <RotateCcw className="w-8 h-8" />}
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-2 border ${
                    isRefundCompleted
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isRefundCompleted ? 'Refund Completed ✓' : 'Return Already Applied'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {isRefundCompleted
                      ? `Refund Completed for #${selectedShipmentData?.shipmentId}`
                      : `Return Request Active for #${selectedShipmentData?.shipmentId}`
                    }
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {isRefundCompleted
                      ? `100% of escrow funds (₹${selectedShipmentData?.amount?.toLocaleString('en-IN')}) have been successfully refunded to your buyer wallet.`
                      : `You have already applied for a return on this shipment. Escrow funds (₹${selectedShipmentData?.amount?.toLocaleString('en-IN')}) are safely locked while the merchant coordinates your return resolution.`
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border text-left max-w-lg mx-auto text-xs space-y-2 ${
                  isRefundCompleted ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
                }`}>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Resolution Selected:</span>
                    <span className="font-extrabold text-slate-900 capitalize">
                      {selectedShipmentData?.returnType === 'replacement' ? '🔄 1. Replacement' : selectedShipmentData?.returnType === 'partial_discount' ? '🏷️ 2. Partial Refund' : '💰 3. Full Refund'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Current Status:</span>
                    <span className={`font-black px-2 py-0.5 rounded-full text-[10.5px] ${
                      isRefundCompleted ? 'text-emerald-900 bg-emerald-200' : 'text-amber-900 bg-amber-200'
                    }`}>
                      {selectedShipmentData?.returnStatus || selectedShipmentData?.status}
                    </span>
                  </div>
                  {selectedShipmentData?.returnReason && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Reason:</span>
                      <span className="font-semibold text-slate-900">{selectedShipmentData.returnReason}</span>
                    </div>
                  )}
                  {selectedShipmentData?.returnAwbCode && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>{isRefundCompleted ? 'Reverse Courier AWB (Returned):' : 'Reverse Courier AWB:'}</span>
                      <span className="font-mono font-bold text-slate-900">{selectedShipmentData.returnAwbCode}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={`/tracking?id=${encodeURIComponent(selectedShipmentData?.shipmentId || '')}&tab=return`}
                    className={`w-full sm:w-auto px-6 py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                      isRefundCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    }`}
                  >
                    {isRefundCompleted ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                    <span>{isRefundCompleted ? 'View Refund Details & Journey' : 'View Return Status & Journey'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`/track?id=${encodeURIComponent(selectedShipmentData?.shipmentId || '')}&tab=return`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <span>Public Status (No Login)</span>
                  </a>
                </div>
              </div>
            ) : activeTab === 'return' && (
              <form onSubmit={handleReturn} className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    File a Return Application
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your escrow funds remain safely protected by SecureKaro while your return request is processed.
                  </p>
                </div>

                {/* Return Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="Defective / Damaged product received">Defective / Damaged product received</option>
                    <option value="Wrong item or variant delivered">Wrong item or variant delivered</option>
                    <option value="Product not as described on store">Product not as described on store</option>
                    <option value="Missing parts / accessories">Missing parts / accessories</option>
                    <option value="Parcel outer seal was tampered/opened">Parcel outer seal was tampered/opened</option>
                    <option value="Quality not acceptable / Buyer remorse">Quality not acceptable / Buyer remorse</option>
                  </select>
                </div>

                {/* Resolution Type Choice */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Desired Resolution Path
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      onClick={() => setReturnType('full_refund')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left ${
                        returnType === 'full_refund'
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-900">Full Refund</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Return the item for a 100% escrow principal refund.
                      </p>
                    </div>

                    <div
                      onClick={() => setReturnType('replacement')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left ${
                        returnType === 'replacement'
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-900">Replacement</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Seller sends replacement parcel before escrow release.
                      </p>
                    </div>

                    <div
                      onClick={() => setReturnType('partial_discount')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left ${
                        returnType === 'partial_discount'
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-900">Keep & Get Discount</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Keep the item with a partial cashback from seller.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mandatory Package / Defect Photo URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Package / Defect Evidence Photo URL <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Mandatory for all returns
                    </span>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/... or cloud image link"
                    value={defectPhotoUrl}
                    onChange={(e) => setDefectPhotoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Upload a clear photo of the package/item or defect. Mandatory for refund, partial return, or replacement.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Describe the Issue / Return Details
                  </label>
                  <textarea
                    rows="2"
                    value={defectDescription}
                    onChange={(e) => setDefectDescription(e.target.value)}
                    placeholder="Provide details about the defect, wrong item, or damage..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  ></textarea>
                </div>

                {/* Mandatory Refund Bank Details Section (When full_refund selected) */}
                {returnType === 'full_refund' && (
                  <div className="space-y-3 pt-1">
                    {Boolean((user?.bankDetails?.accountNumber && user.bankDetails.accountNumber.trim().length >= 6) || (user?.bankDetails?.upiId && user.bankDetails.upiId.trim().includes('@'))) && !isEditingRefundBank ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 text-emerald-950">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-emerald-900 block">Refund Payout Destination (Verified)</span>
                            <span className="font-mono text-emerald-800 text-[11px]">
                              {user.bankDetails?.accountNumber
                                ? `${user.bankDetails.bankName || 'Bank'} A/C ending in ••••${user.bankDetails.accountNumber.slice(-4)}`
                                : `UPI: ${user.bankDetails?.upiId}`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingRefundBank(true)}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5 bg-white border-2 border-amber-300 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                            <Building className="w-4 h-4 text-amber-600" />
                            <span>Refund Bank Payout Destination (Mandatory)</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            Required to Receive Refund
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed">
                          Your escrow refund will be transferred directly to this payout destination once the return is authorized.
                        </p>

                        {/* Payout Method Toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRefundBankDetails(p => ({ ...p, payoutMethod: 'bank' }))}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              refundBankDetails.payoutMethod === 'bank'
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            Bank Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundBankDetails(p => ({ ...p, payoutMethod: 'upi' }))}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              refundBankDetails.payoutMethod === 'upi'
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            UPI ID
                          </button>
                        </div>

                        {refundBankDetails.payoutMethod === 'bank' ? (
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Legal Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="Full name as printed on bank passbook"
                                value={refundBankDetails.accountHolderName}
                                onChange={(e) => setRefundBankDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number *</label>
                                <input
                                  type="password"
                                  required
                                  placeholder="Enter Bank Account Number"
                                  value={refundBankDetails.accountNumber}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Account Number *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Re-enter to confirm account"
                                  value={refundBankDetails.confirmAccountNumber}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, confirmAccountNumber: e.target.value }))}
                                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. SBIN0001234 or HDFC0001234"
                                  value={refundBankDetails.ifscCode}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. State Bank of India"
                                  value={refundBankDetails.bankName}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, bankName: e.target.value }))}
                                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. mobile@upi or name@okhdfcbank"
                              value={refundBankDetails.upiId}
                              onChange={(e) => setRefundBankDetails(p => ({ ...p, upiId: e.target.value }))}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading || !shipmentId.trim()}
                  className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
      ) : (
        /* Result Screen */
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-lg text-center space-y-6 max-w-xl mx-auto">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
            successType === 'confirm' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {successType === 'confirm' ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <RotateCcw className="w-10 h-10" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {successType === 'confirm' ? 'Delivery Confirmed!' : 'Return Request Submitted!'}
            </h2>
            <p className={`text-xs mt-2 font-semibold p-3 rounded-2xl inline-block ${
              successType === 'confirm'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              {successMessage}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Shipment ID: <span className="font-bold text-slate-700 font-mono">{shipmentId}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => { setSuccess(false); fetchMyIncomingShipments(); }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Process Another Parcel
            </button>
            {onConfirmed && (
              <button
                onClick={onConfirmed}
                className="px-6 py-2.5 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Go to Orders
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── IN-BOX QR SCANNER MODAL ── */}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
}
