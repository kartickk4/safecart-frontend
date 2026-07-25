import React from 'react';
import { RefreshCw, Download, Plus } from 'lucide-react';

export default function Header({ user, onRefresh, openNewShipmentModal }) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Escrow Dashboard</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Welcome back, <span className="text-slate-800 font-semibold">{user?.fullName?.split(' ')[0] || 'Kartick'}</span> — here is your escrow overview as of <span className="font-semibold text-slate-700">{currentDate} • {currentTime}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => alert('Exporting Escrow CSV Report...')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        <button
          onClick={openNewShipmentModal}
          className="px-4 py-2 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ New Shipment</span>
        </button>
      </div>
    </header>
  );
}
