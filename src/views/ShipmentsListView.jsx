import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download, Plus, Box, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function ShipmentsListView({ onSelectShipment, openNewShipmentModal }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Held' | 'Released' | 'Disputed'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getShipments();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setShipments(res.data);
      } else {
        setShipments(mockDataset);
      }
    } catch (err) {
      setShipments(mockDataset);
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
                       (activeTab === 'Disputed' && item.status === 'Locked');
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shipment Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">View, track, and manage all your escrow-protected parcel shipments.</p>
        </div>

        <button
          onClick={openNewShipmentModal}
          className="px-4 py-2.5 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5 w-fit"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Create New Shipment</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-xs font-semibold text-slate-600">
            {['All', 'Held', 'Released', 'Disputed'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-lg transition ${activeTab === tab ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Tracking ID, recipient, or route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Shipping Route</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Escrow Value</th>
                <th className="py-3 px-4">Escrow Status</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginated.map((item, idx) => (
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
                  <td className="py-3.5 px-4 text-slate-500 capitalize">
                    {item.carrierSlug}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{item.amount ? item.amount.toLocaleString() : '3,420'}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderEscrowBadge(item.status)}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderDeliveryBadge(item.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}

function renderEscrowBadge(status) {
  if (status === 'Released') return <span className="pill-released"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Released</span>;
  if (status === 'Locked') return <span className="pill-disputed"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Disputed</span>;
  return <span className="pill-held"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Held</span>;
}

function renderDeliveryBadge(status) {
  if (status === 'Released' || status === 'Delivered') return <span className="pill-delivery-delivered">Delivered</span>;
  if (status === 'Locked') return <span className="pill-delivery-delayed">Delayed</span>;
  if (status === 'Pending Pickup') return <span className="pill-delivery-out">Out for Delivery</span>;
  return <span className="pill-delivery-transit">In Transit</span>;
}

const mockDataset = [
  { shipmentId: 'PSF-2026-00841', receiverName: 'Priya Nair', city: 'Mumbai → Bengaluru', carrierSlug: 'Delhivery Express', amount: 3420, status: 'In Transit' },
  { shipmentId: 'PSF-2026-00840', receiverName: 'Aarav Sharma', city: 'Delhi → Mumbai', carrierSlug: 'BlueDart Logistics', amount: 1890, status: 'Pending Pickup' },
  { shipmentId: 'PSF-2026-00839', receiverName: 'Ananya Iyer', city: 'Chennai → Hyderabad', carrierSlug: 'DTDC Express', amount: 7650, status: 'Released' },
  { shipmentId: 'PSF-2026-00838', receiverName: 'Rohan Gupta', city: 'Kolkata → Pune', carrierSlug: 'Ekart Logistics', amount: 920, status: 'Locked' },
  { shipmentId: 'PSF-2026-00837', receiverName: 'Vikram Singh', city: 'Ahmedabad → Jaipur', carrierSlug: 'India Post Speed Post', amount: 4200, status: 'In Transit' },
  { shipmentId: 'PSF-2026-00836', receiverName: 'Kartick Das', city: 'Kolkata → Delhi', carrierSlug: 'Delhivery Express', amount: 2310, status: 'Released' },
  { shipmentId: 'PSF-2026-00835', receiverName: 'Neha Verma', city: 'Bengaluru → Chennai', carrierSlug: 'BlueDart Logistics', amount: 5100, status: 'In Transit' }
];
