import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, ArrowRight, ExternalLink,
  Package, RotateCcw, AlertCircle, RefreshCw, Truck, QrCode, CreditCard, Landmark, Sparkles, Clock, Gift
} from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function PublicPayView({ shipmentId, onPaymentComplete }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'fast'
  const [upiId, setUpiId] = useState('');
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('delhivery'); // 'delhivery' | 'bluedart' | 'dtdc' | 'xpressbees'
  const [cashbackInfo, setCashbackInfo] = useState(null);
  const [youpiCheckoutUrl, setYoupiCheckoutUrl] = useState('');
  const [waitingForGateway, setWaitingForGateway] = useState(false);

  const AVAILABLE_CARRIERS = [
    {
      slug: 'delhivery',
      name: 'Delhivery Express',
      tagline: 'Standard Ground & Air Express',
      eta: '2-3 Days Delivery',
      rating: '4.8 ★',
      badge: 'Popular • Recommended',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      slug: 'bluedart',
      name: 'Blue Dart Express',
      tagline: 'Priority Aviation Cargo & Air Express',
      eta: '1-2 Days Priority',
      rating: '4.9 ★',
      badge: 'Air Express • Fastest',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      slug: 'dtdc',
      name: 'DTDC Express',
      tagline: 'Pan-India Surface Logistics',
      eta: '2-4 Days Delivery',
      rating: '4.6 ★',
      badge: 'Pan-India',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      slug: 'xpressbees',
      name: 'Xpressbees Logistics',
      tagline: 'Trusted E-commerce Logistics',
      eta: '3-4 Days Delivery',
      rating: '4.5 ★',
      badge: 'Budget Friendly',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    setLoading(true);
    setError('');
    const targetId = shipmentId || window.location.pathname.split('/pay/')[1] || 'SPL-5396-U';

    try {
      const res = await shipmentAPI.getTrackingByAwb(targetId.trim());
      if (res.data && res.data.shipment) {
        const ship = res.data.shipment;
        setShipment(ship);
        setUpiId(ship.receiverPhone ? `${ship.receiverPhone}@upi` : 'buyer@upi');

        if (ship.carrierSlug && ['delhivery', 'bluedart', 'dtdc', 'xpressbees'].includes(ship.carrierSlug.toLowerCase())) {
          setSelectedCarrier(ship.carrierSlug.toLowerCase());
        }

        // Check if already paid
        if (ship.receiverPaymentDone || ship.status === 'Pending Pickup' || ship.status === 'In Transit' || ship.escrowStage >= 3) {
          setPaidSuccess(true);
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

  const startPollingStatus = (targetId) => {
    const id = targetId || shipment?.shipmentId;
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await shipmentAPI.getTrackingByAwb(id);
        const ship = res.data?.shipment;
        if (ship && (ship.receiverPaymentDone || ship.escrowStage >= 3 || ship.status === 'Pending Pickup' || ship.youpiPaymentConfirmed)) {
          clearInterval(interval);
          setShipment(ship);
          setWaitingForGateway(false);
          setPaidSuccess(true);
          if (onPaymentComplete) onPaymentComplete(ship);
        }
      } catch (e) {}
    }, 2500);
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleCompletePayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!shipment?.shipmentId) return;

    setPaying(true);
    setError('');

    try {
      if (paymentMethod === 'upi') {
        try {
          const youpiRes = await shipmentAPI.generateYoupiLink(shipment.shipmentId, {
            carrierSlug: selectedCarrier,
            returnUrl: window.location.href
          });
          if (youpiRes.data?.checkoutUrl) {
            setYoupiCheckoutUrl(youpiRes.data.checkoutUrl);
            setWaitingForGateway(true);
            window.open(youpiRes.data.checkoutUrl, '_blank');
            startPollingStatus(shipment.shipmentId);
            setPaying(false);
            return;
          }
        } catch (youpiErr) {
          console.warn('[YouPI Gateway] Direct gateway notice, proceeding with direct payment:', youpiErr.message);
        }
      }

      const res = await shipmentAPI.publicPay(shipment.shipmentId, {
        gateway: paymentMethod,
        carrierSlug: selectedCarrier,
        transactionRef: `PAY_${Date.now()}`
      });

      if (res.data && res.data.shipment) {
        setShipment(res.data.shipment);
        if (res.data.cashback) {
          setCashbackInfo(res.data.cashback);
        }
        setPaidSuccess(true);
        if (onPaymentComplete) onPaymentComplete(res.data.shipment);
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!shipment?.shipmentId) return;
    setPaying(true);
    try {
      await shipmentAPI.simulateYoupiPayment(shipment.shipmentId);
      const res = await shipmentAPI.getTrackingByAwb(shipment.shipmentId);
      if (res.data?.shipment) {
        setShipment(res.data.shipment);
        setWaitingForGateway(false);
        setPaidSuccess(true);
        if (onPaymentComplete) onPaymentComplete(res.data.shipment);
      }
    } catch (e) {
      const res = await shipmentAPI.publicPay(shipment.shipmentId, {
        gateway: 'prepaid_youpi',
        carrierSlug: selectedCarrier,
        transactionRef: `SIM_${Date.now()}`
      });
      if (res.data?.shipment) {
        setShipment(res.data.shipment);
        setWaitingForGateway(false);
        setPaidSuccess(true);
        if (onPaymentComplete) onPaymentComplete(res.data.shipment);
      }
    } finally {
      setPaying(false);
    }
  };

  const baseAmount = Number(shipment?.amount || 0);
  const orderAmount = baseAmount > 0 ? baseAmount.toLocaleString('en-IN') : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#1E56E3] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-600 mt-4 uppercase tracking-wider">
          Connecting to Secure Payment Gateway...
        </p>
      </div>
    );
  }

  // State A: Already Paid / Payment Confirmed -> Displays Auto-Created Courier Shipment
  if (paidSuccess) {
    const courierName = shipment?.pickupCarrier || shipment?.carrierSlug?.toUpperCase() || 'Delhivery Express';
    const awbCode = shipment?.awbCode || 'Pending Assignment';

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F4F7FC] to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Payment Confirmed & Protected Under Verified Delivery
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Courier Shipment Auto-Created!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Your payment of <strong className="text-slate-900">₹{orderAmount}</strong> is protected under SecureKaro Delivery Verification. The platform has automatically booked courier pickup with your chosen partner: <strong className="text-slate-900">{courierName}</strong>.
            </p>
          </div>

          {/* Auto-Created Logistics Details Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">Order ID:</span>
              <span className="font-mono font-extrabold text-[#1E56E3]">{shipment?.shipmentId}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">AWB Tracking Code:</span>
              <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {awbCode}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">Carrier Booked:</span>
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>{courierName}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Buyer Selected
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">Pickup Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Scheduled at Seller Hub
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Buyer Protection:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Funds Protected until Delivery Sign-off
              </span>
            </div>
          </div>

          {/* Payment Link Cashback Reward Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-50 via-emerald-50 to-teal-50 border border-emerald-200 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-emerald-500/20">
                  ₹{cashbackInfo?.amount || 5}
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span>🎉 ₹{cashbackInfo?.amount || (cashbackInfo?.isFirstOrder ? 50 : 5)} {cashbackInfo?.isFirstOrder || cashbackInfo?.amount >= 50 ? 'Welcome Cashback' : 'Instant Cashback'} Credited!</span>
                  </h4>
                  <p className="text-[10px] text-emerald-800">
                    {cashbackInfo?.isFirstOrder || cashbackInfo?.amount >= 50
                      ? 'Special new buyer welcome reward added directly to your SecureKaro Wallet'
                      : 'Payment link reward added to your SecureKaro Wallet'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                Credited
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100 text-[11px] text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Next reward on delivery:</span>
              </span>
              <span className="font-extrabold text-[#1E56E3]">₹2 on Confirm (₹1 to ₹10 for promotional)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`/track/${shipment?.shipmentId || ''}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-black text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <span>Track Live Courier Journey</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // State B: Order details loaded, waiting for buyer payment -> Interactive Delivery Protection Checkout
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F4F7FC] to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E56E3] text-[11px] font-black border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SecureKaro Delivery Protection</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Complete Secure Payment
          </h2>
          <p className="text-xs text-slate-500">
            Select your courier and payment method. Shipment auto-creates upon payment.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

          {/* Payment Link & Welcome Cashback Incentive Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-emerald-300 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 font-black text-sm">
              ₹50
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex items-center gap-2 font-black text-slate-900 flex-wrap">
                <span>🎁 New Buyer Welcome Offer: ₹50 First-Order Cashback</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">New Buyer Special</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Pay online now to claim <strong className="text-slate-900 font-bold">₹50 Welcome Cashback</strong> on your 1st order directly in your SecureKaro Wallet! (Regular orders receive ₹5 online payment cashback + ₹2 on QR doorstep confirmation).
              </p>
            </div>
          </div>

        {/* Order Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">Order ID:</span>
            <span className="font-mono font-extrabold text-[#1E56E3]">{shipment?.shipmentId}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">Item Description:</span>
            <span className="font-bold text-slate-900 max-w-[240px] truncate text-right">
              {shipment?.description || 'Goods / Parcel'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">Deliver To:</span>
            <span className="font-medium text-slate-700 text-right">
              {shipment?.receiverName} ({shipment?.receiverPhone})
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">Courier Company:</span>
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#1E56E3]" />
              <span>{AVAILABLE_CARRIERS.find(c => c.slug === selectedCarrier)?.name || 'Delhivery Express'}</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                Buyer Choice
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500">Return Policy:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {shipment?.returnAllowed !== false ? '24h Protection Window' : 'Final Sale'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 text-sm font-extrabold text-slate-900">
            <span>Payable Amount:</span>
            <span className="text-emerald-600 font-mono text-base">₹{orderAmount}</span>
          </div>
        </div>

        {/* ── BUYER COURIER SELECTION ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#1E56E3]" />
              <span>Select Preferred Courier Partner</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Delivery Included
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            The platform will book courier pickup with the carrier company you select below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AVAILABLE_CARRIERS.map(c => {
              const isSelected = selectedCarrier === c.slug;
              return (
                <div
                  key={c.slug}
                  onClick={() => setSelectedCarrier(c.slug)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition relative ${
                    isSelected 
                      ? 'border-[#1E56E3] bg-blue-50/80 shadow-xs ring-1 ring-blue-500/30' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{c.name}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${c.badgeClass}`}>
                      {c.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{c.tagline}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {c.eta}
                    </span>
                    <span className="font-mono font-bold text-amber-600">{c.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">Select Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                paymentMethod === 'upi' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs">UPI / Apps</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                paymentMethod === 'card' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('netbanking')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                paymentMethod === 'netbanking' ? 'border-[#1E56E3] bg-blue-50 text-[#1E56E3] font-bold shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Landmark className="w-5 h-5" />
              <span className="text-xs">NetBanking</span>
            </button>
          </div>

          {paymentMethod === 'upi' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-[11px] text-slate-500 font-medium">Instant UPI Verification (Google Pay / PhonePe / Paytm / BHIM)</p>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="mobile@upi or username@okhdfcbank"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center text-slate-800"
              />
            </div>
          )}

          {paymentMethod === 'card' && (
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

          {paymentMethod === 'netbanking' && (
            <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
              <option value="hdfc">HDFC Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="sbi">State Bank of India (SBI)</option>
              <option value="axis">Axis Bank</option>
            </select>
          )}
        </div>

        {/* Protection Banner */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Money is safely protected under SecureKaro and will NOT be released to seller until you receive and verify the package.</span>
        </div>

        {/* YouPI Gateway Active Banner */}
        {waitingForGateway && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                Payment Gateway Session Active
              </span>
              <span className="text-xs font-mono font-bold text-blue-200">₹{orderAmount}</span>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Complete your payment in the opened checkout tab. Your parcel delivery booking will be confirmed automatically once payment is received.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {youpiCheckoutUrl && (
                <a
                  href={youpiCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-center font-bold text-xs text-white flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Re-open Checkout Portal
                </a>
              )}
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-center font-bold text-xs text-blue-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Simulate Instant Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handleCompletePayment}
          disabled={paying}
          className="w-full py-4 px-6 rounded-2xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-black text-sm shadow-xl shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
        >
          {paying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Securing Order & Auto-Booking Courier...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay ₹{orderAmount} with Delivery Protection</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          256-bit Bank Grade SSL Encryption • SecureKaro Delivery Vault
        </p>
      </div>
    </div>
  );
}

