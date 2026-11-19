import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, Camera, X, AlertCircle, CheckCircle2,
  RefreshCw, Image, ArrowRight, Smartphone, FileText
} from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [fileScanning, setFileScanning] = useState(false);
  const [fileError, setFileError] = useState('');

  const fileInputCameraRef = useRef(null);

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
    } catch (_) {}

    // 4. Matches JSON payload { token, shipmentId }
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const obj = JSON.parse(trimmed);
        if (obj.token || obj.shipmentId) {
          return { token: obj.token, shipmentId: obj.shipmentId, rawText: trimmed };
        }
      }
    } catch (_) {}

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

  const handleDecoded = (decodedText) => {
    const parsed = parseQrText(decodedText);
    if (parsed) {
      if (onScanSuccess) {
        onScanSuccess(parsed);
      }
      if (onClose) {
        onClose();
      }
    }
  };

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

  const modalNode = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col relative max-h-[92dvh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-teal-50/20 to-blue-50/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Verify In-Box QR Code</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                  Receiver Sign-Off
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                Verify parcel inside the box to confirm delivery
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-bold text-slate-600 shrink-0">
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* TAB 1: SNAP PHOTO / UPLOAD IMAGE */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Option A: Direct native phone camera capture */}
              <div className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 hover:border-emerald-400 rounded-3xl p-6 text-center transition cursor-pointer relative group shadow-sm">
                <input
                  ref={fileInputCameraRef}
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
                      Opens your phone's native camera immediately to snap the QR code slip inside your parcel.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Quick &amp; Instant on Mobile
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

              {fileScanning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>Scanning photo for QR code...</span>
                </div>
              )}

              {fileError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
                💡 <strong>Tip:</strong> If the QR code is printed on the in-box slip, snapping a quick photo with your phone camera works instantly.
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL TOKEN / SHIPMENT ID ENTRY */}
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
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold px-5 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivery 100% Protected</span>
          </span>
          <span className="text-slate-400">SecureKaro Tamper-Evident QR</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
