import React, { useState } from 'react';
import { 
  ShieldCheck, Phone, Mail, MapPin, Clock, FileText, 
  RotateCcw, DollarSign, Package, CheckCircle2, AlertCircle, Building2, ExternalLink 
} from 'lucide-react';

export default function LegalComplianceView({ initialTab = 'contact' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'contact' | 'terms' | 'refunds' | 'services' | 'privacy'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Cashfree Payment Gateway Verified Merchant</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Merchant Information & Policy Center
          </h1>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Official business policies, merchant contact details, terms of service, refund rules, and services pricing list in compliance with Cashfree Payment Gateway & RBI guidelines.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        {[
          { id: 'contact', label: 'Contact Us', icon: Phone },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'refunds', label: 'Refunds & Cancellations', icon: RotateCcw },
          { id: 'services', label: 'Products & Services (INR Pricing)', icon: Package },
          { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                isActive 
                  ? 'bg-[#1E56E3] text-white shadow-md shadow-blue-500/20 font-extrabold' 
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONTACT US */}
      {activeTab === 'contact' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Merchant Contact Information</h2>
                <p className="text-xs text-slate-500 font-medium">SafeCart Technologies Private Limited Customer Support & Nodal Desk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Customer Helpline */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2.5 text-[#1E56E3] font-bold text-sm">
                  <Phone className="w-5 h-5" />
                  <span>Customer Support Helpline</span>
                </div>
                <p className="text-2xl font-black text-slate-900">+91 1800-723-3227</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Operating Hours: Mon – Sat (9:00 AM to 7:00 PM IST)</span>
                </p>
              </div>

              {/* Card 2: Official Email Support */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2.5 text-[#1E56E3] font-bold text-sm">
                  <Mail className="w-5 h-5" />
                  <span>Email Support Desk</span>
                </div>
                <p className="text-lg font-extrabold text-slate-900 font-mono">support@safecart.app</p>
                <p className="text-xs text-slate-500 font-medium">
                  Compliance & Legal Enquiries: <span className="font-mono text-slate-700">compliance@safecart.app</span>
                </p>
              </div>
            </div>

            {/* Registered Address */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <MapPin className="w-5 h-5 text-[#1E56E3]" />
                <span>Registered Corporate & Merchant Address</span>
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                SafeCart Technologies Private Limited<br />
                4th Floor, Tech Hub Tower, Cyber City, Sector 24,<br />
                Gurugram, Haryana 122002, India.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERMS & CONDITIONS */}
      {activeTab === 'terms' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Terms & Conditions of Service</h2>
            <p className="text-xs text-slate-500 font-medium">Last updated: July 2026 | Compliant with RBI Escrow Directions & Cashfree PG Framework</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
            <h3 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h3>
            <p>
              By accessing and creating escrow shipment bookings on SafeCart ("Platform"), operated by SafeCart Technologies Private Limited, users agree to be bound by these Terms & Conditions.
            </p>

            <h3 className="text-sm font-bold text-slate-900">2. Escrow Protection Mechanism</h3>
            <p>
              All transaction funds deposited via Cashfree Payment Gateway are securely held in nodally-compliant escrow accounts. Funds remain locked until the receiver confirms parcel delivery or the automated 24-hour verification timer completes without active dispute claims.
            </p>

            <h3 className="text-sm font-bold text-slate-900">3. User Verification & KYC</h3>
            <p>
              In accordance with Anti-Money Laundering (AML) and RBI regulations, all sellers receiving escrow payouts must complete bank account verification and provide valid IFSC and bank details.
            </p>

            <h3 className="text-sm font-bold text-slate-900">4. Governing Law & Dispute Jurisdiction</h3>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India. Any legal proceedings arising out of transactions on this Platform shall be subject to the exclusive jurisdiction of the courts in Gurugram / New Delhi.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: REFUNDS & CANCELLATIONS */}
      {activeTab === 'refunds' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Refunds & Cancellation Policy</h2>
            <p className="text-xs text-slate-500 font-medium">Clear guidelines for order cancellations, escrow refunds, and disbursal timelines</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cancellation Terms */}
            <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>Order Cancellation Policy</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li>Shipments can be cancelled prior to courier pickup for a <strong>100% full refund</strong> of the escrow deposit.</li>
                <li>Once the package is in transit with the courier partner (Delhivery, BlueDart, DTDC), cancellation cannot be performed directly; a return or dispute claim must be filed instead.</li>
              </ul>
            </div>

            {/* Refund Timeline */}
            <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2 text-[#1E56E3] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>Refund Processing & Timelines</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li>Undelivered packages or approved returns trigger an automatic escrow refund to the receiver.</li>
                <li>Accrued escrow interest (@ 5% p.a.) is added to the principal refund amount.</li>
                <li>All refunds are credited via Cashfree Payment Gateway back to the original source (Bank A/C, UPI, Card) within <strong>5 to 7 business days</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS / SERVICES & PRICING IN INR (₹) */}
      {activeTab === 'services' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Products & Services Catalog (Pricing in INR ₹)</h2>
            <p className="text-xs text-slate-500 font-medium">Transparent INR fee structure for escrow payment protection and disbursal services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E56E3] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Standard Escrow Buyer & Seller Protection</h3>
              <p className="text-xs text-slate-500 font-medium">Secures buyer funds in nodal escrow accounts until parcel delivery inspection. Includes SMS notifications and dispute protection.</p>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Service Charge</span>
                <span className="text-lg font-black text-emerald-600">₹0 INR <span className="text-[10px] text-slate-400 font-normal">(Free)</span></span>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Seller Escrow Wallet & Instant Disbursal</h3>
              <p className="text-xs text-slate-500 font-medium">Automated bank account payout transfer upon receiver sign-off or delivery confirmation timer completion.</p>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Disbursal Fee</span>
                <span className="text-lg font-black text-emerald-600">₹0 INR <span className="text-[10px] text-slate-400 font-normal">(Free)</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRIVACY POLICY */}
      {activeTab === 'privacy' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Privacy Policy & Data Security</h2>
            <p className="text-xs text-slate-500 font-medium">256-bit SSL encryption and strict non-disclosure compliance</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
            <p>
              SafeCart Technologies Private Limited respects your privacy and is committed to protecting personal information such as phone numbers, delivery addresses, and payment details collected via Cashfree Payment Gateway.
            </p>
            <p>
              We do not sell, rent, or trade your data to third parties. Information is used strictly for fulfilling escrow courier shipments, verifying identities, and processing bank disbursals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
