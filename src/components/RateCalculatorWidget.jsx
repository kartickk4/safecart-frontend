import React, { useState, useEffect } from 'react';
import { 
  Calculator, Truck, MapPin, Package, ArrowRight, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, 
  IndianRupee, ShieldCheck, Zap, Info, Clock, Star
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
  if (raw.includes('shadowfax')) return 'Shadowfax 360 Express';
  if (raw.includes('delhivery')) return 'Delhivery Express';
  if (raw.includes('xpressbees')) return q.mode === 'Air' ? 'Xpressbees Air Express' : 'Xpressbees Surface';
  if (raw.includes('ekart')) return 'Ekart Logistics';
  if (raw.includes('bluedart') || raw.includes('blue dart')) return 'BlueDart Express';
  if (raw.includes('dtdc')) return 'DTDC Priority Express';
  if (raw.includes('rapido')) return 'Rapido Parcel Express';
  if (raw.includes('ecom')) return 'Ecom Express';
  if (raw.includes('post')) return 'India Post Speed Post';
  return q.carrierName || q.name || q.courierPartner || 'Express Courier';
};

export default function RateCalculatorWidget({ 
  onSelectCarrier, 
  onGetStarted,
  defaultPickup = '700049',
  defaultDelivery = '110001',
  variant = 'card' // 'card' | 'embedded' | 'standalone'
}) {
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

  const handleCalculateRates = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!fromPincode || fromPincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Pickup Pincode');
      return;
    }
    if (!toPincode || toPincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Delivery Pincode');
      return;
    }

    setLoading(true);
    setHasCalculated(true);

    try {
      const payload = {
        fromPincode: fromPincode.trim(),
        toPincode: toPincode.trim(),
        weightKg: chargeableWeight,
        paymentMode,
        cod: paymentMode === 'cod' ? 1 : 0,
        declaredValue: parseFloat(declaredValue) || 1500,
        amount: parseFloat(declaredValue) || 1500,
        dimensions: showDimensions ? { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) } : null
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

  const lowestRate = quotes.length > 0 
    ? getQuoteFinalRate(quotes[0]).toFixed(2)
    : '34.00';

  const lowestRateNum = parseFloat(lowestRate) || 34;
  const standardCounterRate = Math.round(lowestRateNum * 1.8);
  const potentialSavings = Math.max(25, standardCounterRate - Math.round(lowestRateNum));

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden ${
      variant === 'embedded' ? 'p-4 sm:p-6' : 'p-5 sm:p-7'
    }`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E56E3] text-[11px] font-extrabold uppercase tracking-wide">
            <Zap className="w-3.5 h-3.5 text-[#1E56E3]" />
            Live Courier Rate Calculator
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            Compare Courier Rates Instantly
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time rates from Delhivery, Shadowfax, Xpressbees & Ekart • Free Doorstep Pickup
          </p>
        </div>

        {/* Mode Selector Pill */}
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
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleCalculateRates} className="pt-5 space-y-4">
        {/* PINCODES ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1E56E3]" />
              Pickup Pincode (From)
            </label>
            <input
              type="text"
              maxLength={6}
              value={fromPincode}
              onChange={(e) => setFromPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 700049"
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1E56E3] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Delivery Pincode (To)
            </label>
            <input
              type="text"
              maxLength={6}
              value={toPincode}
              onChange={(e) => setToPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 110001"
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1E56E3] transition"
            />
          </div>
        </div>

        {/* POPULAR CITIES CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-500">
          <span className="shrink-0 font-semibold text-slate-400">Quick Deliver To:</span>
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

        {/* COD VALUE (IF COD) */}
        {paymentMode === 'cod' && (
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
              Check Available Courier Rates
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
              {quotes.length} Couriers Available
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
                <p className="text-xs font-extrabold">Save ~₹{potentialSavings} Per Parcel vs Courier Counter!</p>
                <p className="text-[11px] text-emerald-700 leading-tight">Retail counters charge ₹{standardCounterRate}+. SecureKaro rates start at only ₹{lowestRate}.</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-black text-emerald-600 bg-emerald-100/70 px-2 py-1 rounded-lg">
              ~45% OFF
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
              const isCodMode = paymentMode === 'cod';
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
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {q.mode || 'Surface'}
                        </span>
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
                    {isCodMode && codFee > 0 ? (
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
                    paymentMode
                  });
                }
                if (onGetStarted) {
                  onGetStarted({
                    fromPincode,
                    toPincode,
                    weightKg: chargeableWeight,
                    carrier: selectedQuote
                  });
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ship at ₹{lowestRate} with {selectedQuote ? getCleanCarrierName(selectedQuote) : 'Cheapest Carrier'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Free Doorstep Pickup • Instant AWB • ₹50 Welcome Discount Included</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

