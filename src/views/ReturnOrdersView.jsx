import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  Package, Truck, ArrowRight, RefreshCw, Filter, Search, ChevronRight, ExternalLink, X, Send, MessageSquare, Tag, Copy, Check, MapPin, Radio, Zap, Sparkles, Camera, Eye, ZoomIn, QrCode, Printer
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
        `⚡ Reverse Courier Auto-Booked! ${carrier} selected at lowest delivery rate ₹${rate}${savings > 0 ? ` (Saved ₹${savings})` : ''}. Reverse AWB: ${awb}. Pickup Scheduled: ${windowStr}. Buyer notified via SMS.`
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
    if (!window.confirm('Reject replacement request? The buyer will automatically receive a 100% full refund from escrow.')) return;
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
    if (!window.confirm(`Confirm receipt of replacement parcel for ${shipmentId}?\n\nThis will safely release the escrow payment to the seller and complete the replacement order.`)) return;
    setActionLoading(true);
    try {
      await shipmentAPI.confirmReplacementDelivery(shipmentId);
      setAssignSuccessMsg(`🎉 Replacement item confirmed! Escrow funds released to seller and order completed.`);
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
    const confirmMsg = `Confirm return package receipt for ${shipmentId}?\n\n• Buyer will receive 100% full escrow refund.\n• Reverse courier shipping fee (₹${revCharge}) will be charged to your seller wallet.`;
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.confirmReturnReceived(shipmentId);
      const data = res.data?.refundSummary || {};
      const charged = data.reverseShippingChargedToSeller || revCharge;
      alert(`✅ Return received and settled!\n\n• 100% escrow principal refunded to buyer.\n• Reverse courier fee (₹${charged}) debited from your seller wallet.`);
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
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 flex items-center justify-center font-bold shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isSupplier ? 'Return Orders & Reverse Logistics' : 'Return Orders & Tracking'}
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              {isSupplier 
                ? 'Manage buyer returns, assign reverse couriers, and inspect escrow-protected inventory.'
                : 'Track return shipments, courier pickups, discount proposals, and escrow refunds.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchReturnOrders}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 bg-white text-slate-700 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : 'text-slate-600'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {assignSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{assignSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAssignSuccessMsg('')}
            className="p-1 rounded text-emerald-600 hover:bg-emerald-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Colorful KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Returns - Indigo */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-white p-5 rounded-2xl border border-indigo-100/90 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 space-y-2 group cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Total Returns
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-2xs">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-950 font-mono">{totalReturns}</p>
            <p className="text-[11px] text-indigo-600/90 font-medium">₹{totalReturnValue.toLocaleString('en-IN')} escrow value</p>
          </div>
        </div>

        {/* Pending Action - Warm Amber */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-white p-5 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all duration-200 space-y-2 group cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Action
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-950 font-mono">{pendingRequests}</p>
            <p className="text-[11px] text-amber-700/90 font-medium">
              {isSupplier ? 'Awaiting courier / offer' : 'Awaiting seller resolution'}
            </p>
          </div>
        </div>

        {/* In Return Transit - Vibrant Blue */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-white p-5 rounded-2xl border border-blue-200/80 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 space-y-2 group cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              In Return Transit
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-950 font-mono">{inTransitReturns}</p>
            <p className="text-[11px] text-blue-700/90 font-medium">Pickup active or en route</p>
          </div>
        </div>

        {/* Completed - Fresh Emerald */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 space-y-2 group cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-950 font-mono">{completedReturns}</p>
            <p className="text-[11px] text-emerald-700/90 font-medium">Refunded &amp; settled</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-white/60'
            }`}
          >
            All ({totalReturns})
          </button>
          <button
            onClick={() => setActiveFilter('requested')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'requested' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
            }`}
          >
            Pending ({pendingRequests})
          </button>
          <button
            onClick={() => setActiveFilter('transit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'transit' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            In Transit ({inTransitReturns})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'completed' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
            }`}
          >
            Completed ({completedReturns})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search return orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading return requests...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Return Orders</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter !== 'all' 
              ? `There are no returns currently matching the "${activeFilter}" filter.`
              : isSupplier 
                ? 'No return requests have been submitted for your shipments.'
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
            const stageLabel = isCompleted 
              ? 'Stage 4/4 • Completed & Refunded' 
              : isTransit 
              ? 'Stage 3/4 • In Return Transit' 
              : (order.returnAwbCode || order.returnCarrierSlug) 
              ? 'Stage 2/4 • Courier Assigned' 
              : 'Stage 1/4 • Return Requested';

            return (
              <div 
                key={order._id || order.shipmentId}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition space-y-4 ${
                  isRequested ? 'border-slate-200/90 border-l-4 border-l-amber-500' :
                  isTransit ? 'border-slate-200/90 border-l-4 border-l-blue-500' :
                  'border-slate-200/90 border-l-4 border-l-emerald-500'
                }`}
              >
                {/* Header: ID, Status Pill, Type, Escrow Value */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">
                      {order.shipmentId}
                    </span>

                    {/* Status Pill */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      isRequested ? 'bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs' :
                      isTransit ? 'bg-blue-50 text-blue-800 border border-blue-300/80 shadow-2xs' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isRequested ? 'bg-amber-500 animate-pulse' :
                        isTransit ? 'bg-blue-500 animate-pulse' :
                        'bg-emerald-500'
                      }`} />
                      <span>{order.returnStatus || order.status}</span>
                    </span>

                    {/* Return Type Tag */}
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                      order.returnType === 'replacement' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' :
                      order.returnType === 'partial_discount' ? 'bg-teal-50 text-teal-700 border-teal-200/80' :
                      'bg-violet-50 text-violet-700 border-violet-200/80'
                    }`}>
                      {order.returnType === 'replacement' && 'Replacement Exchange'}
                      {order.returnType === 'partial_discount' && 'Defect Discount'}
                      {(!order.returnType || order.returnType === 'full_refund') && 'Full Refund'}
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      • {order.city || 'India'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:text-right">
                    <span className="text-[11px] text-slate-500 font-medium">Escrow Value:</span>
                    <span className="text-base font-bold text-emerald-700 font-mono">
                      ₹{order.amount ? order.amount.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>

                {/* Minimal Slim Progress Indicator with Color Stage Accents */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                      <Truck className={`w-3.5 h-3.5 ${
                        currentStage === 4 ? 'text-emerald-500' :
                        currentStage === 3 ? 'text-blue-500' :
                        currentStage === 2 ? 'text-indigo-500' : 'text-amber-500'
                      }`} />
                      <span>{stageLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(order)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <span>View Steps</span>
                      <ChevronRight className="w-3 h-3 text-indigo-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className={`h-1.5 rounded-full transition ${currentStage >= 1 ? 'bg-amber-500 shadow-2xs' : 'bg-slate-100'}`} />
                    <div className={`h-1.5 rounded-full transition ${currentStage >= 2 ? 'bg-indigo-500 shadow-2xs' : 'bg-slate-100'}`} />
                    <div className={`h-1.5 rounded-full transition ${currentStage >= 3 ? 'bg-blue-500 shadow-2xs' : 'bg-slate-100'}`} />
                    <div className={`h-1.5 rounded-full transition ${currentStage >= 4 ? 'bg-emerald-500 shadow-2xs' : 'bg-slate-100'}`} />
                  </div>
                </div>

                {/* Details Grid (Clean 3-column layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {isSupplier ? 'Buyer' : 'Seller'}
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5">{order.receiverName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{order.receiverPhone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {order.returnAwbCode ? 'Reverse Courier' : order.replacementAwbCode ? 'Replacement Courier' : 'Carrier'}
                    </span>
                    <p className="font-semibold text-indigo-900 capitalize mt-0.5">
                      {order.replacementCarrierName || order.returnCarrierName || (order.returnCarrierSlug ? order.returnCarrierSlug.toUpperCase() + ' Express' : (order.carrierSlug || 'Delhivery'))}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-700 font-mono font-bold">
                        {order.returnAwbCode ? order.returnAwbCode : order.replacementAwbCode ? order.replacementAwbCode : (order.awbCode || 'Pending Assignment')}
                      </p>
                      {(order.returnAwbCode || order.replacementAwbCode) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.returnAwbCode || order.replacementAwbCode, order.shipmentId)}
                          className="p-0.5 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          title="Copy AWB Code"
                        >
                          {copiedAwb === order.shipmentId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Return Reason</span>
                    <p className="font-medium text-slate-700 mt-0.5 line-clamp-1">
                      {order.returnReason || 'Return requested within window'}
                    </p>
                    {order.returnRequestedAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.returnRequestedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto-Booked Pickup Status Banner (Warm & clear) */}
                {(order.returnPickupWindow || order.returnShippingRate > 0 || order.returnAutoBooked) && (
                  <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/80 border border-amber-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-slate-800">
                        Reverse pickup scheduled: <strong className="text-amber-950 font-bold">{order.returnPickupWindow || 'Pending slot'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.returnShippingRate > 0 && (
                        <span className="text-slate-600 font-medium flex items-center gap-1.5">
                          Reverse Freight: <strong className="text-slate-900 font-mono">₹{order.returnShippingRate}</strong>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            order.returnShippingChargeStatus === 'Deducted'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {order.returnShippingChargeStatus === 'Deducted' ? 'Deducted from Seller' : 'Charged to Seller'}
                          </span>
                        </span>
                      )}
                      {order.returnEstimatedSavings > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          Saved ₹{order.returnEstimatedSavings}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Defect Photo & Evidence Section (Option 2 - Fresh Teal/Emerald layout) */}
                {order.returnType === 'partial_discount' && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50/60 via-white to-emerald-50/40 border border-teal-200/80 flex flex-col sm:flex-row items-start gap-3.5">
                    {order.defectPhotoUrl && (
                      <div className="shrink-0 space-y-1">
                        <div 
                          onClick={() => setPreviewPhotoModal({ isOpen: true, url: order.defectPhotoUrl, title: `Defect Evidence — ${order.shipmentId}` })}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-teal-200 bg-white cursor-pointer relative group shadow-2xs"
                          title="Click to view full photo"
                        >
                          <img src={order.defectPhotoUrl} alt="Defect Evidence" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-teal-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-teal-900">
                        <Tag className="w-3.5 h-3.5 text-teal-600" />
                        <span>Defect Discount &amp; Partial Refund</span>
                      </div>
                      <p className="text-slate-600">
                        <span className="text-slate-400 font-medium">Buyer note:</span> {order.defectDescription || 'No description provided'}
                      </p>

                      {order.discountOfferedAmount > 0 && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Offered Discount:</span>
                            <span className="font-bold text-teal-800 font-mono text-sm">₹{order.discountOfferedAmount}</span>
                            <span className="text-[11px] text-slate-400">(Item kept by buyer)</span>
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
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                  Awaiting Recipient Response
                                </span>
                              );
                            }

                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRespondDiscount(order.shipmentId, true)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  Accept ₹{order.discountOfferedAmount}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondDiscount(order.shipmentId, false)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl transition cursor-pointer"
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
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Awaiting Buyer Response ({remH}h {remM}m left)</span>
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
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>⚡ Auto-Complete ₹{order.discountOfferedAmount}</span>
                                </button>
                              );
                            }
                          })()}

                          {order.discountAccepted === true && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                              ✓ Accepted (₹{order.discountBuyerWalletCredited || order.discountOfferedAmount} credited to wallet)
                            </span>
                          )}

                          {order.discountAccepted === false && (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Rejected (100% Escrow refund issued)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons (Cohesive and Polished) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Protected by Escrow Vault</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Details Button */}
                    <button
                      onClick={() => onSelectShipment(order)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                    >
                      Details
                    </button>

                    {/* Track Reverse Journey Modal Button */}
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(order)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 bg-white text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-indigo-500" />
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
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                          >
                            Cancel Return
                          </button>
                        )}
                        {order.returnType === 'replacement' && order.replacementItemDispatched && !order.replacementDelivered && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleConfirmReplacementDelivery(order.shipmentId)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
                              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Auto-Book Courier</span>
                            </button>
                            <button
                              onClick={() => openAssignModal(order, 'replacement')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                            >
                              Manual Courier
                            </button>
                            <button
                              onClick={() => handleRejectReplacement(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                            >
                              Reject (Full Refund)
                            </button>
                          </>
                        )}

                        {/* Option 2: Partial Discount Actions */}
                        {order.returnType === 'partial_discount' && isRequested && (!order.discountOfferedAmount || order.discountOfferedAmount <= 0) && (
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs font-semibold text-slate-400">₹</span>
                              <input
                                type="number"
                                placeholder="Discount"
                                value={discountInputs[order.shipmentId] || ''}
                                onChange={(e) => setDiscountInputs({ ...discountInputs, [order.shipmentId]: e.target.value })}
                                className="w-24 pl-5 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOfferDiscount(order.shipmentId, order.amount)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
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
                              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Auto-Book Courier</span>
                            </button>
                            <button
                              onClick={() => openAssignModal(order, 'return')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                            >
                              Manual Courier
                            </button>
                          </>
                        )}

                        {/* Partial Discount Pending: Inform supplier that courier is locked until buyer decision or 15h inactivity */}
                        {order.returnType === 'partial_discount' && isRequested && order.discountAccepted !== false && (() => {
                          const offeredAt = order.discountOfferedAt ? new Date(order.discountOfferedAt).getTime() : 0;
                          const elapsedMs = offeredAt > 0 ? (Date.now() - offeredAt) : 0;
                          const fifteenHoursMs = 15 * 60 * 60 * 1000;
                          const is15hPassed = offeredAt > 0 && elapsedMs >= fifteenHoursMs;
                          const remainingMs = Math.max(0, fifteenHoursMs - elapsedMs);
                          const totalMins = Math.ceil(remainingMs / (1000 * 60));
                          const remH = Math.floor(totalMins / 60);
                          const remM = totalMins % 60;

                          if (Number(order.discountOfferedAmount) > 0) {
                            if (is15hPassed) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Buyer has not responded within 15 hours.\n\nAuto-complete partial refund of ₹${order.discountOfferedAmount} to buyer now?`)) {
                                      handleRespondDiscount(order.shipmentId, true);
                                    }
                                  }}
                                  disabled={actionLoading}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>Auto-Complete ₹{order.discountOfferedAmount} (15h Expired)</span>
                                </button>
                              );
                            }
                            return (
                              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Offer ₹{order.discountOfferedAmount} Sent — Buyer Window ({remH}h {remM}m left)</span>
                              </span>
                            );
                          }
                          return (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Offer Discount First</span>
                            </span>
                          );
                        })()}

                        {/* Replacement In-Transit: Inspect & Dispatch Replacement */}
                        {order.returnType === 'replacement' && (isTransit || order.status === 'Replacement In Transit') && (
                          !order.replacementItemDispatched ? (
                            <button
                              onClick={() => handleDispatchReplacement(order.shipmentId)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="Reverse pickup scanned at buyer doorstep — Fast-track dispatch replacement parcel now"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>⚡ Fast-Track Dispatch (Pickup Scanned)</span>
                            </button>
                          ) : !order.replacementDelivered && !isCompleted ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Dispatched (AWB: {order.replacementAwbCode})</span>
                              </span>
                              {order.replacementQrToken && (
                                <button
                                  type="button"
                                  onClick={() => setReplacementQrModalOrder(order)}
                                  className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Arrived (Refund Buyer)</span>
                          </button>
                        )}
                      </>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{order.returnType === 'replacement' ? 'Closed & Complete' : 'Closed & Refunded'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRACK REVERSE JOURNEY MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setTrackingModalOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-xs shadow-indigo-300">
                <RotateCcw className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Return Journey Milestones
                </h3>
                <p className="text-xs text-slate-500 font-mono">#{trackingModalOrder.shipmentId} • {trackingModalOrder.city || 'India'}</p>
              </div>
            </div>

            {/* Courier & AWB Banner */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/60 border border-indigo-100/90 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Reverse Carrier</span>
                <span className="font-bold text-slate-900">
                  {trackingModalOrder.returnCarrierName || (trackingModalOrder.returnCarrierSlug ? trackingModalOrder.returnCarrierSlug.toUpperCase() + ' Express' : 'Carrier Pending')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Tracking AWB</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-mono font-bold text-slate-800">
                    {trackingModalOrder.returnAwbCode || 'Awaiting Generation'}
                  </span>
                  {trackingModalOrder.returnAwbCode && (
                    <button
                      onClick={() => copyToClipboard(trackingModalOrder.returnAwbCode, 'modal')}
                      className="p-0.5 hover:bg-indigo-100 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    >
                      {copiedAwb === 'modal' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reverse Milestone Timeline with Stage Colors */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Milestones</h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
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
                    color: 'bg-blue-600'
                  },
                  {
                    title: 'Return Received & Refunded',
                    desc: trackingModalOrder.returnStatus === 'Completed' || trackingModalOrder.status === 'Returned & Refunded'
                      ? `Parcel received. 100% Escrow (₹${trackingModalOrder.amount}) credited to buyer wallet.`
                      : 'Escrow auto-refunds upon merchant receipt confirmation.',
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
                        <p className={`text-xs font-semibold ${m.active ? 'text-slate-900' : 'text-slate-400'}`}>{m.title}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN REVERSE COURIER PARTNER & TRACKING ID MODAL (SUPPLIER ONLY) */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setAssignModalOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-xs shadow-indigo-300">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {assignMode === 'replacement' ? 'Assign Replacement Courier' : 'Assign Reverse Courier'}
                </h3>
                <p className="text-xs text-slate-500">#{assignModalOrder.shipmentId} • Buyer: {assignModalOrder.receiverName}</p>
              </div>
            </div>

            {/* Return Request Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">
                  {assignMode === 'replacement' ? 'Exchange Type: Full Replacement' : 'Return Reason:'}
                </span>
                <span className="font-mono text-emerald-700 font-bold">₹{assignModalOrder.amount} Held</span>
              </div>
              <p className="text-slate-600">
                {assignMode === 'replacement'
                  ? 'Dispatch a new parcel to the buyer. Upon receipt confirmation, escrow funds will release to your wallet.'
                  : assignModalOrder.returnReason || 'Buyer requested return within escrow window.'}
              </p>
            </div>

            {/* 1-Click Auto-Book Option */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50/90 to-orange-50/60 border border-amber-200/90 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-amber-950 font-medium">
                  Auto-select lowest delivery rate?
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
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                Auto-Book
              </button>
            </div>

            {/* Assign Form */}
            <form onSubmit={handleConfirmAssignCourier} className="space-y-3.5">
              {/* Courier Partner Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
                        carrierSlug === c.slug
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                      }`}
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reverse or Replacement Tracking ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
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
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Pickup Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {assignMode === 'replacement' ? 'Dispatch Instructions (Optional)' : 'Pickup Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={assignMode === 'replacement' ? 'e.g. Dispatched sealed replacement unit' : 'e.g. Keep product box ready for courier agent'}
                  value={courierNotes}
                  onChange={(e) => setCourierNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Notification Notice */}
              <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2 text-[11px] text-indigo-900">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <p>
                  Buyer will be automatically notified via in-app alert and SMS with courier tracking details.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
      {/* Lightbox / Full Photo View Modal */}
      {previewPhotoModal.isOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewPhotoModal({ isOpen: false, url: '', title: '' })}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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

            {/* Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[300px]">
              <img
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title || 'Full Evidence View'}
                className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* REPLACEMENT IN-BOX QR LABEL MODAL */}
      {replacementQrModalOrder && (() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
        const repQrUrl = `${origin}/qr-confirm/${replacementQrModalOrder.replacementQrToken}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setReplacementQrModalOrder(null)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-200">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Replacement In-Box QR Label</h3>
                  <p className="text-[11px] text-slate-500 font-mono">#{replacementQrModalOrder.shipmentId} • AWB: {replacementQrModalOrder.replacementAwbCode || 'Auto'}</p>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl text-[11px] text-violet-900 leading-relaxed">
                <span className="font-bold">Instructions for Seller:</span> Print this QR label and stick it <strong>inside the replacement box</strong>. When the buyer opens the parcel, they scan this QR to receive a 6-digit SMS OTP, confirming good condition and releasing your escrow payout.
              </div>

              {/* Printable Area */}
              <div id="replacement-qr-printable" className="flex flex-col items-center gap-3 p-5 border-2 border-dashed border-violet-300 rounded-2xl bg-violet-50/30 text-center">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-violet-700 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SecureKaro — Replacement Delivery Sign-Off</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <QRCodeSVG
                    value={repQrUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#1e1b4b"
                  />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Scan to Verify Replacement Parcel</p>
                  <p className="text-[11px] text-slate-500">{replacementQrModalOrder.description || 'Replacement Parcel'}</p>
                  <p className="text-xs font-extrabold text-violet-700 mt-1 font-mono">
                    AWB: {replacementQrModalOrder.replacementAwbCode} ({replacementQrModalOrder.replacementCarrierName || 'Express Courier'})
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 break-all bg-white py-1 px-2 rounded-md border border-slate-200 mt-1">
                    {repQrUrl}
                  </p>
                </div>

                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Receiver scans QR upon opening &amp; verifies SMS OTP<br />
                  Unlocks Escrow Release to Seller • Protected by SecureKaro
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-violet-600/20"
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
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
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
