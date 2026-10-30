import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download, Plus, Box, CheckCircle2, Clock, AlertTriangle, QrCode, Camera, RotateCcw } from 'lucide-react';
import { shipmentAPI } from '../services/api';
import QrScannerModal from '../components/QrScannerModal';

export default function ShipmentsListView({ onSelectShipment, openNewShipmentModal, user, currentRole, isSupplier, onRepeatShipment }) {
  const isMerchant = isSupplier !== undefined 
    ? isSupplier 
    : (currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier'));

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Held' | 'Released' | 'Disputed'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [selectedShipmentForQr, setSelectedShipmentForQr] = useState(null);
  const rowsPerPage = 8;

  const handleQrScanSuccess = async ({ token, shipmentId: scannedId, rawText }) => {
    try {
      let targetShipment = null;
      if (token) {
        const res = await shipmentAPI.publicQrGetInfo(token);
        if (res.data?.shipmentId) {
          targetShipment = shipments.find(s => s.shipmentId === res.data.shipmentId) || res.data;
        }
      }
      if (!targetShipment && scannedId) {
        targetShipment = shipments.find(s => s.shipmentId === scannedId) || { shipmentId: scannedId };
      }
      if (targetShipment && onSelectShipment) {
        onSelectShipment(targetShipment);
      }
    } catch (e) {
      console.warn('QR scan match error in list:', e);
      if (scannedId && onSelectShipment) {
        onSelectShipment({ shipmentId: scannedId });
      }
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [isMerchant]); // re-fetch whenever role changes

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const role = isMerchant ? 'Supplier' : 'Receiver';
      const res = await shipmentAPI.getShipments(role);
      if (Array.isArray(res.data)) {
        setShipments(res.data);
      } else {
        setShipments([]);
      }
    } catch (err) {
      console.error('Error fetching shipments:', err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shipments.filter(item => {
    const matchesSearch = (item.shipmentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.receiverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' ||
                       (activeTab === 'Held' && (item.status === 'Awaiting Payment' || item.status === 'Pending Pickup' || item.status === 'In Transit')) ||
                       (activeTab === 'Released' && item.status === 'Released') ||
                       (activeTab === 'Returns' && ((item.returnStatus && item.returnStatus !== 'None') || item.status?.includes('Return') || item.returnAwbCode));
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="px-4 py-5 md:p-8 max-w-7xl mx-auto space-y-5 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isMerchant ? 'Shipment Management' : 'My Orders & Packages'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isMerchant 
              ? 'View, track, and manage all your delivery-protected parcel shipments.' 
              : 'Track your incoming parcels, delivery status, and protected order transactions.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Scan QR button for Buyers/Receivers */}
          {!isMerchant && (
            <button
              onClick={() => setShowQrScanner(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 transition inline-flex items-center gap-2 w-fit group active:scale-95"
            >
              <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Scan In-Box QR</span>
            </button>
          )}

          {/* Create Shipment button ONLY rendered for Merchants/Suppliers */}
          {isMerchant && openNewShipmentModal && (
            <button
              onClick={openNewShipmentModal}
              className="px-3.5 py-2 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5 w-fit active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Shipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold text-slate-600 overflow-x-auto no-scrollbar">
            {['All', 'Held', 'Released', 'Returns'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition text-xs ${activeTab === tab ? 'bg-white text-[#1E56E3] shadow-xs font-bold' : 'hover:text-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* ── MOBILE CARD LIST VIEW (block md:hidden) ── */}
        <div className="block md:hidden space-y-3">
          {paginated.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">
                {isMerchant ? 'No shipments found' : 'No orders or packages found'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMerchant 
                  ? 'Create a shipment to start tracking parcels with delivery protection.' 
                  : 'Any parcel shipments dispatched to your mobile number will appear here.'}
              </p>
            </div>
          ) : (
            paginated.map((item, idx) => (
              <div
                key={item.shipmentId || idx}
                onClick={() => onSelectShipment(item)}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition active:scale-[0.99] cursor-pointer space-y-2.5"
              >
                {/* Line 1: ID & Protection Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-[#1E56E3] tracking-tight">
                    {item.shipmentId}
                  </span>
                  <div>{renderProtectionBadge(item.status)}</div>
                </div>

                {/* Line 2: Recipient / Sender Name & Amount */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {item.receiverName || (isMerchant ? 'Buyer' : 'Merchant')}
                  </span>
                  <span className="font-black text-slate-900 text-sm shrink-0">
                    ₹{item.amount ? Number(item.amount).toLocaleString('en-IN') : '0'}
                  </span>
                </div>

                {/* Line 3: Route & Carrier */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="truncate">{item.city || 'Domestic Delivery'}</span>
                  <span className="text-slate-700 font-bold shrink-0 ml-2">
                    {item.carrierSlug === 'bluedart' ? 'Blue Dart' : (item.carrierSlug ? item.carrierSlug.charAt(0).toUpperCase() + item.carrierSlug.slice(1) : 'Delhivery')}
                  </span>
                </div>

                {/* Line 4: Delivery Badge & Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>{renderDeliveryBadge(item.status)}</div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isMerchant && onRepeatShipment && (
                      <button
                        onClick={() => onRepeatShipment(item)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E56E3] font-bold text-[10px] rounded-lg border border-blue-200 inline-flex items-center gap-1 transition active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Repeat</span>
                      </button>
                    )}
                    {!isMerchant && ['In Transit', 'Out for Delivery', 'Delivered', 'Reached Destination Hub'].includes(item.status) && (
                      <button
                        onClick={() => {
                          setSelectedShipmentForQr(item);
                          setShowQrScanner(true);
                        }}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 inline-flex items-center gap-1 transition active:scale-95"
                      >
                        <Camera className="w-3 h-3" />
                        <span>QR</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectShipment(item)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E56E3] font-bold text-[10px] rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (hidden md:block) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">{isMerchant ? 'Recipient' : 'Sender / Merchant'}</th>
                <th className="py-3 px-4">Shipping Route</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Protection Status</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">
                      {isMerchant ? 'No shipments found' : 'No orders or packages found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isMerchant 
                        ? 'Create a shipment to start tracking parcels with delivery protection.' 
                        : 'Any parcel shipments dispatched to your mobile number will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr
                    key={item.shipmentId || idx}
                    onClick={() => onSelectShipment(item)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#1E56E3]">
                      {item.shipmentId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.receiverName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.city}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-bold">
                      {item.carrierSlug === 'bluedart' ? 'Blue Dart' : (item.carrierSlug ? item.carrierSlug.charAt(0).toUpperCase() + item.carrierSlug.slice(1) : 'Delhivery')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{item.amount ? Number(item.amount).toLocaleString('en-IN') : '3,420'}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderProtectionBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderDeliveryBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isMerchant && onRepeatShipment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRepeatShipment(item);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-[#1E56E3] text-[#1E56E3] hover:text-white font-bold text-[10px] rounded-lg transition inline-flex items-center gap-1 border border-blue-200 mr-2 shadow-2xs group cursor-pointer"
                          title="Repeat Shipment with same details"
                        >
                          <RotateCcw className="w-3 h-3 group-hover:-rotate-90 transition-transform" />
                          <span>Repeat</span>
                        </button>
                      )}
                      {!isMerchant && ['In Transit', 'Out for Delivery', 'Delivered', 'Reached Destination Hub'].includes(item.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShipmentForQr(item);
                            setShowQrScanner(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition inline-flex items-center gap-1 border border-emerald-200 mr-2 shadow-2xs group"
                          title="Scan In-Box QR Code"
                        >
                          <Camera className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span>Scan QR</span>
                        </button>
                      )}
                      <button 
                        onClick={() => onSelectShipment(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                        title="View Shipment Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span>Showing {paginated.length} of {filtered.length} shipments</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-[#1E56E3] text-white font-bold rounded-lg">{currentPage}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── IN-BOX QR SCANNER MODAL ── */}
      <QrScannerModal
        isOpen={showQrScanner}
        onClose={() => {
          setShowQrScanner(false);
          setSelectedShipmentForQr(null);
        }}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
}

function renderProtectionBadge(status) {
  if (status === 'Awaiting Payment') return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Awaiting Payment</span>;
  if (status === 'Released') return <span className="pill-released"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Released</span>;
  if (status === 'Locked') return <span className="pill-disputed"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Disputed</span>;
  if (status === 'Cancelled') return <span className="bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Cancelled</span>;
  if (status === 'Undelivered') return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Refunded to Receiver</span>;
  if (status === 'Return Requested' || status === 'Return In Transit') return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Return Frozen</span>;
  if (status === 'Returned & Refunded') return <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Returned & Refunded</span>;
  return <span className="pill-held"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Protected</span>;
}

function renderDeliveryBadge(status) {
  if (status === 'Awaiting Payment') return <span className="text-amber-600 font-extrabold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">Waiting for Buyer</span>;
  if (status === 'Pending Pickup') return <span className="text-blue-700 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">Pickup Scheduled</span>;
  if (status === 'Released' || status === 'Delivered') return <span className="pill-delivery-delivered">Delivered</span>;
  if (status === 'Locked') return <span className="pill-delivery-delayed">Disputed</span>;
  if (status === 'Cancelled') return <span className="text-slate-500 font-bold text-[11px]">Cancelled</span>;
  if (status === 'Undelivered') return <span className="text-amber-700 font-bold text-[11px]">Delivery Failed</span>;
  if (status === 'Return Requested') return <span className="text-amber-800 font-bold text-[11px]">Return Requested</span>;
  if (status === 'Return In Transit') return <span className="text-purple-700 font-bold text-[11px]">Reverse Transit</span>;
  if (status === 'Returned & Refunded') return <span className="text-purple-900 font-bold text-[11px]">Return Completed</span>;
  return <span className="pill-delivery-transit">In Transit</span>;
}
