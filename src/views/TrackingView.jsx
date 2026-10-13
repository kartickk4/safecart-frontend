import React, { useState, useEffect } from 'react';
import { Search, Navigation, Truck, MapPin, CheckCircle2, Clock, ShieldCheck, RefreshCw, ExternalLink, Lock, Send, Package, ArrowRight, Radio, Crown, Sparkles, Camera, AlertTriangle, Eye, RotateCcw, Tag, Copy, Check, XCircle, CreditCard, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { shipmentAPI } from '../services/api';
import { uploadImageToHost } from '../services/imageUpload';
import { analyzeImageClarity } from '../utils/imageClarity';
import CameraCaptureModal from '../components/CameraCaptureModal';

export default function TrackingView({ onSelectShipment, user, selectedShipment }) {
  // Derive current user IDs
  const currentUserId = user?._id || user?.id;
  const currentUserPhone = user?.phone;

  // isSupplier based on role only — but receiver identity overrides this below
  const isSupplierRole = user?.role === 'Supplier' || user?.activeRole === 'Supplier' ||
    user?.role?.toLowerCase() === 'supplier' || user?.activeRole?.toLowerCase() === 'supplier';

  const [searchId, setSearchId] = useState(selectedShipment?.shipmentId || selectedShipment?.awbCode || '');
  const [activeTab, setActiveTab] = useState('escrow'); // 'escrow' | 'carrier' | 'return'
  const [loading, setLoading] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date());
  const [trackingResult, setTrackingResult] = useState(null);
  const [copiedReturnAwb, setCopiedReturnAwb] = useState(false);

  const cleanUserPhone = (currentUserPhone || '').replace(/\D/g, '').slice(-10);
  const cleanSenderPhone = (trackingResult?.senderPhone || '').replace(/\D/g, '').slice(-10);
  const cleanReceiverPhone = (trackingResult?.receiverPhone || '').replace(/\D/g, '').slice(-10);

  const isCurrentUserSender = Boolean(
    (currentUserId && trackingResult?.senderId && (String(currentUserId) === String(trackingResult.senderId?._id || trackingResult.senderId))) ||
    (cleanUserPhone && cleanSenderPhone && cleanUserPhone === cleanSenderPhone)
  );

  const isPhoneMatch = Boolean(cleanUserPhone && cleanReceiverPhone && cleanUserPhone === cleanReceiverPhone);
  const isActualRecipient = Boolean(
    isPhoneMatch ||
    (currentUserId && trackingResult?.receiverId && (
      String(currentUserId) === String(trackingResult.receiverId?._id || trackingResult.receiverId)
    )) ||
    user?.role === 'Admin'
  );

  const isExplicitReceiver = user?.activeRole === 'Receiver' || user?.activeRole?.toLowerCase() === 'receiver';

  // If user explicitly switched to Receiver role in the app, prioritize Receiver view for dual-role testing
  const isCurrentUserReceiver = isExplicitReceiver || (!isCurrentUserSender && Boolean(
    isPhoneMatch ||
    (currentUserId && trackingResult?.receiverId && (
      String(currentUserId) === String(trackingResult.receiverId?._id || trackingResult.receiverId)
    ))
  ));

  // If user explicitly switched to Receiver, show Receiver view; otherwise sender is seller
  const isSupplier = !isExplicitReceiver && (isCurrentUserSender || (!isCurrentUserReceiver && isSupplierRole));
  const isSellerView = isSupplier;

  const isReturnAlreadyApplied = Boolean(
    trackingResult &&
    (
      trackingResult.status === 'Return Requested' ||
      trackingResult.returnRequested === true ||
      trackingResult.returnStatus === 'Requested' ||
      trackingResult.returnStatus === 'Approved' ||
      trackingResult.status === 'Return In Transit' ||
      trackingResult.status === 'Returned & Refunded' ||
      trackingResult.status === 'Returned & Restocked'
    )
  );

  const isRefundCompleted = Boolean(
    trackingResult &&
    (
      trackingResult.status === 'Returned & Refunded' ||
      trackingResult.returnStatus === 'Returned & Refunded' ||
      trackingResult.returnStatus === 'Completed' ||
      trackingResult.status === 'Returned & Restocked'
    )
  );

  const isReturnable = Boolean(
    trackingResult &&
    !isReturnAlreadyApplied &&
    trackingResult.returnAllowed !== false &&
    !['Released', 'Cancelled', 'Returned & Refunded', 'Return Requested', 'Return In Transit', 'Returned & Restocked'].includes(trackingResult.status) &&
    !trackingResult.returnWindowClosed &&
    (
      ['Delivered', 'Confirmed'].includes(trackingResult.status) ||
      Boolean(trackingResult.deliveryConfirmed)
    )
  );

  // Return form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnTypeChoice, setReturnTypeChoice] = useState('full_refund');
  const [returnReason, setReturnReason] = useState('');
  const [defectPhoto, setDefectPhoto] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnMsg, setReturnMsg] = useState('');
  const [returnErr, setReturnErr] = useState('');
  const [uploadingDefectPhoto, setUploadingDefectPhoto] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState({ isOpen: false, url: '', title: '' });
  const [cameraModal, setCameraModal] = useState({ isOpen: false, type: 'parcel', title: '', subtitle: '' });
  const [sellerDiscountInput, setSellerDiscountInput] = useState('');
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountActionLoading, setDiscountActionLoading] = useState(false);

  // Dispatch Courier form state inside Transaction Escrow stage 4
  const [selectedCourier, setSelectedCourier] = useState('delhivery');
  const [courierAwb, setCourierAwb] = useState('');
  const [parcelPhoto, setParcelPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoClarityScore, setPhotoClarityScore] = useState(null);
  const [isPhotoClear, setIsPhotoClear] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [isEditingCourier, setIsEditingCourier] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic Escrow Stepper State
  const isDelivered = Boolean(
    trackingResult?.deliveryConfirmed ||
    trackingResult?.status === 'Delivered' ||
    trackingResult?.status === 'Confirmed' ||
    trackingResult?.status === 'Released' ||
    Number(trackingResult?.escrowStage) >= 5 ||
    trackingResult?.status?.includes('Return') ||
    (trackingResult?.returnStatus && trackingResult?.returnStatus !== 'None') ||
    trackingResult?.returnRequested === true ||
    Boolean(trackingResult?.returnRequestedAt) ||
    Number(trackingResult?.discountOfferedAmount) > 0 ||
    Boolean(trackingResult?.defectPhotoUrl)
  );
  const isDispatched = isDelivered || dispatched || Boolean(trackingResult?.trackingSubmitted) || (Boolean(trackingResult?.awbCode) && trackingResult?.awbCode !== 'N/A' && trackingResult?.status !== 'Awaiting Payment' && trackingResult?.status !== 'Pending Dispatch' && trackingResult?.status !== 'Awaiting Courier Dispatch');
  const isPhotoUploaded = Boolean(trackingResult?.parcelPhotoUrl && trackingResult.parcelPhotoUrl.trim());
  const isReleased = Boolean(
    trackingResult?.status === 'Released' ||
    Number(trackingResult?.escrowStage) >= 6 ||
    trackingResult?.discountAccepted === true
  );

  // 10-Minute Parcel Photo Retake Window State & Timer
  const [photoUploadedAt, setPhotoUploadedAt] = useState(null);
  const [retakeSecondsLeft, setRetakeSecondsLeft] = useState(null);

  useEffect(() => {
    const effectiveUploadTime = photoUploadedAt || (trackingResult?.parcelPhotoUploadedAt ? new Date(trackingResult.parcelPhotoUploadedAt) : null);
    if (!effectiveUploadTime) {
      setRetakeSecondsLeft(null);
      return;
    }

    const calcRemaining = () => {
      const elapsed = Date.now() - new Date(effectiveUploadTime).getTime();
      const remaining = 10 * 60 * 1000 - elapsed;
      if (remaining <= 0) {
        setRetakeSecondsLeft(0);
      } else {
        setRetakeSecondsLeft(Math.ceil(remaining / 1000));
      }
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [photoUploadedAt, trackingResult?.parcelPhotoUploadedAt]);

  const isRetakeExpired = Boolean(
    (photoUploadedAt || trackingResult?.parcelPhotoUploadedAt) && retakeSecondsLeft === 0
  );
  const retakeMin = retakeSecondsLeft !== null ? Math.floor(retakeSecondsLeft / 60) : 0;
  const retakeSec = retakeSecondsLeft !== null ? retakeSecondsLeft % 60 : 0;
  const formattedRetakeRemaining = `${retakeMin}m ${retakeSec < 10 ? '0' : ''}${retakeSec}s`;

  // Real-time backend sync function
  const fetchTrackingData = async (targetId, silent = false) => {
    const idToQuery = (targetId || searchId || '').trim();
    if (!idToQuery) return;
    if (!silent) setLoading(true);
    setErrorMsg('');

    try {
      let res;
      try {
        res = await shipmentAPI.getShipmentById(idToQuery);
      } catch (e1) {
        res = await shipmentAPI.getTrackingByAwb(idToQuery);
      }

      if (res && res.data) {
        const ship = res.data.shipment || res.data;
        if (ship && (ship.shipmentId || ship.status || res.data.awb)) {
          const journey = res.data.journey || [];
          const milestones = Array.isArray(journey) ? journey : (journey.milestones || []);

          setTrackingResult(prev => ({
            ...prev,
            ...ship,
            shipmentId: ship.shipmentId || idToQuery,
            senderId: ship.senderId || prev?.senderId,
            senderPhone: ship.senderPhone || prev?.senderPhone || '',
            receiverId: ship.receiverId || prev?.receiverId || null,
            receiverName: ship.receiverName || prev?.receiverName || 'Recipient',
            receiverPhone: ship.receiverPhone || prev?.receiverPhone || '',
            route: ship.city || prev?.route || 'Origin → Destination',
            carrier: ship.carrierSlug || prev?.carrier || 'delhivery',
            awbCode: ship.awbCode || res.data.awb || prev?.awbCode || '',
            amount: ship.amount || prev?.amount || 0,
            status: ship.status || res.data.status || prev?.status || 'In Transit',
            deliveryConfirmed: ship.deliveryConfirmed ?? prev?.deliveryConfirmed ?? false,
            deliveryConfirmedAt: ship.deliveryConfirmedAt ?? prev?.deliveryConfirmedAt,
            photoReviewEnabled: ship.photoReviewEnabled ?? prev?.photoReviewEnabled,
            photoReviewRequested: ship.photoReviewRequested ?? prev?.photoReviewRequested,
            photoReviewPaid: ship.photoReviewPaid ?? prev?.photoReviewPaid,
            photoReviewRefused: ship.photoReviewRefused ?? prev?.photoReviewRefused,
            parcelPhotoUrl: ship.parcelPhotoUrl || prev?.parcelPhotoUrl || '',
            parcelPhotoUploadedAt: ship.parcelPhotoUploadedAt || prev?.parcelPhotoUploadedAt,
            trackingSubmitted: ship.trackingSubmitted ?? prev?.trackingSubmitted,
            escrowStage: ship.escrowStage ?? prev?.escrowStage,
            returnStatus: ship.returnStatus || prev?.returnStatus,
            returnReason: ship.returnReason || prev?.returnReason,
            returnCarrierName: ship.returnCarrierName || prev?.returnCarrierName,
            returnCarrierSlug: ship.returnCarrierSlug || prev?.returnCarrierSlug,
            returnAwbCode: ship.returnAwbCode || prev?.returnAwbCode,
            returnApprovedAt: ship.returnApprovedAt || prev?.returnApprovedAt,
            returnRequestedAt: ship.returnRequestedAt || prev?.returnRequestedAt,
            returnType: ship.returnType || (Number(ship.discountOfferedAmount) > 0 ? 'partial_discount' : prev?.returnType) || 'full_refund',
            defectPhotoUrl: ship.defectPhotoUrl || prev?.defectPhotoUrl,
            defectDescription: ship.defectDescription || prev?.defectDescription,
            replacementApproved: ship.replacementApproved ?? prev?.replacementApproved,
            replacementCarrierName: ship.replacementCarrierName || prev?.replacementCarrierName,
            replacementAwbCode: ship.replacementAwbCode || prev?.replacementAwbCode,
            discountOfferedAmount: Number(ship.discountOfferedAmount ?? prev?.discountOfferedAmount ?? 0),
            discountAccepted: ship.discountAccepted !== undefined ? ship.discountAccepted : (prev?.discountAccepted !== undefined ? prev.discountAccepted : null),
            discountBuyerWalletCredited: ship.discountBuyerWalletCredited ?? prev?.discountBuyerWalletCredited ?? 0,
            discountSupplierWalletCredited: ship.discountSupplierWalletCredited ?? prev?.discountSupplierWalletCredited ?? 0,
            partialRefundStatus: ship.partialRefundStatus || prev?.partialRefundStatus || 'None',
            milestones: milestones.length > 0 ? milestones : (prev?.milestones || [
              { status: ship.status || 'Active', location: ship.city || 'Sorting Hub', detail: 'Shipment active in escrow ledger.', time: new Date() }
            ])
          }));

          if (ship.parcelPhotoUrl) {
            setParcelPhoto(ship.parcelPhotoUrl);
            setIsPhotoClear(true);
            if (ship.parcelPhotoUploadedAt) {
              setPhotoUploadedAt(new Date(ship.parcelPhotoUploadedAt));
            }
          }
          if (ship.awbCode && ship.awbCode !== 'N/A') {
            setCourierAwb(ship.awbCode);
          } else {
            setCourierAwb('');
          }
          if (ship.carrierSlug) {
            setSelectedCourier(ship.carrierSlug);
          }
          if (ship.trackingSubmitted || (ship.awbCode && ship.awbCode !== 'N/A') || ['In Transit', 'Delivered', 'Confirmed', 'Released'].includes(ship.status)) {
            setDispatched(true);
          }
          setLastSyncedTime(new Date());
        }
      }
    } catch (err) {
      if (!silent) {
        console.error('Tracking query error:', err);
        setErrorMsg(err.response?.data?.error || `No tracking information found for "${idToQuery}". Please check the Shipment ID or AWB code.`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Update tracking if an external selectedShipment prop changes to a new valid ID
  useEffect(() => {
    if (selectedShipment?.shipmentId || selectedShipment?.awbCode) {
      const id = (selectedShipment.shipmentId || selectedShipment.awbCode).trim();
      if (id && id !== searchId) {
        setSearchId(id);
        fetchTrackingData(id, false);
      }
    }
  }, [selectedShipment?.shipmentId, selectedShipment?.awbCode]);

  // Initial load on mount: check URL or fallback to user's latest shipment
  useEffect(() => {
    let isCancelled = false;

    const initTracking = async () => {
      // 1. If selectedShipment prop is already provided on mount
      if (selectedShipment?.shipmentId || selectedShipment?.awbCode) {
        const id = (selectedShipment.shipmentId || selectedShipment.awbCode).trim();
        setSearchId(id);
        await fetchTrackingData(id, false);
        return;
      }

      // 2. Check URL query parameters (?id=... or ?awb=... & ?tab=return)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('id') || params.get('awb') || params.get('shipmentId') || params.get('track');
        const urlTab = params.get('tab');
        if (urlTab === 'return') {
          setActiveTab('return');
        }
        if (urlId && urlId.trim()) {
          setSearchId(urlId.trim());
          await fetchTrackingData(urlId.trim(), false);
          return;
        }
      }

      // 3. Automatically fetch the user's latest shipment and display it in tracking view
      try {
        setLoading(true);
        const res = await shipmentAPI.getShipments();
        if (isCancelled) return;
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const latestShipment = res.data[0];
          const latestId = (latestShipment.shipmentId || latestShipment.awbCode || '').trim();
          if (latestId) {
            setSearchId(latestId);
            await fetchTrackingData(latestId, false);
          }
        } else {
          setTrackingResult(null);
        }
      } catch (err) {
        console.warn('Could not auto-fetch latest shipment:', err);
        if (!isCancelled) setTrackingResult(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    initTracking();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Live auto-polling every 8 seconds when active tracking ID is set
  useEffect(() => {
    if (!isAutoSyncing || !searchId) return;
    const interval = setInterval(() => {
      if (searchId) {
        fetchTrackingData(searchId, true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [searchId, isAutoSyncing]);

  const handleTrack = async (e) => {
    e.preventDefault();
    fetchTrackingData(searchId, false);
  };

  const handlePhotoSelected = async (file) => {
    if (!file) return;
    if (isRetakeExpired) {
      setPhotoError('The 10-minute retake window for parcel photo has expired. You can no longer change or retake this photo.');
      return;
    }
    setAnalyzingPhoto(true);
    setPhotoError('');
    setPhotoClarityScore(null);
    setIsPhotoClear(false);

    try {
      // First analyze clarity from the local file
      const analysis = await analyzeImageClarity(file);
      if (!analysis.isClear) {
        setPhotoError(`Photo is not clear! ${analysis.reason || 'The system detected blurriness or poor lighting.'} You cannot submit this photo. Please take a clear, sharp photo of the product.`);
        setParcelPhoto('');
        setIsPhotoClear(false);
        setPhotoClarityScore(analysis.score);
        return;
      }

      // Clarity passed — upload to CDN host to get a permanent URL
      const { url, isHosted } = await uploadImageToHost(file, `parcel-${trackingResult?.shipmentId || 'photo'}`);
      if (url) {
        setParcelPhoto(url);
        setIsPhotoClear(true);
        setPhotoClarityScore(analysis.score);
        setPhotoError('');
        setPhotoUploadedAt(new Date());
        if (!isHosted) {
          setPhotoError('⚠️ Upload service unavailable. Using in-session photo — this will reset if you reload the page. Paste a hosted URL for permanent storage.');
        }
      } else {
        setPhotoError('Photo upload failed. Please take the photo again or paste a hosted image URL.');
        setIsPhotoClear(false);
      }
    } catch (err) {
      console.error('Error processing photo:', err);
      // Graceful fallback to base64
      const reader = new FileReader();
      reader.onload = (evt) => {
        setParcelPhoto(evt.target?.result);
        setIsPhotoClear(true);
        setPhotoUploadedAt(new Date());
      };
      reader.readAsDataURL(file);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleDispatchCourier = async (e) => {
    e.preventDefault();
    if (!courierAwb) return;
    setPhotoError('');

    const isPhotoMandatory = true;
    if (isPhotoMandatory && (!parcelPhoto || !isPhotoClear)) {
      setPhotoError('A CLEAR, sharp photo of the packaged product is mandatory for all shipments before dispatch.');
      return;
    }

    if (parcelPhoto && !isPhotoClear) {
      setPhotoError('The uploaded photo is not clear! The system requires a clear, sharp photo of the product before submitting.');
      return;
    }

    setDispatchLoading(true);
    const targetShipmentId = trackingResult?.shipmentId || searchId || '';

    try {
      await shipmentAPI.dispatchShipment(targetShipmentId.trim(), {
        carrierSlug: selectedCourier,
        awbCode: courierAwb.trim(),
        parcelPhotoUrl: parcelPhoto || trackingResult?.parcelPhotoUrl || ''
      });
      setDispatched(true);
      setIsEditingCourier(false);
      setDispatchSuccessMsg(
        `Courier tracking ID (${courierAwb}) registered! Parcel photo uploaded. Parcel value (₹${Number(trackingResult?.amount || 0).toLocaleString('en-IN')}) and cash reward have been credited to your Supplier Wallet. Funds will become withdrawable automatically once the 24-hour buyer confirmation window closes.`
      );
      if (trackingResult) {
        setTrackingResult(prev => ({
          ...prev,
          awbCode: courierAwb,
          carrier: selectedCourier,
          status: 'In Transit',
          trackingSubmitted: true,
          escrowStage: 4,
          parcelPhotoUrl: parcelPhoto || prev.parcelPhotoUrl
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Courier details registered! AWB linked to escrow shipment.';
      if (err.response?.data?.error && err.response.data.error.includes('photo')) {
        setPhotoError(err.response.data.error);
      } else {
        setDispatched(true);
        setIsEditingCourier(false);
        setDispatchSuccessMsg(msg);
        if (trackingResult) {
          setTrackingResult(prev => ({
            ...prev,
            awbCode: courierAwb,
            carrier: selectedCourier,
            status: 'In Transit',
            trackingSubmitted: true,
            escrowStage: 4,
            parcelPhotoUrl: parcelPhoto || prev?.parcelPhotoUrl
          }));
        }
      }
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleConfirmAndRelease = async () => {
    setReleaseLoading(true);
    const targetShipmentId = trackingResult?.shipmentId || searchId || '';
    try {
      await shipmentAPI.confirmDelivery(targetShipmentId.trim(), 'immediate');
    } catch (e) {
      try {
        await shipmentAPI.releaseEscrow(targetShipmentId.trim());
      } catch (e2) {
        console.warn('Release escrow non-blocking:', e2.message);
      }
    } finally {
      setReleaseLoading(false);
    }
    setTrackingResult(prev => ({
      ...prev,
      status: 'Released',
      escrowStage: 7
    }));
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    setReturnErr('');

    if (isReturnAlreadyApplied) {
      setReturnMsg('A return request has already been applied for this shipment.');
      setShowReturnForm(false);
      setActiveTab('return');
      return;
    }

    if (!returnReason.trim()) {
      setReturnErr('Please describe the reason for return.');
      return;
    }
    if (!defectPhoto) {
      setReturnErr('Uploading photo proof of the package/item is mandatory for refund, partial return, and replacement requests.');
      return;
    }
    if (returnTypeChoice === 'full_refund') {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
        setReturnErr('Please fill in all bank account details for the full refund.');
        return;
      }
    }

    setReturnSubmitting(true);
    const targetId = trackingResult?.shipmentId || searchId;
    try {
      await shipmentAPI.requestReturn(targetId, {
        returnType: returnTypeChoice,
        returnReason: returnReason.trim(),
        defectPhotoUrl: defectPhoto || '',
        defectDescription: defectDescription.trim(),
        ...(returnTypeChoice === 'full_refund' ? {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          accountHolderName: accountHolderName.trim(),
        } : {}),
      });
      setReturnMsg('Return request submitted! Redirecting to return tracking...');
      setShowReturnForm(false);
      setTrackingResult(prev => ({
        ...prev,
        returnStatus: 'Requested',
        returnType: returnTypeChoice,
        returnReason: returnReason.trim(),
        status: 'Return Requested',
      }));
      setTimeout(() => setActiveTab('return'), 1500);
    } catch (err) {
      if (err.response?.data?.alreadyApplied || err.response?.data?.error?.includes('already been applied')) {
        setReturnMsg('Return already applied! Redirecting to return tracking...');
        setShowReturnForm(false);
        setActiveTab('return');
        return;
      }
      setReturnErr(err.response?.data?.error || 'Failed to submit return request. Please try again.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleSellerOfferDiscount = async (e) => {
    e?.preventDefault?.();
    const discountAmount = Number(sellerDiscountInput);
    const totalAmount = Number(trackingResult?.amount) || 0;
    if (!discountAmount || discountAmount <= 0) {
      alert('Please enter a valid discount amount greater than ₹0');
      return;
    }
    if (discountAmount >= totalAmount) {
      alert(`Discount amount (₹${discountAmount}) must be less than the total parcel value of ₹${totalAmount}`);
      return;
    }

    setDiscountActionLoading(true);
    try {
      await shipmentAPI.offerDiscount(trackingResult.shipmentId, discountAmount);
      alert(`Discount offer of ₹${discountAmount} successfully sent to buyer! Once the buyer accepts, funds will auto-split.`);
      setSellerDiscountInput('');
      setIsEditingDiscount(false);
      handleSearch(trackingResult.shipmentId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to offer discount.');
    } finally {
      setDiscountActionLoading(false);
    }
  };

  const handleReceiverRespondDiscount = async (accepted) => {
    const actionName = accepted ? 'accept this discount offer' : 'reject this offer and trigger an automatic 100% full refund';
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) return;
    setDiscountActionLoading(true);
    try {
      await shipmentAPI.respondDiscount(trackingResult.shipmentId, accepted);
      alert(accepted ? 'Discount accepted! The agreed discount amount has been credited to your wallet.' : 'Discount rejected. A full 100% refund has been credited to your wallet.');
      handleSearch(trackingResult.shipmentId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond to discount offer.');
    } finally {
      setDiscountActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header & Search */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Navigation className="w-6 h-6 text-[#1E56E3]" />
                Live Parcel & Escrow Tracking
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Real-time escrow money flow and multi-carrier logistics tracking.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTrackingData(searchId, false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Sync latest live shipment status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Shipment ID (e.g. PSF-...) or AWB Tracking Code..."
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

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}
      </div>

      {/* TRACKING DUAL VIEW CONTAINER */}
      {trackingResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* RETURN / REVERSE LOGISTICS ACTIVE BANNER (Only when not already on return tab) */}
          {(trackingResult?.returnAwbCode || (trackingResult?.returnStatus && trackingResult?.returnStatus !== 'None') || trackingResult?.status?.includes('Return')) && activeTab !== 'return' && (
            <div className={`p-3.5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
              (trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                ? 'bg-emerald-50/90 border-emerald-200/90'
                : 'bg-slate-50 border-slate-200/90'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  (trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {(trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    : <RotateCcw className="w-4 h-4 text-slate-700" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {(trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                        ? 'Refund Completed'
                        : 'Return Active'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      (trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                    }`}>
                      {trackingResult?.returnStatus || trackingResult?.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                      ? '100% Escrow amount has been refunded to the buyer wallet.'
                      : `Reverse Courier: ${trackingResult?.returnCarrierName || 'Delhivery Express'} • AWB: ${trackingResult?.returnAwbCode || 'Pending Pickup'}`
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('return')}
                className={`px-3.5 py-1.5 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                  (trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <span>
                  {(trackingResult?.status === 'Returned & Refunded' || trackingResult?.returnStatus === 'Returned & Refunded' || trackingResult?.returnStatus === 'Completed')
                    ? 'View Refund Details'
                    : 'View Return'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* DISCOUNT OFFER ACTION BANNER FOR BUYER (Only when not on return tab) */}
          {Boolean(Number(trackingResult?.discountOfferedAmount) > 0 && trackingResult?.discountAccepted !== true && trackingResult?.discountAccepted !== false) && isActualRecipient && !isSellerView && activeTab !== 'return' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50/60 border border-amber-200/90 shadow-xs animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-950">
                        Seller Offered ₹{Number(trackingResult.discountOfferedAmount).toLocaleString('en-IN')} Discount
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
                        Instant Refund
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      Keep item & get ₹{Number(trackingResult.discountOfferedAmount).toLocaleString('en-IN')} back, or proceed to return for full 100% refund.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('return')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Review Offer</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MULTI-TAB SWITCHER: ESCROW, CARRIER, GPS, AND RETURN TRACKING */}
          <div className="bg-[#F4F7FF] p-1.5 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setActiveTab('escrow')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                activeTab === 'escrow'
                  ? 'bg-white text-[#1E56E3] shadow-md border border-blue-100 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              <Lock className="w-4 h-4 text-[#1E56E3]" />
              <span>Transaction Escrow</span>
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
              <span>Carrier Journey</span>
            </button>



            {(trackingResult?.returnAwbCode || (trackingResult?.returnStatus && trackingResult?.returnStatus !== 'None') || trackingResult?.status?.includes('Return')) && (
              <button
                onClick={() => setActiveTab('return')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                  activeTab === 'return'
                    ? isRefundCompleted
                      ? 'bg-white text-emerald-800 shadow-md border border-emerald-200 font-extrabold'
                      : 'bg-white text-amber-800 shadow-md border border-amber-200 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 font-bold'
                }`}
              >
                {isRefundCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Refund Completed</span>
                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                      Settled ✓
                    </span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Return Tracking</span>
                    <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                      Active
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* VIEW 1: TRANSACTION ESCROW MONEY FLOW & STAGES */}
          {activeTab === 'escrow' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Current Status Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT STATUS</span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl font-black text-slate-900">{trackingResult?.status || 'Awaiting Courier Dispatch'}</h2>
                    {isReleased ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        COMPLETED ✓
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-[#1E56E3] font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escrow Amount</span>
                  <span className="text-xl font-extrabold text-[#1E56E3] font-mono">₹{Number(trackingResult?.amount || 0).toLocaleString('en-IN')}</span>
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
                      <p className="text-xs text-slate-500 mt-0.5">The digital shipping manifest has been registered on SecureKaro Escrow.</p>
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

                  {/* Stage 4: Enter Courier Details — Supplier or Buyer */}
                  {isSupplier ? (
                    <div className="flex items-start gap-4 relative z-10">
                      {/* Step bubble: green check only when dispatched + photo uploaded */}
                      <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shadow-md shrink-0 transition-all ${
                        isDispatched && !isEditingCourier && trackingResult?.parcelPhotoUrl
                          ? 'bg-[#1E56E3] text-white'
                          : isDispatched && !isEditingCourier && !trackingResult?.parcelPhotoUrl
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-amber-400/30 animate-pulse'
                          : 'bg-[#1E56E3] text-white ring-4 ring-blue-100 shadow-blue-500/20 animate-pulse'
                      }`}>
                        {isDispatched && !isEditingCourier && trackingResult?.parcelPhotoUrl
                          ? '✓'
                          : isDispatched && !isEditingCourier
                          ? <Camera className="w-5 h-5" />
                          : <Truck className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        {isDispatched && !isEditingCourier ? (
                          <div className={`p-5 rounded-3xl space-y-3 border ${
                            trackingResult?.parcelPhotoUrl
                              ? 'bg-blue-50/50 border-blue-200/70'
                              : 'bg-amber-50/60 border-amber-300/70'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900">Courier details submitted &amp; parcel dispatched</h4>
                                {trackingResult?.parcelPhotoUrl ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    COMPLETED ✓
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                                    <Camera className="w-3 h-3 text-amber-600" />
                                    PHOTO REQUIRED
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsEditingCourier(true)}
                                className="text-[11px] font-bold text-[#1E56E3] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                Edit Details
                              </button>
                            </div>

                            {/* Missing photo warning */}
                            {!trackingResult?.parcelPhotoUrl && (
                              <div className="p-3 rounded-2xl bg-amber-100 border border-amber-300 flex items-center gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <p className="text-[11px] text-amber-800 font-semibold">
                                  Parcel photo has not been uploaded yet. Upload a photo via <strong>Edit Details</strong> to mark this step as complete.
                                </p>
                              </div>
                            )}

                            <div className="p-3.5 rounded-2xl bg-white border border-blue-100 flex items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                                  <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 uppercase">
                                    Dispatched via {(selectedCourier || trackingResult?.carrier || 'Delhivery').replace('_', ' ')}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
                                    AWB Tracking Code: <span className="text-[#1E56E3] font-bold">{courierAwb || trackingResult?.awbCode}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Dispatched
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-3xl bg-blue-50/60 border border-blue-200/80 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[#1E56E3] font-bold text-xs">
                                <Truck className="w-4 h-4" />
                                <span>{isEditingCourier ? 'Update Courier Details' : 'Enter Courier Details'}</span>
                              </div>
                              {isEditingCourier && (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingCourier(false)}
                                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">As the sender, enter the courier details to dispatch the parcel and advance to the next step.</p>

                            <form onSubmit={handleDispatchCourier} className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">SELECT COURIER SERVICE</label>
                                  {(trackingResult?.carrier || trackingResult?.pickupCarrier || selectedCourier) && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                      🔒 Auto-Assigned & Locked
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={selectedCourier}
                                  onChange={(e) => setSelectedCourier(e.target.value)}
                                  disabled={Boolean(trackingResult?.carrier || trackingResult?.pickupCarrier || trackingResult?.awbCode)}
                                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold ${
                                    trackingResult?.carrier || trackingResult?.pickupCarrier || trackingResult?.awbCode
                                      ? 'bg-slate-100/90 border border-slate-300 text-slate-700 cursor-not-allowed select-none'
                                      : 'bg-white border border-blue-200 text-slate-800 focus:ring-2 focus:ring-blue-500'
                                  }`}
                                >
                                  <option value="delhivery">Delhivery Express</option>
                                  <option value="rapido">Rapido Parcel / Express</option>
                                  <option value="bluedart">BlueDart Logistics</option>
                                  <option value="dtdc">DTDC Express</option>
                                  <option value="ekart">Ekart Logistics</option>
                                  <option value="shadowfax">Shadowfax</option>
                                  <option value="indiapost">India Post Speed Post</option>
                                </select>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">COURIER TRACKING ID</label>
                                  {courierAwb && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-sans">
                                      🔒 Auto-Generated AWB (Locked)
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  required
                                  readOnly={Boolean(trackingResult?.awbCode || courierAwb)}
                                  value={courierAwb}
                                  onChange={(e) => setCourierAwb(e.target.value.toUpperCase())}
                                  placeholder="E.G. DLV1234567890IN"
                                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase ${
                                    trackingResult?.awbCode || courierAwb
                                      ? 'bg-slate-100/90 border border-slate-300 text-slate-800 cursor-not-allowed select-none'
                                      : 'bg-white border border-blue-200 text-slate-900 focus:ring-2 focus:ring-blue-500'
                                  }`}
                                />
                              </div>

                              {/* Parcel Photo Upload Field */}
                              {(() => {
                                const isPhotoMandatory = true;
                                return (
                                  <div className="p-4 rounded-2xl border transition-all bg-amber-50/90 border-amber-300 shadow-xs">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                                        <Camera className="w-4 h-4 text-indigo-600" />
                                        <span>Parcel & Product Photo Upload</span>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                                        Mandatory (All Shipments)
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                      Uploading a clear photo of the packaged parcel and product is mandatory for all shipments before courier dispatch to guarantee escrow safety.
                                    </p>

                                    {analyzingPhoto && (
                                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-2.5 text-xs text-blue-800 font-bold">
                                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                        <span>AI System analyzing photo clarity, lighting, and sharpness...</span>
                                      </div>
                                    )}

                                    {parcelPhoto && isPhotoClear ? (
                                      <div className="rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50/50 p-3 space-y-2.5">
                                        <div className="relative rounded-xl overflow-hidden max-h-48 border border-slate-200 bg-white">
                                          <img src={parcelPhoto} alt="Parcel Preview" className="w-full h-44 object-cover" />
                                          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>CLEAR & APPROVED</span>
                                          </div>
                                        </div>

                                        {/* 10-Minute Retake Window Reminder Banner */}
                                        {!isRetakeExpired ? (
                                          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300/80 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                                            <div className="flex items-center gap-1.5 font-bold">
                                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                              <span>Reminder: Retake option will be gone after 10 minutes</span>
                                            </div>
                                            <span className="font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                                              {formattedRetakeRemaining} left
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                                              <span>Photo Locked: 10-minute retake window has expired</span>
                                            </div>
                                            <span className="font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                                              Retake Expired
                                            </span>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs pt-1">
                                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            Photo is clear & sharp (Clarity Score: {photoClarityScore || 95}%)
                                          </span>

                                          {!isRetakeExpired ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (isRetakeExpired) return;
                                                setParcelPhoto('');
                                                setIsPhotoClear(false);
                                                setPhotoClarityScore(null);
                                              }}
                                              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                              <span>Retake Photo</span>
                                            </button>
                                          ) : (
                                            <span className="text-[11px] text-slate-400 font-semibold italic flex items-center gap-1">
                                              <Lock className="w-3 h-3" />
                                              Retake option expired
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : !analyzingPhoto ? (
                                      isRetakeExpired ? (
                                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center space-y-1">
                                          <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                                          <p className="text-xs font-bold text-slate-700">Photo Retake Window Closed</p>
                                          <p className="text-[11px] text-slate-500">More than 10 minutes have passed since the original photo upload.</p>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Option A: Direct Camera Capture */}
                                            <button
                                              type="button"
                                              onClick={() => setCameraModal({
                                                isOpen: true,
                                                type: 'parcel',
                                                title: 'Take Parcel & Product Photo',
                                                subtitle: 'Position your parcel clearly in the frame and snap a photo'
                                              })}
                                              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center shadow-xs"
                                            >
                                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Camera className="w-5 h-5" />
                                              </div>
                                              <div>
                                                <span className="text-xs font-bold text-slate-800 block">Take Camera Photo</span>
                                                <span className="text-[10px] text-slate-500">Snap directly with camera</span>
                                              </div>
                                            </button>

                                            {/* Option B: Choose Photo from Gallery */}
                                            <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center shadow-xs">
                                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5" />
                                              </div>
                                              <div>
                                                <span className="text-xs font-bold text-slate-800 block">Upload from Gallery</span>
                                                <span className="text-[10px] text-slate-500">Choose PNG/JPG from phone gallery</span>
                                              </div>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handlePhotoSelected(file);
                                                }}
                                              />
                                            </label>
                                          </div>

                                          {photoError && (
                                            <div className="p-3.5 mt-3 bg-red-50 border border-red-200 rounded-2xl space-y-1">
                                              <div className="flex items-center gap-1.5 text-xs text-red-700 font-bold">
                                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                                <span>Photo Rejected: Not Clear</span>
                                              </div>
                                              <p className="text-[11px] text-red-600 leading-relaxed">{photoError}</p>
                                              <p className="text-[10px] text-red-500 font-bold">
                                                ⚠️ Submission is blocked. Please take a clear, well-lit photo of the product.
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    ) : null}
                                  </div>
                                );
                              })()}

                              {(() => {
                                const isPhotoMandatory = true;
                                const isBlockedByPhoto = isPhotoMandatory && (!parcelPhoto || !isPhotoClear);
                                const isBlockedByUnclearPhoto = parcelPhoto && !isPhotoClear;
                                const isSubmitDisabled = dispatchLoading || analyzingPhoto || isBlockedByPhoto || isBlockedByUnclearPhoto;

                                return (
                                  <button
                                    type="submit"
                                    disabled={isSubmitDisabled}
                                    className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                                      isSubmitDisabled
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                        : 'bg-[#1E56E3] hover:bg-[#1649CC] shadow-blue-500/20'
                                    }`}
                                  >
                                    {dispatchLoading ? (
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : analyzingPhoto ? (
                                      <span>Checking Photo Quality...</span>
                                    ) : isBlockedByPhoto || isBlockedByUnclearPhoto ? (
                                      <span>Clear Product Photo Required to Submit</span>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        <span>{isEditingCourier ? 'UPDATE COURIER DETAILS' : 'SUBMIT & DISPATCH PARCEL'}</span>
                                      </>
                                    )}
                                  </button>
                                );
                              })()}
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 border transition-all ${
                        isDispatched 
                          ? 'bg-[#1E56E3] text-white shadow-md border-transparent' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {isDispatched ? '✓' : <Truck className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-900">
                              {isDispatched ? 'Courier Dispatched by Supplier' : 'Awaiting Courier Dispatch by Supplier'}
                            </h4>
                            {isDispatched && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                                DISPATCHED ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isDispatched
                              ? `Supplier dispatched parcel via ${(selectedCourier || trackingResult?.carrier || 'Delhivery').replace('_', ' ').toUpperCase()} (AWB: ${courierAwb || trackingResult?.awbCode}).`
                              : 'The supplier will enter courier details and dispatch your parcel.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 5: Parcel Sent to Receiver — In Transit */}
                  <div className={`flex items-start gap-4 relative z-10 transition-all ${
                    !isDispatched ? 'opacity-70' : ''
                  }`}>
                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 border transition-all ${
                      isDelivered 
                        ? 'bg-[#1E56E3] text-white shadow-md border-transparent' 
                        : isDispatched && isPhotoUploaded
                          ? 'bg-[#1E56E3] text-white shadow-lg ring-4 ring-blue-100 border-transparent animate-pulse' 
                          : isDispatched && !isPhotoUploaded
                          ? 'bg-amber-400 text-white shadow-md border-transparent'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isDelivered ? '✓' : isDispatched && !isPhotoUploaded ? <Camera className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className={`text-xs font-black ${isDispatched ? 'text-slate-900' : 'text-slate-700'}`}>
                            Parcel has been sent to {trackingResult?.receiverName || 'Recipient'}
                          </h4>
                          {isDispatched && !isDelivered && isPhotoUploaded && (
                            <span className="bg-[#1E56E3] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              CURRENT STEP: IN TRANSIT
                            </span>
                          )}
                          {isDispatched && !isPhotoUploaded && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-amber-600" />
                              BLOCKED: PHOTO REQUIRED
                            </span>
                          )}
                          {isDelivered && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                              DELIVERED ✓
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isDispatched ? 'text-slate-600' : 'text-slate-400'}`}>
                          {!isDispatched
                            ? 'Awaiting courier dispatch by sender.'
                            : !isPhotoUploaded
                            ? 'Parcel photo must be uploaded before this step can proceed.'
                            : isDelivered
                              ? `Parcel successfully delivered at ${trackingResult?.route?.split('→')?.[1]?.trim() || 'destination'}.`
                              : `Dispatched via ${(selectedCourier || trackingResult?.carrier || 'Delhivery').replace('_', ' ').toUpperCase()} (AWB: ${courierAwb || trackingResult?.awbCode}). Active on live linehaul route.`
                          }
                        </p>
                      </div>

                      {/* Photo upload blocker wall */}
                      {isDispatched && !isPhotoUploaded && (
                        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 border-dashed space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-900">Parcel Photo Required to Proceed</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">You must upload a clear photo of the packaged parcel before the next step is unlocked.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-2xl border border-amber-300">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-[11px] text-amber-800 font-semibold">
                              Go to <strong>Edit Details</strong> above to upload the parcel photo. This step and all subsequent steps are locked until the photo is uploaded.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Active In-Transit Action Card */}
                      {isDispatched && isPhotoUploaded && !isDelivered && (
                        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border border-blue-200/90 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                              <span>Live Parcel Transit Active • Route: {trackingResult?.route || 'Origin → Destination'}</span>
                            </div>
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                              Estimated Delivery: 2-3 Days
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveTab('carrier')}
                              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-blue-200 text-[#1E56E3] text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Carrier Journey Milestones →</span>
                            </button>
                            <span className="text-[10px] text-slate-400 ml-auto font-medium italic flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Delivery status auto-updates from Shiprocket
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stage 6: Item confirmed by receiver */}
                  <div className={`flex items-start gap-4 relative z-10 transition-all ${
                    !isDelivered ? 'opacity-70' : ''
                  }`}>
                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 border transition-all ${
                      isReleased 
                        ? 'bg-[#1E56E3] text-white shadow-md border-transparent' 
                        : isDelivered 
                          ? 'bg-[#1E56E3] text-white shadow-lg ring-4 ring-blue-100 border-transparent animate-pulse' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isReleased ? '✓' : <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className={`text-xs font-black ${isDelivered ? 'text-slate-900' : 'text-slate-700'}`}>
                            Item confirmed by {trackingResult?.receiverName || 'Recipient'}
                          </h4>
                          {/* If discount was offered and accepted */}
                          {trackingResult?.discountAccepted === true && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              DISCOUNT SETTLED ✓
                            </span>
                          )}
                          {/* If discount was offered but pending decision */}
                          {Boolean(Number(trackingResult?.discountOfferedAmount) > 0 && trackingResult?.discountAccepted !== true && trackingResult?.discountAccepted !== false) && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              DISCOUNT OFFER PENDING
                            </span>
                          )}
                          {/* If discount was rejected */}
                          {trackingResult?.discountAccepted === false && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-200">
                              DISCOUNT REJECTED
                            </span>
                          )}
                          {/* If return or discount requested but no offer yet */}
                          {(trackingResult?.status === 'Return Requested' || trackingResult?.returnStatus === 'Requested') && !Number(trackingResult?.discountOfferedAmount) && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200">
                              {trackingResult?.returnType === 'partial_discount' ? 'DISCOUNT REQUESTED' : 'RETURN REQUESTED'}
                            </span>
                          )}
                          {/* Normal released without discount */}
                          {isReleased && trackingResult?.discountAccepted !== true && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                              APPROVED ✓
                            </span>
                          )}
                          {/* Normal 24h inspection running */}
                          {isDelivered && !isReleased && !trackingResult?.status?.includes('Return') && (!trackingResult?.returnStatus || trackingResult?.returnStatus === 'None') && !Number(trackingResult?.discountOfferedAmount) && (
                            <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                              24H INSPECTION RUNNING
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isDelivered ? 'text-slate-600' : 'text-slate-400'}`}>
                          {!isDelivered
                            ? 'Awaiting delivery and receiver confirmation.'
                            : trackingResult?.discountAccepted === true
                              ? `${trackingResult?.receiverName || 'Recipient'} confirmed parcel and accepted ₹${trackingResult?.discountOfferedAmount} discount refund. Escrow settlement completed.`
                              : trackingResult?.discountAccepted === false
                              ? `Discount offer rejected. Full refund of ₹${Number(trackingResult?.amount || 0).toLocaleString('en-IN')} processed.`
                              : Number(trackingResult?.discountOfferedAmount) > 0
                              ? `Supplier offered ₹${trackingResult?.discountOfferedAmount} discount refund. Awaiting ${trackingResult?.receiverName || 'Recipient'}'s decision.`
                              : (trackingResult?.returnStatus === 'Requested' || trackingResult?.status === 'Return Requested')
                              ? `${trackingResult?.receiverName || 'Recipient'} received the parcel and requested a ${trackingResult?.returnType === 'partial_discount' ? 'partial discount refund' : 'return'}.`
                              : isReleased
                              ? `${trackingResult?.receiverName || 'Recipient'} confirmed parcel condition and approved escrow release.`
                              : `Parcel delivered. ${trackingResult?.receiverName || 'Recipient'} has 24 hours to inspect before auto-release.`
                          }
                        </p>
                      </div>

                      {/* If discount offer is pending, show quick action banner in Stage 6 */}
                      {Boolean(Number(trackingResult?.discountOfferedAmount) > 0 && trackingResult?.discountAccepted !== true && trackingResult?.discountAccepted !== false) && (
                        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-amber-600" />
                              Discount Offer of ₹{Number(trackingResult?.discountOfferedAmount).toLocaleString('en-IN')} Active
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('return')}
                              className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            >
                              View in Return Orders →
                            </button>
                          </div>
                          <p className="text-[11px] text-amber-800">
                            {isSellerView 
                              ? `You offered ₹${Number(trackingResult?.discountOfferedAmount).toLocaleString('en-IN')} discount to the buyer. If accepted, ₹${Number(trackingResult?.discountOfferedAmount).toLocaleString('en-IN')} is refunded to buyer and remaining ₹${Number((trackingResult?.amount || 0) - (trackingResult?.discountOfferedAmount || 0)).toLocaleString('en-IN')} is credited to your wallet.`
                              : `The seller offered a discount of ₹${Number(trackingResult?.discountOfferedAmount).toLocaleString('en-IN')}. You keep the product and receive ₹${Number(trackingResult?.discountOfferedAmount).toLocaleString('en-IN')} back.`
                            }
                          </p>
                        </div>
                      )}

                      {/* Active Confirmation Action Card (Only if normal inspection, not return/discount) */}
                      {isDelivered && !isReleased && !trackingResult?.status?.includes('Return') && (!trackingResult?.returnStatus || trackingResult?.returnStatus === 'None') && !Number(trackingResult?.discountOfferedAmount) && (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              24-Hour Buyer Confirmation & Inspection Window
                            </span>
                            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              23h 54m Remaining
                            </span>
                          </div>

                          {isSellerView ? (
                            /* SELLER VIEW: Compressed status notice — NO confirmation button */
                            <div className="p-3 bg-white/90 rounded-xl border border-amber-300/80 flex items-center gap-2.5 text-xs shadow-2xs">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <p className="text-[11px] text-slate-700 leading-snug">
                                <span className="font-bold text-slate-900">Awaiting Buyer Confirmation: </span>
                                Funds auto-release in 24h or immediately upon buyer confirmation.
                              </p>
                            </div>
                          ) : (
                            /* BUYER / RECEIVER VIEW: Active confirmation action button */
                            <div className="space-y-2.5">
                              <p className="text-[11px] text-amber-800">
                                Supplier wallet holds ₹{Number(trackingResult?.amount || 3420).toLocaleString('en-IN')}. Funds auto-unlock after 24h or immediately upon buyer confirmation.
                              </p>
                              <button
                                type="button"
                                onClick={handleConfirmAndRelease}
                                disabled={releaseLoading}
                                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {releaseLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                <span>Confirm Parcel & Release Escrow to Seller (Instant Settlement)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stage 7: Payment released to sender */}
                  <div className={`flex items-start gap-4 relative z-10 transition-all ${
                    !isReleased ? 'opacity-70' : ''
                  }`}>
                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 border transition-all ${
                      isReleased 
                        ? 'bg-emerald-600 text-white shadow-md border-transparent ring-4 ring-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isReleased ? '✓' : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`text-xs font-black ${isReleased ? 'text-emerald-950 font-black' : 'text-slate-700'}`}>
                          Payment released to sender
                        </h4>
                        {isReleased && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                            SETTLED & WITHDRAWABLE
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isReleased ? 'text-emerald-800 font-semibold' : 'text-slate-400'}`}>
                        {isReleased 
                          ? `₹${Number(trackingResult?.discountSupplierWalletCredited || (trackingResult?.discountAccepted === true ? Math.max(0, Number(trackingResult?.amount || 0) - Number(trackingResult?.discountOfferedAmount || 0)) : trackingResult?.amount) || 0).toLocaleString('en-IN')} escrow payout completed and transferred to supplier wallet.${trackingResult?.discountAccepted === true ? ` (₹${Number(trackingResult?.discountOfferedAmount || trackingResult?.discountBuyerWalletCredited || 0).toLocaleString('en-IN')} refunded to buyer)` : ''}`
                          : 'Escrow funds will be released after confirmed delivery.'
                        }
                      </p>
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
                      <h2 className="text-xl font-black text-white font-mono">{trackingResult?.shipmentId || searchId}</h2>
                      <span className="bg-white/20 text-white border border-white/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {trackingResult?.status || 'In Transit'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 mt-1">Route: <span className="font-semibold text-white">{trackingResult?.route || 'Origin → Destination'}</span> • Carrier: <span className="font-semibold text-white capitalize">{trackingResult?.carrier || 'delhivery'}</span></p>
                  </div>
                </div>

                <div className="text-right border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Escrow Protected Amount</span>
                  <span className="text-2xl font-black text-white font-mono">₹{Number(trackingResult?.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* VISUAL PROGRESS TIMELINE BAR (TRACKING 2 VIEW) */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 text-sm">Carrier Milestone Progress</h3>

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
                    {(trackingResult?.milestones || []).map((m, idx) => (
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

          {/* RETURN ALREADY APPLIED / REFUND COMPLETED CARD — shown to receiver when return was submitted */}
          {trackingResult && !isSupplier && isReturnAlreadyApplied && (
            <div className={`rounded-3xl border p-5 shadow-sm space-y-4 animate-in fade-in duration-200 ${
              isRefundCompleted
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
            }`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    isRefundCompleted ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isRefundCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-700" /> : <RotateCcw className="w-6 h-6 text-amber-700" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-black ${isRefundCompleted ? 'text-emerald-950' : 'text-amber-950'}`}>
                        {isRefundCompleted ? 'Refund Completed ✓' : 'Return Already Applied'}
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isRefundCompleted 
                          ? 'bg-emerald-200 text-emerald-900 border-emerald-300' 
                          : 'bg-amber-200 text-amber-900 border-amber-300'
                      }`}>
                        {isRefundCompleted ? '100% Refunded' : (trackingResult.returnStatus || trackingResult.status)}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isRefundCompleted ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {isRefundCompleted
                        ? `100% of escrow funds (₹${trackingResult.amount?.toLocaleString('en-IN')}) have been successfully refunded to your buyer wallet.`
                        : `A return request is already active for this shipment. 100% of escrow funds (₹${trackingResult.amount?.toLocaleString('en-IN')}) remain safely frozen under buyer protection.`
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('return');
                    const element = document.getElementById('return-journey-section');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    isRefundCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  }`}
                >
                  {isRefundCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>{isRefundCompleted ? 'View Refund Details & Journey' : 'View Return Status & Journey'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`p-3.5 bg-white/90 rounded-2xl border text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 ${
                isRefundCompleted ? 'border-emerald-200' : 'border-amber-200'
              }`}>
                <div>
                  <span className="text-slate-500 text-[11px] block">Selected Resolution:</span>
                  <span className="font-extrabold text-slate-900">
                    {trackingResult.returnType === 'replacement' ? '🔄 1. Replacement' : trackingResult.returnType === 'partial_discount' ? '🏷️ 2. Partial Refund' : '💰 3. Full Refund'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Return Reason:</span>
                  <span className="font-semibold text-slate-800 truncate block">{trackingResult.returnReason || 'Product Defect / Issue'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">{isRefundCompleted ? 'Refund Status:' : 'Reverse Logistics:'}</span>
                  <span className={`font-mono font-bold ${isRefundCompleted ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {isRefundCompleted ? '100% Credited to Wallet' : (trackingResult.returnAwbCode || 'Awaiting Merchant Approval')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* REQUEST RETURN CARD — shown to receiver when shipment is returnable */}
          {trackingResult && !isSupplier && isReturnable && !isReturnAlreadyApplied && !['Return Requested', 'Return In Transit', 'Returned & Refunded'].includes(trackingResult.status) && (
            <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {!showReturnForm ? (
                <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Not satisfied with the product?</p>
                      <p className="text-[11px] text-slate-500">Request a replacement, partial refund, or full refund within the return window.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {returnMsg && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{returnMsg}</span>}
                    <button
                      onClick={() => { setShowReturnForm(true); setReturnErr(''); setReturnMsg(''); }}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-amber-500/20"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Return / Refund
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestReturn} className="p-5 space-y-5 bg-amber-50/60">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      Select Return &amp; Resolution Path
                    </h4>
                    <button type="button" onClick={() => setShowReturnForm(false)} className="p-1.5 rounded-lg hover:bg-amber-200 text-amber-700 transition">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Option 1: Replacement */}
                    <button
                      type="button"
                      onClick={() => setReturnTypeChoice('replacement')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${returnTypeChoice === 'replacement' ? 'border-[#1E56E3] bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'}`}
                    >
                      <div className="text-xl mb-2">🔄</div>
                      <p className="text-xs font-extrabold text-slate-900">1. Replacement</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">Supplier sends a fresh replacement parcel. If rejected, 100% full refund auto-issued.</p>
                      {returnTypeChoice === 'replacement' && <span className="mt-2 inline-block text-[10px] font-black text-[#1E56E3] bg-blue-100 px-2 py-0.5 rounded-full">✓ Selected</span>}
                    </button>

                    {/* Option 2: Partial Discount */}
                    <button
                      type="button"
                      onClick={() => setReturnTypeChoice('partial_discount')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${returnTypeChoice === 'partial_discount' ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'}`}
                    >
                      <div className="text-xl mb-2">🏷️</div>
                      <p className="text-xs font-extrabold text-slate-900">2. Discounted Price</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">Keep the product and receive a partial refund for the defect. Upload a defect photo.</p>
                      {returnTypeChoice === 'partial_discount' && <span className="mt-2 inline-block text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">✓ Selected</span>}
                    </button>

                    {/* Option 3: Full Refund */}
                    <button
                      type="button"
                      onClick={() => setReturnTypeChoice('full_refund')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${returnTypeChoice === 'full_refund' ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'}`}
                    >
                      <div className="text-xl mb-2">💰</div>
                      <p className="text-xs font-extrabold text-slate-900">3. Full Refund</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">Return the product and receive 100% of the escrow amount back to your account.</p>
                      {returnTypeChoice === 'full_refund' && <span className="mt-2 inline-block text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Selected</span>}
                    </button>
                  </div>

                  {/* Return Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Return <span className="text-red-500">*</span></label>
                    <textarea
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      rows={3}
                      placeholder="Describe the issue with the product (e.g. wrong item, damaged, not as described)..."
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      required
                    />
                  </div>

                  {/* Package / Defect Photo — mandatory for all return types */}
                  <div className="p-4 bg-amber-100/60 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-900">
                        Package / Defect Evidence Photo <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Mandatory for all returns
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Option A: Direct Camera Capture */}
                      <button
                        type="button"
                        disabled={uploadingDefectPhoto}
                        onClick={() => setCameraModal({
                          isOpen: true,
                          type: 'defect',
                          title: 'Take Evidence Photo',
                          subtitle: 'Position the parcel, item or defect clearly in the frame and snap a photo'
                        })}
                        className={`px-3 py-2 border rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          uploadingDefectPhoto
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait'
                            : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-50 shadow-xs'
                        }`}
                      >
                        {uploadingDefectPhoto ? (
                          <><div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
                        ) : (
                          <><Camera className="w-3.5 h-3.5 text-amber-700" /><span>Take Camera Photo</span></>
                        )}
                      </button>

                      {/* Option B: Upload from Gallery (no capture attribute) */}
                      <label className={`px-3 py-2 border rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${uploadingDefectPhoto ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'}`}>
                        <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                        <span>Upload from Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingDefectPhoto}
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingDefectPhoto(true);
                            setReturnErr('');
                            const { url } = await uploadImageToHost(file, `defect-${trackingResult?.shipmentId}`);
                            setDefectPhoto(url || '');
                            setUploadingDefectPhoto(false);
                          }}
                        />
                      </label>
                      {defectPhoto && !uploadingDefectPhoto && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Photo Attached
                        </span>
                      )}
                    </div>
                    {defectPhoto && <img src={defectPhoto} alt="Defect" className="w-24 h-24 object-cover rounded-xl border border-amber-200 mt-1" />}
                    <textarea
                      value={defectDescription}
                      onChange={e => setDefectDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe the issue, defect or package condition in detail..."
                      className="w-full text-xs border border-amber-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                  </div>

                  {/* Bank Details — shown only for full_refund */}
                  {returnTypeChoice === 'full_refund' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <p className="text-xs font-bold text-emerald-900">Bank Account for Refund</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Account Holder Name *</label>
                          <input value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="Full name as on bank account" className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" required />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Bank Name *</label>
                          <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" required />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Account Number *</label>
                          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number" className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" required />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">IFSC Code *</label>
                          <input value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-mono" required />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {returnErr && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{returnErr}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={returnSubmitting}
                      className={`flex-1 py-3 px-4 font-bold text-xs rounded-xl text-white shadow-md transition flex items-center justify-center gap-2 ${
                        returnTypeChoice === 'replacement' ? 'bg-[#1E56E3] hover:bg-blue-700 shadow-blue-500/20' :
                        returnTypeChoice === 'partial_discount' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' :
                        'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      } disabled:opacity-60`}
                    >
                      {returnSubmitting ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Submitting...</span></>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          {returnTypeChoice === 'replacement' && 'Request Instant Replacement'}
                          {returnTypeChoice === 'partial_discount' && 'Submit Defect & Request Discount'}
                          {returnTypeChoice === 'full_refund' && 'Request Full Refund & Reverse AWB'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReturnForm(false)}
                      className="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIEW 4: RETURN & REVERSE LOGISTICS TRACKING */}
          {activeTab === 'return' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Return Status Card */}
              <div className={`p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                isRefundCompleted
                  ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border-emerald-200/90'
                  : 'bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/30 border-indigo-100/90'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isRefundCompleted ? 'text-emerald-800' : 'text-indigo-700'
                  }`}>
                    {isRefundCompleted ? 'Refund & Settlement Status' : 'Return Status'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-lg font-bold text-slate-900">{trackingResult?.returnStatus || trackingResult?.status || 'Return Requested'}</h2>
                    {isRefundCompleted ? (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Refund Completed ✓
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Active Return
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Route: {trackingResult?.route || 'India'} • Recipient: {trackingResult?.receiverName}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    {isRefundCompleted ? '100% Escrow Refunded' : 'Escrow Protected Refund'}
                  </span>
                  <span className="text-2xl font-bold text-emerald-700 font-mono">₹{Number(trackingResult?.amount || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-800 font-semibold block">
                    {isRefundCompleted ? 'Credited to Buyer Wallet' : '100% Vault Guaranteed'}
                  </span>
                </div>
              </div>

              {/* 4-STEP RETURN JOURNEY STEPPER */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <span>Return Journey Progress</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                    {trackingResult?.returnStatus === 'Completed' || trackingResult?.status === 'Returned & Refunded' ? 'Stage 4/4 • Completed' :
                     trackingResult?.returnStatus === 'In Return Transit' ? 'Stage 3/4 • In Transit' :
                     trackingResult?.returnAwbCode ? 'Stage 2/4 • Courier Assigned' :
                     'Stage 1/4 • Return Requested'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { 
                      step: 1, 
                      label: '1. Requested', 
                      desc: 'Buyer filed return', 
                      active: true,
                      color: 'bg-amber-500'
                    },
                    { 
                      step: 2, 
                      label: '2. Assigned', 
                      desc: trackingResult?.returnAwbCode ? `${trackingResult?.returnCarrierName || 'Delhivery'}` : 'Awaiting AWB', 
                      active: Boolean(trackingResult?.returnAwbCode || trackingResult?.returnCarrierSlug || trackingResult?.returnStatus === 'In Return Transit' || trackingResult?.returnStatus === 'Completed'),
                      color: 'bg-indigo-600'
                    },
                    { 
                      step: 3, 
                      label: '3. In Transit', 
                      desc: 'En route to hub', 
                      active: Boolean(trackingResult?.returnStatus === 'In Return Transit' || trackingResult?.returnStatus === 'Completed' || trackingResult?.status === 'Returned & Refunded'),
                      color: 'bg-blue-600'
                    },
                    { 
                      step: 4, 
                      label: '4. Refunded', 
                      desc: 'Escrow to wallet', 
                      active: Boolean(trackingResult?.returnStatus === 'Completed' || trackingResult?.status === 'Returned & Refunded'),
                      color: 'bg-emerald-600'
                    }
                  ].map(st => (
                    <div key={st.step} className="flex flex-col items-center text-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        st.active 
                          ? `${st.color} text-white shadow-xs` 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {st.active ? '✓' : st.step}
                      </div>
                      <span className={`text-[11px] font-semibold mt-1.5 line-clamp-1 ${st.active ? 'text-slate-900' : 'text-slate-400'}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">
                        {st.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reverse Carrier Partner & Tracking Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-xs">Courier &amp; Return Details</h3>

                {trackingResult?.returnType === 'replacement' ? (
                  /* ── REPLACEMENT: TWO LEGS ─────────────────────────────────── */
                  <div className="space-y-3">
                    {/* Leg 1 — Forward delivery: Supplier → Buyer */}
                    <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3 h-3" /> 📦 Leg 1 — New Item Delivery (Supplier → You)
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Carrier</span>
                          <p className="font-semibold text-indigo-900">{trackingResult?.replacementCarrierName || 'Awaiting Assignment'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery AWB</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">{trackingResult?.replacementAwbCode || 'Pending'}</span>
                            {trackingResult?.replacementAwbCode && (
                              <button type="button"
                                onClick={() => { navigator.clipboard.writeText(trackingResult.replacementAwbCode); setCopiedReturnAwb('fwd'); setTimeout(() => setCopiedReturnAwb(false), 2500); }}
                                className="p-0.5 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer">
                                {copiedReturnAwb === 'fwd' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leg 2 — Reverse pickup: Buyer → Supplier (old defective item) */}
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <RotateCcw className="w-3 h-3" /> 🔄 Leg 2 — Old Item Pickup (You → Supplier)
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Pickup Carrier</span>
                          <p className="font-semibold text-amber-900">{trackingResult?.replacementPickupCarrierName || trackingResult?.returnCarrierName || 'Awaiting Assignment'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Pickup AWB</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">{trackingResult?.replacementPickupAwbCode || trackingResult?.returnAwbCode || 'Pending'}</span>
                            {(trackingResult?.replacementPickupAwbCode || trackingResult?.returnAwbCode) && (
                              <button type="button"
                                onClick={() => { navigator.clipboard.writeText(trackingResult.replacementPickupAwbCode || trackingResult.returnAwbCode); setCopiedReturnAwb('rev'); setTimeout(() => setCopiedReturnAwb(false), 2500); }}
                                className="p-0.5 hover:bg-amber-100 text-slate-400 hover:text-amber-700 rounded transition cursor-pointer">
                                {copiedReturnAwb === 'rev' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {(trackingResult?.replacementPickupWindow || trackingResult?.returnPickupWindow) && (
                        <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-100">
                          📅 Pickup Window: {trackingResult?.replacementPickupWindow || trackingResult?.returnPickupWindow}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── FULL REFUND / PARTIAL DISCOUNT: SINGLE REVERSE LEG ─── */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Reverse Partner</span>
                      <p className="font-semibold text-indigo-900 text-xs mt-0.5 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{trackingResult?.returnCarrierName || (trackingResult?.returnCarrierSlug ? trackingResult?.returnCarrierSlug.toUpperCase() + ' Express' : 'Pending Carrier Partner')}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Reverse Tracking AWB</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-slate-800">
                          {trackingResult?.returnAwbCode || 'Awaiting Generation'}
                        </span>
                        {trackingResult?.returnAwbCode && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(trackingResult.returnAwbCode);
                              setCopiedReturnAwb(true);
                              setTimeout(() => setCopiedReturnAwb(false), 2500);
                            }}
                            className="p-0.5 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          >
                            {copiedReturnAwb ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Return Type Choice</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {trackingResult?.returnType === 'partial_discount' ? 'Defect Discount' : 'Full Escrow Refund'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Return Reason */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">Reason for Return:</span>
                  <p className="text-slate-600">{trackingResult?.returnReason || 'Buyer requested return within verification window.'}</p>
                  {trackingResult?.defectDescription && (
                    <p className="text-slate-500 pt-1 border-t border-slate-200/60">
                      <strong className="text-slate-700">Defect Note:</strong> {trackingResult.defectDescription}
                    </p>
                  )}
                </div>

                {/* Defect photo preview if uploaded */}
                {trackingResult?.defectPhotoUrl && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-teal-600" />
                        <span>Defect Photo Evidence:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoModal({ isOpen: true, url: trackingResult.defectPhotoUrl, title: `Defect Photo Evidence — ${trackingResult.shipmentId}` })}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Photo</span>
                      </button>
                    </div>
                    <div 
                      onClick={() => setPreviewPhotoModal({ isOpen: true, url: trackingResult.defectPhotoUrl, title: `Defect Photo Evidence — ${trackingResult.shipmentId}` })}
                      className="rounded-xl overflow-hidden border border-teal-200 bg-white group relative cursor-pointer max-w-xs h-36 shadow-2xs"
                    >
                      <img 
                        src={trackingResult.defectPhotoUrl} 
                        alt="Defect proof" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                      />
                      <div className="absolute inset-0 bg-teal-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                        <ZoomIn className="w-4 h-4" />
                        <span>Inspect Full Photo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 2: Partial Discount Workflow (Colorful & Clean Resolution Card) */}
                {(trackingResult?.returnType === 'partial_discount' || Number(trackingResult?.discountOfferedAmount) > 0) && (
                  <div className="pt-2">
                    {/* Awaiting Seller Offer */}
                    {(!trackingResult?.discountOfferedAmount || Number(trackingResult?.discountOfferedAmount) <= 0) && trackingResult?.status === 'Return Requested' && (
                      isSellerView ? (
                        <div className="p-4 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 rounded-xl border border-teal-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-teal-600" />
                              <div>
                                <h4 className="text-xs font-bold text-teal-950">Offer Defect Discount to Buyer</h4>
                                <p className="text-[11px] text-teal-700/80">Propose a discount amount so the buyer keeps the item.</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800">
                              Total: ₹{trackingResult.amount}
                            </span>
                          </div>

                          <form onSubmit={handleSellerOfferDiscount} className="space-y-3 pt-1">
                            <div>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs font-bold text-teal-600">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={Math.max(1, (Number(trackingResult.amount) || 1) - 1)}
                                  placeholder="Discount amount to refund to buyer"
                                  value={sellerDiscountInput}
                                  onChange={(e) => setSellerDiscountInput(e.target.value)}
                                  required
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                              </div>
                            </div>

                            {/* Quick Percent Suggestions */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                              <span className="text-teal-700 font-medium">Quick pick:</span>
                              {[10, 20, 30, 50].map((pct) => {
                                const val = Math.round(((Number(trackingResult.amount) || 0) * pct) / 100);
                                if (val <= 0 || val >= (Number(trackingResult.amount) || 0)) return null;
                                return (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setSellerDiscountInput(String(val))}
                                    className="px-2 py-0.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 rounded-md font-semibold transition cursor-pointer"
                                  >
                                    {pct}% (₹{val})
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="submit"
                              disabled={discountActionLoading || !sellerDiscountInput || Number(sellerDiscountInput) <= 0 || Number(sellerDiscountInput) >= Number(trackingResult.amount)}
                              className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>{discountActionLoading ? 'Sending...' : `Send Offer of ₹${sellerDiscountInput || '...'} to Buyer`}</span>
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Awaiting seller to review defect evidence and propose a discount amount.</span>
                        </div>
                      )
                    )}

                    {/* Discount Offered -> Pending Decision */}
                    {Boolean(Number(trackingResult?.discountOfferedAmount) > 0 && trackingResult?.discountAccepted !== true && trackingResult?.discountAccepted !== false) && (
                      isSellerView ? (() => {
                        const offeredAt = trackingResult?.discountOfferedAt ? new Date(trackingResult.discountOfferedAt).getTime() : 0;
                        const elapsedMs = offeredAt > 0 ? (Date.now() - offeredAt) : 0;
                        const fifteenHoursMs = 15 * 60 * 60 * 1000;
                        const is15hPassed = offeredAt > 0 && elapsedMs >= fifteenHoursMs;
                        const remainingMs = Math.max(0, fifteenHoursMs - elapsedMs);
                        const totalMinutes = Math.ceil(remainingMs / (1000 * 60));
                        const remH = Math.floor(totalMinutes / 60);
                        const remM = totalMinutes % 60;

                        return (
                          <div className="p-4 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 rounded-xl border border-teal-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs">
                                <Tag className="w-3.5 h-3.5 text-teal-600" />
                                <span>Discount Offer Sent: ₹{Number(trackingResult.discountOfferedAmount).toLocaleString('en-IN')}</span>
                              </div>
                              <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${is15hPassed ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-amber-800 bg-amber-50 border border-amber-300'}`}>
                                {is15hPassed ? '15h Expired' : 'Awaiting Buyer'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              If buyer accepts, they keep the product and ₹{trackingResult.discountOfferedAmount} is refunded to them. If rejected, 100% full refund is issued.
                            </p>

                            {!is15hPassed ? (
                              <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                                <div className="flex items-center justify-between font-bold text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Buyer Response Window Active
                                  </span>
                                  <span className="font-mono text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                                    {remH}h {remM}m left
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Auto-completion unlocks after 15 hours of buyer inactivity.
                                </p>
                              </div>
                            ) : (
                              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2 text-xs">
                                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Buyer did not respond within 15 hours</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Auto-complete partial refund of ₹${trackingResult.discountOfferedAmount} to buyer now?`)) {
                                      setDiscountActionLoading(true);
                                      try {
                                        await shipmentAPI.respondDiscount(trackingResult.shipmentId, true);
                                        alert(`Partial refund of ₹${trackingResult.discountOfferedAmount} auto-completed!`);
                                        handleSearch(trackingResult.shipmentId);
                                      } catch (err) {
                                        alert(err.response?.data?.error || 'Failed to auto-complete discount.');
                                      } finally {
                                        setDiscountActionLoading(false);
                                      }
                                    }
                                  }}
                                  disabled={discountActionLoading}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>⚡ Auto-Complete Discount Refund</span>
                                </button>
                              </div>
                            )}

                            {!isEditingDiscount ? (
                              <div className="pt-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSellerDiscountInput(String(trackingResult.discountOfferedAmount));
                                    setIsEditingDiscount(true);
                                  }}
                                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                                >
                                  Revise Offer Amount
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={handleSellerOfferDiscount} className="pt-2 border-t border-teal-200/60 space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-teal-600">₹</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={Math.max(1, (Number(trackingResult.amount) || 1) - 1)}
                                      value={sellerDiscountInput}
                                      onChange={(e) => setSellerDiscountInput(e.target.value)}
                                      className="w-full pl-6 pr-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-semibold text-slate-900"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={discountActionLoading}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingDiscount(false)}
                                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })() : (
                        isActualRecipient ? (
                          <div className="p-4 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 rounded-xl border border-teal-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs">
                                <Tag className="w-3.5 h-3.5 text-teal-600" />
                                <span>Seller Offered You a ₹{Number(trackingResult.discountOfferedAmount).toLocaleString('en-IN')} Discount</span>
                              </div>
                              <span className="text-[10px] text-teal-800 bg-teal-100 border border-teal-300 px-2.5 py-0.5 rounded-md font-bold">
                                Resolution Offer
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Accept to keep the item and instantly receive <strong className="text-teal-900 font-bold">₹{trackingResult.discountOfferedAmount}</strong> in your wallet. Or reject to proceed with a 100% full refund (₹{trackingResult.amount}).
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleReceiverRespondDiscount(true)}
                                disabled={discountActionLoading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                              >
                                Accept ₹{trackingResult.discountOfferedAmount} &amp; Keep Item
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReceiverRespondDiscount(false)}
                                disabled={discountActionLoading}
                                className="px-3.5 py-2 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                              >
                                Reject &amp; Full Refund
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs">
                                <Tag className="w-3.5 h-3.5 text-teal-600" />
                                <span>Discount Offer Sent: ₹{Number(trackingResult.discountOfferedAmount).toLocaleString('en-IN')}</span>
                              </div>
                              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md font-bold">
                                Awaiting Recipient Decision
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              A discount offer of ₹{trackingResult.discountOfferedAmount} is pending. Only the designated buyer (<span className="font-semibold text-slate-900">{trackingResult.receiverName || 'Recipient'}</span>) is authorized to accept or reject it.
                            </p>
                          </div>
                        )
                      )
                    )}

                    {/* Offer Accepted */}
                    {trackingResult?.discountAccepted === true && (
                      <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Discount accepted: ₹{trackingResult.discountBuyerWalletCredited || trackingResult.discountOfferedAmount} credited to wallet.</span>
                      </div>
                    )}

                    {/* Offer Rejected */}
                    {trackingResult?.discountAccepted === false && (
                      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-2 border border-slate-200">
                        <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Discount rejected by buyer. Full 100% refund of ₹{trackingResult.amount} credited to wallet.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reverse Milestones Timeline with Stage Colors */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-xs">Journey Milestones</h3>
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                  {[
                    {
                      title: 'Return Request Filed',
                      desc: `Return requested. Reason: "${trackingResult?.returnReason || 'Product return'}"`,
                      time: trackingResult?.returnRequestedAt ? new Date(trackingResult.returnRequestedAt).toLocaleDateString('en-IN') : 'Initiated',
                      active: true,
                      color: 'bg-amber-500'
                    },
                    {
                      title: 'Reverse Courier Partner Assigned',
                      desc: trackingResult?.returnAwbCode 
                        ? `${trackingResult?.returnCarrierName || 'Delhivery'} reverse waybill ${trackingResult.returnAwbCode} issued.` 
                        : 'Awaiting courier partner assignment.',
                      time: trackingResult?.returnApprovedAt ? new Date(trackingResult.returnApprovedAt).toLocaleDateString('en-IN') : 'Pending',
                      active: Boolean(trackingResult?.returnAwbCode || trackingResult?.returnStatus === 'In Return Transit' || trackingResult?.returnStatus === 'Completed'),
                      color: 'bg-indigo-600'
                    },
                    {
                      title: 'In Reverse Transit',
                      desc: trackingResult?.returnStatus === 'In Return Transit' || trackingResult?.returnStatus === 'Completed'
                        ? 'Package picked up by courier and in transit back to supplier hub.'
                        : 'Courier agent scheduled for pickup.',
                      time: trackingResult?.returnStatus === 'In Return Transit' ? 'In Transit' : 'Scheduled',
                      active: Boolean(trackingResult?.returnStatus === 'In Return Transit' || trackingResult?.returnStatus === 'Completed'),
                      color: 'bg-blue-600'
                    },
                    {
                      title: 'Delivered & 100% Escrow Principal Refunded',
                      desc: trackingResult?.returnStatus === 'Completed' || trackingResult?.status === 'Returned & Refunded'
                        ? `Parcel received at origin hub. Full escrow principal ₹${trackingResult?.amount} credited to wallet!`
                        : 'Escrow vault principal will auto-refund upon arrival confirmation.',
                      time: trackingResult?.returnStatus === 'Completed' ? 'Completed' : 'Pending',
                      active: Boolean(trackingResult?.returnStatus === 'Completed' || trackingResult?.status === 'Returned & Refunded'),
                      color: 'bg-emerald-600'
                    }
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition ${
                        m.active ? `${m.color} text-white shadow-2xs` : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {m.active ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${m.active ? 'text-slate-900' : 'text-slate-400'}`}>{m.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{m.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE WHEN NO SHIPMENT TRACKED */}
      {!trackingResult && !loading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">No Shipment Tracking Active</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enter a valid Shipment ID or courier AWB tracking code above to view live journey milestones, courier telemetry, and escrow protection status.
            </p>
          </div>
        </div>
      )}

      {/* INITIAL LOADING STATE */}
      {!trackingResult && loading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-xl mx-auto space-y-3 animate-in fade-in duration-200">
          <RefreshCw className="w-8 h-8 text-[#1E56E3] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading latest shipment tracking...</p>
        </div>
      )}
      {/* Lightbox / Full Photo View Modal */}
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
      
      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={cameraModal.isOpen}
        title={cameraModal.title}
        subtitle={cameraModal.subtitle}
        onClose={() => setCameraModal((prev) => ({ ...prev, isOpen: false }))}
        onCapture={async (file) => {
          if (cameraModal.type === 'parcel') {
            handlePhotoSelected(file);
          } else if (cameraModal.type === 'defect') {
            setUploadingDefectPhoto(true);
            setReturnErr('');
            try {
              const { url } = await uploadImageToHost(file, `defect-${trackingResult?.shipmentId}`);
              if (url) {
                setDefectPhoto(url);
              } else {
                setReturnErr('Failed to upload photo. Please try again.');
              }
            } catch (err) {
              setReturnErr('Failed to upload photo.');
            } finally {
              setUploadingDefectPhoto(false);
            }
          }
        }}
      />
    </div>
  );
}
