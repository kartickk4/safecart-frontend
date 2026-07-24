import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Package, Clock, AlertTriangle, TrendingUp, IndianRupee, 
  Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Eye 
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { shipmentAPI } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ onSelectShipment, openNewShipmentModal }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscrow, setFilterEscrow] = useState('All');
  const [chartTimeframe, setChartTimeframe] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getShipments();
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setShipments(data);
      } else {
        // Fallback default demonstration dataset matching the design screenshot
        setShipments(defaultMockShipments);
      }
    } catch (err) {
      console.warn('Backend API connection offline or empty, using design mock dataset:', err);
      setShipments(defaultMockShipments);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredShipments = shipments.filter(item => {
    const matchesSearch = (item.shipmentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.receiverName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEscrow = filterEscrow === 'All' || 
                          (filterEscrow === 'Held' && (item.status === 'Awaiting Payment' || item.status === 'Pending Pickup' || item.status === 'In Transit')) ||
                          (filterEscrow === 'Released' && item.status === 'Released') ||
                          (filterEscrow === 'Disputed' && item.status === 'Locked');
    return matchesSearch && matchesEscrow;
  });

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / rowsPerPage) || 1;
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Line Chart Data
  const lineChartData = {
    labels: ['Jul 1', 'Jul 5', 'Jul 10', 'Jul 15', 'Jul 20', 'Jul 22'],
    datasets: [
      {
        label: 'Funds Held (₹)',
        data: [110000, 125000, 118000, 138000, 132000, 142380],
        borderColor: '#1E56E3',
        backgroundColor: 'rgba(30, 86, 227, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
      },
      {
        label: 'Funds Released (₹)',
        data: [45000, 52000, 68000, 71000, 82000, 89240],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1E293B',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y || 0;
            return `${label}: ₹${val.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          callback: (value) => {
            if (value >= 100000) {
              const lakhs = value / 100000;
              return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
            }
            return `₹${value / 1000}k`;
          }
        }
      }
    }
  };

  // Bar Chart Data
  const barChartData = {
    labels: ['Payment', 'Pending', 'Transit', 'Out', 'Delivered'],
    datasets: [
      {
        label: 'Shipments',
        data: [18, 12, 8, 5, 24],
        backgroundColor: ['#1E56E3', '#F59E0B', '#6366F1', '#10B981', '#059669'],
        borderRadius: 6
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#F1F5F9' } }
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* METRICS CARDS GRID (6 Cards matching Design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Card 1: Total Escrow Held */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Total Escrow Held</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">₹1,42,380</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">+₹12,450 since yesterday</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+9.6%</span>
          </div>
        </div>

        {/* Card 2: Active Shipments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Active Shipments</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">47</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">12 out for delivery</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+3</span>
          </div>
        </div>

        {/* Card 3: Pending Confirmations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pending Confirm</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">8</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">Awaiting buyer sign-off</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
            <span>±0</span>
          </div>
        </div>

        {/* Card 4: Open Claims */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Open Claims</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-rose-600 tracking-tight">3</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">1 escalated — urgent</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+1 today</span>
          </div>
        </div>

        {/* Card 5: Avg Release Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Avg Release Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">18.4h</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">vs 22.1h last week</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-17%</span>
          </div>
        </div>

        {/* Card 6: Released This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Released Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">₹89,240</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">63 transactions cleared</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+22%</span>
          </div>
        </div>
      </div>

      {/* DATA CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Escrow Fund Flow */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Escrow Fund Flow</h3>
              <p className="text-xs text-slate-500">Funds held vs. released over time</p>
            </div>
            {/* Timeframe selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-medium text-slate-600">
              {['7d', '14d', '30d', '90d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg transition ${chartTimeframe === tf ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Bar Chart: Shipments by Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-base">Shipments by Status</h3>
            <p className="text-xs text-slate-500">Current distribution across all active shipments</p>
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* LOWER ROW: RECENT SHIPMENTS TABLE + REAL-TIME ACTIVITY FEED */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* RECENT SHIPMENTS TABLE (3 COLUMNS SPAN) */}
        <div className="xl:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Table Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Shipments</h3>
              <p className="text-xs text-slate-500">{filteredShipments.length} shipments found</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tracking ID, recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition w-64"
                />
              </div>

              {/* Escrow Filter */}
              <div className="relative">
                <select
                  value={filterEscrow}
                  onChange={(e) => setFilterEscrow(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Escrow</option>
                  <option value="Held">Held Only</option>
                  <option value="Released">Released Only</option>
                  <option value="Disputed">Disputed Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Carrier</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Escrow</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedShipments.map((item, idx) => (
                  <tr key={item.shipmentId || idx} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => onSelectShipment(item)}>
                    <td className="py-3.5 px-4 font-bold text-[#1E56E3]">
                      {item.shipmentId || `PSF-2026-${1000 + idx}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.receiverName || 'Priya Nair'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.city || 'New York → Los Angeles'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 capitalize">
                      {item.carrierSlug || 'FedEx Express'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${item.amount ? item.amount.toLocaleString() : '3,420'}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderEscrowPill(item.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderDeliveryPill(item.status)}
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

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100 text-xs text-slate-500 font-medium mt-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700">
                <option>5</option>
                <option>10</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>1-5 of {filteredShipments.length}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-[#1E56E3] text-white font-bold rounded-lg">{currentPage}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME ACTIVITY FEED (1 COLUMN SPAN) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Activity Feed</h3>
            <p className="text-xs text-slate-500 mb-6">Real-time escrow events</p>

            <div className="space-y-5">
              {/* Event 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Delivery Confirmed</p>
                    <span className="text-[10px] text-slate-400">9 min ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">PSF-2026-00839 confirmed by Tariq Hassan</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Funds Released</p>
                    <span className="text-[10px] text-slate-400">11 min ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">₹7,650 released for PSF-2026-00839</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Claim Filed</p>
                    <span className="text-[10px] text-slate-400">42 min ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">Dispute opened on PSF-2026-00838 by Sofia Mendez</p>
                </div>
              </div>

              {/* Event 4 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Shipment Created</p>
                    <span className="text-[10px] text-slate-400">1h 14m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">PSF-2026-00841 dispatched via Delhivery Express</p>
                </div>
              </div>

              {/* Event 5 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Escrow Funded</p>
                    <span className="text-[10px] text-slate-400">1h 15m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">₹3,420 held for PSF-2026-00841</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={openNewShipmentModal}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition text-center mt-6"
          >
            Create New Escrow Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers for Status Badges
function renderEscrowPill(status) {
  if (status === 'Released') {
    return <span className="pill-released"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Released</span>;
  }
  if (status === 'Locked') {
    return <span className="pill-disputed"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Disputed</span>;
  }
  return <span className="pill-held"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Held</span>;
}

function renderDeliveryPill(status) {
  if (status === 'Released' || status === 'Delivered') {
    return <span className="pill-delivery-delivered">Delivered</span>;
  }
  if (status === 'Locked') {
    return <span className="pill-delivery-delayed">Delayed</span>;
  }
  if (status === 'Pending Pickup') {
    return <span className="pill-delivery-out">Out for Delivery</span>;
  }
  return <span className="pill-delivery-transit">In Transit</span>;
}

const defaultMockShipments = [
  { shipmentId: 'PSF-2026-00841', receiverName: 'Priya Nair', city: 'Mumbai → Bengaluru', carrierSlug: 'Delhivery Express', amount: 3420, status: 'In Transit' },
  { shipmentId: 'PSF-2026-00840', receiverName: 'Aarav Sharma', city: 'Delhi → Mumbai', carrierSlug: 'BlueDart Logistics', amount: 1890, status: 'Pending Pickup' },
  { shipmentId: 'PSF-2026-00839', receiverName: 'Ananya Iyer', city: 'Chennai → Hyderabad', carrierSlug: 'DTDC Express', amount: 7650, status: 'Released' },
  { shipmentId: 'PSF-2026-00838', receiverName: 'Rohan Gupta', city: 'Kolkata → Pune', carrierSlug: 'Ekart Logistics', amount: 920, status: 'Locked' },
  { shipmentId: 'PSF-2026-00837', receiverName: 'Vikram Singh', city: 'Ahmedabad → Jaipur', carrierSlug: 'India Post Speed Post', amount: 4200, status: 'In Transit' },
];
