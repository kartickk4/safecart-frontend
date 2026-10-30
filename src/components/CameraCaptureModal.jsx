import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RotateCcw, Check, AlertTriangle, RefreshCw, Upload, Zap, ZapOff } from 'lucide-react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Parcel / Product Photo',
  subtitle = 'Position your parcel clearly in the frame and snap a photo'
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [startingCamera, setStartingCamera] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    setCameraError('');
    setStartingCamera(true);
    setTorchOn(false);
    setTorchSupported(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported in this browser. Please use gallery upload.');
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to any available video source if environment facingMode fails
        console.warn('Environment camera failed, falling back to default video:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }

      setStartingCamera(false);
    } catch (err) {
      console.error('Camera stream access failed:', err);
      let msg = 'Could not access camera. Please check permissions or upload from gallery.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings, or select a file instead.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. Please upload a photo from your gallery.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application. Please close other camera apps and try again.';
      }
      setCameraError(msg);
      setStartingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setPreviewUrl(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Flip camera between front & back
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Toggle torch / flashlight if supported
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Snap the photo
  const handleCapture = () => {
    if (!videoRef.current) return;

    // Flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedBlob(file);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  // Confirm photo usage
  const handleConfirmPhoto = () => {
    if (capturedBlob && onCapture) {
      onCapture(capturedBlob);
    }
    handleClose();
  };

  // Retake photo
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleClose = () => {
    stopCamera();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    onClose();
  };

  // Fallback file input change
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onCapture) {
      onCapture(file);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden">
          {/* Shutter flash effect */}
          {shutterFlash && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* Captured Preview Mode */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Captured Photo"
              className="w-full h-full object-contain bg-slate-950"
            />
          ) : (
            <>
              {/* Live Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  startingCamera ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {/* Viewfinder Target Guidelines */}
              {!cameraError && !startingCamera && (
                <div className="absolute inset-8 sm:inset-12 pointer-events-none border border-white/30 rounded-2xl flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <span className="w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  </div>
                  <div className="text-center">
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20">
                      Center Parcel &amp; Product Clearly
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <span className="w-5 h-5 border-b-2 border-r-2 border-white rounded-br-lg" />
                  </div>
                </div>
              )}

              {/* Loading State */}
              {startingCamera && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-300">Accessing Camera...</p>
                </div>
              )}

              {/* Error / Fallback State */}
              {cameraError && (
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-3 bg-slate-950 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-slate-200">Camera Unavailable</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File Instead</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFallbackFile}
                    />
                  </div>
                </div>
              )}

              {/* Camera Overlays / Quick Controls (Switch camera, Torch) */}
              {!cameraError && !startingCamera && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`p-2.5 rounded-full transition shadow-lg cursor-pointer ${
                        torchOn ? 'bg-amber-400 text-slate-950' : 'bg-black/50 text-white hover:bg-black/75'
                      }`}
                      title="Toggle Flashlight"
                    >
                      {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/75 transition shadow-lg cursor-pointer"
                    title="Switch Front/Back Camera"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Controls / Bottom Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {previewUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <div className="text-center hidden sm:block">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Photo Captured
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFallbackFile}
              />

              {/* Center Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  disabled={startingCamera || Boolean(cameraError)}
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all transform active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer shadow-xl hover:border-blue-400 group"
                  title="Take Photo"
                >
                  <span className="w-12 h-12 rounded-full bg-white group-hover:bg-blue-500 transition-colors" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
