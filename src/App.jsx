import React, { useState, useEffect } from 'react';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import ShipmentsListView from './views/ShipmentsListView';
import CreateShipmentView from './views/CreateShipmentView';
import TrackingView from './views/TrackingView';
import DeliveryConfirmView from './views/DeliveryConfirmView';
import NotificationsView from './views/NotificationsView';
import ProfileView from './views/ProfileView';
import SupportView from './views/SupportView';
import LegalComplianceView from './views/LegalComplianceView';
import ReturnOrdersView from './views/ReturnOrdersView';
import PublicPayView from './views/PublicPayView';
import PublicTrackingView from './views/PublicTrackingView';
import AIAgentView from './views/AIAgentView';
import PhotoReviewResponseView from './views/PhotoReviewResponseView';
import ReferralView from './views/ReferralView';
import PublicQrConfirmView from './views/PublicQrConfirmView';
import AdminView from './views/AdminView';
import ROISavingsCalculatorView from './views/ROISavingsCalculatorView';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CreateShipmentModal from './components/CreateShipmentModal';
import ShipmentDetailsModal from './components/ShipmentDetailsModal';
import WalletModal from './components/WalletModal';
import RoleSelectionModal from './components/RoleSelectionModal';
import WelcomeAnimationModal from './components/WelcomeAnimationModal';
import AgentWidget from './components/AgentWidget';
import AdBanner from './components/AdBanner';
import { profileAPI, authAPI, notificationAPI } from './services/api';
import { LayoutDashboard, Navigation, PlusCircle, CheckCircle2, User, Bell, ShieldCheck, Wallet, Truck, ShoppingBag, ArrowLeftRight, Crown, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutStep, setSignOutStep] = useState('');
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('tab')) return searchParams.get('tab');
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      if (path === 'admin') return 'admin';
      if (path === 'ai-agent') return 'ai-agent';
      if (path === 'wallet') return 'wallet';
      if (path === 'track') return 'track';
      if (path === 'orders' || path === 'shipments') return 'shipments-list';
      if (path === 'profile') return 'profile';
      if (window.location.hash === '#admin') return 'admin';
      if (window.location.hash === '#ai-agent') return 'ai-agent';
      if (window.location.hash === '#wallet') return 'wallet';
    }
    return 'dashboard';
  });
  const [roleNotification, setRoleNotification] = useState(null);

  // Synchronize active tab with browser URL history without page reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentUrl = new URL(window.location.href);
    const existingTab = currentUrl.searchParams.get('tab');
    if (currentTab === 'dashboard') {
      if (existingTab) {
        currentUrl.searchParams.delete('tab');
        window.history.replaceState({ tab: currentTab }, '', currentUrl.pathname + (currentUrl.search ? currentUrl.search : ''));
      }
    } else {
      if (existingTab !== currentTab) {
        currentUrl.searchParams.set('tab', currentTab);
        window.history.replaceState({ tab: currentTab }, '', currentUrl.toString());
      }
    }
  }, [currentTab]);

  useEffect(() => {
    const handleUrlNavigation = () => {
      if (typeof window === 'undefined') return;
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        setCurrentTab(tabParam);
        return;
      }
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      if (path === 'admin') setCurrentTab('admin');
      else if (path === 'ai-agent') setCurrentTab('ai-agent');
      else if (path === 'wallet') setCurrentTab('wallet');
      else if (path === 'track') setCurrentTab('track');
      else if (path === 'orders' || path === 'shipments') setCurrentTab('shipments-list');
      else if (path === 'profile') setCurrentTab('profile');
      else if (window.location.hash === '#admin') setCurrentTab('admin');
      else if (window.location.hash === '#ai-agent') setCurrentTab('ai-agent');
      else if (window.location.hash === '#wallet') setCurrentTab('wallet');
      else setCurrentTab('dashboard');
    };

    const handleNavigateTab = (e) => {
      if (e.detail) {
        setCurrentTab(e.detail);
      }
    };

    window.addEventListener('popstate', handleUrlNavigation);
    window.addEventListener('hashchange', handleUrlNavigation);
    window.addEventListener('navigate-tab', handleNavigateTab);
    return () => {
      window.removeEventListener('popstate', handleUrlNavigation);
      window.removeEventListener('hashchange', handleUrlNavigation);
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

  const checkAuth = async () => {
    const token = localStorage.getItem('securekaro_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await profileAPI.getProfile();
      const savedRole = localStorage.getItem('securekaro_active_role');
      const loadedUser = res.data;
      if (savedRole && (savedRole === 'Supplier' || savedRole === 'Receiver')) {
        loadedUser.activeRole = savedRole;
      }
      setUser(loadedUser);
    } catch (err) {
      console.warn('Backend profile API error or token invalid:', err);
      localStorage.removeItem('securekaro_token');
      setUser(null);
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
    setIsNewUser(!!newUserFlag);
    setShowWelcomeModal(true);

    // Refresh complete profile in background to guarantee isPro and balances are in sync
    try {
      const res = await profileAPI.getProfile();
      if (res.data) {
        setUser(prev => ({
          ...prev,
          ...res.data,
          activeRole: savedRole || res.data.role || prev?.activeRole
        }));
      }
    } catch (e) {
      console.warn('Profile sync on auth success notice:', e);
    }
  };

  const handleSwitchRole = async (targetRole) => {
    const nextRole = targetRole === 'Supplier' ? 'Supplier' : 'Receiver';
    if ((isSupplier && nextRole === 'Supplier') || (!isSupplier && nextRole === 'Receiver')) {
      return;
    }

    // 1. Optimistic Local State Update
    localStorage.setItem('securekaro_active_role', nextRole);
    setUser(prev => ({
      ...prev,
      role: nextRole,
      activeRole: nextRole
    }));

    // 2. Adjust Tab to matching portal
    if (nextRole === 'Supplier') {
      if (currentTab === 'delivery-confirm' || currentTab === 'return-tracking') {
        setCurrentTab('dashboard');
      }
    } else {
      if (currentTab === 'dashboard' || currentTab === 'create-shipment' || currentTab === 'return-orders' || currentTab === 'ai-agent') {
        setCurrentTab('shipments-list');
      }
    }

    // 3. Show smooth visual notification toast
    setRoleNotification({
      role: nextRole,
      title: nextRole === 'Supplier' ? 'Switched to Supplier Mode' : 'Switched to Receiver Mode',
      desc: nextRole === 'Supplier' 
        ? 'Merchant Portal: Create shipments, manage orders, pickups & escrow payouts.' 
        : 'Buyer Portal: Inspect incoming parcels, sign-off deliveries & manage escrow.'
    });

    setTimeout(() => {
      setRoleNotification(null);
    }, 3800);

    // 4. Synchronize with Backend
    try {
      const res = await authAPI.switchRole(nextRole);
      if (res.data?.accessToken) {
        localStorage.setItem('securekaro_token', res.data.accessToken);
      }
      if (res.data?.user) {
        setUser(prev => ({
          ...prev,
          ...res.data.user,
          activeRole: nextRole
        }));
      }
    } catch (err) {
      console.warn('Backend role switch notice (using local activeRole):', err.message);
      try {
        await profileAPI.updateProfile({ role: nextRole });
      } catch (_) {}
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    if (isNewUser) {
      setIsRoleModalOpen(true);
    }
  };

  const handleSignOut = () => {
    setIsSigningOut(true);
    setSignOutStep('Securing active escrow session...');

    setTimeout(() => {
      setSignOutStep('Clearing authentication tokens...');
    }, 500);

    setTimeout(() => {
      localStorage.removeItem('securekaro_token');
      localStorage.removeItem('securekaro_active_role');
      setUser(null);
      setCurrentTab('dashboard'); // Reset tab so next login starts fresh
      setIsSigningOut(false);
      setSignOutStep('');
    }, 1200);
  };


  // Check if visitor is accessing a public escrow payment link (/pay/:id or ?pay=:id)
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
      <PhotoReviewResponseView
        shipmentId={photoReviewParams.shipmentId}
        action={photoReviewParams.action}
      />
    );
  }

  // Render public QR delivery confirmation page (no login needed) — receiver scans QR from inside parcel
  if (qrConfirmToken) {
    return <PublicQrConfirmView qrToken={qrConfirmToken} />;
  }

  // Render public payment checkout directly with zero login barriers
  if (publicPayShipmentId) {
    return (
      <PublicPayView
        shipmentId={publicPayShipmentId}
        onPaymentComplete={(paidShipment) => {
          console.log('Public payment successfully processed for:', paidShipment?.shipmentId);
        }}
      />
    );
  }

  // Render public tracking page directly with zero login barriers
  if (publicTrackParams || isPublicTrackingActive) {
    return (
      <PublicTrackingView
        initialTrackingId={publicTrackParams?.trackingId || ''}
        initialPhone={publicTrackParams?.phone || ''}
        onBackToAuth={() => {
          setIsPublicTrackingActive(false);
          if (window.location.pathname.startsWith('/track')) {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Loading SecureKaro Escrow Platform...</p>
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

  // Master Admin Executive Console
  if (currentTab === 'admin') {
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
          />
        )}

        {/* TOP OF SCREEN AD BANNER (Hidden on AI Agent and transaction forms) */}
        {currentTab !== 'ai-agent' && currentTab !== 'create-shipment' && currentTab !== 'delivery-confirm' && (
          <div className="px-4 md:px-8 pt-2 pb-2 max-w-7xl mx-auto w-full">
            <AdBanner onNavigateTrack={() => setCurrentTab('track')} />
          </div>
        )}

        {/* AI AGENT: Full-screen, no padding, no extra scroll */}
        {currentTab === 'ai-agent' ? (
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <AIAgentView onBack={() => setCurrentTab(isSupplier ? 'dashboard' : 'shipments-list')} />
          </div>
        ) : (
        <main className="flex-1 pb-28 md:pb-12 overflow-y-auto">
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
                  Only verified merchants and suppliers can create escrow-backed parcel shipments. Receivers and buyers use SecureKaro to inspect parcels, fund escrow, and sign off on deliveries.
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
              selectedShipment={selectedShipment}
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
                <p className="text-xs text-slate-500">Delivery Sign-Off is exclusively reserved for Receiver accounts to inspect parcel delivery and release escrow funds.</p>
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



          {/* VIEW 7: ESCROW WALLET */}
          {currentTab === 'wallet' && (
            <WalletModal
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}

          {/* VIEW: REFER & EARN AMBASSADOR HUB */}
          {currentTab === 'refer' && (
            <ReferralView
              user={user}
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
            />
          )}

          {/* VIEW 10: HELP & SUPPORT CENTER */}
          {currentTab === 'support' && (
            <SupportView />
          )}

          {/* VIEW 11: CASHFREE MERCHANT LEGAL & COMPLIANCE CENTER */}
          {currentTab === 'legal' && (
            <LegalComplianceView />
          )}

          {/* VIEW 12: RETURN ORDERS & RETURN TRACKING (SUPPLIER & RECEIVER) */}
          {(currentTab === 'return-orders' || currentTab === 'return-tracking') && (
            <ReturnOrdersView
              user={user}
              isSupplier={isSupplier}
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            />
          )}

        </main>
        )}
      </div>

      {/* Global Modals & Drawers */}
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

      {/* FLOATING AI AGENT WIDGET (Available for suppliers on desktop when not in full-screen ai-agent view and no modal/drawer is active) */}
      {isSupplier && currentTab !== 'ai-agent' && !selectedShipment && !isCreateModalOpen && (
        <div className="hidden md:block">
          <AgentWidget onNavigate={(tab) => setCurrentTab(tab || 'ai-agent')} />
        </div>
      )}

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR (FOR MOBILE SMARTPHONE SCREENS) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 pb-safe flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
        {/* TAB 1: DASHBOARD / ORDERS */}
        <button
          onClick={() => setCurrentTab(isSupplier ? 'dashboard' : 'shipments-list')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            (currentTab === 'dashboard' || currentTab === 'shipments-list') ? 'text-[#1E56E3]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{isSupplier ? 'Dashboard' : 'Orders'}</span>
        </button>

        {/* TAB 2: AI AGENT (SUPPLIER) OR LIVE TRACKING (RECEIVER) */}
        {isSupplier ? (
          <button
            onClick={() => setCurrentTab('ai-agent')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
              currentTab === 'ai-agent' ? 'text-purple-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Agent</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentTab('track')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
              currentTab === 'track' ? 'text-[#1E56E3] font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-5 h-5" />
            <span>Tracking</span>
          </button>
        )}

        {/* TAB 3: CENTER ACTION (SHIP FOR SELLER, SIGN-OFF FOR BUYER) */}
        {isSupplier ? (
          <button
            onClick={() => setCurrentTab('create-shipment')}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 bg-gradient-to-tr from-[#1443BC] to-[#2563EB] text-white rounded-2xl shadow-lg shadow-blue-600/35 active:scale-95 transition border-2 border-white"
            title="Create New Escrow Shipment"
          >
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black tracking-tight leading-none mt-0.5">Ship</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentTab('delivery-confirm')}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-600/35 active:scale-95 transition border-2 border-white"
            title="Inspect & Sign Off Delivery"
          >
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[9px] font-black tracking-tight leading-none mt-0.5">Sign</span>
          </button>
        )}

        {/* TAB 4: WALLET */}
        <button
          onClick={() => setCurrentTab('wallet')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            currentTab === 'wallet' ? 'text-[#1E56E3] font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Wallet</span>
        </button>

        {/* TAB 5: PROFILE */}
        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            currentTab === 'profile' ? 'text-[#1E56E3] font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>

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

      {/* WELCOME / SIGN-UP ANIMATION OVERLAY */}
      <WelcomeAnimationModal
        isOpen={showWelcomeModal}
        user={user}
        isNewUser={isNewUser}
        onComplete={handleWelcomeComplete}
      />


      {/* FIRST TIME GOOGLE ONBOARDING ROLE SELECTION MODAL */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        user={user}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setIsRoleModalOpen(false);
        }}
      />

      {/* AI AGENT — now a full-screen view, no floating widget */}
    </div>
  );
}
