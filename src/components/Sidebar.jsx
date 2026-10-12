import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, PlusCircle, Navigation, Wallet, 
  AlertCircle, FileText, Bell, Settings, LogOut, Package, CheckCircle2, UserCheck, HelpCircle, ChevronRight, Sparkles, RotateCcw, ArrowLeftRight, Truck, ShoppingBag, Crown, Gift, QrCode, Calculator
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, user, currentRole, onSwitchRole, onSignOut, openNewShipmentModal, notifCount = 0 }) {
  const isSupplier = currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier');
  const roleTitle = isSupplier ? 'Supplier Platform' : 'Buyer Escrow Portal';
  const isAdmin = user && (
    user.isAdmin === true ||
    user.role === 'Admin' ||
    user.role === 'super_admin' ||
    user.adminRole ||
    user.email === 'kartickdas6289@gmail.com'
  );

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'KD';

  const navItems = [
    ...(isSupplier ? [
      {
        section: 'OVERVIEW',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
          {
            id: 'roi-calculator',
            label: 'Savings Calculator',
            icon: Calculator,
            color: 'text-emerald-600',
            customBadge: (
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-2xs">
                FREE
              </span>
            )
          }
        ]
      }
    ] : []),
    {
      section: 'SHIPMENTS & ORDERS',
      items: [
        { id: 'shipments-list', label: isSupplier ? 'All Shipments' : 'My Orders & Packages', icon: Package, badge: null },
        ...(isSupplier ? [
          { id: 'create-shipment', label: 'Create Shipment', icon: PlusCircle, highlight: true },
          {
            id: 'ai-agent',
            label: 'AI Shipping Agent',
            icon: Sparkles,
            color: 'text-purple-600',
            customBadge: (
              <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                AI
              </span>
            )
          }
        ] : []),
        ...(isSupplier 
          ? [{ id: 'return-orders', label: 'Return Orders & Tracking', icon: RotateCcw, color: 'text-amber-600' }] 
          : [{ id: 'return-tracking', label: 'Returns & Tracking', icon: RotateCcw, color: 'text-amber-600' }]
        ),
        { id: 'track', label: 'Tracking & Journey', icon: Navigation, badge: null },
        ...(!isSupplier ? [{
          id: 'delivery-confirm',
          label: 'Delivery Sign-Off',
          icon: CheckCircle2,
          color: 'text-emerald-500',
          customBadge: (
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <QrCode className="w-2.5 h-2.5" />
              <span>QR</span>
            </span>
          )
        }] : [])
      ]
    },
    {
      section: 'ESCROW & WALLET',
      items: [
        { 
          id: 'wallet', 
          label: isSupplier ? 'Escrow & Rewards' : 'Escrow Wallet', 
          icon: Wallet, 
          customBadge: isSupplier && (Number(user?.walletBalance) || 0) < 0 ? (
            <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse border border-rose-300">
              DUE -₹{Math.abs(Number(user?.walletBalance)).toFixed(0)}
            </span>
          ) : null
        },
        { 
          id: 'refer', 
          label: 'Refer & Earn', 
          icon: Gift, 
          color: 'text-amber-500',
          customBadge: (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
              ₹40 FREE
            </span>
          )
        }
      ]
    },
    {
      section: 'ACCOUNT & HELP',
      items: [
        { 
          id: 'notifications', 
          label: 'Notifications', 
          icon: Bell,
          customBadge: notifCount > 0 ? (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {notifCount}
            </span>
          ) : null
        },
        { id: 'profile', label: 'Profile & Bank Payout', icon: Settings },
        { id: 'support', label: 'Help & Support', icon: HelpCircle, color: 'text-blue-500' },
        { id: 'legal', label: 'Merchant & Legal Info', icon: FileText, color: 'text-emerald-600' }
      ]
    },
    ...(isAdmin ? [
      {
        section: 'ADMINISTRATION',
        items: [
          {
            id: 'admin',
            label: 'Admin Console',
            icon: ShieldCheck,
            color: 'text-rose-600 font-extrabold',
            customBadge: (
              <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                EXEC
              </span>
            )
          }
        ]
      }
    ] : [])
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex-col h-screen sticky top-0 z-30 select-none shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Brand Header */}
        <div className="p-5 border-b border-slate-100/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E56E3] via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-blue-400/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-900 text-base tracking-tight">SecureKaro</h1>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{roleTitle}</p>
            </div>
          </div>

          {/* Quick Switch Role Pill */}
          <button
            type="button"
            onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
            className="mt-2.5 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 text-[11px] font-bold text-slate-700 hover:text-[#1E56E3] transition-all group shadow-2xs"
            title={`Switch to ${isSupplier ? 'Receiver (Buyer)' : 'Supplier (Merchant)'} Mode`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-300" />
              <span>Switch to {isSupplier ? 'Receiver' : 'Supplier'}</span>
            </span>
            <span className="text-[10px] font-extrabold text-[#1E56E3] bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
              {isSupplier ? 'Buyer' : 'Seller'}
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-3.5 py-4 space-y-5 overflow-y-auto flex-1 scrollbar-none">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                {group.section}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    data-tab={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        setCurrentTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group active:scale-[0.98] ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1E56E3] to-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : item.color || 'text-slate-500'
                      }`} />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {item.customBadge ? (
                      item.customBadge
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

      </div>
 
       {/* User Profile Badge at bottom */}
       <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
         <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
           <div className="flex items-center gap-2.5 min-w-0">
             <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 relative">
               {userInitials}
             </div>
             <div className="min-w-0 flex-1">
               <div className="flex items-center gap-1">
                 <p className="text-xs font-bold text-slate-900 truncate">
                   {user?.fullName || 'Kartick Das'}
                 </p>
               </div>
               <p className="text-[10px] text-slate-400 font-semibold capitalize truncate">
                 {user?.activeRole || user?.role || 'Supplier'}
               </p>
             </div>
           </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
              title={`Switch to ${isSupplier ? 'Receiver' : 'Supplier'} Mode`}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1E56E3] hover:bg-blue-50 transition"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
