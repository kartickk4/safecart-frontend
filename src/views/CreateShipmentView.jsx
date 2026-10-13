import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, CheckCircle2, ArrowRight, Download, Copy, Printer, Package, 
  Truck, ArrowLeft, Building, AlertTriangle, ExternalLink, Link as LinkIcon, 
  Check, RotateCcw, MessageSquare, Camera, Sparkles, Bot, MapPin, Edit3, 
  Phone, Send, RefreshCw, Wallet, CreditCard, QrCode, Landmark, Lock, X,
  Star, ChevronRight, Zap, Award, Clock
} from 'lucide-react';
import { shipmentAPI, profileAPI, agentAPI } from '../services/api';
import RechargeModal from '../components/RechargeModal';
import CarrierLogo from '../components/CarrierLogo';



export default function CreateShipmentView({ onBack, onCreated, user, onOpenProfile, onUpdateUser }) {
  const [step, setStep] = useState(1); // 1: Form | 2: Success Confirmation Screen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedPickupToken, setCopiedPickupToken] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Bank details are optional — users can withdraw on-demand via UPI or Bank transfer without adding bank info upfront.

  // Seller pickup address state
  const defaultPickupStreet = user?.pickupAddress?.street || user?.address || '';
  const defaultPickupCity = user?.pickupAddress?.city || user?.city || '';
  const defaultPickupState = user?.pickupAddress?.state || user?.state || '';
  const defaultPickupPincode = user?.pickupAddress?.pincode || user?.pincode || '';
  const [senderAddress, setSenderAddress] = useState(
    defaultPickupStreet ? `${defaultPickupStreet}${defaultPickupCity ? ', ' + defaultPickupCity : ''}` : ''
  );
  const [senderPincode, setSenderPincode] = useState(defaultPickupPincode);
  const [showPickupForm, setShowPickupForm] = useState(!defaultPickupStreet);
  const [pickupSavedNotice, setPickupSavedNotice] = useState('');

  // Form states
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');
  const [parcelWeight, setParcelWeight] = useState('0.5');
  const [parcelLength, setParcelLength] = useState('15');
  const [parcelWidth, setParcelWidth] = useState('10');
  const [parcelHeight, setParcelHeight] = useState('5');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('3420');
  const [cityRoute, setCityRoute] = useState('');
  const [carrierSlug, setCarrierSlug] = useState('auto'); // 'auto' = pick cheapest by pincode zone
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [carrierQuotes, setCarrierQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [fetchingQuotes, setFetchingQuotes] = useState(false);
  const [carrierQuotesError, setCarrierQuotesError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const sortedCarrierQuotes = useMemo(() => {
    return [...carrierQuotes].sort((a, b) => a.price - b.price);
  }, [carrierQuotes]);

  const [paymentMode, setPaymentMode] = useState('prepaid'); // 'prepaid' | 'cod' | 'paid_offline'
  const [returnAllowed, setReturnAllowed] = useState(true);
  const isNonEcommerce = user?.platformType !== 'ecommerce';
  const [photoReviewEnabled, setPhotoReviewEnabled] = useState(true);
  const [rtoProtectionEnabled, setRtoProtectionEnabled] = useState(false);

  // Volumetric weight helper
  const volWeight = parseFloat((((parseFloat(parcelLength) || 15) * (parseFloat(parcelWidth) || 10) * (parseFloat(parcelHeight) || 5)) / 5000).toFixed(2));
  const activeBillableWeight = Math.max(parseFloat(parcelWeight) || 0.5, volWeight);

  // COD Upfront Fees & Settlement State
  const [codQuote, setCodQuote] = useState({
    deliveryCharge: 40,
    codCharge: 40,
    totalCharge: 80,
    walletBalance: Number(user?.walletBalance) || 0,
    canAdjustWallet: (Number(user?.walletBalance) || 0) >= 80,
    shortfall: Math.max(0, 80 - (Number(user?.walletBalance) || 0)),
    carrierName: 'Delhivery Express'
  });
  const [fetchingCodQuote, setFetchingCodQuote] = useState(false);
  const [showCodPaymentModal, setShowCodPaymentModal] = useState(false);
  const [payingCodFee, setPayingCodFee] = useState(false);
  const [codPaymentMethod, setCodPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [codUpiId, setCodUpiId] = useState(user?.phone ? `${user.phone}@upi` : 'supplier@upi');

  // Live COD Quote calculation when COD is active
  useEffect(() => {
    if (paymentMode !== 'cod') return;
    let isMounted = true;
    const fetchQuote = async () => {
      setFetchingCodQuote(true);
      try {
        const res = await shipmentAPI.quoteCodFees({
          amount: Number(amount) || 0,
          senderPincode,
          receiverPincode,
          parcelWeight: parseFloat(parcelWeight) || 0.5,
          parcelLength: parseFloat(parcelLength) || 15,
          parcelWidth: parseFloat(parcelWidth) || 10,
          parcelHeight: parseFloat(parcelHeight) || 5,
          carrierSlug
        });
        if (isMounted && res.data) {
          setCodQuote(res.data);
        }
      } catch (e) {
        const delCharge = 40;
        const cCharge = 40;
        const tot = delCharge + cCharge;
        const wb = Number(user?.walletBalance) || 0;
        if (isMounted) {
          setCodQuote({
            deliveryCharge: delCharge,
            codCharge: cCharge,
            totalCharge: tot,
            walletBalance: wb,
            canAdjustWallet: wb >= tot,
            shortfall: Math.max(0, tot - wb),
            carrierName: 'Delhivery Express'
          });
        }
      } finally {
        if (isMounted) setFetchingCodQuote(false);
      }
    };

    const timer = setTimeout(fetchQuote, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [paymentMode, senderPincode, receiverPincode, parcelWeight, parcelLength, parcelWidth, parcelHeight, carrierSlug, amount, user?.walletBalance]);

  // Phone verification state for mandatory first shipment phone check
  const isUserPhoneVerified = Boolean(user?.phone && user?.isPhoneVerified);
  const [phoneVerified, setPhoneVerified] = useState(isUserPhoneVerified);
  const [verifyPhone, setVerifyPhone] = useState(user?.phone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');
  const [phoneDebugOtp, setPhoneDebugOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

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
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
      setPhoneSuccessMsg('Phone verified successfully! You can now book your shipment.');
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

  // Success state
  const [createdData, setCreatedData] = useState(null);

  const fetchQuotesForRoute = async (preferredSlug = null) => {
    if (!senderPincode || senderPincode.length < 6) {
      setError('Please provide a valid 6-digit Pickup Pincode.');
      return null;
    }
    if (!receiverPincode || receiverPincode.length < 6) {
      setError('Please enter a valid 6-digit Receiver Delivery Pincode to view courier rates and ratings.');
      return null;
    }

    setFetchingQuotes(true);
    setCarrierQuotesError('');

    try {
      const res = await agentAPI.getCarrierRates({
        fromPincode: senderPincode,
        toPincode: receiverPincode,
        weightKg: parseFloat(parcelWeight) || 0.5,
        length: parseFloat(parcelLength) || 15,
        width: parseFloat(parcelWidth) || 10,
        height: parseFloat(parcelHeight) || 5
      });

      const quotes = res.data?.quotes || [];
      setCarrierQuotes(quotes);
      setRouteInfo({
        fromZone: res.data?.fromZone,
        toZone: res.data?.toZone
      });

      let chosen = null;
      if (preferredSlug && preferredSlug !== 'auto') {
        chosen = quotes.find(q => q.slug === preferredSlug);
      }
      if (!chosen && selectedQuote) {
        chosen = quotes.find(q => q.slug === selectedQuote.slug);
      }
      if (!chosen && quotes.length > 0) {
        chosen = quotes[0]; // Lowest price quote
      }

      if (chosen) {
        setSelectedQuote(chosen);
        setCarrierSlug(chosen.slug);
      }

      return quotes;
    } catch (err) {
      console.error('Failed to fetch carrier quotes:', err);
      setCarrierQuotesError(err.response?.data?.error || 'Could not fetch live rates. Please check pincodes.');
      return null;
    } finally {
      setFetchingQuotes(false);
    }
  };

  const handleOpenCourierModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    // Mandatory check: Supplier phone must be verified before first shipment
    if (!phoneVerified) {
      setError('Mobile Number Verification Required! Suppliers must verify their mobile phone number via OTP before creating their first shipment.');
      setPhoneError('Please verify your mobile number here before proceeding with your shipment booking.');
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
    if (!senderPincode || senderPincode.length < 6) {
      setError('Please enter a valid 6-digit Pickup Pincode.');
      return;
    }
    if (!receiverPincode || receiverPincode.length < 6) {
      setError('Please enter a valid 6-digit Receiver Delivery Pincode to view courier delivery rates.');
      return;
    }

    const quotes = await fetchQuotesForRoute(carrierSlug);
    if (quotes && quotes.length > 0) {
      setShowCarrierModal(true);
    }
  };

  const handleFinalizeWithCourier = async (quoteToUse = null) => {
    const quote = quoteToUse || selectedQuote;
    if (!quote) return;

    setCarrierSlug(quote.slug);
    setSelectedQuote(quote);
    setShowCarrierModal(false);

    // If COD, verify wallet sufficiency with this courier's rate
    if (paymentMode === 'cod') {
      const requiredDelivery = quote.price;
      const requiredCodFee = codQuote.codCharge || 40;
      const totalFee = requiredDelivery + requiredCodFee;
      const currentWallet = Number(user?.walletBalance) || 0;

      if (currentWallet < totalFee) {
        setCodQuote(prev => ({
          ...prev,
          deliveryCharge: requiredDelivery,
          codCharge: requiredCodFee,
          totalCharge: totalFee,
          carrierName: quote.name,
          canAdjustWallet: false,
          shortfall: totalFee - currentWallet
        }));
        setShowCodPaymentModal(true);
        return;
      }
    }

    await executeBooking({
      carrierSlug: quote.slug,
      deliveryCharge: quote.price
    });
  };

  const executeBooking = async (overrideParams = null) => {
    setLoading(true);
    setError('');

    const targetCarrierSlug = overrideParams?.carrierSlug || selectedQuote?.slug || carrierSlug;
    const targetDeliveryCharge = overrideParams?.deliveryCharge || selectedQuote?.price || codQuote.deliveryCharge;

    const currentWalletBal = Number(user?.walletBalance) || 0;
    if (currentWalletBal < 0 && (paymentMode === 'cod' || paymentMode === 'paid_offline')) {
      setError(`Your seller wallet balance is negative (-₹${Math.abs(currentWalletBal).toFixed(2)}). COD and Offline Paid shipment bookings are suspended until outstanding dues are cleared. Please select Prepaid Escrow or recharge your wallet.`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        receiverName,
        receiverPhone,
        receiverAddress,
        receiverPincode,
        parcelWeight: parseFloat(parcelWeight) || 0.5,
        parcelLength: parseFloat(parcelLength) || 15,
        parcelWidth: parseFloat(parcelWidth) || 10,
        parcelHeight: parseFloat(parcelHeight) || 5,
        description,
        amount: Number(amount),
        city: cityRoute,
        senderAddress,
        senderPincode,
        carrierSlug: targetCarrierSlug,
        fundEscrow: paymentMode === 'paid_offline',
        paymentMode,
        isPrepaid: paymentMode === 'prepaid' || paymentMode === 'paid_offline',
        returnAllowed,
        photoReviewEnabled: true,
        rtoProtectionEnabled: paymentMode === 'prepaid' ? Boolean(rtoProtectionEnabled) : false,
        deliveryCharge: targetDeliveryCharge,
        codCharge: codQuote.codCharge
      };

      if (overrideParams?.paidUpfront || overrideParams?.txnId) {
        payload.paidUpfront = true;
        payload.paymentTxnId = overrideParams.txnId || (`PAY_COD_${Date.now()}`);
      }

      const res = await shipmentAPI.createShipment(payload);

      setCreatedData(res.data);
      if (res.data?.walletBalanceRemaining !== undefined && onUpdateUser) {
        onUpdateUser({ ...user, walletBalance: res.data.walletBalanceRemaining });
      }
      setStep(2); // Move to Shipment Success Confirmation view
      if (onCreated) onCreated(res.data);
    } catch (err) {
      console.error('Create Shipment API Error:', err);
      if (err.response?.data?.code === 'COD_PAYMENT_REQUIRED') {
        setShowCodPaymentModal(true);
        setError(err.response.data.message);
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create shipment. Please verify bank details and recipient info.';
        setError(msg);
        if (err.response?.data?.code === 'PHONE_VERIFICATION_REQUIRED' || err.response?.data?.error === 'Phone verification required') {
          setPhoneVerified(false);
          setPhoneError('Phone verification is mandatory before booking your first shipment. Please verify below.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleOpenCourierModal(e);
  };

  const handleCodUpfrontPay = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPayingCodFee(true);
    setTimeout(async () => {
      setPayingCodFee(false);
      setShowCodPaymentModal(false);
      await executeBooking({
        txnId: `CF_COD_${Date.now()}`,
        paidUpfront: true,
        carrierSlug: selectedQuote?.slug || carrierSlug,
        deliveryCharge: selectedQuote?.price || codQuote.deliveryCharge
      });
    }, 1000);
  };

  return (
    <div className="px-4 py-5 md:p-8 max-w-4xl mx-auto space-y-5 md:space-y-8">
      {/* STEP 1: MULTI-STEP CREATION WIZARD */}
      {step === 1 && (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Create Escrow Shipment Booking</h1>
              <p className="text-xs text-slate-500">Fill in the order details to lock funds in SecureKaro RBI-compliant escrow.</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mandatory Phone Verification Before First Shipment Card — hidden once verified */}
            {!phoneVerified && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/90 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-blue-950 text-sm">Mandatory Mobile Verification Required</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200/80 text-blue-800">
                          FIRST SHIPMENT
                        </span>
                      </div>
                      <p className="text-xs text-blue-800 mt-1">
                        To guarantee courier pickup coordination and prevent fraud, suppliers must verify their mobile phone number via 6-digit OTP before booking their first shipment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Verification Box */}
                <div className="bg-white p-5 rounded-2xl border border-blue-200 space-y-4">
                  {phoneError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}

                  {phoneSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{phoneSuccessMsg}</span>
                    </div>
                  )}

                  {!phoneOtpSent ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:flex-1 relative">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Mobile Number (10 Digits) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+91</span>
                          <input
                            type="tel"
                            value={verifyPhone}
                            onChange={(e) => setVerifyPhone(e.target.value)}
                            placeholder="98765 43210"
                            className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneLoading || !verifyPhone}
                        className="w-full sm:w-auto sm:self-end py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send Verification OTP</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Enter the 6-digit OTP sent to <strong className="text-slate-900">{verifyPhone}</strong></span>
                        <button
                          type="button"
                          onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); }}
                          className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          maxLength="6"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-mono tracking-widest font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={phoneLoading || phoneOtp.length < 4}
                          className="w-full sm:w-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Verify & Unlock First Shipment</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={resendTimer > 0 || phoneLoading}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold transition disabled:opacity-40 cursor-pointer"
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                      </div>

                      {phoneDebugOtp && (
                        <div className="p-2 rounded-lg bg-blue-100/70 border border-blue-200 text-blue-900 text-[11px] font-mono flex items-center justify-between">
                          <span>Demo / Test OTP Code: <strong>{phoneDebugOtp}</strong></span>
                          <button
                            type="button"
                            onClick={() => setPhoneOtp(phoneDebugOtp)}
                            className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Courier Pickup Location Notice / Compact Hub Bar */}
            {senderAddress ? (
              <div className="flex items-center justify-between text-xs py-2.5 px-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-600">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E56E3] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate text-xs">
                    Pickup Hub: <strong className="text-slate-800">{senderAddress}</strong> {senderPincode ? `(Pincode: ${senderPincode})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickupForm(!showPickupForm)}
                  className="text-[11px] font-bold text-[#1E56E3] hover:underline shrink-0 ml-3"
                >
                  {showPickupForm ? 'Hide' : 'Edit Location'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900">No Courier Pickup Address Set</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Couriers need your warehouse/shop address to dispatch pickup executives.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickupForm(true)}
                  className="shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Set Pickup Address
                </button>
              </div>
            )}

            {/* Expandable Pickup Address Form */}
            {showPickupForm && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1E56E3]" />
                    <span>Courier Parcel Pickup Details</span>
                  </h4>
                  {pickupSavedNotice && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {pickupSavedNotice}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Warehouse / Shop / Flat Pickup Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop 12, Ground Floor, MG Road Market"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pickup Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 560001"
                      value={senderPincode}
                      onChange={(e) => setSenderPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!senderAddress || !senderPincode) return;
                      try {
                        await profileAPI.updateProfile({
                          address: senderAddress,
                          pincode: senderPincode,
                          pickupAddress: { street: senderAddress, pincode: senderPincode }
                        });
                        setPickupSavedNotice('✓ Saved to profile');
                        setTimeout(() => setPickupSavedNotice(''), 3000);
                      } catch (err) {}
                      setShowPickupForm(false);
                    }}
                    className="px-4 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    Confirm & Use for Pickup
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Nair"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Escrow Value (₹ INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="3420"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Indian Carrier Partner</label>

                  {selectedQuote ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CarrierLogo slug={selectedQuote.slug} name={selectedQuote.name} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900">{selectedQuote.name}</h4>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {selectedQuote.rating ? selectedQuote.rating.toFixed(1) : '4.6'}
                            </span>
                            {selectedQuote.isLowest && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Lowest Rate
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Delivery: <strong className="text-slate-800 font-mono font-bold">₹{selectedQuote.price}</strong> · ETA: <strong className="text-slate-800">{selectedQuote.eta}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenCourierModal}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <select
                      value={carrierSlug}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCarrierSlug(val);
                        if (val !== 'auto' && carrierQuotes.length > 0) {
                          const found = carrierQuotes.find(q => q.slug === val);
                          if (found) setSelectedQuote(found);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                    >
                      <option value="auto">Auto-Select Cheapest Courier</option>
                      <option value="delhivery">Delhivery Express</option>
                      <option value="rapido">Rapido Parcel / Express (Hyperlocal & Surface)</option>
                      <option value="shadowfax">Shadowfax Technologies</option>
                      <option value="ekart">Ekart Logistics</option>
                      <option value="xpressbees">Xpressbees Logistics</option>
                      <option value="dtdc">DTDC Express</option>
                      <option value="ecom_express">Ecom Express</option>
                      <option value="bluedart">BlueDart Express</option>
                      <option value="indiapost">India Post Speed Post</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Recipient Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Street / Delivery Address
                  <span className="text-[10px] text-slate-400 font-normal ml-1">(Flat/House no., Street, Landmark)</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, Near Shivaji Park, Dadar West"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                ></textarea>
              </div>

              {/* Receiver Pincode + Parcel Weight — needed for auto carrier rate comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receiver Pincode
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(for carrier rate comparison)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400001 (Mumbai)"
                    value={receiverPincode}
                    onChange={(e) => setReceiverPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dead Weight (kg)
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(actual physical weight)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.5"
                    value={parcelWeight}
                    onChange={(e) => setParcelWeight(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Parcel Dimensions (L x W x H in cm) & Volumetric Weight Indicator */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Parcel Dimensions (cm)</span>
                    <span className="text-[10px] text-slate-500 ml-1.5 font-normal">Courier volumetric rate formula: (L × W × H) ÷ 5000</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    Billable: <span className="text-indigo-600 font-mono font-black">{activeBillableWeight} kg</span>
                    {volWeight > (parseFloat(parcelWeight) || 0.5) && (
                      <span className="text-[9px] text-amber-600 ml-1 font-semibold">(Volumetric applied)</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="15"
                      value={parcelLength}
                      onChange={(e) => setParcelLength(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="10"
                      value={parcelWidth}
                      onChange={(e) => setParcelWidth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="5"
                      value={parcelHeight}
                      onChange={(e) => setParcelHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Route (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai → Bengaluru (Optional)"
                  value={cityRoute}
                  onChange={(e) => setCityRoute(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Contents Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="PlayStation 5 Console (Factory Sealed - Model CFI-1200)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                ></textarea>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Payment Mode</label>
                <p className="text-[11px] text-slate-500 -mt-1">How will the buyer pay for this shipment?</p>

                {/* Negative Wallet Balance Alert Banner */}
                {(Number(user?.walletBalance) || 0) < 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-900">
                          COD &amp; Offline Shipping Suspended — Negative Balance (-₹{Math.abs(Number(user?.walletBalance)).toFixed(2)})
                        </p>
                        <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                          Your seller wallet balance is negative due to previous courier dues. Clear your dues now to instantly unlock <strong>Cash on Delivery (COD)</strong> and <strong>Paid Offline</strong> bookings.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRechargeModal(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Recharge &amp; Unlock COD</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prepaid */}
                  <button
                    type="button"
                    onClick={() => setPaymentMode('prepaid')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                      paymentMode === 'prepaid'
                        ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-200'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">💳</span>
                      {paymentMode === 'prepaid' && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-extrabold ${ paymentMode === 'prepaid' ? 'text-blue-700' : 'text-slate-800'}`}>Prepaid Escrow</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Buyer pays via secure Escrow link. Courier pickup is auto-booked once payment is locked and paid to sender after the delivery confirmed.</p>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => {
                      if ((Number(user?.walletBalance) || 0) < 0) {
                        alert(`🚫 COD Booking Suspended: Your seller wallet balance is negative (-₹${Math.abs(Number(user?.walletBalance)).toFixed(2)}). Please clear your balance in the Wallet tab or select Prepaid Escrow.`);
                        return;
                      }
                      setPaymentMode('cod');
                      setRtoProtectionEnabled(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                      (Number(user?.walletBalance) || 0) < 0
                        ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                        : paymentMode === 'cod'
                        ? 'border-amber-500 bg-amber-50 shadow-sm shadow-amber-200'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">🚚</span>
                      {paymentMode === 'cod' && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-extrabold ${ paymentMode === 'cod' ? 'text-amber-700' : 'text-slate-800'}`}>COD (Cash on Delivery)</p>
                    {(Number(user?.walletBalance) || 0) < 0 ? (
                      <span className="inline-block mt-1 text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
                        Suspended (Negative Balance)
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">No upfront link. Buyer pays courier executive upon delivery.</p>
                    )}
                  </button>

                  {/* Payment Already Paid */}
                  <button
                    type="button"
                    onClick={() => {
                      if ((Number(user?.walletBalance) || 0) < 0) {
                        alert(`🚫 Offline Booking Suspended: Your seller wallet balance is negative (-₹${Math.abs(Number(user?.walletBalance)).toFixed(2)}). Please clear your balance in the Wallet tab or select Prepaid Escrow.`);
                        return;
                      }
                      setPaymentMode('paid_offline');
                      setRtoProtectionEnabled(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                      (Number(user?.walletBalance) || 0) < 0
                        ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                        : paymentMode === 'paid_offline'
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-200'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">✅</span>
                      {paymentMode === 'paid_offline' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-extrabold ${ paymentMode === 'paid_offline' ? 'text-emerald-700' : 'text-slate-800'}`}>Paid Offline</p>
                    {(Number(user?.walletBalance) || 0) < 0 ? (
                      <span className="inline-block mt-1 text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
                        Suspended (Negative Balance)
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Payment received via UPI / bank transfer. Immediate label booking.</p>
                    )}
                  </button>
                </div>

                {/* Contextual hint */}
                {paymentMode === 'prepaid' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-black text-emerald-950">Prepaid Escrow Selected (Zero Doorstep RTO)</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800">FREE ✓</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed pl-6">
                      Buyer pays upfront via secure Cashfree nodal link. Because money is committed, doorstep rejection drops to &lt;4%. SecureKaro escrow is <strong>100% FREE (₹0 platform fee)</strong>. You receive full settlement minus only courier charges.
                    </p>
                  </div>
                )}
                {paymentMode === 'cod' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-black text-amber-950">Transparency Notice: COD Does Not Prevent RTO</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
                        Because no money is held in escrow upfront, the receiver can refuse or reject the parcel at delivery. You remain responsible for round-trip courier shipping charges if rejected. <em>Tip: Educate buyers to use SecureKaro Escrow to lock in zero-RTO protection.</em>
                      </p>
                    </div>

                    {/* COD Upfront Booking Charges & Wallet Adjustment Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-200/90 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-amber-950">COD Upfront Booking Charges</h4>
                            <p className="text-[10px] text-amber-700 font-medium">Delivery charge + COD cash collection fee payable by supplier</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Wallet Balance</span>
                          <span className="text-xs font-extrabold text-slate-800 font-mono">₹{Number(codQuote.walletBalance || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Fee Breakdown Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-bold block">1. Courier Delivery</span>
                          <span className="text-sm font-black text-slate-900 font-mono">₹{codQuote.deliveryCharge}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{codQuote.carrierName || 'Cheapest Partner'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-bold block">2. COD Service Fee</span>
                          <span className="text-sm font-black text-slate-900 font-mono">₹{codQuote.codCharge}</span>
                          <span className="text-[9px] text-slate-400 block">Cash Handling & Verification</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 shadow-2xs">
                          <span className="text-[10px] text-amber-900 font-black block">Total Required Fee</span>
                          <span className="text-sm font-black text-amber-950 font-mono">₹{codQuote.totalCharge}</span>
                          <span className="text-[9px] text-amber-800 font-semibold block">Upfront Supplier Settlement</span>
                        </div>
                      </div>

                      {/* Wallet Adjustment vs Upfront Payment Notification */}
                      {codQuote.canAdjustWallet ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-semibold text-emerald-900">
                              <strong>Wallet Adjustment Enabled:</strong> ₹{codQuote.totalCharge} will be automatically adjusted from your wallet upon booking.
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-black text-[10px] shrink-0">
                            WALLET OK
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2 max-w-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-amber-950">
                                Wallet Balance Shortfall: ₹{codQuote.shortfall}
                              </p>
                              <p className="text-[10px] text-amber-800">
                                Your wallet balance (₹{codQuote.walletBalance}) is less than ₹{codQuote.totalCharge}. You must pay ₹{codQuote.totalCharge} online first before this shipment can be created.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCodPaymentModal(true)}
                            className="px-3.5 py-1.5 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-[11px] font-bold rounded-lg transition shadow-xs shrink-0"
                          >
                            Pay ₹{codQuote.totalCharge} Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {paymentMode === 'paid_offline' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-emerald-700">Payment confirmed offline. Carrier label will be generated immediately upon booking.</p>
                  </div>
                )}
              </div>

              {/* Return Policy Selection */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">Enable Product Return Option for this Parcel</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${returnAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {returnAllowed ? 'Returns Enabled' : 'Returns Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When enabled, buyer can inspect and request a return within 24 hours of delivery. Mentioned in the buyer's payment link SMS. You can also change this later.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={returnAllowed}
                    onChange={(e) => setReturnAllowed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Smart RTO & Undelivered Protection (Default: OFF) */}
              <div className={`rounded-2xl border overflow-hidden transition-all ${
                paymentMode !== 'prepaid'
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-emerald-50/70 border-emerald-200/90'
              }`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      paymentMode !== 'prepaid'
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-900">RTO &amp; Undelivered Protection</p>
                        {paymentMode !== 'prepaid' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Unavailable for {paymentMode === 'cod' ? 'COD' : 'Offline'} (Prepaid Escrow Only)
                          </span>
                        ) : (
                          <>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rtoProtectionEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                              {rtoProtectionEnabled ? 'Protection Active' : 'Disabled'}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ₹40 Seller Compensation
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {paymentMode !== 'prepaid'
                          ? 'Smart RTO Protection is exclusive to Prepaid Escrow orders where payment is secured upfront. For COD and Offline shipments, carrier standard RTO terms apply.'
                          : 'SecureKaro compensates seller ₹40 per rejected parcel — buyers get 2 free rejections/week. From 3rd rejection, buyer pays ₹40 (₹30 to seller, ₹10 to SecureKaro).'}
                      </p>
                    </div>
                  </div>
                  <label className={`relative inline-flex items-center shrink-0 ml-4 ${paymentMode !== 'prepaid' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={paymentMode === 'prepaid' && rtoProtectionEnabled}
                      disabled={paymentMode !== 'prepaid'}
                      onChange={(e) => setRtoProtectionEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Conditions panel — only shown when Protection is ON */}
                {paymentMode === 'prepaid' && rtoProtectionEnabled && (
                  <div className="border-t border-emerald-200 bg-white px-4 py-3.5 space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Fair-Play Rules (When Protection is ON)</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <strong>Buyer's 1st or 2nd rejection in a week:</strong> Buyer gets <strong className="text-emerald-700">100% full refund</strong>. SecureKaro credits seller <strong className="text-emerald-700">+₹40</strong> compensation automatically.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <strong>Buyer's 3rd+ rejection in a week:</strong> Buyer is charged <strong className="text-amber-700">₹40 fair-play fee</strong> — ₹30 goes to seller's wallet, ₹10 to SecureKaro.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✓</span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <strong>No seller penalty, ever.</strong> Sellers are never charged under this protection. Only chronic buyer abuse triggers fair-play fees.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Parcel Photo Verification for all shipments */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900">Mandatory Parcel Photo Before Dispatch</p>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                        Mandatory for All Shipments
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Photo proof of packed parcel & contents is mandatory for all shipments before courier dispatch, ensuring maximum escrow trust and protection for both parties.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <span className="text-xs font-black text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Included (₹0)</span>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || fetchingQuotes}
                className="w-full py-4 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading || fetchingQuotes ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{fetchingQuotes ? 'Calculating Courier Rates & Ratings...' : 'Processing Booking...'}</span>
                  </div>
                ) : selectedQuote ? (
                  paymentMode === 'cod' ? (
                    codQuote.canAdjustWallet ? (
                      <>
                        <span>Finalize COD Shipment with {selectedQuote.name} (₹{selectedQuote.price})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay & Finalize COD with {selectedQuote.name} (₹{selectedQuote.price})</span>
                      </>
                    )
                  ) : (
                    <>
                      <span>Finalize Shipment with {selectedQuote.name} (₹{selectedQuote.price})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    <span>Create Shipment</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Courier Rates & Customer Ratings Comparison Modal */}
            {showCarrierModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Select Courier Partner for Delivery
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Delivery rates &amp; estimated transit to Pincode <strong className="text-slate-800 font-mono">{receiverPincode}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCarrierModal(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Simple Route Info */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>
                        📍 Pickup: <strong className="text-slate-800 font-mono">{senderPincode || 'Sender'}</strong> → Delivery: <strong className="text-blue-600 font-mono">{receiverPincode}</strong>
                      </span>
                      <span>
                        Weight: <strong className="text-slate-800 font-mono">{activeBillableWeight} kg</strong>
                      </span>
                    </div>
                  </div>

                  {/* Modal Body: Courier Cards Grid */}
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
                    {fetchingQuotes ? (
                      <div className="py-16 text-center space-y-2">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-500 font-medium">Fetching available courier rates...</p>
                      </div>
                    ) : carrierQuotesError ? (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
                        <p className="font-bold">{carrierQuotesError}</p>
                        <button
                          type="button"
                          onClick={() => fetchQuotesForRoute(carrierSlug)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sortedCarrierQuotes.map((quote) => {
                          const isSelected = selectedQuote?.slug === quote.slug;

                          return (
                            <div
                              key={quote.slug}
                              onClick={() => {
                                setSelectedQuote(quote);
                                setCarrierSlug(quote.slug);
                              }}
                              className={`rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between text-left select-none ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-3">
                                    <CarrierLogo 
                                      slug={quote.slug} 
                                      name={quote.name} 
                                      size="md" 
                                      className={isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-2xs'}
                                    />
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{quote.name}</h4>
                                      <p className="text-[10px] text-slate-400 font-medium">Surface &amp; Express</p>
                                    </div>
                                  </div>

                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 mt-2.5">
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                    {quote.rating ? quote.rating.toFixed(1) : '4.6'}
                                  </span>
                                  {quote.isLowest && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      Lowest Rate
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 mt-3 border-t border-slate-100 flex items-end justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Rate</span>
                                  <span className="text-base font-bold font-mono text-slate-900">₹{quote.price}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 font-medium block">Transit</span>
                                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {quote.eta}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer / Finalization Bar */}
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      {selectedQuote ? (
                        <p className="text-xs text-slate-700 font-medium">
                          Selected: <strong className="text-slate-900 font-bold">{selectedQuote.name}</strong> · <strong className="text-emerald-700 font-mono font-bold">₹{selectedQuote.price}</strong> ({selectedQuote.eta})
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">Please select a courier partner above.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCarrierModal(false)}
                        className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        disabled={loading || !selectedQuote}
                        onClick={() => handleFinalizeWithCourier(selectedQuote)}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>Confirm &amp; Finalize ({selectedQuote ? `₹${selectedQuote.price}` : ''})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COD Upfront Payment Modal */}
            {showCodPaymentModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 relative">
                  <button
                    type="button"
                    onClick={() => setShowCodPaymentModal(false)}
                    className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Pay COD Upfront Booking Fee</h3>
                      <p className="text-[11px] text-slate-500">Required courier delivery + COD charge settlement</p>
                    </div>
                  </div>

                  {/* Charge Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Courier Delivery Charge:</span>
                      <span className="font-mono font-bold text-slate-800">₹{codQuote.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>COD Handling Fee:</span>
                      <span className="font-mono font-bold text-slate-800">₹{codQuote.codCharge}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Current Wallet Balance:</span>
                      <span className="font-mono">₹{codQuote.walletBalance} (Shortfall: ₹{codQuote.shortfall})</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900 text-sm">
                      <span>Total Upfront Payable:</span>
                      <span className="text-[#1E56E3] font-mono text-base">₹{codQuote.totalCharge}</span>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choose Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCodPaymentMethod('upi')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          codPaymentMethod === 'upi' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[11px]">UPI / QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodPaymentMethod('card')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          codPaymentMethod === 'card' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[11px]">Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodPaymentMethod('netbanking')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          codPaymentMethod === 'netbanking' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Landmark className="w-4 h-4" />
                        <span className="text-[11px]">NetBanking</span>
                      </button>
                    </div>
                  </div>

                  {codPaymentMethod === 'upi' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                      <p className="text-[10px] text-slate-500 font-medium">Instant UPI Verification (Google Pay / PhonePe / Paytm)</p>
                      <input
                        type="text"
                        value={codUpiId}
                        onChange={(e) => setCodUpiId(e.target.value)}
                        placeholder="supplier@upi"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center text-slate-800"
                      />
                    </div>
                  )}

                  {codPaymentMethod === 'card' && (
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Card Number •••• •••• •••• 4242"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="MM/YY" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center" />
                        <input type="password" placeholder="CVV" maxLength={3} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center" />
                      </div>
                    </div>
                  )}

                  {codPaymentMethod === 'netbanking' && (
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="sbi">State Bank of India (SBI)</option>
                      <option value="axis">Axis Bank</option>
                    </select>
                  )}

                  <button
                    type="button"
                    disabled={payingCodFee}
                    onClick={handleCodUpfrontPay}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {payingCodFee ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay ₹{codQuote.totalCharge} & Create Shipment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: SHIPMENT SUCCESS / CONFIRMATION SUCCESS RECEIPT SCREEN */}
      {step === 2 && createdData && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-8 animate-in fade-in zoom-in-95 duration-200 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Escrow Booking Confirmed & Secured
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">Shipment Success!</h1>
            <p className="text-xs text-slate-500 mt-1">Escrow funds have been locked safely under ParcelSafe protection.</p>
          </div>

          {/* Receipt Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-left max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Tracking ID</span>
              <span className="text-base font-extrabold text-[#1E56E3] font-mono">{createdData.shipmentId}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">AWB Tracking Code</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{createdData.awbCode || 'TC-delhivery-7539789936'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Recipient</span>
              <span className="text-xs font-bold text-slate-900">{createdData.receiverName} ({createdData.receiverPhone})</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Locked Escrow Amount</span>
              <span className="text-base font-black text-emerald-600">₹{createdData.amount ? createdData.amount.toLocaleString() : '3,420'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Carrier Partner</span>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800">
                  {createdData.autoSelectedCarrier?.name || createdData.carrierSlug || 'Auto-Selected'}
                </span>
                {createdData.autoSelectedCarrier?.shippingRate && (
                  <span className="block text-[10px] text-emerald-600 font-semibold">
                    ₹{createdData.autoSelectedCarrier.shippingRate} shipping · 🏆 Cheapest available
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Payment Mode</span>
              {(() => {
                const mode = createdData.paymentMode || 'prepaid';
                const modeMap = {
                  prepaid: { label: '💳 Prepaid (Online)', cls: 'bg-blue-100 text-blue-800' },
                  cod: { label: '🚚 COD', cls: 'bg-amber-100 text-amber-800' },
                  paid_offline: { label: '✅ Payment Paid', cls: 'bg-emerald-100 text-emerald-800' }
                };
                const m = modeMap[mode] || modeMap.prepaid;
                return <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
              })()}
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Return Option</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${createdData.returnAllowed !== false ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                <RotateCcw className="w-3 h-3" />
                {createdData.returnAllowed !== false ? 'Returns Allowed (24h Window)' : 'Returns Disabled'}
              </span>
            </div>

            {createdData.paymentMode === 'cod' && (
              <div className="pt-1 space-y-2.5 border-t border-dashed border-amber-200 bg-amber-50/60 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 uppercase text-[10px]">COD Booking Charges</span>
                  <span className="font-extrabold text-amber-950 font-mono">
                    ₹{createdData.codUpfrontFee || (Number(createdData.deliveryCharge || 0) + Number(createdData.codCharge || 0))}
                  </span>
                </div>
                <div className="text-[10px] text-amber-700/80 flex items-center justify-between">
                  <span>Courier: ₹{createdData.deliveryCharge || 40} · COD Fee: ₹{createdData.codCharge || 40}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                  <span className="font-bold text-amber-900 uppercase text-[10px]">Settlement</span>
                  {createdData.codFeePaymentMethod === 'wallet_adjustment' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <Wallet className="w-3 h-3 text-emerald-700" />
                      Adjusted from Wallet
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300">
                      <CreditCard className="w-3 h-3 text-blue-700" />
                      Paid Online Upfront
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AUTO-SCHEDULED COURIER PICKUP CARD */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white p-6 rounded-3xl border border-emerald-200/90 text-left max-w-md mx-auto space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>Courier Pickup Auto-Scheduled</span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      Confirmed
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Lowest delivery charge auto-assigned</p>
                </div>
              </div>
            </div>

            {/* Carrier Selection */}
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Assigned Carrier</span>
                <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {createdData.pickupCarrier || createdData.autoSelectedCarrier?.name || 'Delhivery Express'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Delivery Charge</span>
                <span className="font-black text-slate-900">
                  ₹{createdData.pickupRate || createdData.autoSelectedCarrier?.shippingRate || 40}
                  <span className="ml-1 text-[10px] text-emerald-600 font-bold">(Lowest Charge on Route)</span>
                </span>
              </div>
            </div>

            {/* Pickup Slot & Token */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pickup Slot</span>
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                  {createdData.pickupSlot || 'Tomorrow, 10:00 AM - 01:00 PM (Morning Slot)'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pickup Token</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-blue-700 select-all">
                    {createdData.pickupToken || 'PKP-DLV-749201'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdData.pickupToken || '');
                      setCopiedPickupToken(true);
                      setTimeout(() => setCopiedPickupToken(false), 2000);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition"
                    title="Copy Pickup Token"
                  >
                    {copiedPickupToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Assigned Executive */}
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Executive</span>
                <span className="text-xs font-extrabold text-slate-900 block">
                  {createdData.pickupAgentName || 'Rajesh Kumar'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {createdData.pickupAgentPhone || '+91 98112 40912'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Auto-Dispatched
                </span>
              </div>
            </div>

            {createdData.pickupLocationAddress && (
              <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="truncate">
                  <span className="font-bold text-slate-700">Pickup Address: </span>
                  <span>{createdData.pickupLocationAddress}</span>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Courier agent will arrive at your address with shipping barcode label during the slot.</span>
            </div>
          </div>

          {/* INSTANT SHARE TO WHATSAPP CARD */}
          {(() => {
            const formattedAmount = createdData?.amount 
              ? Number(createdData.amount).toLocaleString('en-IN') 
              : '14,500';
            const receiverFirstName = createdData?.receiverName 
              ? createdData.receiverName.split(' ')[0] 
              : 'Customer';
            const originUrl = window.location.origin;
            const payUrl = createdData?.paymentLink || `${originUrl}/pay/${createdData?.shipmentId || 'SPL-5396-U'}`;
            const courierUpper = createdData?.autoSelectedCarrier?.name
              || (createdData?.carrierSlug && createdData?.carrierSlug !== 'add_later' && createdData?.carrierSlug !== 'auto'
                ? createdData.carrierSlug.toUpperCase()
                : 'Auto-Selected Carrier');
            const awbText = createdData?.awbCode || 'Auto-Assigned';

            const mode = (createdData?.paymentMode || '').toLowerCase();
            const isCodOrder = mode === 'cod';
            const isPrepaidOrder = mode === 'prepaid' || mode === 'paid_offline' || createdData?.isPrepaid;

            let paymentInstruction = `🔒 Pay into Escrow:\n${payUrl}\n\n`;
            if (isCodOrder) {
              paymentInstruction = `💵 Payment Mode: Cash on Delivery (COD)\nPay ₹${formattedAmount} to the delivery courier agent upon arrival.\n\n`;
            } else if (mode === 'paid_offline') {
              paymentInstruction = `✅ Payment Status: PREPAID (Confirmed)\nNo payment required on delivery.\n\n`;
            }

            const whatsappMessage = 
              `Hello ${receiverFirstName}! 📦 Your order for ₹${formattedAmount} is booked & secured by SecureKaro.\n\n` +
              `🚚 Courier: ${courierUpper} | AWB: ${awbText}\n\n` +
              paymentInstruction +
              `📸 Note: Parcel & product photo verification is mandatory before dispatch for buyer protection.\n\n` +
              `Your order is fully protected by SecureKaro!`;

            const rawPhone = (createdData?.receiverPhone || '').replace(/\D/g, '');
            const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
            const whatsappUrl = cleanPhone
              ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`
              : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

            return (
              <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50/80 p-5 sm:p-6 rounded-3xl border border-emerald-200/90 text-left max-w-md mx-auto space-y-4 shadow-[0_4px_20px_-4px_rgba(37,211,102,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm shrink-0">
                      <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Share to WhatsApp</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Auto-generated with courier details & secure escrow link</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>

                {/* Action Buttons: 1-Click WhatsApp & Copy */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span>Share to WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappMessage);
                      setCopiedWhatsApp(true);
                      setTimeout(() => setCopiedWhatsApp(false), 2500);
                    }}
                    className="py-3 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWhatsApp ? 'Copied' : 'Copy Message'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Cashfree Receiver Payment Link Banner (Skipped for COD and Prepaid orders) */}
          {createdData.paymentLink && createdData.paymentMode !== 'cod' && createdData.paymentMode !== 'prepaid' && createdData.paymentMode !== 'paid_offline' && !createdData.isPrepaid && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-2xl border border-cyan-200/80 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
                <LinkIcon className="w-4 h-4 text-cyan-600" />
                <span>Cashfree Receiver Payment Link</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Share this link with {createdData.receiverName} to complete or verify their secure escrow payment via Cashfree:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdData.paymentLink}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdData.paymentLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={createdData.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 shrink-0 transition"
                  title="Open Cashfree Payment Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}



          {/* Actions */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href={createdData.shippingLabelUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Label PDF</span>
            </a>

            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Wallet Recharge Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        currentBalance={user?.walletBalance || 0}
        onSuccess={(newBalance) => {
          if (onUpdateUser) {
            onUpdateUser({ ...user, walletBalance: newBalance });
          }
          setShowRechargeModal(false);
        }}
      />
    </div>
  );
}
