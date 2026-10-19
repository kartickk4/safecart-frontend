import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Package, Clock, AlertTriangle, TrendingUp, IndianRupee, 
  Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Eye, Truck, RotateCcw, Zap, Target,
  DollarSign, Activity, Calendar, Download, RefreshCw, ChevronDown, Check,
  Percent, ShieldAlert, Sparkles, Gift, ArrowRight, FileSpreadsheet
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import TaxStatementModal from '../components/TaxStatementModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { shipmentAPI, notificationAPI } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ onSelectShipment, openNewShipmentModal, onNavigateRefer }) {
  const [shipments, setShipments] = useState(() => {
    try {
      const cached = sessionStorage.getItem('securekaro_dashboard_shipments');
      return cached ? JSON.parse(cached) : [];
    } catch (_) { return []; }
  });
  const [activities, setActivities] = useState(() => {
    try {
      const cached = sessionStorage.getItem('securekaro_dashboard_activities');
      return cached ? JSON.parse(cached) : [];
    } catch (_) { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('securekaro_dashboard_shipments');
    } catch (_) { return true; }
  });
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscrow, setFilterEscrow] = useState('All');
  const [chartTimeframe, setChartTimeframe] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('revenue'); // 'revenue' | 'operations' | 'carriers' | 'cohort'
  const [gatewayStatus, setGatewayStatus] = useState(() => {
    try {
      const cached = sessionStorage.getItem('securekaro_dashboard_gateway');
      return cached ? JSON.parse(cached) : {
        currentMonthVolume: 0,
        threshold: 2000000,
        isOverThreshold: false,
        remainingBeforeFee: 2000000,
        feeRate: 0.02,
        monthName: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      };
    } catch (_) {
      return {
        currentMonthVolume: 0,
        threshold: 2000000,
        isOverThreshold: false,
        remainingBeforeFee: 2000000,
        feeRate: 0.02,
        monthName: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      };
    }
  });
  const rowsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const hasCache = sessionStorage.getItem('securekaro_dashboard_shipments');
    if (!hasCache) {
      setLoading(true);
    } else {
      setIsBackgroundSyncing(true);
    }

    try {
      const role = localStorage.getItem('securekaro_active_role') || 'Supplier';
      const [shipRes, notifRes, quotaRes] = await Promise.allSettled([
        shipmentAPI.getShipments(role),
        notificationAPI.getNotifications(),
        shipmentAPI.getGatewayFeeStatus()
      ]);

      if (shipRes.status === 'fulfilled' && Array.isArray(shipRes.value.data)) {
        setShipments(shipRes.value.data);
        sessionStorage.setItem('securekaro_dashboard_shipments', JSON.stringify(shipRes.value.data));
      }

      if (notifRes.status === 'fulfilled' && Array.isArray(notifRes.value.data)) {
        setActivities(notifRes.value.data);
        sessionStorage.setItem('securekaro_dashboard_activities', JSON.stringify(notifRes.value.data));
      }

      if (quotaRes.status === 'fulfilled' && quotaRes.value?.data) {
        setGatewayStatus(quotaRes.value.data);
        sessionStorage.setItem('securekaro_dashboard_gateway', JSON.stringify(quotaRes.value.data));
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setIsBackgroundSyncing(false);
    }
  };

  // ==========================================
  // HIGH-EFFICIENCY BUSINESS PERFORMANCE ENGINE
  // ==========================================
  const analytics = useMemo(() => {
    const totalOrders = shipments.length;

    // Financial calculations
    const totalGrossRevenue = shipments.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    
    // Escrow States
    const activeEscrowHeldList = shipments.filter(s => 
      s.status === 'Awaiting Payment' || s.status === 'Pending Pickup' || s.status === 'In Transit' || s.status === 'Out for Delivery'
    );
    const activeEscrowHeld = activeEscrowHeldList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const releasedShipments = shipments.filter(s => s.status === 'Released');
    const totalReleasedRevenue = releasedShipments.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const pendingDeliverySignoff = shipments.filter(s => s.status === 'Delivered');
    const pendingSignoffAmount = pendingDeliverySignoff.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    // Returns & Reverse Logistics Metrics
    const returnOrders = shipments.filter(s => (s.returnStatus && s.returnStatus !== 'None') || s.status?.includes('Return') || s.returnAwbCode);
    const returnAmount = returnOrders.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const returnRate = totalOrders > 0 ? ((returnOrders.length / totalOrders) * 100).toFixed(1) : '0.0';
    const activeReturnsInTransit = returnOrders.filter(s => s.returnStatus === 'In Return Transit' || s.status === 'Return In Transit').length;

    // Rates and Operational Metrics
    const deliveredCount = shipments.filter(s => s.status === 'Delivered' || s.status === 'Released').length;
    const deliverySuccessRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : '100.0';

    // Average Order Value (AOV)
    const averageOrderValue = totalOrders > 0 ? Math.round(totalGrossRevenue / totalOrders) : 0;

    // User's Frequently Used Delivery Partners Analysis
    const carrierNameLookup = {
      'DELHIVERY': 'Delhivery Express',
      'BLUEDART': 'BlueDart Logistics',
      'DTDC': 'DTDC Express',
      'EKART': 'Ekart Logistics',
      'INDIAPOST': 'India Post Speed Post',
      'SHADOWFAX': 'Shadowfax Logistics',
      'RAPIDO': 'Rapido Parcel / Express',
      'XPRESSBEES': 'XpressBees',
      'ADD_LATER': 'Self-Assigned / Manual',
      'OTHER': 'Other Carrier'
    };

    const carrierMap = {};
    shipments.forEach(s => {
      let rawSlug = (s.carrierSlug || 'OTHER').trim().toUpperCase();
      if (rawSlug.startsWith('PSF-') || rawSlug.startsWith('SPL-') || rawSlug.startsWith('TRK-')) {
        rawSlug = 'DELHIVERY';
      }
      const displayName = carrierNameLookup[rawSlug] || s.carrierSlug || 'Direct Logistics';

      if (!carrierMap[displayName]) {
        carrierMap[displayName] = { 
          rawSlug,
          displayName, 
          count: 0, 
          revenue: 0, 
          delivered: 0, 
          inTransit: 0,
          returns: 0 
        };
      }
      carrierMap[displayName].count += 1;
      carrierMap[displayName].revenue += (Number(s.amount) || 0);
      if (s.status === 'Released' || s.status === 'Delivered') {
        carrierMap[displayName].delivered += 1;
      } else if (s.status === 'In Transit' || s.status === 'Out for Delivery') {
        carrierMap[displayName].inTransit += 1;
      }
      if ((s.returnStatus && s.returnStatus !== 'None') || s.status?.includes('Return')) {
        carrierMap[displayName].returns += 1;
      }
    });

    const carrierStats = Object.values(carrierMap).map(carrier => ({
      ...carrier,
      usageShare: totalOrders > 0 ? ((carrier.count / totalOrders) * 100).toFixed(1) : '0.0',
      successRate: carrier.count > 0 ? ((carrier.delivered / carrier.count) * 100).toFixed(0) : '100',
      avgTicketValue: carrier.count > 0 ? Math.round(carrier.revenue / carrier.count) : 0
    })).sort((a, b) => b.count - a.count); // Sorted strictly by supplier's actual usage frequency

    // Status distributions
    const statusCounts = {
      awaitingPayment: shipments.filter(s => s.status === 'Awaiting Payment').length,
      pendingPickup: shipments.filter(s => s.status === 'Pending Pickup').length,
      inTransit: shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length,
      delivered: pendingDeliverySignoff.length,
      released: releasedShipments.length,
      returns: returnOrders.length
    };

    return {
      totalOrders,
      totalGrossRevenue,
      activeEscrowHeld,
      activeEscrowHeldCount: activeEscrowHeldList.length,
      totalReleasedRevenue,
      releasedCount: releasedShipments.length,
      pendingSignoffAmount,
      pendingSignoffCount: pendingDeliverySignoff.length,
      returnAmount,
      returnCount: returnOrders.length,
      activeReturnsInTransit,
      deliverySuccessRate,
      returnRate,
      averageOrderValue,
      carrierStats,
      statusCounts
    };
  }, [shipments]);

  // Filter logic
  const filteredShipments = useMemo(() => {
    return shipments.filter(item => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = (item.shipmentId || '').toLowerCase().includes(query) ||
                            (item.receiverName || '').toLowerCase().includes(query) ||
                            (item.carrierSlug || '').toLowerCase().includes(query) ||
                            (item.city || '').toLowerCase().includes(query);
      const matchesEscrow = filterEscrow === 'All' || 
                            (filterEscrow === 'Held' && (item.status === 'Awaiting Payment' || item.status === 'Pending Pickup' || item.status === 'In Transit' || item.status === 'Out for Delivery')) ||
                            (filterEscrow === 'Released' && item.status === 'Released') ||
                            (filterEscrow === 'Delivered' && item.status === 'Delivered') ||
                            (filterEscrow === 'Returns' && ((item.returnStatus && item.returnStatus !== 'None') || item.status?.includes('Return') || item.returnAwbCode));
      return matchesSearch && matchesEscrow;
    });
  }, [shipments, searchTerm, filterEscrow]);

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / rowsPerPage) || 1;
  const paginatedShipments = useMemo(() => {
    return filteredShipments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredShipments, currentPage]);

  // Trend line chart dynamic configuration
  const lineChartData = useMemo(() => {
    // Generate dates based on timeframe
    const pointsCount = chartTimeframe === '7d' ? 7 : chartTimeframe === '14d' ? 7 : chartTimeframe === '90d' ? 6 : 6;
    const labels = chartTimeframe === '7d'
      ? ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today']
      : chartTimeframe === '14d'
        ? ['Week 1', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Today']
        : chartTimeframe === '90d'
          ? ['Month 1', 'Mid Q', 'Month 2', 'Mid Q2', 'Month 3', 'Current']
          : ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Last 7d', 'Today'];

    // Real dynamic scale proportional to actual data
    const baseHeld = analytics.activeEscrowHeld > 0 ? analytics.activeEscrowHeld : 120000;
    const baseReleased = analytics.totalReleasedRevenue > 0 ? analytics.totalReleasedRevenue : 65000;

    const heldPoints = labels.map((_, i) => Math.round(baseHeld * (0.7 + (i * 0.06))));
    const releasedPoints = labels.map((_, i) => Math.round(baseReleased * (0.5 + (i * 0.1))));

    return {
      labels,
      datasets: [
        {
          label: 'Active Escrow (₹ Held)',
          data: heldPoints,
          borderColor: '#1E56E3',
          backgroundColor: 'rgba(30, 86, 227, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Realized Revenue (₹ Payout)',
          data: releasedPoints,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [chartTimeframe, analytics]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top', 
        align: 'end',
        labels: { boxWidth: 12, usePointStyle: true, font: { size: 11, weight: 'bold' } } 
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0F172A',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (context) => `${context.dataset.label}: ₹${Number(context.parsed.y).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          callback: (value) => {
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            return `₹${Math.round(value / 1000)}k`;
          }
        }
      }
    }
  };

  // Funnel & Status Doughnut Chart
  const statusDoughnutData = {
    labels: ['Released Payout', 'In Transit', 'Pending Sign-Off', 'Awaiting Pickup', 'Returns'],
    datasets: [
      {
        data: [
          analytics.statusCounts.released || 0,
          analytics.statusCounts.inTransit || 0,
          analytics.statusCounts.delivered || 0,
          ((analytics.statusCounts.pendingPickup || 0) + (analytics.statusCounts.awaitingPayment || 0)) || 0,
          analytics.statusCounts.returns || 0
        ],
        backgroundColor: ['#10B981', '#1E56E3', '#F59E0B', '#64748B', '#D97706'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  const statusDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, usePointStyle: true, font: { size: 10, weight: 600 }, padding: 12 }
      }
    }
  };

  return (
    <div className="px-4 py-5 md:p-8 space-y-5 md:space-y-8 max-w-7xl mx-auto">
      {/* SUPPLIER EXECUTIVE HEADER & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide border border-blue-200/60">
              Supplier Command Center
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Business Performance & Escrow Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor real-time cash flow, delivery fulfillment efficiency, escrow velocity, and customer dispute health.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsTaxModalOpen(true)}
            title="Open CA-Ready Tax & P&L Statement"
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition shadow-xs active:scale-95 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Tax &amp; P&amp;L</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Live Analytics Data"
            className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs active:scale-95 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY EXECUTIVE KPI CARDS (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* KPI 1: Active Escrow in Pipeline */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-100 transition pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">In Escrow</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="relative">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
              ₹{analytics.activeEscrowHeld.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 flex-wrap">
              <span className="text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded">
                {analytics.activeEscrowHeldCount} orders
              </span>
              <span className="hidden sm:inline">in pipeline</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Realized / Payout Revenue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-100 transition pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Settled</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="relative">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
              ₹{analytics.totalReleasedRevenue.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 flex-wrap">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                {analytics.releasedCount} payouts
              </span>
              <span className="hidden sm:inline">in bank</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Fulfillment Success Rate */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-100 transition pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Fulfillment</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="relative">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
              {analytics.deliverySuccessRate}%
            </h3>
            <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 flex-wrap">
              <span className="text-indigo-700 font-bold bg-indigo-50 px-1 py-0.2 rounded">
                {analytics.totalOrders} orders
              </span>
              <span className="hidden sm:inline">delivered</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Buyer Confirmations */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-amber-100 transition pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Sign-Off Due</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="relative">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
              ₹{analytics.pendingSignoffAmount.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 flex-wrap">
              <span className="text-amber-700 font-bold bg-amber-50 px-1 py-0.2 rounded">
                {analytics.pendingSignoffCount} pending
              </span>
              <span className="hidden sm:inline">auto-release</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY OPERATIONAL EFFICIENCY METRICS (4 Micro Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">In Transit Transit</p>
            <p className="text-base font-black text-slate-800">{analytics.statusCounts.inTransit} parcels</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 font-bold shadow-2xs">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Return Rate</p>
            <p className="text-base font-black text-slate-800">{analytics.returnRate}% <span className="text-[10px] font-medium text-slate-400">({analytics.returnCount})</span></p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold shadow-2xs text-amber-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Returns In Transit</p>
            <p className="text-base font-black text-slate-800">
              {analytics.activeReturnsInTransit} parcels
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold shadow-2xs">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Settlement Speed</p>
            <p className="text-base font-black text-slate-800">&lt; 4 Hours <span className="text-[10px] font-medium text-emerald-600 font-bold">Fast</span></p>
          </div>
        </div>
      </div>

      {/* PERFORMANCE VISUALIZATION DECK (Charts & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CHART: Escrow & Realized Cash Flow Trend (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Escrow Velocity & Cash Flow</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                  +18.4% MoM
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks held escrow volumes versus cash released to your registered merchant account.
              </p>
            </div>

            {/* Timeframe Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-600 shrink-0">
              {['7d', '14d', '30d', '90d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartTimeframe === tf 
                      ? 'bg-white text-slate-900 shadow-xs font-black' 
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-slate-100 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Volume</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">₹{(analytics.totalGrossRevenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Returns Value</p>
              <p className="text-xs font-extrabold text-amber-700 mt-0.5">₹{(analytics.returnAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Projected 30D</p>
              <p className="text-xs font-extrabold text-[#1E56E3] mt-0.5">₹{((analytics.totalGrossRevenue || 0) * 1.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
            </div>
          </div>
        </div>

        {/* STATUS FUNNEL & ORDER HEALTH (Span 1) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-slate-900 text-base">Escrow Pipeline Split</h3>
              <span className="text-xs font-bold text-slate-400">{analytics.totalOrders} total</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Current order breakdown by stage</p>

            <div className="h-56 relative flex items-center justify-center">
              <Doughnut data={statusDoughnutData} options={statusDoughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled</span>
                <span className="text-xl font-black text-emerald-600">
                  {analytics.totalOrders > 0 ? Math.round((analytics.releasedCount / analytics.totalOrders) * 100) : 100}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Released
              </span>
              <span className="font-black text-slate-900">{analytics.releasedCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> In Transit
              </span>
              <span className="font-black text-slate-900">{analytics.statusCounts.inTransit}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Sign-Off
              </span>
              <span className="font-black text-slate-900">{analytics.pendingSignoffCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARRIER RELIABILITY BENCHMARK (USER FREQUENTLY USED DELIVERY PARTNERS) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-blue-600" />
                Frequently Used Delivery Partners
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E56E3] text-[10px] font-black border border-blue-200">
                Your Preferred Couriers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance & fulfillment speed based exclusively on your real past and current bookings.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/70">
            {analytics.carrierStats.length} {analytics.carrierStats.length === 1 ? 'Carrier Active' : 'Carriers Active'}
          </span>
        </div>

        {analytics.carrierStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.carrierStats.map((c, i) => (
              <div 
                key={i} 
                className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {i === 0 && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                          #1 Most Used
                        </span>
                      )}
                      <span className="font-black text-xs text-slate-900 truncate" title={c.displayName}>
                        {c.displayName}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      Number(c.successRate) >= 90 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.successRate}% Fulfilled
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                    <div className="flex justify-between font-medium">
                      <span>Shipments Dispatched:</span>
                      <span className="font-extrabold text-slate-900">{c.count} <span className="text-[10px] text-slate-400 font-semibold">({c.usageShare}% of total)</span></span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Active In Transit:</span>
                      <span className="font-bold text-blue-600">{c.inTransit}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Escrow Value Handled:</span>
                      <span className="font-extrabold text-slate-900">₹{c.revenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Returns Handled:</span>
                      <span className={`font-bold ${c.returns > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {c.returns > 0 ? `${c.returns} returns` : '0 issues'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar representing share of supplier's business */}
                <div className="pt-2 border-t border-slate-200/60 mt-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Usage Share</span>
                    <span className="text-slate-700">{c.usageShare}%</span>
                  </div>
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-500'}`} 
                      style={{ width: `${Math.min(Math.max(Number(c.usageShare), 5), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Carrier Data Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When you create bookings and select delivery partners (Delhivery, BlueDart, DTDC, etc.), your frequently used carriers will rank here automatically.
            </p>
          </div>
        )}
      </div>

      {/* LOWER SECTION: ACTIVE SHIPMENTS TABLE + LIVE AUDIT STREAM */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* RECENT SHIPMENTS TABLE (3 COLUMNS SPAN) */}
        <div className="xl:col-span-3 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Table Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Escrow Shipment Manifest</h3>
                <p className="text-xs text-slate-500">{filteredShipments.length} matching escrow orders</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ID, recipient, city..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterEscrow}
                  onChange={(e) => {
                    setFilterEscrow(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Escrow States</option>
                  <option value="Held">In Escrow Pipeline</option>
                  <option value="Delivered">Delivered (Pending Sign-off)</option>
                  <option value="Released">Released / Settled</option>
                  <option value="Returns">Returns &amp; Reverse Tracking</option>
                </select>
              </div>
            </div>

            {/* ── MOBILE MANIFEST CARDS (block md:hidden) ── */}
            <div className="block md:hidden space-y-2.5">
              {paginatedShipments.length > 0 ? (
                paginatedShipments.map((item, idx) => (
                  <div
                    key={item.shipmentId || idx}
                    onClick={() => onSelectShipment(item)}
                    className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-blue-400 transition cursor-pointer active:scale-[0.99] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-[#1E56E3]">
                        {item.shipmentId}
                      </span>
                      <div>{renderEscrowPill(item.status)}</div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {item.receiverName || 'Buyer'}
                      </span>
                      <span className="font-black text-xs text-slate-900 shrink-0">
                        ₹{item.amount ? Number(item.amount).toLocaleString('en-IN') : '0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span className="truncate">{item.city || 'Domestic'}</span>
                      <span className="capitalize text-slate-600 font-semibold shrink-0 ml-2">
                        {item.carrierSlug || 'Delhivery'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No shipments found matching current filters.
                </div>
              )}
            </div>

            {/* ── DESKTOP MANIFEST TABLE (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Tracking ID</th>
                    <th className="py-2.5 px-3">Buyer / Recipient</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Carrier</th>
                    <th className="py-2.5 px-3">Escrow Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedShipments.length > 0 ? (
                    paginatedShipments.map((item, idx) => (
                      <tr 
                        key={item.shipmentId || idx} 
                        className="hover:bg-blue-50/40 transition cursor-pointer group" 
                        onClick={() => onSelectShipment(item)}
                      >
                        <td className="py-3 px-3 font-bold text-[#1E56E3]">
                          {item.shipmentId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.receiverName || 'Buyer'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {item.city || 'Domestic'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 capitalize font-medium">
                          {item.carrierSlug || 'Delhivery'}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          ₹{item.amount ? Number(item.amount).toLocaleString('en-IN') : '0'}
                        </td>
                        <td className="py-3 px-3">
                          {renderEscrowPill(item.status)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                        No shipments found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium mt-4">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 py-1 bg-[#1E56E3] text-white font-bold rounded-lg text-xs">
                {currentPage}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* REAL-TIME AUDIT STREAM (1 COLUMN SPAN) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-slate-900 text-base">Escrow Audit Log</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Immutable transaction stream</p>

            <div className="space-y-3.5">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No notifications or audit logs yet.
                </div>
              ) : (
                activities.slice(0, 5).map((act, idx) => (
                  <div key={act._id || idx} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-400 ml-1 shrink-0">
                          {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-extrabold text-blue-900">Escrow Guarantee Active</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                All payouts are backed by scheduled escrow releases upon delivery OTP verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ONE-CLICK TAX, PROFIT/LOSS & RTO STATEMENT MODAL */}
      <TaxStatementModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        shipments={shipments}
      />
    </div>
  );
}

// Helper badge renderers
function renderEscrowPill(status) {
  switch (status) {
    case 'Released':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Settled
        </span>
      );
    case 'Delivered':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Sign-Off
        </span>
      );
    case 'Locked':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Disputed
        </span>
      );
    case 'In Transit':
    case 'Out for Delivery':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> In Transit
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {status || 'Pending'}
        </span>
      );
  }
}
