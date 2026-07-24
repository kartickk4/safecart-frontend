import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Box, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Truck, Link2, Copy, Share2, CreditCard } from 'lucide-react';
import { shipmentAPI, claimAPI } from '../services/api';
import PaymentCheckoutModal from './PaymentCheckoutModal';

export default function ShipmentDetailsModal({ shipment, isOpen, onClose, onRefresh }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Claim states
  const [claimReason, setClaimReason] = useState('Damaged items');
  const [claimDesc, setClaimDesc] = useState('');

  useEffect(() => {
    if (shipment?.shipmentId && isOpen) {
      fetchFullDetails();
    }
  }, [shipment, isOpen]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getShipmentById(shipment.shipmentId);
      setDetails(res.data);
    } catch (err) {
      console.warn('API error fetching shipment details, showing current item state:', err);
      setDetails({ shipment: shipment, journey: null });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !shipment) return null;

  const currentShipment = details?.shipment || shipment;
  const journey = details?.journey;

  const handleRelease = async () => {
    if (!window.confirm('Are you sure you want to confirm delivery and release escrow funds to the seller?')) return;
    setActionLoading(true);
    try {
      await shipmentAPI.releaseEscrow(currentShipment.shipmentId);
      alert('Escrow funds successfully released!');
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to release escrow.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileClaim = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await claimAPI.fileClaim({
        shipmentId: currentShipment.shipmentId,
        role: 'receiver',
        reason: claimReason,
        description: claimDesc
      });
      alert('Dispute claim filed successfully! Escrow funds have been locked under review.');
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to file claim.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4">
      <div className="bg-white h-full sm:h-auto max-w-xl w-full sm:rounded-3xl p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-screen">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-extrabold text-lg">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{currentShipment.shipmentId}</h2>
              <span className="bg-blue-50 text-[#1E56E3] border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentShipment.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{currentShipment.description || 'ParcelSafe Secured Order'}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Fetching live tracking & milestone data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Escrow Value</span>
                <span className="text-xl font-extrabold text-slate-900">₹{currentShipment.amount ? currentShipment.amount.toLocaleString() : '3,420'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient</span>
                <span className="text-sm font-bold text-slate-900 block truncate">{currentShipment.receiverName || 'Priya Nair'}</span>
                <span className="text-[11px] text-slate-500">{currentShipment.receiverPhone || '+919876543210'}</span>
              </div>
            </div>

            {/* Carrier & AWB Details */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-[#1E56E3]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 capitalize">{currentShipment.carrierSlug || 'Delhivery / FedEx'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">AWB: {currentShipment.awbCode || 'TC-delhivery-7539789936'}</p>
                </div>
              </div>
              <a
                href={currentShipment.shippingLabelUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#1E56E3] hover:underline flex items-center gap-1"
              >
                <span>Label PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* SHAREABLE INTEGRATED ESCROW PAYMENT LINK CARD */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#1E56E3] font-extrabold text-xs">
                  <Link2 className="w-4 h-4" />
                  <span>Integrated Escrow Payment Link</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  UPI & NetBanking Active
                </span>
              </div>

              <p className="text-[11px] text-slate-600">Send this payment link to buyer/receiver to collect ₹{currentShipment.amount ? currentShipment.amount.toLocaleString('en-IN') : '3,420'} directly into escrow.</p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`http://localhost:3000/pay/${currentShipment.shipmentId || 'PSF-2026-00841'}`}
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono text-slate-800 truncate"
                />

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/pay/${currentShipment.shipmentId || 'PSF-2026-00841'}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Now</span>
                </button>
              </div>
            </div>

            {/* Live Carrier Journey Milestones */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Carrier Journey & Milestones</h3>
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {journey?.milestones?.length > 0 ? (
                  journey.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{m.status} — {m.location}</p>
                        <p className="text-[11px] text-slate-500">{m.detail}</p>
                        <span className="text-[10px] text-slate-400">{new Date(m.time).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">In Transit — Sorting Hub</p>
                        <p className="text-[11px] text-slate-500">Package scanned at central sorting facility.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Picked Up by Carrier Partner</p>
                        <p className="text-[11px] text-slate-500">Shipment handed over to courier partner.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            {!showClaimForm ? (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={handleRelease}
                  disabled={actionLoading || currentShipment.status === 'Released'}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentShipment.status === 'Released' ? 'Funds Released' : 'Confirm & Release Funds'}</span>
                </button>

                <button
                  onClick={() => setShowClaimForm(true)}
                  disabled={currentShipment.status === 'Locked'}
                  className="py-3 px-4 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>File Dispute</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleFileClaim} className="pt-4 border-t border-slate-100 space-y-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  File Dispute Claim (Locks Escrow)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dispute Reason</label>
                  <select
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Damaged items">Damaged items</option>
                    <option value="Item not received">Item not received</option>
                    <option value="Wrong item delivered">Wrong item delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description & Evidence</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Describe the issue with delivery..."
                    value={claimDesc}
                    onChange={(e) => setClaimDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 flex-1"
                  >
                    Submit Dispute Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <PaymentCheckoutModal
        shipmentId={currentShipment.shipmentId}
        amount={currentShipment.amount || 3420}
        receiverName={currentShipment.receiverName || 'Kartick Das'}
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onPaymentSuccess={() => {
          onRefresh();
          fetchFullDetails();
        }}
      />
    </div>
  );
}
