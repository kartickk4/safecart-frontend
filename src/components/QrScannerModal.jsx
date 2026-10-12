import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, Camera, Upload, X, AlertCircle, CheckCircle2,
  RefreshCw, Sparkles, SwitchCamera, Image, ArrowRight, ShieldCheck,
  Smartphone, FileText, Check
} from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [fileScanning, setFileScanning] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isMobileNonSecure, setIsMobileNonSecure] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isStoppingRef = useRef(false);
  const fileInputCameraRef = useRef(null);
  const fileInputGalleryRef = useRef(null);

  // Check if current environment supports getUserMedia (secure context or localhost)
  const checkCameraSupport = () => {
    if (typeof window === 'undefined') return { supported: true, reason: '' };
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.isSecureContext || isLocalhost;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!isSecure && !isLocalhost) {
      return {
        supported: false,
        reason: 'mobile_http',
        message: 'Mobile browsers require HTTPS or direct camera capture for scanning.'
      };
    }

    if (!hasMediaDevices) {
      return {
        supported: false,
        reason: 'no_media_devices',
        message: 'Camera stream API is not supported in this browser. Please use photo capture.'
      };
    }

    return { supported: true, reason: '' };
  };

  // Helper to downscale large phone camera photos (e.g. 12MP/48MP) to ~1200px for instant QR decoding
  const downscaleImageIfNeeded = async (file) => {
    return new Promise((resolve) => {
      try {
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => {
          img.onload = () => {
            const maxDim = 1200;
            let { width, height } = img;
            if (width <= maxDim && height <= maxDim) {
              resolve(file);
              return;
            }
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const resized = new File([blob], file.name || 'qr-snap.jpg', { type: 'image/jpeg' });
                resolve(resized);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.92);
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  };

  // Parse QR content into token, shipmentId or URL
  const parseQrText = (decodedText) => {
    if (!decodedText || typeof decodedText !== 'string') return null;
    const trimmed = decodedText.trim();

    // 1. Matches URL with /qr-confirm/:token
    const urlMatch = trimmed.match(/\/qr-confirm\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      return { token: urlMatch[1], rawText: trimmed };
    }

    // 2. Matches URL with /track/:id
    const trackMatch = trimmed.match(/\/track\/([a-zA-Z0-9_-]+)/);
    if (trackMatch && trackMatch[1]) {
      return { shipmentId: trackMatch[1].toUpperCase(), rawText: trimmed };
    }

    // 3. Matches URL query param ?token=... or ?qr=...
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const urlObj = new URL(trimmed);
        const tkn = urlObj.searchParams.get('token') || urlObj.searchParams.get('qr');
        if (tkn) return { token: tkn, rawText: trimmed };
        const sId = urlObj.searchParams.get('shipmentId') || urlObj.searchParams.get('id');
        if (sId) return { shipmentId: sId.toUpperCase(), rawText: trimmed };
      }
    } catch (e) {}

    // 4. Matches JSON payload { token, shipmentId }
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const obj = JSON.parse(trimmed);
        if (obj.token || obj.shipmentId) {
          return { token: obj.token, shipmentId: obj.shipmentId, rawText: trimmed };
        }
      }
    } catch (e) {}

    // 5. Matches Shipment ID format (SPL-XXXX-X)
    if (/^SPL-[0-9]{4}-[A-Z]$/i.test(trimmed)) {
      return { shipmentId: trimmed.toUpperCase(), rawText: trimmed };
    }

    // 6. Hex token string (e.g. 32-64 hex chars)
    const hexMatch = trimmed.match(/[a-f0-9]{32,64}/i);
    if (hexMatch) {
      return { token: hexMatch[0], rawText: trimmed };
    }

    // Fallback: Return raw string
    return { token: trimmed, rawText: trimmed };
  };

  const handleDecoded = async (decodedText) => {
    const parsed = parseQrText(decodedText);
    if (parsed) {
      await stopScanner();
      if (onScanSuccess) {
        onScanSuccess(parsed);
      }
      if (onClose) {
        onClose();
      }
    }
  };

  // Start Live Camera Scanner with multiple progressive fallbacks
  const startScanner = async (cameraIdOrFacing = { facingMode: 'environment' }) => {
    setCameraError('');
    setIsScanning(false);

    const support = checkCameraSupport();
    if (!support.supported) {
      setIsScanning(false);
      setIsMobileNonSecure(true);
      setCameraError(support.reason);
      return;
    }

    setIsMobileNonSecure(false);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('interactive-qr-reader');
      }

      const qrScanner = html5QrCodeRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
          return { width: Math.max(edge, 200), height: Math.max(edge, 200) };
        },
        aspectRatio: 1.0
      };

      // Helper function to try starting with a specific camera configuration
      const tryStart = async (config) => {
        return qrScanner.start(
          config,
          scanConfig,
          (decodedText) => handleDecoded(decodedText),
          () => {} // Frame misses ignored
        );
      };

      // Attempt 1: Specified facingMode or cameraId
      try {
        await tryStart(cameraIdOrFacing);
      } catch (firstErr) {
        console.warn('First camera attempt failed, trying fallback facing mode...', firstErr);
        // Attempt 2: Try user/front camera if back camera threw constraint error
        try {
          await tryStart({ facingMode: 'user' });
        } catch (secondErr) {
          console.warn('Second camera attempt failed, enumerating cameras...', secondErr);
          // Attempt 3: Enumerate hardware cameras and select first ID
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices && devices.length > 0) {
            await tryStart(devices[0].id);
          } else {
            // Attempt 4: Simplest generic constraint
            await tryStart(true);
          }
        }
      }

      setIsScanning(true);

      // Enumerate available cameras for the flip button
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    } catch (err) {
      console.warn('All live camera methods failed:', err);
      setIsScanning(false);
      const isPermDenied = err?.message?.includes('Permission') || err?.name === 'NotAllowedError';
      setCameraError(
        isPermDenied
          ? 'Camera permission was denied in your browser. Tap "Take Photo with Phone Camera" below to scan instantly without browser permissions.'
          : 'Could not activate live video. Tap "Take Photo with Phone Camera" below to snap a picture of the QR code.'
      );
    }
  };

  // Stop camera scanner safely
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
      isStoppingRef.current = false;
    }
  };

  // Switch between front & back camera
  const handleFlipCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    await stopScanner();
    startScanner(cameras[nextIdx].id);
  };

  // Initialize or teardown when modal opens/closes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner({ facingMode: 'environment' });
      }, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Handle Photo / File Scan with automatic high-res downscaling
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setFileScanning(true);

    try {
      const fileScanner = new Html5Qrcode('qr-file-dummy-container');
      let decodedText = null;

      // 1. First attempt: Direct file decode
      try {
        decodedText = await fileScanner.scanFile(file, true);
      } catch (directErr) {
        console.warn('Direct file scan missed, resizing photo and retrying...', directErr);
      }

      // 2. Second attempt: Downscaled photo (fixes high-res phone camera images)
      if (!decodedText) {
        try {
          const downscaled = await downscaleImageIfNeeded(file);
          decodedText = await fileScanner.scanFile(downscaled, true);
        } catch (downscaleErr) {
          console.warn('Downscaled file scan also missed:', downscaleErr);
        }
      }

      fileScanner.clear();

      if (decodedText) {
        handleDecoded(decodedText);
      } else {
        setFileError('Could not find a valid QR code in this image. Please ensure the QR code on the in-box slip is clearly visible, well-lit, and in focus.');
      }
    } catch (err) {
      console.error('File scan execution error:', err);
      setFileError('Unable to process this image. Please ensure the QR code is centered and readable, or enter the code manually.');
    } finally {
      setFileScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Manual Code Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    setManualError('');
    const trimmed = manualCode.trim();
    if (!trimmed) {
      setManualError('Please enter a valid QR code token or Shipment ID.');
      return;
    }
    const parsed = parseQrText(trimmed);
    if (parsed) {
      handleDecoded(trimmed);
    } else {
      setManualError('Invalid format. Please enter the tracking ID (e.g. SPL-4014-V) or alphanumeric QR token.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-teal-50/20 to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Scan In-Box QR Code</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Receiver Sign-Off
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify parcel inside the box to confirm delivery
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              if (onClose) onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-[#1E56E3] shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-[#1E56E3] shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Snap Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#1E56E3] shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manual Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border-2 border-slate-200">
                {/* HTML5 QR Container */}
                <div id="interactive-qr-reader" className="w-full h-full [&>video]:object-cover" />

                {/* Laser scan line overlay when active */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-64 h-64 border-2 border-dashed border-emerald-400/80 rounded-2xl relative">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#34d399] animate-[bounce_2s_infinite]" />
                      <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 font-bold bg-slate-900/70 px-2 py-0.5 rounded-md">
                        Aim at In-Box QR Code
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Flip Control */}
                {cameras.length > 1 && isScanning && (
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md border border-white/20 transition cursor-pointer"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                )}

                {/* Mobile HTTP restriction banner or camera permission error fallback */}
                {(isMobileNonSecure || cameraError) && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-3.5 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        {isMobileNonSecure ? 'Snap Photo with Phone Camera' : 'Camera Access Needed'}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-xs">
                        {isMobileNonSecure
                          ? 'Tap below to open your phone camera and snap a photo of the QR code slip inside your parcel.'
                          : (cameraError.length > 120 ? cameraError : `${cameraError} You can snap a photo with your phone camera directly:`)}
                      </p>
                    </div>

                    <div className="w-full flex flex-col gap-2 pt-1">
                      {/* Direct phone camera capture button (bypasses WebRTC HTTP security restrictions) */}
                      <label className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98">
                        <Camera className="w-4 h-4" />
                        <span>📸 Snap Photo with Phone Camera</span>
                        <input
                          ref={fileInputCameraRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={fileScanning}
                        />
                      </label>

                      {!isMobileNonSecure && (
                        <button
                          type="button"
                          onClick={() => startScanner({ facingMode: 'environment' })}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Live Camera</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick capture button directly below live viewfinder */}
              <div className="flex items-center gap-2">
                <label className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>📸 Quick Snap with Phone Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={fileScanning}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Enter Code
                </button>
              </div>

              {fileScanning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>Scanning photo for QR code...</span>
                </div>
              )}

              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SNAP PHOTO / UPLOAD IMAGE */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Option A: Direct native phone camera capture */}
              <div className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 hover:border-emerald-400 rounded-3xl p-6 text-center transition cursor-pointer relative group shadow-sm">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={fileScanning}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/25">
                    {fileScanning ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                      <span>📸 Snap Photo with Phone Camera</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Opens your phone's native camera immediately. Works 100% on iOS &amp; Android.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Recommended for Mobile
                  </span>
                </div>
              </div>

              {/* Option B: Choose existing photo from gallery */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-4 text-center bg-slate-50/60 hover:bg-blue-50/20 transition cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={fileScanning}
                />
                <div className="flex items-center justify-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Image className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      Choose Photo from Gallery / Files
                    </p>
                    <p className="text-[10px] text-slate-400">
                      JPG, PNG, WebP supported
                    </p>
                  </div>
                </div>
              </div>

              {fileError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
                💡 <strong>Tip:</strong> If the QR code is on another screen or printed on paper, taking a quick photo with your phone camera is fast and accurate.
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TOKEN / SHIPMENT ID ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  In-Box QR Token or Shipment ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPL-4014-V or 40-char QR token"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Printed underneath the QR code on the in-box slip.
                </p>
              </div>

              {manualError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify &amp; Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Global hidden dummy container required for Html5Qrcode.scanFile */}
        <div id="qr-file-dummy-container" style={{ display: 'none' }} />

        {/* Footer info banner */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold px-5">
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Escrow 100% Protected</span>
          </span>
          <span className="text-slate-400">SecureKaro Tamper-Evident QR</span>
        </div>
      </div>
    </div>
  );
}
