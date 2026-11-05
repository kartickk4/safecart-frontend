import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  Package, Truck, ArrowRight, RefreshCw, Filter, Search, ChevronRight, 
  ExternalLink, X, Send, MessageSquare, Tag, Copy, Check, MapPin, 
  Zap, Sparkles, Camera, Eye, ZoomIn, QrCode, Printer, ChevronDown, 
  ArrowUpRight, AlertCircle, HelpCircle, CheckCircle, PackageCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { shipmentAPI } from '../services/api';

export default function ReturnOrdersView({ onSelectShipment, user, isSupplier = true }) {
  const [returnOrders, setReturnOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'requested' | 'transit' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAwb, setCopiedAwb] = useState(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState({ isOpen: false, url: '', title: '' });

  // Modal State for Assigning Reverse or Replacement Courier Partner & Tracking ID (Supplier)
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [assignMode, setAssignMode] = useState('return'); // 'return' | 'replacement'
  const [carrierSlug, setCarrierSlug] = useState('delhivery');
  const [carrierName, setCarrierName] = useState('Delhivery Express');
  const [trackingId, setTrackingId] = useState('');
  const [courierNotes, setCourierNotes] = useState('');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('');

  // Modal State for Reverse Tracking Journey (Both Receiver & Supplier)
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);

  // Partial discount offer inputs keyed by shipmentId (Supplier)
  const [discountInputs, setDiscountInputs] = useState({});

  // Replacement In-Box QR Code Modal (Supplier)
  const [replacementQrModalOrder, setReplacementQrModalOrder] = useState(null);
  const [replacementQrCopied, setReplacementQrCopied] = useState(false);

  useEffect(() => {
    fetchReturnOrders();
  }, [isSupplier]);

  const fetchReturnOrders = async () => {
    setLoading(true);
    try {
      let res;
      if (isSupplier) {
        res = await shipmentAPI.getSupplierReturnOrders();
      } else {
        res = await shipmentAPI.getReceiverReturnOrders();
      }
      const data = Array.isArray(res.data) ? res.data : (res.data?.returnOrders || []);
      setReturnOrders(data);
    } catch (err) {
      console.warn('Failed to load return orders via dedicated route, falling back:', err);
      try {
        const fallbackRes = await shipmentAPI.getShipments();
        const shipments = fallbackRes.data || [];
        const returns = shipments.filter(s => 
          (s.returnStatus && s.returnStatus !== 'None') || 
          ['Return Requested', 'Return In Transit', 'Returned & Refunded'].includes(s.status)
        );
        setReturnOrders(returns);
      } catch (e) {
        setReturnOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAwb(id);
    setTimeout(() => setCopiedAwb(null), 2500);
  };

  const openAssignModal = (order, mode = 'return') => {
    setAssignModalOrder(order);
    setAssignMode(mode);
    setCarrierSlug('delhivery');
    setCarrierName('Delhivery Express');
    const prefix = mode === 'replacement' ? 'REP-DEL' : 'REV-DEL';
    setTrackingId(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setCourierNotes('');
  };

  const handleCarrierChange = (slug) => {
    setCarrierSlug(slug);
    const names = {
      delhivery: 'Delhivery Express',
      bluedart: 'BlueDart Logistics',
      dtdc: 'DTDC Express',
      ekart: 'Ekart Logistics',
      shadowfax: 'Shadowfax',
      rapido: 'Rapido Parcel / Express',
      indiapost: 'India Post Speed Post',
      other: 'Custom Courier Partner'
    };
    setCarrierName(names[slug] || 'Delhivery Express');
    const prefix = assignMode === 'replacement' 
      ? `REP-${slug.toUpperCase().substring(0, 3)}` 
      : `REV-${slug.toUpperCase().substring(0, 3)}`;
    setTrackingId(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleConfirmAssignCourier = async (e) => {
    e.preventDefault();
    if (!assignModalOrder || !trackingId) {
      alert('Please provide a valid Tracking ID');
      return;
    }

    setActionLoading(true);
    try {
      if (assignMode === 'replacement') {
        const res = await shipmentAPI.approveReplacement(assignModalOrder.shipmentId, {
          carrierSlug,
          carrierName,
          trackingId: trackingId.trim()
        });
        const d = res.data || {};
        const pickupAwb  = d.pickupAwbCode  || d.shipment?.returnAwbCode || trackingId;
        const pickupName = d.pickupCarrierName || d.shipment?.returnCarrierName || carrierName;
        setAssignSuccessMsg(
          `✅ Reverse pickup scheduled for old item inspection!\n` +
          `🔄 Reverse Courier: ${pickupName} (AWB: ${pickupAwb})\n` +
          `When the defective item is inspected at your warehouse, you will dispatch the new replacement item.`
        );
      } else {
        await shipmentAPI.approveReturn(assignModalOrder.shipmentId, {
          carrierSlug,
          carrierName,
          trackingId: trackingId.trim(),
          notes: courierNotes
        });
        setAssignSuccessMsg(`Reverse courier ${carrierName} (ID: ${trackingId}) assigned! Buyer notified via In-App Notification and SMS.`);
      }

      setTimeout(() => setAssignSuccessMsg(''), 6000);
      setAssignModalOrder(null);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign courier partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoApproveReturn = async (shipmentId) => {
    setActionLoading(true);
    try {
      const res = await shipmentAPI.approveReturn(shipmentId, {
        carrierSlug: 'auto'
      });
      const data = res.data || {};
      const carrier = data.cheapestCarrier || data.shipment?.returnCarrierName || 'Cheapest Courier Partner';
      const awb = data.trackingId || data.shipment?.returnAwbCode || '';
      const rate = data.shippingRate || data.shipment?.returnShippingRate || 38;
      const windowStr = data.pickupWindow || data.shipment?.returnPickupWindow || 'Tomorrow, 10:00 AM – 2:00 PM';
      const savings = data.estimatedSavings || data.shipment?.returnEstimatedSavings || 0;

      setAssignSuccessMsg(
        `⚡ Reverse Courier Auto-Booked! ${carrier} selected at ₹${rate}${savings > 0 ? ` (Saved ₹${savings})` : ''}. Reverse AWB: ${awb}. Pickup Scheduled: ${windowStr}. Buyer notified via SMS.`
      );
      setTimeout(() => setAssignSuccessMsg(''), 8000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to auto-book reverse courier.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoApproveReplacement = async (shipmentId) => {
    setActionLoading(true);
    try {
      const res = await shipmentAPI.approveReplacement(shipmentId, {
        carrierSlug: 'auto'
      });
      const data = res.data || {};
      const revCarrier  = data.pickupCarrierName || data.shipment?.returnCarrierName || 'Cheapest Courier';
      const revAwb      = data.pickupAwbCode     || data.shipment?.returnAwbCode     || '';
      const pickupWin   = data.pickupWindow      || data.shipment?.returnPickupWindow || 'Tomorrow, 10:00 AM – 2:00 PM';
      setAssignSuccessMsg(
        `⚡ Reverse pickup auto-booked for defective item!\n` +
        `🔄 Old item pickup ← Buyer: ${revCarrier} (${revAwb}) — Pickup window: ${pickupWin}\n` +
        `Once the old item is received and inspected at your warehouse, you will dispatch the fresh replacement.`
      );
      setTimeout(() => setAssignSuccessMsg(''), 10000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to auto-book replacement courier.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfferDiscount = async (shipmentId, totalAmount) => {
    const discountAmount = Number(discountInputs[shipmentId]);
    if (!discountAmount || discountAmount <= 0) {
      alert('Please enter a valid discount amount greater than ₹0');
      return;
    }
    if (discountAmount >= totalAmount) {
      alert(`Discount amount must be less than the total parcel value of ₹${totalAmount}`);
      return;
    }

    setActionLoading(true);
    try {
      await shipmentAPI.offerDiscount(shipmentId, discountAmount);
      setAssignSuccessMsg(`Discount offer of ₹${discountAmount} sent to buyer! The buyer has 15 hours to respond. Auto-completion unlocks if unanswered.`);
      setTimeout(() => setAssignSuccessMsg(''), 6000);
      setDiscountInputs(prev => ({ ...prev, [shipmentId]: '' }));
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to offer discount.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondDiscount = async (shipmentId, accepted) => {
    setActionLoading(true);
    try {
      await shipmentAPI.respondDiscount(shipmentId, accepted);
      setAssignSuccessMsg(
        accepted 
          ? 'Defect discount offer accepted! Discount has been credited to your wallet, and balance released to seller.'
          : 'Discount offer rejected. Reverse courier has been auto-booked to collect the product. Full refund will be disbursed once the seller receives the parcel.'
      );
      setTimeout(() => setAssignSuccessMsg(''), 6000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond to discount offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseReturnRequest = async (shipmentId) => {
    if (!window.confirm('Withdraw this return request? Your return request will be closed and parcel will remain confirmed.')) return;
    setActionLoading(true);
    try {
      await shipmentAPI.closeReturnRequest(shipmentId);
      setAssignSuccessMsg('Return request withdrawn successfully.');
      setTimeout(() => setAssignSuccessMsg(''), 5000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReplacement = async (shipmentId) => {
    if (!window.confirm('Reject replacement request? The buyer will automatically receive a 100% full refund for the order.')) return;
    setActionLoading(true);
    try {
      await shipmentAPI.rejectReplacement(shipmentId, 'Supplier out of replacement stock');
      setAssignSuccessMsg('Replacement rejected. Full 100% refund auto-issued to buyer wallet.');
      setTimeout(() => setAssignSuccessMsg(''), 6000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject replacement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchReplacement = async (shipmentId) => {
    if (!window.confirm(`⚡ Fast-Track Dispatch on Pickup Scan for ${shipmentId}?\n\nReverse courier has initiated or scanned pickup of the defective item from the buyer's doorstep.\n\nDispatching now cuts replacement turnaround from 10 days to 3 days! This will automatically generate a fresh "Replacement In-Box QR Code" and SMS OTP for buyer delivery verification.`)) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.dispatchReplacement(shipmentId, { carrierSlug: 'auto' });
      const data = res.data || {};
      setAssignSuccessMsg(`✅ Fast-Track Replacement dispatched via ${data.replacementCarrierName || 'Courier'} (AWB: ${data.replacementAwbCode})! Fresh Replacement In-Box QR Label generated.`);
      setTimeout(() => setAssignSuccessMsg(''), 8000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch replacement item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReplacementDelivery = async (shipmentId) => {
    if (!window.confirm(`Confirm receipt of replacement parcel for ${shipmentId}?\n\nThis will safely release the order payment to the seller and complete the replacement order.`)) return;
    setActionLoading(true);
    try {
      await shipmentAPI.confirmReplacementDelivery(shipmentId);
      setAssignSuccessMsg(`🎉 Replacement item confirmed! Order funds released to seller and order completed.`);
      setTimeout(() => setAssignSuccessMsg(''), 8000);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm replacement delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceived = async (shipmentId) => {
    const order = returnOrders.find(o => o.shipmentId === shipmentId);
    const revCharge = order?.returnShippingRate || 55;
    const confirmMsg = `Confirm return package receipt for ${shipmentId}?\n\n• Buyer will receive 100% full order refund.\n• Reverse courier shipping fee (₹${revCharge}) will be charged to your seller wallet.`;
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.confirmReturnReceived(shipmentId);
      const data = res.data?.refundSummary || {};
      const charged = data.reverseShippingChargedToSeller || revCharge;
      alert(`✅ Return received and settled!\n\n• 100% principal refunded to buyer.\n• Reverse courier fee (₹${charged}) debited from your seller wallet.`);
      fetchReturnOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm return received.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalReturns = returnOrders.length;
  const pendingRequests = returnOrders.filter(o => o.returnStatus === 'Requested' || o.status === 'Return Requested').length;
  const inTransitReturns = returnOrders.filter(o => o.returnStatus === 'In Return Transit' || o.status === 'Return In Transit').length;
  const completedReturns = returnOrders.filter(o => o.returnStatus === 'Completed' || o.status === 'Returned & Refunded').length;
  const totalReturnValue = returnOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Filtered orders
  const filteredOrders = returnOrders.filter(order => {
    const statusMatches = 
      activeFilter === 'all' ? true :
      activeFilter === 'requested' ? (order.returnStatus === 'Requested' || order.status === 'Return Requested') :
      activeFilter === 'transit' ? (order.returnStatus === 'In Return Transit' || order.status === 'Return In Transit') :
      activeFilter === 'completed' ? (order.returnStatus === 'Completed' || order.status === 'Returned & Refunded') : true;

    const searchMatches = searchQuery === '' || 
      (order.shipmentId && order.shipmentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.receiverName && order.receiverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.receiverPhone && order.receiverPhone.includes(searchQuery)) ||
      (order.awbCode && order.awbCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.returnAwbCode && order.returnAwbCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatches && searchMatches;
  });

  return (
    <div className="p-4 sm:p-7 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ── Top Hero Header ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isSupplier ? 'Reverse Logistics & Returns' : 'Return Orders & Tracking'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              {isSupplier 
                ? 'Review return requests, auto-dispatch reverse couriers, and inspect verified items before refund release.'
                : 'Monitor reverse pickup status, courier tracking, replacement dispatches, and order refunds.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchReturnOrders}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{loading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Success Alert Banner ────────────────────────────────────── */}
      {assignSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="whitespace-pre-line leading-relaxed">{assignSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAssignSuccessMsg('')}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Modern Bento Metric Strip ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Returns */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Returns
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{totalReturns}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              ₹{totalReturnValue.toLocaleString('en-IN')} total return value
            </p>
          </div>
        </div>

        {/* Pending Action */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
          pendingRequests > 0 
            ? 'bg-amber-50/40 border-amber-200/90' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              pendingRequests > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Needs Action
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pendingRequests > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className={`text-2xl font-black font-mono tracking-tight ${
              pendingRequests > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}>
              {pendingRequests}
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${
              pendingRequests > 0 ? 'text-amber-700' : 'text-slate-500'
            }`}>
              {isSupplier ? 'Awaiting courier / discount offer' : 'Waiting for seller resolution'}
            </p>
          </div>
        </div>

        {/* In Return Transit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              In Transit
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{inTransitReturns}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Pickup en route or collected</p>
          </div>
        </div>

        {/* Completed & Settled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{completedReturns}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Refunded or exchange complete</p>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ────────────────────────────────────── */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Orders', count: totalReturns },
            { id: 'requested', label: 'Pending', count: pendingRequests, highlight: pendingRequests > 0 },
            { id: 'transit', label: 'In Transit', count: inTransitReturns },
            { id: 'completed', label: 'Resolved', count: completedReturns }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeFilter === tab.id
                  ? 'bg-slate-100 text-slate-800'
                  : tab.highlight ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-200/80 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ID, customer, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Orders List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading return requests...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Return Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {activeFilter !== 'all' 
              ? `There are no returns currently matching the "${activeFilter}" filter.`
              : isSupplier 
                ? 'No return requests have been submitted for your shipments. When a buyer requests a return, it will appear here.'
                : 'You have not submitted any return requests.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isRequested = order.returnStatus === 'Requested' || order.status === 'Return Requested';
            const isTransit = order.returnStatus === 'In Return Transit' || order.status === 'Return In Transit';
            const isCompleted = order.returnStatus === 'Completed' || order.status === 'Returned & Refunded';

            // Stage 1 to 4 calculation
            const currentStage = isCompleted ? 4 : isTransit ? 3 : (order.returnAwbCode || order.returnCarrierSlug) ? 2 : 1;
            
            const stages = [
              { label: 'Requested', done: currentStage >= 1, active: currentStage === 1 },
              { label: 'Courier Assigned', done: currentStage >= 2, active: currentStage === 2 },
              { label: 'In Return Transit', done: currentStage >= 3, active: currentStage === 3 },
              { label: 'Settled & Refunded', done: currentStage >= 4, active: currentStage === 4 }
            ];

            return (
              <div 
                key={order._id || order.shipmentId}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 space-y-5"
              >
                {/* ── Top Header Row ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-black text-slate-900 font-mono tracking-tight bg-slate-100 px-2.5 py-1 rounded-xl">
                      {order.shipmentId}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                      isRequested ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                      isTransit ? 'bg-indigo-50 text-indigo-900 border border-indigo-200' :
                      'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isRequested ? 'bg-amber-500 animate-pulse' :
                        isTransit ? 'bg-indigo-600 animate-pulse' :
                        'bg-emerald-500'
                      }`} />
                      <span>{order.returnStatus || order.status}</span>
                    </span>

                    {/* Return Category Pill */}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {order.returnType === 'replacement' && 'Replacement Exchange'}
                      {order.returnType === 'partial_discount' && 'Defect Discount'}
                      {(!order.returnType || order.returnType === 'full_refund') && 'Full Return & Refund'}
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      • {order.city || 'India'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:text-right">
                    <span className="text-xs text-slate-400 font-medium">Order Value:</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{order.amount ? order.amount.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>

                {/* ── Sleek Visual Return Stepper ──────────────────────── */}
                <div className="bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {stages.map((st, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-full flex items-center mb-1.5">
                          <div className={`h-1 flex-1 rounded-full ${
                            i === 0 ? 'bg-transparent' : st.done ? 'bg-indigo-600' : 'bg-slate-200'
                          }`} />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                            st.done 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}>
                            {st.done ? '✓' : i + 1}
                          </div>
                          <div className={`h-1 flex-1 rounded-full ${
                            i === 3 ? 'bg-transparent' : currentStage > i + 1 ? 'bg-indigo-600' : 'bg-slate-200'
                          }`} />
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold truncate max-w-full ${
                          st.active ? 'text-indigo-900 font-extrabold' : st.done ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Order Meta Info Grid ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isSupplier ? 'Buyer Customer' : 'Supplier'}
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">{order.receiverName}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{order.receiverPhone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {order.returnAwbCode ? 'Reverse Courier' : order.replacementAwbCode ? 'Replacement Courier' : 'Carrier'}
                    </span>
                    <p className="font-bold text-indigo-900 capitalize mt-0.5">
                      {order.replacementCarrierName || order.returnCarrierName || (order.returnCarrierSlug ? order.returnCarrierSlug.toUpperCase() + ' Express' : (order.carrierSlug || 'Delhivery'))}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-800 font-mono font-bold">
                        {order.returnAwbCode ? order.returnAwbCode : order.replacementAwbCode ? order.replacementAwbCode : (order.awbCode || 'Pending Assignment')}
                      </p>
                      {(order.returnAwbCode || order.replacementAwbCode) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.returnAwbCode || order.replacementAwbCode, order.shipmentId)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="Copy AWB Code"
                        >
                          {copiedAwb === order.shipmentId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Return Reason</span>
                    <p className="font-bold text-slate-800 mt-0.5 line-clamp-1">
                      {order.returnReason || 'Product return requested'}
                    </p>
                    {order.returnRequestedAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.returnRequestedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Scheduled Reverse Pickup Banner ─────────────────── */}
                {(order.returnPickupWindow || order.returnShippingRate > 0 || order.returnAutoBooked) && (
                  <div className="px-4 py-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-800">
                        Doorstep reverse pickup: <strong className="text-amber-950 font-bold">{order.returnPickupWindow || 'Scheduled'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.returnShippingRate > 0 && (
                        <span className="text-slate-600 font-medium flex items-center gap-1.5">
                          Reverse Freight: <strong className="text-slate-900 font-mono">₹{order.returnShippingRate}</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            order.returnShippingChargeStatus === 'Deducted'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {order.returnShippingChargeStatus === 'Deducted' ? 'Deducted from Seller' : 'Charged to Seller'}
                          </span>
                        </span>
                      )}
                      {order.returnEstimatedSavings > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                          Saved ₹{order.returnEstimatedSavings}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Defect Evidence & Partial Refund Panel ───────────── */}
                {order.returnType === 'partial_discount' && (
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 flex flex-col sm:flex-row items-start gap-4">
                    {order.defectPhotoUrl && (
                      <div className="shrink-0">
                        <div 
                          onClick={() => setPreviewPhotoModal({ isOpen: true, url: order.defectPhotoUrl, title: `Defect Photo — ${order.shipmentId}` })}
                          className="w-20 h-20 rounded-2xl overflow-hidden border border-teal-200 bg-white cursor-pointer relative group shadow-xs"
                          title="Click to view full photo"
                        >
                          <img loading="lazy" src={order.defectPhotoUrl} alt="Defect Evidence" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-teal-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-teal-950">
                        <Tag className="w-4 h-4 text-teal-700" />
                        <span>Defect Discount &amp; Settlement Option</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        <span className="text-slate-400 font-bold">Buyer Note:</span> {order.defectDescription || 'Customer reported minor defect and requested discount offer.'}
                      </p>

                      {order.discountOfferedAmount > 0 && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-teal-200/60">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Offered Discount:</span>
                            <span className="font-black text-teal-900 font-mono text-sm">₹{order.discountOfferedAmount}</span>
                            <span className="text-[11px] text-slate-400">(Buyer keeps product)</span>
                          </div>

                          {/* Buyer decision if pending */}
                          {!isSupplier && (order.discountAccepted !== true && order.discountAccepted !== false) && (() => {
                            const userDigits = (user?.phone || '').replace(/\D/g, '').slice(-10);
                            const orderRecvDigits = (order.receiverPhone || '').replace(/\D/g, '').slice(-10);
                            const isOrderRecipient = Boolean(
                              user?.role === 'Admin' ||
                              (order.receiverId && (String(order.receiverId) === String(user?._id) || String(order.receiverId?._id) === String(user?._id))) ||
                              (userDigits && orderRecvDigits && userDigits === orderRecvDigits)
                            );

                            if (!isOrderRecipient) {
                              return (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                                  Awaiting Buyer Response
                                </span>
                              );
                            }

                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRespondDiscount(order.shipmentId, true)}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  Accept ₹{order.discountOfferedAmount}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondDiscount(order.shipmentId, false)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-2 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                  Reject &amp; Full Refund
                                </button>
                              </div>
                            );
                          })()}

                          {/* Seller decision: 15h review window or auto-complete */}
                          {isSupplier && (order.discountAccepted !== true && order.discountAccepted !== false) && (() => {
                            const offeredAt = order.discountOfferedAt ? new Date(order.discountOfferedAt).getTime() : 0;
                            const elapsedMs = offeredAt > 0 ? (Date.now() - offeredAt) : 0;
                            const fifteenHoursMs = 15 * 60 * 60 * 1000;
                            const is15hPassed = offeredAt > 0 && elapsedMs >= fifteenHoursMs;
                            const remainingMs = Math.max(0, fifteenHoursMs - elapsedMs);
                            const totalMins = Math.ceil(remainingMs / (1000 * 60));
                            const remH = Math.floor(totalMins / 60);
                            const remM = totalMins % 60;

                            if (!is15hPassed) {
                              return (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Waiting for Buyer ({remH}h {remM}m left)</span>
                                </span>
                              );
                            } else {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Buyer has not responded within 15 hours.\n\nAuto-complete partial refund of ₹${order.discountOfferedAmount} to buyer now?`)) {
                                      handleRespondDiscount(order.shipmentId, true);
                                    }
                                  }}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>Auto-Complete ₹{order.discountOfferedAmount}</span>
                                </button>
                              );
                            }
                          })()}

                          {order.discountAccepted === true && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl">
                              ✓ Accepted (₹{order.discountBuyerWalletCredited || order.discountOfferedAmount} credited to wallet)
                            </span>
                          )}

                          {order.discountAccepted === false && (
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                              Rejected (100% Full Return Issued)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Action Buttons Footer ────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                    <PackageCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Verified Return Process</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Details Button */}
                    <button
                      onClick={() => onSelectShipment(order)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Details
                    </button>

                    {/* Track Reverse Journey Modal Button */}
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(order)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 bg-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Track Journey</span>
                    </button>

                    {/* BUYER SPECIFIC ACTIONS */}
                    {!isSupplier && (
                      <>
                        {isRequested && (
                          <button
                            type="button"
                            onClick={() => handleCloseReturnRequest(order.shipmentId)}
                            disabled={actionLoading}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                          >
                            Withdraw Return
                          </button>
                        )}
                        {order.returnType === 'replacement' && order.replacementItemDispatched && !order.replacementDelivered && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleConfirmReplacementDelivery(order.shipmentId)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Replacement Received</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* SUPPLIER SPECIFIC ACTIONS */}
                    {isSupplier && (
                      <>
                        {/* Option 1: Replacement Actions */}
                        {order.returnType === 'replacement' && isRequested && (
                          <>
                            <button
                              onClick={() => handleAutoApproveReplacement(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                              <span>Auto-Book Courier</span>
                            </button>
                            <button
                              onClick={() => openAssignModal(order, 'replacement')}
                              disabled={actionLoading}
                              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Manual Courier
                            </button>
                            <button
                              onClick={() => handleRejectReplacement(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-3.5 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Reject (Full Refund)
                            </button>
                          </>
                        )}

                        {/* Option 2: Partial Discount Actions */}
                        {order.returnType === 'partial_discount' && isRequested && (!order.discountOfferedAmount || order.discountOfferedAmount <= 0) && (
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                              <input
                                type="number"
                                placeholder="Discount"
                                value={discountInputs[order.shipmentId] || ''}
                                onChange={(e) => setDiscountInputs({ ...discountInputs, [order.shipmentId]: e.target.value })}
                                className="w-24 pl-5 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOfferDiscount(order.shipmentId, order.amount)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Offer Discount
                            </button>
                          </div>
                        )}

                        {/* Reverse Courier Booking: For Full Refund, Replacement, OR Partial Discount REJECTED by buyer */}
                        {((!order.returnType || order.returnType === 'full_refund') || (order.returnType === 'partial_discount' && order.discountAccepted === false)) && isRequested && (
                          <>
                            <button
                              onClick={() => handleAutoApproveReturn(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                              <span>Auto-Book Courier</span>
                            </button>
                            <button
                              onClick={() => openAssignModal(order, 'return')}
                              disabled={actionLoading}
                              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Manual Courier
                            </button>
                          </>
                        )}

                        {/* Replacement In-Transit: Inspect & Dispatch Replacement */}
                        {order.returnType === 'replacement' && (isTransit || order.status === 'Replacement In Transit') && (
                          !order.replacementItemDispatched ? (
                            <button
                              onClick={() => handleDispatchReplacement(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="Reverse pickup scanned at buyer doorstep — Fast-track dispatch replacement parcel now"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Fast-Track Dispatch (Pickup Scanned)</span>
                            </button>
                          ) : !order.replacementDelivered && !isCompleted ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Dispatched ({order.replacementAwbCode})</span>
                              </span>
                              {order.replacementQrToken && (
                                <button
                                  type="button"
                                  onClick={() => setReplacementQrModalOrder(order)}
                                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                  title="Print or view In-Box QR code label for replacement package"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Print QR Label</span>
                                </button>
                              )}
                            </div>
                          ) : null
                        )}

                        {/* Standard Return: Confirm Return Arrived & Refund */}
                        {(!order.returnType || order.returnType === 'full_refund') && isTransit && (
                          <button
                            onClick={() => handleConfirmReceived(order.shipmentId)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Arrived (Refund Buyer)</span>
                          </button>
                        )}
                      </>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{order.returnType === 'replacement' ? 'Settled & Replacement Complete' : 'Settled & Full Refund Issued'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TRACK REVERSE JOURNEY MODAL ────────────────────────────── */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setTrackingModalOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Return Journey Milestones
                </h3>
                <p className="text-xs text-slate-500 font-mono">#{trackingModalOrder.shipmentId} • {trackingModalOrder.city || 'India'}</p>
              </div>
            </div>

            {/* Courier & AWB Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reverse Carrier</span>
                <span className="font-bold text-slate-900 text-sm">
                  {trackingModalOrder.returnCarrierName || (trackingModalOrder.returnCarrierSlug ? trackingModalOrder.returnCarrierSlug.toUpperCase() + ' Express' : 'Carrier Pending')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tracking AWB</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-mono font-bold text-slate-900">
                    {trackingModalOrder.returnAwbCode || 'Awaiting Assignment'}
                  </span>
                  {trackingModalOrder.returnAwbCode && (
                    <button
                      onClick={() => copyToClipboard(trackingModalOrder.returnAwbCode, 'modal')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {copiedAwb === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reverse Milestone Timeline */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Milestone History</h4>
              <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {[
                  {
                    title: 'Return Requested',
                    desc: `Reason: "${trackingModalOrder.returnReason || 'Product return requested'}"`,
                    active: true,
                    time: trackingModalOrder.returnRequestedAt ? new Date(trackingModalOrder.returnRequestedAt).toLocaleDateString('en-IN') : 'Initiated',
                    color: 'bg-amber-500'
                  },
                  {
                    title: 'Reverse Courier Assigned',
                    desc: trackingModalOrder.returnAwbCode 
                      ? `${trackingModalOrder.returnCarrierName || 'Delhivery Express'} AWB: ${trackingModalOrder.returnAwbCode}`
                      : 'Pending courier partner assignment.',
                    active: Boolean(trackingModalOrder.returnAwbCode || trackingModalOrder.returnStatus === 'In Return Transit' || trackingModalOrder.returnStatus === 'Completed'),
                    time: trackingModalOrder.returnApprovedAt ? new Date(trackingModalOrder.returnApprovedAt).toLocaleDateString('en-IN') : 'Pending',
                    color: 'bg-indigo-600'
                  },
                  {
                    title: 'In Return Transit',
                    desc: trackingModalOrder.returnStatus === 'In Return Transit' || trackingModalOrder.returnStatus === 'Completed'
                      ? 'Package collected and en route to merchant warehouse.'
                      : 'Courier assigned for home pickup.',
                    active: Boolean(trackingModalOrder.returnStatus === 'In Return Transit' || trackingModalOrder.returnStatus === 'Completed'),
                    time: trackingModalOrder.returnStatus === 'In Return Transit' ? 'In Transit' : 'Scheduled',
                    color: 'bg-indigo-600'
                  },
                  {
                    title: 'Return Received & Refunded',
                    desc: trackingModalOrder.returnStatus === 'Completed' || trackingModalOrder.status === 'Returned & Refunded'
                      ? `Parcel received. 100% Order Amount (₹${trackingModalOrder.amount}) refunded to buyer.`
                      : 'Refund auto-issues upon warehouse receipt confirmation.',
                    active: Boolean(trackingModalOrder.returnStatus === 'Completed' || trackingModalOrder.status === 'Returned & Refunded'),
                    time: trackingModalOrder.returnStatus === 'Completed' ? 'Completed' : 'Pending',
                    color: 'bg-emerald-600'
                  }
                ].map((m, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition ${
                      m.active ? `${m.color} text-white shadow-2xs` : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {m.active ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${m.active ? 'text-slate-900' : 'text-slate-400'}`}>{m.title}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN REVERSE COURIER PARTNER MODAL ────────────────────── */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setAssignModalOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {assignMode === 'replacement' ? 'Assign Replacement Courier' : 'Assign Reverse Courier'}
                </h3>
                <p className="text-xs text-slate-500">#{assignModalOrder.shipmentId} • Customer: {assignModalOrder.receiverName}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-800">
                  {assignMode === 'replacement' ? 'Exchange: Replacement Unit' : 'Return Reason:'}
                </span>
                <span className="font-mono text-emerald-800 font-bold">₹{assignModalOrder.amount} Held</span>
              </div>
              <p className="text-slate-600">
                {assignMode === 'replacement'
                  ? 'Dispatch a new parcel to the buyer. Upon receipt confirmation, order payment will release to your wallet.'
                  : assignModalOrder.returnReason || 'Buyer requested return within verification window.'}
              </p>
            </div>

            {/* 1-Click Auto-Book Option */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-amber-950 font-bold">
                  Auto-select lowest rate courier?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (assignMode === 'replacement') {
                    handleAutoApproveReplacement(assignModalOrder.shipmentId);
                  } else {
                    handleAutoApproveReturn(assignModalOrder.shipmentId);
                  }
                  setAssignModalOrder(null);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                Auto-Book
              </button>
            </div>

            {/* Assign Form */}
            <form onSubmit={handleConfirmAssignCourier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Courier Partner
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { slug: 'delhivery', name: 'Delhivery' },
                    { slug: 'rapido', name: 'Rapido' },
                    { slug: 'bluedart', name: 'BlueDart' },
                    { slug: 'dtdc', name: 'DTDC' },
                    { slug: 'ekart', name: 'Ekart' },
                    { slug: 'shadowfax', name: 'Shadowfax' },
                    { slug: 'indiapost', name: 'India Post' },
                  ].map(c => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => handleCarrierChange(c.slug)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        carrierSlug === c.slug
                          ? 'bg-indigo-600 border-transparent text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {assignMode === 'replacement' ? 'Replacement Tracking ID / AWB' : 'Reverse Tracking ID / AWB'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = assignMode === 'replacement' 
                        ? `REP-${carrierSlug.toUpperCase().substring(0, 3)}` 
                        : `REV-${carrierSlug.toUpperCase().substring(0, 3)}`;
                      setTrackingId(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder={assignMode === 'replacement' ? 'e.g. REP-DEL-84920412' : 'e.g. REV-DEL-84920412'}
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {assignMode === 'replacement' ? 'Dispatch Instructions (Optional)' : 'Pickup Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={assignMode === 'replacement' ? 'e.g. Dispatched sealed replacement unit' : 'e.g. Keep product box ready for courier agent'}
                  value={courierNotes}
                  onChange={(e) => setCourierNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{assignMode === 'replacement' ? 'Dispatch Replacement' : 'Confirm Assignment'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox / Full Photo View Modal ──────────────────────── */}
      {previewPhotoModal.isOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewPhotoModal({ isOpen: false, url: '', title: '' })}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs truncate max-w-md">{previewPhotoModal.title || 'Full Photo View'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal({ isOpen: false, url: '', title: '' })}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[300px]">
              <img 
                loading="lazy" 
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title || 'Full Evidence View'}
                className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── REPLACEMENT IN-BOX QR LABEL MODAL ──────────────────────── */}
      {replacementQrModalOrder && (() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
        const repQrUrl = `${origin}/qr-confirm/${replacementQrModalOrder.replacementQrToken}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setReplacementQrModalOrder(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Replacement In-Box QR Label</h3>
                  <p className="text-[11px] text-slate-500 font-mono">#{replacementQrModalOrder.shipmentId} • AWB: {replacementQrModalOrder.replacementAwbCode || 'Auto'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Seller Instructions:</span> Print this QR label and place it <strong>inside the replacement package</strong>. When buyer receives and unboxes, they scan this QR to verify condition via SMS OTP and instantly release your order funds.
              </div>

              <div id="replacement-qr-printable" className="flex flex-col items-center gap-3 p-5 border-2 border-dashed border-indigo-200 rounded-2xl bg-slate-50/50 text-center">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SecureKaro — Replacement Delivery Sign-Off</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <QRCodeSVG
                    value={repQrUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-900">Scan to Verify Replacement Parcel</p>
                  <p className="text-[11px] text-slate-500">{replacementQrModalOrder.description || 'Replacement Parcel'}</p>
                  <p className="text-xs font-black text-indigo-700 mt-1 font-mono">
                    AWB: {replacementQrModalOrder.replacementAwbCode} ({replacementQrModalOrder.replacementCarrierName || 'Express Courier'})
                  </p>
                </div>

                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Receiver scans QR upon unboxing &amp; verifies SMS OTP<br />
                  Verified Delivery Confirmation • Protected by SecureKaro
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Label</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(repQrUrl);
                    setReplacementQrCopied(true);
                    setTimeout(() => setReplacementQrCopied(false), 2500);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {replacementQrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{replacementQrCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={repQrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Test scan in browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
