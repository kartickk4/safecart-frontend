import React, { useState } from 'react';
import { Bell, ShieldCheck, Box, AlertCircle, IndianRupee, Check, Filter, Trash2, RotateCcw } from 'lucide-react';

const initialNotifications = [
  { id: 1, type: 'payment', title: 'Payment Secured — PSF-2026-00841', desc: 'Escrow amount of ₹3,420 held securely in Safecart India account.', time: '15 min ago', read: false, icon: ShieldCheck, color: 'text-[#1E56E3] bg-blue-50' },
  { id: 2, type: 'shipping', title: 'Shipment Dispatched — PSF-2026-00841', desc: 'Delhivery Express has picked up parcel at Bhiwandi hub.', time: '1 hour ago', read: false, icon: Box, color: 'text-indigo-600 bg-indigo-50' },
  { id: 3, type: 'dispute', title: 'Dispute Filed — CLM-9478-X', desc: 'Rohan Gupta opened a dispute on shipment PSF-2026-00838.', time: '3 hours ago', read: true, icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  { id: 4, type: 'escrow', title: 'Funds Disbursed — PSF-2026-00839', desc: '₹7,650 disbursed directly to your HDFC bank account.', time: '5 hours ago', read: true, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' }
];

export default function NotificationsView() {
  const [filter, setFilter] = useState('All');
  const [list, setList] = useState(initialNotifications);
  const [swipingId, setSwipingId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});
  const [touchStartX, setTouchStartX] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleDelete = (id) => {
    setList(prev => prev.filter(n => n.id !== id));
    setSwipeOffset(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleClearAll = () => {
    setList([]);
  };

  const handleReset = () => {
    setList(initialNotifications);
  };

  // Touch Handlers for Mobile Swipe
  const handleTouchStart = (id, e) => {
    setSwipingId(id);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (id, e) => {
    if (touchStartX === null || swipingId !== id) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    setSwipeOffset(prev => ({ ...prev, [id]: diff }));
  };

  const handleTouchEnd = (id) => {
    const offset = swipeOffset[id] || 0;
    if (Math.abs(offset) > 90) {
      handleDelete(id);
    } else {
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
    setTouchStartX(null);
    setSwipingId(null);
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
    setSwipeOffset(prev => ({ ...prev, [id]: diff }));
  };

  const handleMouseUp = (id) => {
    if (!isMouseDown) return;
    const offset = swipeOffset[id] || 0;
    if (Math.abs(offset) > 90) {
      handleDelete(id);
    } else {
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
    setIsMouseDown(false);
    setTouchStartX(null);
    setSwipingId(null);
  };

  const filtered = list.filter(n => filter === 'All' || n.type === filter.toLowerCase());

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#1E56E3]" />
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time alerts for escrow movements, carrier milestones, and dispute claims.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {list.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E56E3] text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Demo Alerts</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-xs font-semibold text-slate-600">
            {['All', 'Escrow', 'Shipping', 'Dispute'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-lg transition ${filter === t ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Notifications Available</p>
            <p className="text-xs text-slate-400">All alerts cleared! Click Restore Demo Alerts to test again.</p>
          </div>
        ) : (
          filtered.map(n => {
            const IconComponent = n.icon;
            const offset = swipeOffset[n.id] || 0;

            return (
              <div key={n.id} className="relative overflow-hidden rounded-2xl group select-none">
                {/* Background Swipe Red Delete Action Layer */}
                <div className="absolute inset-0 bg-rose-500 rounded-2xl flex items-center justify-between px-6 text-white font-bold text-xs">
                  <span className="flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete Alert</span>
                  <span className="flex items-center gap-1.5">Delete Alert <Trash2 className="w-4 h-4" /></span>
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
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: swipingId === n.id ? 'none' : 'transform 0.2s ease-out'
                  }}
                  className={`relative p-4 rounded-2xl border transition flex items-start justify-between gap-4 cursor-grab active:cursor-grabbing ${!n.read ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-200/80 shadow-xs'}`}
                >
                  <div className="flex items-start gap-3.5 pointer-events-none">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${n.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
