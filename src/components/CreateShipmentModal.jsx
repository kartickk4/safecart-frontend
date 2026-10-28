import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ShieldCheck, ArrowRight, ArrowLeft, AlertTriangle, RotateCcw, 
  Camera, Phone, Truck, Star, Zap, Check, Lock, RefreshCw, Clock, Award,
  CreditCard, Banknote, Search, Sparkles, TrendingDown, Plane, LayoutGrid, List, Scale
} from 'lucide-react';
import { shipmentAPI, profileAPI, agentAPI } from '../services/api';
import CarrierLogo from './CarrierLogo';
export default function CreateShipmentModal({ isOpen, onClose, onCreated, user, initialData }) {
  // Modal Step: 1 = Details Form | 2 = Courier Rates & Ratings Selection
  const [modalStep, setModalStep] = useState(1);

  // Form Fields
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');
  const [parcelWeight, setParcelWeight] = useState('0.5');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [cityRoute, setCityRoute] = useState('');
  const [fundImmediately, setFundImmediately] = useState(true);
  const [paymentMode, setPaymentMode] = useState('prepaid'); // 'prepaid' | 'cod'
  const [returnAllowed, setReturnAllowed] = useState(true);
  const [rtoProtectionEnabled, setRtoProtectionEnabled] = useState(false);
  const [secureShipmentEnabled, setSecureShipmentEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Synchronize state when initialData is passed (e.g., Repeat Shipment)
  useEffect(() => {
    if (initialData && isOpen) {
      setReceiverName(initialData.receiverName || '');
      setReceiverPhone(initialData.receiverPhone || '');
      setReceiverAddress(initialData.receiverAddress || '');
      setReceiverPincode(initialData.receiverPincode || '');
      setParcelWeight(initialData.parcelWeight ? String(initialData.parcelWeight) : '0.5');
      setDescription(initialData.description || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCityRoute(initialData.cityRoute || initialData.city || '');
      if (typeof initialData.fundImmediately === 'boolean') setFundImmediately(initialData.fundImmediately);
      if (typeof initialData.returnAllowed === 'boolean') setReturnAllowed(initialData.returnAllowed);
      if (typeof initialData.rtoProtectionEnabled === 'boolean') setRtoProtectionEnabled(initialData.rtoProtectionEnabled);
      setModalStep(1);
      setError('');
      setCarrierQuotes([]);
      setSelectedQuote(null);
    }
  }, [initialData, isOpen]);

  // Courier comparison state
  const senderPincode = user?.pickupAddress?.pincode || user?.pincode || '560001';
  const senderAddress = user?.pickupAddress?.street || user?.address || 'Supplier Pickup Location';
  const [carrierQuotes, setCarrierQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [fetchingQuotes, setFetchingQuotes] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [carrierTab, setCarrierTab] = useState('all'); // 'all' | 'cheapest' | 'nimbuspost' | 'shiprocket' | 'surface' | 'air' | 'heavy'
  const [carrierSearch, setCarrierSearch] = useState('');
  const [carrierSort, setCarrierSort] = useState('price'); // 'price' | 'rating'
  const [rateViewMode, setRateViewMode] = useState('grid'); // 'grid' | 'table'
  const [onlyCloseToWeight, setOnlyCloseToWeight] = useState(true);

  // Summary counts and stats
  const carrierStats = useMemo(() => {
    if (!carrierQuotes || carrierQuotes.length === 0) {
      return { total: 0, nimbusCount: 0, srCount: 0, airCount: 0, surfaceCount: 0, suitableCount: 0, heavyCount: 0, cheapest: null, highest: null, savings: 0 };
    }
    const targetW = parseFloat(parcelWeight) || 0.5;
    const maxCloseKg = Math.max(1.5, targetW * 2);
    const suitableQuotes = carrierQuotes.filter(q => q.isCloseToWeight !== false && (!q.minWeightKg || q.minWeightKg <= maxCloseKg));
    const heavyQuotes = carrierQuotes.filter(q => q.isCloseToWeight === false || (q.minWeightKg && q.minWeightKg > maxCloseKg));

    const activePool = onlyCloseToWeight && suitableQuotes.length > 0 ? suitableQuotes : carrierQuotes;
    const sorted = [...activePool].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const nimbusCount = activePool.filter(q => (q.aggregator || '').toLowerCase().includes('nimbus') || (q.slug || '').startsWith('nimbus')).length;
    const srCount = activePool.filter(q => (q.aggregator || '').toLowerCase().includes('shiprocket') || !(q.slug || '').startsWith('nimbus')).length;
    const airCount = activePool.filter(q => (q.mode || '').toLowerCase().includes('air') || (q.name || '').toLowerCase().includes('air')).length;
    const surfaceCount = activePool.filter(q => (q.mode || '').toLowerCase().includes('surface') || !(q.mode || '').toLowerCase().includes('air')).length;
    const savings = Math.max(0, (highest ? highest.price : 0) - (cheapest ? cheapest.price : 0));
    return {
      total: carrierQuotes.length,
      suitableCount: suitableQuotes.length,
      heavyCount: heavyQuotes.length,
      nimbusCount,
      srCount,
      airCount,
      surfaceCount,
      cheapest,
      highest,
      savings
    };
  }, [carrierQuotes, parcelWeight, onlyCloseToWeight]);

  const sortedCarrierQuotes = useMemo(() => {
    let list = [...carrierQuotes];
    const targetW = parseFloat(parcelWeight) || 0.5;
    const maxCloseKg = Math.max(1.5, targetW * 2);

    // Filter by Weight Proximity
    if (onlyCloseToWeight && carrierTab !== 'heavy') {
      list = list.filter(q => q.isCloseToWeight !== false && (!q.minWeightKg || q.minWeightKg <= maxCloseKg));
    } else if (carrierTab === 'heavy') {
      list = list.filter(q => q.isCloseToWeight === false || (q.minWeightKg && q.minWeightKg > maxCloseKg));
    }

    // Filter by Tab
    if (carrierTab === 'nimbuspost') {
      list = list.filter(q => (q.aggregator || '').toLowerCase().includes('nimbus') || (q.slug || '').startsWith('nimbus'));
    } else if (carrierTab === 'shiprocket') {
      list = list.filter(q => (q.aggregator || '').toLowerCase().includes('shiprocket') || !(q.slug || '').startsWith('nimbus'));
    } else if (carrierTab === 'surface') {
      list = list.filter(q => (q.mode || '').toLowerCase().includes('surface') || !(q.mode || '').toLowerCase().includes('air'));
    } else if (carrierTab === 'air') {
      list = list.filter(q => (q.mode || '').toLowerCase().includes('air') || (q.name || '').toLowerCase().includes('air'));
    } else if (carrierTab === 'cheapest') {
      list = list.slice(0, 6);
    }

    // Filter by Search Query
    if (carrierSearch.trim()) {
      const q = carrierSearch.toLowerCase();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q) || 
        (item.courierPartner || '').toLowerCase().includes(q) ||
        (item.aggregatorName || '').toLowerCase().includes(q) ||
        (item.serviceType || '').toLowerCase().includes(q) ||
        (item.weightSlab || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (carrierSort === 'price') {
      list.sort((a, b) => a.price - b.price);
    } else if (carrierSort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [carrierQuotes, carrierTab, carrierSearch, carrierSort, onlyCloseToWeight, parcelWeight]);

  // Phone verification state for first shipment
  const isUserPhoneVerified = Boolean(user?.phone && user?.isPhoneVerified);
  const [phoneVerified, setPhoneVerified] = useState(isUserPhoneVerified);
  const [verifyPhone, setVerifyPhone] = useState(user?.phone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');
  const [phoneDebugOtp, setPhoneDebugOtp] = useState('');

  const handleSendPhoneOtp = async () => {
    if (!verifyPhone) {
      setPhoneError('Please enter your 10-digit mobile number.');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');
    setPhoneSuccessMsg('');
    try {
      const res = await profileAPI.sendPhoneOtp(verifyPhone);
      setPhoneOtpSent(true);
      setPhoneSuccessMsg(res.data?.message || 'Verification code sent via SMS.');
      if (res.data?.debugOtp) {
        setPhoneDebugOtp(res.data.debugOtp);
      }
    } catch (err) {
      setPhoneError(err.response?.data?.error || 'Failed to send OTP. Please check your phone number.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length < 4) {
      setPhoneError('Please enter the 6-digit OTP code.');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const res = await profileAPI.verifyPhoneOtp(verifyPhone, phoneOtp);
      setPhoneVerified(true);
      setPhoneSuccessMsg('Phone verified successfully!');
      if (user) {
        user.phone = res.data?.phone || verifyPhone;
        user.isPhoneVerified = true;
      }
    } catch (err) {
      setPhoneError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!isOpen) return null;

  // Step 1 Submit: Validate details and fetch live rates to receiver pincode
  const handleProceedToCouriers = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneVerified) {
      setError('Mobile Number Verification Required! Suppliers must verify their mobile phone number via OTP before creating their first shipment.');
      return;
    }
    if (!receiverName.trim()) {
      setError('Please enter the Recipient Name.');
      return;
    }
    if (!receiverPhone.trim()) {
      setError('Please enter the Recipient Phone Number.');
      return;
    }
    if (!receiverAddress.trim()) {
      setError('Please enter the Recipient Delivery Address.');
      return;
    }
    if (!receiverPincode || receiverPincode.length < 6) {
      setError('Please enter a valid 6-digit Receiver Delivery Pincode to view delivery rates.');
      return;
    }

    await fetchQuotes(paymentMode);
    setModalStep(2);
  };

  const fetchQuotes = async (targetMode = paymentMode, isSecure = secureShipmentEnabled) => {
    setFetchingQuotes(true);
    setError('');
    try {
      const isCod = targetMode === 'cod';
      const decVal = parseFloat(amount) || 2500;
      const res = await agentAPI.getCarrierRates({
        fromPincode: senderPincode,
        toPincode: receiverPincode,
        weightKg: parseFloat(parcelWeight) || 0.5,
        paymentMode: targetMode,
        cod: isCod ? 1 : 0,
        amount: decVal,
        declaredValue: decVal,
        isSecureShipment: isSecure
      });

      const quotes = res.data?.quotes || [];
      setCarrierQuotes(quotes);
      setRouteInfo({
        fromZone: res.data?.fromZone,
        toZone: res.data?.toZone
      });

      if (quotes.length > 0) {
        setSelectedQuote(prev => {
          if (prev) {
            const matched = quotes.find(q => q.slug === prev.slug);
            if (matched) return matched;
          }
          return quotes[0];
        });
      }
    } catch (err) {
      console.error('Failed to fetch carrier quotes in modal:', err);
      setError(err.response?.data?.error || 'Could not fetch live rates for this pincode. Please verify the pincode.');
    } finally {
      setFetchingQuotes(false);
    }
  };

  // Step 2 Submit: Finalize booking with selected courier
  const handleFinalizeBooking = async () => {
    if (!selectedQuote) return;
    setLoading(true);
    setError('');

    try {
      const isCod = paymentMode === 'cod';
      const payload = {
        receiverName,
        receiverPhone,
        receiverAddress,
        receiverPincode,
        parcelWeight: parseFloat(parcelWeight) || 0.5,
        description,
        amount: Number(amount),
        city: cityRoute,
        senderAddress,
        senderPincode,
        carrierSlug: selectedQuote.baseSlug || selectedQuote.slug,
        deliveryCharge: selectedQuote.exactRate || selectedQuote.price,
        paymentMode,
        isPrepaid: !isCod,
        codCharge: isCod ? (selectedQuote.codCharge || 52) : 0,
        fundEscrow: isCod ? false : fundImmediately,
        returnAllowed,
        photoReviewEnabled: true,
        rtoProtectionEnabled
      };

      const res = await shipmentAPI.createShipment(payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Create Shipment Modal API Error:', err);
      if (err.response?.data?.code === 'PHONE_VERIFICATION_REQUIRED' || err.response?.data?.error === 'Phone verification required') {
        setPhoneVerified(false);
        setModalStep(1);
        setError('Phone verification required before your first shipment. Please verify your mobile number above.');
        return;
      }
      setError(err.response?.data?.error || err.message || 'Failed to create shipment. Please verify details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl ${modalStep === 2 ? 'w-[96vw] max-w-7xl max-h-[94vh]' : 'w-full max-w-xl max-h-[94vh]'} p-4 sm:p-6 shadow-2xl relative border border-slate-100 flex flex-col overflow-hidden transition-all duration-200 animate-in zoom-in-95`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold shrink-0">
            {modalStep === 1 ? <ShieldCheck className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {modalStep === 1 ? 'Create Courier Shipment Booking' : 'Select Delivery Courier & Review Rates'}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Step {modalStep} of 2
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {modalStep === 1 
                ? 'Fill recipient details to compare real-time delivery rates'
                : `Live rates & ratings for delivery to receiver pincode ${receiverPincode}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SHIPMENT DETAILS FORM */}
        {modalStep === 1 && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Repeat Shipment Info Banner */}
            {initialData?.repeatSourceId && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200/90 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-blue-950">
                        Repeating Shipment #{initialData.repeatSourceId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-200/80 text-blue-800">
                        Pre-filled
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700/90 font-medium">
                      Exact recipient &amp; package details copied! You can edit any field below or proceed directly to courier rates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mandatory Phone Verification Before First Shipment */}
            {!phoneVerified && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-blue-950 text-xs">Mandatory Mobile Verification Required</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-200/80 text-blue-800">FIRST SHIPMENT</span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-0.5">Please verify your phone number via OTP before creating your first shipment.</p>
                  </div>
                </div>

                {phoneError && <p className="text-[11px] text-rose-600 font-semibold">{phoneError}</p>}
                {phoneSuccessMsg && <p className="text-[11px] text-emerald-700 font-semibold">{phoneSuccessMsg}</p>}

                {!phoneOtpSent ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Your 10-digit mobile number"
                      value={verifyPhone}
                      onChange={(e) => setVerifyPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneLoading || !verifyPhone}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {phoneLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold tracking-widest text-center"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        disabled={phoneLoading || phoneOtp.length < 4}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {phoneLoading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                    {phoneDebugOtp && (
                      <p className="text-[10px] text-blue-600 font-mono">Demo OTP: {phoneDebugOtp}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleProceedToCouriers} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Nair"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Street / Delivery Address *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, Near Dadar Station"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receiver Delivery Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 400001 (Mumbai)"
                    value={receiverPincode}
                    onChange={(e) => setReceiverPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parcel Dead Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.5"
                    value={parcelWeight}
                    onChange={(e) => setParcelWeight(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Value / Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="3420"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                  />
                  {amount && Number(amount) > 0 && (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <span className="font-semibold">Platform Fee:</span>
                      <span className="font-bold">FREE (₹0) ✓</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Route (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai → Bengaluru"
                    value={cityRoute}
                    onChange={(e) => setCityRoute(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('prepaid')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'prepaid'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Prepaid (Escrow)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cod')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'cod'
                        ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-xs ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cash on Delivery (COD)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PlayStation 5 Console (Factory Sealed)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enable Return Option</p>
                    <p className="text-[10px] text-slate-500">Allows buyer to request return within 24h of delivery</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={returnAllowed}
                    onChange={(e) => setReturnAllowed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={fetchingQuotes}
                className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {fetchingQuotes ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating Courier Rates &amp; Ratings...</span>
                  </div>
                ) : (
                  <>
                    <span>Compare Courier Rates &amp; Ratings ➔</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: COURIER RATES & RATINGS SELECTION */}
        {modalStep === 2 && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Unified Route & Controls Toolbar */}
            <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30 rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Route & Package Specs */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200/90 shadow-2xs font-mono text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{senderPincode}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  <span className="flex items-center gap-1.5 text-blue-700 font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{receiverPincode}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold shadow-2xs">
                  <span className="text-slate-400 font-medium">Weight:</span>
                  <strong className="text-slate-900 font-mono">{parcelWeight} kg</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold shadow-2xs">
                  <span className="text-slate-400 font-medium">{paymentMode === 'cod' ? 'COD Value:' : 'Declared:'}</span>
                  <strong className="text-slate-900 font-mono">₹{Number(amount || 2500).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Mode Selector & Secure Cover Toggle */}
              <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={async () => {
                      setPaymentMode('prepaid');
                      await fetchQuotes('prepaid', secureShipmentEnabled);
                    }}
                    disabled={fetchingQuotes}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      paymentMode === 'prepaid'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Prepaid (Escrow)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setPaymentMode('cod');
                      await fetchQuotes('cod', secureShipmentEnabled);
                    }}
                    disabled={fetchingQuotes}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      paymentMode === 'cod'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash on Delivery (COD)</span>
                  </button>
                </div>

                {/* Secure Cover (Default OFF) */}
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !secureShipmentEnabled;
                    setSecureShipmentEnabled(nextVal);
                    await fetchQuotes(paymentMode, nextVal);
                  }}
                  disabled={fetchingQuotes}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    secureShipmentEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Shipment transit insurance cover"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${secureShipmentEnabled ? 'text-white' : 'text-slate-400'}`} />
                  <span>Secure Cover {secureShipmentEnabled ? 'ON (+₹54)' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            {!fetchingQuotes && carrierQuotes.length > 0 && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                             <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => { setCarrierTab('all'); setOnlyCloseToWeight(true); }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'all' && onlyCloseToWeight
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-blue-400" />
                    <span>Close to {parcelWeight || 0.5} KG</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'all' && onlyCloseToWeight ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {carrierStats.suitableCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierTab('cheapest')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'cheapest'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Top Cheapest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierTab('nimbuspost')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'nimbuspost'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 border border-purple-200/60 hover:bg-purple-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>via NimbusPost</span>
                    {carrierStats.nimbusCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'nimbuspost' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                        {carrierStats.nimbusCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierTab('shiprocket')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'shiprocket'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>via Shiprocket</span>
                    {carrierStats.srCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'shiprocket' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                        {carrierStats.srCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierTab('surface')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'surface'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Surface</span>
                    {carrierStats.surfaceCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'surface' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                        {carrierStats.surfaceCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierTab('air')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      carrierTab === 'air'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-sky-50 text-sky-700 border border-sky-200/60 hover:bg-sky-100'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Air Express</span>
                    {carrierStats.airCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'air' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>
                        {carrierStats.airCount}
                      </span>
                    )}
                  </button>

                  {carrierStats.heavyCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setCarrierTab('heavy'); setOnlyCloseToWeight(false); }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        carrierTab === 'heavy'
                          ? 'bg-orange-700 text-white shadow-xs'
                          : 'bg-orange-50 text-orange-800 border border-orange-200/70 hover:bg-orange-100'
                      }`}
                      title="Bulk heavy freight slabs (5 KG - 20 KG)"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Heavy Cargo (5-20 KG)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${carrierTab === 'heavy' ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-900'}`}>
                        {carrierStats.heavyCount}
                      </span>
                    </button>
                  )}
                </div>

                {/* Search, Weight Toggle, Sort & View Mode */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-[140px] md:w-44">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={carrierSearch}
                      onChange={(e) => setCarrierSearch(e.target.value)}
                      placeholder="Search Ekart, 10 K.G..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOnlyCloseToWeight(!onlyCloseToWeight);
                      if (carrierTab === 'heavy') setCarrierTab('all');
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      onlyCloseToWeight
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={onlyCloseToWeight ? 'Click to show all weight slabs including heavy 10-20 KG' : 'Click to filter only couriers matching your parcel weight'}
                  >
                    <Scale className="w-3 h-3 text-blue-600" />
                    <span>{onlyCloseToWeight ? `≤${parcelWeight || 0.5} KG Matching` : 'All Weights'}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCarrierSort('price')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${carrierSort === 'price' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Sort by lowest price"
                    >
                      ₹ Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarrierSort('rating')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${carrierSort === 'rating' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Sort by customer rating"
                    >
                      ★ Rating
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setRateViewMode('grid')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${rateViewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Cards View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRateViewMode('table')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${rateViewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Organized Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Best Deal Banner */}
            {!fetchingQuotes && carrierStats.cheapest && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-blue-50 border border-emerald-300/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200/80 border border-emerald-300 px-2 py-0.5 rounded-md">
                        AI Recommended Best Deal
                      </span>
                      {carrierStats.savings > 0 && (
                        <span className="text-xs font-bold text-slate-700">
                          Save up to <strong className="text-emerald-700 font-mono font-black">₹{carrierStats.savings.toFixed(2)}</strong>!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <strong>{carrierStats.cheapest.name || carrierStats.cheapest.courierPartner}</strong> via <strong className="text-slate-900 font-bold">{carrierStats.cheapest.aggregatorName || (carrierStats.cheapest.slug.startsWith('nimbus') ? 'NimbusPost' : 'Shiprocket')}</strong> at only <strong className="text-emerald-800 font-mono font-black">₹{Number(carrierStats.cheapest.exactRate ?? carrierStats.cheapest.price ?? 0).toFixed(2)}</strong> ({carrierStats.cheapest.eta}).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuote(carrierStats.cheapest)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Select Deal (₹{Number(carrierStats.cheapest.exactRate ?? carrierStats.cheapest.price ?? 0).toFixed(2)})</span>
                </button>
              </div>
            )}

            {/* Courier Rates Section */}
            {fetchingQuotes ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-slate-800">Fetching live rates across NimbusPost &amp; Shiprocket...</p>
                <p className="text-xs text-slate-500">Pinging both multi-carrier gateways in parallel</p>
              </div>
            ) : sortedCarrierQuotes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="text-sm font-bold text-slate-700">No couriers match your filter</p>
                <p className="text-xs">Try selecting a different tab, clearing search, or showing all weight slabs.</p>
                <button
                  type="button"
                  onClick={() => { setCarrierTab('all'); setCarrierSearch(''); setOnlyCloseToWeight(false); }}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset Filters &amp; Show All
                </button>
              </div>
            ) : rateViewMode === 'table' ? (
              /* Enterprise Organized Table View */
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-[52vh] scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/90 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-2.5 px-3.5">Courier Partner</th>
                        <th className="py-2.5 px-3">Gateway</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Weight Slab</th>
                        <th className="py-2.5 px-3">Est. Delivery</th>
                        <th className="py-2.5 px-3 text-right">Freight</th>
                        {paymentMode === 'cod' && <th className="py-2.5 px-3 text-right">COD Fee</th>}
                        <th className="py-2.5 px-3.5 text-right font-black text-slate-700">Total Rate</th>
                        <th className="py-2.5 px-3 text-center">Rating</th>
                        <th className="py-2.5 px-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedCarrierQuotes.map((quote) => {
                        const isSelected = selectedQuote?.slug === quote.slug;
                        const displayRate = Number(quote.exactRate ?? quote.price ?? 0);
                        const codFee = Number(quote.codCharge || 0);
                        const secureFee = Number(quote.secureShipmentCharge || (secureShipmentEnabled ? 54 : 0));
                        const waFee = Number(quote.whatsappCharge || 5.00);
                        const freightFee = Number(quote.freightCharge || (displayRate - codFee - secureFee - waFee));
                        const isNimbus = quote.aggregator === 'nimbuspost' || (quote.slug && quote.slug.startsWith('nimbus'));
                        const isAir = (quote.mode || '').toLowerCase().includes('air') || (quote.name || '').toLowerCase().includes('air');
                        const isHeavy = quote.minWeightKg && quote.minWeightKg >= 5;

                        return (
                          <tr
                            key={quote.slug}
                            onClick={() => setSelectedQuote(quote)}
                            className={`cursor-pointer transition-colors duration-100 ${
                              isSelected
                                ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <CarrierLogo
                                  slug={quote.baseSlug || quote.slug}
                                  name={quote.name}
                                  size="sm"
                                  className="shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 truncate">
                                    {quote.courierPartner || quote.name}
                                  </div>
                                  {quote.isLowest && (
                                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                      Lowest Rate
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isNimbus ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                  NimbusPost
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                  Shiprocket
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isAir ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                                <span>{isAir ? 'Air' : 'Surface'}</span>
                              </span>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isHeavy ? 'bg-orange-100 text-orange-900 border border-orange-200 font-extrabold' : 'bg-slate-100 text-slate-700'
                              }`}>
                                <Scale className="w-3 h-3 text-slate-500" />
                                <span>{quote.weightSlab || `${parcelWeight || 0.5} K.G`}</span>
                              </span>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>{quote.eta || '2-3 Days'}</span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                              ₹{freightFee.toFixed(2)}
                            </td>

                            {paymentMode === 'cod' && (
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                                ₹{codFee.toFixed(2)}
                              </td>
                            )}

                            <td className="py-2.5 px-3.5 text-right font-mono font-black text-slate-900 text-sm">
                              ₹{displayRate.toFixed(2)}
                            </td>

                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                {quote.rating ? quote.rating.toFixed(1) : '4.7'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuote(quote);
                                }}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                                }`}
                              >
                                {isSelected ? 'Selected ✓' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Spacious Organized 3-Column Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sortedCarrierQuotes.map((quote) => {
                  const isSelected = selectedQuote?.slug === quote.slug;
                  const displayRate = Number(quote.exactRate ?? quote.price ?? 0);
                  const codFee = Number(quote.codCharge || 0);
                  const secureFee = Number(quote.secureShipmentCharge || (secureShipmentEnabled ? 54 : 0));
                  const waFee = Number(quote.whatsappCharge || 5.00);
                  const freightFee = Number(quote.freightCharge || (displayRate - codFee - secureFee - waFee));
                  const isNimbus = quote.aggregator === 'nimbuspost' || (quote.slug && quote.slug.startsWith('nimbus'));
                  const isAir = (quote.mode || '').toLowerCase().includes('air') || (quote.name || '').toLowerCase().includes('air');
                  const isHeavy = quote.minWeightKg && quote.minWeightKg >= 5;

                  return (
                    <div
                      key={quote.slug}
                      onClick={() => setSelectedQuote(quote)}
                      className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between text-left select-none relative group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500 shadow-md scale-[1.01]'
                          : 'border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Header: Logo, Name, Gateway, Mode, Weight Slab & Radio */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CarrierLogo 
                              slug={quote.baseSlug || quote.slug} 
                              name={quote.name} 
                              size="md" 
                              className={`shrink-0 ${isSelected ? 'ring-2 ring-blue-500 shadow-2xs' : 'shadow-2xs'}`}
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-900 truncate leading-snug">
                                {quote.courierPartner || quote.name}
                              </h4>
                              
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {isNimbus ? (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                    NimbusPost
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                    Shiprocket
                                  </span>
                                )}

                                <span className={`inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                                  isAir ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {isAir ? <Plane className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                                  <span>{isAir ? 'Air' : 'Surface'}</span>
                                </span>

                                <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                                  isHeavy ? 'bg-orange-100 text-orange-900 border border-orange-200 font-extrabold' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <Scale className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{quote.weightSlab || `${parcelWeight || 0.5} K.G`}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition mt-0.5 ${
                            isSelected ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-300 bg-white group-hover:border-slate-400'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Mid Strip: Full ETA and Rating */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{quote.eta || '2-3 Days'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {quote.rating ? quote.rating.toFixed(1) : '4.7'}
                            </span>

                            {quote.isLowest && (
                              <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                                Lowest Rate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Pricing Container */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            {paymentMode === 'cod' ? 'Total COD Rate' : 'Total Rate'}
                          </span>
                          <span className="text-base font-black text-slate-900 font-mono leading-tight">
                            ₹{displayRate.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-right text-[10.5px]">
                          {paymentMode === 'cod' ? (
                            <div className="font-medium text-slate-600 space-y-0.2">
                              <div>Freight: <strong className="text-slate-800 font-mono">₹{freightFee.toFixed(2)}</strong></div>
                              <div>COD: <strong className="text-emerald-700 font-mono font-bold">₹{codFee.toFixed(2)}</strong></div>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">All taxes incl.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={loading || !selectedQuote}
                onClick={handleFinalizeBooking}
                className="flex-1 py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Finalize with {selectedQuote?.name} (₹{Number(selectedQuote?.exactRate ?? selectedQuote?.price ?? 0).toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
