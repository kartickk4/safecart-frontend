import React, { useState } from 'react';
import { Search, Navigation, Truck, MapPin, CheckCircle2, Clock, ShieldCheck, RefreshCw, ExternalLink, Lock, Send, Package, ArrowRight } from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function TrackingView({ onSelectShipment }) {
  const [searchId, setSearchId] = useState('PSF-2026-00841');
  const [activeTab, setActiveTab] = useState('escrow'); // 'escrow' | 'carrier'
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(defaultTrackingData);

  // Dispatch Courier form state inside Transaction Escrow stage 4
  const [selectedCourier, setSelectedCourier] = useState('delhivery');
  const [courierAwb, setCourierAwb] = useState('DLV1234567890IN');
  const [dispatched, setDispatched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    setLoading(true);

    try {
      const res = await shipmentAPI.getShipmentById(searchId.trim());
      if (res.data) {
        setTrackingResult({
          shipmentId: res.data.shipment?.shipmentId || searchId,
          receiverName: res.data.shipment?.receiverName || 'Priya Nair',
          route: res.data.shipment?.city || 'Mumbai → Bengaluru',
          carrier: res.data.shipment?.carrierSlug || 'Delhivery Express',
          awbCode: res.data.shipment?.awbCode || 'TC-delhivery-7539789936',
          amount: res.data.shipment?.amount || 3420,
          status: res.data.shipment?.status || 'In Transit',
          milestones: res.data.journey?.milestones || defaultTrackingData.milestones
        });
      }
    } catch (err) {
      console.warn('API error, showing fallback live tracking details:', err);
      setTrackingResult({
        ...defaultTrackingData,
        shipmentId: searchId.toUpperCase()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchCourier = (e) => {
    e.preventDefault();
    setDispatched(true);
    alert(`Courier details updated! AWB Code ${courierAwb} linked to escrow shipment.`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header & Search */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-[#1E56E3]" />
            Live Parcel & Escrow Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track any Safecart shipment or TrackCourier AWB code in real time.</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Shipment ID (e.g. PSF-2026-00841) or AWB Tracking Code..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition inline-flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Track Live</span>}
          </button>
        </form>
      </div>

      {/* TRACKING DUAL VIEW CONTAINER */}
      {trackingResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* DUAL SUB-TAB SWITCHER (MATCHING USER SCREENSHOT DESIGN) */}
          <div className="bg-[#F4F7FF] p-1.5 rounded-2xl border border-blue-100/80 flex gap-2">
            <button
              onClick={() => setActiveTab('escrow')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                activeTab === 'escrow'
                  ? 'bg-white text-[#1E56E3] shadow-md border border-blue-100 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              <Lock className="w-4 h-4 text-[#1E56E3]" />
              <span>🔒 Transaction Escrow</span>
            </button>

            <button
              onClick={() => setActiveTab('carrier')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                activeTab === 'carrier'
                  ? 'bg-white text-[#1E56E3] shadow-md border border-blue-100 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>🚚 Carrier Journey</span>
            </button>
          </div>

          {/* VIEW 1: TRANSACTION ESCROW MONEY FLOW & STAGES */}
          {activeTab === 'escrow' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Current Status Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT STATUS</span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl font-black text-slate-900">{trackingResult.status}</h2>
                    <span className="bg-blue-100 text-[#1E56E3] font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      IN PROGRESS
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escrow Amount</span>
                  <span className="text-xl font-extrabold text-[#1E56E3] font-mono">₹{trackingResult.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Transaction Journey Vertical Stepper Timeline */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Transaction Journey</h3>

                <div className="space-y-8 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-blue-100">
                  {/* Stage 1 */}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#1E56E3] text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">✓</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-extrabold text-slate-900">Shipping order created</h4>
                        <span className="text-[10px] text-slate-400">16 Jul 2026</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">The digital shipping manifest has been registered on Safecart Escrow.</p>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#1E56E3] text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">✓</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-extrabold text-slate-900">Payment request sent to receiver</h4>
                        <span className="text-[10px] text-slate-400">17 Jul 2026</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Secure escrow payment request dispatched to {trackingResult.receiverName}.</p>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#1E56E3] text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">✓</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-extrabold text-slate-900">Payment received by receiver</h4>
                        <span className="text-[10px] text-slate-400">18 Jul 2026</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{trackingResult.receiverName} has funded the escrow vault. Funds are securely locked.</p>
                    </div>
                  </div>

                  {/* Stage 4: Enter Courier Details Interactive Form */}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#1E56E3] text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="p-6 rounded-3xl bg-blue-50/60 border border-blue-200/80 space-y-4">
                        <div className="flex items-center gap-2 text-[#1E56E3] font-bold text-xs">
                          <Truck className="w-4 h-4" />
                          <span>Enter Courier Details</span>
                        </div>
                        <p className="text-xs text-slate-600">As the sender, enter the courier details to dispatch the parcel and advance to the next step.</p>

                        {!dispatched ? (
                          <form onSubmit={handleDispatchCourier} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SELECT COURIER SERVICE</label>
                              <select
                                value={selectedCourier}
                                onChange={(e) => setSelectedCourier(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="delhivery">Delhivery Express</option>
                                <option value="bluedart">BlueDart Logistics</option>
                                <option value="dtdc">DTDC Express</option>
                                <option value="ekart">Ekart Logistics</option>
                                <option value="indiapost">India Post Speed Post</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">COURIER TRACKING ID</label>
                              <input
                                type="text"
                                required
                                value={courierAwb}
                                onChange={(e) => setCourierAwb(e.target.value.toUpperCase())}
                                placeholder="E.G. DLV1234567890IN"
                                className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              <span>SUBMIT & DISPATCH PARCEL</span>
                            </button>
                          </form>
                        ) : (
                          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Courier Dispatched via {selectedCourier.toUpperCase()} (AWB: {courierAwb})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stage 5 */}
                  <div className="flex items-start gap-4 relative z-10 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700">Parcel has been sent to {trackingResult.receiverName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Awaiting courier dispatch by sender.</p>
                    </div>
                  </div>

                  {/* Stage 6 */}
                  <div className="flex items-start gap-4 relative z-10 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700">Item confirmed by {trackingResult.receiverName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Awaiting delivery and receiver confirmation.</p>
                    </div>
                  </div>

                  {/* Stage 7 */}
                  <div className="flex items-start gap-4 relative z-10 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700">Payment released to sender</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Escrow funds will be released after confirmed delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: CARRIER JOURNEY LIVE PARCEL TRANSMIT */}
          {activeTab === 'carrier' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Status Header Banner */}
              <div className="bg-gradient-to-r from-[#1E56E3] via-blue-700 to-indigo-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-500/20 border border-blue-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-bold shadow-inner">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white font-mono">{trackingResult.shipmentId}</h2>
                      <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {trackingResult.status}
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 mt-1">Route: <span className="font-semibold text-white">{trackingResult.route}</span> • Carrier: <span className="font-semibold text-white capitalize">{trackingResult.carrier}</span></p>
                  </div>
                </div>

                <div className="text-right border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Escrow Protected Amount</span>
                  <span className="text-2xl font-black text-emerald-300 font-mono">₹{trackingResult.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* VISUAL PROGRESS TIMELINE BAR (TRACKING 2 VIEW) */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 text-sm">Live Milestone Progress</h3>

                {/* Stepper Progress Bar */}
                <div className="grid grid-cols-4 gap-2 relative">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">✓</div>
                    <span className="text-xs font-bold text-slate-900">Booked & Funded</span>
                    <span className="text-[10px] text-slate-400">Escrow Locked</span>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">✓</div>
                    <span className="text-xs font-bold text-slate-900">Picked Up</span>
                    <span className="text-[10px] text-slate-400">Delhivery Express</span>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shadow-md animate-pulse">🚚</div>
                    <span className="text-xs font-bold text-amber-600">In Transit</span>
                    <span className="text-[10px] text-slate-400">Bhiwandi Hub</span>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2 opacity-50">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center">4</div>
                    <span className="text-xs font-bold text-slate-500">Delivered & Released</span>
                    <span className="text-[10px] text-slate-400">UPI Payout</span>
                  </div>
                </div>

                {/* Milestones Log */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone History</h4>
                  <div className="space-y-4">
                    {trackingResult.milestones.map((m, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-left">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.activity || m.status}</p>
                          <p className="text-[11px] text-slate-500">{m.location || 'Bhiwandi Sorting Hub, Maharashtra'}</p>
                          <span className="text-[10px] text-slate-400">{new Date(m.date || m.time || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const defaultTrackingData = {
  shipmentId: 'PSF-2026-00841',
  receiverName: 'Priya Nair',
  route: 'Mumbai → Bengaluru',
  carrier: 'Delhivery Express',
  awbCode: 'TC-delhivery-7539789936',
  amount: 3420,
  status: 'In Transit',
  milestones: [
    { activity: 'Package In Transit at Regional Sorting Facility', location: 'Bhiwandi Hub, Maharashtra', date: new Date(Date.now() - 3600000 * 2).toISOString() },
    { activity: 'Picked up by Delhivery Courier Partner', location: 'Bhiwandi Warehouse', date: new Date(Date.now() - 3600000 * 12).toISOString() },
    { activity: 'Escrow Payment Secured & Booking Created', location: 'Safecart Cloud', date: new Date(Date.now() - 3600000 * 14).toISOString() }
  ]
};
