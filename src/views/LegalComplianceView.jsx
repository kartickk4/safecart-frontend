import React, { useState } from 'react';
import { 
  ShieldCheck, Phone, Mail, MapPin, Clock, FileText, 
  RotateCcw, DollarSign, Package, CheckCircle2, AlertCircle, Building2, ExternalLink, Truck
} from 'lucide-react';

export default function LegalComplianceView({ initialTab = 'contact', onTabChange }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'contact' | 'terms' | 'shipping' | 'refunds' | 'services' | 'privacy'

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        {[
          { id: 'contact', label: 'Contact Us', icon: Phone },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'shipping', label: 'Shipping & Delivery Policy', icon: Truck },
          { id: 'refunds', label: 'Refunds & Cancellations', icon: RotateCcw },
          { id: 'services', label: 'Products & Services (INR Pricing)', icon: Package },
          { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
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
                <p className="text-xs text-slate-500 font-medium">M/s SecureKaro Logistics (Proprietor: Kartick Das) Customer Support & Logistics Desk</p>
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
                <p className="text-lg font-extrabold text-slate-900 font-mono">logistic@securekaro.in</p>
                <p className="text-xs text-slate-500 font-medium">
                  General Support & Escalations: <span className="font-mono text-slate-700">support@securekaro.in</span>
                </p>
              </div>

              {/* Registered Address matching Trade Licence */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <MapPin className="w-5 h-5 text-[#1E56E3]" />
                  <span>Registered Office & Operating Address</span>
                </div>
                <div className="text-xs text-slate-700 font-semibold leading-relaxed space-y-1">
                  <p className="font-bold text-slate-900 text-sm">M/s SecureKaro (SecureKaro Logistics)</p>
                  <p>Proprietor: Kartick Das</p>
                  <p>Municipality: North Dum Dum, District: North 24 Parganas</p>
                  <p>Kolkata, West Bengal 700049, India.</p>
                  <p className="text-[11px] font-mono text-slate-500 font-normal pt-1 border-t border-slate-200">
                    Certificate of Enlistment (Trade Licence No): <span className="font-bold text-slate-800">0917P453826577951</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 font-normal">
                    State Government Ref ID: <span className="font-bold text-slate-800">220882607200574612</span>
                  </p>
                </div>
              </div>

              {/* Grievance Redressal Officer (Mandatory for RBI & Cashfree compliance) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Nodal & Grievance Redressal Officer (RBI & IT Act Compliance)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Officer Name</span>
                    <span className="font-bold text-slate-900 text-sm">Kartick Das</span>
                    <span className="block text-slate-500 text-[11px]">Proprietor & Grievance Officer</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Direct Compliance Email</span>
                    <span className="font-mono font-bold text-[#1E56E3] text-xs">logistic@securekaro.in</span>
                    <span className="block text-slate-500 text-[11px]">Turnaround: within 24-48 business hours</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating Hours</span>
                    <span className="font-semibold text-slate-800 text-xs">Mon – Sat (9:00 AM – 7:00 PM IST)</span>
                    <span className="block text-slate-500 text-[11px]">Excluding National Holidays</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERMS & CONDITIONS */}
      {activeTab === 'terms' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Terms & Conditions of Service</h2>
            <p className="text-xs text-slate-500 font-medium">Logistics Aggregator, B2B Courier Booking & Delivery Protection Software Agreement</p>
          </div>

          <div className="space-y-5 text-xs text-slate-700 leading-relaxed font-medium">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">1. Nature of Platform & Services</h3>
              <p>
                SecureKaro ("Platform"), operated by M/s SecureKaro Logistics (Proprietor: Kartick Das), is a <strong>Logistics Aggregator & Shipping Software Platform</strong> that facilitates <strong>B2B Courier Booking, Automated Shipping Label Generation, Multi-Carrier Parcel Tracking, and Delivery Protection</strong>. SecureKaro aggregates licensed courier partners (including Delhivery, Blue Dart, DTDC, and Shadowfax) to provide seamless parcel dispatch, shipment milestone tracking, and COD fraud protection for sellers and buyers.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">2. Courier Booking & Shipping Labels</h3>
              <p>
                Sellers use SecureKaro software to compare courier freight rates, generate barcoded AWB shipping labels, and schedule door-to-door carrier pickups. All physical carriage of goods is executed exclusively by authorized licensed logistics carriers.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">3. Delivery Protection & Sign-Off Verification</h3>
              <p>
                To eliminate delivery disputes and parcel fraud, SecureKaro provides an automated in-box QR verification and SMS OTP sign-off mechanism. When a parcel is safely received without damage or defect, the delivery sign-off confirms receipt, closing the transit protection window.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">4. Payment Gateway Integration & Seller Settlements</h3>
              <p>
                All online transactions, courier fees, and customer order payments are processed through RBI-authorized Payment Gateways (PG) and Payment Aggregators (PA). SecureKaro does not act as a banking entity or deposit-taking institution. Seller order settlements and wallet balances are cleared via standard banking transfer modes (IMPS/UPI) upon order completion.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">5. Merchant Responsibilities & KYC</h3>
              <p>
                Sellers must comply with Indian taxation and KYC norms, ensuring that goods dispatched do not contain hazardous, banned, or contraband items under Indian Postal & Carriage Acts.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">6. Privacy &amp; Data Protection (DPDP Act, 2023)</h3>
              <p>
                By accessing SecureKaro, users consent to the processing of necessary personal and shipment data in strict accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and our Privacy Policy. Users retain full statutory rights of access, correction, nomination, and erasure (account deletion) under Chapter III of the DPDP Act.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">7. Account Closure &amp; Right to Erasure</h3>
              <p>
                Users may request permanent termination of their account and erasure of their personal data at any time via their account Profile or by writing to logistic@securekaro.in. Account closure is subject to the resolution of all ongoing courier shipments in transit and withdrawal of settled wallet balances.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">8. Governing Law &amp; Dispute Jurisdiction</h3>
              <p>
                These terms are governed by the laws of India. Any disputes arising out of the use of SecureKaro shipping software shall be subject to the exclusive jurisdiction of the competent courts in Kolkata / North 24 Parganas, West Bengal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIPPING & DELIVERY POLICY (CRITICAL FOR PAYMENT GATEWAY COMPLIANCE) */}
      {activeTab === 'shipping' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Shipping & Delivery Policy</h2>
            <p className="text-xs text-slate-500 font-medium">Standard logistics transit timelines, carrier partners, and order tracking protocols</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Courier Pickup & Dispatch */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-[#1E56E3] font-bold text-sm">
                <Truck className="w-5 h-5" />
                <span>Pickup & Dispatch Timelines</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li><strong>Same-Day / Next-Day Pickup:</strong> Once a seller books a shipment and generates an AWB label, courier pickup is scheduled within 24 hours.</li>
                <li><strong>Carrier Partners:</strong> Fulfillments are handled by premier national express networks: Delhivery, Blue Dart, DTDC, and Shadowfax.</li>
                <li><strong>Digital Manifests:</strong> Handover is recorded via real-time digital manifest scanning at the seller's pickup location.</li>
              </ul>
            </div>

            {/* Estimated Transit Times */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Standard Delivery Timelines across India</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li><strong>Intra-City &amp; Metro-to-Metro:</strong> 1 to 2 business days.</li>
                <li><strong>Rest of India (Tier 1 &amp; Tier 2 Cities):</strong> 2 to 4 business days.</li>
                <li><strong>Special / Remote Locations (North-East, J&amp;K):</strong> 4 to 6 business days.</li>
                <li><strong>Live Milestone Tracking:</strong> Every parcel is equipped with live GPS tracking accessible by both seller and recipient.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REFUNDS & CANCELLATIONS */}
      {activeTab === 'refunds' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Refunds & Cancellation Policy</h2>
            <p className="text-xs text-slate-500 font-medium">Clear guidelines for order cancellations, damaged parcel resolutions, and refund turnaround times</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cancellation Terms */}
            <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>Order Cancellation Policy</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li>Shipment bookings can be cancelled at any point prior to physical courier pickup for a <strong>100% full refund</strong> of all prepaid courier fees and charges.</li>
                <li>Once the parcel is picked up and in transit with the logistics carrier, cancellation is not possible; a return request must be initiated upon delivery.</li>
              </ul>
            </div>

            {/* Refund Timeline */}
            <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2 text-[#1E56E3] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>Refund Processing & Timelines</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                <li>Undelivered shipments, return-to-origin (RTO) parcels, or verified defect returns trigger automatic refund initiation.</li>
                <li>All refunds are credited via our authorized Payment Gateway back to the customer's original payment method (UPI, Bank Account, or Card) within <strong>5 to 7 business days</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRODUCTS / SERVICES & PRICING IN INR (₹) */}
      {activeTab === 'services' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Products & Services Catalog (Pricing in INR ₹)</h2>
            <p className="text-xs text-slate-500 font-medium">Transparent INR fee structure for shipping aggregator software, label generation, and tracking services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E56E3] flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">B2B Courier Booking & Multi-Carrier Shipping</h3>
              <p className="text-xs text-slate-500 font-medium">Access real-time courier shipping rates, automated AWB generation, and door-to-door courier dispatch across 29,000+ Indian pincodes.</p>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Courier Tariff</span>
                <span className="text-base font-black text-slate-900">From ₹45.00 INR / 500g</span>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Parcel Delivery Protection & Sign-Off Suite</h3>
              <p className="text-xs text-slate-500 font-medium">Automated in-box QR verification, SMS OTP delivery sign-off, photo verification before dispatch, and dispute resolution tools.</p>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Software Platform Fee</span>
                <span className="text-lg font-black text-emerald-600">₹0 INR <span className="text-[10px] text-slate-400 font-normal">(Free for registered users)</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRIVACY POLICY & DPDP ACT, 2023 COMPLIANCE */}
      {activeTab === 'privacy' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statutory Compliance • DPDP Act, 2023 &amp; IT Act, 2000</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Privacy Policy &amp; Digital Personal Data Protection</h2>
            <p className="text-xs text-slate-500 font-medium">
              Governing how personal data is collected, processed, retained, and protected across the SecureKaro platform
            </p>
          </div>

          <div className="space-y-6 text-xs text-slate-700 leading-relaxed font-medium">
            {/* 1. Legal Recognition & Data Fiduciary */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">1</span>
                <span>Statutory Scope &amp; Data Fiduciary Details</span>
              </h3>
              <p>
                This Privacy Policy is formulated in strict accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)</strong>, the <strong>Information Technology Act, 2000</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules)</strong>.
              </p>
              <div className="text-[11.5px] bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Designated Data Fiduciary:</strong> M/s SecureKaro (SecureKaro Logistics)</p>
                <p><strong>Proprietor &amp; Data Protection Lead:</strong> Kartick Das</p>
                <p><strong>Operating Address:</strong> Nimta, North Dum Dum Municipality, Kolkata, West Bengal 700049, India</p>
                <p><strong>Trade Licence No (Certificate of Enlistment):</strong> 0917P453826577951 | State Ref: 220882607200574612</p>
                <p><strong>Official Privacy &amp; Grievance Contact:</strong> <span className="font-mono text-[#1E56E3] font-bold">logistic@securekaro.in</span></p>
              </div>
            </div>

            {/* 2. Categories of Personal Data Collected */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">2</span>
                <span>Categories of Personal Data Collected</span>
              </h3>
              <p>
                As a logistics aggregator and parcel delivery protection software platform, SecureKaro collects only the minimum personal data strictly necessary to execute courier shipments and secure deliveries:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Identity &amp; Account Information:</strong> Full name, business trade name, email address, password hash (encrypted via salted bcrypt), and role assignment (Sender / Receiver).</li>
                <li><strong>Contact &amp; Verification Telephony:</strong> 10-digit mobile phone numbers verified through real-time SMS OTP codes for account authentication and delivery sign-offs.</li>
                <li><strong>Logistics &amp; Delivery Carriage Details:</strong> Doorstep pickup address, consignee/recipient delivery address, landmark, pin code, parcel weight, package dimensions, and shipment contents description.</li>
                <li><strong>Financial &amp; Payout Data:</strong> Bank account numbers, IFSC codes, bank beneficiary names, or UPI IDs — collected exclusively from verified sellers for remittance of order earnings and wallet withdrawals. Online payments and checkout sessions are processed directly through RBI-authorized payment aggregators (Cashfree); SecureKaro never stores debit/credit card CVV or net banking credentials.</li>
                <li><strong>Device &amp; Telemetry Data:</strong> IP address, browser type, operating system, and digital access timestamps used for fraud mitigation and audit logging.</li>
              </ul>
            </div>

            {/* 3. Lawful Basis & Specified Purpose of Processing */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">3</span>
                <span>Lawful Grounds &amp; Specified Purpose of Data Processing</span>
              </h3>
              <p>
                In compliance with Sections 4, 5, and 6 of the DPDP Act, 2023, personal data is processed solely on the basis of <strong>freely given, specific, informed, unconditional, and unambiguous consent</strong>, or for specified legitimate logistics uses:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block text-xs">Courier Booking &amp; Carriage</span>
                  <span className="text-[11px] text-slate-500">Generating automated AWB labels and scheduling doorstep courier pickups with carrier partners.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block text-xs">Delivery Verification &amp; Fraud Prevention</span>
                  <span className="text-[11px] text-slate-500">In-box QR verification and SMS OTP sign-off to eliminate package theft, transit damage, and fake delivery claims.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block text-xs">Merchant Settlement</span>
                  <span className="text-[11px] text-slate-500">Disbursing verified shipping order proceeds and wallet balances via automated banking transfers.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block text-xs">Statutory Legal &amp; Tax Compliance</span>
                  <span className="text-[11px] text-slate-500">Complying with Indian Goods and Services Tax (GST), commercial carriage regulations, and audit mandates.</span>
                </div>
              </div>
            </div>

            {/* 4. Statutory Rights of the Data Principal */}
            <div className="space-y-3 bg-blue-50/60 p-5 rounded-2xl border border-blue-200">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#1E56E3] text-white inline-flex items-center justify-center font-bold text-xs">4</span>
                <span>Statutory Rights of Data Principals (DPDP Act, 2023)</span>
              </h3>
              <p className="text-xs text-slate-700 font-medium">
                Under Chapter III (Sections 11 to 14) of the DPDP Act, 2023, every user (Data Principal) is vested with enforceable statutory rights:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Right to Access (Section 11)</span>
                  <p className="text-slate-600">You have the right to obtain a summary of your personal data processed by us and the list of third-party logistics entities with whom it was shared.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Right to Correction &amp; Updating (Section 12(1))</span>
                  <p className="text-slate-600">You may update or rectify inaccurate or incomplete personal contact details, pickup locations, or bank accounts anytime via your Profile settings.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Right to Erasure / Right to be Forgotten (Section 12(3))</span>
                  <p className="text-slate-600">You have the right to request permanent erasure of your account and personal data via your Profile console or by emailing <span className="font-mono text-[#1E56E3] font-bold">logistic@securekaro.in</span>. Requests are processed within 72 hours, subject to statutory retention for completed tax filings.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Right of Grievance Redressal (Section 13)</span>
                  <p className="text-slate-600">Direct recourse to our Nodal Grievance Officer with an acknowledgment within 48 hours, and subsequent right to file complaints with the <strong>Data Protection Board of India (DPBI)</strong>.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-900 block">Right to Nominate (Section 14)</span>
                  <p className="text-slate-600">You have the right to nominate any individual who shall, in the event of your death or incapacity, exercise your data rights in accordance with the DPDP rules.</p>
                </div>
              </div>
            </div>

            {/* 5. Third-Party Data Processors & PII Masking */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">5</span>
                <span>Third-Party Data Processors &amp; PII Masking Safeguards</span>
              </h3>
              <p>
                SecureKaro <strong>never sells, rents, or commercializes personal data</strong>. Data is disclosed strictly on a need-to-know basis to licensed processors bound by confidentiality agreements:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Integrated Logistics Carrier Networks:</strong> Delhivery, Blue Dart, DTDC, and Shadowfax receive shipping manifests solely to execute transit and doorstep parcel delivery.</li>
                <li><strong>Payment Aggregators:</strong> Cashfree Payments India Pvt. Ltd. (RBI regulated) to process online payments and instant bank settlements.</li>
                <li><strong>Public PII Redaction:</strong> On all public-facing tracking pages and SMS notifications, phone numbers are masked (e.g. <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">+91 ******1234</span>) to protect consumer privacy against unauthorized scraping.</li>
              </ul>
            </div>

            {/* 6. Data Storage, Cross-Border Rules & Security Standards */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">6</span>
                <span>Data Storage within India &amp; Security Measures</span>
              </h3>
              <p>
                In compliance with Section 8 of the DPDP Act and RBI guidelines, all primary database records and transaction histories are hosted on secure enterprise cloud infrastructure <strong>located strictly within the territory of India</strong>. Technical security measures include:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-bold text-[11px]">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">256-Bit SSL/TLS Encryption</div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">Salted Bcrypt Password Hashing</div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">Zero Plaintext Card Storage</div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">Automated Session Expiry</div>
              </div>
            </div>

            {/* 7. Protection of Children */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E56E3] inline-flex items-center justify-center font-bold text-xs">7</span>
                <span>Protection of Children's Personal Data (Section 9)</span>
              </h3>
              <p>
                SecureKaro is an enterprise and commercial shipping management platform. Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal data from minors. If we discover that personal data of a minor has been collected without verifiable parental consent, we will promptly delete such data from our servers.
              </p>
            </div>

            {/* 8. Grievance Officer & Data Protection Board Escalation */}
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/90 space-y-3">
              <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Nodal Grievance Redressal Mechanism &amp; Statutory Escalation</span>
              </h3>
              <p className="text-xs text-emerald-900">
                In compliance with Section 13 of the DPDP Act, 2023, and Rule 5(9) of the IT SPDI Rules, any privacy grievance, data access request, or erasure query may be submitted directly to our designated Nodal Officer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Nodal Officer</span>
                  <span className="font-extrabold text-slate-900">Kartick Das</span>
                  <span className="block text-slate-500 text-[11px]">Proprietor &amp; Grievance Lead</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Direct Redressal Email</span>
                  <span className="font-mono font-bold text-[#1E56E3]">logistic@securekaro.in</span>
                  <span className="block text-slate-500 text-[11px]">Acknowledgment: within 48 hours</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory Appellate Authority</span>
                  <span className="font-bold text-slate-900">Data Protection Board of India</span>
                  <span className="block text-slate-500 text-[11px]">If unaddressed within 30 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
