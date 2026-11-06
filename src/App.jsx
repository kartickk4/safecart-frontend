import React, { useState, useEffect, Suspense, lazy, startTransition } from 'react';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import ShipmentsListView from './views/ShipmentsListView';
import { lazyWithRetry } from './utils/lazyWithRetry';

// ⚡ PERFORMANCE: Heavy views lazy-loaded on demand with auto-retry on fresh deployments (<350KB initial bundle)
const CreateShipmentView = lazyWithRetry(() => import('./views/CreateShipmentView'));
const TrackingView = lazyWithRetry(() => import('./views/TrackingView'));
const DeliveryConfirmView = lazyWithRetry(() => import('./views/DeliveryConfirmView'));
const NotificationsView = lazyWithRetry(() => import('./views/NotificationsView'));
const ProfileView = lazyWithRetry(() => import('./views/ProfileView'));
const SupportView = lazyWithRetry(() => import('./views/SupportView'));
const LegalComplianceView = lazyWithRetry(() => import('./views/LegalComplianceView'));
const ReturnOrdersView = lazyWithRetry(() => import('./views/ReturnOrdersView'));
const PublicPayView = lazyWithRetry(() => import('./views/PublicPayView'));
const PublicTrackingView = lazyWithRetry(() => import('./views/PublicTrackingView'));
const AIAgentView = lazyWithRetry(() => import('./views/AIAgentView'));
const PhotoReviewResponseView = lazyWithRetry(() => import('./views/PhotoReviewResponseView'));
const ReferralView = lazyWithRetry(() => import('./views/ReferralView'));
const PublicQrConfirmView = lazyWithRetry(() => import('./views/PublicQrConfirmView'));
const AdminView = lazyWithRetry(() => import('./views/AdminView'));
const ROISavingsCalculatorView = lazyWithRetry(() => import('./views/ROISavingsCalculatorView'));

import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Modals code-split on demand with auto-retry
const CreateShipmentModal = lazyWithRetry(() => import('./components/CreateShipmentModal'));
const ShipmentDetailsModal = lazyWithRetry(() => import('./components/ShipmentDetailsModal'));
const WalletModal = lazyWithRetry(() => import('./components/WalletModal'));
const RoleSelectionModal = lazyWithRetry(() => import('./components/RoleSelectionModal'));
const WelcomeAnimationModal = lazyWithRetry(() => import('./components/WelcomeAnimationModal'));

// Sleek minimal fallback loading spinner
const ViewLoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[350px] animate-fade-in select-none">
    <div className="w-9 h-9 border-[3px] border-blue-100 border-t-[#1E56E3] rounded-full animate-spin shadow-xs" />
    <span className="text-xs font-bold text-slate-500 tracking-wide mt-3">Loading SecureKaro...</span>
  </div>
);
import AgentWidget from './components/AgentWidget';
import SplashScreen from './components/SplashScreen';
import AdBanner from './components/AdBanner';
import BottomNav from './components/BottomNav';
import { profileAPI, authAPI, notificationAPI, clearApiCache, rewardAPI, walletAPI, shipmentAPI } from './services/api';
import { LayoutDashboard, Navigation, PlusCircle, CheckCircle2, User, Bell, ShieldCheck, Wallet, Truck, ShoppingBag, ArrowLeftRight, Crown, Sparkles } from 'lucide-react';

import { TAB_ROUTES, ROUTE_TABS, TAB_TITLES, getTabFromLocation } from './utils/routes';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('securekaro_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // If user profile is already cached in localStorage, start with loading = false so UI renders instantly!
  const [loading, setLoading] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('securekaro_token') : null;
    const cached = typeof window !== 'undefined' ? localStorage.getItem('securekaro_user') : null;
    return Boolean(token && !cached);
  });
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    // Don't show splash for direct utility deep-links (public photo review, public qr confirmation, direct pay)
    if (
      path.startsWith('/photo-review') || 
      path.startsWith('/qr-confirm') || 
      path.startsWith('/pay/') ||
      path.startsWith('/terms') ||
      path.startsWith('/privacy') ||
      path.startsWith('/refund') ||
      path.startsWith('/shipping') ||
      path.startsWith('/contact') ||
      path.startsWith('/legal') ||
      path.startsWith('/pricing') ||
      path.startsWith('/support') ||
      path.startsWith('/track')
    ) {
      return false;
    }
    // Check if splash was already shown during this browser session
    // Splash screen always greets the user on first session open:
    // - Before Login page if logged out
    // - Before Dashboard if logged in
    try {
      const seen = sessionStorage.getItem('securekaro_splash_seen');
      return !seen;
    } catch (_) {
      return true;
    }
  });
  const [slowServerWarning, setSlowServerWarning] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutStep, setSignOutStep] = useState('');
  const [currentTab, _setCurrentTab] = useState(() => getTabFromLocation());
  const [roleNotification, setRoleNotification] = useState(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setSlowServerWarning(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [loading]);

  // Central navigation dispatcher that updates React state, URL path in history, and page title
  const setCurrentTab = (nextTab, options = {}) => {
    const targetTab = typeof nextTab === 'function' ? nextTab(currentTab) : nextTab;
    if (!targetTab) return;

    startTransition(() => {
      _setCurrentTab(targetTab);
    });

    if (typeof window !== 'undefined') {
      const targetRoute = TAB_ROUTES[targetTab] || `/${targetTab}`;
      const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

      if (options.replace) {
        window.history.replaceState({ tab: targetTab }, '', targetRoute);
      } else if (currentPath !== targetRoute) {
        window.history.pushState({ tab: targetTab }, '', targetRoute);
      }

      document.title = TAB_TITLES[targetTab] || 'SecureKaro — Logistics Aggregator & Shipping Software';
    }
  };

  // Synchronize initial document.title, history URL, and handle browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ensure the browser address bar immediately reflects the full clean route on initial load (e.g. /dashboard)
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const targetRoute = TAB_ROUTES[currentTab] || `/${currentTab}`;
    if (currentPath === '/' || currentPath !== targetRoute) {
      window.history.replaceState({ tab: currentTab }, '', targetRoute);
    }

    // Set initial title based on initial route
    document.title = TAB_TITLES[currentTab] || 'SecureKaro — Logistics Aggregator & Shipping Software';

    const handlePopState = () => {
      const tab = getTabFromLocation();
      startTransition(() => {
        _setCurrentTab(tab);
      });
      document.title = TAB_TITLES[tab] || 'SecureKaro — Logistics Aggregator & Shipping Software';
    };

    const handleNavigateTab = (e) => {
      if (e.detail) {
        setCurrentTab(e.detail);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigate-tab', handleNavigateTab);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigate-tab', handleNavigateTab);
    };
  }, []);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [repeatShipmentData, setRepeatShipmentData] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isPublicTrackingActive, setIsPublicTrackingActive] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [notifCount, setNotifCount] = useState(0);


  useEffect(() => {
    checkAuth();
  }, []);

  const isSupplier = user?.role === 'Supplier' || user?.activeRole === 'Supplier';

  const refreshCounts = async () => {
    if (!localStorage.getItem('securekaro_token')) return;
    try {
      const notifRes = await notificationAPI.getUnreadCount();
      if (notifRes?.data?.count !== undefined) {
        setNotifCount(notifRes.data.count);
      }
    } catch (e) {
      console.warn('Failed to fetch counts:', e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCounts();
    } else {
      setNotifCount(0);
    }
  }, [user, currentTab]);

  useEffect(() => {
    if (user && !isSupplier && (currentTab === 'dashboard' || currentTab === 'create-shipment' || currentTab === 'return-orders' || currentTab === 'ai-agent')) {
      setCurrentTab('shipments-list');
    }
  }, [user, currentTab, isSupplier]);

  // Automatically prefetch wallet balance in background on load / login
  const prefetchWalletInBackground = async (activeUser) => {
    if (!localStorage.getItem('securekaro_token')) return;
    try {
      const isSupp = (activeUser?.role === 'Supplier' || activeUser?.activeRole === 'Supplier');
      // Fire wallet balance, ledger transactions, and shipments in background without blocking main UI
      const [walletRes, rewardRes, txRes, shipRes, quotaRes] = await Promise.allSettled([
        walletAPI.getBalance(),
        rewardAPI.getRewardWallet(),
        walletAPI.getTransactions({ limit: 50 }),
        shipmentAPI.getShipments(isSupp ? 'Supplier' : 'Receiver'),
        isSupp ? shipmentAPI.getGatewayFeeStatus() : Promise.resolve()
      ]);

      if (shipRes.status === 'fulfilled' && Array.isArray(shipRes.value?.data)) {
        try {
          const roleKey = isSupp ? 'Supplier' : 'Receiver';
          localStorage.setItem('securekaro_dashboard_shipments_' + roleKey, JSON.stringify(shipRes.value.data));
          sessionStorage.setItem('securekaro_dashboard_shipments', JSON.stringify(shipRes.value.data));
        } catch (_) {}
      }

      if (quotaRes.status === 'fulfilled' && quotaRes.value?.data) {
        try {
          localStorage.setItem('securekaro_dashboard_gateway', JSON.stringify(quotaRes.value.data));
          sessionStorage.setItem('securekaro_dashboard_gateway', JSON.stringify(quotaRes.value.data));
        } catch (_) {}
      }

      let updatedBalances = {};
      if (rewardRes.status === 'fulfilled' && rewardRes.value?.data) {
        const rData = rewardRes.value.data;
        if (rData.totalWalletBalance !== undefined) updatedBalances.totalWalletBalance = rData.totalWalletBalance;
        if (rData.withdrawableBalance !== undefined) updatedBalances.withdrawableBalance = rData.withdrawableBalance;
        if (rData.pendingConfirmationBalance !== undefined) updatedBalances.pendingConfirmationBalance = rData.pendingConfirmationBalance;
        if (rData.cashbackBalance !== undefined) updatedBalances.cashbackBalance = rData.cashbackBalance;
        if (rData.walletBalance !== undefined) updatedBalances.walletBalance = rData.walletBalance;
      }

      if (walletRes.status === 'fulfilled' && walletRes.value?.data) {
        const wData = walletRes.value.data;
        if (wData.walletBalance !== undefined && updatedBalances.walletBalance === undefined) {
          updatedBalances.walletBalance = wData.walletBalance;
        }
      }

      if (Object.keys(updatedBalances).length > 0) {
        setUser(prev => {
          if (!prev) return prev;
          const merged = { ...prev, ...updatedBalances };
          try {
            localStorage.setItem('securekaro_user', JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Background wallet prefetch notice:', err);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('securekaro_token');
    if (!token) {
      setLoading(false);
      setUser(null);
      localStorage.removeItem('securekaro_user');
      return;
    }

    try {
      // 8-second timeout guard to prevent freezing if Render backend is sleeping
      const res = await Promise.race([
        profileAPI.getProfile(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 8000))
      ]);

      const savedRole = localStorage.getItem('securekaro_active_role');
      const loadedUser = res.data;
      if (savedRole && (savedRole === 'Supplier' || savedRole === 'Receiver')) {
        loadedUser.activeRole = savedRole;
      }
      setUser(loadedUser);
      localStorage.setItem('securekaro_user', JSON.stringify(loadedUser));
      prefetchWalletInBackground(loadedUser);
    } catch (err) {
      console.warn('Backend profile API check notice:', err.message);
      // Only clear credentials if explicitly rejected as 401/403 Unauthorized
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('securekaro_token');
        localStorage.removeItem('securekaro_user');
        setUser(null);
      }
      // If network timeout or cold start, keep the cached user so dashboard stays functional
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (userData, newUserFlag) => {
    const savedRole = localStorage.getItem('securekaro_active_role');
    if (savedRole && (savedRole === 'Supplier' || savedRole === 'Receiver')) {
      userData.activeRole = savedRole;
    }
    setUser(userData);
    localStorage.setItem('securekaro_user', JSON.stringify(userData));
    setIsNewUser(!!newUserFlag);
    setShowWelcomeModal(true);

    // Refresh complete profile in background to guarantee isPro and balances are in sync
    try {
      const res = await profileAPI.getProfile();
      if (res.data) {
        const fullUser = {
          ...res.data,
          activeRole: savedRole || res.data.role || userData.activeRole
        };
        setUser(fullUser);
        localStorage.setItem('securekaro_user', JSON.stringify(fullUser));
        prefetchWalletInBackground(fullUser);
      } else {
        prefetchWalletInBackground(userData);
      }
    } catch (e) {
      prefetchWalletInBackground(userData);
      console.warn('Profile sync on auth success notice:', e);
    }
  };

  const handleSwitchRole = (targetRole) => {
    const nextRole = targetRole === 'Supplier' ? 'Supplier' : 'Receiver';
    const currentRole = isSupplier ? 'Supplier' : 'Receiver';
    if (currentRole === nextRole) {
      return;
    }

    // 1. Cache current role user and token so switching back is instant
    try {
      if (user) {
        sessionStorage.setItem('securekaro_role_user_' + currentRole, JSON.stringify(user));
      }
      const curToken = localStorage.getItem('securekaro_token');
      if (curToken) {
        sessionStorage.setItem('securekaro_role_token_' + currentRole, curToken);
      }
    } catch (_) {}

    // 2. Clear API cache and update active role
    clearApiCache();
    localStorage.setItem('securekaro_active_role', nextRole);

    // 3. Switch Tab to matching portal immediately
    if (nextRole === 'Supplier') {
      if (currentTab === 'delivery-confirm' || currentTab === 'return-tracking') {
        setCurrentTab('dashboard');
      }
    } else {
      if (currentTab === 'dashboard' || currentTab === 'create-shipment' || currentTab === 'return-orders' || currentTab === 'ai-agent') {
        setCurrentTab('shipments-list');
      }
    }

    // 4. Show smooth visual notification toast
    setRoleNotification({
      role: nextRole,
      title: nextRole === 'Supplier' ? 'Switched to Supplier Mode' : 'Switched to Receiver Mode',
      desc: nextRole === 'Supplier' 
        ? 'Merchant Portal: Create shipments, manage orders, pickups & shipping settlements.' 
        : 'Buyer Portal: Inspect incoming parcels, sign-off deliveries & manage orders.'
    });

    setTimeout(() => {
      setRoleNotification(null);
    }, 3800);

    // 5. Restore target role immediately from cache (0ms delay, no wrong numbers)
    let cachedUser = null;
    try {
      const cachedToken = sessionStorage.getItem('securekaro_role_token_' + nextRole);
      if (cachedToken) {
        localStorage.setItem('securekaro_token', cachedToken);
      }
      const rawUser = sessionStorage.getItem('securekaro_role_user_' + nextRole);
      if (rawUser) {
        cachedUser = JSON.parse(rawUser);
      }
    } catch (_) {}

    if (cachedUser) {
      setUser({ ...cachedUser, role: nextRole, activeRole: nextRole });
    } else {
      // If first time switching, clean reset balances for the target role
      setUser(prev => ({
        ...prev,
        role: nextRole,
        activeRole: nextRole,
        walletBalance: 0,
        cashbackBalance: 0,
        totalWalletBalance: 0,
        withdrawableBalance: 0,
        pendingConfirmationBalance: 0
      }));
    }

    // 6. Sync with backend in background without blocking UI
    authAPI.switchRole(nextRole)
      .then(res => {
        if (res.data?.accessToken) {
          localStorage.setItem('securekaro_token', res.data.accessToken);
          try {
            sessionStorage.setItem('securekaro_role_token_' + nextRole, res.data.accessToken);
          } catch (_) {}
        }
        if (res.data?.user) {
          const syncedUser = {
            ...res.data.user,
            activeRole: nextRole
          };
          setUser(syncedUser);
          try {
            sessionStorage.setItem('securekaro_role_user_' + nextRole, JSON.stringify(syncedUser));
          } catch (_) {}
          prefetchWalletInBackground(syncedUser);
        }
      })
      .catch(err => {
        console.warn('Background role switch notice:', err?.message || err);
      });
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    if (isNewUser) {
      setIsRoleModalOpen(true);
    }
  };

  const handleSignOut = () => {
    setIsSigningOut(true);
    setSignOutStep('Securing active session...');

    setTimeout(() => {
      setSignOutStep('Clearing authentication tokens...');
    }, 500);

    setTimeout(() => {
      localStorage.removeItem('securekaro_token');
      localStorage.removeItem('securekaro_active_role');
      localStorage.removeItem('securekaro_user');
      setUser(null);
      setCurrentTab('dashboard'); // Reset tab so next login starts fresh
      setIsSigningOut(false);
      setSignOutStep('');
    }, 1200);
  };


  // Check if visitor is accessing a public payment link (/pay/:id or ?pay=:id)
  const getPayShipmentId = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/pay/')) {
      const parts = path.split('/pay/')[1];
      return parts ? decodeURIComponent(parts.split('/')[0]) : null;
    }
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('pay');
  };

  // Check if visitor is accessing a photo review response link (/photo-review/:id/:action)
  const getPhotoReviewParams = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/^\/photo-review\/([^/]+)\/(accept|skip)/);
    if (match) return { shipmentId: decodeURIComponent(match[1]), action: match[2] };
    return null;
  };

  // Check if visitor is accessing public tracking (/track, /track/:id, or ?track=:id)
  const getPublicTrackParams = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const phone = searchParams.get('phone') || '';

    if (path.startsWith('/track')) {
      const parts = path.split('/track')[1];
      const trackingId = parts ? decodeURIComponent(parts.replace(/^\//, '').split('/')[0]) : (searchParams.get('id') || searchParams.get('track') || '');
      return { isTracking: true, trackingId, phone };
    }

    if (searchParams.has('track') || searchParams.has('tracking')) {
      return {
        isTracking: true,
        trackingId: searchParams.get('track') || searchParams.get('tracking') || '',
        phone
      };
    }

    return null;
  };

  // Check if visitor is accessing public QR delivery confirmation (/qr-confirm/:token)
  const getQrConfirmToken = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/^\/qr-confirm\/([^/]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    // Also support ?qr=token query param (fallback for SMS links)
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('qr') || null;
  };

  const photoReviewParams = getPhotoReviewParams();
  const publicPayShipmentId = getPayShipmentId();
  const publicTrackParams = getPublicTrackParams();
  const qrConfirmToken = getQrConfirmToken();

  // Render public photo review response page (no login needed)
  if (photoReviewParams) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PhotoReviewResponseView
          shipmentId={photoReviewParams.shipmentId}
          action={photoReviewParams.action}
        />
      </Suspense>
    );
  }

  // Render public QR delivery confirmation page (no login needed) — receiver scans QR from inside parcel
  if (qrConfirmToken) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicQrConfirmView qrToken={qrConfirmToken} />
      </Suspense>
    );
  }

  // Render public payment checkout directly with zero login barriers
  if (publicPayShipmentId) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicPayView
          shipmentId={publicPayShipmentId}
          onPaymentComplete={(paidShipment) => {
            console.log('Public payment successfully processed for:', paidShipment?.shipmentId);
          }}
        />
      </Suspense>
    );
  }

  // Render animated native splash screen on app boot / session resolution
  if (showSplash || loading) {
    return (
      <SplashScreen
        isSlowServer={slowServerWarning}
        onComplete={() => {
          setShowSplash(false);
          try {
            sessionStorage.setItem('securekaro_splash_seen', 'true');
          } catch (_) {}
        }}
        onSkip={() => {
          setShowSplash(false);
          setLoading(false);
          setUser(null);
          try {
            sessionStorage.setItem('securekaro_splash_seen', 'true');
          } catch (_) {}
        }}
      />
    );
  }

  // Allow unauthenticated visitors to track parcels publicly with zero login barriers
  if (!user && (publicTrackParams || isPublicTrackingActive || currentTab === 'track')) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicTrackingView
          initialTrackingId={publicTrackParams?.trackingId || ''}
          initialPhone={publicTrackParams?.phone || ''}
          onBackToAuth={() => {
            setIsPublicTrackingActive(false);
            setCurrentTab('dashboard');
          }}
        />
      </Suspense>
    );
  }

  const isLegalTab = ['legal', 'contact', 'terms', 'privacy', 'shipping', 'refunds', 'services'].includes(currentTab);

  // Allow unauthenticated visitors to view standalone public pages (legal, support, roi-calculator)
  if (!user && (isLegalTab || currentTab === 'support' || currentTab === 'roi-calculator')) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-slate-800">
        <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 sticky top-0 z-30 shadow-xs flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentTab('dashboard');
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <img 
              src="/logo.jpg" 
              alt="SecureKaro" 
              className="w-9 h-9 rounded-xl object-cover shadow-md shadow-blue-500/15 border border-slate-200/80 bg-white" 
            />
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight block">SecureKaro</span>
              <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">Logistics & Shipping Platform</span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('roi-calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === 'roi-calculator' ? 'bg-blue-50 text-[#1E56E3]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculator
            </button>
            <button
              onClick={() => setCurrentTab('support')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === 'support' ? 'bg-blue-50 text-[#1E56E3]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Support
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isLegalTab ? 'bg-blue-50 text-[#1E56E3]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Legal & Compliance
            </button>
            <button
              onClick={() => {
                setCurrentTab('dashboard');
              }}
              className="px-4 py-2 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              Sign In / Register →
            </button>
          </div>
        </header>

        <main className="flex-1 pb-16 overflow-y-auto">
          <Suspense fallback={<ViewLoadingFallback />}>
            {isLegalTab && (
              <LegalComplianceView 
                initialTab={currentTab === 'legal' ? 'contact' : currentTab}
                onTabChange={(nextTab) => setCurrentTab(nextTab)}
              />
            )}
            {currentTab === 'support' && <SupportView />}
            {currentTab === 'roi-calculator' && (
              <ROISavingsCalculatorView
                onNavigateCreateShipment={() => {
                  setCurrentTab('dashboard');
                }}
              />
            )}
          </Suspense>
        </main>

        <footer className="bg-white border-t border-slate-200 py-8 px-4 md:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <div className="font-extrabold text-slate-800 text-sm">M/s SecureKaro (SecureKaro Logistics)</div>
              <div>Proprietor: Kartick Das • Nimta, North Dum Dum Municipality, Kolkata, West Bengal 700049</div>
              <div>Trade Licence: 0917P453826577951 • Helpline: +91 70442 55626 / 1800-723-3227</div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-slate-600">
              <a href="/contact" onClick={(e) => { e.preventDefault(); setCurrentTab('contact'); }} className="hover:text-[#1E56E3]">Contact Us</a>
              <span>•</span>
              <a href="/terms" onClick={(e) => { e.preventDefault(); setCurrentTab('terms'); }} className="hover:text-[#1E56E3]">Terms & Conditions</a>
              <span>•</span>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); setCurrentTab('privacy'); }} className="hover:text-[#1E56E3]">Privacy Policy</a>
              <span>•</span>
              <a href="/shipping" onClick={(e) => { e.preventDefault(); setCurrentTab('shipping'); }} className="hover:text-[#1E56E3]">Shipping Policy</a>
              <span>•</span>
              <a href="/refund" onClick={(e) => { e.preventDefault(); setCurrentTab('refunds'); }} className="hover:text-[#1E56E3]">Refund Policy</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Render Authentication View if no active session
  if (!user) {
    return (
      <AuthView
        onAuthSuccess={handleAuthSuccess}
        onOpenPublicTrack={() => setIsPublicTrackingActive(true)}
      />
    );
  }

  // Master Admin Executive Console (Strict Role Check)
  const isUserAdmin = Boolean(
    user?.role === 'Admin' ||
    user?.role === 'super_admin' ||
    user?.isAdmin === true ||
    user?.adminRole ||
    user?.email?.toLowerCase().trim() === 'kartickdas6289@gmail.com'
  );

  if (currentTab === 'admin') {
    if (!isUserAdmin) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-2xl font-bold">
              🚫
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 text-sm mb-6">
              You do not have administrative credentials to access this area. This incident has been logged.
            </p>
            <button
              onClick={() => setCurrentTab(isSupplier ? 'dashboard' : 'shipments-list')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all"
            >
              Return to Portal
            </button>
          </div>
        </div>
      );
    }
    return (
      <AdminView
        user={user}
        onBackToApp={() => setCurrentTab(isSupplier ? 'dashboard' : 'shipments-list')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex text-slate-800 selection:bg-blue-500 selection:text-white relative">
      
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        currentRole={isSupplier ? 'Supplier' : 'Receiver'}
        onSwitchRole={handleSwitchRole}
        onSignOut={handleSignOut}
        openNewShipmentModal={() => setCurrentTab('create-shipment')}
        notifCount={notifCount}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentTab !== 'ai-agent' && (
          <Header
            user={user}
            currentRole={isSupplier ? 'Supplier' : 'Receiver'}
            onSwitchRole={handleSwitchRole}
            onRefresh={() => window.location.reload()}
            openNewShipmentModal={() => setCurrentTab('create-shipment')}
            onOpenAiAgent={() => setCurrentTab('ai-agent')}
            onOpenAdmin={() => setCurrentTab('admin')}
            onOpenWallet={() => setCurrentTab('wallet')}
            onSignOut={handleSignOut}
          />
        )}

        {/* TOP OF SCREEN AD BANNER (Hidden on AI Agent and transaction forms) */}
        {currentTab !== 'ai-agent' && currentTab !== 'create-shipment' && currentTab !== 'delivery-confirm' && (
          <div className="px-4 md:px-8 pt-2 pb-2 max-w-7xl mx-auto w-full">
            <AdBanner onNavigateTrack={() => setCurrentTab('track')} />
          </div>
        )}

        {/* SUSPENSE FOR ALL ROUTE VIEWS */}
        <Suspense fallback={<ViewLoadingFallback />}>
        {/* AI AGENT: Full-screen, no padding, no extra scroll */}
        {currentTab === 'ai-agent' ? (
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <AIAgentView onBack={() => setCurrentTab(isSupplier ? 'dashboard' : 'shipments-list')} />
          </div>
        ) : (
        <main className="flex-1 pb-28 md:pb-12 overflow-y-auto overflow-x-hidden w-full min-w-0">
          <div key={`${currentTab}_${isSupplier ? 'Supplier' : 'Receiver'}`} className="view-enter min-h-full">
          {/* VIEW 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
              openNewShipmentModal={() => setCurrentTab('create-shipment')}
              onNavigateRefer={() => setCurrentTab('refer')}
            />
          )}

          {/* VIEW: ROI & TRANSPARENCY SAVINGS CALCULATOR */}
          {currentTab === 'roi-calculator' && (
            <ROISavingsCalculatorView
              onNavigateCreateShipment={() => setCurrentTab('create-shipment')}
            />
          )}

          {/* VIEW 2: ALL SHIPMENTS TABLE / MY ORDERS & PACKAGES */}
          {currentTab === 'shipments-list' && (
            <ShipmentsListView
              user={user}
              isSupplier={isSupplier}
              currentRole={isSupplier ? 'Supplier' : 'Receiver'}
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
              openNewShipmentModal={isSupplier ? () => setCurrentTab('create-shipment') : undefined}
              onRepeatShipment={(ship) => {
                setRepeatShipmentData({
                  receiverName: ship?.receiverName || '',
                  receiverPhone: ship?.receiverPhone || '',
                  receiverAddress: ship?.receiverAddress || '',
                  receiverPincode: ship?.receiverPincode || '',
                  parcelWeight: ship?.parcelWeight ? String(ship?.parcelWeight) : '0.5',
                  description: ship?.description || '',
                  amount: ship?.amount ? String(ship?.amount) : '',
                  cityRoute: ship?.city || '',
                  returnAllowed: ship?.returnAllowed !== false,
                  rtoProtectionEnabled: Boolean(ship?.rtoProtectionEnabled),
                  repeatSourceId: ship?.shipmentId || ''
                });
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {/* VIEW 3: CREATE SHIPMENT WIZARD + SHIPMENT SUCCESS CONFIRMATION (SUPPLIER ONLY) */}
          {currentTab === 'create-shipment' && (
            isSupplier ? (
              <CreateShipmentView
                user={user}
                onOpenProfile={() => setCurrentTab('profile')}
                onBack={() => setCurrentTab('dashboard')}
                onCreated={(newShipment) => setSelectedShipment(newShipment)}
                onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
              />
            ) : (
              <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto font-bold">
                  ⚠️
                </div>
                <h2 className="text-lg font-black text-slate-900">Supplier Feature Only</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Only verified merchants and suppliers can create protected parcel shipments. Receivers and buyers use SecureKaro to inspect parcels, verify courier delivery, and sign off on arrivals.
                </p>
                <button
                  onClick={() => setCurrentTab('shipments-list')}
                  className="px-5 py-2.5 rounded-xl bg-[#1E56E3] text-white text-xs font-bold shadow-md hover:bg-[#1649CC] transition"
                >
                  Return to My Orders & Packages
                </button>
              </div>
            )
          )}

          {/* VIEW 4: TRACKING & TRACKING2 LIVE JOURNEY */}
          {currentTab === 'track' && (
            <TrackingView
              user={user}
              selectedShipment={selectedShipment || (publicTrackParams?.trackingId ? { shipmentId: publicTrackParams.trackingId } : null)}
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            />
          )}

          {/* VIEW 5: DELIVERY CONFIRMATION SIGN-OFF (RECEIVER ONLY) */}
          {currentTab === 'delivery-confirm' && (
            isSupplier ? (
              <div className="p-8 max-w-2xl mx-auto text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Receiver Only Feature</h3>
                <p className="text-xs text-slate-500">Delivery Sign-Off is exclusively reserved for Receiver accounts to inspect parcel delivery and confirm safe arrival.</p>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-4 py-2 bg-[#1E56E3] hover:bg-[#1848BF] text-white text-xs font-bold rounded-xl transition"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <DeliveryConfirmView
                user={user}
                onConfirmed={() => setCurrentTab('shipments-list')}
              />
            )
          )}



          {/* VIEW 7: WALLET & PAYOUTS */}
          {currentTab === 'wallet' && (
            <WalletModal
              key={`${user?._id || 'user'}_${isSupplier ? 'Supplier' : 'Receiver'}`}
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}

          {/* VIEW: REFER & EARN AMBASSADOR HUB */}
          {currentTab === 'refer' && (
            <ReferralView
              user={user}
              isSupplier={isSupplier}
              onUpdateUser={(updated) => setUser(updated)}
              onNavigateToWallet={() => setCurrentTab('wallet')}
              onNavigateToCreateShipment={() => setCurrentTab('create-shipment')}
            />
          )}

          {/* VIEW 8: NOTIFICATIONS CENTER */}
          {currentTab === 'notifications' && (
            <NotificationsView
              onSelectShipment={(shipmentId) => setSelectedShipment({ shipmentId })}
              onNotificationsChanged={refreshCounts}
            />
          )}

          {/* VIEW 9: PROFILE & BANK PAYOUT DETAILS */}
          {currentTab === 'profile' && (
            <ProfileView
              user={user}
              currentRole={isSupplier ? 'Supplier' : 'Receiver'}
              onSwitchRole={handleSwitchRole}
              onUpdateUser={(updated) => setUser(updated)}
              onSignOut={handleSignOut}
            />
          )}

          {/* VIEW 10: HELP & SUPPORT CENTER */}
          {currentTab === 'support' && (
            <SupportView />
          )}

          {/* VIEW 11: MERCHANT LEGAL & COMPLIANCE CENTER (DPDP Act, Terms, Privacy, Refunds, Shipping) */}
          {isLegalTab && (
            <LegalComplianceView 
              initialTab={currentTab === 'legal' ? 'contact' : currentTab}
              onTabChange={(nextTab) => setCurrentTab(nextTab)}
            />
          )}

          {/* VIEW 12: RETURN ORDERS & RETURN TRACKING (SUPPLIER & RECEIVER) */}
          {(currentTab === 'return-orders' || currentTab === 'return-tracking') && (
            <ReturnOrdersView
              user={user}
              isSupplier={isSupplier}
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            />
          )}
          </div>
        </main>
        )}
        </Suspense>
      </div>

      {/* Global Modals & Drawers (Lazy loaded with Suspense) */}
      <Suspense fallback={null}>
        {isCreateModalOpen && (
          <CreateShipmentModal
            user={user}
            isOpen={isCreateModalOpen}
            initialData={repeatShipmentData}
            onClose={() => {
              setIsCreateModalOpen(false);
              setRepeatShipmentData(null);
            }}
            onCreated={(newShipment) => {
              setRepeatShipmentData(null);
              setSelectedShipment(newShipment);
              window.location.reload();
            }}
          />
        )}

        {selectedShipment && (
          <ShipmentDetailsModal
            shipment={selectedShipment}
            isOpen={Boolean(selectedShipment)}
            onClose={() => setSelectedShipment(null)}
            onRefresh={() => window.location.reload()}
            user={user}
            onRepeatShipment={(sourceShipment) => {
              const ship = sourceShipment || selectedShipment;
              setSelectedShipment(null);
              setRepeatShipmentData({
                receiverName: ship?.receiverName || '',
                receiverPhone: ship?.receiverPhone || '',
                receiverAddress: ship?.receiverAddress || '',
                receiverPincode: ship?.receiverPincode || '',
                parcelWeight: ship?.parcelWeight ? String(ship?.parcelWeight) : '0.5',
                description: ship?.description || '',
                amount: ship?.amount ? String(ship?.amount) : '',
                cityRoute: ship?.city || '',
                returnAllowed: ship?.returnAllowed !== false,
                rtoProtectionEnabled: Boolean(ship?.rtoProtectionEnabled),
                repeatSourceId: ship?.shipmentId || ''
              });
              setIsCreateModalOpen(true);
            }}
          />
        )}
      </Suspense>

      {/* FLOATING AI AGENT WIDGET (Available for suppliers on desktop when not in full-screen ai-agent view and no modal/drawer is active) */}
      {isSupplier && currentTab !== 'ai-agent' && !selectedShipment && !isCreateModalOpen && (
        <div className="hidden md:block">
          <AgentWidget onNavigate={(tab) => setCurrentTab(tab || 'ai-agent')} />
        </div>
      )}

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR (SWIPE-UP EDITABLE WITH CUSTOM SLOTS & ONBOARDING GUIDE) */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isSupplier={isSupplier}
        user={user}
        notifCount={notifCount}
        isNewUser={isNewUser}
      />

      {/* ROLE SWITCH & PRO TOAST NOTIFICATION (Small, Minimal, Light Slate Theme) */}
      {roleNotification && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-[320px] w-full animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl text-slate-800 p-3 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              roleNotification.role === 'Supplier' 
                ? 'bg-blue-50 text-blue-600 border-blue-200/80' 
                : roleNotification.role === 'PRO'
                  ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
            }`}>
              {roleNotification.role === 'Supplier' ? (
                <Truck className="w-4 h-4" />
              ) : roleNotification.role === 'PRO' ? (
                <Crown className="w-4 h-4 fill-amber-500 text-amber-600" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {roleNotification.title}
                </h4>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border shrink-0 ${
                  roleNotification.role === 'Supplier'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : roleNotification.role === 'PRO'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    roleNotification.role === 'Supplier'
                      ? 'bg-blue-600 animate-pulse'
                      : roleNotification.role === 'PRO'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                  }`}></span>
                  Active
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
                {roleNotification.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT ANIMATED LOADING OVERLAY */}
      {isSigningOut && (
        <div className="fixed inset-0 z-50 bg-blue-950/25 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 select-none">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-2xl bg-[#1E56E3] text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900">Signing Out Safely</h3>
              <p className="text-xs text-slate-500 font-semibold animate-pulse">{signOutStep || 'Clearing session data...'}</p>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1E56E3] h-full rounded-full animate-pulse transition-all duration-500 w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* WELCOME / ONBOARDING MODALS (Lazy loaded with Suspense) */}
      <Suspense fallback={null}>
        {showWelcomeModal && (
          <WelcomeAnimationModal
            isOpen={showWelcomeModal}
            user={user}
            isNewUser={isNewUser}
            onComplete={handleWelcomeComplete}
          />
        )}

        {isRoleModalOpen && (
          <RoleSelectionModal
            isOpen={isRoleModalOpen}
            user={user}
            onComplete={(updatedUser) => {
              setUser(updatedUser);
              setIsRoleModalOpen(false);
            }}
          />
        )}
      </Suspense>

      {/* AI AGENT — now a full-screen view, no floating widget */}
    </div>
  );
}
