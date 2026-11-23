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
        section: 'Overview',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            iconColor: 'text-[#1E56E3]',
            iconBg: 'bg-blue-50 text-[#1E56E3]',
            activeClass: 'bg-blue-50/90 text-[#1E56E3] font-bold border-blue-200/80',
            badge: null
          },
          {
            id: 'rate-calculator',
            label: 'Rate Calculator',
            icon: Calculator,
            iconColor: 'text-sky-600',
            iconBg: 'bg-sky-50 text-sky-600',
            activeClass: 'bg-sky-50/90 text-sky-700 font-bold border-sky-200/80'
          },
          {
            id: 'roi-calculator',
            label: 'Savings Calculator',
            icon: Calculator,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 text-emerald-600',
            activeClass: 'bg-emerald-50/90 text-emerald-700 font-bold border-emerald-200/80'
          }
        ]
      }
    ] : []),
    {
      section: 'Shipments & orders',
      items: [
        {
          id: 'shipments-list',
          label: isSupplier ? 'All Shipments' : 'My Orders & Packages',
          icon: Package,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50 text-indigo-600',
          activeClass: 'bg-indigo-50/90 text-indigo-700 font-bold border-indigo-200/80',
          badge: null
        },
        ...(isSupplier ? [
          {
            id: 'create-shipment',
            label: 'Create Shipment',
            icon: PlusCircle,
            highlight: true,
            iconColor: 'text-[#1E56E3]',
            iconBg: 'bg-blue-100 text-[#1E56E3]',
            activeClass: 'bg-blue-50/90 text-[#1E56E3] font-bold border-blue-200/80'
          },
          {
            id: 'ai-agent',
            label: 'AI Shipping Agent',
            icon: Sparkles,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50 text-purple-600',
            activeClass: 'bg-purple-50/90 text-purple-700 font-bold border-purple-200/80',
            customBadge: (
              <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                AI
              </span>
            )
          }
        ] : []),
        ...(isSupplier
          ? [{
              id: 'return-orders',
              label: 'Return Orders & Tracking',
              icon: RotateCcw,
              iconColor: 'text-amber-600',
              iconBg: 'bg-amber-50 text-amber-600',
              activeClass: 'bg-amber-50/90 text-amber-700 font-bold border-amber-200/80'
            }]
          : [{
              id: 'return-tracking',
              label: 'Returns & Tracking',
              icon: RotateCcw,
              iconColor: 'text-amber-600',
              iconBg: 'bg-amber-50 text-amber-600',
              activeClass: 'bg-amber-50/90 text-amber-700 font-bold border-amber-200/80'
            }]
        ),
        {
          id: 'track',
          label: 'Tracking & Journey',
          icon: Navigation,
          iconColor: 'text-cyan-600',
          iconBg: 'bg-cyan-50 text-cyan-600',
          activeClass: 'bg-cyan-50/90 text-cyan-700 font-bold border-cyan-200/80',
          badge: null
        },
        ...(!isSupplier ? [{
          id: 'delivery-confirm',
          label: 'Delivery Sign-Off',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 text-emerald-600',
          activeClass: 'bg-emerald-50/90 text-emerald-700 font-bold border-emerald-200/80',
          customBadge: (
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200/80">
              <QrCode className="w-2.5 h-2.5" />
              <span>QR</span>
            </span>
          )
        }] : [])
      ]
    },
    {
      section: 'Wallet & rewards',
      items: [
        {
          id: 'wallet',
          label: isSupplier ? 'Wallet & Payouts' : 'Order Wallet',
          icon: Wallet,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 text-emerald-600',
          activeClass: 'bg-emerald-50/90 text-emerald-700 font-bold border-emerald-200/80',
          customBadge: isSupplier && (Number(user?.walletBalance) || 0) < 0 ? (
            <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-rose-200">
              Due -₹{Math.abs(Number(user?.walletBalance)).toFixed(0)}
            </span>
          ) : null
        },
        {
          id: 'refer',
          label: 'Refer & Earn',
          icon: Gift,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-50 text-amber-600',
          activeClass: 'bg-amber-50/90 text-amber-700 font-bold border-amber-200/80',
          customBadge: (
            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
              ₹30 bonus
            </span>
          )
        }
      ]
    },
    {
      section: 'Account & settings',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50 text-blue-600',
          activeClass: 'bg-blue-50/90 text-blue-700 font-bold border-blue-200/80',
          customBadge: notifCount > 0 ? (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {notifCount}
            </span>
          ) : null
        },
        {
          id: 'profile',
          label: 'Profile & Bank Payout',
          icon: Settings,
          iconColor: 'text-violet-600',
          iconBg: 'bg-violet-50 text-violet-600',
          activeClass: 'bg-violet-50/90 text-violet-700 font-bold border-violet-200/80'
        },
        {
          id: 'support',
          label: 'Help & Support',
          icon: HelpCircle,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50 text-blue-600',
          activeClass: 'bg-blue-50/90 text-blue-700 font-bold border-blue-200/80'
        },
        {
          id: 'legal',
          label: 'Merchant & Legal Info',
          icon: FileText,
          iconColor: 'text-teal-600',
          iconBg: 'bg-teal-50 text-teal-600',
          activeClass: 'bg-teal-50/90 text-teal-700 font-bold border-teal-200/80'
        }
      ]
    },
    ...(isAdmin ? [
      {
        section: 'Administration',
        items: [
          {
            id: 'admin',
            label: 'Admin Console',
            icon: ShieldCheck,
            iconColor: 'text-rose-600',
            iconBg: 'bg-rose-50 text-rose-600',
            activeClass: 'bg-rose-50/90 text-rose-700 font-bold border-rose-200/80',
            customBadge: (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                Admin
              </span>
            )
          }
        ]
      }
    ] : [])
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 z-30 select-none bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)] transition-[width] duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-[72px]' : 'w-64'
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
              className="mt-2.5 w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 text-[11px] font-bold text-blue-950 transition-all group shadow-2xs btn-press cursor-pointer"
              title={`Switch to ${isSupplier ? 'Receiver (Buyer)' : 'Supplier (Merchant)'} Mode`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#1E56E3] group-hover:rotate-180 transition-transform duration-300 shrink-0" />
                <span>Switch to {isSupplier ? 'Receiver' : 'Supplier'}</span>
              </span>
              <span className="text-[10px] font-bold text-white bg-[#1E56E3] px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                {isSupplier ? 'Buyer' : 'Seller'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSwitchRole && onSwitchRole(isSupplier ? 'Receiver' : 'Supplier')}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E56E3] border border-blue-200/80 transition btn-press cursor-pointer"
              title={`Switch to ${isSupplier ? 'Receiver (Buyer)' : 'Supplier (Merchant)'} Mode`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#1E56E3]" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className={`space-y-4 overflow-y-auto flex-1 scrollbar-none ${isCollapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {!isCollapsed ? (
                <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 mt-2">
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
                    className={`relative flex items-center rounded-xl transition-all duration-150 group btn-press cursor-pointer select-none ${isCollapsed
                        ? 'justify-center p-2 mx-auto w-10 h-10'
                        : 'justify-between px-2.5 py-1.5 w-full text-xs font-semibold'
                      } ${isActive
                        ? (item.activeClass ? `${item.activeClass} border shadow-2xs` : 'bg-blue-50 text-[#1E56E3] font-bold border border-blue-200/80 shadow-2xs')
                        : 'text-slate-700 hover:bg-slate-50/90 hover:text-slate-900 border border-transparent'
                      }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? (item.iconBg || 'bg-blue-100 text-[#1E56E3]') + ' shadow-2xs font-bold'
                          : (item.iconBg ? `${item.iconBg} ${item.iconColor}` : 'bg-slate-100 text-slate-600')
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      item.customBadge ? (
                        item.customBadge
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      ) : null
                    )}

                    {/* Mini Badge / Status Dot in collapsed mode */}
                    {isCollapsed && (
                      isActive ? (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1E56E3] ring-2 ring-white"></span>
                      ) : (item.customBadge || (item.id === 'notifications' && notifCount > 0)) ? (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white"></span>
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
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
              onClick={() => setCurrentTab('profile')}
              title="Open Profile & Bank Payout Settings"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E56E3] via-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/25">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || 'SecureKaro User'}
                </p>
                <p className="text-[10px] text-blue-600 font-bold capitalize truncate">
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
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E56E3] via-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center cursor-pointer shadow-xs shadow-blue-500/25 hover:opacity-90 transition"
              onClick={() => setCurrentTab('profile')}
              title={`Profile: ${user?.fullName || 'SecureKaro User'}`}
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
