import React, { useState } from 'react';
import { ShieldCheck, Box, RefreshCw, Eye, EyeOff, Lock, CheckCircle2, ArrowRight, UserCheck, ShoppingBag } from 'lucide-react';
import { authAPI } from '../services/api';

export default function AuthView({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Supplier'); // 'Supplier' | 'Receiver'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('mySecurePassword123');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName || !phone) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        const res = await authAPI.signup({ email, password, phone, fullName, role: 'User' });
        const { accessToken, user } = res.data;
        user.activeRole = selectedRole;
        localStorage.setItem('safecart_token', accessToken);
        onAuthSuccess(user);
      } else {
        const res = await authAPI.login({ email, password });
        const { accessToken, user } = res.data;
        user.activeRole = selectedRole;
        localStorage.setItem('safecart_token', accessToken);
        onAuthSuccess(user);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F9FC]">
      {/* LEFT HERO COLUMN - ROYAL BLUE SAFECART BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E56E3] via-[#1649CC] to-[#0D38A8] text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        {/* Background glow elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Safecart
              </h1>
              <p className="text-xs text-blue-200 font-medium">Secure-Path Escrow Platform</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-100 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SOC 2 Type II Certified Escrow
          </div>
        </div>

        {/* Hero Copy & Feature Cards */}
        <div className="my-auto relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Ship with confidence.<br />
            Get paid on delivery.
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-8">
            Safecart holds your funds in a regulated escrow account until your parcel is safely delivered and confirmed — protecting every transaction.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Funds Protected in Escrow</h3>
                <p className="text-xs text-blue-100 mt-0.5">Your payment is held securely until delivery is confirmed by the recipient.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Real-Time Parcel Tracking</h3>
                <p className="text-xs text-blue-100 mt-0.5">Monitor every step from pickup to doorstep with live carrier updates.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Instant Fund Release</h3>
                <p className="text-xs text-blue-100 mt-0.5">Escrow clears within 24 hours of confirmed delivery — no manual steps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200 flex items-center justify-between border-t border-white/10 pt-4">
          <span>&copy; {new Date().getFullYear()} Safecart Escrow Platform Inc.</span>
          <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* RIGHT AUTH FORM COLUMN WITH 2-ROLE SELECTION (SUPPLIER VS RECEIVER) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Top Pill Tab Switcher */}
          <div className="flex justify-end">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`px-5 py-1.5 rounded-lg transition-all ${!isSignUp ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`px-5 py-1.5 rounded-lg transition-all ${isSignUp ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isSignUp ? 'Create your Safecart account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isSignUp ? 'Join thousands of businesses securing transactions with escrow.' : 'Sign in to access your Safecart escrow overview and shipments.'}
            </p>
          </div>

          {/* ROLE SELECTION CARDS (2 ROLES ONLY: SUPPLIER VS RECEIVER) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('Supplier')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedRole === 'Supplier' 
                    ? 'border-[#1E56E3] bg-blue-50/60 text-[#1E56E3] shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-5 h-5 mb-2" />
                <div>
                  <p className="text-xs font-bold leading-tight">Supplier</p>
                  <p className="text-[10px] text-slate-400">Seller / Vendor</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('Receiver')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedRole === 'Receiver' 
                    ? 'border-[#1E56E3] bg-blue-50/60 text-[#1E56E3] shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5 mb-2" />
                <div>
                  <p className="text-xs font-bold leading-tight">Receiver</p>
                  <p className="text-[10px] text-slate-400">Buyer / Client</p>
                </div>
              </button>
            </div>
          </div>

          {/* Alert Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Marcus Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-blue-600 font-medium hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 font-medium">Keep me signed in for 30 days</label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? `Register as ${selectedRole}` : `Sign In as ${selectedRole}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
