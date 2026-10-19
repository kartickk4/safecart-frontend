import React, { useState } from 'react';
import { ShieldCheck, Box, RefreshCw, Eye, EyeOff, Lock, CheckCircle2, ArrowRight, UserCheck, ShoppingBag, Store, Package, X, Sparkles, ChevronRight, MapPin, Truck, AlertCircle, Gift, Tag } from 'lucide-react';
import { authAPI, profileAPI } from '../services/api';
import PhoneInput from '../components/PhoneInput';
import LegalComplianceView from './LegalComplianceView';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, googleProvider, signInWithPopup } from '../firebase';


export default function AuthView({ onAuthSuccess, onOpenPublicTrack }) {
  const [isSignUp, setIsSignUp] = useState(false);
  // Role is determined AFTER signup via the Role Identification Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalStep, setRoleModalStep] = useState(1); // 1: who are you? 2: platform type? 3: pickup address?
  const [pendingUser, setPendingUser] = useState(null); // user object waiting for role assignment
  const [pendingIsNew, setPendingIsNew] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState(''); // 'Supplier' | 'Receiver'
  const [selectedPlatform, setSelectedPlatform] = useState(''); // 'independent' | 'ecommerce'
  const [sellerAddress, setSellerAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [sellerAddressError, setSellerAddressError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLegalModal, setShowLegalModal] = useState(null); // null | 'contact' | 'terms' | 'refunds' | 'services'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  // Read referral code from URL ?ref=SK-XXXXX automatically
  const [referralCode, setReferralCode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('ref') || ''; } catch { return ''; }
  });

  // Post-Verification Referral Code Prompt Modal state
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralModalCode, setReferralModalCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralSuccess, setReferralSuccess] = useState('');
  const [userToOnboard, setUserToOnboard] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Send OTP, 2: Enter OTP & New Password, 3: Success
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Sign Up 2FA OTP state
  const [showSignUpOtpModal, setShowSignUpOtpModal] = useState(false);
  const [signUpOtp, setSignUpOtp] = useState('');
  const [signUpOtpErr, setSignUpOtpErr] = useState('');
  const [signUpOtpLoading, setSignUpOtpLoading] = useState(false);
  const [signUpDebugOtp, setSignUpDebugOtp] = useState('');

  // First-Time Google Sign Up Profile completion & SMS OTP modal state
  const [showGoogleFirstTimeModal, setShowGoogleFirstTimeModal] = useState(false);
  const [googleStep, setGoogleStep] = useState(1); // 1: Enter Name & Phone, 2: Enter SMS OTP
  const [googleProfileData, setGoogleProfileData] = useState({ fullName: '', phone: '' });
  const [googleOtpCode, setGoogleOtpCode] = useState('');
  const [googleDebugOtp, setGoogleDebugOtp] = useState('');
  const [googleProfileErr, setGoogleProfileErr] = useState('');
  const [googleProfileLoading, setGoogleProfileLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setResetErr('');
    setResetMsg('');
    setResetLoading(true);

    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail });
      setResetMsg(res.data?.message || `Password reset verification code sent to ${forgotEmail}`);
      if (res.data?.debugCode) {
        setSignUpDebugOtp(res.data.debugCode);
      }
      setResetStep(2);
    } catch (err) {
      setResetErr(err.response?.data?.error || 'Failed to send password reset code. Please verify email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetErr('Passwords do not match. Please re-enter.');
      return;
    }
    if (newPassword.length < 6) {
      setResetErr('Password must be at least 6 characters.');
      return;
    }

    setResetErr('');
    setResetMsg('');
    setResetLoading(true);

    try {
      await authAPI.resetPassword({ email: forgotEmail, code: resetOtp, newPassword });
      setResetStep(3);
    } catch (err) {
      setResetErr(err.response?.data?.error || 'Invalid or expired OTP verification code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    let googleUser = null;

    // Safety timeout in case popup hangs or is hidden behind browser window
    const popupTimeout = setTimeout(() => {
      setGoogleLoading(false);
      setError('Google Sign-In took too long or the popup was closed. Please try again.');
    }, 35000);

    try {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        googleUser = result.user;
      } catch (fbErr) {
        clearTimeout(popupTimeout);
        console.warn('Firebase Popup error:', fbErr);
        if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
          // User intentionally closed the popup
          setGoogleLoading(false);
          return;
        }
        if (fbErr.code === 'auth/popup-blocked') {
          setError('Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.');
          setGoogleLoading(false);
          return;
        }
        if (fbErr.code === 'auth/unauthorized-domain') {
          setError('Domain unauthorized in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.');
          setGoogleLoading(false);
          return;
        }
        // In local development or if Firebase keys are blocked/network fails, fallback for seamless testing
        if (window.location.hostname === 'localhost' && (fbErr.code === 'auth/configuration-not-found' || fbErr.code === 'auth/api-key-not-valid' || fbErr.code === 'auth/network-request-failed')) {
          console.warn('Local dev fallback: using demo Google user');
          googleUser = {
            email: email || 'google.user@example.com',
            displayName: fullName || 'Rahul Sharma',
            photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            uid: `google-user-${Date.now()}`
          };
        } else {
          throw new Error(fbErr.message || 'Google sign-in popup failed. Please try again.');
        }
      }

      if (!googleUser || !googleUser.email) {
        throw new Error('No email found from Google account.');
      }

      const res = await authAPI.googleAuth({
        email: googleUser.email,
        fullName: googleUser.displayName || googleUser.email.split('@')[0],
        avatarUrl: googleUser.photoURL || '',
        googleId: googleUser.uid,
        referralCode: referralCode || undefined
      });

      const { accessToken, user, isNewUser } = res.data;
      if (accessToken) {
        localStorage.setItem('securekaro_token', accessToken);
      }
      user.activeRole = user.role || 'User';
      setPendingUser(user);

      setGoogleLoading(false);

      // If user is newly created or missing phone number, prompt for SMS OTP Phone Verification
      if (isNewUser || !user.phone) {
        setGoogleProfileData({
          fullName: user.fullName || googleUser.displayName || googleUser.email.split('@')[0],
          phone: user.phone || ''
        });
        setGoogleStep(1);
        setGoogleProfileErr('');
        setShowGoogleFirstTimeModal(true);
      } else if (isNewUser || !user.role || user.role === 'User') {
        // Existing user without a role — show role identification
        triggerRoleModal(user, isNewUser);
      } else {
        onAuthSuccess(user, isNewUser);
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(err.response?.data?.error || err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      clearTimeout(popupTimeout);
      setGoogleLoading(false);
    }
  };

  const getValidatedTenDigitPhone = (phoneInput) => {
    if (!phoneInput) return null;
    let digits = phoneInput.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.length === 10) {
      return digits;
    }
    return null;
  };

  const handleSendGooglePhoneOtp = async (e) => {
    e.preventDefault();
    setGoogleProfileErr('');

    if (!googleProfileData.fullName) {
      setGoogleProfileErr('Please enter your Full Name.');
      return;
    }

    const tenDigit = getValidatedTenDigitPhone(googleProfileData.phone);
    if (!tenDigit) {
      setGoogleProfileErr('Phone number must be exactly 10 digits.');
      return;
    }

    const formattedPhone = `+91${tenDigit}`;
    setGoogleProfileLoading(true);

    try {
      // Dispatch SMS OTP code via Firebase or Backend Service
      try {
        setupRecaptcha();
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        window.googleConfirmationResult = confirmationResult;
        setGoogleDebugOtp('');
        setGoogleOtpCode('');
        setGoogleStep(2);
      } catch (fbErr) {
        console.warn('Firebase SMS Dispatch notice, falling back to backend OTP service:', fbErr);
        window.googleConfirmationResult = null;
        try {
          const otpRes = await authAPI.sendOtp({ phone: formattedPhone });
          if (otpRes.data?.debugCode) {
            setGoogleDebugOtp(otpRes.data.debugCode);
          }
          setGoogleOtpCode('');
          setGoogleStep(2);
        } catch (bkErr) {
          setGoogleProfileErr(bkErr.response?.data?.error || 'Failed to dispatch SMS verification code. Please check phone number.');
        }
      }
    } catch (err) {
      setGoogleProfileErr(err.message || 'Failed to send SMS verification code.');
    } finally {
      setGoogleProfileLoading(false);
    }
  };

  const handleVerifyGooglePhoneOtp = async (e) => {
    e.preventDefault();
    setGoogleProfileErr('');

    if (!googleOtpCode || googleOtpCode.trim().length < 6) {
      setGoogleProfileErr('Please enter the 6-digit SMS verification code.');
      return;
    }

    const tenDigit = getValidatedTenDigitPhone(googleProfileData.phone);
    if (!tenDigit) {
      setGoogleProfileErr('Phone number must be exactly 10 digits.');
      return;
    }

    const formattedPhone = `+91${tenDigit}`;
    setGoogleProfileLoading(true);

    try {
      // 1. Verify SMS OTP Code
      if (window.googleConfirmationResult) {
        try {
          await window.googleConfirmationResult.confirm(googleOtpCode);
        } catch (fbErr) {
          if (!(googleDebugOtp && googleOtpCode.trim() === googleDebugOtp.trim())) {
            setGoogleProfileErr('Invalid or expired SMS verification code.');
            setGoogleProfileLoading(false);
            return;
          }
        }
      } else {
        try {
          await authAPI.verifyOtp({ phone: formattedPhone, code: googleOtpCode, purpose: 'verification' });
        } catch (vErr) {
          if (googleDebugOtp && googleOtpCode.trim() === googleDebugOtp.trim()) {
            // Match allowed debug code
          } else {
            setGoogleProfileErr(vErr.response?.data?.error || 'Invalid or expired SMS verification code.');
            setGoogleProfileLoading(false);
            return;
          }
        }
      }

      // 2. OTP Verification passed! Now save user details & verified phone number to MongoDB
      const res = await profileAPI.updateProfile({
        fullName: googleProfileData.fullName,
        phone: formattedPhone,
        isPhoneVerified: true
      });

      const updatedUser = res.data;
      updatedUser.activeRole = updatedUser.role || 'User';

      setShowGoogleFirstTimeModal(false);
      // New Google user — prompt referral code after phone OTP verification
      promptReferralOrAdvance(updatedUser, true);
    } catch (err) {
      setGoogleProfileErr(err.response?.data?.error || 'Failed to save profile to MongoDB. Please try again.');
    } finally {
      setGoogleProfileLoading(false);
    }
  };

  const setupRecaptcha = () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
          'expired-callback': () => {
            try {
              if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
              }
            } catch(e){}
            window.recaptchaVerifier = null;
          }
        });
      }
    } catch (e) {
      console.warn('Recaptcha reuse notice:', e);
    }
  };


  const handleVerifySignUpOtp = async (e) => {
    e.preventDefault();
    setSignUpOtpErr('');
    setSignUpOtpLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      let otpVerifyData = null;

      // 1. Verify SMS OTP via Firebase or Backend API
      if (window.confirmationResult) {
        try {
          await window.confirmationResult.confirm(signUpOtp);
        } catch (fbErr) {
          if (!(signUpDebugOtp && signUpOtp.trim() === signUpDebugOtp.trim())) {
            setSignUpOtpErr('Invalid verification code entered or code expired.');
            setSignUpOtpLoading(false);
            return;
          }
        }
      }

      // 2. Always verify OTP with backend (it creates the user and returns token)
      try {
        const verifyRes = await authAPI.verifyOtp({ phone: formattedPhone, code: signUpOtp });
        otpVerifyData = verifyRes.data;
      } catch (vErr) {
        if (signUpDebugOtp && signUpOtp.trim() === signUpDebugOtp.trim()) {
          // Debug OTP fallback — continue without backend verify data
        } else {
          setSignUpOtpErr(vErr.response?.data?.error || 'Invalid or expired OTP code.');
          setSignUpOtpLoading(false);
          return;
        }
      }

      // 3. Use the token from verifyOtp (user already created by backend)
      //    Then update profile with fullName, email, and password
      if (otpVerifyData?.accessToken) {
        localStorage.setItem('securekaro_token', otpVerifyData.accessToken);

        // Update the auto-created user with the real name, email, and password
        try {
          const { profileAPI: pAPI } = await import('../services/api.js');
          await pAPI.updateProfile({ fullName, email });
        } catch (profileErr) {
          console.warn('Profile update after OTP signup:', profileErr.message);
        }

        // Try signup to set password — if user already exists, just proceed
        try {
          await authAPI.signup({ email, password, phone: formattedPhone, fullName, referralCode: referralCode || undefined });
        } catch (_) {
          // User already exists (created by verifyOtp) — this is expected, ignore
        }

        const registeredUser = {
          ...(otpVerifyData.user || {}),
          fullName: fullName || otpVerifyData.user?.fullName,
          email: email || otpVerifyData.user?.email,
          activeRole: 'User',
        };
        setShowSignUpOtpModal(false);
        // Account created & OTP verified — ask if user has a referral code
        promptReferralOrAdvance(registeredUser, true);
      } else {
        // Fallback: call signup directly (Firebase path or debug path)
        const res = await authAPI.signup({
          email,
          password,
          phone: formattedPhone,
          fullName,
          referralCode: referralCode || undefined
        });
        const registeredUser = res.data?.user || res.data;
        const token = res.data?.accessToken;
        if (token) {
          localStorage.setItem('securekaro_token', token);
        }
        registeredUser.activeRole = 'User';
        setShowSignUpOtpModal(false);
        // Account created & OTP verified — ask if user has a referral code
        promptReferralOrAdvance(registeredUser, true);
      }
    } catch (err) {
      setSignUpOtpErr(err.response?.data?.error || 'Verification or Registration failed. Please try again.');
    } finally {
      setSignUpOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName || !phone || !email || !password) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        // Dispatch OTP code and open verification modal
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
        try {
          setupRecaptcha();
          const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
          window.confirmationResult = confirmationResult;
          setSignUpDebugOtp('');
          setSignUpOtp('');
          setShowSignUpOtpModal(true);
          setLoading(false);
        } catch (fbErr) {
          console.warn('Firebase SMS Dispatch notice, using OTP service:', fbErr);
          window.confirmationResult = null;
          try {
            const otpRes = await authAPI.sendOtp({ phone: formattedPhone, email, role: selectedRole });
            if (otpRes.data?.debugCode) {
              setSignUpDebugOtp(otpRes.data.debugCode);
            }
            setSignUpOtp('');
            setShowSignUpOtpModal(true);
            setLoading(false);
          } catch (bkErr) {
            setError(bkErr.response?.data?.error || 'Failed to dispatch OTP code. Please check your phone number.');
            setLoading(false);
          }
        }
        return;

      } else {
        const res = await authAPI.login({ email, password });
        const { accessToken, user } = res.data;
        user.activeRole = user.role || 'User';
        localStorage.setItem('securekaro_token', accessToken);
        onAuthSuccess(user);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check your credentials and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Referral Code Prompt handler — asked after account creation and OTP verification
  const promptReferralOrAdvance = (user, isNew) => {
    // If user already has a referrer linked, or is not new, proceed directly to role modal
    if (!isNew || user?.referredBy) {
      triggerRoleModal(user, isNew);
      return;
    }
    setUserToOnboard(user);
    setReferralModalCode(referralCode || '');
    setReferralError('');
    setReferralSuccess('');
    setShowReferralModal(true);
  };

  const handleApplyReferralModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!referralModalCode || !referralModalCode.trim()) {
      setReferralError('Please enter a referral code or click Skip.');
      return;
    }

    setReferralLoading(true);
    setReferralError('');
    setReferralSuccess('');

    try {
      const res = await profileAPI.applyReferralCode(referralModalCode.trim().toUpperCase());
      const updatedUser = {
        ...(userToOnboard || {}),
        referredBy: res.data?.user?.referredBy || true
      };
      setReferralSuccess(res.data?.message || `Referral code ${referralModalCode.toUpperCase()} applied!`);
      setTimeout(() => {
        setShowReferralModal(false);
        triggerRoleModal(updatedUser, true);
      }, 1000);
    } catch (err) {
      setReferralError(err.response?.data?.error || 'Invalid referral code. Please check and try again, or click Skip.');
    } finally {
      setReferralLoading(false);
    }
  };

  const handleSkipReferralModal = () => {
    setShowReferralModal(false);
    triggerRoleModal(userToOnboard, true);
  };

  // Role Identification Modal trigger
  const triggerRoleModal = (user, isNew) => {
    setPendingUser(user);
    setPendingIsNew(isNew || false);
    setSelectedRoleType('');
    setSelectedPlatform('');
    setSellerAddress({
      street: user?.pickupAddress?.street || user?.address || '',
      city: user?.pickupAddress?.city || user?.city || '',
      state: user?.pickupAddress?.state || user?.state || '',
      pincode: user?.pickupAddress?.pincode || user?.pincode || '',
      landmark: user?.pickupAddress?.landmark || ''
    });
    setSellerAddressError('');
    setRoleModalStep(1);
    setShowRoleModal(true);
  };

  const handleRoleConfirm = async (overridePlatform, customAddress) => {
    if (!selectedRoleType) return;
    const finalRole = selectedRoleType; // 'Supplier' or 'Receiver'
    const platformType = overridePlatform || selectedPlatform || 'independent';

    const addrPayload = customAddress !== undefined ? customAddress : (finalRole === 'Supplier' && sellerAddress.street ? {
      address: sellerAddress.street,
      city: sellerAddress.city,
      state: sellerAddress.state,
      pincode: sellerAddress.pincode,
      pickupAddress: sellerAddress
    } : {});

    try {
      await profileAPI.updateProfile({ role: finalRole, platformType, ...addrPayload });
    } catch (e) {
      console.warn('Role/address update notice:', e.message);
    }
    const updatedUser = { 
      ...pendingUser, 
      role: finalRole, 
      activeRole: finalRole, 
      platformType,
      ...addrPayload
    };
    setShowRoleModal(false);
    onAuthSuccess(updatedUser, pendingIsNew);
  };

  const handleQuickDemo = () => {
    const mockUser = {
      _id: 'demo-user-123',
      fullName: 'Marcus Rivera',
      email: 'testuser@example.com',
      phone: '+919876543210',
      role: 'Supplier',
      activeRole: 'Supplier',
      escrowBalance: 12450.00
    };
    localStorage.setItem('securekaro_token', 'demo_jwt_token_123');
    onAuthSuccess(mockUser);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F9FC]">
      {/* LEFT HERO COLUMN - ROYAL BLUE SECUREKARO BRANDING */}
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
                SecureKaro
              </h1>
              <p className="text-xs text-blue-200 font-medium">Logistics Aggregator & Shipping Software</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-100 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            B2B Courier Booking & Delivery Protection Platform
          </div>
        </div>

        {/* Hero Copy & Feature Cards */}
        <div className="my-auto relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Ship with confidence.<br />
            Protected on delivery.
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-8">
            E-commerce Shipping Label & Parcel Tracking Tool with COD Protection. Multi-courier booking, live tracking, and digital doorstep sign-off protection.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Delivery Protection Suite</h3>
                <p className="text-xs text-blue-100 mt-0.5">Shipments and COD values are safeguarded until verified delivery confirmation.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Multi-Carrier Live Tracking</h3>
                <p className="text-xs text-blue-100 mt-0.5">Integrate Delhivery, Blue Dart, DTDC, and Shadowfax with live parcel milestones.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-4 transition hover:bg-white/15">
              <div className="p-2.5 rounded-xl bg-white/15 text-white">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Prompt Courier Settlement</h3>
                <p className="text-xs text-blue-100 mt-0.5">Fast automated settlement within 24 hours of confirmed delivery sign-off.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200 flex items-center justify-between border-t border-white/10 pt-4">
          <span>&copy; {new Date().getFullYear()} SecureKaro Logistics & Shipping Software</span>
          <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* RIGHT AUTH FORM COLUMN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">

          {/* MOBILE BRAND IDENTITY HEADER (SHOWN ONLY ON MOBILE PHONES) */}
          <div className="lg:hidden pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E56E3] via-[#1649CC] to-[#0D38A8] text-white flex items-center justify-center shadow-md shadow-blue-600/25">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black tracking-tight text-slate-900">SecureKaro</h1>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-[#1E56E3] border border-blue-200">
                    Logistics
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">B2B Courier Booking & Delivery Protection</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>SSL Secured</span>
            </div>
          </div>
          
          {/* Top Pill Tab Switcher */}
          <div className="flex justify-end">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 text-sm font-medium text-slate-600 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg transition-all text-center ${!isSignUp ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg transition-all text-center ${isSignUp ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isSignUp ? 'Create your SecureKaro account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isSignUp ? 'Join thousands of businesses streamlining courier shipping & delivery protection.' : 'Sign in to access your SecureKaro shipping dashboard and tracking.'}
            </p>
          </div>

          {/* Quick Public Parcel Tracking Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200/90 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1E56E3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Tracking an incoming parcel?</p>
                <p className="text-[11px] text-slate-500">Inspect courier milestones & delivery protection with zero login.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPublicTrack}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#1E56E3] border border-blue-200 text-xs font-black transition shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer hover:border-blue-300"
            >
              <span>Track Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>



          {/* Alert Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{error}</span>
              </div>

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
                  <PhoneInput
                    required
                    value={phone}
                    onChange={(val) => setPhone(val)}
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
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setShowForgotModal(true); setResetStep(1); }}
                    className="text-xs text-[#1E56E3] font-bold hover:underline"
                  >
                    Forgot password?
                  </button>
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

            {isSignUp && (
              <div className="pt-0.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Referral / Invite Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {referralCode && (
                    <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Invite Applied
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. SK-7L7RR"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-9"
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

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
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
            </button>
          </form>

          {/* Trust & Regulatory Guarantee Bar */}
          <div className="pt-2 flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-500 text-center">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>256-Bit SSL</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>RBI Regulated Trustee</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#1E56E3]" />
              <span>Instant UPI</span>
            </span>
          </div>

          {/* Cashfree Merchant Compliance Footer Links */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
            <button 
              type="button"
              onClick={() => setShowLegalModal('contact')} 
              className="hover:text-[#1E56E3] hover:underline transition"
            >
              Contact Us
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setShowLegalModal('terms')} 
              className="hover:text-[#1E56E3] hover:underline transition"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setShowLegalModal('refunds')} 
              className="hover:text-[#1E56E3] hover:underline transition"
            >
              Refunds & Cancellations
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setShowLegalModal('services')} 
              className="hover:text-[#1E56E3] hover:underline transition"
            >
              Products & Pricing (INR ₹)
            </button>
          </div>
        </div>
      </div>


      {/* FORGOT PASSWORD 2FA RESET MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center"
            >
              ✕
            </button>

            {/* STEP 1: Enter Email / Phone */}
            {resetStep === 1 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Reset Your Password</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter your registered email address to receive a 6-digit security OTP verification code.</p>
                </div>

                {resetErr && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">{resetErr}</div>
                )}

                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send OTP Verification Code</span>}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Enter Security Code</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter the 6-digit OTP code sent to <span className="font-bold text-slate-800">{forgotEmail}</span>.</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-[#1E56E3] font-semibold">
                  <span>💡 Security OTP: <span className="font-mono font-extrabold text-slate-900">489201</span></span>
                </div>

                {resetErr && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">{resetErr}</div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit OTP Code</label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="489201"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold text-slate-900 tracking-widest focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password & Unlock Account</span>}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Success */}
            {resetStep === 3 && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Password Reset Successful!</h3>
                  <p className="text-xs text-slate-500 mt-1">Your password has been updated. You can now sign in with your new password.</p>
                </div>
                <button
                  onClick={() => { setShowForgotModal(false); setPassword(newPassword || 'mySecurePassword123'); }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition font-bold"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIGN UP 2FA MOBILE OTP VERIFICATION MODAL */}
      {showSignUpOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              onClick={() => setShowSignUpOtpModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Verify Your Mobile Number</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit verification code sent via SMS to <span className="font-mono font-bold text-slate-900">{phone}</span> to complete your account registration.
              </p>
            </div>

            {signUpDebugOtp && (
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-[#1E56E3] font-semibold flex items-center justify-between">
                <span>💡 Verification Code:</span>
                <span className="font-mono font-black text-slate-900 text-sm tracking-wider bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                  {signUpDebugOtp}
                </span>
              </div>
            )}

            {signUpOtpErr && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">{signUpOtpErr}</div>
            )}

            <form onSubmit={handleVerifySignUpOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit SMS Security Code</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="------"
                  value={signUpOtp}
                  onChange={(e) => setSignUpOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono font-black text-slate-900 tracking-widest focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignUpOtpModal(false);
                    setSignUpOtp('');
                    setSignUpOtpErr('');
                  }}
                  className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={signUpOtpLoading}
                  className="flex-[2] py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                >
                  {signUpOtpLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Verify & Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* REFERRAL CODE PROMPT MODAL — Asked after account creation & OTP verification */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-[#1E56E3]" />

            {/* Skip button */}
            <button
              onClick={handleSkipReferralModal}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              title="Skip"
            >
              ✕
            </button>

            {/* Header with Gift Icon */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full inline-block mb-1">
                  SecureKaro Ambassador Program
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">Have a Referral Code?</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If a merchant friend or supplier invited you, enter their unique invite code (e.g. <span className="font-mono font-bold text-slate-900">SK-7L7RR</span>) to link your accounts. When your first order is safely delivered, they unlock ₹40 Pro Credit!
            </p>

            {referralModalCode && !referralError && (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Detected from invite pass: <span className="font-mono font-black">{referralModalCode}</span></span>
              </div>
            )}

            {referralSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{referralSuccess}</span>
              </div>
            )}

            {referralError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{referralError}</span>
              </div>
            )}

            <form onSubmit={handleApplyReferralModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Referral Code</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength="12"
                    placeholder="e.g. SK-7L7RR"
                    value={referralModalCode}
                    onChange={(e) => {
                      setReferralModalCode(e.target.value.toUpperCase());
                      setReferralError('');
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-black text-slate-900 tracking-wider uppercase focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    autoFocus
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={referralLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {referralLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Apply Code &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipReferralModal}
                  disabled={referralLoading}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  I don't have a code — Skip this step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE IDENTIFICATION MODAL — shown after OTP verification for new users */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-blue-950/25 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
            {/* Decorative gradient top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E56E3] via-blue-400 to-indigo-500 rounded-t-3xl" />

            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">One last step!</h3>
                <p className="text-xs text-slate-500">Help us personalise your SecureKaro experience</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${roleModalStep >= 1 ? 'bg-[#1E56E3]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${roleModalStep >= 2 ? 'bg-[#1E56E3]' : 'bg-slate-200'}`} />
              {selectedRoleType === 'Supplier' && (
                <div className={`h-1.5 flex-1 rounded-full transition-all ${roleModalStep >= 3 ? 'bg-[#1E56E3]' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* STEP 1: Who are you? */}
            {roleModalStep === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">Who are you on SecureKaro?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRoleType('Supplier')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-3 ${
                        selectedRoleType === 'Supplier'
                          ? 'border-[#1E56E3] bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedRoleType === 'Supplier' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">Seller / Supplier</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">I dispatch goods and want payment protection</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRoleType('Receiver')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-3 ${
                        selectedRoleType === 'Receiver'
                          ? 'border-[#1E56E3] bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedRoleType === 'Receiver' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">Buyer / Receiver</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">I receive goods and track delivery status</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedRoleType}
                  onClick={() => {
                    if (selectedRoleType === 'Receiver') {
                      // Receivers skip platform question — go directly to dashboard
                      handleRoleConfirm('independent', {});
                    } else {
                      setRoleModalStep(2);
                    }
                  }}
                  className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Platform type (only for Suppliers) */}
            {roleModalStep === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">How do you sell?</p>
                  <p className="text-xs text-slate-500 mb-4">This helps us tailor tools and features for your workflow.</p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlatform('independent')}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                        selectedPlatform === 'independent'
                          ? 'border-[#1E56E3] bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                        selectedPlatform === 'independent' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">Independent Seller</p>
                        <p className="text-[11px] text-slate-500">I run my own store, D2C brand, or personal business</p>
                      </div>
                      {selectedPlatform === 'independent' && <CheckCircle2 className="w-5 h-5 text-[#1E56E3] shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlatform('ecommerce')}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                        selectedPlatform === 'ecommerce'
                          ? 'border-[#1E56E3] bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                        selectedPlatform === 'ecommerce' ? 'bg-[#1E56E3] text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">E-Commerce Platform Seller</p>
                        <p className="text-[11px] text-slate-500">I sell on Amazon, Flipkart, Meesho, Shopify, etc.</p>
                      </div>
                      {selectedPlatform === 'ecommerce' && <CheckCircle2 className="w-5 h-5 text-[#1E56E3] shrink-0" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleModalStep(1)}
                    className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPlatform}
                    onClick={() => setRoleModalStep(3)}
                    className="flex-1 py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Set Pickup Address</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Seller Courier Pickup Address */}
            {roleModalStep === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E56E3]">
                      <Truck className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Where should couriers pick up parcels?</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Logistics partners (Delhivery, BlueDart, DTDC, India Post) will dispatch pickup executives to this address when you create shipments.
                  </p>
                </div>

                {sellerAddressError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sellerAddressError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Shop / Flat / Warehouse / Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop 12, Ground Floor, MG Road Market / Plot 44 Industrial Area"
                      value={sellerAddress.street}
                      onChange={(e) => setSellerAddress({ ...sellerAddress, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City / District *</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru / Mumbai"
                        value={sellerAddress.city}
                        onChange={(e) => setSellerAddress({ ...sellerAddress, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka / Maharashtra"
                        value={sellerAddress.state}
                        onChange={(e) => setSellerAddress({ ...sellerAddress, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                        value={sellerAddress.pincode}
                        onChange={(e) => setSellerAddress({ ...sellerAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nearby Landmark (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Opp Metro Station"
                        value={sellerAddress.landmark}
                        onChange={(e) => setSellerAddress({ ...sellerAddress, landmark: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoleModalStep(2)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!sellerAddress.street || !sellerAddress.pincode || sellerAddress.pincode.length !== 6) {
                        setSellerAddressError('Please enter your street address and a valid 6-digit pincode.');
                        return;
                      }
                      setSellerAddressError('');
                      handleRoleConfirm();
                    }}
                    className="flex-1 py-3 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                  >
                    <span>Save Pickup Address & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleRoleConfirm(undefined, {})}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline"
                  >
                    I'll add pickup address later from my profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASHFREE MERCHANT LEGAL COMPLIANCE POPUP MODAL */}
      {showLegalModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#F7F9FC] rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative my-8">
            <button
              onClick={() => setShowLegalModal(null)}
              className="absolute right-6 top-6 z-20 w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <LegalComplianceView initialTab={showLegalModal} />
          </div>
        </div>
      )}

      {/* FIRST-TIME GOOGLE SIGN UP SMS PHONE VERIFICATION MODAL */}
      {showGoogleFirstTimeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              type="button"
              onClick={() => {
                setShowGoogleFirstTimeModal(false);
                if (pendingUser) {
                  if (!pendingUser.role || pendingUser.role === 'User') {
                    triggerRoleModal(pendingUser, isSignUp);
                  } else {
                    onAuthSuccess(pendingUser, isSignUp);
                  }
                }
              }}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close and continue"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>

            {googleStep === 1 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Verify Mobile Number</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete your Google sign-up by verifying your mobile phone number with a 6-digit SMS OTP code.
                  </p>
                </div>

                {googleProfileErr && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {googleProfileErr}
                  </div>
                )}

                <form onSubmit={handleSendGooglePhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Rahul Sharma"
                      value={googleProfileData.fullName}
                      onChange={(e) => setGoogleProfileData({ ...googleProfileData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <PhoneInput
                      required
                      value={googleProfileData.phone}
                      onChange={(val) => setGoogleProfileData({ ...googleProfileData, phone: val })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={googleProfileLoading}
                    className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    {googleProfileLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send SMS Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {googleStep === 2 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Enter 6-Digit Security Code</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the 6-digit SMS verification code sent to <span className="font-mono font-bold text-slate-900">{googleProfileData.phone}</span>.
                  </p>
                </div>

                {googleDebugOtp && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-[#1E56E3] font-semibold flex items-center justify-between">
                    <span>💡 Verification Code:</span>
                    <span className="font-mono font-black text-slate-900 text-sm tracking-wider bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                      {googleDebugOtp}
                    </span>
                  </div>
                )}

                {googleProfileErr && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {googleProfileErr}
                  </div>
                )}

                <form onSubmit={handleVerifyGooglePhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit SMS Security Code</label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="------"
                      value={googleOtpCode}
                      onChange={(e) => setGoogleOtpCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono font-black text-slate-900 tracking-widest focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setGoogleStep(1); setGoogleProfileErr(''); }}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={googleProfileLoading}
                      className="flex-1 py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-xs"
                    >
                      {googleProfileLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Verify</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleFirstTimeModal(false);
                  if (pendingUser) {
                    if (!pendingUser.role || pendingUser.role === 'User') {
                      triggerRoleModal(pendingUser, isSignUp);
                    } else {
                      onAuthSuccess(pendingUser, isSignUp);
                    }
                  }
                }}
                className="text-xs text-slate-400 hover:text-[#1E56E3] font-semibold transition cursor-pointer"
              >
                Skip for now &amp; continue to dashboard →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
