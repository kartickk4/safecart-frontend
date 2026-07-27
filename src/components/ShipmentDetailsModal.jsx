import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Box, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Truck, Link2, Copy, Share2, CreditCard, XCircle, RotateCcw } from 'lucide-react';
import { shipmentAPI, claimAPI } from '../services/api';
import PaymentCheckoutModal from './PaymentCheckoutModal';

export default function ShipmentDetailsModal({ shipment, isOpen, onClose, onRefresh }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showUndeliveredForm, setShowUndeliveredForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Claim, Cancel, Undelivered & Return states
  const [claimReason, setClaimReason] = useState('Damaged items');
  const [claimDesc, setClaimDesc] = useState('');
  const [cancelReason, setCancelReason] = useState('Order cancelled by mutual agreement');
  const [undeliveredReason, setUndeliveredReason] = useState('Courier delivery attempt failed / returned to origin');
  const [returnReason, setReturnReason] = useState('Defective / Damaged product received');

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

  const handleCancelShipment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await shipmentAPI.cancelShipment(currentShipment.shipmentId, cancelReason);
      alert('Shipment cancelled successfully. Escrow funds refunded if applicable.');
      setShowCancelForm(false);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel shipment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportUndelivered = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await shipmentAPI.refundUndelivered(currentShipment.shipmentId, undeliveredReason);
      const summary = res.data?.refundSummary;
      const amtStr = summary ? `₹${summary.principal.toLocaleString()} principal + ₹${summary.accruedInterest} accrued interest` : 'Principal + Interest';
      alert(`Courier marked as undelivered! ${amtStr} successfully refunded to receiver.`);
      setShowUndeliveredForm(false);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process undelivered refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await shipmentAPI.requestReturn(currentShipment.shipmentId, returnReason);
      const revAwb = res.data?.returnAwbCode || `REV-${currentShipment.shipmentId}`;
      alert(`Return request submitted successfully! Reverse AWB generated: ${revAwb}. Escrow funds frozen.`);
      setShowReturnForm(false);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReturn = async () => {
    setActionLoading(true);
    try {
      await shipmentAPI.approveReturn(currentShipment.shipmentId);
      alert('Return approved! Reverse courier pickup scheduled.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve return.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReturnReceived = async () => {
    if (!window.confirm('Confirm that the returned package has arrived at your warehouse? (Receiver receives principal + 50% interest, and 50% interest bonus is added to your Escrow Wallet).')) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.confirmReturnReceived(currentShipment.shipmentId);
      const split = res.data?.interestSplit;
      const recTotal = split ? `₹${split.receiverTotalRefund.toLocaleString('en-IN')}` : 'Principal + 50% Interest';
      const supBonus = split ? `₹${split.supplierWalletBonus.toLocaleString('en-IN')}` : '50% Interest';
      alert(`Return confirmed! Receiver refunded ${recTotal}. Your 50% interest share of ${supBonus} has been added to your Escrow Wallet!`);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm return receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const isCancellable = ['Awaiting Payment', 'Pending Pickup'].includes(currentShipment.status);
  const isUndeliverable = ['In Transit', 'Out for Delivery', 'Pending Pickup', 'Reached Destination Hub'].includes(currentShipment.status);
  const isReturnable = ['Delivered', 'Out for Delivery', 'Reached Destination Hub', 'In Transit'].includes(currentShipment.status) && !['Released', 'Cancelled', 'Returned & Refunded'].includes(currentShipment.status);

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
              <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentShipment.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border-slate-300' : 
                currentShipment.status === 'Undelivered' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                'bg-blue-50 text-[#1E56E3] border-blue-200'
              }`}>
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

            {/* REVERSE LOGISTICS RETURN CARD */}
            {(currentShipment.returnAwbCode || currentShipment.returnStatus !== 'None' || currentShipment.status?.includes('Return')) && (
              <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Reverse Logistics Return AWB Issued</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    {currentShipment.returnStatus || currentShipment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-slate-900">Reverse AWB: {currentShipment.returnAwbCode || `REV-${currentShipment.shipmentId}`}</p>
                    <p className="text-[11px] text-slate-600">Reason: {currentShipment.returnReason || 'Product return requested'}</p>
                  </div>
                  <a
                    href={currentShipment.returnShippingLabelUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <span>Return Label PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>💡 Escrow Return Interest Split Rule (50/50)</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full">5.0% p.a. Yield</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    • <strong>Receiver (Buyer):</strong> Paid Principal + 50% Accrued Interest Refund.<br/>
                    • <strong>Supplier (Seller):</strong> 50% Accrued Interest added directly to Escrow Wallet.
                  </p>
                </div>

                {currentShipment.returnStatus === 'Requested' && (
                  <button
                    onClick={handleApproveReturn}
                    disabled={actionLoading}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Approve Return & Dispatch Reverse Pickup
                  </button>
                )}
                {currentShipment.returnStatus === 'In Return Transit' && (
                  <button
                    onClick={handleConfirmReturnReceived}
                    disabled={actionLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Confirm Return Arrived (Refund Receiver + Credit 50% Interest to Wallet)
                  </button>
                )}
              </div>
            )}

            {/* Actions Bar */}
            {!showClaimForm && !showCancelForm && !showUndeliveredForm && !showReturnForm ? (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleRelease}
                  disabled={actionLoading || ['Released', 'Cancelled', 'Undelivered', 'Returned & Refunded'].includes(currentShipment.status)}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentShipment.status === 'Released' ? 'Funds Released' : 'Confirm & Release Funds'}</span>
                </button>

                {isReturnable && (
                  <button
                    onClick={() => setShowReturnForm(true)}
                    disabled={actionLoading || ['Return Requested', 'Return In Transit', 'Returned & Refunded'].includes(currentShipment.status)}
                    className="py-3 px-3 bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Request Return</span>
                  </button>
                )}

                {isUndeliverable && (
                  <button
                    onClick={() => setShowUndeliveredForm(true)}
                    disabled={actionLoading || ['Undelivered', 'Released'].includes(currentShipment.status)}
                    className="py-3 px-3 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Undelivered</span>
                  </button>
                )}

                {isCancellable && (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    disabled={actionLoading}
                    className="py-3 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Cancel</span>
                  </button>
                )}

                <button
                  onClick={() => setShowClaimForm(true)}
                  disabled={['Locked', 'Cancelled', 'Undelivered', 'Returned & Refunded'].includes(currentShipment.status)}
                  className="py-3 px-3 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Dispute</span>
                </button>
              </div>
            ) : showReturnForm ? (
              <form onSubmit={handleRequestReturn} className="pt-4 border-t border-slate-100 space-y-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Request Product Return (Issues REV-SPL-XXXX AWB)
                  </h4>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-600">
                  <p>Requesting a return will issue a Reverse Courier AWB (e.g. <span className="font-mono font-bold text-slate-900">REV-{currentShipment.shipmentId}</span>) and freeze escrow funds until return delivery.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Return Reason</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Defective / Damaged product received">Defective / Damaged product received</option>
                    <option value="Wrong item / size delivered">Wrong item / size delivered</option>
                    <option value="Product not as described">Product not as described</option>
                    <option value="Buyer change of mind / cancel order">Buyer change of mind / cancel order</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 flex-1 shadow-md"
                  >
                    Issue Reverse AWB & Request Return
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReturnForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : showUndeliveredForm ? (
              <form onSubmit={handleReportUndelivered} className="pt-4 border-t border-slate-100 space-y-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Undelivered Courier Refund (Principal + 5% Interest)
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    5.0% p.a. Yield Included
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                  <p className="text-slate-600">If marked undelivered, escrow principal (₹{currentShipment.amount?.toLocaleString() || '3,420'}) + accrued 5.0% p.a. interest will be refunded to the receiver.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Carrier Undelivered Reason</label>
                  <select
                    value={undeliveredReason}
                    onChange={(e) => setUndeliveredReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Courier delivery attempt failed / returned to origin">Courier delivery attempt failed / returned to origin</option>
                    <option value="Package lost / damaged by carrier">Package lost / damaged by carrier partner</option>
                    <option value="Address unreachable / recipient uncontactable">Address unreachable / recipient uncontactable</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 flex-1 shadow-md"
                  >
                    Confirm Undelivered Refund to Receiver
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUndeliveredForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : showCancelForm ? (
              <form onSubmit={handleCancelShipment} className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Cancel Shipment & Refund Escrow
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Order cancelled by mutual agreement">Order cancelled by mutual agreement</option>
                    <option value="Incorrect shipment details entered">Incorrect shipment details entered</option>
                    <option value="Item out of stock / unavailable">Item out of stock / unavailable</option>
                    <option value="Buyer requested cancellation">Buyer requested cancellation</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 flex-1"
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                </div>
              </form>
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
