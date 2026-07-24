import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, Clock, Eye } from 'lucide-react';

export default function ClaimsModal({ onSelectShipment }) {
  const claimsList = [
    {
      claimId: 'CLM-9478-X',
      shipmentId: 'PSF-2026-00838',
      filedBy: 'Rohan Gupta (Receiver)',
      reason: 'Damaged items',
      description: 'Outer carton arrived crushed. Product console screen has visible scratches.',
      status: 'Under Review',
      amount: '₹920',
      date: '2026-07-22 09:14 AM'
    },
    {
      claimId: 'CLM-3129-A',
      shipmentId: 'PSF-2026-00812',
      filedBy: 'Kartick Das (Supplier)',
      reason: 'Delivery delay penalty dispute',
      description: 'Carrier weather disruption caused 48h delay beyond control.',
      status: 'Escalated Urgent',
      amount: '₹2,450',
      date: '2026-07-21 04:30 PM'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            Dispute Claims & Resolutions
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              2 Active Claims
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Escrow funds remain locked under protection while claims are reviewed by compliance admins.</p>
        </div>
      </div>

      <div className="space-y-4">
        {claimsList.map((claim) => (
          <div key={claim.claimId} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 mt-1">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">{claim.claimId}</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{claim.shipmentId}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${claim.status.includes('Urgent') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                    {claim.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800">Reason: {claim.reason}</p>
                <p className="text-xs text-slate-500 max-w-2xl">{claim.description}</p>
                <p className="text-[11px] text-slate-400 font-medium">Filed by <span className="text-slate-700 font-semibold">{claim.filedBy}</span> on {claim.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locked Value</span>
                <span className="text-lg font-extrabold text-slate-900">{claim.amount}</span>
              </div>

              <button
                onClick={() => onSelectShipment({ shipmentId: claim.shipmentId, status: 'Locked', amount: 920 })}
                className="px-4 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
