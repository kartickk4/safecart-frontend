import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, DollarSign, Building, CheckCircle2, Edit } from 'lucide-react';
import { profileAPI } from '../services/api';

export default function WalletModal({ user, onUpdateUser }) {
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: user?.bankDetails?.accountHolderName || 'Kartick Das',
    accountNumber: user?.bankDetails?.accountNumber || '987654321098',
    ifscCode: user?.bankDetails?.ifscCode || 'HDFC0001234',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || 'kartick@upi'
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ bankDetails });
      alert('Bank account & UPI details successfully updated for Indian escrow disbursements!');
      if (onUpdateUser) onUpdateUser(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Escrow Wallet & Indian Payouts 🇮🇳</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your escrow balances, bank account details (NEFT/IMPS), and instant UPI disbursements.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#1E56E3] to-[#1649CC] text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Active Escrow Balance</span>
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">₹1,42,380.00</h2>
          <p className="text-xs text-blue-100 mt-2">Protected across 47 active shipments</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Released Payouts</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">₹89,240.00</h2>
          <p className="text-xs text-slate-500 mt-2">63 transactions cleared this month</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Release</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">₹18,400.00</h2>
          <p className="text-xs text-slate-500 mt-2">8 shipments awaiting buyer sign-off</p>
        </div>
      </div>

      {/* Payout Bank Account Details */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Direct Payout Bank Account</h3>
              <p className="text-xs text-slate-500">Escrow funds are automatically disbursed here upon buyer confirmation.</p>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{editing ? 'Cancel' : 'Edit Bank Details'}</span>
          </button>
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Holder</span>
              <span className="text-sm font-bold text-slate-900">{bankDetails.accountHolderName}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Number</span>
              <span className="text-sm font-bold text-slate-900 font-mono">•••• •••• {bankDetails.accountNumber?.slice(-4) || '9878'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">IFSC / Swift Code</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{bankDetails.ifscCode}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bank Name</span>
              <span className="text-sm font-bold text-slate-900">{bankDetails.bankName}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Payout Account Details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
