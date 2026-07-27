import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, Clock, Eye, FileText, Send, Upload, Lock, TrendingUp } from 'lucide-react';
import { claimAPI, shipmentAPI } from '../services/api';

export default function ClaimsView({ user, onSelectShipment }) {
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'file' | 'status' | 'supplier'
  const [claimsList, setClaimsList] = useState([]);
  const [shipmentId, setShipmentId] = useState('');
  
  const isSupplierUser = user?.role === 'Supplier' || user?.activeRole === 'Supplier';
  const [role, setRole] = useState(isSupplierUser ? 'supplier' : 'receiver');
  const [reason, setReason] = useState('Damaged items');
  const [description, setDescription] = useState('Package arrived crushed with visible product damage.');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUserClaims();
  }, []);

  useEffect(() => {
    setRole(isSupplierUser ? 'supplier' : 'receiver');
  }, [user]);

  const fetchUserClaims = async () => {
    try {
      const res = await shipmentAPI.getShipments();
      if (Array.isArray(res.data)) {
        const lockedShipments = res.data.filter(s => s.status === 'Locked');
        setClaimsList(lockedShipments);
        if (lockedShipments.length > 0 && !shipmentId) {
          setShipmentId(lockedShipments[0].shipmentId);
        }
      }
    } catch (e) {}
  };

  const principalVal = Number(customAmount) > 0 ? Number(customAmount) : 3420;
  const daysHeld = 14;
  const interestVal = Number((principalVal * 0.05 * (daysHeld / 365)).toFixed(2));
  const totalClaimVal = Number((principalVal + interestVal).toFixed(2));

  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!shipmentId) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await claimAPI.fileClaim({
        shipmentId,
        role,
        reason,
        description
      });
      setSuccessMsg('Dispute claim filed successfully! Escrow funds locked under review.');
      setActiveSubTab('status');
    } catch (err) {
      console.error('File Claim Error:', err);
      const msg = err.response?.data?.error || 'Failed to file dispute claim. Please verify shipment ID and details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Dispute Claims & Mediator Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage open claims, file new disputes, and track mediator review status.</p>
        </div>

        {/* Sub Navigation Pills */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-xs font-semibold text-slate-600 w-fit">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-1.5 rounded-lg transition ${activeSubTab === 'list' ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Active Claims
          </button>
          <button
            onClick={() => setActiveSubTab('file')}
            className={`px-4 py-1.5 rounded-lg transition ${activeSubTab === 'file' ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            + File New Claim
          </button>
          <button
            onClick={() => setActiveSubTab('status')}
            className={`px-4 py-1.5 rounded-lg transition ${activeSubTab === 'status' ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Claim Status Tracker
          </button>
          <button
            onClick={() => setActiveSubTab('supplier')}
            className={`px-4 py-1.5 rounded-lg transition ${activeSubTab === 'supplier' ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Supplier Dispute Response
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ACTIVE CLAIMS LIST */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {claimsList.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No Active Dispute Claims</p>
              <p className="text-xs text-slate-500">All transactions are proceeding normally. Click "+ File New Claim" if you encounter any parcel issues.</p>
            </div>
          ) : (
            claimsList.map((claim) => (
              <div key={claim._id || claim.shipmentId} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 mt-1">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-slate-900 text-sm">CLM-{claim.shipmentId}</h3>
                      <span className="text-xs font-bold text-[#1E56E3] bg-blue-50 px-2 py-0.5 rounded-md">{claim.shipmentId}</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Escrow Locked
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">Recipient: {claim.receiverName}</p>
                    <p className="text-xs text-slate-500 max-w-2xl">Dispute initiated on route {claim.city}. Escrow held under mediator review.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locked Escrow</span>
                    <span className="text-lg font-extrabold text-rose-600">₹{claim.amount?.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    onClick={() => { setShipmentId(claim.shipmentId); setActiveSubTab('status'); }}
                    className="px-4 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspect Claim</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 2: FILE NEW CLAIM FORM */}
      {activeSubTab === 'file' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">File a New Dispute Claim</h2>
            <p className="text-xs text-slate-500">Submitting a claim locks the escrow funds and alerts mediator admins.</p>
          </div>

          <form onSubmit={handleFileClaim} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Shipment ID</label>
              <input
                type="text"
                required
                placeholder="PSF-2026-00838"
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Filing Party Role (Fixed by Account)</label>
                <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="capitalize">{role === 'supplier' ? 'Supplier (Seller)' : 'Receiver (Buyer)'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Auto-fixed</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Reason Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Damaged items">Damaged items</option>
                  <option value="Item not received">Item not received</option>
                  <option value="Wrong item delivered">Wrong item delivered</option>
                  <option value="Carrier delay penalty">Carrier delay penalty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description of Dispute</label>
              <textarea
                rows="3"
                required
                placeholder="Provide a clear description of the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              ></textarea>
            </div>

            {/* CLAIM SUMMARY CARD (MATCHING USER DESIGN WITH 5% ANNUAL INTEREST) */}
            <div className="p-6 rounded-3xl bg-[#F0F5FF] border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#1E56E3]" />
                    Claim Summary
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Disputed Escrow Amount</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  All amounts in ₹ INR
                </span>
              </div>

              <div className="space-y-2 border-t border-blue-100/80 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Disputed Escrow Amount</span>
                  <span className="font-bold text-slate-900 font-mono">₹{principalVal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span>📈 Interest Receivable</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      5.0% p.a. × {daysHeld} days
                    </span>
                  </span>
                  <span className="font-bold font-mono">+ ₹{interestVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm border-t border-blue-200/80 pt-2">
                  <div>
                    <span>Total Claim Amount</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Principal + Interest</span>
                  </div>
                  <span className="text-[#1E56E3] font-mono font-black text-base">
                    ₹{totalClaimVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  CUSTOM DISPUTED AMOUNT (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to dispute the full escrow amount. Interest is calculated on the disputed amount.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Submit Claim & Lock Escrow</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: CLAIM STATUS TRACKER */}
      {activeSubTab === 'status' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">CLM-9478-X • Under Review</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Claim Status Tracker</h2>
            </div>
            <span className="text-sm font-black text-rose-600">₹920 Escrow Locked</span>
          </div>

          <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-md">✓</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dispute Claim Submitted by Receiver</p>
                <p className="text-[11px] text-slate-500">Escrow funds locked. Supplier notified for response.</p>
                <span className="text-[10px] text-slate-400">Jul 22, 2026 • 09:14 AM</span>
              </div>
            </div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-md animate-pulse">2</div>
              <div>
                <p className="text-xs font-bold text-amber-700">Awaiting Supplier Evidence Response</p>
                <p className="text-[11px] text-slate-500">Supplier given 24 hours to submit proof of dispatch.</p>
                <span className="text-[10px] text-slate-400">In Progress</span>
              </div>
            </div>

            <div className="flex items-start gap-4 relative z-10 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs">3</div>
              <div>
                <p className="text-xs font-bold text-slate-700">Mediator Admin Verdict & Disbursal</p>
                <p className="text-[11px] text-slate-500 font-medium">Final resolution and fund allocation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SUPPLIER DISPUTE RESPONSE PANEL */}
      {activeSubTab === 'supplier' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Supplier Dispute Evidence Response</h2>
            <p className="text-xs text-slate-500">Upload packing video proof or carrier receipt to respond to dispute CLM-9478-X.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Counter Statement</label>
              <textarea
                rows="3"
                placeholder="Parcel was shipped in pristine factory-sealed box via FedEx..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              ></textarea>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Upload Packing Video / Carrier Proof</p>
              <p className="text-[11px] text-slate-400">PNG, JPG, MP4 up to 25MB</p>
            </div>

            <button
              onClick={() => alert('Supplier evidence submitted to mediator admin!')}
              className="w-full py-3 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md"
            >
              Submit Supplier Proof to Mediator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const mockClaims = [
  {
    claimId: 'CLM-9478-X',
    shipmentId: 'PSF-2026-00838',
    filedBy: 'Rohan Gupta (Receiver)',
    reason: 'Damaged items',
    description: 'Outer carton arrived crushed. Product console screen has visible scratches.',
    status: 'Under Review',
    amount: '₹920',
    date: 'Jul 22, 2026'
  },
  {
    claimId: 'CLM-3129-A',
    shipmentId: 'PSF-2026-00812',
    filedBy: 'Kartick Das (Supplier)',
    reason: 'Carrier delay penalty dispute',
    description: 'Carrier weather disruption caused 48h delay beyond control.',
    status: 'Escalated Urgent',
    amount: '₹2,450',
    date: 'Jul 21, 2026'
  }
];
