import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Box, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Truck, Link2, Copy, Share2, CreditCard, XCircle, RotateCcw, Clock, Sparkles, Lock, MessageSquare, Send, Camera, Tag, MapPin, Check, QrCode, Printer, Smartphone, Wifi, Globe, Laptop, Zap, Building, Image as ImageIcon, Eye, ZoomIn, PackageCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { shipmentAPI, profileAPI } from '../services/api';
import { uploadImageToHost } from '../services/imageUpload';
import PaymentCheckoutModal from './PaymentCheckoutModal';
import QrScannerModal from './QrScannerModal';
import CameraCaptureModal from './CameraCaptureModal';

export default function ShipmentDetailsModal({ shipment, isOpen, onClose, onRefresh, user, onRepeatShipment }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showUndeliveredForm, setShowUndeliveredForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showAssignCourierModal, setShowAssignCourierModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPickupToken, setCopiedPickupToken] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // ── Mandatory Refund Bank Details State ──────────────────────
  const [refundBankDetails, setRefundBankDetails] = useState({
    payoutMethod: 'bank',
    accountHolderName: user?.bankDetails?.accountHolderName || user?.fullName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    confirmAccountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || 'HDFC Bank',
    upiId: user?.bankDetails?.upiId || ''
  });
  const [isEditingRefundBank, setIsEditingRefundBank] = useState(false);

  useEffect(() => {
    if (user?.bankDetails) {
      setRefundBankDetails(prev => ({
        ...prev,
        accountHolderName: user.bankDetails?.accountHolderName || user.fullName || prev.accountHolderName,
        accountNumber: user.bankDetails?.accountNumber || prev.accountNumber,
        confirmAccountNumber: user.bankDetails?.accountNumber || prev.confirmAccountNumber,
        ifscCode: user.bankDetails?.ifscCode || prev.ifscCode,
        bankName: user.bankDetails?.bankName || prev.bankName,
        upiId: user.bankDetails?.upiId || prev.upiId,
        payoutMethod: user.bankDetails?.upiId && !user.bankDetails?.accountNumber ? 'upi' : 'bank'
      }));
    }
  }, [user]);

  // ── Dispatch / Submit Tracking Form State (Supplier) ────────────────────────
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dispatchCarrierSlug, setDispatchCarrierSlug] = useState('');
  const [dispatchAwb, setDispatchAwb] = useState('');
  const [dispatchPhotoUrl, setDispatchPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState('');
  const [dispatchErr, setDispatchErr] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);

  // ── In-Box QR Label State ─────────────────────────────────────
  const [qrLabelData, setQrLabelData] = useState(null);
  const [showQrPanel, setShowQrPanel] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ 
    localIp: typeof window !== 'undefined' ? window.location.hostname : 'localhost', 
    frontendNetworkUrl: typeof window !== 'undefined' ? (window.location.origin || 'http://localhost:3001') : 'http://localhost:3001' 
  });
  const [qrScanMode, setQrScanMode] = useState('phone'); // 'phone' | 'localhost' | 'custom'
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Fetch local machine IP dynamically so mobile phone scanning works over Wi-Fi
  useEffect(() => {
    if (showQrPanel) {
      shipmentAPI.getNetworkInfo().then(res => {
        if (res.data?.localIp) {
          setNetworkInfo(res.data);
        }
      }).catch(err => {
        console.warn('Network info fetch note:', err);
      });
    }
  }, [showQrPanel]);

  // Reverse Courier Assignment State (Supplier)
  const [returnCarrierSlug, setReturnCarrierSlug] = useState('delhivery');
  const [returnCarrierName, setReturnCarrierName] = useState('Delhivery Express');
  const [returnTrackingId, setReturnTrackingId] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Cancel, Undelivered & Return states
  const [cancelReason, setCancelReason] = useState('Order cancelled by mutual agreement');
  const [undeliveredReason, setUndeliveredReason] = useState('Courier delivery attempt failed / returned to origin');
  const [returnReason, setReturnReason] = useState('Defective / Damaged product received');
  const [returnTypeChoice, setReturnTypeChoice] = useState('full_refund');
  const [defectPhotoUrl, setDefectPhotoUrl] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [showConfirmChoiceModal, setShowConfirmChoiceModal] = useState(false);
  const [returnWindowMessage, setReturnWindowMessage] = useState('');
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [qrScanVerifiedNotice, setQrScanVerifiedNotice] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState({ isOpen: false, url: '', title: '' });
  const [supplierDiscountInput, setSupplierDiscountInput] = useState('');
  const [isEditingDiscountOffer, setIsEditingDiscountOffer] = useState(false);
  const [showSupplierPartialRefundModal, setShowSupplierPartialRefundModal] = useState(false);

  const handleQrScanSuccessInModal = async ({ token, shipmentId: scannedId, rawText }) => {
    try {
      let isMatch = false;
      const currentId = (details?.shipment?.shipmentId || shipment?.shipmentId || '').toUpperCase();

      if (token) {
        const res = await shipmentAPI.publicQrGetInfo(token);
        if (res.data?.shipmentId && res.data.shipmentId.toUpperCase() === currentId) {
          isMatch = true;
        }
      }
      if (!isMatch && scannedId && scannedId.toUpperCase() === currentId) {
        isMatch = true;
      }
      if (!isMatch && rawText && (rawText.toUpperCase() === currentId || rawText.includes(currentId))) {
        isMatch = true;
      }

      if (isMatch) {
        if (currentShipment?.deliveryConfirmed || currentShipment?.status === 'Released') {
          const isClosed = currentShipment.returnWindowClosed || currentShipment.status === 'Released';
          alert(`Parcel already confirmed! ${isClosed ? 'Return window is closed and payment has been settled.' : '24-hour return window is currently active.'}`);
          return;
        }
        setQrScanVerifiedNotice(true);
        setShowConfirmChoiceModal(true);
      } else {
        alert(`Scanned QR code does not match this shipment (${currentId}). Please scan the QR label inside this parcel's box.`);
      }
    } catch (e) {
      console.warn('QR scan in modal error:', e);
      if (currentShipment?.deliveryConfirmed || currentShipment?.status === 'Released') {
        alert('Parcel already confirmed! Delivery for this parcel was already confirmed.');
        return;
      }
      setQrScanVerifiedNotice(true);
      setShowConfirmChoiceModal(true);
    }
  };

  // Carrier name display map
  const CARRIER_NAMES = {
    delhivery:    'Delhivery Express',
    shadowfax:    'Shadowfax Technologies',
    ekart:        'Ekart Logistics',
    xpressbees:   'Xpressbees Logistics',
    ecom_express: 'Ecom Express',
    dtdc:         'DTDC Express',
    bluedart:     'BlueDart Express',
    indiapost:    'India Post Speed Post',
    shiprocket:   'Shiprocket Partner',
    add_later:    'Add Later',
    other:        'Custom Express'
  };

  const currentShipment = details?.shipment || shipment;

  useEffect(() => {
    if (shipment?.shipmentId && isOpen) {
      fetchFullDetails();
    } else if (!isOpen || !shipment) {
      setDetails(null);
    }
  }, [shipment, isOpen]);

  // Auto-fill courier details whenever shipment prop or fetched details change
  // Runs on both: initial prop load AND after fetchFullDetails() completes
  useEffect(() => {
    const src = details?.shipment || shipment;
    if (src) {
      if (src.carrierSlug && src.carrierSlug !== 'add_later') {
        setDispatchCarrierSlug(src.carrierSlug);
      }
      if (src.awbCode) {
        setDispatchAwb(src.awbCode);
      }
      // Pre-fill photo URL only if supplier already uploaded one previously
      if (src.parcelPhotoUrl) {
        setDispatchPhotoUrl(src.parcelPhotoUrl);
      }
      setDispatchErr('');
      setDispatchMsg('');
    }
  }, [details, shipment, showDispatchForm]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getShipmentById(shipment.shipmentId);
      setDetails(res.data);
    } catch (err) {
      console.warn('API error fetching shipment details, showing current item state:', err);
      setDetails({ shipment: shipment, journey: null });
    } finally {
      setLoading(false);
    }
  };

  // ── Standalone Parcel Photo Upload Handler ──────────────────────
  const [uploadingParcelPhoto, setUploadingParcelPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState('');
  const [photoUploadErr, setPhotoUploadErr] = useState('');

  const handleUploadParcelPhoto = async (photoUrl) => {
    if (!photoUrl || !photoUrl.trim()) return;
    setUploadingParcelPhoto(true);
    setPhotoUploadErr('');
    setPhotoUploadMsg('');
    try {
      const res = await shipmentAPI.uploadParcelPhoto(currentShipment.shipmentId, photoUrl.trim());
      setPhotoUploadMsg('Parcel photo uploaded and verified! In-Box QR code generated & unlocked.');
      setDispatchPhotoUrl(photoUrl.trim());
      const updatedShipment = res.data?.shipment || {};
      setDetails(prev => ({
        ...prev,
        shipment: {
          ...(prev?.shipment || {}),
          ...updatedShipment,
          parcelPhotoUrl: photoUrl.trim(),
          parcelPhotoUploadedAt: new Date().toISOString(),
          inboxQrToken: updatedShipment.inboxQrToken || prev?.shipment?.inboxQrToken,
          deliveryOtp: updatedShipment.deliveryOtp || prev?.shipment?.deliveryOtp
        }
      }));
      onRefresh?.();
      fetchFullDetails();
    } catch (err) {
      console.error('Failed to upload parcel photo:', err);
      setPhotoUploadErr(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingParcelPhoto(false);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchErr('');
    setDispatchMsg('');

    if (!dispatchAwb.trim()) {
      setDispatchErr('Please enter the courier Tracking ID / AWB code.');
      return;
    }

    // Photo is mandatory for all shipments before dispatch
    const photoRequired = true;
    if (photoRequired && !dispatchPhotoUrl.trim()) {
      setDispatchErr('⚠️ A clear parcel/product photo is mandatory for all shipments before dispatch. Upload a photo using the camera or paste an image URL above.');
      return;
    }

    setActionLoading(true);
    const submittedPhotoUrl = dispatchPhotoUrl.trim();
    try {
      await shipmentAPI.dispatchShipment(currentShipment.shipmentId, {
        carrierSlug: dispatchCarrierSlug || currentShipment.carrierSlug || 'delhivery',
        awbCode: dispatchAwb.trim(),
        parcelPhotoUrl: submittedPhotoUrl || undefined
      });
      setDispatchMsg('Courier details submitted! Parcel is now In Transit. Tracking confirmed and buyer notified.');
      setShowDispatchForm(false);
      // Immediately update local state so UI reflects photo upload without waiting for next poll
      if (submittedPhotoUrl) {
        setDetails(prev => ({
          ...prev,
          shipment: {
            ...(prev?.shipment || {}),
            parcelPhotoUrl: submittedPhotoUrl,
            trackingSubmitted: true,
            awbCode: dispatchAwb.trim(),
            carrierSlug: dispatchCarrierSlug || currentShipment.carrierSlug || 'delhivery',
            status: 'In Transit'
          }
        }));
      }
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      setDispatchErr(err.response?.data?.error || 'Failed to submit courier details. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !shipment) return null;

  const journey = details?.journey;

  const handleConfirmChoice = async (choice) => {
    if (currentShipment?.deliveryConfirmed || currentShipment?.status === 'Released') {
      setShowConfirmChoiceModal(false);
      const isClosed = currentShipment.returnWindowClosed || currentShipment.status === 'Released' || currentShipment.returnWindowChoice === 'ImmediateClose';
      const windowMsg = isClosed
        ? 'Return window is closed and payment has been settled.'
        : '24-hour return window is currently active.';
      alert(`Parcel already confirmed! ${windowMsg}`);
      return;
    }
    setActionLoading(true);
    try {
      const res = await shipmentAPI.confirmDelivery(currentShipment.shipmentId, choice);
      setShowConfirmChoiceModal(false);
      if (choice === 'confirm_and_close' || choice === 'immediate') {
        alert('Parcel confirmed and return window closed! Escrow funds released to supplier.');
      } else {
        setReturnWindowMessage('The return window will close after 24 hours');
        alert('Parcel confirmed successfully! The return window will close after 24 hours.');
      }
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm parcel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseReturnRequest = async () => {
    if (!window.confirm('Are you sure you want to close/withdraw your return request? Escrow protection will remain active.')) return;
    setActionLoading(true);
    try {
      await shipmentAPI.closeReturnRequest(currentShipment.shipmentId);
      alert('Return request closed successfully!');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseReturnWindow = async () => {
    if (!window.confirm('Close your 24-hour return window now and release escrow funds to the supplier?')) return;
    setActionLoading(true);
    try {
      await shipmentAPI.closeReturnWindow(currentShipment.shipmentId);
      alert('Return window closed early! Escrow funds released to supplier.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close return window.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateDelivered = async () => {
    setActionLoading(true);
    try {
      await shipmentAPI.simulateDelivered(currentShipment.shipmentId);
      alert('Shipment marked as Delivered! Confirmation notification dispatched to receiver.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to simulate delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (currentShipment?.deliveryConfirmed || currentShipment?.status === 'Released') {
      const isClosed = currentShipment.returnWindowClosed || currentShipment.status === 'Released' || currentShipment.returnWindowChoice === 'ImmediateClose';
      const windowMsg = isClosed
        ? 'Return window is closed and escrow funds have been released.'
        : '24-hour return window is currently active.';
      alert(`Parcel already confirmed! ${windowMsg}`);
      return;
    }
    setShowConfirmChoiceModal(true);
  };

  const handleCancelShipment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await shipmentAPI.cancelShipment(currentShipment.shipmentId, cancelReason);
      alert('Shipment cancelled successfully. Escrow funds refunded if applicable.');
      setShowCancelForm(false);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel shipment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportUndelivered = async (e) => {
    e.preventDefault();
    if (currentShipment.rtoProtectionEnabled) {
      const proceed = window.confirm(
        '⚠️ Fair-Play Policy Warning:\n\n' +
        'Under RTO & Undelivered Protection, you receive 100% full refunds on up to 2 rejected parcels per week (SecureKaro compensates seller ₹40).\n\n' +
        'Starting from your 3rd rejection this week, a ₹40 fair-play fee is charged (₹30 transferred directly to the supplier wallet, ₹10 platform fee).\n\n' +
        'Do you wish to confirm marking this shipment as undelivered / rejected?'
      );
      if (!proceed) return;
    }
    setActionLoading(true);
    try {
      const res = await shipmentAPI.refundUndelivered(currentShipment.shipmentId, undeliveredReason);
      const summary = res.data?.refundSummary;
      if (summary?.receiverPenalty > 0) {
        alert(
          `Shipment marked undelivered/rejected!\n\n` +
          `• 3rd+ rejection this week: ₹${summary.receiverPenalty} fair-play fee charged.\n` +
          `• ₹${summary.supplierBuyerPenaltyShare || 30} credited to seller's wallet.\n` +
          `• Net refund of ₹${summary.receiverRefund} credited to your wallet.`
        );
      } else if (summary?.rtoProtectionEnabled) {
        alert(
          `Shipment marked undelivered/rejected!\n\n` +
          `• 100% Full refund of ₹${summary.receiverRefund} credited to receiver wallet.\n` +
          `• SecureKaro credited seller +₹${summary.supplierRelief} compensation under RTO Protection.\n` +
          `• Notice: You have used ${summary.receiverWeeklyRejectionCount || 1} of 2 free rejections this week.`
        );
      } else {
        const amtStr = summary ? `₹${summary.principal?.toLocaleString() || summary.totalRefundAmount?.toLocaleString()} principal` : 'Principal Refund';
        alert(`Courier marked as undelivered! ${amtStr} successfully refunded to receiver.`);
      }
      setShowUndeliveredForm(false);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process undelivered refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    if (isReturnAlreadyApplied) {
      alert('A return request has already been applied for this shipment. Redirecting to return tracking...');
      window.location.href = `/tracking?id=${encodeURIComponent(currentShipment.shipmentId || '')}&tab=return`;
      return;
    }
    if (!defectPhotoUrl.trim()) {
      alert('Uploading photo proof of the package/item is mandatory for refund, partial return, and replacement requests.');
      return;
    }
    if (currentShipment.rtoProtectionEnabled && returnTypeChoice === 'full_refund') {
      const proceed = window.confirm(
        '⚠️ Fair-Play Policy Warning:\n\n' +
        'Under RTO Protection, you get 2 free parcel rejections/returns per week with 100% full refund.\n\n' +
        'From your 3rd rejection this week onwards, a ₹40 fair-play fee is charged (₹30 transferred to supplier wallet).\n\n' +
        'Do you want to proceed with this return request?'
      );
      if (!proceed) return;
    }

    const hasExistingBank = Boolean(
      (user?.bankDetails?.accountNumber && user.bankDetails.accountNumber.trim().length >= 6) ||
      (user?.bankDetails?.upiId && user.bankDetails.upiId.trim().includes('@'))
    );

    let bankPayload = null;
    if (returnTypeChoice === 'full_refund') {
      if (!hasExistingBank || isEditingRefundBank) {
        if (refundBankDetails.payoutMethod === 'bank') {
          const acc = (refundBankDetails.accountNumber || '').trim();
          const confirmAcc = (refundBankDetails.confirmAccountNumber || '').trim();
          const ifsc = (refundBankDetails.ifscCode || '').trim().toUpperCase();
          const holder = (refundBankDetails.accountHolderName || user?.fullName || '').trim();
          if (!holder) {
            alert('Please enter your Account Holder Name.');
            return;
          }
          if (!acc || acc.length < 6) {
            alert('Please enter a valid bank account number (minimum 6 digits).');
            return;
          }
          if (acc !== confirmAcc) {
            alert('Bank account numbers do not match. Please re-enter.');
            return;
          }
          if (!ifsc || ifsc.length < 5) {
            alert('Please enter a valid IFSC code (e.g. HDFC0001234).');
            return;
          }
          bankPayload = {
            accountHolderName: holder,
            accountNumber: acc,
            ifscCode: ifsc,
            bankName: (refundBankDetails.bankName || 'Bank').trim(),
            upiId: (refundBankDetails.upiId || '').trim()
          };
        } else {
          const upi = (refundBankDetails.upiId || '').trim();
          const holder = (refundBankDetails.accountHolderName || user?.fullName || '').trim();
          if (!upi || !upi.includes('@')) {
            alert('Please enter a valid UPI ID (e.g., yourname@okhdfcbank).');
            return;
          }
          bankPayload = {
            upiId: upi,
            accountHolderName: holder,
            accountNumber: user?.bankDetails?.accountNumber || '',
            ifscCode: user?.bankDetails?.ifscCode || '',
            bankName: user?.bankDetails?.bankName || ''
          };
        }

        // Save to user profile directly
        try {
          await profileAPI.updateProfile({ bankDetails: bankPayload });
          if (user) {
            user.bankDetails = { ...(user.bankDetails || {}), ...bankPayload };
          }
        } catch (profErr) {
          console.warn('Bank save notice:', profErr);
        }
      } else {
        bankPayload = user?.bankDetails;
      }
    }

    setActionLoading(true);
    try {
      await shipmentAPI.requestReturn(currentShipment.shipmentId, {
        reason: returnReason,
        returnType: returnTypeChoice,
        defectPhotoUrl: defectPhotoUrl.trim(),
        defectDescription: defectDescription.trim(),
        bankDetails: bankPayload
      });
      alert('Return & refund application submitted successfully! Payout bank details have been saved to your account.');
      setShowReturnForm(false);
      setIsEditingRefundBank(false);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfferDiscount = async (e) => {
    e?.preventDefault?.();
    const discountAmount = Number(supplierDiscountInput);
    const totalAmount = Number(currentShipment.amount) || 0;
    if (!discountAmount || discountAmount <= 0) {
      alert('Please enter a valid discount amount greater than ₹0');
      return;
    }
    if (discountAmount >= totalAmount) {
      alert(`Discount amount (₹${discountAmount}) must be less than the total parcel value of ₹${totalAmount}`);
      return;
    }

    setActionLoading(true);
    try {
      await shipmentAPI.offerDiscount(currentShipment.shipmentId, discountAmount);
      alert(`Discount offer of ₹${discountAmount} successfully sent to the buyer!\n\nThe buyer has a 15-hour review window to accept or reject. If the buyer does not respond after 15 hours, you will unlock the right to auto-complete the refund with this offer.`);
      setSupplierDiscountInput('');
      setIsEditingDiscountOffer(false);
      setShowSupplierPartialRefundModal(false);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send discount offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupplierAutoCompleteDiscount = async () => {
    const discountAmount = Number(currentShipment.discountOfferedAmount) || 0;
    const totalAmount = Number(currentShipment.amount) || 0;
    const supplierBalance = Math.max(0, totalAmount - discountAmount);

    const confirmMsg = `The 15-hour buyer response window has expired without a buyer response.\n\n` +
      `Do you want to auto-complete the partial refund now?\n` +
      `• ₹${discountAmount} will be refunded to the buyer's wallet (buyer keeps the item)\n` +
      `• ₹${supplierBalance} will be released to your wallet`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await shipmentAPI.respondDiscount(currentShipment.shipmentId, true);
      alert(`Partial refund of ₹${discountAmount} auto-completed successfully! The remaining balance of ₹${supplierBalance} has been credited to your wallet.`);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to auto-complete discount refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondDiscount = async (accepted) => {
    const actionName = accepted ? 'accept this discount offer' : 'reject this offer and trigger an automatic 100% full refund';
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) return;
    setActionLoading(true);
    try {
      await shipmentAPI.respondDiscount(currentShipment.shipmentId, accepted);
      alert(accepted ? 'Discount accepted! The agreed discount amount has been credited to your wallet.' : 'Discount rejected. A full 100% refund has been credited to your wallet.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond to discount offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const carrierNameMap = {
    delhivery: 'Delhivery Express',
    bluedart: 'BlueDart Logistics',
    dtdc: 'DTDC Express',
    ekart: 'Ekart Logistics',
    shadowfax: 'Shadowfax',
    indiapost: 'India Post Speed Post',
    other: 'Custom Express'
  };

  const handleCarrierChange = (slug) => {
    setReturnCarrierSlug(slug);
    setReturnCarrierName(carrierNameMap[slug] || 'Delhivery Express');
    const prefix = slug.toUpperCase().substring(0, 3);
    setReturnTrackingId(`REV-${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleOpenAssignModal = () => {
    setReturnCarrierSlug('delhivery');
    setReturnCarrierName('Delhivery Express');
    setReturnTrackingId(`REV-DEL-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setReturnNotes('');
    setShowAssignCourierModal(true);
  };

  const handleConfirmAssignCourier = async (e) => {
    e.preventDefault();
    if (!returnTrackingId) {
      alert('Please enter a reverse tracking ID');
      return;
    }
    setActionLoading(true);
    try {
      if (currentShipment.returnType === 'replacement') {
        const res = await shipmentAPI.approveReplacement(currentShipment.shipmentId, {
          carrierSlug: returnCarrierSlug,
          carrierName: returnCarrierName,
          trackingId: returnTrackingId.trim()
        });
        const d = res.data || {};
        const pickupAwb = d.pickupAwbCode || d.shipment?.replacementPickupAwbCode || '';
        const pickupName = d.pickupCarrierName || d.shipment?.replacementPickupCarrierName || returnCarrierName;
        alert(`✅ Replacement booked!\n• Delivery → Buyer: ${returnCarrierName} (AWB: ${returnTrackingId})\n• Pickup ← Buyer (old item): ${pickupName} (AWB: ${pickupAwb || 'auto-generated'})\n\nBuyer notified via SMS & In-App.`);
      } else {
        await shipmentAPI.approveReturn(currentShipment.shipmentId, {
          carrierSlug: returnCarrierSlug,
          carrierName: returnCarrierName,
          trackingId: returnTrackingId.trim(),
          notes: returnNotes
        });
        alert(`Reverse courier partner ${returnCarrierName} (Tracking ID: ${returnTrackingId}) assigned! Receiver has been notified via In-App Notification and SMS.`);
      }
      setShowAssignCourierModal(false);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign reverse courier partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoApproveReturn = async () => {
    setActionLoading(true);
    try {
      if (currentShipment.returnType === 'replacement') {
        const res = await shipmentAPI.approveReplacement(currentShipment.shipmentId, {
          carrierSlug: 'auto'
        });
        const data = res.data || {};
        const fwdCarrier = data.replacementCarrierName || data.shipment?.replacementCarrierName || 'Cheapest Courier Partner';
        const fwdAwb = data.replacementAwbCode || data.shipment?.replacementAwbCode || '';
        const revCarrier = data.pickupCarrierName || data.shipment?.replacementPickupCarrierName || fwdCarrier;
        const revAwb = data.pickupAwbCode || data.shipment?.replacementPickupAwbCode || '';
        const pickupWin = data.pickupWindow || data.shipment?.replacementPickupWindow || 'Tomorrow, 10:00 AM – 2:00 PM';

        alert(`⚡ Replacement & Reverse Courier Auto-Booked!\n\n• Replacement → Buyer: ${fwdCarrier} (AWB: ${fwdAwb})\n• Old Item Pickup ← Buyer: ${revCarrier} (AWB: ${revAwb})\n• Scheduled Pickup Window: ${pickupWin}\n\nBuyer has been notified via In-App Notification and SMS.`);
      } else {
        const res = await shipmentAPI.approveReturn(currentShipment.shipmentId, {
          carrierSlug: 'auto'
        });
        const data = res.data || {};
        const carrier = data.cheapestCarrier || data.shipment?.returnCarrierName || 'Cheapest Courier Partner';
        const awb = data.trackingId || data.shipment?.returnAwbCode || '';
        const rate = data.shippingRate || data.shipment?.returnShippingRate || 38;
        const windowStr = data.pickupWindow || data.shipment?.returnPickupWindow || 'Tomorrow, 10:00 AM – 2:00 PM';
        const savings = data.estimatedSavings || data.shipment?.returnEstimatedSavings || 0;

        alert(`⚡ Reverse Courier Auto-Booked Successfully!\n\n• Carrier: ${carrier}\n• Lowest Rate: ₹${rate}${savings > 0 ? ` (Saved ₹${savings})` : ''}\n• Reverse AWB: ${awb}\n• Scheduled Pickup: ${windowStr}\n\nBuyer has been notified via In-App Notification and SMS.`);
      }
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to auto-book courier.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReturnReceived = async () => {
    const isReplacement = currentShipment.returnType === 'replacement';
    const confirmMsg = isReplacement
      ? 'Confirm that the returned defective package has arrived at your warehouse? The replacement is complete and your escrow payment will be released to you.'
      : 'Confirm that the returned package has arrived at your warehouse? Receiver will be refunded their escrow principal.';
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      await shipmentAPI.confirmReturnReceived(currentShipment.shipmentId);
      alert(isReplacement
        ? 'Return delivery confirmed! Replacement cycle is complete and escrow payment has been released to your account.'
        : 'Return confirmed! Receiver has been refunded their escrow principal.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm return receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchReplacement = async () => {
    if (!window.confirm(`⚡ Fast-Track Dispatch on Pickup Scan for ${currentShipment.shipmentId}?\n\nReverse courier has initiated or scanned pickup of the defective item from buyer's doorstep.\n\nDispatching replacement now cuts turnaround time from 10 days to 3 days! This will automatically generate a fresh "Replacement In-Box QR Code" and SMS OTP for delivery verification.`)) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.dispatchReplacement(currentShipment.shipmentId, { carrierSlug: 'auto' });
      alert(res.data?.message || '⚡ Replacement dispatched! Fresh In-Box QR Code label generated for the replacement package.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch replacement item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReplacementDelivery = async () => {
    if (!window.confirm('Confirm that you have received the replacement product in good condition? This will conclude the replacement and release escrow funds to the seller.')) return;
    setActionLoading(true);
    try {
      const res = await shipmentAPI.confirmReplacementDelivery(currentShipment.shipmentId);
      alert(res.data?.message || 'Replacement confirmed! Order is complete.');
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm replacement delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleReturnOption = async (newValue) => {
    setActionLoading(true);
    try {
      await shipmentAPI.toggleReturnAllowed(currentShipment.shipmentId, newValue);
      alert(`Return policy updated: Product returns are now ${newValue ? 'ENABLED' : 'DISABLED'} for this parcel.`);
      onRefresh();
      fetchFullDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update return option.');
    } finally {
      setActionLoading(false);
    }
  };

  // Role: prefer explicit activeRole, then stored role
  const activeRole = user?.activeRole || user?.role || localStorage.getItem('securekaro_active_role') || null;
  const currentUserId = user?._id || user?.id;
  const currentUserPhone = user?.phone;

  const cleanUserPhone = (currentUserPhone || '').replace(/\D/g, '').slice(-10);
  const cleanSenderPhone = (currentShipment?.senderPhone || '').replace(/\D/g, '').slice(-10);
  const cleanReceiverPhone = (currentShipment?.receiverPhone || '').replace(/\D/g, '').slice(-10);

  const isExplicitReceiver = activeRole === 'Receiver' || activeRole?.toLowerCase() === 'receiver' || user?.activeRole === 'Receiver';

  // Determine if viewer is sender/supplier based on shipment data or phone
  const isSender = Boolean(
    (currentShipment?.senderId && currentUserId && (
      (typeof currentShipment.senderId === 'string' && String(currentShipment.senderId) === String(currentUserId)) ||
      (currentShipment.senderId?._id && String(currentShipment.senderId._id) === String(currentUserId))
    )) ||
    (cleanUserPhone && cleanSenderPhone && cleanUserPhone === cleanSenderPhone)
  );

  const isActualReceiver = Boolean(
    (cleanUserPhone && cleanReceiverPhone && cleanUserPhone === cleanReceiverPhone) ||
    (currentShipment?.receiverId && currentUserId && (
      String(currentShipment.receiverId) === String(currentUserId) ||
      String(currentShipment.receiverId?._id) === String(currentUserId)
    )) ||
    user?.role === 'Admin'
  );

  const isReceiverUser = isExplicitReceiver || (!isSender && isActualReceiver);

  // If user explicitly switched to Receiver, show Receiver view; otherwise sender is supplier
  const isSupplier = !isExplicitReceiver && (isSender || (activeRole === 'Supplier' && !isReceiverUser) || (!isReceiverUser && (user?.role === 'Supplier' || user?.activeRole === 'Supplier')));

  if (!isOpen || !currentShipment) {
    return null;
  }

  const isCancellable = ['Awaiting Payment', 'Pending Pickup'].includes(currentShipment?.status);
  const isUndeliverable = ['In Transit', 'Out for Delivery', 'Reached Destination Hub'].includes(currentShipment?.status);
  // Returnable: only after delivery is confirmed or status is Delivered and return window is open
  const isReturnAlreadyApplied = Boolean(
    currentShipment?.status === 'Return Requested' ||
    currentShipment?.returnRequested === true ||
    currentShipment?.returnStatus === 'Requested' ||
    currentShipment?.returnStatus === 'Approved' ||
    currentShipment?.status === 'Return In Transit' ||
    currentShipment?.status === 'Returned & Refunded'
  );

  const isRefundCompleted = Boolean(
    currentShipment?.status === 'Returned & Refunded' ||
    currentShipment?.returnStatus === 'Returned & Refunded' ||
    currentShipment?.returnStatus === 'Completed' ||
    currentShipment?.status === 'Returned & Restocked'
  );

  const isReturnable = currentShipment?.returnAllowed !== false
    && !isReturnAlreadyApplied
    && !['Released', 'Cancelled', 'Returned & Refunded', 'Return Requested', 'Return In Transit'].includes(currentShipment?.status)
    && !currentShipment?.returnWindowClosed
    && (
      currentShipment?.status === 'Delivered'
      || Boolean(currentShipment?.deliveryConfirmed)
    );

  const discountOfferedAtTime = currentShipment?.discountOfferedAt ? new Date(currentShipment.discountOfferedAt).getTime() : 0;
  const discountElapsedMs = discountOfferedAtTime > 0 ? (Date.now() - discountOfferedAtTime) : 0;
  const fifteenHoursMs = 15 * 60 * 60 * 1000;
  const isDiscount15hPassed = discountOfferedAtTime > 0 && discountElapsedMs >= fifteenHoursMs;
  const discountRemainingMs = Math.max(0, fifteenHoursMs - discountElapsedMs);
  const discountTotalMins = Math.ceil(discountRemainingMs / (1000 * 60));
  const discountRemainingHours = Math.floor(discountTotalMins / 60);
  const discountRemainingMins = discountTotalMins % 60;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="bg-white h-full sm:h-auto max-w-xl w-full sm:rounded-3xl p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-screen">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-extrabold text-lg">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{currentShipment.shipmentId}</h2>
                <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentShipment.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border-slate-300' : 
                  currentShipment.status === 'Undelivered' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-blue-50 text-[#1E56E3] border-blue-200'
                }`}>
                  {currentShipment.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{currentShipment.description || 'ParcelSafe Secured Order'}</p>
            </div>
          </div>

          {/* Repeat Shipment Action for Seller */}
          {isSupplier && onRepeatShipment && (
            <button
              type="button"
              onClick={() => onRepeatShipment(currentShipment)}
              className="mr-8 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E56E3] text-[#1E56E3] hover:text-white border border-blue-200 hover:border-[#1E56E3] transition font-bold text-xs shadow-2xs cursor-pointer group shrink-0"
              title="Repeat this shipment with exact same details (can edit before booking)"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition duration-200" />
              <span>Repeat Shipment</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Fetching live tracking & milestone data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Escrow Value</span>
                <span className="text-xl font-extrabold text-slate-900">₹{currentShipment.amount ? currentShipment.amount.toLocaleString('en-IN') : '0'}</span>
                <span className="block text-[10px] text-emerald-600 font-bold mt-1">
                  100% Escrow Protected • 0% Fee
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient</span>
                <span className="text-sm font-bold text-slate-900 block truncate">{currentShipment.receiverName || 'Buyer'}</span>
                <span className="text-[11px] text-slate-500">{currentShipment.receiverPhone || '+919876543210'}</span>
                {currentShipment.city && (
                  <span className="text-[10px] text-slate-400 font-semibold block truncate mt-1">{currentShipment.city}</span>
                )}
              </div>
            </div>

            {/* Quick Repeat Shipment Banner for Sellers */}
            {isSupplier && onRepeatShipment && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Need to ship another parcel to this buyer?</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      One-click repeat with same details, with full freedom to edit details before booking.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRepeatShipment(currentShipment)}
                  className="shrink-0 w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1E56E3] hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ship Again</span>
                </button>
              </div>
            )}

            {/* Carrier & AWB Details */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-[#1E56E3]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {CARRIER_NAMES[currentShipment.carrierSlug] || currentShipment.carrierSlug || 'Courier Partner'}
                    {currentShipment.carrierSlug === 'add_later' && (
                      <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Pending Assignment</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    AWB: {currentShipment.awbCode || (isSupplier && !currentShipment.trackingSubmitted ? '— Submit tracking ID below' : 'Pending')}
                  </p>
                </div>
              </div>
              <a
                href={currentShipment.shippingLabelUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#1E56E3] hover:underline flex items-center gap-1"
              >
                <span>Label PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* ── COURIER CHARGES & ESCROW SETTLEMENT STATEMENT (For Sellers) ── */}
            {isSupplier && (() => {
              const grossAmt = Number(currentShipment.amount) || 0;
              const courierFee = Number(currentShipment.courierDeliveryCharge) || Number(currentShipment.pickupRate) || (currentShipment.carrierSlug ? 55 : 0);
              const isCod = currentShipment.paymentMode === 'cod';
              const codFee = isCod ? (Number(currentShipment.codHandlingCharge) || 30) : 0;
              const isOffline = currentShipment.paymentMode === 'paid_offline';
              const serviceFee = 0; // Platform fee removed — escrow is free
              const calculatedNet = Math.max(0, parseFloat((grossAmt - (isOffline ? 0 : courierFee) - codFee).toFixed(2)));
              const netPayout = (currentShipment.netSellerPayout > 0 && currentShipment.netSellerPayout <= grossAmt)
                ? currentShipment.netSellerPayout
                : (currentShipment.principalDisbursedToSupplier > 0 && currentShipment.principalDisbursedToSupplier <= grossAmt)
                ? currentShipment.principalDisbursedToSupplier
                : calculatedNet;

              return (
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                  {/* Clean Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1E56E3]" />
                      <span className="text-xs font-extrabold text-slate-800">
                        Settlement Breakdown
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isCod 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : isOffline 
                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isCod ? 'COD' : isOffline ? 'Offline' : 'Prepaid Escrow'}
                    </span>
                  </div>

                  {/* Clean Breakdown List */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Order Value</span>
                      <span className="font-mono font-bold text-slate-900">₹{grossAmt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-rose-500" />
                        <span>Courier Freight ({currentShipment.pickupCarrier || 'Delhivery'})</span>
                      </span>
                      <span className="font-mono font-bold text-rose-600">-₹{courierFee}</span>
                    </div>
                    {isCod && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>COD Collection Fee</span>
                        <span className="font-mono font-bold text-amber-600">-₹{codFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/60 -mx-3 px-3 py-1 rounded-lg">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span>SecureKaro Escrow Fee</span>
                      </span>
                      <span className="font-mono font-black text-emerald-700">FREE ✓</span>
                    </div>

                    {/* Net Payout Highlight Row */}
                    <div className="border-t border-emerald-200/70 pt-2.5 mt-2 flex justify-between items-center bg-emerald-50/90 -mx-3 -mb-3 px-3 py-2.5 rounded-b-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs">Net Seller Payout</span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Wallet
                        </span>
                      </div>
                      <span className="font-mono text-emerald-700 font-black text-base">
                        ₹{netPayout.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Clean Minimalist Footer */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1.5 text-[10.5px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>100% RBI Escrow Protected</span>
                    </span>
                    <span className={`font-extrabold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${
                      currentShipment.status === 'Released' || currentShipment.status === 'Completed'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                        : 'text-amber-700 bg-amber-50 border-amber-200/80'
                    }`}>
                      {currentShipment.status === 'Released' || currentShipment.status === 'Completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled to Wallet</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Delivery</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── AUTO-SCHEDULED COURIER PICKUP CARD ── */}
            {Boolean(currentShipment.pickupSlot || currentShipment.pickupToken) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/40 border border-emerald-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      ⚡ Courier Pickup Auto-Scheduled
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 border border-emerald-300">
                    {currentShipment.pickupStatus || 'Scheduled'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Carrier (Lowest Route Charge)</span>
                    <span className="font-extrabold text-slate-900">{currentShipment.pickupCarrier || CARRIER_NAMES[currentShipment.carrierSlug] || 'Delhivery Express'}</span>
                    {currentShipment.pickupRate && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">₹{currentShipment.pickupRate} Delivery Charge</span>
                    )}
                  </div>

                  <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup Slot</span>
                    <span className="font-extrabold text-slate-900 leading-tight block">{currentShipment.pickupSlot}</span>
                  </div>

                  <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup Reference Token</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-blue-700 select-all">{currentShipment.pickupToken}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentShipment.pickupToken || '');
                          setCopiedPickupToken(true);
                          setTimeout(() => setCopiedPickupToken(false), 2000);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-50 transition"
                        title="Copy Pickup Token"
                      >
                        {copiedPickupToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup Executive</span>
                    <span className="font-bold text-slate-900">{currentShipment.pickupAgentName || 'Courier Executive'}</span>
                    {currentShipment.pickupAgentPhone && (
                      <span className="text-[10px] text-slate-500 font-mono block">{currentShipment.pickupAgentPhone}</span>
                    )}
                  </div>
                </div>

                {currentShipment.pickupLocationAddress && (
                  <div className="text-[11px] text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      <strong className="text-slate-700">Origin:</strong> {currentShipment.pickupLocationAddress}
                    </span>
                  </div>
                )}


              </div>
            )}

            {/* ── SUBMIT COURIER DETAILS & DISPATCH (Supplier only, before dispatch) ── */}
            {isSupplier && !currentShipment.trackingSubmitted && !['Released', 'Cancelled', 'Returned & Refunded'].includes(currentShipment.status) && (
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/80 overflow-hidden shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Submit Courier Details & Dispatch Parcel</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {currentShipment.carrierSlug && currentShipment.carrierSlug !== 'add_later'
                          ? `Courier: ${CARRIER_NAMES[currentShipment.carrierSlug] || currentShipment.carrierSlug}${currentShipment.awbCode ? ` · AWB: ${currentShipment.awbCode}` : ''}`
                          : 'Confirm courier service & tracking ID before dispatching the parcel.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDispatchForm(!showDispatchForm)}
                    className="shrink-0 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{showDispatchForm ? 'Hide Form' : 'Submit & Dispatch'}</span>
                  </button>
                </div>

                {showDispatchForm && (
                  <form onSubmit={handleDispatchSubmit} className="border-t border-indigo-200 bg-white px-5 py-4 space-y-4 animate-in fade-in duration-200">
                    {/* Error / Success Messages */}
                    {dispatchErr && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        <span>{dispatchErr}</span>
                      </div>
                    )}
                    {dispatchMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{dispatchMsg}</span>
                      </div>
                    )}

                    {/* Courier Service Selection (auto-filled from creation) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Courier Service Name
                        </label>
                        {(currentShipment.carrierSlug && currentShipment.carrierSlug !== 'add_later') && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            🔒 Auto-Assigned & Locked
                          </span>
                        )}
                      </div>
                      <select
                        value={dispatchCarrierSlug}
                        onChange={(e) => setDispatchCarrierSlug(e.target.value)}
                        disabled={Boolean(currentShipment.carrierSlug && currentShipment.carrierSlug !== 'add_later' || currentShipment.awbCode)}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                          (currentShipment.carrierSlug && currentShipment.carrierSlug !== 'add_later') || currentShipment.awbCode
                            ? 'bg-slate-100 border border-slate-300 text-slate-700 cursor-not-allowed select-none'
                            : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer'
                        }`}
                      >
                        <option value="">-- Select Courier Partner --</option>
                        <option value="delhivery">Delhivery Express</option>
                        <option value="bluedart">BlueDart Logistics</option>
                        <option value="dtdc">DTDC Express</option>
                        <option value="ekart">Ekart Logistics</option>
                        <option value="shadowfax">Shadowfax</option>
                        <option value="indiapost">India Post Speed Post</option>
                        <option value="other">Other / Custom Courier</option>
                      </select>
                    </div>

                    {/* Courier Tracking ID / AWB (auto-filled from creation) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Courier Tracking ID / AWB Code *
                        </label>
                        {currentShipment.awbCode && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 font-sans">
                            🔒 Auto-Generated AWB (Locked)
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        readOnly={Boolean(currentShipment.awbCode || dispatchAwb)}
                        placeholder="e.g. DEL7834920147 or TC-delhivery-7539789936"
                        value={dispatchAwb}
                        onChange={(e) => setDispatchAwb(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold ${
                          currentShipment.awbCode || dispatchAwb
                            ? 'bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed select-none'
                            : 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>

                    {/* Product Photo Upload: Mandatory for all shipments */}
                    {(() => {
                      const isPhotoMandatory = true;
                      return (
                        <div className="p-4 rounded-2xl space-y-3 transition-all bg-amber-50/90 border-2 border-amber-400 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="p-2 rounded-xl mt-0.5 shrink-0 bg-amber-100 text-amber-800">
                                <Camera className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-black text-slate-900">Upload Product / Parcel Photo</p>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                    * MANDATORY (All Shipments)
                                  </span>
                                </div>
                                <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                                  ⚠️ Uploading a clear product/parcel photo is mandatory for all shipments before courier dispatch to guarantee escrow safety.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="url"
                              required={isPhotoMandatory}
                              placeholder={isPhotoMandatory ? '⚠️ REQUIRED: Paste product/parcel photo URL here...' : 'Optional: Paste product/parcel photo URL (e.g. https://...)'}
                              value={dispatchPhotoUrl}
                              onChange={(e) => setDispatchPhotoUrl(e.target.value)}
                              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-mono focus:ring-2 ${
                                isPhotoMandatory
                                  ? 'border-amber-400 focus:ring-amber-500 text-amber-950 placeholder-amber-500/70 ring-1 ring-amber-200'
                                  : 'border-slate-200 focus:ring-indigo-500 text-slate-800'
                              }`}
                            />

                        {/* Quick Sample Photos & Live File Upload */}
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          {/* Option A: Direct Camera Capture */}
                          <button
                            type="button"
                            disabled={uploadingPhoto}
                            onClick={() => setShowCameraModal(true)}
                            className={`px-2.5 py-1 border rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                              uploadingPhoto
                                ? 'bg-amber-50 border-amber-300 text-amber-700 cursor-wait'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {uploadingPhoto ? (
                              <><div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
                            ) : (
                              <><Camera className="w-3.5 h-3.5 text-indigo-600" /><span>Camera</span></>
                            )}
                          </button>

                          {/* Option B: Choose from Gallery (no capture attribute) */}
                          <label className={`px-2.5 py-1 border rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${uploadingPhoto ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'}`}>
                            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                            <span>Gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingPhoto}
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingPhoto(true);
                                setDispatchErr('');
                                try {
                                  const { url, isHosted } = await uploadImageToHost(file, `parcel-${currentShipment.shipmentId}`);
                                  if (url) {
                                    setDispatchPhotoUrl(url);
                                    if (!isHosted) {
                                      setDispatchErr('⚠️ Photo uploaded (in-session only). For permanent storage, paste a hosted image URL instead.');
                                    }
                                  } else {
                                    setDispatchErr('Photo upload failed. Please paste a direct image URL instead.');
                                  }
                                } finally {
                                  setUploadingPhoto(false);
                                }
                              }}
                            />
                          </label>
                          {dispatchPhotoUrl && !uploadingPhoto && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Photo Ready
                            </span>
                          )}

                          <span className="text-slate-400 font-semibold">Or sample:</span>
                          {(() => {
                            const uploadTime = currentShipment?.parcelPhotoUploadedAt ? new Date(currentShipment.parcelPhotoUploadedAt).getTime() : null;
                            const isExpired = uploadTime ? (Date.now() - uploadTime > 10 * 60 * 1000) : false;
                            if (isExpired) return null;
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setDispatchPhotoUrl('https://images.unsplash.com/photo-1544816155-12df9643f363?w=600')}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                                >
                                  📦 Sealed Box
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDispatchPhotoUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600')}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                                >
                                  🎧 Electronics
                                </button>
                                {dispatchPhotoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setDispatchPhotoUrl('')}
                                    className="text-rose-600 hover:underline font-bold ml-auto"
                                  >
                                    Retake / Clear
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {dispatchPhotoUrl && (() => {
                        const uploadTime = currentShipment?.parcelPhotoUploadedAt ? new Date(currentShipment.parcelPhotoUploadedAt).getTime() : null;
                        const elapsedMs = uploadTime ? (Date.now() - uploadTime) : 0;
                        const isExpired = uploadTime ? (elapsedMs > 10 * 60 * 1000) : false;
                        const remainingSec = uploadTime ? Math.max(0, Math.ceil((10 * 60 * 1000 - elapsedMs) / 1000)) : null;
                        const minLeft = remainingSec !== null ? Math.floor(remainingSec / 60) : 0;
                        const secLeft = remainingSec !== null ? remainingSec % 60 : 0;
                        const timeStr = `${minLeft}m ${secLeft < 10 ? '0' : ''}${secLeft}s`;

                        return (
                          <div className="space-y-2">
                            {uploadTime && !isExpired && (
                              <div className="p-2 rounded-xl bg-amber-50 border border-amber-300/80 flex items-center justify-between text-[11px] text-amber-900">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                  Reminder: Retake option will be gone after 10 minutes
                                </span>
                                <span className="font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                                  {timeStr} left
                                </span>
                              </div>
                            )}
                            {uploadTime && isExpired && (
                              <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
                                <span className="flex items-center gap-1 font-bold">
                                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  Photo Locked: 10-minute retake window expired
                                </span>
                                <span className="font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  Locked
                                </span>
                              </div>
                            )}
                            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-900 flex items-center justify-center">
                              <img
                                src={dispatchPhotoUrl}
                                alt="Parcel preview"
                                className="w-full h-36 object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                    {/* Dispatch Submit & Cancel Buttons */}
                    {(() => {
                      const isPhotoMandatory = true;
                      const isPhotoMissing = !dispatchPhotoUrl?.trim();
                      const isAwbMissing = !dispatchAwb?.trim();
                      const isCarrierMissing = !dispatchCarrierSlug;
                      const isBlocked = actionLoading || isPhotoMissing || isAwbMissing || isCarrierMissing;

                      return (
                        <div className="space-y-2.5 pt-1">
                          {isPhotoMissing && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-bold">
                              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                              <span>Dispatch button is locked: Upload a product/parcel photo to unlock dispatch. Parcel photo upload is mandatory for all shipments before dispatch.</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <button
                              type="submit"
                              disabled={isBlocked}
                              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                                isBlocked
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                              }`}
                            >
                              {actionLoading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Submitting...</span>
                                </>
                              ) : isPhotoMissing ? (
                                <>
                                  <Lock className="w-4 h-4 text-slate-400" />
                                  <span>Upload Photo to Unlock Dispatch (Mandatory for All Shipments)</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Submit &amp; Dispatch Parcel</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDispatchForm(false)}
                              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </form>
                )}
              </div>
            )}

            {/* Dispatch success message */}
            {dispatchMsg && currentShipment.trackingSubmitted && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{dispatchMsg}</span>
              </div>
            )}

            {/* ── IN-BOX QR CODE PANEL (Seller / Supplier only - active before buyer verification) ──────────── */}
            {isSupplier && !currentShipment.inboxQrUsed && (
              !currentShipment.parcelPhotoUrl ? (
                /* LOCKED STATE: Photo required before QR code generation */
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/80 p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-slate-900">In-Box QR Code</p>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300">
                            🔒 Locked — Photo Required First
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          In-box delivery QR label will be generated automatically only after you upload the parcel review photo below.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('parcel-photo-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        else setShowCameraModal(true);
                      }}
                      className="shrink-0 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload Photo to Unlock QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50/60 overflow-hidden shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">In-Box QR Code</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Print &amp; place inside parcel — receiver scans to confirm delivery
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrPanel(!showQrPanel)}
                    className="shrink-0 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-violet-500/20 transition flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrPanel ? 'Hide QR' : 'View QR Label'}</span>
                  </button>
                </div>

                {showQrPanel && (() => {
                  const localIp = networkInfo?.localIp || window.location.hostname || 'localhost';
                  const currentPort = window.location.port || '3001';
                  let resolvedBase = `http://${localIp}:${currentPort}`;

                  if (qrScanMode === 'localhost') {
                    resolvedBase = window.location.origin;
                  } else if (qrScanMode === 'custom' && customQrUrl.trim()) {
                    resolvedBase = customQrUrl.trim().replace(/\/+$/, '');
                  } else {
                    resolvedBase = networkInfo?.frontendNetworkUrl || `http://${localIp}:${currentPort}`;
                  }

                  const qrUrl = `${resolvedBase}/qr-confirm/${currentShipment.inboxQrToken}`;

                  return (
                    <div className="border-t border-violet-200 bg-white px-5 py-5 space-y-4 animate-in fade-in duration-200">
                      {/* Device Scan Mode Selector */}
                      <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-violet-600" />
                            <span>Scan Target Destination:</span>
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            qrScanMode === 'phone'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : qrScanMode === 'localhost'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-violet-100 text-violet-800 border-violet-300'
                          }`}>
                            {qrScanMode === 'phone' ? '📱 Mobile Phone Ready' : qrScanMode === 'localhost' ? '💻 Laptop Testing' : '🌐 Custom Network'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setQrScanMode('phone')}
                            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                              qrScanMode === 'phone'
                                ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Phone (Wi-Fi)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrScanMode('localhost')}
                            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                              qrScanMode === 'localhost'
                                ? 'bg-[#1E56E3] text-white shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Laptop className="w-3 h-3" />
                            <span>Localhost</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrScanMode('custom')}
                            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                              qrScanMode === 'custom'
                                ? 'bg-violet-600 text-white shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            <span>Custom IP</span>
                          </button>
                        </div>

                        {qrScanMode === 'custom' && (
                          <div className="pt-1">
                            <input
                              type="text"
                              placeholder="e.g. http://192.168.1.100:5173 or https://myapp.ngrok.app"
                              value={customQrUrl}
                              onChange={(e) => setCustomQrUrl(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                            />
                          </div>
                        )}

                        {/* Mode Explanation & Guidance */}
                        {qrScanMode === 'phone' ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-[11px] text-emerald-900">
                            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold text-emerald-950">
                                Scannable with your Phone's Camera App:
                              </p>
                              <p className="text-[10.5px] text-emerald-800 leading-relaxed">
                                Point your iPhone or Android camera at the QR code below. Your phone will open <span className="font-mono font-bold">{resolvedBase}</span> over local Wi-Fi. (Phone and PC must be on same Wi-Fi).
                              </p>
                            </div>
                          </div>
                        ) : qrScanMode === 'localhost' ? (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-[11px] text-blue-900">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[10.5px] leading-relaxed">
                              Encodes <span className="font-mono font-bold">{resolvedBase}</span>. Best when opening or testing the sign-off link in this browser on this PC.
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Printable QR Label */}
                      <div id="qr-print-area" className="flex flex-col items-center gap-3.5 p-5 border-2 border-dashed border-violet-300 rounded-2xl bg-violet-50/40">
                        <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">SecureKaro — Delivery Sign-Off QR</p>
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                          <QRCodeSVG
                            value={qrUrl}
                            size={154}
                            level="H"
                            includeMargin={false}
                            fgColor="#1e1b4b"
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-800">Scan to confirm delivery</p>
                          <p className="text-[11px] text-slate-500">{currentShipment.description}</p>
                          <p className="text-sm font-extrabold text-violet-800 mt-0.5">₹{currentShipment.amount?.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] font-mono text-slate-400 break-all max-w-xs mt-1 bg-white/70 py-1 px-2 rounded-md border border-slate-200">
                            {qrUrl}
                          </p>
                        </div>
                        <p className="text-[9.5px] text-slate-400 text-center leading-relaxed">
                          Receiver scans QR &amp; verifies mobile number at securekaro.app/qr-confirm<br />No login required • Protected by SecureKaro Escrow
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-violet-600/20"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Label</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(qrUrl);
                            setQrCopied(true);
                            setTimeout(() => setQrCopied(false), 2500);
                          }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {qrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{qrCopied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Open sign-off page in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Test</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* ── VERIFIED CONFIRMATION BADGE (Replaces QR code once buyer verified) ──────────── */}
            {isSupplier && currentShipment.inboxQrUsed && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Parcel Verified &amp; Confirmed</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        QR Used • Deactivated
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Buyer confirmed delivery on {currentShipment.inboxQrConfirmedAt ? new Date(currentShipment.inboxQrConfirmedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'recently'} via {currentShipment.inboxQrConfirmMethod === 'qr_scan' ? 'In-Box QR scan' : 'OTP verification'}. The single-use QR code has expired and cannot be scanned again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* QR panel for dispatched shipments without token yet (fallback message) */}
            {isSupplier && currentShipment.trackingSubmitted && !currentShipment.inboxQrToken && !currentShipment.inboxQrUsed && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">QR code will generate when you refresh after dispatch. If missing, please re-dispatch or contact support.</p>
              </div>
            )}

            {/* Return Policy Status & Seller Toggle */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentShipment.returnAllowed !== false ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Return Policy</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${currentShipment.returnAllowed !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {currentShipment.returnAllowed !== false ? 'Returns Allowed (24h Window)' : 'Returns Disabled (Final Sale)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentShipment.returnAllowed !== false 
                      ? 'Buyer can inspect & request return within 24 hours of delivery. (Locked once payment link is sent)' 
                      : 'Returns are disabled by seller for this parcel.'}
                  </p>
                </div>
              </div>

              {/* Seller toggle action to enable returns (disabling is locked once payment link is sent) */}
              {isSender && !isReceiverUser && activeRole !== 'Receiver' && !['Released', 'Cancelled', 'Returned & Refunded'].includes(currentShipment.status) && (
                currentShipment.returnAllowed === false ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleToggleReturnOption(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Enable Return Option
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 shrink-0 shadow-2xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Locked (Link Sent)</span>
                  </div>
                )
              )}
            </div>



            {/* ── ESCROW PAYMENT STATUS: Active payment link only while Awaiting Payment; replaced with confirmation badge once paid ── */}
            {(() => {
              const isAwaitingPayment = currentShipment.status === 'Awaiting Payment' && (!currentShipment.escrowStage || currentShipment.escrowStage === 1);
              const formattedAmt = currentShipment.amount ? Number(currentShipment.amount).toLocaleString('en-IN') : '0';

              if (!isAwaitingPayment) {
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">Escrow Payment Deposited</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ₹{formattedAmt} Secured
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Buyer has completed the escrow payment. Funds are locked safely in vault protection and will disburse upon verified delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const rName = currentShipment.receiverName ? currentShipment.receiverName.split(' ')[0] : 'Customer';
              const payLinkUrl = `${window.location.origin}/pay/${currentShipment.shipmentId || 'SPL-5396-U'}`;
              const waMsg = `Hello ${rName}! Your order for ₹${formattedAmt} is secured by SecureKaro Escrow. Your money stays protected in the vault until delivery. Tap to inspect and deposit safely: ${payLinkUrl}`;
              const rawPh = (currentShipment.receiverPhone || '').replace(/\D/g, '');
              const cleanPh = rawPh.length === 10 ? `91${rawPh}` : rawPh;
              const waUrl = cleanPh 
                ? `https://api.whatsapp.com/send?phone=${cleanPh}&text=${encodeURIComponent(waMsg)}`
                : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;

              return (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#1E56E3] font-extrabold text-xs">
                      <Link2 className="w-4 h-4" />
                      <span>Integrated Escrow Payment Link</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      UPI &amp; NetBanking Active
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Send this escrow link to {currentShipment.receiverName || 'the buyer'} to collect ₹{formattedAmt} directly into vault protection.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={payLinkUrl}
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono text-slate-800 truncate"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(payLinkUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    {/* Pay Now is ONLY for the buyer/receiver, never for the seller/supplier */}
                    {!isSupplier && (
                      <button
                        type="button"
                        onClick={() => setShowCheckoutModal(true)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </button>
                    )}
                  </div>

                  {/* WhatsApp Direct Share Button (for supplier to send to buyer) */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span>Share to WhatsApp ({rName})</span>
                  </a>
                </div>
              );
            })()}





            {/* PARCEL PHOTO REVIEW STATUS, UPLOAD & PREVIEW */}
            {(currentShipment.parcelPhotoUrl || currentShipment.photoReviewEnabled || isSupplier) && (
              <div id="parcel-photo-section" className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">Parcel &amp; Product Review Photo</span>
                  </div>
                  {currentShipment.parcelPhotoUrl ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Photo Uploaded &amp; Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Mandatory — Awaiting Photo from Sender
                    </span>
                  )}
                </div>

                {currentShipment.parcelPhotoUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-white relative group shadow-2xs">
                      <img
                        src={currentShipment.parcelPhotoUrl}
                        alt="Verified Parcel"
                        className="w-full h-52 object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>
                        Uploaded by supplier prior to dispatch for buyer inspection.
                        {currentShipment.parcelPhotoUploadedAt ? ` (${new Date(currentShipment.parcelPhotoUploadedAt).toLocaleString()})` : ''}
                      </span>
                      {isSupplier && (() => {
                        const uploadTime = currentShipment?.parcelPhotoUploadedAt ? new Date(currentShipment.parcelPhotoUploadedAt).getTime() : null;
                        const isExpired = uploadTime ? (Date.now() - uploadTime > 10 * 60 * 1000) : false;
                        if (isExpired) {
                          return (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Photo Locked
                            </span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => setShowCameraModal(true)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Retake Photo</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-600">
                      Parcel photo upload is mandatory for all shipments before courier dispatch to guarantee escrow safety.
                      <strong className="block text-indigo-900 mt-1">
                        ⚡ The In-Box QR Code and courier dispatch will be generated and unlocked immediately once you upload the parcel photo.
                      </strong>
                    </p>

                    {isSupplier && (
                      <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-indigo-600" />
                            <span>Upload Parcel &amp; Product Photo:</span>
                          </span>
                          {uploadingParcelPhoto && (
                            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Uploading &amp; Generating QR...
                            </span>
                          )}
                        </div>

                        {photoUploadErr && (
                          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                            {photoUploadErr}
                          </div>
                        )}
                        {photoUploadMsg && (
                          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{photoUploadMsg}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Option 1: Live Camera Viewfinder */}
                          <button
                            type="button"
                            disabled={uploadingParcelPhoto}
                            onClick={() => setShowCameraModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Photo</span>
                          </button>

                          {/* Option 2: Gallery / Local File Upload */}
                          <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                            <span>Choose from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingParcelPhoto}
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingParcelPhoto(true);
                                setPhotoUploadErr('');
                                try {
                                  const { url } = await uploadImageToHost(file, `parcel-${currentShipment.shipmentId}`);
                                  if (url) {
                                    await handleUploadParcelPhoto(url);
                                  } else {
                                    setPhotoUploadErr('Photo upload failed. Please try again.');
                                  }
                                } catch (err) {
                                  setPhotoUploadErr('Photo upload failed. Please try again.');
                                } finally {
                                  setUploadingParcelPhoto(false);
                                }
                              }}
                            />
                          </label>

                          {/* Option 3: Quick Demo Samples */}
                          <div className="flex items-center gap-1.5 text-[10px] ml-auto">
                            <span className="text-slate-400 font-semibold">Sample:</span>
                            <button
                              type="button"
                              disabled={uploadingParcelPhoto}
                              onClick={() => handleUploadParcelPhoto('https://images.unsplash.com/photo-1544816155-12df9643f363?w=600')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 font-bold transition cursor-pointer"
                            >
                              📦 Sealed Box
                            </button>
                            <button
                              type="button"
                              disabled={uploadingParcelPhoto}
                              onClick={() => handleUploadParcelPhoto('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 font-bold transition cursor-pointer"
                            >
                              🎧 Electronics
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RETURN RESOLUTION / 3-OPTION STATUS & BUYER DECISION CARD */}
            {isReturnAlreadyApplied && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Return Resolution: {
                        currentShipment.returnType === 'replacement' ? 'Instant Replacement' :
                        currentShipment.returnType === 'partial_discount' ? 'Defect Discount / Partial Refund' :
                        'Full Refund (Reverse Courier)'
                      }
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    {currentShipment.status}
                  </span>
                </div>

                {/* Option 2: Defect details & Supplier Discount Offer */}
                {currentShipment.returnType === 'partial_discount' && (
                  <div className="space-y-2.5">
                    {currentShipment.defectPhotoUrl && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-amber-600" />
                            <span>Buyer Defect Evidence Photo</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoModal({ isOpen: true, url: currentShipment.defectPhotoUrl, title: `Defect Photo Evidence — ${currentShipment.shipmentId}` })}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Click for Full View</span>
                          </button>
                        </div>
                        <div 
                          onClick={() => setPreviewPhotoModal({ isOpen: true, url: currentShipment.defectPhotoUrl, title: `Defect Photo Evidence — ${currentShipment.shipmentId}` })}
                          className="rounded-2xl overflow-hidden border-2 border-amber-300/80 bg-slate-950 group relative cursor-pointer shadow-sm hover:border-amber-500 transition"
                        >
                          <img 
                            src={currentShipment.defectPhotoUrl} 
                            alt="Defect proof" 
                            className="w-full max-h-56 object-contain mx-auto group-hover:scale-102 transition duration-200" 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                            <ZoomIn className="w-4 h-4" />
                            <span>Click to Inspect Full Photo</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {currentShipment.defectDescription && (
                      <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                        <span className="font-bold text-slate-900">Buyer's Note: </span>
                        {currentShipment.defectDescription}
                      </p>
                    )}

                    {/* Pending Supplier Offer */}
                    {(!currentShipment.discountOfferedAmount || currentShipment.discountOfferedAmount <= 0) && currentShipment.status === 'Return Requested' && (
                      isSupplier ? (
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900">Offer Defect Discount to Buyer</h4>
                                <p className="text-[11px] text-slate-600">Propose a partial refund amount so the buyer keeps the item.</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                              Order Total: ₹{currentShipment.amount}
                            </span>
                          </div>

                          <form onSubmit={handleOfferDiscount} className="space-y-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Discount Amount to Refund to Buyer (₹) <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={Math.max(1, (Number(currentShipment.amount) || 1) - 1)}
                                  placeholder="Enter discount amount (e.g. 150)"
                                  value={supplierDiscountInput}
                                  onChange={(e) => setSupplierDiscountInput(e.target.value)}
                                  required
                                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            {/* Quick Percent Suggestions */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                              <span className="text-slate-500 font-semibold">Quick pick:</span>
                              {[10, 20, 30, 50].map((pct) => {
                                const val = Math.round(((Number(currentShipment.amount) || 0) * pct) / 100);
                                if (val <= 0 || val >= (Number(currentShipment.amount) || 0)) return null;
                                return (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setSupplierDiscountInput(String(val))}
                                    className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold transition cursor-pointer"
                                  >
                                    {pct}% (₹{val})
                                  </button>
                                );
                              })}
                            </div>

                            {supplierDiscountInput && Number(supplierDiscountInput) > 0 && Number(supplierDiscountInput) < Number(currentShipment.amount) && (
                              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-[11px] space-y-1">
                                <div className="flex justify-between font-bold text-slate-700">
                                  <span>Buyer gets refunded from escrow:</span>
                                  <span className="text-amber-700">₹{Number(supplierDiscountInput)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-700">
                                  <span>You (Seller) will receive:</span>
                                  <span>₹{(Number(currentShipment.amount) || 0) - Number(supplierDiscountInput)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 pt-0.5">
                                  ✓ If buyer accepts, funds split automatically without reverse courier charges or return hassle.
                                </p>
                              </div>
                            )}

                            <div className="pt-1">
                              <button
                                type="submit"
                                disabled={actionLoading || !supplierDiscountInput || Number(supplierDiscountInput) <= 0 || Number(supplierDiscountInput) >= Number(currentShipment.amount)}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Tag className="w-4 h-4" />
                                <span>{actionLoading ? 'Processing...' : `Send ₹${supplierDiscountInput || '...'} Discount Offer to Buyer`}</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-100/70 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Awaiting seller to review defect evidence and propose a discount amount.</span>
                        </div>
                      )
                    )}

                    {/* Supplier Offered Discount -> Decision / Status */}
                    {Boolean(Number(currentShipment.discountOfferedAmount) > 0 && currentShipment.discountAccepted !== true && currentShipment.discountAccepted !== false) && (
                      isSupplier ? (
                        <div className="p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs">
                              <Tag className="w-4 h-4 text-amber-600" />
                              <span>Discount Offer Sent to Buyer</span>
                            </div>
                            <span className="text-sm font-black text-amber-700">
                              ₹{Number(currentShipment.discountOfferedAmount).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            You offered a discount of <strong className="text-slate-900">₹{currentShipment.discountOfferedAmount}</strong>. 
                            If the buyer accepts, they keep the product, <strong className="text-amber-700">₹{currentShipment.discountOfferedAmount}</strong> is refunded to them, and <strong className="text-emerald-700">₹{(Number(currentShipment.amount) || 0) - Number(currentShipment.discountOfferedAmount)}</strong> is released immediately to your wallet.
                          </p>

                          {/* 15-Hour Window Verification & Auto-Complete Control */}
                          {!isDiscount15hPassed ? (
                            <div className="p-3 bg-white/95 rounded-xl border border-amber-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1.5 text-amber-900">
                                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                  <span>Awaiting Buyer's Decision</span>
                                </span>
                                <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                  {discountRemainingHours}h {discountRemainingMins}m window
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                The buyer has a 15-hour review window to accept or reject your offer. If the buyer does not respond after 15 hours, you will unlock the right to auto-complete the refund with this offer.
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 font-semibold flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  Auto-completion locked ({discountRemainingHours}h {discountRemainingMins}m left)
                                </span>
                                {!isEditingDiscountOffer && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSupplierDiscountInput(String(currentShipment.discountOfferedAmount));
                                      setIsEditingDiscountOffer(true);
                                    }}
                                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                  >
                                    Revise Offer
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-400 text-xs text-emerald-950 space-y-2">
                              <div className="flex items-center justify-between font-extrabold text-emerald-800">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>15-Hour Window Expired (No Buyer Response)</span>
                                </span>
                                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                                  Inactivity Unlocked
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed">
                                The buyer did not respond to your ₹{currentShipment.discountOfferedAmount} discount offer within 15 hours. You now have the right to auto-complete the refund with this offer.
                              </p>
                              <button
                                type="button"
                                onClick={handleSupplierAutoCompleteDiscount}
                                disabled={actionLoading}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Auto-Complete Discount Refund (₹{currentShipment.discountOfferedAmount})</span>
                              </button>
                            </div>
                          )}

                          {isEditingDiscountOffer && (
                            <form onSubmit={handleOfferDiscount} className="pt-2 border-t border-amber-200 space-y-2">
                              <label className="block text-[11px] font-bold text-slate-700">Revise Discount Amount (₹):</label>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={Math.max(1, (Number(currentShipment.amount) || 1) - 1)}
                                    value={supplierDiscountInput}
                                    onChange={(e) => setSupplierDiscountInput(e.target.value)}
                                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                >
                                  Update Offer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingDiscountOffer(false)}
                                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : (
                        isActualReceiver ? (
                          <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-md space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                                <Tag className="w-4 h-4 text-emerald-600" />
                                <span>Supplier Offered Discount Offer</span>
                              </div>
                              <span className="text-sm font-black text-emerald-600">
                                ₹{Number(currentShipment.discountOfferedAmount).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              The seller has offered a discount of <strong className="text-slate-900">₹{currentShipment.discountOfferedAmount}</strong>. 
                              If you accept, you keep the item and <strong className="text-emerald-700">₹{currentShipment.discountOfferedAmount}</strong> is instantly deposited into your SecureCart wallet. 
                              If you reject, you automatically get a <strong className="text-rose-700">100% full refund (₹{currentShipment.amount})</strong>.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRespondDiscount(true)}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
                              >
                                Accept Offer (Keep Item + Get ₹{currentShipment.discountOfferedAmount})
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondDiscount(false)}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Reject & Get 100% Full Refund
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                                <Tag className="w-4 h-4 text-slate-500" />
                                <span>Supplier Offered Discount Offer</span>
                              </div>
                              <span className="text-sm font-black text-slate-800">
                                ₹{Number(currentShipment.discountOfferedAmount).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              A discount offer of <strong className="text-slate-900">₹{currentShipment.discountOfferedAmount}</strong> is awaiting decision from the verified buyer ({currentShipment.receiverName || 'Recipient'}).
                            </p>
                          </div>
                        )
                      )
                    )}

                    {/* Offer Accepted */}
                    {currentShipment.discountAccepted === true && (
                      <div className="p-3 bg-emerald-100/90 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Discount accepted: ₹{currentShipment.discountBuyerWalletCredited || currentShipment.discountOfferedAmount} credited to buyer wallet. Balance released to seller.</span>
                      </div>
                    )}

                    {/* Offer Rejected */}
                    {currentShipment.discountAccepted === false && (
                      <div className="p-3 bg-rose-100/90 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Discount rejected by buyer. Full 100% refund of ₹{currentShipment.amount} credited to buyer wallet.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 1: Replacement Status */}
                {currentShipment.returnType === 'replacement' && (
                  <div className="space-y-2">
                    {currentShipment.replacementApproved === true ? (
                      <div className="p-3 bg-emerald-100/90 rounded-xl text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Replacement Dispatched by Supplier!</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Courier: <strong className="text-emerald-950">{currentShipment.replacementCarrierName || 'Delhivery'}</strong> | Replacement AWB: <strong className="font-mono text-emerald-950">{currentShipment.replacementAwbCode}</strong>
                        </p>
                      </div>
                    ) : currentShipment.replacementApproved === false ? (
                      <div className="p-3 bg-rose-100/90 rounded-xl text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Replacement Rejected by Supplier</span>
                        </div>
                        <p className="text-[11px] text-rose-800">
                          Supplier could not fulfill replacement. Full 100% refund of ₹{currentShipment.amount} has been auto-credited to your wallet.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-100/70 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Awaiting supplier review to dispatch replacement unit. If supplier cannot replace, 100% full refund will be auto-issued.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 3: Full Refund / Reverse Courier */}
                {currentShipment.returnType === 'full_refund' && currentShipment.returnAwbCode && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900">Reverse Courier Pickup Assigned:</p>
                    <p className="text-[11px] text-slate-600">
                      Partner: {currentShipment.returnCarrierName || 'Delhivery Express'} | Tracking ID: <span className="font-mono font-bold text-slate-900">{currentShipment.returnAwbCode}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Live Carrier Journey Milestones */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Carrier Journey & Milestones</h3>
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {journey?.milestones?.length > 0 ? (
                  journey.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{m.status} — {m.location}</p>
                        <p className="text-[11px] text-slate-500">{m.detail}</p>
                        <span className="text-[10px] text-slate-400">{new Date(m.time).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">In Transit — Sorting Hub</p>
                        <p className="text-[11px] text-slate-500">Package scanned at central sorting facility.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Picked Up by Carrier Partner</p>
                        <p className="text-[11px] text-slate-500">Shipment handed over to courier partner.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* REVERSE LOGISTICS RETURN CARD & STEPPER */}
            {(currentShipment.returnAwbCode || (currentShipment.returnStatus && currentShipment.returnStatus !== 'None') || currentShipment.status?.includes('Return')) && (
              <div className={`p-5 rounded-3xl shadow-sm space-y-4 ${
                isRefundCompleted
                  ? 'bg-emerald-50/90 border border-emerald-200/90'
                  : 'bg-amber-50/90 border border-amber-200/90'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 font-extrabold text-xs ${
                    isRefundCompleted ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isRefundCompleted ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'
                    }`}>
                      {isRefundCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <RotateCcw className="w-4 h-4 text-amber-700" />}
                    </div>
                    <span>{isRefundCompleted ? 'Refund Completed' : 'Reverse Logistics & Return Tracking'}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                    isRefundCompleted
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-200 text-amber-900 border-amber-300'
                  }`}>
                    {currentShipment.returnStatus || currentShipment.status}
                  </span>
                </div>

                {/* 4-STEP RETURN JOURNEY STEPPER */}
                <div className={`p-4 bg-white/95 rounded-2xl border shadow-2xs space-y-3 ${
                  isRefundCompleted ? 'border-emerald-200/80' : 'border-amber-200/80'
                }`}>
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>{currentShipment.returnType === 'replacement' ? 'Replacement Journey (Inspect → Dispatch → Confirm)' : 'Return Journey Status'}</span>
                    <span className={`font-mono font-bold text-[10px] ${
                      isRefundCompleted ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {currentShipment.returnType === 'replacement' ? (
                        (currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Released') ? 'Stage 4 of 4 • Complete' :
                        currentShipment.replacementItemDispatched ? 'Stage 3 of 4 • Replacement In Transit' :
                        currentShipment.returnStatus === 'In Return Transit' ? 'Stage 2 of 4 • Old Item Pickup' :
                        'Stage 1 of 4 • Awaiting Seller'
                      ) : (
                        (currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Returned & Refunded') ? 'Stage 4 of 4 • Settled' :
                        currentShipment.returnStatus === 'In Return Transit' ? 'Stage 3 of 4 • In Transit' :
                        currentShipment.returnAwbCode ? 'Stage 2 of 4 • Courier Assigned' :
                        'Stage 1 of 4 • Awaiting Seller'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 relative">
                    {/* Stepper Progress Bar */}
                    {(currentShipment.returnType === 'replacement' ? [
                      { step: 1, label: '1. Requested', desc: 'Defect reported', active: true },
                      { step: 2, label: '2. Old Pickup', desc: 'Defective item collected', active: Boolean(currentShipment.returnAwbCode || currentShipment.returnStatus === 'In Return Transit' || currentShipment.replacementItemDispatched || currentShipment.returnStatus === 'Completed') },
                      { step: 3, label: '3. Replacement', desc: 'New item dispatched', active: Boolean(currentShipment.replacementItemDispatched || currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Released') },
                      { step: 4, label: '4. Delivered', desc: 'Buyer confirmed', active: Boolean(currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Released' || currentShipment.replacementDelivered) }
                    ] : [
                      { step: 1, label: '1. Requested', desc: 'Return initiated', active: true },
                      { step: 2, label: '2. Assigned', desc: 'Courier AWB set', active: Boolean(currentShipment.returnAwbCode || currentShipment.returnCarrierSlug || currentShipment.returnStatus === 'In Return Transit' || currentShipment.returnStatus === 'Completed') },
                      { step: 3, label: '3. In Transit', desc: 'Reverse pickup', active: Boolean(currentShipment.returnStatus === 'In Return Transit' || currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Returned & Refunded') },
                      { step: 4, label: '4. Refunded', desc: '100% Escrow back', active: Boolean(currentShipment.returnStatus === 'Completed' || currentShipment.status === 'Returned & Refunded') }
                    ]).map((s) => (
                      <div key={s.step} className="flex flex-col items-center text-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                          s.active 
                            ? (isRefundCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs')
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {s.active ? '✓' : s.step}
                        </div>
                        <span className={`text-[10.5px] font-bold mt-1.5 line-clamp-1 ${
                          s.active ? (isRefundCompleted ? 'text-emerald-950' : 'text-amber-950') : 'text-slate-400'
                        }`}>
                          {s.label}
                        </span>
                        <span className="text-[9px] text-slate-400 hidden sm:block">
                          {s.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-3.5 bg-white/95 rounded-2xl border space-y-3 text-xs ${
                  isRefundCompleted ? 'border-emerald-200' : 'border-amber-200'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Return Reason:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{currentShipment.returnReason || 'Product return requested'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Reverse Courier Partner:</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Truck className={`w-3.5 h-3.5 ${isRefundCompleted ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>{currentShipment.returnCarrierName || (currentShipment.returnCarrierSlug ? currentShipment.returnCarrierSlug.toUpperCase() : 'Pending Supplier Input')}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Reverse Tracking ID (AWB):</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-mono font-black text-slate-900 text-xs">
                          {currentShipment.returnAwbCode || 'Awaiting Courier Partner & ID'}
                        </p>
                        {currentShipment.returnAwbCode && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentShipment.returnAwbCode);
                              alert(`Reverse AWB "${currentShipment.returnAwbCode}" copied to clipboard!`);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                              isRefundCompleted ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title="Copy Reverse AWB"
                          >
                            Copy AWB
                          </button>
                        )}
                      </div>
                    </div>
                    {currentShipment.returnApprovedAt && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Carrier Assigned At:</span>
                        <p className="text-slate-700 text-[11px] font-medium mt-0.5">{new Date(currentShipment.returnApprovedAt).toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  {/* Auto-Booked Pickup Window & Rate Info */}
                  {(currentShipment.returnPickupWindow || currentShipment.returnShippingRate > 0 || currentShipment.returnAutoBooked) && (
                    <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl ${
                      isRefundCompleted ? 'border-emerald-100 bg-emerald-50/60' : 'border-amber-100 bg-amber-50/60'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold shrink-0 ${
                          isRefundCompleted ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-[11px] ${isRefundCompleted ? 'text-emerald-950' : 'text-amber-950'}`}>Auto-Booked at Lowest Rate</span>
                            {currentShipment.returnEstimatedSavings > 0 && (
                              <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
                                Saved ₹{currentShipment.returnEstimatedSavings}
                              </span>
                            )}
                          </div>
                          {currentShipment.returnPickupWindow && (
                            <p className="text-[10.5px] text-slate-700 flex items-center gap-1 mt-0.5">
                              <Clock className={`w-3 h-3 ${isRefundCompleted ? 'text-emerald-600' : 'text-amber-600'}`} />
                              <span>Pickup Window: <strong className="text-slate-900">{currentShipment.returnPickupWindow}</strong></span>
                            </p>
                          )}
                        </div>
                      </div>

                      {currentShipment.returnShippingRate > 0 && (
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Delivery Rate</span>
                          <span className={`text-xs font-black ${isRefundCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>₹{currentShipment.returnShippingRate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {currentShipment.returnStatus === 'Requested' && (
                  <div className="space-y-2 pt-1">
                    {!isSupplier && (
                      <button
                        onClick={handleCloseReturnRequest}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition border border-slate-300 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <XCircle className="w-4 h-4 text-slate-600" />
                        <span>Withdraw / Cancel Return Request</span>
                      </button>
                    )}

                    {isSupplier && (
                      currentShipment.returnType === 'partial_discount' ? (
                        currentShipment.discountAccepted === true ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Discount offer was accepted by buyer. Buyer keeps the product, so no return courier is needed.</span>
                          </div>
                        ) : currentShipment.discountAccepted === false ? (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Buyer rejected discount offer. Return converted to 100% full refund return. Approve reverse courier:</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={handleAutoApproveReturn}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Approve &amp; Auto-Book Cheapest Courier</span>
                              </button>
                              <button
                                onClick={handleOpenAssignModal}
                                disabled={actionLoading}
                                className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Truck className="w-4 h-4 text-slate-600" />
                                <span>Manual Partner</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 space-y-2">
                            <div className="flex items-center gap-2 font-black text-amber-900">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Reverse Courier Booking Locked — Awaiting Buyer Decision</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              In partial refund / defect discount requests, the buyer keeps the product if a discount is agreed upon. Reverse courier can only be booked if the buyer rejects your discount offer.
                            </p>
                            {(!currentShipment.discountOfferedAmount || Number(currentShipment.discountOfferedAmount) <= 0) ? (
                              <p className="text-[11px] font-bold text-amber-950 bg-amber-100/70 p-2 rounded-xl border border-amber-200">
                                👉 Please propose a discount amount in the Defect Discount section above to proceed.
                              </p>
                            ) : (
                              !isDiscount15hPassed ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-white p-2.5 rounded-xl border border-amber-200 font-bold">
                                  <span>Offer Sent: ₹{Number(currentShipment.discountOfferedAmount).toLocaleString('en-IN')}</span>
                                  <span className="text-amber-700 flex items-center gap-1 font-semibold">
                                    <Clock className="w-3.5 h-3.5" />
                                    Waiting for buyer response ({discountRemainingHours}h {discountRemainingMins}m left)
                                  </span>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-white rounded-xl border-2 border-emerald-300 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span>Offer Sent: ₹{Number(currentShipment.discountOfferedAmount).toLocaleString('en-IN')}</span>
                                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      15h Window Expired
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleSupplierAutoCompleteDiscount}
                                    disabled={actionLoading}
                                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                    <span>⚡ Auto-Complete Discount Refund</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleAutoApproveReturn}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 fill-current" />
                            <span>⚡ Approve &amp; Auto-Book Cheapest Courier</span>
                          </button>
                          <button
                            onClick={handleOpenAssignModal}
                            disabled={actionLoading}
                            className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Truck className="w-4 h-4 text-slate-600" />
                            <span>Manual Partner</span>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
                {/* Replacement & Return In-Transit Actions */}
                {currentShipment.returnType === 'replacement' ? (
                  isSupplier ? (
                    !currentShipment.replacementItemDispatched ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 fill-current" />
                          <div className="text-[11.5px] text-amber-900 leading-relaxed">
                            <span className="font-bold">⚡ Fast-Track Dispatch on Pickup Scan (Recommended):</span> Reverse courier has scanned or is picking up the defective item from the buyer. Dispatch the replacement parcel now to reduce customer waiting time from 10 days to 3 days. A fresh In-Box QR label will be generated for the replacement parcel.
                          </div>
                        </div>
                        <button
                          onClick={handleDispatchReplacement}
                          disabled={actionLoading}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>⚡ Fast-Track Dispatch Replacement (Pickup Scanned)</span>
                        </button>
                      </div>
                    ) : !currentShipment.replacementDelivered && currentShipment.returnStatus !== 'Completed' ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5">
                          <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-blue-900">Replacement Parcel In Transit to Buyer</div>
                            <div className="text-[11px] text-blue-700">
                              Tracking: <span className="font-mono font-bold">{currentShipment.replacementAwbCode}</span> via {currentShipment.replacementCarrierName} • Escrow unlocks when buyer scans QR &amp; verifies SMS OTP.
                            </div>
                          </div>
                        </div>

                        {/* REPLACEMENT IN-BOX QR LABEL CARD */}
                        {currentShipment.replacementQrToken && (() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
                          const repQrUrl = `${origin}/qr-confirm/${currentShipment.replacementQrToken}`;
                          return (
                            <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/90 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-violet-900 font-extrabold text-xs">
                                  <QrCode className="w-4 h-4 text-violet-700" />
                                  <span>Replacement In-Box QR Label</span>
                                </div>
                                <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full border border-violet-300">
                                  Mandatory In-Box
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                Stick this QR label <strong>inside the replacement box</strong>. When the buyer opens the parcel, they scan this QR to receive a 6-digit SMS OTP, confirming good condition and releasing your escrow payout.
                              </p>

                              <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-violet-300 rounded-2xl bg-white text-center">
                                <QRCodeSVG
                                  value={repQrUrl}
                                  size={140}
                                  level="H"
                                  includeMargin={false}
                                  fgColor="#1e1b4b"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-900">Scan to Verify Replacement Parcel</p>
                                  <p className="text-[10px] font-mono text-slate-400 break-all max-w-xs">{repQrUrl}</p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Replacement Label</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(repQrUrl);
                                    setQrCopied(true);
                                    setTimeout(() => setQrCopied(false), 2000);
                                  }}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {qrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{qrCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <a
                                  href={repQrUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Test</span>
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">Replacement Confirmed &amp; Complete!</div>
                          <div className="text-[11px] text-emerald-700">
                            Buyer verified parcel via In-Box QR &amp; SMS OTP. Escrow payout has been disbursed to your supplier wallet.
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    currentShipment.replacementItemDispatched && !currentShipment.replacementDelivered && currentShipment.returnStatus !== 'Completed' ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5">
                          <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-blue-900">Replacement Item Dispatched!</div>
                            <div className="text-[11px] text-blue-700">
                              Carrier: <span className="font-semibold">{currentShipment.replacementCarrierName}</span> • AWB: <span className="font-mono font-bold">{currentShipment.replacementAwbCode}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-violet-900 font-bold text-xs">
                            <QrCode className="w-4 h-4 text-violet-700" />
                            <span>In-Box QR Code &amp; SMS OTP Verification</span>
                          </div>
                          <p className="text-[11.5px] text-violet-800 leading-relaxed">
                            When your replacement box arrives, look for the <strong>In-Box QR Code</strong> inside. Scan it with your phone's camera, enter the 6-digit SMS OTP sent to your phone, and verify that the replacement is in perfect condition.
                          </p>
                          {currentShipment.replacementQrToken && (
                            <a
                              href={`/qr-confirm/${currentShipment.replacementQrToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open In-Box QR Verification Screen</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : !currentShipment.replacementItemDispatched && currentShipment.returnStatus !== 'Completed' ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
                        <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-900">
                          <span className="font-bold">Old Item Pickup in Progress:</span> Reverse courier is collecting the defective item. Seller will fast-track dispatch your new replacement upon pickup scan!
                        </div>
                      </div>
                    ) : null
                  )
                ) : (
                  isSupplier && currentShipment.returnStatus === 'In Return Transit' && (
                    <button
                      onClick={handleConfirmReturnReceived}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      Confirm Return Arrived (Refund Receiver Principal)
                    </button>
                  )
                )}
              </div>
            )}

            {/* Actions Bar */}
            {!showCancelForm && !showUndeliveredForm && !showReturnForm ? (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                {/* Confirm Parcel Button — ONLY FOR RECEIVER */}
                {!isSupplier ? (
                  currentShipment.status === 'Awaiting Payment' ? (
                    <button
                      type="button"
                      onClick={() => setShowCheckoutModal(true)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{Number(currentShipment.amount || 0).toLocaleString('en-IN')} Into Escrow Vault</span>
                    </button>
                  ) : currentShipment.status === 'Pending Pickup' ? (
                    <div className="flex-1 py-2.5 px-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
                      <Box className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Status: Awaiting Carrier Pickup</div>
                        <div className="text-[10.5px] text-slate-500">Your escrow payment is locked. Seller is preparing parcel for pickup.</div>
                      </div>
                    </div>
                  ) : currentShipment.status === 'Released' ? (
                    <div className="flex-1 py-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          {currentShipment.returnType === 'replacement'
                            ? 'Replacement Completed & Funds Released ✓'
                            : 'Delivery Confirmed & Funds Released'}
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          {currentShipment.returnType === 'replacement'
                            ? 'Replacement item received and escrow successfully released to seller.'
                            : 'Order successfully completed under SecureKaro Escrow.'}
                        </div>
                      </div>
                    </div>
                  ) : (currentShipment.status === 'Returned & Refunded' || currentShipment.returnStatus === 'Returned & Refunded' || currentShipment.returnStatus === 'Completed') ? (
                    <div className="flex-1 py-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          {currentShipment.returnType === 'replacement'
                            ? 'Replacement Order Completed ✓'
                            : 'Refund Completed ✓'}
                        </div>
                        <div className="text-[10.5px] text-emerald-700">
                          {currentShipment.returnType === 'replacement'
                            ? 'You confirmed receipt of the replacement item. Escrow payment was safely released to seller.'
                            : `100% Escrow amount (₹${Number(currentShipment.amount || 0).toLocaleString('en-IN')}) has been refunded to your wallet.`}
                        </div>
                      </div>
                    </div>
                  ) : currentShipment.deliveryConfirmed ? (
                    <div className="flex-1 min-w-[240px] py-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">Parcel Already Confirmed ✓</div>
                        <div className="text-[10.5px] text-emerald-700">
                          {currentShipment.returnWindowClosed || currentShipment.status === 'Released'
                            ? 'Return window closed & escrow released to supplier.'
                            : '24-hour return window is currently active.'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowConfirmChoiceModal(true)}
                        disabled={actionLoading || ['Released', 'Cancelled', 'Undelivered', 'Returned & Refunded'].includes(currentShipment.status)}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {currentShipment.status === 'Delivered' 
                            ? 'Confirm Parcel' 
                            : 'Confirm Delivery'}
                        </span>
                      </button>
                      {!['Released', 'Cancelled', 'Undelivered', 'Returned & Refunded'].includes(currentShipment.status) && (
                        <button
                          onClick={() => setShowQrScannerModal(true)}
                          className="py-3 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 shrink-0 group hover:scale-[1.02] active:scale-[0.98]"
                          title="Scan the QR slip inside the package"
                        >
                          <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Scan In-Box QR</span>
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="flex-1 py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
                    {currentShipment.status === 'Released' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">Escrow Funds Released</div>
                          <div className="text-[10.5px] text-slate-500">Payment has been credited to your supplier wallet.</div>
                        </div>
                      </>
                    ) : (currentShipment.status === 'Returned & Refunded' || currentShipment.returnStatus === 'Returned & Refunded' || currentShipment.returnStatus === 'Completed') ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">
                            {currentShipment.returnType === 'replacement'
                              ? 'Replacement Completed & Funds Released ✓'
                              : 'Return & Refund Completed'}
                          </div>
                          <div className="text-[10.5px] text-slate-500">
                            {currentShipment.returnType === 'replacement'
                              ? 'Buyer confirmed receipt of the replacement item. Escrow payment credited to your wallet.'
                              : 'Parcel returned and escrow funds refunded to receiver.'}
                          </div>
                        </div>
                      </>
                    ) : currentShipment.status === 'Replacement In Transit' ? (
                      <>
                        <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Replacement Parcel in Transit</div>
                          <div className="text-[10.5px] text-slate-500">
                            Tracking: {currentShipment.replacementAwbCode} via {currentShipment.replacementCarrierName}. Escrow releases once buyer confirms delivery.
                          </div>
                        </div>
                      </>
                    ) : currentShipment.status === 'Delivered' ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Delivered — Awaiting Receiver Confirmation</div>
                          <div className="text-[10.5px] text-slate-500">
                            Receiver ({currentShipment.receiverName || 'Buyer'}) confirms delivery to release funds, or window auto-closes after 24h.
                          </div>
                        </div>
                      </>
                    ) : currentShipment.status === 'Awaiting Payment' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Status: Awaiting Escrow Payment</div>
                          <div className="text-[10.5px] text-slate-500">
                            Waiting for {currentShipment.receiverName || 'buyer'} to complete payment via escrow link.
                          </div>
                        </div>
                      </>
                    ) : currentShipment.status === 'Pending Pickup' ? (
                      <>
                        <Box className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Status: Pending Carrier Pickup</div>
                          <div className="text-[10.5px] text-slate-500">
                            Escrow payment secured. Auto-scheduled carrier pickup pending.
                          </div>
                        </div>
                      </>
                    ) : (currentShipment.status === 'Return Requested' || currentShipment.status === 'Return In Transit') ? (
                      <>
                        <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Status: {currentShipment.status}</div>
                          <div className="text-[10.5px] text-slate-500">
                            Buyer requested return. Assign reverse courier or offer discount.
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-[#1E56E3] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Status: {currentShipment.status}</div>
                          <div className="text-[10.5px] text-slate-500">Parcel in transit to {currentShipment.receiverName || 'receiver'}.</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Receiver Close Return Window Button: ONLY active when delivered AND no return request has been filed */}
                {!isSupplier && currentShipment.deliveryConfirmed && !currentShipment.returnWindowClosed && currentShipment.status !== 'Released' && !isReturnAlreadyApplied && (
                  <button
                    onClick={handleCloseReturnWindow}
                    disabled={actionLoading}
                    className="py-2.5 px-3 bg-blue-50 text-[#1E56E3] border border-blue-200 hover:bg-blue-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                    title="Close return window early & release funds to seller"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1E56E3]" />
                    <span>Close Return Window</span>
                  </button>
                )}

                {/* Supplier Direct Partial Refund / Discount Trigger — ONLY when buyer has applied for a return */}
                {isSupplier && isReturnAlreadyApplied && !['Cancelled', 'Returned & Refunded', 'Released'].includes(currentShipment.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierDiscountInput(String(currentShipment.discountOfferedAmount || ''));
                      setShowSupplierPartialRefundModal(true);
                    }}
                    disabled={actionLoading}
                    className="py-3 px-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Offer discount or issue partial refund to buyer to resolve return"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Partial Refund / Discount</span>
                  </button>
                )}

                {!isSupplier && isReturnable && !isReturnAlreadyApplied && (
                  <button
                    onClick={() => setShowReturnForm(true)}
                    disabled={actionLoading || ['Return Requested', 'Return In Transit', 'Returned & Refunded'].includes(currentShipment.status)}
                    className="py-3 px-3 bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Request Return</span>
                  </button>
                )}

                {!isSupplier && isUndeliverable && (
                  <button
                    onClick={() => setShowUndeliveredForm(true)}
                    disabled={actionLoading || ['Undelivered', 'Released'].includes(currentShipment.status)}
                    className="py-3 px-3 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Undelivered</span>
                  </button>
                )}

                {isCancellable && (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    disabled={actionLoading}
                    className="py-3 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            ) : showReturnForm ? (
              <form onSubmit={handleRequestReturn} className="pt-4 border-t border-slate-100 space-y-4 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Select Return & Resolution Path
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    3 Options Available
                  </span>
                </div>

                {/* Fair-Play Warning banner shown when RTO Protection is active */}
                {currentShipment.rtoProtectionEnabled && (
                  <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Fair-Play Policy: Parcel Rejection Notice</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You receive <strong>100% full refund on up to 2 rejected parcels per week</strong> (SecureKaro compensates seller ₹40). 
                      Starting from your <strong>3rd rejection this week</strong>, a <strong>₹40 fair-play fee</strong> is charged from your refund (<strong>₹30 goes to seller's wallet</strong>, ₹10 to SecureKaro).
                    </p>
                  </div>
                )}

                {/* 3 Option Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnTypeChoice('replacement')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      returnTypeChoice === 'replacement'
                        ? 'bg-blue-50 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-blue-700 font-bold text-xs">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>1. Replacement</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Supplier sends fresh replacement parcel. If rejected, 100% full refund auto-issued.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnTypeChoice('partial_discount')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      returnTypeChoice === 'partial_discount'
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-700 font-bold text-xs">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>2. Defect Discount</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Upload defect photo. Seller offers discount. If agreed, keep item + cash. If not, 100% refund.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnTypeChoice('full_refund')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      returnTypeChoice === 'full_refund'
                        ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-amber-800 font-bold text-xs">
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>3. Full Refund</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Ship back via reverse courier. Full 100% escrow principal refunded.
                    </p>
                  </button>
                </div>

                {/* Mandatory Photo Proof & Defect Description Fields */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Package / Defect Evidence Photo URL <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Mandatory for all returns
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or paste photo link"
                      value={defectPhotoUrl}
                      onChange={(e) => setDefectPhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setDefectPhotoUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop')}
                      className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-xl text-[10px] font-bold shrink-0"
                    >
                      Sample Photo
                    </button>
                  </div>

                  {defectPhotoUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 max-h-32 bg-slate-100">
                      <img src={defectPhotoUrl} alt="Defect preview" className="w-full h-28 object-cover" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Describe the Defect / Package Condition
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Explain the damage, defect, or package condition for seller and courier verification..."
                      value={defectDescription}
                      onChange={(e) => setDefectDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Return Reason Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for Return</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Defective / Damaged product received">Defective / Damaged product received</option>
                    <option value="Wrong item / size delivered">Wrong item / size delivered</option>
                    <option value="Product not as described">Product not as described</option>
                    <option value="Buyer change of mind / cancel order">Buyer change of mind / cancel order</option>
                  </select>
                </div>

                {/* Mandatory Refund Bank Details Form (When full_refund is selected) */}
                {returnTypeChoice === 'full_refund' && (
                  <div className="space-y-2.5 pt-1">
                    {Boolean((user?.bankDetails?.accountNumber && user.bankDetails.accountNumber.trim().length >= 6) || (user?.bankDetails?.upiId && user.bankDetails.upiId.trim().includes('@'))) && !isEditingRefundBank ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold">Refund Payout Destination: </span>
                            <span className="font-mono text-emerald-800">
                              {user.bankDetails?.accountNumber
                                ? `${user.bankDetails.bankName || 'Bank'} A/C ending in ••••${user.bankDetails.accountNumber.slice(-4)}`
                                : `UPI: ${user.bankDetails?.upiId}`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingRefundBank(true)}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-white border-2 border-amber-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                            <Building className="w-4 h-4 text-amber-600" />
                            <span>Refund Payout Details (Mandatory)</span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Required to Receive Funds
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Escrow funds will be transferred directly to this account once your return is approved.
                        </p>

                        {/* Payout method toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRefundBankDetails(p => ({ ...p, payoutMethod: 'bank' }))}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              refundBankDetails.payoutMethod === 'bank'
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            Bank Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundBankDetails(p => ({ ...p, payoutMethod: 'upi' }))}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              refundBankDetails.payoutMethod === 'upi'
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            UPI ID
                          </button>
                        </div>

                        {refundBankDetails.payoutMethod === 'bank' ? (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Account Holder Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="Full Name as per bank passbook"
                                value={refundBankDetails.accountHolderName}
                                onChange={(e) => setRefundBankDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Bank Account Number *</label>
                                <input
                                  type="password"
                                  required
                                  placeholder="Enter Account Number"
                                  value={refundBankDetails.accountNumber}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Confirm Account Number *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Re-enter to confirm"
                                  value={refundBankDetails.confirmAccountNumber}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, confirmAccountNumber: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">IFSC Code *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. HDFC0001234"
                                  value={refundBankDetails.ifscCode}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Bank Name (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. HDFC Bank"
                                  value={refundBankDetails.bankName}
                                  onChange={(e) => setRefundBankDetails(p => ({ ...p, bankName: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">UPI ID *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                              value={refundBankDetails.upiId}
                              onChange={(e) => setRefundBankDetails(p => ({ ...p, upiId: e.target.value }))}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`py-2.5 px-4 text-white font-bold text-xs rounded-xl flex-1 shadow-md transition ${
                      returnTypeChoice === 'replacement'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : returnTypeChoice === 'partial_discount'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {returnTypeChoice === 'replacement' && 'Request Instant Replacement'}
                    {returnTypeChoice === 'partial_discount' && 'Submit Defect & Request Discount'}
                    {returnTypeChoice === 'full_refund' && 'Request Full Refund & Reverse AWB'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReturnForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : showUndeliveredForm ? (
              <form onSubmit={handleReportUndelivered} className="pt-4 border-t border-slate-100 space-y-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Undelivered Courier Refund (Principal Refund)
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    100% Principal Refund
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                  <p className="text-slate-600">
                    If marked undelivered, escrow principal (₹{currentShipment.amount?.toLocaleString() || '3,420'}) will be refunded to the receiver.
                  </p>
                  {currentShipment.rtoProtectionEnabled ? (
                    <div className="mt-2 pt-2 border-t border-amber-100 space-y-1.5">
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-800 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>RTO Protection Active.</strong> SecureKaro compensates seller ₹40 (if buyer's 1st or 2nd rejection this week). Buyer gets full refund.</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>From buyer's 3rd rejection/week: ₹40 fair-play fee charged (₹30 to seller, ₹10 to SecureKaro).</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Standard undelivered processing (RTO protection not enabled on this parcel).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Carrier Undelivered Reason</label>
                  <select
                    value={undeliveredReason}
                    onChange={(e) => setUndeliveredReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Courier delivery attempt failed / returned to origin">Courier delivery attempt failed / returned to origin</option>
                    <option value="Package lost / damaged by carrier">Package lost / damaged by carrier partner</option>
                    <option value="Address unreachable / recipient uncontactable">Address unreachable / recipient uncontactable</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 flex-1 shadow-md"
                  >
                    Confirm Undelivered Refund to Receiver
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUndeliveredForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : showCancelForm ? (
              <form onSubmit={handleCancelShipment} className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Cancel Shipment & Refund Escrow
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Order cancelled by mutual agreement">Order cancelled by mutual agreement</option>
                    <option value="Incorrect shipment details entered">Incorrect shipment details entered</option>
                    <option value="Item out of stock / unavailable">Item out of stock / unavailable</option>
                    <option value="Buyer requested cancellation">Buyer requested cancellation</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 flex-1"
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(false)}
                    className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        )}
      </div>

      <PaymentCheckoutModal
        shipmentId={currentShipment.shipmentId}
        amount={currentShipment.amount || 3420}
        receiverName={currentShipment.receiverName || 'Kartick Das'}
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onPaymentSuccess={() => {
          onRefresh();
          fetchFullDetails();
        }}
      />

      {/* 2-OPTION CONFIRMATION MODAL */}
      {showConfirmChoiceModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Confirm Parcel Delivery</h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">{currentShipment.shipmentId} • ₹{currentShipment.amount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmChoiceModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(currentShipment.deliveryConfirmed || currentShipment.status === 'Released') ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Parcel already confirmed! Delivery for this parcel was already confirmed. {currentShipment.returnWindowClosed || currentShipment.status === 'Released' ? 'Return window is closed and escrow funds released.' : '24-hour return window is currently active.'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Please select your preferred return window option to confirm receipt of your parcel:
              </p>
            )}

            <div className="space-y-3">
              {/* Option 1: Confirm and close the Return window */}
              <button
                type="button"
                onClick={() => handleConfirmChoice('confirm_and_close')}
                disabled={actionLoading || currentShipment.deliveryConfirmed || currentShipment.status === 'Released'}
                className={`w-full text-left p-4 rounded-2xl border-2 transition group relative ${
                  currentShipment.deliveryConfirmed || currentShipment.status === 'Released'
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span>confirm and close the Return window</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Confirm delivery and close the return window immediately. Escrow funds will be released to the supplier right away.
                    </p>
                  </div>
                  <span className="shrink-0 p-1 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
              </button>

              {/* Option 2: Confirm without closing Return window */}
              <button
                type="button"
                onClick={() => currentShipment.returnAllowed !== false && handleConfirmChoice('keep_open_24h')}
                disabled={actionLoading || currentShipment.returnAllowed === false || currentShipment.deliveryConfirmed || currentShipment.status === 'Released'}
                className={`w-full text-left p-4 rounded-2xl border-2 transition group relative ${
                  currentShipment.deliveryConfirmed || currentShipment.status === 'Released'
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : currentShipment.returnAllowed === false
                    ? 'border-slate-200 bg-slate-100/80 cursor-not-allowed opacity-60'
                    : 'border-blue-200 bg-blue-50/40 hover:border-[#1E56E3] hover:bg-blue-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#1E56E3] flex items-center gap-1.5">
                        <span>Confirm without closing Return window</span>
                      </h4>
                      {currentShipment.returnAllowed === false ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Returns Disabled by Seller
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          24h Protection
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {currentShipment.returnAllowed === false
                        ? 'The seller has not enabled product returns for this parcel. You can only confirm and close the return window (Option 1).'
                        : 'Confirm delivery while keeping your return window open for 24 hours. The return window will close after 24 hours automatically, and you can also close your return request or window anytime.'}
                    </p>
                  </div>
                  <span className={`shrink-0 p-1 rounded-lg ${currentShipment.returnAllowed === false ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-[#1E56E3] group-hover:bg-[#1E56E3] group-hover:text-white transition'}`}>
                    {currentShipment.returnAllowed === false ? <Lock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmChoiceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN REVERSE COURIER PARTNER & TRACKING ID MODAL (SUPPLIER) */}
      {showAssignCourierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAssignCourierModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Put Carrier Service Partner &amp; ID</h3>
                <p className="text-xs text-slate-500">Order #{currentShipment.shipmentId} • Buyer: {currentShipment.receiverName}</p>
              </div>
            </div>

            {/* Return Request Summary */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-amber-900">Return Reason:</span>
                <span className="text-amber-800 font-semibold">{currentShipment.returnReason || 'Defective / Damaged product'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-amber-900">Escrow Value:</span>
                <span className="text-amber-900 font-mono font-bold">₹{currentShipment.amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-amber-900">Buyer Phone:</span>
                <span className="text-amber-800 font-mono">{currentShipment.receiverPhone}</span>
              </div>
            </div>

            {/* 1-Click Auto-Book Cheapest Courier Option */}
            <div className="p-3 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-950">
                  Prefer auto-selecting the lowest courier rate?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssignCourierModal(false);
                  handleAutoApproveReturn();
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition shrink-0 flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Auto-Book Cheapest</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAssignCourier} className="space-y-4">
              {/* Carrier Service Partner Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Service Partner</label>
                <select
                  value={returnCarrierSlug}
                  onChange={(e) => handleCarrierChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
                >
                  <option value="delhivery">Delhivery Express</option>
                  <option value="bluedart">BlueDart Logistics</option>
                  <option value="dtdc">DTDC Express</option>
                  <option value="ekart">Ekart Logistics</option>
                  <option value="shadowfax">Shadowfax</option>
                  <option value="indiapost">India Post Speed Post</option>
                  <option value="other">Other / Custom Courier</option>
                </select>
              </div>

              {/* Carrier Partner Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhivery Express"
                  value={returnCarrierName}
                  onChange={(e) => setReturnCarrierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                />
              </div>

              {/* Reverse Tracking ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Reverse Tracking ID / AWB Code</label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = returnCarrierSlug.toUpperCase().substring(0, 3);
                      setReturnTrackingId(`REV-${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
                    }}
                    className="text-[10px] text-amber-700 hover:underline font-bold"
                  >
                    Generate New ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. REV-DEL-84920412"
                  value={returnTrackingId}
                  onChange={(e) => setReturnTrackingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Reverse Pickup Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Instructions / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Keep original packaging and tags intact"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <Send className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  After putting carrier details, the <strong>buyer will be instantly notified</strong> via In-App Notification and SMS with the carrier partner name and reverse tracking ID.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignCourierModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-600/20 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>{actionLoading ? 'Saving & Notifying...' : 'Save & Notify Buyer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX FULL PHOTO VIEW MODAL ── */}
      {previewPhotoModal.isOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewPhotoModal({ isOpen: false, url: '', title: '' })}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs truncate max-w-md">{previewPhotoModal.title || 'Full Photo View'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal({ isOpen: false, url: '', title: '' })}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[300px]">
              <img
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title || 'Full Evidence View'}
                className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLIER DIRECT PARTIAL REFUND / DISCOUNT MODAL ── */}
      {showSupplierPartialRefundModal && (
        <div 
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowSupplierPartialRefundModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupplierPartialRefundModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Defect Discount / Partial Refund</h3>
                <p className="text-[11px] text-slate-500">Order #{currentShipment.shipmentId} • Total: ₹{currentShipment.amount} ({currentShipment.paymentMode?.toUpperCase() || 'PREPAID'})</p>
              </div>
            </div>

            <form onSubmit={handleOfferDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount Amount to Refund to Buyer (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, (Number(currentShipment.amount) || 1) - 1)}
                    placeholder="Enter discount amount (e.g. 150)"
                    value={supplierDiscountInput}
                    onChange={(e) => setSupplierDiscountInput(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick Percent Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-500 font-semibold">Quick pick:</span>
                {[10, 20, 30, 50].map((pct) => {
                  const val = Math.round(((Number(currentShipment.amount) || 0) * pct) / 100);
                  if (val <= 0 || val >= (Number(currentShipment.amount) || 0)) return null;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSupplierDiscountInput(String(val))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 border border-slate-200 text-slate-800 rounded-lg font-bold transition cursor-pointer"
                    >
                      {pct}% (₹{val})
                    </button>
                  );
                })}
              </div>

              {supplierDiscountInput && Number(supplierDiscountInput) > 0 && Number(supplierDiscountInput) < Number(currentShipment.amount) && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Buyer gets refunded into wallet:</span>
                    <span className="text-amber-700">₹{Number(supplierDiscountInput)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Adjusted order net value:</span>
                    <span>₹{(Number(currentShipment.amount) || 0) - Number(supplierDiscountInput)}</span>
                  </div>
                </div>
              )}

              {Number(currentShipment.discountOfferedAmount) > 0 && currentShipment.discountAccepted !== true && currentShipment.discountAccepted !== false && (
                !isDiscount15hPassed ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        Offer ₹{currentShipment.discountOfferedAmount} Pending
                      </span>
                      <span className="font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded-md">
                        {discountRemainingHours}h {discountRemainingMins}m left
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Buyer has a 15-hour window to accept or reject. Instant auto-completion unlocks only after 15h of buyer inactivity.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        15h Buyer Window Expired
                      </span>
                      <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Ready to Settle
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleSupplierAutoCompleteDiscount();
                        setShowSupplierPartialRefundModal(false);
                      }}
                      disabled={actionLoading}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>⚡ Auto-Complete Discount Refund (₹{currentShipment.discountOfferedAmount})</span>
                    </button>
                  </div>
                )
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading || !supplierDiscountInput || Number(supplierDiscountInput) <= 0 || Number(supplierDiscountInput) >= Number(currentShipment.amount)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>Send Offer to Buyer (15h Response Window)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IN-BOX QR SCANNER MODAL ── */}
      <QrScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onScanSuccess={handleQrScanSuccessInModal}
      />

      {/* ── LIVE CAMERA VIEWFINDER MODAL ── */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        title="Take Parcel / Product Photo"
        subtitle="Position your parcel clearly in the frame and snap a photo"
        onClose={() => setShowCameraModal(false)}
        onCapture={async (file) => {
          setUploadingPhoto(true);
          setUploadingParcelPhoto(true);
          setDispatchErr('');
          setPhotoUploadErr('');
          try {
            const { url, isHosted } = await uploadImageToHost(file, `parcel-${currentShipment.shipmentId}`);
            if (url) {
              setDispatchPhotoUrl(url);
              await handleUploadParcelPhoto(url);
              if (!isHosted) {
                setDispatchErr('⚠️ Photo uploaded (in-session only). For permanent storage, paste a hosted image URL instead.');
              }
            } else {
              setDispatchErr('Photo upload failed. Please paste a direct image URL instead.');
              setPhotoUploadErr('Photo upload failed. Please paste a direct image URL instead.');
            }
          } catch (err) {
            setDispatchErr('Photo upload failed. Please try again.');
            setPhotoUploadErr('Photo upload failed. Please try again.');
          } finally {
            setUploadingPhoto(false);
            setUploadingParcelPhoto(false);
          }
        }}
      />
    </div>
  );
}
