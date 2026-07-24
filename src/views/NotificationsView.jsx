import React, { useState } from 'react';
import { Bell, ShieldCheck, Box, AlertCircle, IndianRupee, Check, Filter } from 'lucide-react';

export default function NotificationsView() {
  const [filter, setFilter] = useState('All');

  const notifications = [
    { id: 1, type: 'payment', title: 'Payment Secured — PSF-2026-00841', desc: 'Escrow amount of ₹3,420 held securely in Safecart India account.', time: '15 min ago', read: false, icon: ShieldCheck, color: 'text-[#1E56E3] bg-blue-50' },
    { id: 2, type: 'shipping', title: 'Shipment Dispatched — PSF-2026-00841', desc: 'Delhivery Express has picked up parcel at Bhiwandi hub.', time: '1 hour ago', read: false, icon: Box, color: 'text-indigo-600 bg-indigo-50' },
    { id: 3, type: 'dispute', title: 'Dispute Filed — CLM-9478-X', desc: 'Rohan Gupta opened a dispute on shipment PSF-2026-00838.', time: '3 hours ago', read: true, icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
    { id: 4, type: 'escrow', title: 'Funds Disbursed — PSF-2026-00839', desc: '₹7,650 disbursed directly to your HDFC bank account.', time: '5 hours ago', read: true, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' }
  ];

  const filtered = notifications.filter(n => filter === 'All' || n.type === filter.toLowerCase());

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#1E56E3]" />
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time alerts for escrow movements, carrier milestones, and dispute claims.</p>
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-xs font-semibold text-slate-600 w-fit">
          {['All', 'Escrow', 'Shipping', 'Dispute'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-lg transition ${filter === t ? 'bg-white text-[#1E56E3] shadow-sm font-bold' : 'hover:text-slate-900'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {filtered.map(n => {
          const IconComponent = n.icon;
          return (
            <div key={n.id} className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${!n.read ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${n.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.time}</span>
                </div>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
