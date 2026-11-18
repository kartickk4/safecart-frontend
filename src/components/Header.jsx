import React, { useState } from 'react';
import { RefreshCw, Download, Plus, Truck, ShoppingBag, ArrowLeftRight, CheckCircle2, Crown, Sparkles, ShieldCheck, Wallet, AlertTriangle, LogOut, Menu, PanelLeft } from 'lucide-react';
import { shipmentAPI } from '../services/api';
import MobileNavDrawer from './MobileNavDrawer';
import { SpinnerArc } from './Loaders';

export default function Header({ 
  user, 
  currentRole, 
  currentTab,
  setCurrentTab,
  onSwitchRole, 
  onRefresh, 
  openNewShipmentModal, 
  onOpenAiAgent, 
  onOpenAdmin, 
  onOpenWallet, 
  onSignOut,
  notifCount = 0,
  isSidebarCollapsed = false,
  onToggleSidebar
}) {
  const [exporting, setExporting] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isSupplier = (currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier'));
  const isAdmin = user && (
    user.isAdmin === true ||
    user.role === 'Admin' ||
    user.role === 'super_admin' ||
    user.adminRole
  );

  const currentDate = new Date().toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let data = [];
      try {
        const res = await shipmentAPI.getShipments();
        if (Array.isArray(res.data) && res.data.length > 0) {
          data = res.data;
        }
      } catch (e) {
        console.warn('API error during export:', e);
      }

      const headers = ['Tracking ID', 'Recipient Name', 'Recipient Phone', 'Route', 'Carrier', 'Parcel Value (INR)', 'Status', 'Date Created'];
      const rows = data.map(item => [
        `"${item.shipmentId || ''}"`,
        `"${item.receiverName || ''}"`,
        `"${item.receiverPhone || ''}"`,
        `"${item.city || ''}"`,
        `"${item.carrierSlug || ''}"`,
        item.amount || 0,
        `"${item.status || ''}"`,
        `"${new Date(item.createdAt || Date.now()).toLocaleString('en-IN')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `securekaro_shipment_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="bg-white/92 backdrop-blur-xl border-b border-slate-200/80 px-3.5 md:px-8 py-2.5 md:py-3.5 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] transition-all">
        {/* ── MOBILE HEADER (< lg) WITH HAMBURGER MENU ── */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {/* 🍔 HAMBURGER MENU TRIGGER */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition btn-press cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative">
              <img loading="lazy" src="/logo.jpg" 
                alt="SecureKaro" 
                className="w-7 h-7 rounded-xl object-cover shrink-0 shadow-xs border border-slate-200/90 bg-white" 
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight whitespace-nowrap">
                  {isSupplier ? 'Supplier Hub' : 'Buyer Hub'}
                </span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md shrink-0 border uppercase tracking-wider ${
                  isSupplier 
                    ? 'bg-blue-50 text-[#1E56E3] border-blue-200/80' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                }`}>
                  {isSupplier ? 'Seller' : 'Buyer'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Role Switcher Pill */}
            <button
              type="button"
              onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
              className="px-2 py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-[10px] font-bold flex items-center gap-1 transition btn-press whitespace-nowrap cursor-pointer shadow-2xs"
              title={`Switch to ${isSupplier ? 'Receiver' : 'Supplier'} Mode`}
            >
              <ArrowLeftRight className="w-3 h-3 text-[#1E56E3]" />
              <span>{isSupplier ? 'Buyer' : 'Seller'}</span>
            </button>

            {/* Quick New Shipment on Mobile */}
            {isSupplier && (
              <button
                onClick={openNewShipmentModal}
                className="flex p-1.5 rounded-xl bg-gradient-to-r from-[#1443BC] to-[#1E56E3] text-white shadow-sm shadow-blue-500/20 btn-press cursor-pointer border border-blue-400/20"
                title="New Shipment"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex p-1.5 rounded-xl bg-slate-900 text-rose-400 border border-slate-700 btn-press cursor-pointer"
                title="Admin Console"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
              </button>
            )}
          </div>
        </div>

        {/* ── DESKTOP HEADER (lg+) ── */}
        <div className="hidden lg:flex lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs btn-press cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {isSupplier ? 'Supplier Platform' : 'Buyer Order Portal'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                Welcome back, <span className="text-slate-900 font-bold">{user?.fullName?.split(' ')[0] || 'Partner'}</span> — {isSupplier ? 'overview of your outgoing shipments and courier settlements' : 'manage your incoming deliveries and order confirmations'} as of <span className="font-semibold text-slate-700">{currentDate} • {currentTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-nowrap justify-end shrink-0">
            {/* INTERACTIVE SEGMENTED ROLE SWITCHER */}
            <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 flex items-center shadow-inner shrink-0">
              <button
                type="button"
                id="switch-to-supplier-btn"
                onClick={() => onSwitchRole && onSwitchRole('Supplier')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSupplier
                    ? 'bg-white text-[#1E56E3] shadow-sm shadow-slate-900/5 ring-1 ring-black/5 font-extrabold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Supplier Mode (Merchant & Shipments)"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Supplier</span>
              </button>

              <button
                type="button"
                id="switch-to-receiver-btn"
                onClick={() => onSwitchRole && onSwitchRole('Receiver')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isSupplier
                    ? 'bg-white text-emerald-600 shadow-sm shadow-slate-900/5 ring-1 ring-black/5 font-extrabold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Receiver Mode (Buyer & Delivery Sign-Off)"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Receiver</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              title="Refresh Dashboard Data"
              className="px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs inline-flex items-center gap-1.5 shrink-0 btn-press cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              title="Export CSV Shipment Ledger"
              className="px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition shadow-2xs inline-flex items-center gap-1.5 shrink-0 btn-press cursor-pointer"
            >
              {exporting ? <SpinnerArc size="xs" color="text-slate-600" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {isSupplier && (
              <button
                onClick={onOpenAiAgent}
                title="Open AI Shipping Agent"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition inline-flex items-center gap-1.5 btn-press cursor-pointer shrink-0 border border-indigo-400/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>AI Agent</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                title="Open Executive Admin Terminal"
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700/80 text-xs font-black shadow-md shadow-slate-900/20 transition inline-flex items-center gap-1.5 btn-press cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>Admin Console</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </button>
            )}

            {/* PRIMARY ACTION: Anchored at far-right corner */}
            {isSupplier && (
              <button
                onClick={openNewShipmentModal}
                id="header-new-shipment-btn"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1443BC] via-[#1E56E3] to-[#2563EB] hover:from-[#10379b] hover:to-[#1d4ed8] text-white text-xs font-black shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all duration-200 inline-flex items-center gap-1.5 shrink-0 btn-press cursor-pointer border border-blue-400/30 ml-0.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Shipment</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── SLIDE-IN MOBILE NAVIGATION DRAWER (GESTURE & HAMBURGER TRIGGERED) ── */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        currentRole={currentRole}
        onSwitchRole={onSwitchRole}
        onSignOut={onSignOut}
        notifCount={notifCount}
      />
    </>
  );
}
