import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Navigation,
  PlusCircle,
  CheckCircle2,
  User,
  Bell,
  Wallet,
  Sparkles,
  RotateCcw,
  Gift,
  ChevronUp
} from 'lucide-react';
import BottomNavEditSheet, { getOptionDefinition, getOptionLabel } from './BottomNavEditSheet';
import BottomNavGuide from './BottomNavGuide';

export default function BottomNav({
  currentTab,
  setCurrentTab,
  isSupplier,
  user,
  notifCount = 0,
  isNewUser = false
}) {
  const defaultSlots = isSupplier
    ? ['dashboard', 'ai-agent', 'wallet', 'profile']
    : ['shipments-list', 'track', 'wallet', 'profile'];

  const storageKey = `securekaro_bottom_nav_slots_${user?._id || 'guest'}_${isSupplier ? 'supplier' : 'receiver'}`;

  // Read saved slots from localStorage or fallback to defaults
  const [slots, setSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch (_) {}
    return defaultSlots;
  });

  // Re-sync slots when user or role changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          setSlots(parsed);
          return;
        }
      }
    } catch (_) {}
    setSlots(defaultSlots);
  }, [user?._id, isSupplier]);

  const [isEditOpen, setIsEditOpen] = useState(false);

  // Guide visibility state
  const guideStorageKey = `securekaro_nav_guide_seen_${user?._id || 'guest'}`;
  const [showGuide, setShowGuide] = useState(() => {
    try {
      const seen = localStorage.getItem(guideStorageKey);
      // Show if not seen yet
      return !seen;
    } catch (_) {
      return false;
    }
  });

  const handleDismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem(guideStorageKey, 'true');
    } catch (_) {}
  };

  const handleOpenEditFromGuide = () => {
    handleDismissGuide();
    setIsEditOpen(true);
  };

  // Touch gesture handling for Swipe-Up on bottom bar
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    touchDeltaY.current = currentY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    // If swipe UP by more than 30px, open edit sheet
    if (touchDeltaY.current < -30) {
      handleDismissGuide();
      setIsEditOpen(true);
    }
  };

  const handleSaveSlots = (newSlots) => {
    setSlots(newSlots);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSlots));
    } catch (_) {}
  };

  // Helper to render one slot tab
  const renderTab = (tabKey) => {
    const opt = getOptionDefinition(tabKey, isSupplier);
    const Icon = opt?.icon || LayoutDashboard;
    const label = getOptionLabel(tabKey, isSupplier);

    // Check if this tab is active
    let isActive = false;
    if (tabKey === 'dashboard' || tabKey === 'shipments-list') {
      isActive = currentTab === 'dashboard' || currentTab === 'shipments-list';
    } else {
      isActive = currentTab === tabKey;
    }

    const isAiAgent = tabKey === 'ai-agent';
    const isNotifications = tabKey === 'notifications';

    return (
      <button
        key={tabKey}
        onClick={() => setCurrentTab(tabKey)}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all press-spring relative ${
          isActive
            ? isAiAgent
              ? 'text-purple-600 bg-purple-50/80 font-extrabold'
              : 'text-[#1E56E3] bg-blue-50/80 font-extrabold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <Icon className={`w-5 h-5 ${isAiAgent && isActive ? 'text-purple-600 stroke-[2.2]' : 'stroke-[2.2]'}`} />
          {isNotifications && notifCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1 ring-white">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>
        <span className="truncate max-w-[58px] text-center">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* ONBOARDING GUIDE TOOLTIP (Floating above the bottom bar) */}
      <BottomNavGuide
        isOpen={showGuide}
        onOpenEdit={handleOpenEditFromGuide}
        onDismiss={handleDismissGuide}
      />

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/70 px-3 pt-1 pb-1.5 pb-safe flex flex-col z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] select-none"
      >
        {/* Subtle Top Drag Handle Pill (Tap or swipe up to edit) */}
        <div
          onClick={() => {
            handleDismissGuide();
            setIsEditOpen(true);
          }}
          className="w-full flex justify-center py-0.5 cursor-pointer group"
          title="Swipe up or tap to customize menu"
        >
          <div className="w-9 h-1 bg-slate-300 rounded-full group-hover:bg-[#1E56E3] group-active:bg-[#1E56E3] transition-colors" />
        </div>

        {/* 5-Slot Bottom Navigation Items */}
        <div className="flex items-center justify-around w-full">
          {/* SLOT 1 (Left 1) */}
          {renderTab(slots[0])}

          {/* SLOT 2 (Left 2) */}
          {renderTab(slots[1])}

          {/* SLOT 3: CENTER ACTION (56px floating circle, always pinned & fixed) */}
          {isSupplier ? (
            <button
              onClick={() => setCurrentTab('create-shipment')}
              className="flex flex-col items-center justify-center -mt-6 w-14 h-14 bg-gradient-to-tr from-[#0D38A8] via-[#1E56E3] to-[#3B82F6] text-white rounded-full shadow-lg shadow-blue-600/35 active:scale-95 transition-transform border-[3px] border-white press-spring"
              title="Book Courier Shipment"
            >
              <PlusCircle className="w-6 h-6 stroke-[2.5]" />
              <span className="text-[8.5px] font-black tracking-tight leading-none mt-0.5 uppercase">Ship</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab('delivery-confirm')}
              className="flex flex-col items-center justify-center -mt-6 w-14 h-14 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-600/35 active:scale-95 transition-transform border-[3px] border-white press-spring"
              title="Inspect & Sign Off Delivery"
            >
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              <span className="text-[8.5px] font-black tracking-tight leading-none mt-0.5 uppercase">Sign</span>
            </button>
          )}

          {/* SLOT 4 (Right 1) */}
          {renderTab(slots[2])}

          {/* SLOT 5 (Right 2) */}
          {renderTab(slots[3])}
        </div>
      </div>

      {/* EDIT SHEET (SLIDES UP ON SWIPE-UP OR TAP ON HANDLE) */}
      <BottomNavEditSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentSlots={slots}
        onSaveSlots={handleSaveSlots}
        isSupplier={isSupplier}
        notifCount={notifCount}
        defaultSlots={defaultSlots}
      />
    </>
  );
}
