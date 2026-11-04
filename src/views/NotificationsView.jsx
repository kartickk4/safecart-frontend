import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldCheck, Box, AlertCircle, IndianRupee, Check, Filter, Trash2, RotateCcw, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationAPI } from '../services/api';

export default function NotificationsView({ onSelectShipment, onNotificationsChanged }) {
  const [filter, setFilter] = useState('All');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swipingId, setSwipingId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const isHorizontalSwipe = useRef(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getNotifications();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setList(res.data.map(n => {
          const extractedShipmentId = n.shipmentId || (n.title?.match(/SPL-[0-9A-Z-]+/i) || n.message?.match(/SPL-[0-9A-Z-]+/i))?.[0] || '';
          return {
            id: n._id,
            type: n.type || 'shipping',
            title: n.title,
            desc: n.message,
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.read,
            shipmentId: extractedShipmentId,
            actionType: n.actionType || (n.title?.toLowerCase().includes('confirm') ? 'CONFIRM_PARCEL' : ''),
            icon: getIcon(n.type),
            color: getColor(n.type)
          };
        }));
      } else {
        setList([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const [deletingIds, setDeletingIds] = useState(new Set());
  const unreadCount = list.filter(n => !n.read).length;

  const handleDelete = (id) => {
    setDeletingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setList(prev => prev.filter(n => n.id !== id));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSwipeOffset(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (onNotificationsChanged) onNotificationsChanged();
    }, 300);
  };

  const handleMarkAllRead = async () => {
    setList(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const unread = list.filter(n => !n.read);
      await Promise.all(unread.map(n => notificationAPI.markAsRead(n.id)));
    } catch (e) {}
    if (onNotificationsChanged) onNotificationsChanged();
  };

  const handleToggleRead = async (id) => {
    setList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await notificationAPI.markAsRead(id);
    } catch (e) {}
    if (onNotificationsChanged) onNotificationsChanged();
  };

  const handleClearAll = () => {
    setList([]);
    if (onNotificationsChanged) onNotificationsChanged();
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  // Safe Touch Handlers for Mobile: ignores vertical scrolling!
  const handleTouchStart = (id, e) => {
    setSwipingId(id);
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (id, e) => {
    if (touchStartX === null || touchStartY === null || swipingId !== id) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (!isHorizontalSwipe.current) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(diffY) > 8) {
        // Vertical scroll in progress - do not move card
        return;
      }
    }

    if (isHorizontalSwipe.current) {
      const clamped = Math.max(-110, Math.min(110, diffX));
      setSwipeOffset(prev => ({ ...prev, [id]: clamped }));
    }
  };

  const handleTouchEnd = (id) => {
    const offset = swipeOffset[id] || 0;
    if (Math.abs(offset) > 85) {
      handleDelete(id);
    } else {
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setSwipingId(null);
    isHorizontalSwipe.current = false;
  };

  // Mouse Handlers for Desktop Dragging
  const handleMouseDown = (id, e) => {
    setIsMouseDown(true);
    setSwipingId(id);
    setTouchStartX(e.clientX);
  };

  const handleMouseMove = (id, e) => {
    if (!isMouseDown || touchStartX === null || swipingId !== id) return;
    const diff = e.clientX - touchStartX;
    const clamped = Math.max(-110, Math.min(110, diff));
    setSwipeOffset(prev => ({ ...prev, [id]: clamped }));
  };

  const handleMouseUp = (id) => {
    if (!isMouseDown) return;
    const offset = swipeOffset[id] || 0;
    if (Math.abs(offset) > 85) {
      handleDelete(id);
    } else {
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
    setIsMouseDown(false);
    setTouchStartX(null);
    setSwipingId(null);
  };

  const filtered = list.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Payments') return n.type === 'escrow' || n.type === 'payment';
    return n.type === filter.toLowerCase();
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 py-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 overflow-x-hidden min-w-0">
      
      {/* ── Title Header ── */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-[#1E56E3] shrink-0" />
          <span>Notifications Center</span>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-[#1E56E3] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
              {unreadCount} Unread
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Real-time alerts for payment movements, carrier milestones, and return tracking updates.
        </p>
      </div>

      {/* ── Responsive Filter & Action Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {['All', 'Payments', 'Shipping', 'Dispute'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === t
                  ? 'bg-white text-[#1E56E3] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E56E3] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>

          {list.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Notifications List ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs sm:shadow-sm p-3 sm:p-5 md:p-6 space-y-2.5 sm:space-y-3 w-full min-w-0">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Notifications Available</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You're all caught up! Real-time alerts for shipments, order updates, and return orders will appear here.
            </p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E56E3] text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Check for New Alerts</span>
            </button>
          </div>
        ) : (
          filtered.map(n => {
            const IconComponent = n.icon;
            const offset = swipeOffset[n.id] || 0;
            const isDeleting = deletingIds.has(n.id);

            return (
              <div
                key={n.id}
                style={{
                  maxHeight: isDeleting ? '0px' : '160px',
                  opacity: isDeleting ? 0 : 1,
                  transform: isDeleting ? 'translateX(100%) scale(0.95)' : 'none',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: isDeleting ? 0 : undefined,
                  paddingTop: isDeleting ? 0 : undefined,
                  paddingBottom: isDeleting ? 0 : undefined,
                }}
                className="relative overflow-hidden rounded-xl sm:rounded-2xl group select-none w-full min-w-0"
              >
                {/* Background Swipe Red Delete Action Layer */}
                <div 
                  style={{ opacity: Math.min(1, Math.abs(offset) / 50) }}
                  className={`absolute inset-0 bg-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-between px-6 text-white font-bold text-xs pointer-events-none transition-opacity duration-150 ${Math.abs(offset) > 3 ? 'visible' : 'invisible'}`}
                >
                  <span className={`flex items-center gap-1.5 transition-opacity ${offset > 15 ? 'opacity-100' : 'opacity-0'}`}>
                    <Trash2 className="w-4 h-4" /> Delete Alert
                  </span>
                  <span className={`flex items-center gap-1.5 transition-opacity ${offset < -15 ? 'opacity-100' : 'opacity-0'}`}>
                    Delete Alert <Trash2 className="w-4 h-4" />
                  </span>
                </div>

                {/* Foreground Swipable Card Layer */}
                <div
                  onTouchStart={(e) => handleTouchStart(n.id, e)}
                  onTouchMove={(e) => handleTouchMove(n.id, e)}
                  onTouchEnd={() => handleTouchEnd(n.id)}
                  onMouseDown={(e) => handleMouseDown(n.id, e)}
                  onMouseMove={(e) => handleMouseMove(n.id, e)}
                  onMouseUp={() => handleMouseUp(n.id)}
                  onMouseLeave={() => handleMouseUp(n.id)}
                  onClick={() => handleToggleRead(n.id)}
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: swipingId === n.id ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}
                  className={`relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex items-start justify-between gap-2.5 sm:gap-4 cursor-pointer select-none w-full min-w-0 ${
                    !n.read 
                      ? 'bg-blue-50/90 border-blue-200/90 shadow-2xs' 
                      : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 pointer-events-none">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${n.color}`}>
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 break-words line-clamp-2">{n.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 break-words line-clamp-3 leading-relaxed">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1">
                    {n.actionType === 'CONFIRM_PARCEL' && n.shipmentId && onSelectShipment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSelectShipment(n.shipmentId);
                        }}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Confirm</span>
                      </button>
                    )}

                    {!n.read ? (
                      <span title="Unread Alert" className="w-2.5 h-2.5 rounded-full bg-[#1E56E3] shrink-0"></span>
                    ) : (
                      <span title="Read" className="text-[10px] font-bold text-slate-300 shrink-0">✓</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(n.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      title="Delete Notification"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getIcon(type) {
  if (type === 'payment' || type === 'escrow') return IndianRupee;
  if (type === 'alert' || type === 'dispute') return AlertCircle;
  if (type === 'confirmed') return ShieldCheck;
  return Box;
}

function getColor(type) {
  if (type === 'payment' || type === 'escrow') return 'text-emerald-600 bg-emerald-50';
  if (type === 'alert' || type === 'dispute') return 'text-rose-600 bg-rose-50';
  if (type === 'confirmed') return 'text-[#1E56E3] bg-blue-50';
  return 'text-indigo-600 bg-indigo-50';
}
