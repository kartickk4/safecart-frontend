import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, Users, Package, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Search, Filter, ArrowUpRight, ArrowDownLeft,
  DollarSign, Wallet, Send, Download, Eye, Lock, Unlock, FileText,
  Activity, Radio, Scale, ChevronRight, Sliders, ChevronDown, Check,
  X, Bell, Info, Sparkles, Building, Phone, Mail, Clock, Calendar,
  TrendingUp, Award, AlertCircle, ArrowLeft, ExternalLink, RotateCcw,
  Truck, QrCode, Trash2, Edit3, Settings, CreditCard, Layers,
  FileSpreadsheet, HelpCircle
} from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminView({ user, onBackToApp }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');
  const [financeSubTab, setFinanceSubTab] = useState('summary'); // 'summary' | 'live_escrow' | 'withdrawals'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [analytics, setAnalytics] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Shipments
  const [shipments, setShipments] = useState([]);
  const [totalShipments, setTotalShipments] = useState(0);
  const [shipmentPage, setShipmentPage] = useState(1);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');

  // Returns
  const [returns, setReturns] = useState([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsSearch, setReturnsSearch] = useState('');
  const [returnsStatusFilter, setReturnsStatusFilter] = useState('all');

  // Disputes
  const [disputes, setDisputes] = useState([]);
  const [disputeFilter, setDisputeFilter] = useState('all');

  // Finance & Payouts
  const [financials, setFinancials] = useState(null);
  const [liveEscrow, setLiveEscrow] = useState([]);
  const [totalLiveEscrowHeld, setTotalLiveEscrowHeld] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);

  // System Config & Health
  const [systemConfig, setSystemConfig] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [bulkJobs, setBulkJobs] = useState([]);
  const [configSaving, setConfigSaving] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [totalAuditLogs, setTotalAuditLogs] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // ── Modals & Drawers ─────────────────────────────────────────────────────
  // User modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '', bankDetails: {} });
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ balanceType: 'wallet', action: 'credit', amount: '', reason: '' });
  const [isDirectNotifyOpen, setIsDirectNotifyOpen] = useState(false);
  const [directNotifyForm, setDirectNotifyForm] = useState({ title: '', message: '', type: 'info' });
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isUserTransactionsOpen, setIsUserTransactionsOpen] = useState(false);
  const [userTransactions, setUserTransactions] = useState([]);

  // Shipment modals
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [detailedShipment, setDetailedShipment] = useState(null);
  const [isShipmentDetailOpen, setIsShipmentDetailOpen] = useState(false);
  const [shipmentClaims, setShipmentClaims] = useState([]);
  const [shipmentJourneys, setShipmentJourneys] = useState([]);

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusOverrideNotes, setStatusOverrideNotes] = useState('');

  const [isForceReleaseOpen, setIsForceReleaseOpen] = useState(false);
  const [forceReleaseReason, setForceReleaseReason] = useState('');

  const [isForceRefundOpen, setIsForceRefundOpen] = useState(false);
  const [forceRefundReason, setForceRefundReason] = useState('');

  const [isCancelShipmentOpen, setIsCancelShipmentOpen] = useState(false);
  const [cancelShipmentReason, setCancelShipmentReason] = useState('');

  const [isEditShipmentOpen, setIsEditShipmentOpen] = useState(false);
  const [editShipmentForm, setEditShipmentForm] = useState({ receiverName: '', receiverPhone: '', amount: '', description: '', city: '' });

  // Returns modals
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isApproveReturnOpen, setIsApproveReturnOpen] = useState(false);
  const [returnApproveForm, setReturnApproveForm] = useState({ returnAwbCode: '', returnCarrierSlug: 'delhivery', notes: '' });
  const [isRejectReturnOpen, setIsRejectReturnOpen] = useState(false);
  const [returnRejectReason, setReturnRejectReason] = useState('');
  const [isSetReturnAwbOpen, setIsSetReturnAwbOpen] = useState(false);
  const [returnAwbForm, setReturnAwbForm] = useState({ returnAwbCode: '', returnCarrierSlug: 'delhivery', returnCarrierName: 'Delhivery Surface' });
  const [isSetReplacementAwbOpen, setIsSetReplacementAwbOpen] = useState(false);
  const [replacementAwbForm, setReplacementAwbForm] = useState({ replacementAwbCode: '', replacementCarrierSlug: 'delhivery', replacementCarrierName: 'Delhivery Surface' });
  const [isReturnStatusModalOpen, setIsReturnStatusModalOpen] = useState(false);
  const [newReturnStatus, setNewReturnStatus] = useState('Approved');
  const [returnStatusNotes, setReturnStatusNotes] = useState('');

  // Dispute modals
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeDecision, setDisputeDecision] = useState('favor_seller');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [splitSellerAmount, setSplitSellerAmount] = useState('');
  const [splitBuyerAmount, setSplitBuyerAmount] = useState('');

  // Payout / Withdrawal modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ action: 'approve', transactionRef: '', reason: '' });

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastType, setBroadcastType] = useState('alert');

  // Preview & Audit
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Check admin rights
  const isAdmin = user && (
    user.isAdmin === true ||
    user.role === 'Admin' ||
    user.role === 'super_admin' ||
    user.adminRole ||
    user.email === 'kartickdas6289@gmail.com'
  );

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTabContent = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await adminAPI.getAnalytics();
        if (res.data?.success) setAnalytics(res.data);
      } else if (activeTab === 'users') {
        await fetchUsers(1);
      } else if (activeTab === 'shipments') {
        await fetchShipments(1);
      } else if (activeTab === 'returns') {
        await fetchReturns(1);
      } else if (activeTab === 'disputes') {
        await fetchDisputes();
      } else if (activeTab === 'finance') {
        const [finRes, anaRes, escRes, withRes] = await Promise.all([
          adminAPI.getFinancialSummary(),
          adminAPI.getAnalytics(),
          adminAPI.getLiveEscrow(),
          adminAPI.getWithdrawals()
        ]);
        if (finRes.data?.success) setFinancials(finRes.data);
        if (anaRes.data?.success) setAnalytics(anaRes.data);
        if (escRes.data?.success) {
          setLiveEscrow(escRes.data.shipments || []);
          setTotalLiveEscrowHeld(escRes.data.totalEscrowHeld || 0);
        }
        if (withRes.data?.success) setWithdrawals(withRes.data.withdrawals || []);
      } else if (activeTab === 'system') {
        const [cfgRes, jobRes] = await Promise.all([
          adminAPI.getSystemConfig(),
          adminAPI.getBulkJobs()
        ]);
        if (cfgRes.data?.success) {
          setSystemConfig(cfgRes.data.config || {});
          setSystemHealth(cfgRes.data.health || {});
        }
        if (jobRes.data?.success) setBulkJobs(jobRes.data.jobs || []);
      } else if (activeTab === 'audit') {
        await fetchAuditLogs(1);
      }
    } catch (err) {
      console.error('Failed to load admin tab content:', err);
      showToast(err.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
      loadTabContent();
    }
  }, [activeTab, isAdmin, loadTabContent]);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchUsers = async (page = 1) => {
    try {
      const params = { page, limit: 15 };
      if (userSearch) params.search = userSearch;
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userStatusFilter !== 'all') params.isSuspended = userStatusFilter === 'suspended';
      const res = await adminAPI.getUsers(params);
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setTotalUsers(res.data.total || 0);
        setUserPage(page);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchShipments = async (page = 1) => {
    try {
      const params = { page, limit: 15 };
      if (shipmentSearch) params.search = shipmentSearch;
      if (shipmentStatusFilter !== 'all') params.status = shipmentStatusFilter;
      const res = await adminAPI.getShipments(params);
      if (res.data?.success) {
        setShipments(res.data.shipments || []);
        setTotalShipments(res.data.total || 0);
        setShipmentPage(page);
      }
    } catch (err) {
      console.error('Error fetching shipments:', err);
    }
  };

  const fetchReturns = async (page = 1) => {
    try {
      const params = { page, limit: 15 };
      if (returnsSearch) params.search = returnsSearch;
      if (returnsStatusFilter !== 'all') params.status = returnsStatusFilter;
      const res = await adminAPI.getReturns(params);
      if (res.data?.success) {
        setReturns(res.data.returns || []);
        setTotalReturns(res.data.total || 0);
        setReturnsPage(page);
      }
    } catch (err) {
      console.error('Error fetching returns:', err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const params = disputeFilter !== 'all' ? { status: disputeFilter } : {};
      const res = await adminAPI.getDisputes(params);
      if (res.data?.success) {
        setDisputes(res.data.claims || []);
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (auditActionFilter !== 'all') params.action = auditActionFilter;
      const res = await adminAPI.getAuditLogs(params);
      if (res.data?.success) {
        setAuditLogs(res.data.logs || []);
        setTotalAuditLogs(res.data.total || 0);
        setAuditPage(page);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  // ── Action Handlers ──────────────────────────────────────────────────────
  const handleOpenShipmentDetail = async (shipment) => {
    setActionLoading(true);
    try {
      const res = await adminAPI.getShipmentById(shipment.shipmentId || shipment._id);
      if (res.data?.success) {
        setDetailedShipment(res.data.shipment);
        setShipmentClaims(res.data.claims || []);
        setShipmentJourneys(res.data.carrierJourneys || []);
        setIsShipmentDetailOpen(true);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load shipment details', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceRelease = async () => {
    if (!selectedShipment) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.forceReleaseEscrow(selectedShipment.shipmentId, forceReleaseReason);
      showToast(res.data?.message || 'Payment force-released to merchant');
      setIsForceReleaseOpen(false);
      setForceReleaseReason('');
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(selectedShipment);
      if (activeTab === 'overview') loadTabContent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to force release payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceRefund = async () => {
    if (!selectedShipment) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.forceRefundEscrow(selectedShipment.shipmentId, forceRefundReason);
      showToast(res.data?.message || 'Payment force-refunded to buyer');
      setIsForceRefundOpen(false);
      setForceRefundReason('');
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(selectedShipment);
      if (activeTab === 'overview') loadTabContent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to force refund payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelShipment = async () => {
    if (!selectedShipment) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.cancelShipment(selectedShipment.shipmentId, cancelShipmentReason);
      showToast(res.data?.message || 'Shipment cancelled by admin');
      setIsCancelShipmentOpen(false);
      setCancelShipmentReason('');
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(selectedShipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel shipment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async (shipment) => {
    if (!window.confirm(`Are you sure you want to manually mark delivery confirmed for #${shipment.shipmentId}?`)) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.confirmDeliveryManually(shipment.shipmentId, 'Admin verified delivery confirmation');
      showToast(res.data?.message || 'Delivery marked confirmed');
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(shipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to confirm delivery', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (shipment) => {
    const isCurrentlyLocked = shipment.status === 'Locked' || shipment.escrowStage === -5;
    const actionWord = isCurrentlyLocked ? 'unlock' : 'freeze/lock';
    if (!window.confirm(`Are you sure you want to ${actionWord} protection for #${shipment.shipmentId}?`)) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.toggleShipmentLock(shipment.shipmentId, { lock: !isCurrentlyLocked });
      showToast(res.data?.message || `Protection ${actionWord}ed`);
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(shipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to toggle protection lock', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditShipment = async () => {
    if (!selectedShipment) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.editShipmentDetails(selectedShipment.shipmentId, editShipmentForm);
      showToast(res.data?.message || 'Shipment details updated');
      setIsEditShipmentOpen(false);
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(selectedShipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to edit shipment details', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageQr = async (shipment, action) => {
    if (!window.confirm(`Confirm ${action} In-Box QR for #${shipment.shipmentId}?`)) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.manageInboxQr(shipment.shipmentId, action);
      showToast(res.data?.message || `In-Box QR ${action}d`);
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(shipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to manage In-Box QR', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideStatus = async () => {
    if (!selectedShipment || !newStatus) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.overrideShipmentStatus(selectedShipment.shipmentId, {
        newStatus,
        notes: statusOverrideNotes
      });
      showToast(res.data?.message || `Status updated to ${newStatus}`);
      setIsOverrideModalOpen(false);
      setStatusOverrideNotes('');
      fetchShipments(shipmentPage);
      if (isShipmentDetailOpen) handleOpenShipmentDetail(selectedShipment);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to override status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Returns Action Handlers ──────────────────────────────────────────────
  const handleApproveReturn = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.forceApproveReturn(selectedReturn.shipmentId, returnApproveForm);
      showToast(res.data?.message || 'Return approved successfully');
      setIsApproveReturnOpen(false);
      setReturnApproveForm({ returnAwbCode: '', returnCarrierSlug: 'delhivery', notes: '' });
      fetchReturns(returnsPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve return', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.forceRejectReturn(selectedReturn.shipmentId, returnRejectReason);
      showToast(res.data?.message || 'Return rejected');
      setIsRejectReturnOpen(false);
      setReturnRejectReason('');
      fetchReturns(returnsPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject return', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetReturnAwb = async () => {
    if (!selectedReturn || !returnAwbForm.returnAwbCode) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.setReturnAwb(selectedReturn.shipmentId, returnAwbForm);
      showToast(res.data?.message || 'Return AWB saved');
      setIsSetReturnAwbOpen(false);
      fetchReturns(returnsPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set return AWB', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetReplacementAwb = async () => {
    if (!selectedReturn || !replacementAwbForm.replacementAwbCode) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.setReplacementAwb(selectedReturn.shipmentId, replacementAwbForm);
      showToast(res.data?.message || 'Replacement AWB saved');
      setIsSetReplacementAwbOpen(false);
      fetchReturns(returnsPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set replacement AWB', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideReturnStatus = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.overrideReturnStatus(selectedReturn.shipmentId, {
        returnStatus: newReturnStatus,
        notes: returnStatusNotes
      });
      showToast(res.data?.message || `Return status set to ${newReturnStatus}`);
      setIsReturnStatusModalOpen(false);
      setReturnStatusNotes('');
      fetchReturns(returnsPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update return status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Dispute Resolution ───────────────────────────────────────────────────
  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const payload = {
        decision: disputeDecision,
        arbitratorNotes: disputeNotes
      };
      if (disputeDecision === 'split') {
        payload.splitSupplierAmount = Number(splitSellerAmount) || 0;
        payload.splitReceiverAmount = Number(splitBuyerAmount) || 0;
      }
      const res = await adminAPI.resolveDispute(selectedDispute._id, payload);
      showToast(res.data?.message || 'Dispute successfully resolved');
      setIsDisputeModalOpen(false);
      setDisputeNotes('');
      fetchDisputes();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to resolve dispute', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── User Management Action Handlers ──────────────────────────────────────
  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      if (selectedUser.isSuspended) {
        await adminAPI.unsuspendUser(selectedUser._id);
        showToast(`User ${selectedUser.email} has been reactivated`);
      } else {
        await adminAPI.suspendUser(selectedUser._id, suspendReason);
        showToast(`User ${selectedUser.email} has been suspended`);
      }
      setIsSuspendModalOpen(false);
      setSuspendReason('');
      fetchUsers(userPage);
      if (selectedUser) {
        setSelectedUser(prev => ({ ...prev, isSuspended: !prev.isSuspended }));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVerification = async (u, field) => {
    const nextVal = !u[field];
    try {
      await adminAPI.toggleUserVerification(u._id, { [field]: nextVal });
      showToast(`${field === 'isPhoneVerified' ? 'Phone' : 'Email'} verification updated`);
      fetchUsers(userPage);
    } catch (err) {
      showToast('Failed to update verification', 'error');
    }
  };

  const handleEditUserProfile = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateUserProfile(selectedUser._id, editUserForm);
      showToast(res.data?.message || 'User profile updated');
      setIsEditUserOpen(false);
      fetchUsers(userPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceAdjust = async () => {
    if (!selectedUser || !balanceForm.amount) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.adjustUserBalances(selectedUser._id, balanceForm);
      showToast(res.data?.message || 'Balance adjusted successfully');
      setIsBalanceModalOpen(false);
      setBalanceForm({ balanceType: 'wallet', action: 'credit', amount: '', reason: '' });
      fetchUsers(userPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to adjust balance', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDirectNotification = async () => {
    if (!selectedUser || !directNotifyForm.title || !directNotifyForm.message) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.sendDirectNotification(selectedUser._id, directNotifyForm);
      showToast(res.data?.message || 'Notification sent');
      setIsDirectNotifyOpen(false);
      setDirectNotifyForm({ title: '', message: '', type: 'info' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send notification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (deleteConfirmEmail !== selectedUser.email) {
      showToast('Email does not match confirmation', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminAPI.deleteUser(selectedUser._id);
      showToast(res.data?.message || 'User permanently deleted');
      setIsDeleteUserOpen(false);
      setDeleteConfirmEmail('');
      setSelectedUser(null);
      fetchUsers(userPage);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTransactions = async (u) => {
    setSelectedUser(u);
    setActionLoading(true);
    try {
      const res = await adminAPI.getUserTransactions(u._id);
      if (res.data?.success) {
        setUserTransactions(res.data.transactions || []);
        setIsUserTransactionsOpen(true);
      }
    } catch (err) {
      showToast('Failed to load user transactions', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Payouts / Withdrawals ────────────────────────────────────────────────
  const handleProcessPayout = async () => {
    if (!selectedWithdrawal) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.processWithdrawal(selectedWithdrawal._id, payoutForm);
      showToast(res.data?.message || 'Payout processed');
      setIsPayoutModalOpen(false);
      setPayoutForm({ action: 'approve', transactionRef: '', reason: '' });
      const withRes = await adminAPI.getWithdrawals();
      if (withRes.data?.success) setWithdrawals(withRes.data.withdrawals || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to process payout', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── System Configuration ─────────────────────────────────────────────────
  const handleSaveSystemConfig = async () => {
    if (!systemConfig) return;
    setConfigSaving(true);
    try {
      const res = await adminAPI.updateSystemConfig(systemConfig);
      showToast(res.data?.message || 'Platform settings updated');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update system config', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  // ── Broadcast ────────────────────────────────────────────────────────────
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      showToast('Title and message are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminAPI.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: broadcastTarget,
        type: broadcastType
      });
      showToast(res.data?.message || 'Broadcast message sent!');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send broadcast', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────────────
  const handleExportCSV = async (type) => {
    setActionLoading(true);
    try {
      showToast(`Generating ${type.toUpperCase()} CSV export...`);
      const res = await adminAPI.exportDataCSV(type);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `securekaro_${type}_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`${type.toUpperCase()} exported to CSV successfully`);
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to export ${type} CSV`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportJSON = async (type) => {
    try {
      showToast(`Exporting ${type} JSON...`);
      const res = await adminAPI.exportData(type);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `securekaro_${type}_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast(`${type} exported successfully!`);
    } catch (err) {
      showToast('Failed to export data', 'error');
    }
  };

  // Access denied screen if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/10">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Restricted Access</h1>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          This portal requires administrative privileges. If you are a platform operator, verify your account credentials or contact the Super Administrator.
        </p>
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const formatCurrency = (amt) => `₹${new Intl.NumberFormat('en-IN').format(amt || 0)}`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Created':
      case 'Awaiting Payment':
        return 'bg-amber-50 text-amber-600 border-amber-500/20';
      case 'Funded':
      case 'Pending Pickup':
        return 'bg-blue-50 text-blue-600 border-blue-500/20';
      case 'In Transit':
      case 'Dispatched':
      case 'Reached Destination Hub':
      case 'Out for Delivery':
        return 'bg-indigo-50 text-indigo-600 border-indigo-500/20';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-600 border-emerald-500/20';
      case 'Released':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
      case 'Locked':
        return 'bg-rose-50 text-rose-600 border-rose-500/20';
      case 'Return Requested':
      case 'Return In Transit':
        return 'bg-orange-50 text-orange-600 border-orange-500/20';
      case 'Returned & Refunded':
        return 'bg-purple-50 text-purple-600 border-purple-500/20';
      case 'Cancelled':
      case 'Undelivered':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getReturnStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Approved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Return Transit':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Returned & Refunded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-blue-600 selection:text-white pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-semibold flex items-center gap-3 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
              title="Return to user application"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900">SecureKaro Admin Terminal</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                    Master Console
                  </span>
                </div>
                <p className="text-xs text-slate-500">Order Oversight, Dispute Court, Logistics & Operational Controls</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Quick Export CSV Menu */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export CSV</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 hidden group-hover:block z-50">
                <button onClick={() => handleExportCSV('shipments')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700">Shipments CSV</button>
                <button onClick={() => handleExportCSV('returns')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700">Returns CSV</button>
                <button onClick={() => handleExportCSV('users')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700">Users & Merchants CSV</button>
                <button onClick={() => handleExportCSV('disputes')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700">Disputes CSV</button>
                <button onClick={() => handleExportCSV('finance')} className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700">Financial Ledger CSV</button>
              </div>
            </div>

            <button
              onClick={loadTabContent}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-700 font-medium">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'shipments', label: 'Shipments & Protection', icon: Package, badge: analytics?.shipments?.activeEscrows },
            { id: 'returns', label: 'Returns & Reverse', icon: RotateCcw, badge: totalReturns > 0 ? totalReturns : undefined, badgeColor: 'bg-orange-500' },
            { id: 'disputes', label: 'Disputes & Claims', icon: Scale, badge: analytics?.disputes?.openClaimsCount, badgeColor: 'bg-rose-500' },
            { id: 'users', label: 'Users & Merchants', icon: Users, badge: analytics?.users?.total },
            { id: 'finance', label: 'Finance & Payouts', icon: DollarSign, badge: withdrawals.filter(w => w.status === 'PENDING').length || undefined, badgeColor: 'bg-amber-500' },
            { id: 'system', label: 'System & Config', icon: Settings },
            { id: 'broadcast', label: 'Broadcast Hub', icon: Send },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white text-blue-700' : (tab.badgeColor || 'bg-blue-500/20 text-blue-600')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Content View */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Volume</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(analytics?.financials?.totalGmv)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span className="text-emerald-600 font-bold">{analytics?.shipments?.total || 0}</span> orders processed
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Protected Funds in Custody</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {formatCurrency(analytics?.financials?.escrowInCustody)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span className="text-amber-600 font-bold">{analytics?.shipments?.activeEscrows || 0}</span> active protected parcels
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Disputes</span>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {analytics?.disputes?.openClaimsCount || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span>Requires administrative arbitration</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Merchants & Users</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.users?.total || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span className="text-purple-600 font-bold">{analytics?.users?.suppliers || 0}</span> suppliers / merchants
                </div>
              </div>
            </div>

            {/* Quick Action Control Center */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Executive Quick Controls</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => { setActiveTab('shipments'); setShipmentStatusFilter('active_escrow'); }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-left group"
                >
                  <Lock className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Active Protection</div>
                  <div className="text-[11px] text-slate-500">Inspect held funds</div>
                </button>

                <button
                  onClick={() => setActiveTab('returns')}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-orange-400 hover:bg-orange-50/30 transition text-left group"
                >
                  <RotateCcw className="w-5 h-5 text-orange-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Reverse Logistics</div>
                  <div className="text-[11px] text-slate-500">Manage all returns</div>
                </button>

                <button
                  onClick={() => setActiveTab('disputes')}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 transition text-left group"
                >
                  <Scale className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Claims Court</div>
                  <div className="text-[11px] text-slate-500">Arbitrate disputes</div>
                </button>

                <button
                  onClick={() => { setActiveTab('finance'); setFinanceSubTab('withdrawals'); }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition text-left group"
                >
                  <CreditCard className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Payout Queue</div>
                  <div className="text-[11px] text-slate-500">Approve withdrawals</div>
                </button>

                <button
                  onClick={() => setActiveTab('system')}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-left group"
                >
                  <Settings className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Platform Rates</div>
                  <div className="text-[11px] text-slate-500">Fee & window settings</div>
                </button>

                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 transition text-left group"
                >
                  <Send className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition" />
                  <div className="text-xs font-extrabold text-slate-900">Broadcast Alert</div>
                  <div className="text-[11px] text-slate-500">Push notification</div>
                </button>
              </div>
            </div>

            {/* Recent Live Protected Orders Feed */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Recent Protected Orders</h3>
                  <p className="text-xs text-slate-500">Real-time shipments circulating in SecureKaro logistics network</p>
                </div>
                <button
                  onClick={() => setActiveTab('shipments')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>View All Shipments</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Shipment ID</th>
                      <th className="p-4">Merchant / Sender</th>
                      <th className="p-4">Buyer / Receiver</th>
                      <th className="p-4">Order Value</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {analytics?.recentShipments?.length > 0 ? (
                      analytics.recentShipments.map(s => (
                        <tr key={s._id} className="hover:bg-slate-100/30 transition">
                          <td className="p-4 font-mono font-bold text-slate-900">
                            #{s.shipmentId}
                          </td>
                          <td className="p-4 text-slate-700">
                            {s.senderId?.fullName || 'Direct Supplier'}
                          </td>
                          <td className="p-4 text-slate-700">
                            <div>{s.receiverName}</div>
                            <div className="text-[10px] text-slate-500">{s.receiverPhone}</div>
                          </td>
                          <td className="p-4 font-extrabold text-slate-900">
                            {formatCurrency(s.amount)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(s.status)}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenShipmentDetail(s)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-[11px] transition shadow-xs"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">
                          No shipments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHIPMENTS & PROTECTION */}
        {activeTab === 'shipments' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200/80 shadow-xs rounded-2xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Shipment ID (SPL-XXXX), Receiver, AWB or City..."
                  value={shipmentSearch}
                  onChange={(e) => setShipmentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchShipments(1)}
                  className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
                />
                {shipmentSearch && (
                  <button onClick={() => { setShipmentSearch(''); fetchShipments(1); }}>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={shipmentStatusFilter}
                  onChange={(e) => {
                    setShipmentStatusFilter(e.target.value);
                  }}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active_escrow">Active Pipeline (Protected)</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Released">Released (Disbursed)</option>
                  <option value="Locked">Locked (Disputed)</option>
                  <option value="Return Requested">Return Requested</option>
                  <option value="Return In Transit">Return In Transit</option>
                  <option value="Returned & Refunded">Returned & Refunded</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Undelivered">Undelivered</option>
                </select>

                <button
                  onClick={() => fetchShipments(1)}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
                >
                  Filter
                </button>

                <button
                  onClick={() => handleExportCSV('shipments')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  title="Export filtered shipments to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Shipment</th>
                      <th className="p-4">Sender / Supplier</th>
                      <th className="p-4">Receiver</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Fulfillment Stage</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {shipments.length > 0 ? (
                      shipments.map(s => {
                        const isLocked = s.status === 'Locked' || s.escrowStage === -5;
                        return (
                          <tr key={s._id} className="hover:bg-slate-100/30 transition">
                            <td className="p-4">
                              <div className="font-mono font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>#{s.shipmentId}</span>
                                {s.inboxQrToken && (
                                  <span className="p-0.5 rounded bg-blue-50 text-blue-600" title="In-Box QR enabled">
                                    <QrCode className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{s.city || 'Standard Route'}</div>
                            </td>
                            <td className="p-4 text-slate-700">
                              <div className="font-semibold text-slate-900">{s.senderId?.fullName || 'Independent Seller'}</div>
                              <div className="text-[10px] text-slate-500">{s.senderId?.phone || s.senderPhone || 'No phone'}</div>
                            </td>
                            <td className="p-4 text-slate-700">
                              <div className="font-semibold text-slate-900">{s.receiverName}</div>
                              <div className="text-[10px] text-slate-500">{s.receiverPhone}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-extrabold text-slate-900">{formatCurrency(s.amount)}</div>
                              <div className="text-[10px] uppercase text-slate-500 font-bold">{s.paymentMode || 'prepaid'}</div>
                            </td>
                            <td className="p-4">
                              <span className="font-mono text-xs font-bold text-slate-700">
                                Stage {s.escrowStage}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(s.status)}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenShipmentDetail(s)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition"
                                >
                                  Inspect
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setNewStatus(s.status);
                                    setIsOverrideModalOpen(true);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-semibold text-[11px]"
                                  title="Override shipment status"
                                >
                                  Status
                                </button>

                                <button
                                  onClick={() => handleToggleLock(s)}
                                  className={`p-1.5 rounded-xl border text-[11px] ${
                                    isLocked
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                                  }`}
                                  title={isLocked ? 'Unlock Order' : 'Freeze / Lock Order'}
                                >
                                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setForceReleaseReason('');
                                    setIsForceReleaseOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20"
                                  title="Force release payment to supplier"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setForceRefundReason('');
                                    setIsForceRefundOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-500/20"
                                  title="Force refund payment to buyer"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          No shipments matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Total {totalShipments} orders</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={shipmentPage <= 1}
                    onClick={() => fetchShipments(shipmentPage - 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-900 px-2">Page {shipmentPage}</span>
                  <button
                    disabled={shipments.length < 15}
                    onClick={() => fetchShipments(shipmentPage + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RETURNS & REVERSE LOGISTICS (NEW DEDICATED MODULE) */}
        {activeTab === 'returns' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Returns Header & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200/80 shadow-xs rounded-2xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Returns by Shipment ID, Receiver, or Reverse AWB..."
                  value={returnsSearch}
                  onChange={(e) => setReturnsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchReturns(1)}
                  className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={returnsStatusFilter}
                  onChange={(e) => {
                    setReturnsStatusFilter(e.target.value);
                  }}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Return States</option>
                  <option value="Requested">Requested (Pending Action)</option>
                  <option value="Approved">Approved (Awaiting Reverse Pickup)</option>
                  <option value="In Return Transit">In Return Transit</option>
                  <option value="Returned & Refunded">Returned & Refunded</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <button
                  onClick={() => fetchReturns(1)}
                  className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition"
                >
                  Filter
                </button>

                <button
                  onClick={() => handleExportCSV('returns')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  title="Export return orders to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Returns Table */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Shipment</th>
                      <th className="p-4">Return Path</th>
                      <th className="p-4">Reason / Notes</th>
                      <th className="p-4">Reverse Tracking</th>
                      <th className="p-4">Return Status</th>
                      <th className="p-4 text-right">Return Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {returns.length > 0 ? (
                      returns.map(r => (
                        <tr key={r._id} className="hover:bg-slate-100/30 transition">
                          <td className="p-4">
                            <div className="font-mono font-extrabold text-slate-900">#{r.shipmentId}</div>
                            <div className="text-[10px] text-slate-500">{formatCurrency(r.amount)} • {r.receiverName}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {r.returnType || 'full_refund'}
                            </span>
                            {r.defectPhotoUrl && (
                              <button
                                onClick={() => setPreviewImage(r.defectPhotoUrl)}
                                className="block mt-1 text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View Defect Photo
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-slate-700 max-w-xs truncate">
                            {r.returnReason || r.defectDescription || 'Customer initiated return request'}
                          </td>
                          <td className="p-4">
                            {r.returnAwbCode ? (
                              <div>
                                <span className="font-mono text-xs text-slate-900 font-bold">{r.returnAwbCode}</span>
                                <div className="text-[10px] text-slate-500 uppercase">{r.returnCarrierSlug || 'Courier'}</div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No reverse AWB assigned</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getReturnStatusBadge(r.returnStatus)}`}>
                              {r.returnStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.returnStatus === 'Requested' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedReturn(r);
                                      setReturnApproveForm({ returnAwbCode: '', returnCarrierSlug: 'delhivery', notes: '' });
                                      setIsApproveReturnOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedReturn(r);
                                      setReturnRejectReason('');
                                      setIsRejectReturnOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedReturn(r);
                                  setReturnAwbForm({
                                    returnAwbCode: r.returnAwbCode || '',
                                    returnCarrierSlug: r.returnCarrierSlug || 'delhivery',
                                    returnCarrierName: r.returnCarrierName || 'Delhivery Surface'
                                  });
                                  setIsSetReturnAwbOpen(true);
                                }}
                                className="px-2 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-semibold text-[11px]"
                                title="Set Return AWB"
                              >
                                Set AWB
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedReturn(r);
                                  setNewReturnStatus(r.returnStatus || 'Approved');
                                  setIsReturnStatusModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 font-semibold text-[11px] shadow-xs"
                                title="Override Return Status"
                              >
                                Override
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">
                          No return orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Total {totalReturns} returns</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={returnsPage <= 1}
                    onClick={() => fetchReturns(returnsPage - 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-900 px-2">Page {returnsPage}</span>
                  <button
                    disabled={returns.length < 15}
                    onClick={() => fetchReturns(returnsPage + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DISPUTES & CLAIMS */}
        {activeTab === 'disputes' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Filter */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Dispute Claims Court</h2>
                <p className="text-xs text-slate-500">Impartial administrative arbitration for locked order funds</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={disputeFilter}
                  onChange={(e) => setDisputeFilter(e.target.value)}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Claims</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <button
                  onClick={() => handleExportCSV('disputes')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Disputes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {disputes.length > 0 ? (
                disputes.map(claim => (
                  <div key={claim._id} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">#{claim.shipmentId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          claim.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-500/20' :
                          claim.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' :
                          'bg-rose-50 text-rose-600 border-rose-500/20'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500">Filed By:</span>{' '}
                        <span className="text-slate-200 font-semibold">{claim.filedBy?.fullName} ({claim.filedBy?.email})</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Claim Reason:</span>{' '}
                        <span className="text-rose-600 font-bold">{claim.reason}</span>
                      </div>
                      <div className="text-slate-700 pt-1 border-t border-slate-200/50">
                        "{claim.description}"
                      </div>
                    </div>

                    {claim.evidencePhotos && claim.evidencePhotos.length > 0 && (
                      <div className="flex items-center gap-2">
                        {claim.evidencePhotos.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewImage(img)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500"
                          >
                            <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleOpenShipmentDetail({ shipmentId: claim.shipmentId })}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold"
                      >
                        Inspect Order
                      </button>

                      {claim.status === 'Pending' && (
                        <button
                          onClick={() => {
                            setSelectedDispute(claim);
                            setDisputeDecision('favor_seller');
                            setDisputeNotes('');
                            setIsDisputeModalOpen(true);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30"
                        >
                          Arbitrate & Settle
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-12 text-center text-slate-500 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                  <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                  <p className="font-bold text-slate-700">Clean Slate — No Active Disputes</p>
                  <p className="text-xs text-slate-500 mt-1">All orders and transactions are progressing smoothly without arbitration flags.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: USERS & MERCHANTS */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200/80 shadow-xs rounded-2xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Users by Name, Email, Phone, Referral Code, or UPI..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                  className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="Supplier">Supplier / Merchant</option>
                  <option value="Receiver">Receiver / Buyer</option>
                  <option value="Admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>

                <button
                  onClick={() => fetchUsers(1)}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
                >
                  Filter
                </button>

                <button
                  onClick={() => handleExportCSV('users')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role & Privileges</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4">Balances</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">User Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {users.length > 0 ? (
                      users.map(u => (
                        <tr key={u._id} className="hover:bg-slate-100/30 transition">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            <div className="text-[10px] text-slate-500">{u.phone || 'No phone'}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                {u.role}
                              </span>
                            </div>
                            {u.adminRole && (
                              <div className="text-[10px] text-rose-600 font-mono mt-0.5 font-bold">
                                {u.adminRole}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleVerification(u, 'isPhoneVerified')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  u.isPhoneVerified
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-500/30'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title="Click to toggle phone verification"
                              >
                                Phone: {u.isPhoneVerified ? '✓' : '✗'}
                              </button>

                              <button
                                onClick={() => handleToggleVerification(u, 'isEmailVerified')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  u.isEmailVerified
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-500/30'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title="Click to toggle email verification"
                              >
                                Email: {u.isEmailVerified ? '✓' : '✗'}
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-900 font-bold">{formatCurrency(u.walletBalance)}</div>
                            <div className="text-[10px] text-slate-500">
                              Cashback: {formatCurrency(u.cashbackBalance)} • Ref: {u.referralCredits || 0}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              u.isSuspended
                                ? 'bg-rose-50 text-rose-600 border-rose-500/20'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-500/20'
                            }`}>
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditUserForm({
                                    fullName: u.fullName || '',
                                    phone: u.phone || '',
                                    address: u.address || '',
                                    city: u.city || '',
                                    state: u.state || '',
                                    pincode: u.pincode || '',
                                    bankDetails: u.bankDetails || {}
                                  });
                                  setIsEditUserOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs"
                                title="Edit user profile & bank info"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Adjust Balances */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setBalanceForm({ balanceType: 'wallet', action: 'credit', amount: '', reason: '' });
                                  setIsBalanceModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 shadow-xs"
                                title="Adjust balance (wallet / cashback / referral)"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                              </button>

                              {/* View Transactions */}
                              <button
                                onClick={() => handleViewTransactions(u)}
                                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 shadow-xs"
                                title="View transaction passbook"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Direct Notify */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setDirectNotifyForm({ title: '', message: '', type: 'info' });
                                  setIsDirectNotifyOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 shadow-xs"
                                title="Send direct notification"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Unsuspend */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setSuspendReason(u.suspendedReason || '');
                                  setIsSuspendModalOpen(true);
                                }}
                                className={`p-1.5 rounded-xl border text-[11px] ${
                                  u.isSuspended
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20'
                                    : 'bg-rose-50 text-rose-600 border-rose-500/20'
                                }`}
                                title={u.isSuspended ? 'Reactivate User' : 'Suspend User'}
                              >
                                {u.isSuspended ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete User */}
                              {u.email !== 'kartickdas6289@gmail.com' && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setDeleteConfirmEmail('');
                                    setIsDeleteUserOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-500/20"
                                  title="Delete user account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">
                          No users found matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Total {totalUsers} registered users</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => fetchUsers(userPage - 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-900 px-2">Page {userPage}</span>
                  <button
                    disabled={users.length < 15}
                    onClick={() => fetchUsers(userPage + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FINANCE & PAYOUTS */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sub-Tabs: Summary vs Live Custody vs Payout Queue */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <button
                  onClick={() => setFinanceSubTab('summary')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    financeSubTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Overview & Ledger
                </button>
                <button
                  onClick={() => setFinanceSubTab('live_escrow')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    financeSubTab === 'live_escrow' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Live Protection Breakdown ({liveEscrow.length})
                </button>
                <button
                  onClick={() => setFinanceSubTab('withdrawals')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    financeSubTab === 'withdrawals' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Payout Queue ({withdrawals.length})
                </button>
              </div>

              <button
                onClick={() => handleExportCSV('finance')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Finance CSV</span>
              </button>
            </div>

            {/* SubTab 1: Financial Summary */}
            {financeSubTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Merchandise Value</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {formatCurrency(financials?.totalGmv)}
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursed to Suppliers</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {formatCurrency(financials?.totalDisbursed)}
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Fees Earned</span>
                    <div className="text-2xl font-black text-blue-600 mt-1">
                      {formatCurrency(financials?.totalGatewayFees)}
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Wallet Holdings</span>
                    <div className="text-2xl font-black text-purple-600 mt-1">
                      {formatCurrency(financials?.totalUserWalletHoldings)}
                    </div>
                  </div>
                </div>

                {/* Top Suppliers Ledger */}
                <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
                  <div className="p-5 border-b border-slate-200">
                    <h3 className="text-sm font-extrabold text-slate-900">Top Revenue Generating Suppliers</h3>
                    <p className="text-xs text-slate-500">Merchants with highest volume executed through SecureKaro</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="p-4">Supplier</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Total Volume</th>
                          <th className="p-4">Disbursed</th>
                          <th className="p-4">Completed Parcels</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {financials?.topSuppliers?.map(sup => (
                          <tr key={sup._id} className="hover:bg-slate-100/30">
                            <td className="p-4 font-bold text-slate-900">{sup.fullName}</td>
                            <td className="p-4 text-slate-500">{sup.email} • {sup.phone}</td>
                            <td className="p-4 font-extrabold text-slate-900">{formatCurrency(sup.totalVolume)}</td>
                            <td className="p-4 text-emerald-600 font-bold">{formatCurrency(sup.totalDisbursed)}</td>
                            <td className="p-4 text-slate-700 font-mono">{sup.shipmentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SubTab 2: Live Protection Custody Breakdown */}
            {financeSubTab === 'live_escrow' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between text-xs font-bold">
                  <span>Total Protected Funds in Secure Custody:</span>
                  <span className="text-lg font-black text-amber-600">{formatCurrency(totalLiveEscrowHeld)}</span>
                </div>

                <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="p-4">Shipment</th>
                          <th className="p-4">Supplier</th>
                          <th className="p-4">Buyer</th>
                          <th className="p-4">Amount Held</th>
                          <th className="p-4">Status & Stage</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {liveEscrow.length > 0 ? (
                          liveEscrow.map(s => (
                            <tr key={s._id} className="hover:bg-slate-100/30">
                              <td className="p-4 font-mono font-bold text-slate-900">#{s.shipmentId}</td>
                              <td className="p-4 text-slate-700">{s.senderId?.fullName || 'Seller'}</td>
                              <td className="p-4 text-slate-700">{s.receiverName} ({s.receiverPhone})</td>
                              <td className="p-4 font-extrabold text-amber-600">{formatCurrency(s.amount)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(s.status)}`}>
                                  {s.status} (Stage {s.escrowStage})
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleOpenShipmentDetail(s)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                                >
                                  Inspect Order
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-500">
                              No active funds in custody.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SubTab 3: Payout / Withdrawal Queue */}
            {financeSubTab === 'withdrawals' && (
              <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Bank / UPI Details</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Payout Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {withdrawals.length > 0 ? (
                        withdrawals.map(w => (
                          <tr key={w._id} className="hover:bg-slate-100/30">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{w.userId?.fullName || 'User'}</div>
                              <div className="text-[10px] text-slate-500">{w.userId?.email}</div>
                            </td>
                            <td className="p-4 font-black text-emerald-600 text-sm">
                              {formatCurrency(w.amount)}
                            </td>
                            <td className="p-4 text-slate-700">
                              {w.payoutDetails?.upiId ? (
                                <div className="font-mono text-purple-600 font-bold">UPI: {w.payoutDetails.upiId}</div>
                              ) : w.payoutDetails?.accountNumber ? (
                                <div>
                                  <div className="font-mono text-slate-200">A/C: {w.payoutDetails.accountNumber}</div>
                                  <div className="text-[10px] text-slate-500">IFSC: {w.payoutDetails.ifscCode} • {w.payoutDetails.bankName}</div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">No payout details provided</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-500">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                w.status === 'WITHDRAWN' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' :
                                w.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-500/20' :
                                'bg-rose-50 text-rose-600 border-rose-500/20'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {w.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedWithdrawal(w);
                                      setPayoutForm({ action: 'approve', transactionRef: '', reason: '' });
                                      setIsPayoutModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedWithdrawal(w);
                                      setPayoutForm({ action: 'reject', transactionRef: '', reason: '' });
                                      setIsPayoutModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">
                            No withdrawal requests in queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SYSTEM & CONFIGURATION (NEW MODULE) */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* System Health Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Database Status</span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-base font-bold text-slate-900">{systemHealth?.databaseStatus || 'Connected'}</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Process Uptime</span>
                <div className="text-base font-bold text-slate-900 mt-2">
                  {Math.floor((systemHealth?.uptimeSeconds || 0) / 3600)}h {Math.floor(((systemHealth?.uptimeSeconds || 0) % 3600) / 60)}m
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Memory Footprint</span>
                <div className="text-base font-bold text-slate-900 mt-2">
                  {systemHealth?.memoryUsageMB || 0} MB Heap
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Runtime Environment</span>
                <div className="text-base font-bold text-slate-900 mt-2 font-mono">
                  Node {systemHealth?.nodeVersion || 'v20+'}
                </div>
              </div>
            </div>

            {/* Runtime System Settings Form */}
            {systemConfig && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Platform Policy & Runtime Rates</h2>
                    <p className="text-xs text-slate-500">Configure global transaction fees, dispute timer windows and operational thresholds</p>
                  </div>
                  <button
                    disabled={configSaving}
                    onClick={handleSaveSystemConfig}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{configSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Gateway Fee Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={systemConfig.gatewayFeeRate || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, gatewayFeeRate: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Default 0% (Platform protection is free for users)</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Return Window (Hours)</label>
                    <input
                      type="number"
                      value={systemConfig.returnWindowHours || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, returnWindowHours: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Time allowed for buyer to request return after delivery</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Delivery Confirmation Window (Hours)</label>
                    <input
                      type="number"
                      value={systemConfig.confirmationWindowHours || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, confirmationWindowHours: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Auto-release timer if buyer does not raise claim</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Photo Review Fee (₹)</label>
                    <input
                      type="number"
                      value={systemConfig.photoReviewFee || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, photoReviewFee: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">₹2 default add-on for parcel packing photo</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Undelivered Penalty - Receiver (₹)</label>
                    <input
                      type="number"
                      value={systemConfig.undeliveredPenaltyReceiver || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, undeliveredPenaltyReceiver: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Deducted if receiver rejects shipment on delivery</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Undelivered Relief - Supplier (₹)</label>
                    <input
                      type="number"
                      value={systemConfig.undeliveredReliefSupplier || ''}
                      onChange={(e) => setSystemConfig({ ...systemConfig, undeliveredReliefSupplier: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Credited to seller to cover return transit expenses</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(systemConfig.mockCarrierEnabled)}
                      onChange={(e) => setSystemConfig({ ...systemConfig, mockCarrierEnabled: e.target.checked })}
                      className="rounded bg-white border-slate-200 text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Carrier Mock Simulation Mode (Delhivery/BlueDart Sandbox)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(systemConfig.maintenanceMode)}
                      onChange={(e) => setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                      className="rounded bg-white border-slate-200 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-rose-600">Emergency Platform Maintenance Mode</span>
                  </label>
                </div>
              </div>
            )}

            {/* Bulk Jobs Monitor */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900">Bulk Excel Booking Queue</h3>
                <p className="text-xs text-slate-500">Monitor batch upload jobs executed by high-volume merchants</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-4">Job ID</th>
                      <th className="p-4">Merchant</th>
                      <th className="p-4">File Name</th>
                      <th className="p-4">Rows (Valid / Total)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {bulkJobs.length > 0 ? (
                      bulkJobs.map(job => (
                        <tr key={job._id} className="hover:bg-slate-100/30">
                          <td className="p-4 font-mono font-bold text-slate-900">#{job.jobId}</td>
                          <td className="p-4 text-slate-700">{job.userId?.fullName || 'Merchant'}</td>
                          <td className="p-4 text-slate-500">{job.originalFileName || 'shipments.xlsx'}</td>
                          <td className="p-4 font-bold text-slate-900">
                            <span className="text-emerald-600">{job.validRows || 0}</span> / {job.totalRows || 0}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {job.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">
                          No bulk upload jobs recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: BROADCAST HUB */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-3 text-blue-600 mb-6">
                <div className="p-3 rounded-2xl bg-blue-500/10">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Global Broadcast Hub</h2>
                  <p className="text-xs text-slate-500">Broadcast important operational or policy notices to user notifications inbox</p>
                </div>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Users & Merchants (Everyone)</option>
                    <option value="Supplier">Merchants / Suppliers Only</option>
                    <option value="Receiver">Receivers / Buyers Only</option>
                    <option value="User">Standard Users Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notification Priority / Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['info', 'alert', 'success'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBroadcastType(t)}
                        className={`py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition ${
                          broadcastType === t
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notice Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Scheduled Banking Settlement Maintenance Notice"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows="4"
                    placeholder="Provide detailed instructions or announcement message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{actionLoading ? 'Broadcasting...' : 'Dispatch Broadcast to Inboxes'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Filter */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Compliance & Security Audit Trail</h2>
                <p className="text-xs text-slate-500">Immutable ledger of all administrative interventions, overrides and releases</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-white border border-slate-200 shadow-xs rounded-2xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="OVERRIDE_STATUS">Status Overrides</option>
                  <option value="FORCE_RELEASE">Force Releases</option>
                  <option value="FORCE_REFUND">Force Refunds</option>
                  <option value="RESOLVE_DISPUTE">Dispute Rulings</option>
                  <option value="SUSPEND_USER">User Suspensions</option>
                  <option value="CANCEL_SHIPMENT">Cancellations</option>
                </select>

                <button
                  onClick={() => fetchAuditLogs(1)}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Audit Table */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Administrator</th>
                      <th className="p-4">Target Entity</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {auditLogs.length > 0 ? (
                      auditLogs.map(log => (
                        <tr key={log._id} className="hover:bg-slate-100/30">
                          <td className="p-4 text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-black border bg-blue-50 text-blue-600 border-blue-500/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-slate-900 font-semibold">{log.adminEmail}</td>
                          <td className="p-4 text-slate-700">
                            {log.targetType}: <span className="font-mono text-slate-500 font-bold">{log.targetId}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedAuditLog(log)}
                              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-semibold text-[11px]"
                            >
                              Inspect JSON
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Total {totalAuditLogs} recorded events</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={auditPage <= 1}
                    onClick={() => fetchAuditLogs(auditPage - 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-900 px-2">Page {auditPage}</span>
                  <button
                    disabled={auditLogs.length < 20}
                    onClick={() => fetchAuditLogs(auditPage + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS SECTION ─────────────────────────────────────────────────── */}

      {/* 1. SHIPMENT DEEP INSPECTION DRAWER/MODAL */}
      {isShipmentDetailOpen && detailedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Shipment Master Ledger</span>
                  <span className="font-mono text-blue-600">#{detailedShipment.shipmentId}</span>
                </h3>
                <p className="text-xs text-slate-500">Full Order, Participant & Tracking Diagnostics</p>
              </div>
              <button
                onClick={() => setIsShipmentDetailOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Pills in Header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedShipment(detailedShipment);
                  setNewStatus(detailedShipment.status);
                  setIsOverrideModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold"
              >
                Override Status
              </button>

              <button
                onClick={() => handleConfirmDelivery(detailedShipment)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold"
              >
                Mark Delivered
              </button>

              <button
                onClick={() => handleToggleLock(detailedShipment)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  detailedShipment.status === 'Locked' || detailedShipment.escrowStage === -5
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {detailedShipment.status === 'Locked' ? 'Unlock Order' : 'Lock Order'}
              </button>

              <button
                onClick={() => {
                  setSelectedShipment(detailedShipment);
                  setForceReleaseReason('');
                  setIsForceReleaseOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Force Release
              </button>

              <button
                onClick={() => {
                  setSelectedShipment(detailedShipment);
                  setForceRefundReason('');
                  setIsForceRefundOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Force Refund
              </button>

              <button
                onClick={() => {
                  setSelectedShipment(detailedShipment);
                  setCancelShipmentReason('');
                  setIsCancelShipmentOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
              >
                Cancel Order
              </button>
            </div>

            {/* Order Ledger Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Order Principal</span>
                <div className="text-base font-extrabold text-slate-900 mt-1">{formatCurrency(detailedShipment.amount)}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Verification Stage</span>
                <div className="text-base font-extrabold text-blue-600 mt-1">Stage {detailedShipment.escrowStage}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Current Status</span>
                <div className="text-xs font-extrabold text-emerald-600 mt-1 truncate">{detailedShipment.status}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Payment Mode</span>
                <div className="text-xs font-extrabold text-slate-700 mt-1 uppercase">{detailedShipment.paymentMode}</div>
              </div>
            </div>

            {/* Participants & Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Merchant / Shipper</span>
                <div className="text-sm font-extrabold text-slate-900">{detailedShipment.senderId?.fullName || 'Seller'}</div>
                <div className="text-slate-500">{detailedShipment.senderId?.email}</div>
                <div className="text-slate-500">{detailedShipment.senderId?.phone || detailedShipment.senderPhone}</div>
                {detailedShipment.senderId?.bankDetails?.accountNumber && (
                  <div className="text-[11px] text-emerald-600 font-mono pt-1 border-t border-slate-200">
                    Bank: {detailedShipment.senderId.bankDetails.bankName} (A/C: {detailedShipment.senderId.bankDetails.accountNumber})
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Buyer / Consignee</span>
                <div className="text-sm font-extrabold text-slate-900">{detailedShipment.receiverName}</div>
                <div className="text-slate-500">{detailedShipment.receiverPhone}</div>
                <div className="text-slate-500">{detailedShipment.city}</div>
              </div>
            </div>

            {/* In-Box QR Token & Photo Evidence */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-bold">In-Box QR Delivery Verification</span>
                  <div className="font-mono text-slate-900 mt-0.5">
                    {detailedShipment.inboxQrToken ? detailedShipment.inboxQrToken : 'None generated'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManageQr(detailedShipment, 'regenerate')}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 shadow-xs font-bold text-[11px]"
                  >
                    Regenerate QR
                  </button>
                  <button
                    onClick={() => handleManageQr(detailedShipment, 'invalidate')}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-rose-600 font-bold text-[11px]"
                  >
                    Invalidate
                  </button>
                </div>
              </div>

              {/* Photos */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                {detailedShipment.parcelPhotoUrl && (
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Parcel Photo</span>
                    <button onClick={() => setPreviewImage(detailedShipment.parcelPhotoUrl)}>
                      <img src={detailedShipment.parcelPhotoUrl} alt="Parcel" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    </button>
                  </div>
                )}
                {detailedShipment.defectPhotoUrl && (
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Return Defect Photo</span>
                    <button onClick={() => setPreviewImage(detailedShipment.defectPhotoUrl)}>
                      <img src={detailedShipment.defectPhotoUrl} alt="Defect" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORCE RELEASE MODAL */}
      {isForceReleaseOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-2xl bg-emerald-500/10">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Force Release Payment</h3>
                <p className="text-xs text-slate-500">Disburse principal directly to merchant</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Shipment ID:</span>
                <span className="font-mono text-slate-900 font-bold">#{selectedShipment.shipmentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Principal:</span>
                <span className="font-black text-emerald-600">{formatCurrency(selectedShipment.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Executive Notes</label>
              <textarea
                rows="3"
                placeholder="Reason for administrative force release..."
                value={forceReleaseReason}
                onChange={(e) => setForceReleaseReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsForceReleaseOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-bold text-xs"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleForceRelease}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30"
              >
                {actionLoading ? 'Disbursing...' : 'Confirm Force Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FORCE REFUND MODAL */}
      {isForceRefundOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-2xl bg-rose-500/10">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Force Refund to Buyer</h3>
                <p className="text-xs text-slate-500">Return 100% principal back to receiver wallet</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Shipment ID:</span>
                <span className="font-mono text-slate-900 font-bold">#{selectedShipment.shipmentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Amount:</span>
                <span className="font-black text-rose-600">{formatCurrency(selectedShipment.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Executive Notes</label>
              <textarea
                rows="3"
                placeholder="Reason for administrative force refund..."
                value={forceRefundReason}
                onChange={(e) => setForceRefundReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsForceRefundOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-bold text-xs"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleForceRefund}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
              >
                {actionLoading ? 'Refunding...' : 'Confirm Force Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CANCEL SHIPMENT MODAL */}
      {isCancelShipmentOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cancel Shipment (Admin)</h3>
                <p className="text-xs text-slate-500">Force cancel order and refund buyer if funded</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                rows="3"
                placeholder="Administrative cancellation rationale..."
                value={cancelShipmentReason}
                onChange={(e) => setCancelShipmentReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsCancelShipmentOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-bold text-xs"
              >
                Close
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCancelShipment}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. OVERRIDE SHIPMENT STATUS MODAL */}
      {isOverrideModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Override Shipment Status</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              >
                {[
                  'Awaiting Payment', 'Pending Pickup', 'In Transit',
                  'Reached Destination Hub', 'Out for Delivery', 'Delivered',
                  'Released', 'Locked', 'Cancelled', 'Undelivered',
                  'Return Requested', 'Return In Transit', 'Returned & Refunded'
                ].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes</label>
              <textarea
                rows="2"
                placeholder="Audit notes for this status override..."
                value={statusOverrideNotes}
                onChange={(e) => setStatusOverrideNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleOverrideStatus}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs"
              >
                {actionLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. APPROVE RETURN MODAL */}
      {isApproveReturnOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Approve Return Order</h3>
            <p className="text-xs text-slate-500">Authorizes reverse logistics for shipment #{selectedReturn.shipmentId}</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reverse Carrier AWB Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. REV-DEL-987654321"
                value={returnApproveForm.returnAwbCode}
                onChange={(e) => setReturnApproveForm({ ...returnApproveForm, returnAwbCode: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Carrier Slug</label>
              <select
                value={returnApproveForm.returnCarrierSlug}
                onChange={(e) => setReturnApproveForm({ ...returnApproveForm, returnCarrierSlug: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              >
                <option value="delhivery">Delhivery Surface</option>
                <option value="bluedart">BlueDart Express</option>
                <option value="ecom_express">Ecom Express</option>
                <option value="xpressbees">Xpressbees</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsApproveReturnOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApproveReturn}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. REJECT RETURN MODAL */}
      {isRejectReturnOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Reject Return Request</h3>
            <textarea
              rows="3"
              placeholder="Reason for rejecting return..."
              value={returnRejectReason}
              onChange={(e) => setReturnRejectReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
            ></textarea>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsRejectReturnOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRejectReturn}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SET RETURN AWB MODAL */}
      {isSetReturnAwbOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Assign Reverse Logistics AWB</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return AWB Code</label>
              <input
                type="text"
                placeholder="Enter reverse courier tracking code..."
                value={returnAwbForm.returnAwbCode}
                onChange={(e) => setReturnAwbForm({ ...returnAwbForm, returnAwbCode: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Carrier Name</label>
              <input
                type="text"
                value={returnAwbForm.returnCarrierName}
                onChange={(e) => setReturnAwbForm({ ...returnAwbForm, returnCarrierName: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsSetReturnAwbOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSetReturnAwb}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs"
              >
                Save Return AWB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. OVERRIDE RETURN STATUS MODAL */}
      {isReturnStatusModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Override Return Status</h3>
            <select
              value={newReturnStatus}
              onChange={(e) => setNewReturnStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
            >
              {['Requested', 'Approved', 'In Return Transit', 'Returned & Refunded', 'Rejected'].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsReturnStatusModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleOverrideReturnStatus}
                className="flex-1 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs"
              >
                Update Return Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. EDIT USER PROFILE & BANK DETAILS MODAL */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-900">Edit Profile & Bank / UPI Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-500 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">City</label>
                <input
                  type="text"
                  value={editUserForm.city}
                  onChange={(e) => setEditUserForm({ ...editUserForm, city: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                />
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-emerald-600 mb-2">Banking & Payout Coordinates</h4>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editUserForm.bankDetails?.bankName || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, bankDetails: { ...editUserForm.bankDetails, bankName: e.target.value } })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">A/C Number</label>
                <input
                  type="text"
                  value={editUserForm.bankDetails?.accountNumber || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, bankDetails: { ...editUserForm.bankDetails, accountNumber: e.target.value } })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={editUserForm.bankDetails?.ifscCode || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, bankDetails: { ...editUserForm.bankDetails, ifscCode: e.target.value } })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">UPI ID</label>
                <input
                  type="text"
                  value={editUserForm.bankDetails?.upiId || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, bankDetails: { ...editUserForm.bankDetails, upiId: e.target.value } })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleEditUserProfile}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. ADJUST USER BALANCES MODAL */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Adjust User Balances</h3>
            <p className="text-xs text-slate-500">Target User: {selectedUser.fullName} ({selectedUser.email})</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Balance Type</label>
                <select
                  value={balanceForm.balanceType}
                  onChange={(e) => setBalanceForm({ ...balanceForm, balanceType: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                >
                  <option value="wallet">Wallet Balance (₹)</option>
                  <option value="cashback">Cashback Balance (₹)</option>
                  <option value="referral">Referral Credits</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Action</label>
                <select
                  value={balanceForm.action}
                  onChange={(e) => setBalanceForm({ ...balanceForm, action: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                >
                  <option value="credit">Credit (+ Add)</option>
                  <option value="debit">Debit (- Subtract)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-slate-500 font-bold mb-1">Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount..."
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-500 font-bold mb-1">Reason / Ledger Reference</label>
                <textarea
                  rows="2"
                  placeholder="Reason for balance modification..."
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleBalanceAdjust}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. DIRECT NOTIFICATION MODAL */}
      {isDirectNotifyOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Send Direct Notification</h3>
            <p className="text-xs text-slate-500">Recipient: {selectedUser.fullName} ({selectedUser.email})</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Notification title..."
                value={directNotifyForm.title}
                onChange={(e) => setDirectNotifyForm({ ...directNotifyForm, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                rows="3"
                placeholder="Write message to user..."
                value={directNotifyForm.message}
                onChange={(e) => setDirectNotifyForm({ ...directNotifyForm, message: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDirectNotifyOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSendDirectNotification}
                className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. DELETE USER MODAL */}
      {isDeleteUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Permanently Delete User</h3>
                <p className="text-xs text-rose-300">Irreversible action: deletes account data</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              To confirm deletion, please type the user's exact email address:
              <span className="block font-bold text-slate-900 mt-1 font-mono">{selectedUser.email}</span>
            </p>

            <input
              type="text"
              placeholder="Confirm email address..."
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteUserOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || deleteConfirmEmail !== selectedUser.email}
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-extrabold text-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. USER TRANSACTION PASSBOOK MODAL */}
      {isUserTransactionsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Wallet & Rewards Passbook</h3>
                <p className="text-xs text-slate-500">{selectedUser.fullName} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setIsUserTransactionsOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {userTransactions.length > 0 ? (
                    userTransactions.map(t => (
                      <tr key={t._id}>
                        <td className="p-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 text-[10px]">{t.type}</td>
                        <td className="p-3 font-extrabold text-emerald-600">{formatCurrency(t.amount)}</td>
                        <td className="p-3 text-[10px] font-bold">{t.status}</td>
                        <td className="p-3 text-slate-700 max-w-xs truncate">{t.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500">
                        No transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 15. PAYOUT APPROVAL / REJECTION MODAL */}
      {isPayoutModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">
              {payoutForm.action === 'approve' ? 'Approve Withdrawal Payout' : 'Reject Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-500">
              User: {selectedWithdrawal.userId?.fullName} • Amount: {formatCurrency(selectedWithdrawal.amount)}
            </p>

            {payoutForm.action === 'approve' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank / UPI Transfer Reference</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9876543210 / Cashfree Transfer ID"
                  value={payoutForm.transactionRef}
                  onChange={(e) => setPayoutForm({ ...payoutForm, transactionRef: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  rows="3"
                  placeholder="Why is this payout being rejected? (Funds will be refunded to user wallet)"
                  value={payoutForm.reason}
                  onChange={(e) => setPayoutForm({ ...payoutForm, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
                ></textarea>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleProcessPayout}
                className={`flex-1 py-2.5 rounded-2xl font-extrabold text-xs text-slate-900 ${
                  payoutForm.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? 'Processing...' : payoutForm.action === 'approve' ? 'Confirm Payout' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 16. DISPUTE ARBITRATION MODAL */}
      {isDisputeModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">Arbitrate & Settle Claim</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arbitration Ruling</label>
              <select
                value={disputeDecision}
                onChange={(e) => setDisputeDecision(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              >
                <option value="favor_seller">Favor Merchant (Release Funds to Seller)</option>
                <option value="favor_buyer">Favor Buyer (Full Refund to Buyer)</option>
                <option value="split">Split Settlement (Partial to both parties)</option>
              </select>
            </div>

            {disputeDecision === 'split' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Seller Share (₹)</label>
                  <input
                    type="number"
                    value={splitSellerAmount}
                    onChange={(e) => setSplitSellerAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Buyer Share (₹)</label>
                  <input
                    type="number"
                    value={splitBuyerAmount}
                    onChange={(e) => setSplitBuyerAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Executive Rationale</label>
              <textarea
                rows="3"
                placeholder="Ruling rationale and evidence review notes..."
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleResolveDispute}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs"
              >
                Execute Ruling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 17. SUSPEND USER MODAL */}
      {isSuspendModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">
              {selectedUser.isSuspended ? 'Reactivate Account' : 'Suspend User Account'}
            </h3>
            <p className="text-xs text-slate-500">{selectedUser.fullName} ({selectedUser.email})</p>

            {!selectedUser.isSuspended && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Suspension Reason</label>
                <textarea
                  rows="3"
                  placeholder="Reason for suspending this account..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
                ></textarea>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSuspendUser}
                className={`flex-1 py-2.5 rounded-2xl font-extrabold text-xs text-slate-900 ${
                  selectedUser.isSuspended ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {selectedUser.isSuspended ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 18. IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-2xl border border-slate-200" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 19. AUDIT LOG DETAIL MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Audit Event Details</h3>
                <span className="font-mono text-xs text-blue-600">{selectedAuditLog.action}</span>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-72">
              {JSON.stringify(selectedAuditLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
