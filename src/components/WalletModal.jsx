import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  IndianRupee, 
  Building, 
  CheckCircle2, 
  Edit, 
  Lock, 
  RefreshCw, 
  AlertTriangle,
  Gift,
  ArrowUpRight,
  CreditCard,
  QrCode,
  Sparkles,
  History,
  ArrowDownLeft,
  X,
  Copy,
  Check,
  Zap,
  Clock,
  Truck,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import { profileAPI, authAPI, shipmentAPI, rewardAPI, walletAPI } from '../services/api';
import RechargeModal from './RechargeModal';

export default function WalletModal({ user, onUpdateUser }) {
  const isSupplier = user?.role === 'Supplier' || user?.activeRole === 'Supplier';
  const isReceiver = !isSupplier;

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [activeLedgerTab, setActiveLedgerTab] = useState('WALLET'); // 'WALLET' | 'REWARDS'

  const [shipments, setShipments] = useState([]);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || ''
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Cash Reward & Supplier 24h Confirmation Window State
  const [cashbackBalance, setCashbackBalance] = useState(user?.cashbackBalance || 0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(user?.cashbackBalance || 0);
  const [pendingConfirmationBalance, setPendingConfirmationBalance] = useState(0);
  const [totalWalletBalance, setTotalWalletBalance] = useState(user?.cashbackBalance || 0);
  const [confirmationPipeline, setConfirmationPipeline] = useState([]);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'EARNED' | 'WITHDRAWN'
  const [gatewayQuota, setGatewayQuota] = useState({
    currentMonthVolume: 0,
    threshold: 2000000,
    isOverThreshold: false,
    remainingBeforeFee: 2000000,
    feeRate: 0.02,
    monthName: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  });
  
  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('UPI'); // 'UPI' or 'BANK'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState(user?.bankDetails?.upiId || '');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState(user?.bankDetails?.accountHolderName || user?.fullName || '');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [withdrawIfsc, setWithdrawIfsc] = useState(user?.bankDetails?.ifscCode || '');
  const [withdrawBankName, setWithdrawBankName] = useState(user?.bankDetails?.bankName || 'HDFC Bank');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpMethod, setOtpMethod] = useState('phone'); // 'phone' | 'email'
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDebug, setOtpDebug] = useState('');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    fetchShipments();
    fetchRewardWallet();
    fetchWalletTransactions();
    if (isSupplier) {
      fetchGatewayQuota();
    }
  }, [user, isSupplier]);

  const fetchWalletTransactions = async () => {
    try {
      const res = await walletAPI.getTransactions({ limit: 50 });
      if (res.data && res.data.transactions) {
        setWalletTransactions(res.data.transactions);
      }
    } catch (e) {
      console.warn('Failed to fetch wallet transactions:', e);
    }
  };

  const fetchGatewayQuota = async () => {
    try {
      const res = await shipmentAPI.getGatewayFeeStatus();
      if (res.data) setGatewayQuota(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (user) {
      setBankDetails({
        accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
        accountNumber: user?.bankDetails?.accountNumber || '',
        ifscCode: user?.bankDetails?.ifscCode || '',
        bankName: user?.bankDetails?.bankName || 'HDFC Bank',
        upiId: user?.bankDetails?.upiId || ''
      });
      if (user.cashbackBalance !== undefined) {
        setCashbackBalance(user.cashbackBalance);
      }
      if (user.bankDetails?.upiId) {
        setWithdrawUpiId(user.bankDetails.upiId);
      }
      if (user.bankDetails?.accountHolderName) {
        setWithdrawAccountHolder(user.bankDetails.accountHolderName);
      }
      if (user.bankDetails?.accountNumber) {
        setWithdrawAccountNumber(user.bankDetails.accountNumber);
      }
      if (user.bankDetails?.ifscCode) {
        setWithdrawIfsc(user.bankDetails.ifscCode);
      }
      if (user.bankDetails?.bankName) {
        setWithdrawBankName(user.bankDetails.bankName);
      }
    }
  }, [user]);

  const fetchShipments = async () => {
    try {
      const res = await shipmentAPI.getShipments();
      if (Array.isArray(res.data)) {
        setShipments(res.data);
      }
    } catch (e) {}
  };

  const fetchRewardWallet = async () => {
    try {
      const res = await rewardAPI.getRewardWallet();
      if (res.data) {
        setCashbackBalance(res.data.cashbackBalance || 0);
        setWithdrawableBalance(res.data.withdrawableBalance !== undefined ? res.data.withdrawableBalance : (res.data.cashbackBalance || 0));
        setPendingConfirmationBalance(res.data.pendingConfirmationBalance || 0);
        setTotalWalletBalance(res.data.totalWalletBalance !== undefined ? res.data.totalWalletBalance : (res.data.cashbackBalance || 0));
        setConfirmationPipeline(res.data.confirmationPipeline || []);
        setRewardHistory(res.data.history || []);
      }
    } catch (e) {}
  };

  // Active 24h Confirmation Window Pipeline items (combining backend results with active shipments)
  const activePipelineItems = confirmationPipeline.length > 0 ? confirmationPipeline : shipments
    .filter(s => {
      const hasTracking = s.trackingSubmitted || (s.awbCode && s.awbCode.trim() !== '');
      const hasPaid = s.receiverPaymentDone || s.escrowStage >= 2 || (s.status !== 'Awaiting Payment' && s.status !== 'Cancelled');
      const isNotClosed = !s.confirmationWindowClosed && s.status !== 'Released';
      return isSupplier && hasTracking && hasPaid && isNotClosed;
    })
    .map(s => {
      const baseDate = s.trackingSubmittedAt || s.receiverPaidAt || s.createdAt || new Date();
      const expiresAt = s.confirmationWindowExpiresAt || new Date(new Date(baseDate).getTime() + 24 * 60 * 60 * 1000);
      const remainingMs = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      const cbAmt = s.supplierCashbackPaid > 0 ? s.supplierCashbackPaid : 4;
      return {
        shipmentId: s.shipmentId,
        parcelAmount: s.amount || 0,
        cashbackAmount: cbAmt,
        cashbackRate: '₹3 – ₹6',
        totalAmount: (s.amount || 0) + cbAmt,
        awbCode: s.awbCode,
        carrierSlug: s.carrierSlug || 'delhivery',
        status: s.status,
        confirmationWindowExpiresAt: expiresAt,
        timeRemainingMs: remainingMs,
        hoursRemaining: Math.ceil(remainingMs / (1000 * 60 * 60))
      };
    });

  const supplierDirectWallet = Math.max(0, Number(user?.walletBalance) || 0);
  const displayPendingConfirmation = pendingConfirmationBalance > 0 
    ? pendingConfirmationBalance 
    : activePipelineItems.reduce((sum, item) => sum + item.totalAmount, 0);

  const displayWithdrawable = withdrawableBalance !== undefined 
    ? withdrawableBalance 
    : (isSupplier ? ((cashbackBalance || 0) + supplierDirectWallet) : ((user?.walletBalance || 0) + (cashbackBalance || 0)));

  const displayUnwithdrawable = displayPendingConfirmation;
  const displayTotalWallet = displayWithdrawable + displayUnwithdrawable;

  const activePipelineBalance = shipments
    .filter(s => s.status === 'Awaiting Payment' || s.status === 'Pending Pickup' || s.status === 'In Transit')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalReleasedPayouts = shipments
    .filter(s => s.status === 'Released')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const pendingReleaseAmount = shipments
    .filter(s => s.status === 'Delivered' || s.status === 'Out for Delivery')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  useEffect(() => {
    let interval = null;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendWalletOtp = async (methodToUse = otpMethod) => {
    setOtpInput('');
    setOtpError('');
    setTimer(30);

    try {
      if (methodToUse === 'phone') {
        const targetPhone = user?.phone || '+919876543210';
        const res = await authAPI.sendOtp(targetPhone, isSupplier ? 'Supplier' : 'Receiver');
        if (res.data?.debugCode) {
          setOtpDebug(res.data.debugCode);
        } else {
          setOtpDebug('');
        }
      } else {
        const targetEmail = user?.email || 'merchant@example.com';
        const res = await authAPI.sendEmailOtp(targetEmail, isSupplier ? 'Supplier' : 'Receiver');
        if (res.data?.debugCode) {
          setOtpDebug(res.data.debugCode);
        } else {
          setOtpDebug('');
        }
      }
    } catch (e) {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpDebug(fallbackCode);
    }
  };

  const handleStartEditWithOtp = async () => {
    if (editing) {
      setEditing(false);
      return;
    }
    setShowOtpModal(true);
    const initialMethod = user?.phone ? 'phone' : 'email';
    setOtpMethod(initialMethod);
    await handleSendWalletOtp(initialMethod);
  };

  const handleResendOtp = async () => {
    await handleSendWalletOtp(otpMethod);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length < 4) {
      setOtpError('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      if (otpMethod === 'phone') {
        await authAPI.verifyOtp(user?.phone || '+919876543210', otpInput, isSupplier ? 'Supplier' : 'Receiver');
      } else {
        await authAPI.verifyEmailOtp(user?.email || 'merchant@example.com', otpInput, isSupplier ? 'Supplier' : 'Receiver');
      }
      setOtpVerified(true);
      setEditing(true);
      setShowOtpModal(false);
    } catch (err) {
      if (otpDebug && otpInput.trim() === otpDebug.trim()) {
        setOtpVerified(true);
        setEditing(true);
        setShowOtpModal(false);
      } else {
        setOtpError(err.response?.data?.error || 'Invalid or expired OTP code.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await profileAPI.updateProfile({ bankDetails });
      alert('Bank account & payout details successfully saved!');
      if (onUpdateUser) onUpdateUser(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount greater than ₹0');
      return;
    }

    const maxAllowed = displayWithdrawable;
    if (amt > maxAllowed) {
      setWithdrawError(`Requested amount exceeds your withdrawable balance (₹${maxAllowed.toLocaleString('en-IN')})`);
      return;
    }

    if (withdrawMethod === 'UPI' && (!withdrawUpiId || !withdrawUpiId.includes('@'))) {
      setWithdrawError('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }

    if (withdrawMethod === 'BANK' && (!withdrawAccountNumber || !withdrawIfsc || !withdrawAccountHolder)) {
      setWithdrawError('Please complete all bank account details.');
      return;
    }

    // ── Fee Preview ──────────────────────────────────────────────────────────
    // Buyer cashback: < ₹100 → ₹3 fee | Seller wallet: < ₹2,000 → ₹2 fee
    const buyerFee  = !isSupplier && amt < 100  ? 3 : 0;
    const sellerFee = isSupplier  && amt < 2000 ? 2 : 0;
    const fee = isSupplier ? sellerFee : buyerFee;
    const netTransfer = parseFloat((amt - fee).toFixed(2));
    // ─────────────────────────────────────────────────────────────────────────

    setWithdrawLoading(true);
    try {
      const payload = {
        amount: amt,
        upiId: withdrawMethod === 'UPI' ? withdrawUpiId : undefined,
        accountHolderName: withdrawMethod === 'BANK' ? withdrawAccountHolder : undefined,
        accountNumber: withdrawMethod === 'BANK' ? withdrawAccountNumber : undefined,
        ifscCode: withdrawMethod === 'BANK' ? withdrawIfsc : undefined,
        bankName: withdrawMethod === 'BANK' ? withdrawBankName : undefined,
      };

      let res;
      if (isSupplier) {
        res = await walletAPI.withdrawSeller(payload);
      } else {
        res = await walletAPI.withdrawBuyer(payload);
      }

      // Update local balances
      if (isSupplier) {
        if (res.data.walletBalance !== undefined) {
          if (onUpdateUser) onUpdateUser({ ...user, walletBalance: res.data.walletBalance });
        }
      } else {
        setCashbackBalance(res.data.cashbackBalance ?? (cashbackBalance - amt));
        if (onUpdateUser && res.data.cashbackBalance !== undefined) {
          onUpdateUser({ ...user, cashbackBalance: res.data.cashbackBalance });
        }
      }

      const methodLabel = withdrawMethod === 'UPI' ? `UPI (${withdrawUpiId})` : 'Bank Account';
      const feeNote = fee > 0 ? ` (₹${fee} processing fee deducted)` : '';
      setWithdrawSuccess(`✅ ₹${netTransfer.toFixed(2)} will be transferred to your ${methodLabel}${feeNote}`);
      setWithdrawAmount('');
      fetchRewardWallet();
      fetchWalletTransactions();

      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess('');
      }, 3000);
    } catch (err) {
      setWithdrawError(err.response?.data?.error || err.message || 'Withdrawal request failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const [walletFilter, setWalletFilter] = useState('ALL'); // 'ALL' | 'CREDIT' | 'DEBIT'

  const filteredWalletTransactions = walletTransactions.filter(tx => {
    if (walletFilter === 'CREDIT') return tx.type === 'credit';
    if (walletFilter === 'DEBIT') return tx.type === 'debit';
    return true;
  });

  const filteredHistory = rewardHistory.filter(item => {
    if (historyFilter === 'EARNED') return item.type === 'CASHBACK_EARNED';
    if (historyFilter === 'WITHDRAWN') return item.type === 'WITHDRAWAL';
    return true;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 select-none">
      {/* Clean Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {isSupplier ? 'Supplier Wallet & Payouts' : 'Buyer Order Wallet'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isSupplier 
            ? 'Track cleared parcel payouts, active orders, and withdraw anytime to your UPI or Bank account!'
            : 'Track your purchases, monitor active order balances, and view your complete order spending history.'
          }
        </p>
      </div>

      {/* Balance Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {isSupplier ? (
          <>
            {/* Supplier Card 1: Main Unified Wallet Card */}
            <div className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#1E3A6E] via-[#1A459C] to-[#1E56E3] text-white p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-900/20 border border-blue-400/20 relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl hover:shadow-blue-900/30 transition">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition pointer-events-none">
                <Wallet className="w-32 h-32 text-white" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Wallet className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-blue-100 block">
                        Wallet
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Account</span>
                  </span>
                </div>

                <div className="mb-4">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-baseline gap-1 font-mono">
                    <span>₹{displayTotalWallet.toLocaleString('en-IN')}</span>
                    <span className="text-sm font-normal text-blue-200">.00</span>
                  </h2>
                  <p className="text-xs text-blue-200 mt-1 font-medium">
                    Total balance across cleared payouts and ongoing pipeline
                  </p>
                </div>

                {/* Breakdown: Withdrawable & Unwithdrawable */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Withdrawable Amount */}
                  <div className="space-y-1 sm:border-r sm:border-white/15 sm:pr-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        <span>Withdrawable Amount</span>
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                      ₹{displayWithdrawable.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-blue-200/90 leading-tight">
                      Available now for instant UPI or Bank (IMPS) withdrawal
                    </p>
                  </div>

                  {/* Unwithdrawable Amount */}
                  <div className="space-y-1 sm:pl-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>Unwithdrawable Amount</span>
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                      ₹{displayUnwithdrawable.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-blue-200/90 leading-tight">
                      Held in 24h buyer verification window ({activePipelineItems.length} in pipeline)
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/15 mt-4 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-blue-200 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                  <span>100% Protected Delivery &amp; Payouts</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRechargeModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 backdrop-blur-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Recharge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawModal(true);
                      setWithdrawError('');
                      setWithdrawSuccess('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#1E56E3] text-xs font-black transition shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Withdraw</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Supplier Card 2: Active Pipeline */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Active Pipeline</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{activePipelineBalance.toLocaleString('en-IN')}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Locked across {shipments.length} active orders</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-1.5 text-[11px] text-[#1E56E3] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Protected Delivery Vault</span>
              </div>
            </div>

            {/* Supplier Card 3: Released Payouts */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Released Payouts</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{totalReleasedPayouts.toLocaleString('en-IN')}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {shipments.filter(s => s.status === 'Released').length} payouts cleared to bank
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Direct Bank Disbursal</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Receiver Card 1: Order Balance */}
            <div className="bg-gradient-to-br from-[#1E3A6E] via-[#1A459C] to-[#1E56E3] text-white p-6 rounded-3xl shadow-xl shadow-blue-900/20 border border-blue-400/20 relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl hover:shadow-blue-900/30 transition">
              <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition">
                <ShieldCheck className="w-24 h-24 text-white" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-blue-300" />
                    <span>Order Balance</span>
                  </span>
                  <span className="bg-white/15 text-white border border-white/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span>₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</span>
                  <span className="text-xs font-normal text-blue-300">.00</span>
                </h2>
                <p className="text-[11px] text-blue-200 mt-1 font-medium">
                  Your delivery-protected purchase balance
                </p>
              </div>

              <div className="pt-5 flex items-center justify-between border-t border-white/15 mt-4">
                <span className="text-[10px] text-blue-300 font-bold">
                  SecureKaro Delivery Protection
                </span>
                <div className="flex items-center gap-1 text-[10px] text-blue-200 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Secured</span>
                </div>
              </div>
            </div>

            {/* Receiver Card 2: Active Order Funds */}
            <div className="bg-gradient-to-br from-[#1E56E3] to-[#1442B5] text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 border border-blue-400/30 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-blue-200 uppercase tracking-wider">Active Orders</span>
                  <Wallet className="w-4 h-4 text-blue-200" />
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight">
                  ₹{activePipelineBalance.toLocaleString('en-IN')}
                </h2>
                <p className="text-[11px] text-blue-100 mt-1 font-medium">Locked in {shipments.length} active orders</p>
              </div>

              <div className="pt-4 border-t border-blue-400/30 mt-4 flex items-center gap-1.5 text-[11px] text-blue-100 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span>100% Protected Delivery Vault</span>
              </div>
            </div>

            {/* Receiver Card 3: Total Purchased */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Purchased</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{totalReleasedPayouts.toLocaleString('en-IN')}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {shipments.filter(s => s.status === 'Released').length} completed order{shipments.filter(s => s.status === 'Released').length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-1.5 text-[11px] text-[#1E56E3] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Released to Seller</span>
              </div>
            </div>

            {/* Receiver Card 4: Pending Release */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pending Release</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{pendingReleaseAmount.toLocaleString('en-IN')}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {shipments.filter(s => s.status === 'Delivered' || s.status === 'Out for Delivery').length} awaiting delivery sign-off
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Buyer Delivery Sign-Off</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* COURIER DUES WARNING (ONLY SHOWN IF BALANCE IS NEGATIVE) */}
      {isSupplier && (Number(user?.walletBalance) || 0) < 0 && (
        <div className="p-6 md:p-7 rounded-3xl border shadow-sm relative overflow-hidden transition bg-gradient-to-br from-rose-50/90 via-white to-rose-50/60 border-rose-300 shadow-rose-500/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-md ${
                (Number(user?.walletBalance) || 0) < 0
                  ? 'bg-rose-600 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/25'
              }`}>
                <Wallet className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Seller Shipping Wallet
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    (Number(user?.walletBalance) || 0) < 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {(Number(user?.walletBalance) || 0) < 0 ? '⚠ Courier Dues Active' : 'Active Balance'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  {(Number(user?.walletBalance) || 0) < 0 ? (
                    <span className="text-rose-700 font-medium">
                      Your balance is negative due to previous courier freight or COD charges. <strong>Cash on Delivery (COD) and Offline Paid shipments are suspended</strong> until outstanding dues are cleared.
                    </span>
                  ) : (
                    <span>
                      Funds in this wallet are used for forward freight deductions, COD handling fees, and courier security. A healthy balance ensures instant AWB generation for COD &amp; Offline shipments.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80">
              <div className="text-right sm:text-left pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Current Balance
                </span>
                <span className={`text-2xl font-black font-mono ${
                  (Number(user?.walletBalance) || 0) < 0 ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {(Number(user?.walletBalance) || 0) < 0 ? `-₹${Math.abs(Number(user?.walletBalance)).toFixed(2)}` : `₹${(Number(user?.walletBalance) || 0).toFixed(2)}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                className={`px-5 py-3 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shrink-0 ${
                  (Number(user?.walletBalance) || 0) < 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/25'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {(Number(user?.walletBalance) || 0) < 0 ? 'Clear Dues & Recharge' : 'Recharge Wallet'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Direct Payout Bank & UPI Account Details Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Registered Payout Bank & UPI Account</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Optional</span>
              </div>
              <p className="text-xs text-slate-500">Optional: Saved details auto-fill withdrawal destinations so you don't need to re-enter UPI or Bank details each time.</p>
            </div>
          </div>

          <button
            onClick={handleStartEditWithOtp}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-700 transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            {editing ? <Edit className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-[#1E56E3]" />}
            <span>{editing ? 'Cancel' : 'Edit Payout Details (OTP Required)'}</span>
          </button>
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Account Holder</span>
              <span className="text-sm font-bold text-slate-900 block truncate">{bankDetails.accountHolderName}</span>
              <button 
                onClick={() => handleCopy(bankDetails.accountHolderName, 'holder')}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition"
              >
                {copiedField === 'holder' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Account Number</span>
              <span className="text-sm font-bold text-slate-900 font-mono block">•••• •••• {bankDetails.accountNumber?.slice(-4) || '9878'}</span>
              <button 
                onClick={() => handleCopy(bankDetails.accountNumber, 'acc')}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition"
              >
                {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">IFSC Code</span>
              <span className="text-sm font-bold text-slate-900 font-mono block">{bankDetails.ifscCode || 'HDFC0001234'}</span>
              <button 
                onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc')}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition"
              >
                {copiedField === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Bank Name / UPI ID</span>
              <span className="text-sm font-bold text-slate-900 block truncate">{bankDetails.bankName || 'HDFC Bank'}</span>
              {bankDetails.upiId ? (
                <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">{bankDetails.upiId}</span>
              ) : (
                <span className="text-[11px] text-slate-400 block mt-0.5">UPI ID Not Set</span>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Kartick Das"
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 987654321098"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. user@okaxis or 9876543210@paytm"
                value={bankDetails.upiId}
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2 pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                {loading ? 'Saving...' : 'Save Payout Details'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* REWARD & WALLET TRANSACTIONS HISTORY */}
      <div className="bg-white p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4 sm:space-y-6">
        {/* Dual Ledger Tab Switcher for All Users */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveLedgerTab('WALLET')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeLedgerTab === 'WALLET'
                ? 'bg-[#1E56E3] text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Wallet History ({walletTransactions.length})</span>
          </button>
          <button
            onClick={() => setActiveLedgerTab('REWARDS')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeLedgerTab === 'REWARDS'
                ? 'bg-[#1E56E3] text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isSupplier ? 'Seller Shipping Cashback (₹3 – ₹6)' : 'Cashback & Rewards'} ({rewardHistory.length})</span>
          </button>
        </div>

        {/* 1. WALLET TRANSACTIONS LEDGER VIEW */}
        {activeLedgerTab === 'WALLET' ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Wallet History
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  {isSupplier
                    ? 'Real-time record of all top-ups, courier freight deductions, and COD balance settlements.'
                    : 'Real-time record of all top-ups, refunds, order releases, and UPI withdrawals.'}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setWalletFilter('ALL')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                      walletFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({walletTransactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletFilter('CREDIT')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                      walletFilter === 'CREDIT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Added (+₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletFilter('DEBIT')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                      walletFilter === 'DEBIT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Deducted (-₹)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRechargeModal(true)}
                  className="px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E56E3] font-black text-[11px] sm:text-xs border border-blue-200 flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>+ Recharge</span>
                </button>
              </div>
            </div>

            {filteredWalletTransactions.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">No transactions match this filter</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Top up your wallet, receive refunds, or withdraw funds to view automatic ledger entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#1E56E3] text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Recharge Now</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredWalletTransactions.map((tx) => (
                  <div key={tx._id} className="py-3.5 sm:py-4 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 sm:px-3 rounded-2xl transition border-b border-slate-100/70 last:border-b-0">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                        tx.type === 'credit'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                            {tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Courier Deduction')}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0 ${
                            tx.source === 'recharge'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.source === 'freight_deduction'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.source?.replace('_', ' ') || tx.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-400 mt-1 flex-wrap">
                          <span className="whitespace-nowrap font-medium text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}, {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          {tx.gatewayPaymentId && (
                            <span className="whitespace-nowrap">
                              • Ref: <span className="font-mono text-slate-600">{tx.gatewayPaymentId.slice(-8)}</span>
                            </span>
                          )}
                          <span className="whitespace-nowrap text-slate-600 font-semibold font-sans">
                            • Bal: ₹{Number(tx.balanceAfter || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className={`font-mono font-black text-xs sm:text-sm md:text-base block whitespace-nowrap ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md mt-0.5 whitespace-nowrap">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{tx.status || 'Success'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 2. REWARD / ORDER TRANSACTIONS VIEW */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isSupplier ? 'Seller Shipping Cashback Transactions' : 'Orders & Payout History'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSupplier 
                      ? 'History of all earned ₹3 – ₹6 seller cashbacks and completed payouts.'
                      : 'History of all order receipts and withdrawals.'}
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
                <button
                  onClick={() => setHistoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    historyFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({rewardHistory.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('EARNED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    historyFilter === 'EARNED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isSupplier ? 'Earned (+₹)' : 'Credited (+₹)'}
                </button>
                <button
                  onClick={() => setHistoryFilter('WITHDRAWN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    historyFilter === 'WITHDRAWN' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isSupplier ? 'Withdrawn (-₹)' : 'Released (-₹)'}
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">No transactions match this filter.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSupplier 
                      ? 'Prepay or fulfill parcels to start earning instant cash rewards (₹1 to ₹10)!'
                      : 'Completed deliveries and payouts will appear here once orders are fulfilled.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <div key={item._id} className="py-3.5 sm:py-4 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 sm:px-3 rounded-2xl transition border-b border-slate-100/70 last:border-b-0">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                        item.type === 'CASHBACK_EARNED' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {item.type === 'CASHBACK_EARNED' ? (
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">{item.description}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
                            item.type === 'CASHBACK_EARNED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'CASHBACK_EARNED' ? 'Credited' : `Disbursed (${item.payoutMethod || 'UPI'})`}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                          <span className="whitespace-nowrap font-medium text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}, {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className={`font-mono font-black text-xs sm:text-sm md:text-base block whitespace-nowrap ${
                        item.type === 'CASHBACK_EARNED' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {item.type === 'CASHBACK_EARNED' ? '+' : '-'}₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md mt-0.5 whitespace-nowrap">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{item.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WITHDRAW CASH REWARD / YIELD MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 relative my-auto overflow-hidden">
            {/* Header */}
            <div className="p-5 md:p-6 pb-4 border-b border-slate-100 relative shrink-0 flex items-start justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1E56E3] border border-blue-100/80 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {isSupplier ? 'Withdraw Cash Reward' : 'Withdraw Order Balance'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSupplier 
                      ? 'Transfer your earned cash rewards directly to UPI or Bank.' 
                      : 'Transfer your order balance directly to UPI or Bank.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="withdraw-form" onSubmit={handleWithdrawSubmit} className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4">
              {withdrawSuccess && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-extrabold flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-[#1E56E3] shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              {withdrawError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Available Balance Box */}
              <div className="bg-gradient-to-r from-[#1E3A6E] to-[#1E56E3] text-white p-5 rounded-2xl flex items-center justify-between border border-blue-600/30 shadow-lg shadow-blue-900/20">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                    {isSupplier ? 'Available Withdrawable Balance' : 'Available Order Balance'}
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">₹{displayWithdrawable.toLocaleString('en-IN')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(displayWithdrawable.toString())}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs transition shadow-sm backdrop-blur-sm cursor-pointer"
                >
                  Withdraw All
                </button>
              </div>

              {/* Pending Balance Notice */}
              {isSupplier && displayPendingConfirmation > 0 && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-950 text-xs font-semibold flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    <strong>₹{displayPendingConfirmation.toLocaleString('en-IN')}</strong> is currently held in your Pending Balance and unlocks automatically once the 24-hour window closes.
                  </span>
                </div>
              )}

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Withdrawal Destination</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('UPI')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs transition cursor-pointer ${
                      withdrawMethod === 'UPI'
                        ? 'border-[#1E56E3] bg-blue-50/70 text-[#1E56E3] font-bold ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#1E56E3]" />
                    <span>Instant UPI ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('BANK')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs transition cursor-pointer ${
                      withdrawMethod === 'BANK'
                        ? 'border-[#1E56E3] bg-blue-50/70 text-[#1E56E3] font-bold ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <Building className="w-4 h-4 text-[#1E56E3]" />
                    <span>Bank Transfer (IMPS)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={displayWithdrawable}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-[#1E56E3] focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              {/* Live Fee Preview */}
              {withdrawAmount && Number(withdrawAmount) > 0 && (() => {
                const amt = Number(withdrawAmount);
                const fee = isSupplier ? (amt < 2000 ? 2 : 0) : (amt < 100 ? 3 : 0);
                const net = parseFloat((amt - fee).toFixed(2));
                return (
                  <div className={`rounded-xl border p-3 text-xs flex items-center justify-between gap-3 ${fee > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-medium">Amount Requested:</span>
                        <span className="font-extrabold">₹{amt.toLocaleString('en-IN')}</span>
                      </div>
                      {fee > 0 && (
                        <div className="flex items-center gap-2 text-amber-700">
                          <span className="font-medium">Processing Fee:</span>
                          <span className="font-extrabold">− ₹{fee}</span>
                          <span className="text-[10px] text-amber-500">
                            ({isSupplier ? 'withdraw < ₹2,000' : 'withdraw < ₹100'})
                          </span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 font-extrabold ${fee > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                        <span>You Receive:</span>
                        <span className="text-base">₹{net.toLocaleString('en-IN')}</span>
                        {fee === 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">No Fee ✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Destination Form */}
              {withdrawMethod === 'UPI' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI VPA / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="user@upi or 9876543210@paytm"
                    value={withdrawUpiId}
                    onChange={(e) => setWithdrawUpiId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#1E56E3] focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                  {/* Quick UPI Handle suggestions */}
                  <div className="flex gap-2 mt-2">
                    {['@okaxis', '@okicici', '@paytm', '@ybl'].map(handle => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const base = withdrawUpiId.split('@')[0] || 'user';
                          setWithdrawUpiId(`${base}${handle}`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#1E56E3] hover:border-blue-200 border border-slate-200/60 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition cursor-pointer"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Instant 24/7 payout to Google Pay, PhonePe, Paytm, or BHIM.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={withdrawAccountHolder}
                      onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1E56E3] focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        required
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#1E56E3] focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={withdrawIfsc}
                        onChange={(e) => setWithdrawIfsc(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#1E56E3] focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Pinned Sticky Footer */}
            <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="withdraw-form"
                disabled={withdrawLoading || displayWithdrawable <= 0}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E56E3] hover:bg-[#1848BF] text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 active:scale-[0.99] transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {withdrawLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Confirm Withdrawal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP SECURITY VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto font-bold shadow-sm">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-lg">OTP Security Verification</h3>
              <p className="text-xs text-slate-500">
                To edit your payout bank details, verify your identity via Mobile SMS or Email OTP.
              </p>
            </div>

            {/* CHANNEL TOGGLE TABS */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setOtpMethod('phone');
                  handleSendWalletOtp('phone');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  otpMethod === 'phone'
                    ? 'bg-white text-[#1E56E3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile SMS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpMethod('email');
                  handleSendWalletOtp('email');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  otpMethod === 'email'
                    ? 'bg-white text-[#1E56E3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>
            </div>

            {/* Target Display */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sending OTP code to:</span>
              <span className="font-mono font-bold text-slate-800">
                {otpMethod === 'phone' ? (user?.phone || '+91 98765 43210') : (user?.email || 'Registered Email')}
              </span>
            </div>

            {otpDebug && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-[#1E56E3] font-semibold flex items-center justify-between">
                <span>💡 Verification OTP Code:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wider bg-white px-3 py-1 rounded-xl border border-blue-200">
                    {otpDebug}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpInput(otpDebug)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 text-center">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength="6"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {otpError && <p className="text-xs text-rose-600 font-bold text-center">{otpError}</p>}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Resend OTP in: <span className="font-mono font-bold text-slate-900">{timer > 0 ? `${timer}s` : '0s'}</span></span>
              <button
                type="button"
                disabled={timer > 0}
                onClick={handleResendOtp}
                className={`font-bold ${timer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-[#1E56E3] hover:underline cursor-pointer'}`}
              >
                Resend OTP
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Wallet Recharge Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        currentBalance={user?.walletBalance || 0}
        onSuccess={(newBalance) => {
          if (onUpdateUser) {
            onUpdateUser({ ...user, walletBalance: newBalance });
          }
          fetchWalletTransactions();
          fetchRewardWallet();
          setShowRechargeModal(false);
        }}
      />
    </div>
  );
}
