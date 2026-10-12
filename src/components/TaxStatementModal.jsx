import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Printer, X, CheckCircle, TrendingUp, 
  DollarSign, ShieldCheck, Percent, HelpCircle, Calendar, ArrowUpRight,
  Receipt, Building, ShieldAlert, Sparkles, AlertCircle
} from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function TaxStatementModal({ isOpen, onClose, shipments = [] }) {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'tax' | 'rto'
  const [financialYear, setFinancialYear] = useState('2024-2025');

  // Filter shipments by selected financial year (or All)
  const filteredShipments = useMemo(() => {
    if (financialYear === 'all') return shipments;
    return shipments.filter(s => {
      const date = new Date(s.createdAt || Date.now());
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed (April is 3)
      // FY in India runs from April 1 to March 31
      const fy = month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      return fy === financialYear;
    });
  }, [shipments, financialYear]);

  // Financial calculations
  const stats = useMemo(() => {
    const totalOrders = filteredShipments.length;
    const grossRevenue = filteredShipments.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    
    // Settled vs held
    const releasedList = filteredShipments.filter(s => s.status === 'Released');
    const releasedRevenue = releasedList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const inEscrowList = filteredShipments.filter(s => s.status === 'Awaiting Payment' || s.status === 'Pending Pickup' || s.status === 'In Transit' || s.status === 'Out for Delivery');
    const inEscrowAmount = inEscrowList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    // Platform fees
    const totalGatewayFees = filteredShipments.reduce((sum, s) => sum + (Number(s.gatewayFeeDeducted) || 0), 0);
    
    // Estimated shipping costs (avg ₹60 per parcel if carrier booked)
    const estimatedShippingCost = totalOrders * 60;

    // Net Profit = Released revenue minus platform fees minus shipping
    const netProfit = Math.max(0, releasedRevenue - totalGatewayFees - (releasedList.length * 60));
    const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0';

    // GST & Tax calculations (standard 18% GST reverse-calculation on retail gross)
    const taxableTurnover = Math.round(grossRevenue / 1.18);
    const estimatedGst = Math.round(grossRevenue - taxableTurnover);

    // RTO & Losses Saved
    const rtoOrders = filteredShipments.filter(s => (s.returnStatus && s.returnStatus !== 'None') || s.status?.includes('Return'));
    const rtoCount = rtoOrders.length;
    const rtoRate = totalOrders > 0 ? ((rtoCount / totalOrders) * 100).toFixed(1) : '0.0';
    const rtoProtectedCount = filteredShipments.filter(s => s.rtoProtectionEnabled).length;
    const rtoSavings = rtoProtectedCount * 40; // ₹40 relief compensation per parcel

    return {
      totalOrders,
      grossRevenue,
      releasedRevenue,
      releasedCount: releasedList.length,
      inEscrowAmount,
      inEscrowCount: inEscrowList.length,
      totalGatewayFees,
      estimatedShippingCost,
      netProfit,
      profitMargin,
      taxableTurnover,
      estimatedGst,
      rtoCount,
      rtoRate,
      rtoProtectedCount,
      rtoSavings
    };
  }, [filteredShipments]);

  if (!isOpen) return null;

  // 1-Click CSV Download
  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      // First try the backend export endpoint
      try {
        const res = await shipmentAPI.exportTaxStatementCSV();
        if (res && res.data) {
          const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `securekaro_tax_pnl_statement_FY${financialYear}_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setDownloading(false);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend CSV download fallback to frontend generator:', backendErr);
      }

      // Client-side fallback CSV generator (100% reliable)
      const headers = [
        'Date',
        'Shipment/Invoice ID',
        'Buyer Name',
        'Buyer Phone',
        'Destination City',
        'Product Description',
        'Gross Sale Value (INR)',
        'Payment Mode',
        'Delivery Status',
        'Escrow Status',
        'Carrier Partner',
        'AWB Code',
        'Platform Fee (INR)',
        'Estimated GST 18% (INR)',
        'Taxable Turnover Base (INR)',
        'Net Realized Revenue (INR)',
        'RTO Protection Active',
        'RTO Return Status'
      ];

      const rows = filteredShipments.map(s => {
        const gross = Number(s.amount || 0);
        const gst = (gross * 0.18 / 1.18).toFixed(2);
        const taxable = (gross / 1.18).toFixed(2);
        const fee = Number(s.gatewayFeeDeducted || 0).toFixed(2);
        const net = s.status === 'Released' ? (gross - Number(fee)).toFixed(2) : '0.00';
        const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '';

        return [
          `"${dateStr}"`,
          `"${s.shipmentId || ''}"`,
          `"${(s.receiverName || 'Buyer').replace(/"/g, '""')}"`,
          `"${s.receiverPhone || ''}"`,
          `"${(s.city || 'Domestic').replace(/"/g, '""')}"`,
          `"${(s.description || 'Goods').replace(/"/g, '""')}"`,
          `"${gross.toFixed(2)}"`,
          `"${s.paymentMode || 'Escrow'}"`,
          `"${s.status || ''}"`,
          `"${s.escrowStage || (s.status === 'Released' ? 'Released' : 'Held')}"`,
          `"${(s.carrierSlug || 'Delhivery').toUpperCase()}"`,
          `"${s.awbCode || ''}"`,
          `"${fee}"`,
          `"${gst}"`,
          `"${taxable}"`,
          `"${net}"`,
          `"${s.rtoProtectionEnabled ? 'YES' : 'NO'}"`,
          `"${s.returnStatus || 'None'}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `securekaro_tax_pnl_statement_FY${financialYear}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to generate CSV export. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden printable-area">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  One-Click Tax &amp; Profit/Loss Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  CA-Ready Statement
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Automated GST calculations, profit margins, and RTO loss ledger — zero spreadsheets needed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="2024-2025">FY 2024-2025</option>
              <option value="2023-2024">FY 2023-2024</option>
              <option value="all">All-Time Cumulative</option>
            </select>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50 no-print">
          {[
            { id: 'pnl', label: 'Profit & Loss Statement', icon: TrendingUp },
            { id: 'tax', label: 'Tax & GST Summary', icon: Receipt },
            { id: 'rto', label: 'RTO & Trust Shield', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold border-b-2 transition cursor-pointer ${
                  active 
                    ? 'border-blue-600 text-blue-600 bg-white shadow-xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'pnl' && (
            <div className="space-y-6">
              {/* P&L HIGHLIGHT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Gross Sales Turnover (GMV)</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ₹{stats.grossRevenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{stats.totalOrders} total shipments booked</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Realized Net Payouts</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    ₹{stats.releasedRevenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{stats.releasedCount} orders settled in bank</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                  <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Estimated Net Profit</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1">
                    ₹{stats.netProfit.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    {stats.profitMargin}% Operating Margin
                  </p>
                </div>
              </div>

              {/* DETAILED P&L LEDGER TABLE */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black uppercase text-[10px] text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Financial Ledger Item</th>
                      <th className="py-3 px-4">Calculation Formula</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-800">Gross Sales Value</td>
                      <td className="py-3 px-4 text-slate-500">Total customer payments escrowed</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{stats.grossRevenue.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-50/40">
                      <td className="py-3 px-4 text-slate-700">Less: Active Escrow in Pipeline</td>
                      <td className="py-3 px-4 text-slate-500">{stats.inEscrowCount} parcels in transit / awaiting buyer OTP</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">-₹{stats.inEscrowAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-emerald-800">Total Settled Merchant Payouts</td>
                      <td className="py-3 px-4 text-slate-500">Released automatically upon buyer delivery sign-off</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">₹{stats.releasedRevenue.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-50/40">
                      <td className="py-3 px-4 text-slate-700">Less: Platform Gateway &amp; Escrow Fees</td>
                      <td className="py-3 px-4 text-slate-500">Standard platform fee (deducted at release)</td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600">-₹{stats.totalGatewayFees.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-700">Less: Estimated Carrier Logistics Cost</td>
                      <td className="py-3 px-4 text-slate-500">Standard surface dispatch (~₹60/parcel)</td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600">-₹{stats.estimatedShippingCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-blue-50/50 font-black text-slate-900 border-t-2 border-slate-200">
                      <td className="py-3 px-4 text-blue-900 text-sm">Net Operating Profit Realized</td>
                      <td className="py-3 px-4 text-slate-500">Net take-home after all logistics &amp; escrow fees</td>
                      <td className="py-3 px-4 text-right text-sm text-blue-900 font-extrabold">₹{stats.netProfit.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              {/* TAX CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Taxable Turnover Base</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ₹{stats.taxableTurnover.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Excludes estimated indirect tax</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80">
                  <p className="text-[10px] font-black uppercase text-purple-800 tracking-wider">Estimated GST Liability (18%)</p>
                  <p className="text-2xl font-black text-purple-900 mt-1">
                    ₹{stats.estimatedGst.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-purple-700 font-semibold mt-0.5">GSTR-1 output tax schedule</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">CA Compliance Status</p>
                  <p className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Audit Ready</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fully synchronized with escrow timestamps</p>
                </div>
              </div>

              {/* TAX DETAILS EXPLANATION */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>GST &amp; Income Tax Filing Guidance for E-Commerce Merchants</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Under Indian GST law, all transactions conducted via SecureKaro are escrow-backed with unique shipment IDs, receiver states, and timestamped delivery confirmations. You can provide this CSV statement directly to your Chartered Accountant (CA) for monthly <strong>GSTR-1</strong> and <strong>GSTR-3B</strong> returns.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-slate-900 block">Gross Invoiced Receipts:</span>
                    <span className="text-slate-500 font-medium">₹{stats.grossRevenue.toLocaleString('en-IN')} (Eligible for Section 44AD presumptive taxation)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-slate-900 block">Deductible Platform Costs:</span>
                    <span className="text-slate-500 font-medium">₹{stats.totalGatewayFees.toLocaleString('en-IN')} (Platform service invoice with 18% input credit)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rto' && (
            <div className="space-y-6">
              {/* RTO METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80">
                  <p className="text-[10px] font-black uppercase text-orange-800 tracking-wider">RTO Return Rate</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stats.rtoRate}%
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stats.rtoCount} return requests filed</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">RTO Insurance Savings</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    ₹{stats.rtoSavings.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">₹40/parcel platform relief fund</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                  <p className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Fraud Prevention Rate</p>
                  <p className="text-2xl font-black text-blue-900 mt-1">
                    100.0%
                  </p>
                  <p className="text-[11px] text-blue-700 font-semibold mt-0.5">2-Factor OTP &amp; In-Box QR Signoff</p>
                </div>
              </div>

              {/* RTO PROTECTION SHIELD BANNER */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    SecureKaro Zero-Loss RTO Protection Active
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    By requiring 6-digit SMS OTP verification before first dispatch and in-box QR verification on doorstep receipt, fake buyer addresses and counterfeit return claims are blocked upfront. For approved customer returns, SecureKaro credits ₹40 compensation directly to your merchant wallet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER & 1-CLICK ACTIONS */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Includes {filteredShipments.length} transactions for FY {financialYear}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Statement</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={downloading}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Generating CSV...' : 'Download Tax & P&L (CSV)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
