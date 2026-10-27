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
              <h3 className="text-sm font-bold text-slate-900 mb-1">6. Governing Law & Jurisdiction</h3>
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

      {/* TAB 6: PRIVACY POLICY */}
      {activeTab === 'privacy' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Privacy Policy & Data Security</h2>
            <p className="text-xs text-slate-500 font-medium">256-bit SSL encryption and strict logistics data confidentiality standards</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
            <p>
              M/s SecureKaro Logistics (Proprietor: Kartick Das) respects user privacy and complies with the Information Technology Act, 2000 and SPDI Rules. Contact details, delivery addresses, and payment information collected for shipping bookings are processed exclusively through 256-bit SSL encrypted channels.
            </p>
            <p>
              We do not sell, rent, or trade your data to third parties. Customer data is strictly utilized for carrier pickup, parcel delivery fulfillment, real-time shipment tracking, and customer support.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
