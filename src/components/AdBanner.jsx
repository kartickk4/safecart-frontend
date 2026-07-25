import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';

const SPONSORED_ADS = [
  {
    id: 'ad-1',
    tag: 'SPONSORED • LOGISTICS',
    title: 'Get 35% Off Bulk Parcel Shipping with Delhivery Business',
    description: 'Save big on express nationwide courier shipments with automated API integration.',
    cta: 'Claim Shipping Discount',
    link: 'https://www.delhivery.com/express',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    btnColor: 'bg-[#1E56E3] hover:bg-[#1649CC] text-white'
  },
  {
    id: 'ad-2',
    tag: 'SPONSORED • SELLER FINANCE',
    title: 'Pre-Approved Instant Working Capital Loans up to ₹10 Lakhs',
    description: 'Zero collateral required for Safecart verified merchants. Instant disbursement in 2 hours.',
    cta: 'Check Loan Eligibility',
    link: 'https://www.razorpay.com/capital',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  {
    id: 'ad-3',
    tag: 'SPONSORED • INSURANCE',
    title: 'Comprehensive Transit Cargo Insurance from ₹99/month',
    description: 'Protect all high-value electronics and luxury goods against damage or loss in transit.',
    cta: 'Get Free Quote',
    link: 'https://www.icicilombard.com',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    btnColor: 'bg-purple-600 hover:bg-purple-700 text-white'
  }
];

export default function AdBanner() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % SPONSORED_ADS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  const currentAd = SPONSORED_ADS[currentAdIndex];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentAd.badgeColor}`}>
              {currentAd.tag}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ad Network • Monitored</span>
          </div>

          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{currentAd.title}</span>
          </h3>

          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            {currentAd.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition inline-flex items-center gap-2 ${currentAd.btnColor}`}
          >
            <span>{currentAd.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setDismissed(true)}
            title="Hide Advertisement"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ad rotation indicator dots */}
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80">
        {SPONSORED_ADS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentAdIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentAdIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700 hover:bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
}
