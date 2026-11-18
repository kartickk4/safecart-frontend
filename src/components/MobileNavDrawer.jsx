import React, { useRef, useState, useEffect } from 'react';
import { 
  X, LayoutDashboard, Package, PlusCircle, Sparkles, RotateCcw, 
  Navigation, Wallet, Gift, Bell, Settings, HelpCircle, FileText, 
  ShieldCheck, LogOut, ArrowLeftRight, Calculator, Truck, ShoppingBag, 
  ChevronRight, CheckCircle2
} from 'lucide-react';
import { TAB_ROUTES } from '../utils/routes';

export default function MobileNavDrawer({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  user,
  currentRole,
  onSwitchRole,
  onSignOut,
  notifCount = 0
}) {
  const isSupplier = currentRole ? currentRole === 'Supplier' : (user?.role === 'Supplier' || user?.activeRole === 'Supplier');
  const isAdmin = user && (
    user.isAdmin === true ||
    user.role === 'Admin' ||
    user.role === 'super_admin' ||
    user.adminRole
  );

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'KD';

  // ── Gesture Navigation: Swipe-to-Dismiss (Left Swipe) ────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only track if horizontal swipe dominates vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Dismiss if dragged left by more than 60px
    if (dragOffset < -60) {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20]);
        }
      } catch (_) {}
      onClose();
    }
    setDragOffset(0);
  };

  if (!isOpen) return null;

  const navGroups = [
    {
      title: 'Core Logistics',
      items: [
        ...(isSupplier ? [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'create-shipment', label: 'Create Shipment', icon: PlusCircle, badge: 'New' },
          { id: 'ai-agent', label: 'AI Shipping Agent', icon: Sparkles, color: 'text-purple-600', badge: 'AI' }
        ] : []),
        { id: 'shipments-list', label: isSupplier ? 'All Shipments' : 'My Orders & Packages', icon: Package },
        { id: 'track', label: 'Live Tracking Journey', icon: Navigation },
        { id: 'rate-calculator', label: 'Courier Rate Calculator', icon: Calculator, color: 'text-blue-600' },
        ...(isSupplier ? [
          { id: 'return-orders', label: 'Return Orders & Tracking', icon: RotateCcw, color: 'text-amber-600' }
        ] : [
          { id: 'delivery-confirm', label: 'Delivery Sign-Off', icon: CheckCircle2, color: 'text-emerald-600' }
        ])
      ]
    },
    {
      title: 'Finance & Wallet',
      items: [
        { id: 'wallet', label: isSupplier ? 'Wallet & Payouts' : 'Order Wallet', icon: Wallet },
        { id: 'refer', label: 'Refer & Earn (₹30 Free)', icon: Gift, color: 'text-amber-500' }
      ]
    },
    {
      title: 'Account & Support',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifCount > 0 ? `${notifCount}` : null },
        { id: 'profile', label: 'Profile & Bank Details', icon: Settings },
        { id: 'support', label: 'Help & Support', icon: HelpCircle, color: 'text-blue-500' },
        { id: 'legal', label: 'Legal & Compliance', icon: FileText, color: 'text-emerald-600' },
        ...(isAdmin ? [
          { id: 'admin', label: 'Admin Console', icon: ShieldCheck, color: 'text-rose-500', badge: 'EXEC' }
        ] : [])
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 lg:hidden flex select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragOffset < 0 ? `translateX(${dragOffset}px)` : 'translateX(0)',
          transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200/80 animate-in slide-in-from-left duration-250"
      >
        {/* Drawer Header: User Info & Close */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 text-sm truncate">
                  {user?.fullName || 'Partner'}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold truncate">
                  {user?.phone ? `+91 ${user.phone.slice(-10)}` : user?.email || 'SecureKaro User'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition btn-press cursor-pointer shrink-0"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Role Switcher Pill */}
          <button
            type="button"
            onClick={() => {
              onSwitchRole?.(isSupplier ? 'Receiver' : 'Supplier');
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-[11px] font-bold text-slate-700 hover:text-[#1E56E3] transition shadow-2xs btn-press cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch to {isSupplier ? 'Receiver (Buyer)' : 'Supplier (Seller)'}</span>
            </span>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
              isSupplier ? 'bg-blue-50 text-[#1E56E3] border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              {isSupplier ? 'Buyer' : 'Seller'}
            </span>
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 btn-press cursor-pointer ${
                      isActive
                        ? 'bg-[#1E56E3] text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color || 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-blue-100 text-[#1E56E3]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Drawer Footer: Gesture cue & Sign Out */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <p className="text-[10px] text-slate-400 text-center font-medium">
            Swipe left to close
          </p>
          <button
            onClick={() => {
              onClose();
              onSignOut?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 transition btn-press cursor-pointer border border-rose-200/80"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
