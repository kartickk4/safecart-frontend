import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, PlusCircle, Navigation, Wallet, 
  AlertCircle, FileText, Bell, Settings, LogOut, Package, CheckCircle2, UserCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, user, onSignOut, openNewShipmentModal }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1E56E3] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight flex items-center gap-1">Safecart 🇮🇳</h1>
            <p className="text-[11px] text-slate-500 font-medium">India Escrow Platform</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Section: OVERVIEW */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'dashboard'
                  ? 'bg-blue-50 text-[#1E56E3] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Section: SHIPMENTS */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipments</p>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentTab('shipments-list')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'shipments-list'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>All Shipments</span>
              </button>

              <button
                onClick={() => setCurrentTab('create-shipment')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'create-shipment'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-[#1E56E3]" />
                <span>Create Shipment</span>
              </button>

              <button
                onClick={() => setCurrentTab('track')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'track'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>Tracking & Journey</span>
              </button>

              <button
                onClick={() => setCurrentTab('delivery-confirm')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'delivery-confirm'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Delivery Sign-Off</span>
              </button>
            </div>
          </div>

          {/* Section: ESCROW & CLAIMS */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Escrow & Claims</p>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentTab('wallet')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'wallet'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Escrow Wallet</span>
              </button>

              <button
                onClick={() => setCurrentTab('claims')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'claims'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Disputes & Claims</span>
                </div>
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
              </button>
            </div>
          </div>

          {/* Section: ACCOUNT */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account</p>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentTab('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'notifications'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">4</span>
              </button>

              <button
                onClick={() => setCurrentTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  currentTab === 'profile'
                    ? 'bg-blue-50 text-[#1E56E3] font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Profile & Bank Payout</span>
              </button>

              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Badge at bottom */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
            {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'MR'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.fullName || 'Marcus Rivera'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.activeRole || 'Supplier'} • Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
