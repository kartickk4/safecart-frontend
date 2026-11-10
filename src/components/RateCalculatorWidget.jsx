import React, { useState, useEffect } from 'react';
import { 
  Calculator, Truck, MapPin, Package, ArrowRight, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, 
  IndianRupee, ShieldCheck, Zap, Info, Clock, Star, RotateCcw, ArrowLeftRight
} from 'lucide-react';
import { agentAPI } from '../services/api';
import CarrierLogo from './CarrierLogo';

const POPULAR_DESTINATIONS = [
  { name: 'Delhi', pincode: '110001' },
  { name: 'Mumbai', pincode: '400001' },
  { name: 'Bengaluru', pincode: '560001' },
  { name: 'Kolkata', pincode: '700111' },
  { name: 'Patna', pincode: '800001' },
  { name: 'Guwahati', pincode: '781001' }
];

const WEIGHT_PRESETS = [0.5, 1.0, 2.0, 3.0, 5.0];

const getQuoteFinalRate = (q) => {
  if (!q) return 0;
  const rate = Number(q.exactRate ?? q.price ?? q.totalRate ?? q.totalCodRate ?? q.freightCharge ?? 0);
  return isNaN(rate) ? 0 : rate;
};

const getCleanCarrierName = (q) => {
  const raw = (q.carrierName || q.name || q.courierPartner || q.slug || '').toLowerCase();
  const isRev = q.isReverse || raw.includes('reverse');
  if (raw.includes('shadowfax')) return isRev ? 'Shadowfax Reverse 360 (QC)' : 'Shadowfax 360 Express';
  if (raw.includes('delhivery')) return isRev ? 'Delhivery Reverse QC Express' : 'Delhivery Express';
  if (raw.includes('xpressbees')) return isRev ? 'Xpressbees Reverse Logistics' : (q.mode === 'Air' ? 'Xpressbees Air Express' : 'Xpressbees Surface');
  if (raw.includes('ekart')) return isRev ? 'Ekart Doorstep QC Return' : 'Ekart Logistics';
  if (raw.includes('bluedart') || raw.includes('blue dart')) return isRev ? 'BlueDart Apex Reverse' : 'BlueDart Express';
  if (raw.includes('dtdc')) return 'DTDC Priority Express';
  if (raw.includes('rapido')) return 'Rapido Parcel Express';
  if (raw.includes('ecom')) return isRev ? 'Ecom Express Reverse Pickup' : 'Ecom Express';
  if (raw.includes('post')) return 'India Post Speed Post';
  return q.carrierName || q.name || q.courierPartner || (isRev ? 'Reverse Courier' : 'Express Courier');
};

export default function RateCalculatorWidget({ 
  onSelectCarrier, 
  onGetStarted,
  defaultPickup = '700049',
  defaultDelivery = '110001',
  variant = 'card' // 'card' | 'embedded' | 'standalone'
}) {
  const [freightType, setFreightType] = useState('forward'); // 'forward' | 'reverse'
  const [fromPincode, setFromPincode] = useState(defaultPickup);
  const [toPincode, setToPincode] = useState(defaultDelivery);
  const [weightKg, setWeightKg] = useState(0.5);
  const [customWeight, setCustomWeight] = useState('');
  const [isCustomWeight, setIsCustomWeight] = useState(false);
  const [paymentMode, setPaymentMode] = useState('prepaid'); // 'prepaid' | 'cod'
  const [declaredValue, setDeclaredValue] = useState(1500);

  // Dimensions (Optional Volumetric)
  const [showDimensions, setShowDimensions] = useState(false);
  const [length, setLength] = useState(15);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(5);

  // Results & Loading
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Volumetric weight calculation: (L * W * H) / 5000
  const volumetricWeight = showDimensions 
    ? parseFloat(((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0) / 5000).toFixed(2))
    : 0;
  const chargeableWeight = Math.max(parseFloat(weightKg) || 0.5, volumetricWeight);

  const handleCalculateRates = async (e, forcedFreightType = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!fromPincode || fromPincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Pincode');
      return;
    }
    if (!toPincode || toPincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Pincode');
      return;
    }

    const currentFreight = forcedFreightType || freightType;
    const isReverseFreight = currentFreight === 'reverse';

    setLoading(true);
    setHasCalculated(true);

    try {
      const payload = {
        fromPincode: fromPincode.trim(),
        toPincode: toPincode.trim(),
        weightKg: chargeableWeight,
        paymentMode: isReverseFreight ? 'prepaid' : paymentMode,
        cod: isReverseFreight ? 0 : (paymentMode === 'cod' ? 1 : 0),
        declaredValue: parseFloat(declaredValue) || 1500,
        amount: parseFloat(declaredValue) || 1500,
        dimensions: showDimensions ? { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) } : null,
        isReverse: isReverseFreight,
        shipmentType: currentFreight
      };

      const res = await agentAPI.getCarrierRates(payload);
      const carrierQuotes = res.data?.quotes || [];
      
      // Sort quotes ascending by true total charge (exactRate / price)
      const sorted = [...carrierQuotes].sort((a, b) => {
        return getQuoteFinalRate(a) - getQuoteFinalRate(b);
      });

      setQuotes(sorted);
      if (sorted.length > 0) {
        setSelectedQuote(sorted[0]);
      }
    } catch (err) {
      console.warn('Rate calculation error:', err);
      setError(err.response?.data?.error || 'Unable to calculate rates for this route. Please verify pincodes.');
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on mount if both pincodes present
  useEffect(() => {
    if (fromPincode && toPincode && fromPincode.length === 6 && toPincode.length === 6) {
      handleCalculateRates();
    }
  }, []);

  const isReverseMode = freightType === 'reverse';

  const lowestRate = quotes.length > 0 
    ? getQuoteFinalRate(quotes[0]).toFixed(2)
    : (isReverseMode ? '50.72' : '34.00');

  const lowestRateNum = parseFloat(lowestRate) || 34;
  const standardCounterRate = Math.round(lowestRateNum * 1.8);
  const potentialSavings = Math.max(25, standardCounterRate - Math.round(lowestRateNum));

  const handleSwapPincodes = () => {
    const temp = fromPincode;
    setFromPincode(toPincode);
    setToPincode(temp);
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden ${
      variant === 'embedded' ? 'p-4 sm:p-6' : 'p-5 sm:p-7'
    }`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E56E3] text-[11px] font-extrabold uppercase tracking-wide">
            <Zap className="w-3.5 h-3.5 text-[#1E56E3]" />
            Live Courier Rate Calculator
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {isReverseMode ? 'Reverse Freight & QC Rate Calculator' : 'Compare Forward Courier Rates'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isReverseMode 
              ? 'Real-time doorstep pickup & quality inspection rates from Delhivery, Shadowfax & Xpressbees'
              : 'Real-time rates from Delhivery, Shadowfax, Xpressbees & Ekart • Free Doorstep Pickup'}
          </p>
        </div>

        {/* Forward Mode COD / Prepaid Toggle (Hidden for Reverse) */}
        {!isReverseMode ? (
          <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setPaymentMode('prepaid'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                paymentMode === 'prepaid'
                  ? 'bg-white text-[#1E56E3] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prepaid
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode('cod'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                paymentMode === 'cod'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              COD
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Doorstep QC Included</span>
          </div>
        )}
      </div>

      {/* FREIGHT TYPE TOGGLE (FORWARD vs REVERSE FREIGHT) */}
      <div className="pt-4 pb-1">
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/70 gap-1">
          <button
            type="button"
            onClick={() => {
              setFreightType('forward');
              handleCalculateRates(null, 'forward');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isReverseMode
                ? 'bg-white text-[#1E56E3] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>📦 Forward Freight (Seller → Buyer)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFreightType('reverse');
              handleCalculateRates(null, 'reverse');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isReverseMode
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span>↩️ Reverse Freight (Customer Return)</span>
          </button>
        </div>
      </div>

      {/* REVERSE FREIGHT INFORMATIONAL BANNER */}
      {isReverseMode && (
        <div className="mt-3 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/70 flex items-start gap-2.5 text-indigo-950">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-indigo-800 leading-snug">
            <strong>Doorstep Quality Check (QC):</strong> Courier rider visits customer doorstep, checks intact tags & physical item condition, and packs in a tamper-evident return bag before bringing it back to your hub.
          </div>
        </div>
      )}

      {/* INPUT FORM */}
      <form onSubmit={handleCalculateRates} className="pt-4 space-y-4">
        {/* PINCODES ROW WITH SWAP BUTTON */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1E56E3]" />
              {isReverseMode ? 'Customer Pickup Pincode (Return Origin)' : 'Pickup Pincode (Seller Hub)'}
            </label>
            <input
              type="text"
              maxLength={6}
              value={fromPincode}
              onChange={(e) => setFromPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={isReverseMode ? "Customer PIN e.g. 110001" : "Seller PIN e.g. 700049"}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1E56E3] transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {isReverseMode ? 'Warehouse Return Pincode (Seller Hub)' : 'Delivery Pincode (Buyer Destination)'}
              </label>
              <button
                type="button"
                onClick={handleSwapPincodes}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition"
                title="Swap origin and destination"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Swap</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              value={toPincode}
              onChange={(e) => setToPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={isReverseMode ? "Hub PIN e.g. 700049" : "Buyer PIN e.g. 110001"}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1E56E3] transition"
            />
          </div>
        </div>

        {/* POPULAR CITIES CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-500">
          <span className="shrink-0 font-semibold text-slate-400">
            {isReverseMode ? 'Quick Return Destination:' : 'Quick Deliver To:'}
          </span>
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.pincode}
              type="button"
              onClick={() => {
                setToPincode(dest.pincode);
              }}
              className={`shrink-0 px-2 py-0.5 rounded-md font-semibold transition border cursor-pointer ${
                toPincode === dest.pincode
                  ? 'bg-blue-100 text-[#1E56E3] border-blue-300 font-bold'
                  : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/70'
              }`}
            >
              {dest.name} ({dest.pincode})
            </button>
          ))}
        </div>

        {/* WEIGHT PRESETS */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              Dead Weight
            </span>
            <span className="text-[11px] text-[#1E56E3] font-extrabold">
              Chargeable: {chargeableWeight} kg
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {WEIGHT_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setWeightKg(w);
                  setIsCustomWeight(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  !isCustomWeight && weightKg === w
                    ? 'bg-[#1E56E3] text-white border-[#1E56E3] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {w} kg
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomWeight(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isCustomWeight
                  ? 'bg-[#1E56E3] text-white border-[#1E56E3] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Custom
            </button>

            {isCustomWeight && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={customWeight || weightKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.1;
                    setCustomWeight(e.target.value);
                    setWeightKg(val);
                  }}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E56E3]"
                  placeholder="kg"
                />
                <span className="text-xs text-slate-500 font-semibold">kg</span>
              </div>
            )}
          </div>
        </div>

        {/* DIMENSIONS TOGGLE */}
        <div>
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className="text-xs text-[#1E56E3] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showDimensions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDimensions ? 'Hide Parcel Dimensions' : '+ Add Dimensions (L × W × H in cm)'}
          </button>

          {showDimensions && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div className="col-span-3 text-[11px] text-slate-500 pt-1">
                Volumetric Weight: <strong className="text-slate-700">{volumetricWeight} kg</strong> ({length} × {width} × {height} / 5000)
              </div>
            </div>
          )}
        </div>

        {/* COD VALUE (IF COD AND FORWARD MODE) */}
        {!isReverseMode && paymentMode === 'cod' && (
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-900 block">COD Order Value</span>
              <span className="text-[11px] text-amber-700 block">Amount courier collects at doorstep</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900">₹</span>
              <input
                type="number"
                min="100"
                max="50000"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                className="w-20 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1E56E3] hover:bg-[#1649CC] active:scale-[0.99] text-white text-sm font-extrabold rounded-2xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Calculating Live Rates...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              {isReverseMode ? 'Check Reverse Pickup Rates' : 'Check Available Courier Rates'}
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* RESULTS DISPLAY */}
      {quotes.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3.5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#1E56E3]" />
              {quotes.length} {isReverseMode ? 'Reverse Couriers Available' : 'Couriers Available'}
            </span>
            <span className="text-slate-500 font-semibold text-[11px]">
              Sorted by lowest rate
            </span>
          </div>

          {/* SAVINGS CALLOUT BANNER */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold">
                  {isReverseMode
                    ? `Reverse Pickup & Doorstep QC Starting at ₹${lowestRate}!`
                    : `Save ~₹${potentialSavings} Per Parcel vs Courier Counter!`}
                </p>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  {isReverseMode
                    ? 'Verified return pickup with rider visual item check & tamper-proof pouch'
                    : `Retail counters charge ₹${standardCounterRate}+. SecureKaro rates start at only ₹${lowestRate}.`}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-black text-emerald-600 bg-emerald-100/70 px-2 py-1 rounded-lg">
              {isReverseMode ? 'QC Verified' : '~45% OFF'}
            </span>
          </div>

          {/* QUOTES LIST */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {quotes.map((q, idx) => {
              const isCheapest = idx === 0;
              const totalRate = getQuoteFinalRate(q);
              const formattedRate = totalRate.toFixed(2);
              const displayName = getCleanCarrierName(q);
              const isSelected = selectedQuote?.slug === q.slug;
              const isCodMode = !isReverseMode && paymentMode === 'cod';
              const codFee = Number(q.codCharge || 0);
              const freightPart = isCodMode ? Math.max(0, totalRate - codFee) : totalRate;

              return (
                <div
                  key={q.slug || idx}
                  onClick={() => setSelectedQuote(q)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#1E56E3] shadow-sm'
                      : isCheapest
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CarrierLogo slug={q.slug} name={q.carrierName || q.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {displayName}
                        </span>
                        {isCheapest && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                            Best Value
                          </span>
                        )}
                        {isReverseMode ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            Doorstep QC
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            {q.mode || 'Surface'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {q.estimatedDays || q.eta || '2-3 Days'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {q.rating || 4.8}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      ₹{formattedRate}
                    </div>
                    {isReverseMode ? (
                      <span className="text-[10px] text-indigo-600 block -mt-0.5 font-bold">
                        Doorstep QC &amp; Return
                      </span>
                    ) : isCodMode && codFee > 0 ? (
                      <span className="text-[10px] text-amber-700 block -mt-0.5 font-bold">
                        Freight ₹{freightPart.toFixed(0)} + COD ₹{codFee.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 block -mt-0.5 font-bold">
                        All-inclusive (₹5 off)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA ACTION */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onSelectCarrier && selectedQuote) {
                  onSelectCarrier({
                    ...selectedQuote,
                    fromPincode,
                    toPincode,
                    weightKg: chargeableWeight,
                    paymentMode: isReverseMode ? 'prepaid' : paymentMode,
                    freightType,
                    isReverse: isReverseMode
                  });
                }
                if (onGetStarted) {
                  onGetStarted({
                    fromPincode,
                    toPincode,
                    weightKg: chargeableWeight,
                    carrier: selectedQuote,
                    freightType,
                    isReverse: isReverseMode
                  });
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isReverseMode
                  ? `Book Return at ₹${lowestRate} with ${selectedQuote ? getCleanCarrierName(selectedQuote) : 'Cheapest Carrier'}`
                  : `Ship at ₹${lowestRate} with ${selectedQuote ? getCleanCarrierName(selectedQuote) : 'Cheapest Carrier'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isReverseMode
                  ? 'Buyer Doorstep Inspection • Tamper-proof Bag • Direct Warehouse Delivery'
                  : 'Free Doorstep Pickup • Instant AWB • ₹50 Welcome Discount Included'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

