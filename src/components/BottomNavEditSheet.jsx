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
  Gift,
  Lock,
  X,
  Check,
  ChevronDown,
  ArrowUpRight,
  SlidersHorizontal,
  Compass,
  HelpCircle,
  Calculator
} from 'lucide-react';

export const NAV_AVAILABLE_OPTIONS = [
  {
    id: 'dashboard',
    receiverId: 'shipments-list',
    labelSupplier: 'Dashboard',
    labelReceiver: 'Orders',
    shortLabelSupplier: 'Home',
    shortLabelReceiver: 'Orders',
    icon: LayoutDashboard,
    desc: 'Overview and order pipeline',
    color: 'text-[#1E56E3]',
    bg: 'bg-blue-50'
  },
  {
    id: 'rate-calculator',
    labelSupplier: 'Rate Calculator',
    labelReceiver: 'Rate Calculator',
    shortLabelSupplier: 'Rates',
    shortLabelReceiver: 'Rates',
    icon: Calculator,
    desc: 'Live multi-courier shipping rates',
    color: 'text-[#1E56E3]',
    bg: 'bg-blue-50'
  },
  {
    id: 'roi-calculator',
    labelSupplier: 'Savings Calculator',
    labelReceiver: 'Savings Calculator',
    shortLabelSupplier: 'Savings',
    shortLabelReceiver: 'Savings',
    icon: Calculator,
    desc: 'COD vs shipping savings calculator',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    supplierOnly: true
  },
  {
    id: 'ai-agent',
    labelSupplier: 'AI Agent',
    labelReceiver: 'AI Agent',
    icon: Sparkles,
    desc: 'Shipping assistant & dispute resolver',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    supplierOnly: true // ⚡ EXCLUSIVELY FOR MERCHANTS / SUPPLIERS
  },
  {
    id: 'wallet',
    labelSupplier: 'Wallet',
    labelReceiver: 'Wallet',
    icon: Wallet,
    desc: 'Balance, payouts & passbook',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    id: 'profile',
    labelSupplier: 'Profile',
    labelReceiver: 'Profile',
    icon: User,
    desc: 'Account & delivery settings',
    color: 'text-slate-700',
    bg: 'bg-slate-100'
  },
  {
    id: 'track',
    labelSupplier: 'Tracking',
    labelReceiver: 'Tracking',
    icon: Navigation,
    desc: 'Live journey & AWB tracking',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  {
    id: 'return-orders',
    labelSupplier: 'Return',
    labelReceiver: 'Return',
    icon: RotateCcw,
    desc: 'Return orders & reverse pickups',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    supplierOnly: true // ⚡ EXCLUSIVELY FOR MERCHANTS / SUPPLIERS
  },
  {
    id: 'notifications',
    labelSupplier: 'Notifications',
    labelReceiver: 'Notifications',
    shortLabelSupplier: 'Alerts',
    shortLabelReceiver: 'Alerts',
    icon: Bell,
    desc: 'Alerts, updates & OTP notices',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    hasBadge: true
  },
  {
    id: 'refer',
    labelSupplier: 'Refer & Earn',
    labelReceiver: 'Refer & Earn',
    shortLabelSupplier: 'Rewards',
    shortLabelReceiver: 'Rewards',
    icon: Gift,
    desc: 'Ambassador earnings & bonus',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    id: 'support',
    labelSupplier: 'Support',
    labelReceiver: 'Help & Support',
    shortLabelSupplier: 'Support',
    shortLabelReceiver: 'Support',
    icon: HelpCircle,
    desc: 'Helpline, disputes & FAQs',
    color: 'text-teal-600',
    bg: 'bg-teal-50'
  }
];

export function getAvailableOptions(isSupplier) {
  return NAV_AVAILABLE_OPTIONS.filter(opt => isSupplier ? !opt.receiverOnly : !opt.supplierOnly);
}

export function getOptionDefinition(tabKey, isSupplier) {
  if (!tabKey) return null;
  return (
    NAV_AVAILABLE_OPTIONS.find(
      opt => opt.id === tabKey || (opt.receiverId && opt.receiverId === tabKey)
    ) || {
      id: tabKey,
      labelSupplier: tabKey,
      labelReceiver: tabKey,
      icon: LayoutDashboard,
      desc: '',
      color: 'text-slate-700',
      bg: 'bg-slate-100'
    }
  );
}

export function getOptionLabel(tabKey, isSupplier, useShort = false) {
  const def = getOptionDefinition(tabKey, isSupplier);
  if (!def) return tabKey;
  return isSupplier ? ((useShort && def.shortLabelSupplier) || def.labelSupplier) : ((useShort && def.shortLabelReceiver) || def.labelReceiver);
}

export default function BottomNavEditSheet({
  isOpen,
  onClose,
  currentSlots,
  onSaveSlots,
  isSupplier,
  notifCount = 0,
  defaultSlots = [],
  initialSlotIndex = 0,
  initialIsEditMode = false,
  onNavigateTab
}) {
  const sanitizeBuyerSlots = (slots) => {
    if (!isSupplier && Array.isArray(slots)) {
      const supplierOnlyTabs = new Set(['ai-agent', 'return-orders', 'create-shipment', 'dashboard']);
      const validDefaults = ['shipments-list', 'track', 'wallet', 'profile'];
      return slots.map((s, idx) => supplierOnlyTabs.has(s) ? validDefaults[idx] : s);
    }
    return slots;
  };

  const [activeSlots, setActiveSlots] = useState(() => sanitizeBuyerSlots([...currentSlots]));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(initialSlotIndex || 0);
  const [isEditMode, setIsEditMode] = useState(initialIsEditMode);

  const sheetRef = useRef(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);

  // Long-press detection on cards inside the sheet
  const cardPressTimer = useRef(null);
  const isCardLongPress = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setActiveSlots(sanitizeBuyerSlots([...currentSlots]));
      setSelectedSlotIndex(initialSlotIndex || 0);
      setIsEditMode(initialIsEditMode);
    }
  }, [isOpen, currentSlots, initialSlotIndex, initialIsEditMode, isSupplier]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    touchDeltaY.current = currentY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    // Swipe down to dismiss
    if (touchDeltaY.current > 60) {
      handleDone();
    }
  };

  const handleMoveSlot = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= 4 || fromIndex === toIndex) return;
    const nextSlots = [...activeSlots];
    const temp = nextSlots[fromIndex];
    nextSlots[fromIndex] = nextSlots[toIndex];
    nextSlots[toIndex] = temp;
    setActiveSlots(nextSlots);
    setSelectedSlotIndex(toIndex);
  };

  const handleSelectOptionForSlot = (opt) => {
    const targetKey = (!isSupplier && opt.receiverId) ? opt.receiverId : opt.id;
    const existingIndex = activeSlots.findIndex(s => s === targetKey || (opt.receiverId && s === opt.id) || (s === opt.receiverId));

    const nextSlots = [...activeSlots];

    if (existingIndex !== -1) {
      // Swap slots
      const temp = nextSlots[selectedSlotIndex];
      nextSlots[selectedSlotIndex] = nextSlots[existingIndex];
      nextSlots[existingIndex] = temp;
    } else {
      nextSlots[selectedSlotIndex] = targetKey;
    }

    setActiveSlots(nextSlots);
    setSelectedSlotIndex((selectedSlotIndex + 1) % 4);
  };

  // Single Click handler on any feature card
  const handleCardClick = (opt) => {
    if (isCardLongPress.current) {
      isCardLongPress.current = false;
      return;
    }

    if (isEditMode) {
      // In Edit Mode: assign to selected slot
      handleSelectOptionForSlot(opt);
    } else {
      // In Navigation Mode: Immediately redirect to that page!
      const targetKey = (!isSupplier && opt.receiverId) ? opt.receiverId : opt.id;
      if (onNavigateTab) {
        onNavigateTab(targetKey);
      }
    }
  };

  // Long press handler on feature card to trigger edit mode
  const startCardLongPress = (opt) => {
    isCardLongPress.current = false;
    cardPressTimer.current = setTimeout(() => {
      isCardLongPress.current = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([35, 45]);
        }
      } catch (_) {}
      setIsEditMode(true);
      handleSelectOptionForSlot(opt);
    }, 450);
  };

  const cancelCardLongPress = () => {
    if (cardPressTimer.current) {
      clearTimeout(cardPressTimer.current);
      cardPressTimer.current = null;
    }
  };

  const handleReset = () => {
    if (defaultSlots && defaultSlots.length === 4) {
      setActiveSlots([...defaultSlots]);
      setSelectedSlotIndex(0);
    }
  };

  const handleDone = () => {
    if (isEditMode) {
      onSaveSlots(activeSlots);
    }
    onClose();
  };

  const isOptionActive = (opt) => {
    const targetKey = (!isSupplier && opt.receiverId) ? opt.receiverId : opt.id;
    return activeSlots.some(s => s === targetKey || s === opt.id || (opt.receiverId && s === opt.receiverId));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={handleDone}
      />

      {/* Main Drawer Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/90 max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-safe z-10"
      >
        {/* Drag handle */}
        <div className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors" />
        </div>

        {/* Header with Mode Toggle & Action Buttons */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {isEditMode ? 'Customise Bottom Menu' : 'All Features & Navigation'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isEditMode 
                ? 'Tap a slot above, then tap any option to swap' 
                : 'Tap any option to open page • Long press to modify bottom bar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isEditMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-[#1E56E3] border border-blue-200/70'
              }`}
              title={isEditMode ? 'Switch to Navigation Mode' : 'Switch to Customization Mode'}
            >
              {isEditMode ? <Compass className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
              <span>{isEditMode ? 'Browse' : 'Edit Bar'}</span>
            </button>

            {/* Done / Close Button */}
            <button
              onClick={handleDone}
              className="px-3.5 py-1.5 bg-[#1E56E3] hover:bg-[#1649CC] active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isEditMode ? 'Save' : 'Done'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 py-3 space-y-4 max-h-[calc(88vh-110px)]">
          {/* Bottom Bar Layout Preview (Shown always, extra controls in Edit Mode) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">
                Your Bottom Bar Slots
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {isSupplier ? 'Center: Quick Ship' : 'Center: Parcel Sign-Off'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {/* Slot 0 (Left 1) */}
              {(() => {
                const opt = getOptionDefinition(activeSlots[0], isSupplier);
                const Icon = opt?.icon || LayoutDashboard;
                const isSelected = selectedSlotIndex === 0 && isEditMode;
                return (
                  <button
                    onClick={() => {
                      setSelectedSlotIndex(0);
                      setIsEditMode(true);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative border cursor-pointer ${
                      isSelected
                        ? 'border-[#1E56E3] bg-blue-50/80 ring-2 ring-blue-500/30 scale-102 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-black text-slate-400 mb-0.5">Slot 1</span>
                    <Icon className={`w-5 h-5 ${opt?.color || 'text-slate-700'}`} />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center mt-1">
                      {getOptionLabel(activeSlots[0], isSupplier)}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E56E3] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>
                );
              })()}

              {/* Slot 1 (Left 2) */}
              {(() => {
                const opt = getOptionDefinition(activeSlots[1], isSupplier);
                const Icon = opt?.icon || Sparkles;
                const isSelected = selectedSlotIndex === 1 && isEditMode;
                return (
                  <button
                    onClick={() => {
                      setSelectedSlotIndex(1);
                      setIsEditMode(true);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative border cursor-pointer ${
                      isSelected
                        ? 'border-[#1E56E3] bg-blue-50/80 ring-2 ring-blue-500/30 scale-102 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-black text-slate-400 mb-0.5">Slot 2</span>
                    <Icon className={`w-5 h-5 ${opt?.color || 'text-slate-700'}`} />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center mt-1">
                      {getOptionLabel(activeSlots[1], isSupplier)}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E56E3] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>
                );
              })()}

              {/* Pinned Center FAB (Fixed) */}
              <div className="flex flex-col items-center justify-center p-1 rounded-xl bg-slate-100/90 border border-dashed border-slate-300 relative opacity-90">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0D38A8] via-[#1E56E3] to-[#3B82F6] text-white flex items-center justify-center shadow-xs">
                  {isSupplier ? (
                    <PlusCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase mt-1 tracking-wider">
                  {isSupplier ? 'Ship' : 'Sign Off'}
                </span>
              </div>

              {/* Slot 2 (Right 1) */}
              {(() => {
                const opt = getOptionDefinition(activeSlots[2], isSupplier);
                const Icon = opt?.icon || Wallet;
                const isSelected = selectedSlotIndex === 2 && isEditMode;
                return (
                  <button
                    onClick={() => {
                      setSelectedSlotIndex(2);
                      setIsEditMode(true);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative border cursor-pointer ${
                      isSelected
                        ? 'border-[#1E56E3] bg-blue-50/80 ring-2 ring-blue-500/30 scale-102 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-black text-slate-400 mb-0.5">Slot 3</span>
                    <Icon className={`w-5 h-5 ${opt?.color || 'text-slate-700'}`} />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center mt-1">
                      {getOptionLabel(activeSlots[2], isSupplier)}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E56E3] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>
                );
              })()}

              {/* Slot 3 (Right 2) */}
              {(() => {
                const opt = getOptionDefinition(activeSlots[3], isSupplier);
                const Icon = opt?.icon || User;
                const isSelected = selectedSlotIndex === 3 && isEditMode;
                return (
                  <button
                    onClick={() => {
                      setSelectedSlotIndex(3);
                      setIsEditMode(true);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative border cursor-pointer ${
                      isSelected
                        ? 'border-[#1E56E3] bg-blue-50/80 ring-2 ring-blue-500/30 scale-102 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-black text-slate-400 mb-0.5">Slot 4</span>
                    <Icon className={`w-5 h-5 ${opt?.color || 'text-slate-700'}`} />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center mt-1">
                      {getOptionLabel(activeSlots[3], isSupplier)}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E56E3] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>
                );
              })()}
            </div>

            {/* Position Reorder Bar (In Edit Mode) */}
            {isEditMode ? (
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2 flex flex-col gap-1.5 text-[11px] text-[#1E56E3] animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span>
                    Modifying <span className="font-black text-slate-900">Slot {selectedSlotIndex + 1} ({getOptionLabel(activeSlots[selectedSlotIndex], isSupplier)})</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">
                    Tap option below to swap ↓
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-blue-100/80">
                  <span className="text-[10px] text-slate-500 font-medium">Shift position:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={selectedSlotIndex === 0}
                      onClick={() => handleMoveSlot(selectedSlotIndex, selectedSlotIndex - 1)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        selectedSlotIndex === 0
                          ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-white'
                          : 'bg-white hover:bg-blue-100 text-[#1E56E3] border-blue-200 active:scale-95 shadow-2xs'
                      }`}
                    >
                      ← Move Left
                    </button>
                    <button
                      type="button"
                      disabled={selectedSlotIndex === 3}
                      onClick={() => handleMoveSlot(selectedSlotIndex, selectedSlotIndex + 1)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        selectedSlotIndex === 3
                          ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-white'
                          : 'bg-white hover:bg-blue-100 text-[#1E56E3] border-blue-200 active:scale-95 shadow-2xs'
                      }`}
                    >
                      Move Right →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
                <span>⚡ <strong>Single tap</strong> any feature below to open</span>
                <span className="text-[10.5px] text-[#1E56E3] font-bold">Hold to customize</span>
              </div>
            )}
          </div>

          {/* 8 Feature Options List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                {isEditMode ? 'Available Menu Options (Tap to Assign)' : 'All Features (Tap to Open)'}
              </span>
              {isEditMode && (
                <button
                  onClick={handleReset}
                  className="text-[10.5px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Default</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {getAvailableOptions(isSupplier).map((opt) => {
                const Icon = opt.icon;
                const active = isOptionActive(opt);
                const label = isSupplier ? opt.labelSupplier : opt.labelReceiver;
                const isNotifications = opt.id === 'notifications';

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleCardClick(opt)}
                    onTouchStart={() => startCardLongPress(opt)}
                    onTouchEnd={cancelCardLongPress}
                    onTouchCancel={cancelCardLongPress}
                    onMouseDown={() => startCardLongPress(opt)}
                    onMouseUp={cancelCardLongPress}
                    onMouseLeave={cancelCardLongPress}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative cursor-pointer active:scale-98 ${
                      active
                        ? isEditMode 
                          ? 'bg-blue-50/60 border-blue-200/90 ring-1 ring-blue-400/40 shadow-xs'
                          : 'bg-white border-blue-200/70 shadow-xs hover:border-blue-400'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${opt.bg} ${opt.color}`}>
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-slate-800 truncate">
                          {label}
                        </span>
                        {isNotifications && notifCount > 0 && (
                          <span className="w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0">
                            {notifCount > 9 ? '9+' : notifCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>

                    {/* Indicator: Checkmark if in bottom bar, or Arrow if navigation mode */}
                    {isEditMode ? (
                      active ? (
                        <div className="w-5 h-5 rounded-full bg-[#1E56E3] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : null
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
