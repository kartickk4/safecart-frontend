import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, PlusCircle, Navigation, Wallet, 
  AlertCircle, FileText, Bell, Settings, LogOut, Package, CheckCircle2, UserCheck, HelpCircle, ChevronRight, Sparkles, RotateCcw, ArrowLeftRight, Truck, ShoppingBag, Crown, Gift, QrCode, Calculator,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { TAB_ROUTES } from '../utils/routes';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  currentRole, 
  onSwitchRole, 
  onSignOut, 
  openNewShipmentModal, 
  notifCount = 0,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('securekaro_sidebar_collapsed') === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(next);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('securekaro_sidebar_collapsed', String(next));
    }
    if (onToggleCollapse) {
      onToggleCollapse(next);
    }
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle persistent sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const isSupplier = currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier');
  const roleTitle = isSupplier ? 'Supplier Platform' : 'Buyer Order Portal';
  const isAdmin = user && (
    user.isAdmin === true ||
    user.role === 'Admin' ||
    user.role === 'super_admin' ||
    user.adminRole
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
            id: 'rate-calculator',
            label: 'Rate Calculator',
            icon: Calculator,
            color: 'text-[#1E56E3]',
            customBadge: (
              <span className="bg-blue-100 text-[#1E56E3] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-2xs">
                LIVE
              </span>
            )
          },
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
      section: 'WALLET & REWARDS',
      items: [
        { 
          id: 'wallet', 
          label: isSupplier ? 'Wallet & Payouts' : 'Order Wallet', 
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
              ₹30 FREE
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
    <aside 
      className={`hidden md:flex flex-col h-screen sticky top-0 z-30 select-none bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)] transition-[width] duration-300 ease-in-out shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Brand Header */}
        <div className={`border-b border-slate-100/90 transition-all ${isCollapsed ? 'p-3 flex flex-col items-center gap-2' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col justify-center gap-2' : 'justify-between'} w-full`}>
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
              <img 
                loading="lazy" 
                src="/logo.jpg" 
                alt="SecureKaro" 
                className={`${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl object-cover shadow-md shadow-blue-500/15 border border-slate-200/80 bg-white transition-all`} 
              />
              {!isCollapsed && (
                <div className="min-w-0 animate-in fade-in duration-150">
                  <h1 className="font-black text-slate-900 text-sm tracking-tight truncate">SecureKaro</h1>
                  <p className="text-[10px] text-slate-500 font-semibold truncate leading-tight">{roleTitle}</p>
                </div>
              )}
            </div>

            {/* Persistent Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition btn-press cursor-pointer shrink-0"
              title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#1E56E3]" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Role Switch Pill */}
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
              className="mt-2.5 w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-200 text-[11px] font-bold text-slate-700 hover:text-[#1E56E3] transition-all group shadow-2xs btn-press cursor-pointer"
              title={`Switch to ${isSupplier ? 'Receiver (Buyer)' : 'Supplier (Merchant)'} Mode`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-300 shrink-0" />
                <span>Switch to {isSupplier ? 'Receiver' : 'Supplier'}</span>
              </span>
              <span className="text-[10px] font-extrabold text-[#1E56E3] bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 shrink-0">
                {isSupplier ? 'Buyer' : 'Seller'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#1E56E3] border border-slate-200/80 transition btn-press cursor-pointer"
              title={`Switch to ${isSupplier ? 'Receiver (Buyer)' : 'Supplier (Merchant)'} Mode`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className={`space-y-4 overflow-y-auto flex-1 scrollbar-none ${isCollapsed ? 'px-2 py-3' : 'px-3.5 py-3'}`}>
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed ? (
                <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                  {group.section}
                </p>
              ) : (
                <div className="my-2 border-t border-slate-100/90" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const routeUrl = TAB_ROUTES[item.id] || `/${item.id}`;

                return (
                  <a
                    key={item.id}
                    href={routeUrl}
                    data-tab={item.id}
                    title={item.label}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        setCurrentTab(item.id);
                      }
                    }}
                    className={`relative flex items-center rounded-xl transition-all duration-150 group btn-press cursor-pointer select-none ${
                      isCollapsed 
                        ? 'justify-center p-2.5 mx-auto w-10 h-10' 
                        : 'justify-between px-3 py-2 w-full text-xs font-bold'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1E56E3] to-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/20'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                        isActive ? 'text-white' : item.color || 'text-slate-500'
                      }`} />
                      {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      item.customBadge ? (
                        item.customBadge
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                      ) : null
                    )}

                    {/* Mini Badge / Pulse Dot in collapsed mode */}
                    {isCollapsed && (
                      isActive ? (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-300 ring-2 ring-white"></span>
                      ) : (item.customBadge || (item.id === 'notifications' && notifCount > 0)) ? (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
                      ) : null
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>
 
      {/* User Profile Badge at bottom */}
      <div className={`border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div 
              className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
              onClick={() => setCurrentTab('profile')}
              title="Open Profile & Bank Payout Settings"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 relative">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || 'Kartick Das'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold capitalize truncate">
                  {user?.activeRole || user?.role || 'Supplier'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
                title={`Switch to ${isSupplier ? 'Receiver' : 'Supplier'} Mode`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E56E3] hover:bg-blue-50 transition"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setCurrentTab('profile')}
              title={`Profile: ${user?.fullName || 'Kartick Das'}`}
            >
              {userInitials}
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
