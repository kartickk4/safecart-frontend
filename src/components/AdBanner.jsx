import React from 'react';
import { ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 relative overflow-hidden transition-all duration-300 hover:border-[#1E56E3]/30 hover:shadow-[0_4px_24px_-4px_rgba(30,86,227,0.12)]">

      {/* Top Accent Bar — Royal Blue ➜ Gold ➜ Emerald */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1E56E3] via-amber-400 to-emerald-400"></div>

      {/* Header: Badge & Status */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-300 shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Logistics Partner Offer</span>
          </span>
        </div>

        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time Escrow Monitored</span>
        </span>
      </div>

      {/* SPONSORED PARTNER OFFER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              SPONSORED · LOGISTICS DISCOUNT
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Get 35% Off Bulk Parcel Shipping with Delhivery Business</span>
          </h3>

          <p className="text-xs text-slate-500 font-medium">
            Save big on express nationwide courier shipments with automated SecureKaro API integration.
          </p>
        </div>

        <div className="shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <a
            href="https://www.delhivery.com/express"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E56E3] to-[#1649CC] hover:from-[#1649CC] hover:to-[#1240B8] text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all inline-flex items-center gap-1.5 active:scale-95"
          >
            <span>Claim Discount</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
