import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Gift
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
  const [editSlotIndex, setEditSlotIndex] = useState(0);

  // Guide visibility state
  const guideStorageKey = `securekaro_nav_guide_seen_${user?._id || 'guest'}`;
  const [showGuide, setShowGuide] = useState(() => {
    try {
      const seen = localStorage.getItem(guideStorageKey);
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
    setEditSlotIndex(0);
    setIsEditOpen(true);
  };

  // ⚡ LONG-PRESS & INSTANT TAP ENGINE
  const [pressedSlotIndex, setPressedSlotIndex] = useState(null);
  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const startLongPress = useCallback((slotIndex) => {
    isLongPressTriggered.current = false;
    setPressedSlotIndex(slotIndex);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setPressedSlotIndex(null);
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([35, 45]);
        }
      } catch (_) {}
      handleDismissGuide();
      setEditSlotIndex(slotIndex);
      setIsEditOpen(true);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressedSlotIndex(null);
  }, []);

  const handleSlotClick = (tabKey, e) => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      e?.preventDefault();
      return;
    }
    cancelLongPress();
    setCurrentTab(tabKey);
  };

  const handleSaveSlots = (newSlots) => {
    setSlots(newSlots);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSlots));
    } catch (_) {}
  };

  // Helper to render one slot tab with perfect baseline and width alignment
  const renderTab = (tabKey, slotIndex) => {
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
    const isPressed = pressedSlotIndex === slotIndex;

    return (
      <button
        key={`${tabKey}_${slotIndex}`}
        onClick={(e) => handleSlotClick(tabKey, e)}
        onTouchStart={(e) => {
          touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          startLongPress(slotIndex);
        }}
        onTouchMove={(e) => {
          const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
          const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
          if (moveX > 10 || moveY > 10) {
            cancelLongPress();
          }
        }}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onMouseDown={() => startLongPress(slotIndex)}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full max-w-[64px] h-[52px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all relative select-none cursor-pointer ${
          isPressed
            ? 'scale-90 bg-indigo-100/90 ring-2 ring-indigo-400 text-indigo-700'
            : isActive
              ? isAiAgent
                ? 'text-purple-600 bg-purple-50/90 font-extrabold shadow-2xs'
                : 'text-[#1E56E3] bg-blue-50/90 font-extrabold shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 active:scale-95'
        }`}
        title={`Tap to open ${label} • Long press to customize`}
      >
        <div className="relative flex items-center justify-center w-6 h-6">
          <Icon className={`w-5 h-5 ${isAiAgent && isActive ? 'text-purple-600 stroke-[2.2]' : 'stroke-[2.2]'}`} />
          {isNotifications && notifCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1.5 ring-white shadow-2xs leading-none">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>
        <span className="w-full text-[9.5px] font-bold leading-tight truncate text-center px-0.5">
          {label}
        </span>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 pt-1 pb-2 pb-safe z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] select-none">
        {/* 5-Column Symmetrical Grid */}
        <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto">
          {/* SLOT 1 (Left 1) */}
          <div className="flex items-center justify-center w-full">
            {renderTab(slots[0], 0)}
          </div>

          {/* SLOT 2 (Left 2) */}
          <div className="flex items-center justify-center w-full">
            {renderTab(slots[1], 1)}
          </div>

          {/* SLOT 3: CENTER ACTION (Centered 54px floating circle, always pinned & fixed) */}
          <div className="flex items-center justify-center w-full">
            {isSupplier ? (
              <button
                onClick={() => setCurrentTab('create-shipment')}
                className="flex flex-col items-center justify-center -mt-6 w-[52px] h-[52px] bg-gradient-to-tr from-[#0D38A8] via-[#1E56E3] to-[#3B82F6] text-white rounded-full shadow-lg shadow-blue-600/35 active:scale-95 transition-transform border-[3px] border-white cursor-pointer"
                title="Book Courier Shipment"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[8px] font-black tracking-tight leading-none mt-0.5 uppercase">Ship</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('delivery-confirm')}
                className="flex flex-col items-center justify-center -mt-6 w-[52px] h-[52px] bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-600/35 active:scale-95 transition-transform border-[3px] border-white cursor-pointer"
                title="Inspect & Sign Off Delivery"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[8px] font-black tracking-tight leading-none mt-0.5 uppercase">Sign</span>
              </button>
            )}
          </div>

          {/* SLOT 4 (Right 1) */}
          <div className="flex items-center justify-center w-full">
            {renderTab(slots[2], 2)}
          </div>

          {/* SLOT 5 (Right 2) */}
          <div className="flex items-center justify-center w-full">
            {renderTab(slots[3], 3)}
          </div>
        </div>
      </div>

      {/* EDIT SHEET (SLIDES UP ON LONG-PRESS OR GUIDE) */}
      <BottomNavEditSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentSlots={slots}
        onSaveSlots={handleSaveSlots}
        isSupplier={isSupplier}
        notifCount={notifCount}
        defaultSlots={defaultSlots}
        initialSlotIndex={editSlotIndex}
      />
    </>
  );
}
