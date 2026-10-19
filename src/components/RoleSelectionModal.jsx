import React, { useState } from 'react';
import { ShoppingBag, Truck, CheckCircle2, ShieldCheck, ArrowRight, MapPin, ChevronLeft } from 'lucide-react';
import { profileAPI } from '../services/api';

export default function RoleSelectionModal({ isOpen, user, onComplete }) {
  const [step, setStep] = useState(1); // 1: choose role, 2: supplier pickup address
  const [selectedRole, setSelectedRole] = useState(user?.role === 'Supplier' ? 'Supplier' : 'User');
  const [addressData, setAddressData] = useState({
    street: user?.pickupAddress?.street || user?.address || '',
    city: user?.pickupAddress?.city || user?.city || '',
    state: user?.pickupAddress?.state || user?.state || '',
    pincode: user?.pickupAddress?.pincode || user?.pincode || '',
    landmark: user?.pickupAddress?.landmark || ''
  });
  const [addressError, setAddressError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (skipAddress = false) => {
    setLoading(true);
    try {
      const payload = { role: selectedRole };
      if (selectedRole === 'Supplier' && !skipAddress && addressData.street) {
        payload.address = addressData.street;
        payload.city = addressData.city;
        payload.state = addressData.state;
        payload.pincode = addressData.pincode;
        payload.pickupAddress = addressData;
      }
      const res = await profileAPI.updateProfile(payload);
      const updatedUser = res.data;
      onComplete(updatedUser);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set account role.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedRole === 'Supplier' && step === 1 && (!user?.pickupAddress?.street && !addressData.street)) {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-blue-950/25 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl relative border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#1E56E3] to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            {step === 1 ? <ShieldCheck className="w-7 h-7" /> : <MapPin className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {step === 1 ? `Welcome, ${user?.fullName?.split(' ')[0] || 'Partner'}!` : 'Courier Pickup Address'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {step === 1 
              ? 'Select your primary account role to customize your shipping & tracking workspace.'
              : 'Where should courier partners (Delhivery, BlueDart, DTDC, India Post) pick up your parcels?'}
          </p>
        </div>

        {/* Step 1: Role Options */}
        {step === 1 && (
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
                <p className="text-xs text-slate-500 mt-1">I want to pay securely with delivery protection, track parcel deliveries, and verify orders.</p>
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
                <p className="text-xs text-slate-500 mt-1">I sell products. I want to create secured shipments, book courier pickups, and receive payouts.</p>
              </div>
            </div>

            {/* Submit / Next Button */}
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full py-3.5 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Setting up...' : selectedRole === 'Supplier' ? 'Continue to Pickup Address' : 'Continue to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Pickup Address for Supplier */}
        {step === 2 && (
          <div className="space-y-4">
            {addressError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {addressError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Shop / Warehouse / Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop 12, MG Road Market / Plot 20 Industrial Area"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City / District *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">6-Digit Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 560001"
                    value={addressData.pincode}
                    onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Metro Station"
                    value={addressData.landmark}
                    onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (!addressData.street || !addressData.pincode || addressData.pincode.length !== 6) {
                    setAddressError('Please enter street address and 6-digit pincode.');
                    return;
                  }
                  setAddressError('');
                  handleSubmit();
                }}
                className="flex-1 py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Saving...' : 'Save & Open Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline"
              >
                Skip for now (I will add it later in Profile)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
