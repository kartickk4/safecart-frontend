import React, { useState } from 'react';
import { X, ShieldCheck, Box, ArrowRight } from 'lucide-react';
import { shipmentAPI } from '../services/api';

export default function CreateShipmentModal({ isOpen, onClose, onCreated }) {
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [cityRoute, setCityRoute] = useState('New York → Los Angeles');
  const [carrierSlug, setCarrierSlug] = useState('delhivery');
  const [fundImmediately, setFundImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create booking
      const res = await shipmentAPI.createShipment({
        receiverName,
        receiverPhone,
        description,
        amount: Number(amount),
        city: cityRoute,
        carrierSlug,
        fundEscrow: fundImmediately
      });

      onCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Create Shipment Error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create shipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Escrow Booking</h2>
            <p className="text-xs text-slate-500">Lock payment in ParcelSafe regulated escrow</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Nair"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Phone</label>
            <input
              type="tel"
              required
              placeholder="e.g. +919876543210"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Escrow Amount ($ / ₹)</label>
              <input
                type="number"
                required
                placeholder="3420"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Partner</label>
              <select
                value={carrierSlug}
                onChange={(e) => setCarrierSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="delhivery">Delhivery Express</option>
                <option value="fedex">FedEx Express</option>
                <option value="bluedart">BlueDart</option>
                <option value="dhl">DHL Express</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Route</label>
            <input
              type="text"
              placeholder="New York → Los Angeles"
              value={cityRoute}
              onChange={(e) => setCityRoute(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Description</label>
            <textarea
              rows="2"
              required
              placeholder="PlayStation 5 Console (Factory Sealed)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fundNow"
              checked={fundImmediately}
              onChange={(e) => setFundImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="fundNow" className="text-xs text-slate-600 font-medium">Fund escrow payment immediately upon booking</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Confirm Escrow Booking</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
