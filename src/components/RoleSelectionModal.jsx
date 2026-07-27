import React, { useState } from 'react';
import { ShoppingBag, Truck, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { profileAPI } from '../services/api';

export default function RoleSelectionModal({ isOpen, user, onComplete }) {
  const [selectedRole, setSelectedRole] = useState('User');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ role: selectedRole });
      const updatedUser = res.data;
      onComplete(updatedUser);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set account role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl relative border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#1E56E3] to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome to Safecart, {user?.fullName?.split(' ')[0] || 'Partner'}!</h2>
          <p className="text-xs text-slate-500 font-medium">Select your primary account type to customize your escrow dashboard.</p>
        </div>

        {/* Role Options */}
        <div className="space-y-3">
          {/* Buyer Option */}
          <div
            onClick={() => setSelectedRole('User')}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
              selectedRole === 'User'
                ? 'border-[#1E56E3] bg-blue-50/50 shadow-md'
                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className={`p-3 rounded-xl ${selectedRole === 'User' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-600'}`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Buyer / Customer</h3>
                {selectedRole === 'User' && <CheckCircle2 className="w-5 h-5 text-[#1E56E3]" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">I want to pay securely via escrow, track parcel deliveries, and confirm order sign-offs.</p>
            </div>
          </div>

          {/* Supplier Option */}
          <div
            onClick={() => setSelectedRole('Supplier')}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
              selectedRole === 'Supplier'
                ? 'border-[#1E56E3] bg-blue-50/50 shadow-md'
                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className={`p-3 rounded-xl ${selectedRole === 'Supplier' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Supplier / Merchant</h3>
                {selectedRole === 'Supplier' && <CheckCircle2 className="w-5 h-5 text-[#1E56E3]" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">I am a seller. I want to create secured escrow shipments, request courier pickups, and receive payouts.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Setting up Dashboard...' : 'Continue to Dashboard'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
