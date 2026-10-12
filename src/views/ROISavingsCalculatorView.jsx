import React, { useState, useMemo } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Info, Package, Truck, BarChart3,
  IndianRupee, ChevronDown, ChevronUp, Sparkles, ArrowRight,
  FileText, RefreshCcw, HelpCircle,
  Zap, Clock, Lock, MessageSquare, Banknote
} from 'lucide-react';

function SimpleTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center cursor-pointer"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 bg-slate-900 text-white text-[11px] font-normal rounded-lg px-2.5 py-1.5 shadow-lg max-w-[210px] text-center leading-tight">
          {text}
        </span>
      )}
    </span>
  );
}

function CompactSlider({ label, value, onChange, min, max, step = 1, suffix = '', hint, color = 'blue' }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const trackColor = color === 'rose' ? '#f43f5e' : color === 'emerald' ? '#10b981' : '#2563eb';

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">{label}</span>
          {hint && (
            <SimpleTooltip text={hint}>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition" />
            </SimpleTooltip>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
            className="w-16 text-right text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
          />
          {suffix && <span className="text-[11px] font-semibold text-slate-500">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-slate-200"
        style={{
          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

const REAL_BENEFITS = [
  {
    id: 'rto-drop',
    title: 'Stop Doorstep Rejections',
    badge: 'RTO Drops to <4%',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Package,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    summary: 'When buyers pay into SecureKaro escrow before pickup, they actually accept the package. Doorstep rejections drop from ~30% in COD to under 4%.',
    impact: 'Saves ₹120–₹250 courier & box loss per saved order'
  },
  {
    id: 'fast-payouts',
    title: '30–60 Min 24/7 Bank Payout',
    badge: '30–60 Mins (24/7)',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Zap,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    summary: 'Normal COD courier platforms hold your money for 7 to 14 days. With SecureKaro, funds transfer directly to your bank via Cashfree IMPS / UPI within 30–60 minutes.',
    impact: 'Zero stuck capital: Buy new inventory right away'
  },
  {
    id: 'cheapest-courier',
    title: 'Auto-Cheapest Courier Rates',
    badge: 'Save ₹20–₹40 / parcel',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Truck,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    summary: 'Compares Delhivery, Blue Dart, Xpressbees, and Shadowfax automatically and books the cheapest courier rate for your parcel pickup.',
    impact: 'Automatically cuts monthly delivery bills by 15%–25%'
  },
  {
    id: 'zero-fraud',
    title: 'Zero Fake Payment Screenshots',
    badge: '100% Verified',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Lock,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
    summary: 'Scammers cannot send edited GPay or Paytm screenshots. Buyers pay through authentic Cashfree links with live bank verification.',
    impact: 'Stops 100% loss from edited screenshot fraud'
  },
  {
    id: 'return-shield',
    title: '24h Photo-Proof Return Window',
    badge: 'Strict 24h Window',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ShieldCheck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    summary: 'Buyers cannot use clothes or items for weeks and return them. Returns close strictly 24 hours after delivery and require clear defect photos.',
    impact: 'Cuts fake return claims and empty boxes by 85%'
  },
  {
    id: 'rto-relief',
    title: '₹40 RTO Financial Relief',
    badge: '₹40 Wallet Cushion',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Banknote,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    summary: 'If an escrow parcel is still returned undelivered, SecureKaro credits ₹40 relief to your wallet to reduce courier loss burden.',
    impact: 'You never bear the full pain of courier loss alone'
  },
  {
    id: 'buyer-trust',
    title: 'Higher Buyer Trust = More Sales',
    badge: '+40% to 60% Sales Lift',
    badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: TrendingUp,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    summary: 'New buyers are scared to send direct advance UPI to unknown Instagram shops. Escrow builds instant trust so they happily buy.',
    impact: 'Converts hesitant chat enquiries into confirmed orders'
  },
  {
    id: 'whatsapp-updates',
    title: 'Automated WhatsApp Updates',
    badge: 'Real-Time Alerts',
    badgeStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: MessageSquare,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    summary: 'Sends automated WhatsApp messages with live tracking links, delivery OTP verification, and parcel status alerts to both you and the buyer.',
    impact: 'Drastically cuts "Where is my parcel?" inquiries'
  }
];

const COMPARISON_ROWS = [
  {
    feature: 'Doorstep Rejection Rate (RTO)',
    without: '25% – 35% of COD parcels returned rejected',
    withKaro: 'Drops below 4% on escrow orders (buyer already paid)'
  },
  {
    feature: 'Payment Remittance Speed',
    without: '7 to 14 days courier remittance delay',
    withKaro: '30 to 60 mins via 24/7 IMPS (or instant UPI)'
  },
  {
    feature: 'Payment Verification',
    without: 'Risk of fake/edited Paytm & GPay screenshots',
    withKaro: '100% verified RBI-compliant Cashfree links'
  },
  {
    feature: 'Courier Rates',
    without: 'Fixed single courier price (₹80–₹140)',
    withKaro: 'Auto-cheapest comparison (saves ₹20–₹40/parcel)'
  },
  {
    feature: 'Return Window & Claims',
    without: 'Disputes days later, worn items returned',
    withKaro: 'Strict 24h photo-proof window & seller options'
  },
  {
    feature: 'Failed Delivery Burden',
    without: 'Seller bears 100% of return shipping loss',
    withKaro: 'SecureKaro credits ₹40 RTO relief to your wallet'
  },
  {
    feature: 'Buyer Trust on Instagram/WhatsApp',
    without: 'Buyers refuse direct UPI advance payment',
    withKaro: 'Buyers feel safe with escrow, happily prepay'
  }
];

export default function ROISavingsCalculatorView({ onNavigateCreateShipment }) {
  // Simple Inputs
  const [monthlyOrders, setMonthlyOrders] = useState(100);
  const [avgOrderValue, setAvgOrderValue] = useState(800);
  const [codPercentage, setCodPercentage] = useState(70);
  const [rtoRate, setRtoRate] = useState(28);
  const [escrowAdoptionRate, setEscrowAdoptionRate] = useState(60);
  const [avgShippingCost, setAvgShippingCost] = useState(110);
  const [returnFraudPerMonth, setReturnFraudPerMonth] = useState(3);
  const [fakePaymentsPerMonth, setFakePaymentsPerMonth] = useState(2000);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [benefitsTab, setBenefitsTab] = useState('grid'); // 'grid' | 'comparison'

  // Platform fee is FREE — 0% for all users
  const SERVICE_FEE_RATE = 0;
  const MIN_FEE = 0;
  const calcFee = (_val) => 0; // Always 0

  const results = useMemo(() => {
    const totalGMV = monthlyOrders * avgOrderValue;
    const codOrders = Math.round(monthlyOrders * (codPercentage / 100));
    const directPrepaidOrders = monthlyOrders - codOrders;

    const codConvertedToEscrow = Math.round(codOrders * (escrowAdoptionRate / 100));
    const remainingCodOrders = codOrders - codConvertedToEscrow;
    const totalEscrowOrders = directPrepaidOrders + codConvertedToEscrow;

    // Costs without SecureKaro
    const rtoLossPerOrder = avgOrderValue + (avgShippingCost * 2);
    const rtoCountWithout = Math.round(codOrders * (rtoRate / 100));
    const rtoLossWithout = rtoCountWithout * rtoLossPerOrder;
    const returnFraudLossWithout = returnFraudPerMonth * avgOrderValue;
    const fakePaymentLossWithout = fakePaymentsPerMonth;
    const shippingOverpayWithout = monthlyOrders * 30;
    const totalLossWithout = rtoLossWithout + returnFraudLossWithout + fakePaymentLossWithout + shippingOverpayWithout;

    // Costs with SecureKaro
    const rtoEscrowRate = 0.04;
    const rtoCountEscrow = Math.round(totalEscrowOrders * rtoEscrowRate);
    const rtoCountRemainingCod = Math.round(remainingCodOrders * (rtoRate / 100));
    const rtoLossWith = (rtoCountEscrow + rtoCountRemainingCod) * rtoLossPerOrder;

    const returnFraudLossWith = Math.round(returnFraudPerMonth * avgOrderValue * 0.15);
    const escrowShare = totalEscrowOrders / (monthlyOrders || 1);
    const fakePaymentLossWith = Math.round(fakePaymentsPerMonth * (1 - escrowShare));

    // Fee
    const singleFee = calcFee(avgOrderValue);
    const platformFee = totalEscrowOrders * singleFee;

    const totalSavings = (rtoLossWithout - rtoLossWith) +
      (returnFraudLossWithout - returnFraudLossWith) +
      (fakePaymentLossWithout - fakePaymentLossWith) +
      shippingOverpayWithout;

    const netBenefit = totalSavings; // No platform fee
    const roi = totalSavings > 0 ? '∞' : '0'; // ROI is infinite when fee = 0

    return {
      totalGMV,
      codOrders,
      directPrepaidOrders,
      totalEscrowOrders,
      remainingCodOrders,
      singleFee,
      rtoCountWithout,
      rtoLossWithout,
      rtoCountWith: rtoCountEscrow + rtoCountRemainingCod,
      rtoLossWith,
      returnFraudLossWithout,
      returnFraudLossWith,
      fakePaymentLossWithout,
      fakePaymentLossWith,
      shippingOverpayWithout,
      platformFee,
      totalSavings,
      netBenefit,
      roi,
    };
  }, [monthlyOrders, avgOrderValue, codPercentage, rtoRate, escrowAdoptionRate, avgShippingCost, returnFraudPerMonth, fakePaymentsPerMonth]);

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const isPositive = results.netBenefit > 0;

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 md:p-6 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Clean, Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">Profit & Savings Calculator</h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  FREE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                See how much money you save every month by stopping fake returns, rejected parcels, and payment scams.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateCreateShipment ? onNavigateCreateShipment() : window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'create-shipment' }))}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-center"
          >
            <span>Create Shipment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Simple Truth Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Normal COD has risk</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              If a buyer orders with normal COD, they can still reject the parcel at the door.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Escrow stops returns</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-snug">
              When buyers pay via SecureKaro link first, they almost never reject the package.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Real numbers only</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Move the sliders to match your business numbers to get an accurate estimate.
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Left Column: Sliders (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  Your Business Details
                </span>
                <span className="text-[10px] text-slate-400">Basic numbers</span>
              </div>

              <CompactSlider
                label="Parcels sent per month"
                value={monthlyOrders}
                onChange={setMonthlyOrders}
                min={10} max={1500} step={10}
                hint="How many total orders you send in one month"
              />

              <CompactSlider
                label="Average item price"
                value={avgOrderValue}
                onChange={setAvgOrderValue}
                min={200} max={5000} step={50}
                suffix=" ₹"
                hint="Average price of one item sold"
              />

              <CompactSlider
                label="Customers asking for COD"
                value={codPercentage}
                onChange={setCodPercentage}
                min={0} max={100} step={5}
                suffix="%"
                color="rose"
                hint="What % of your buyers want Cash on Delivery"
              />

              <CompactSlider
                label="Parcels rejected by buyers (RTO)"
                value={rtoRate}
                onChange={setRtoRate}
                min={5} max={50} step={1}
                suffix="%"
                color="rose"
                hint="What % of COD parcels come back rejected"
              />

              <CompactSlider
                label="Buyers who agree to pay with Escrow"
                value={escrowAdoptionRate}
                onChange={setEscrowAdoptionRate}
                min={10} max={100} step={5}
                suffix="%"
                color="emerald"
                hint="How many of your COD buyers agree to pay via SecureKaro link"
              />
            </div>

            {/* Advanced toggle for extra details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <span>Additional details (courier & fraud costs)</span>
                <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
                  {showAdvanced ? 'Hide' : 'Show'}
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                  <CompactSlider
                    label="Courier cost for returned parcel"
                    value={avgShippingCost}
                    onChange={setAvgShippingCost}
                    min={60} max={250} step={10}
                    suffix=" ₹"
                    hint="Going + coming back shipping cost charged by courier"
                  />

                  <CompactSlider
                    label="Fake / damaged returns in a month"
                    value={returnFraudPerMonth}
                    onChange={setReturnFraudPerMonth}
                    min={0} max={15} step={1}
                    suffix=" pkts"
                    color="rose"
                    hint="Orders where buyer returned empty box or wrong item"
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-slate-700">Fake UPI screenshots loss / month</span>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={fakePaymentsPerMonth}
                        onChange={e => setFakePaymentsPerMonth(Math.max(0, Number(e.target.value) || 0))}
                        className="w-16 text-right text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clean, Compact Result Card (5 cols) */}
          <div className="md:col-span-5 space-y-3">

            {/* Compact Green Result Card */}
            <div className={`p-4 sm:p-5 rounded-2xl text-white shadow-md ${
              isPositive
                ? 'bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#115e59]'
                : 'bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900'
            }`}>
              <div className="flex items-center justify-between opacity-90 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Estimated Monthly Net Gain</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] lowercase first-letter:uppercase font-semibold">
                  {results.roi}x return on fees
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight my-1.5">
                {isPositive ? '+' : ''}{fmt(results.netBenefit)}
              </div>

              <p className="text-[11px] text-white/85 leading-snug">
                SecureKaro escrow is completely FREE — 0% platform fee. You keep 100% of your order value minus only courier charges.
              </p>

              {/* 4 Stat Boxes - Compact & Clean */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/20 text-xs">
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-white/70 uppercase">Gross Cost Recovered</p>
                  <p className="text-base font-black mt-0.5">{fmt(results.totalSavings)}</p>
                </div>
                <div className="bg-emerald-400/20 rounded-xl p-2.5 border border-emerald-300/30">
                  <p className="text-[9px] font-bold text-emerald-200 uppercase">Platform Fee</p>
                  <p className="text-base font-black mt-0.5 text-emerald-200">FREE ✔</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-white/70 uppercase">Escrow Orders</p>
                  <p className="text-sm font-bold mt-0.5">{results.totalEscrowOrders} of {monthlyOrders}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-white/70 uppercase">Escrow Is Free</p>
                  <p className="text-sm font-bold mt-0.5">₹0 per order</p>
                </div>
              </div>
            </div>

            {/* Simple Breakdown Accordion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Where does this money come from?
                </span>
                {showBreakdown ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {showBreakdown && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2 text-xs animate-in fade-in">
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>Stopped rejected parcels:</span>
                    <span className="font-bold text-emerald-700">+{fmt(results.rtoLossWithout - results.rtoLossWith)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>Saved from fake return frauds:</span>
                    <span className="font-bold text-emerald-700">+{fmt(results.returnFraudLossWithout - results.returnFraudLossWith)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>Courier price comparison savings:</span>
                    <span className="font-bold text-emerald-700">+{fmt(results.shippingOverpayWithout)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>Saved from fake payment screenshots:</span>
                    <span className="font-bold text-emerald-700">+{fmt(results.fakePaymentLossWithout - results.fakePaymentLossWith)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-bold">
                    <span className="text-emerald-700">SecureKaro Platform Fee:</span>
                    <span className="text-emerald-700 font-black">FREE (Rs 0)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary Note */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-snug">
              💡 <strong>Simple Tip:</strong> Just share your SecureKaro payment link with customers on WhatsApp or Instagram before shipping. You get peace of mind and zero fake rejections.
            </div>

          </div>
        </div>

        {/* ── Real Benefits of Using SecureKaro Section ───────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Real Benefits of Using SecureKaro
                </h2>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  8 Real Gains
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                What sellers actually gain by switching from risky normal COD to verified Escrow shipping.
              </p>
            </div>

            {/* View Switcher: Grid vs Comparison */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold self-start sm:self-center">
              <button
                type="button"
                onClick={() => setBenefitsTab('grid')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  benefitsTab === 'grid'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8 Core Benefits
              </button>
              <button
                type="button"
                onClick={() => setBenefitsTab('comparison')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  benefitsTab === 'comparison'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                COD vs SecureKaro
              </button>
            </div>
          </div>

          {/* TAB 1: 8 Benefit Cards Grid */}
          {benefitsTab === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in">
              {REAL_BENEFITS.map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={benefit.id}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition group"
                  >
                    <div>
                      {/* Top icon and badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${benefit.iconBg} ${benefit.iconColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${benefit.badgeStyle}`}>
                          {benefit.badge}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition">
                        {benefit.title}
                      </h3>

                      {/* Easy words explanation */}
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                        {benefit.summary}
                      </p>
                    </div>

                    {/* Money / Practical impact pill */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] font-semibold text-emerald-800 bg-emerald-50/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span>{benefit.impact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Side-by-Side Comparison Table */}
          {benefitsTab === 'comparison' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 animate-in fade-in">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                    <th className="py-2.5 px-3 w-1/3">Selling Situation</th>
                    <th className="py-2.5 px-3 w-1/3 text-rose-700 bg-rose-50/60">
                      Selling on WhatsApp / Normal COD
                    </th>
                    <th className="py-2.5 px-3 w-1/3 text-emerald-700 bg-emerald-50/60">
                      With SecureKaro Escrow Protection
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {row.feature}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 bg-rose-50/20">
                        <div className="flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span>{row.without}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 bg-emerald-50/20 font-medium">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{row.withKaro}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Call to Action strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-emerald-50/70 p-3.5 rounded-xl border border-blue-200/60">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Ready to stop losing money on returned parcels?
              </p>
              <p className="text-[11px] text-slate-600">
                Create your first escrow shipment in 30 seconds. No subscription or setup fee.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCreateShipment ? onNavigateCreateShipment() : window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'create-shipment' }))}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-center"
            >
              <span>Create Protected Shipment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Small Bottom Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-normal">
          * Estimates are based on your inputs. SecureKaro Escrow is 100% free with ₹0 platform fee.
        </p>

      </div>
    </div>
  );
}
