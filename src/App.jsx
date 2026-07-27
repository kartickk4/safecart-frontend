import React, { useState, useEffect } from 'react';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import ShipmentsListView from './views/ShipmentsListView';
import CreateShipmentView from './views/CreateShipmentView';
import TrackingView from './views/TrackingView';
import DeliveryConfirmView from './views/DeliveryConfirmView';
import ClaimsView from './views/ClaimsView';
import NotificationsView from './views/NotificationsView';
import ProfileView from './views/ProfileView';
import SupportView from './views/SupportView';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CreateShipmentModal from './components/CreateShipmentModal';
import ShipmentDetailsModal from './components/ShipmentDetailsModal';
import WalletModal from './components/WalletModal';
import RoleSelectionModal from './components/RoleSelectionModal';
import AdBanner from './components/AdBanner';
import { profileAPI } from './services/api';
import { LayoutDashboard, Navigation, PlusCircle, CheckCircle2, User, Bell, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutStep, setSignOutStep] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const isSupplier = user?.role === 'Supplier' || user?.activeRole === 'Supplier';

  useEffect(() => {
    if (user && !isSupplier && (currentTab === 'dashboard' || currentTab === 'wallet')) {
      setCurrentTab('shipments-list');
    }
  }, [user, currentTab, isSupplier]);

  const checkAuth = async () => {
    const token = localStorage.getItem('safecart_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await profileAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      console.warn('Backend profile API error or token invalid:', err);
      localStorage.removeItem('safecart_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData, isNewUser) => {
    setUser(userData);
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
      localStorage.removeItem('safecart_token');
      setUser(null);
      setIsSigningOut(false);
      setSignOutStep('');
    }, 1200);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Loading Safecart Escrow Platform...</p>
      </div>
    );
  }

  // Render Authentication View if no active session
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onSignOut={handleSignOut}
        openNewShipmentModal={() => setCurrentTab('create-shipment')}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onRefresh={() => window.location.reload()}
          openNewShipmentModal={() => setCurrentTab('create-shipment')}
        />

        {/* TOP OF SCREEN AD BANNER */}
        <div className="px-8 pt-6 pb-2 max-w-7xl mx-auto w-full">
          <AdBanner />
        </div>

        <main className="flex-1 pb-12 overflow-y-auto">
          {/* VIEW 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
              openNewShipmentModal={() => setCurrentTab('create-shipment')}
            />
          )}

          {/* VIEW 2: ALL SHIPMENTS TABLE */}
          {currentTab === 'shipments-list' && (
            <ShipmentsListView
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
              openNewShipmentModal={() => setCurrentTab('create-shipment')}
            />
          )}

          {/* VIEW 3: CREATE SHIPMENT WIZARD + SHIPMENT SUCCESS CONFIRMATION */}
          {currentTab === 'create-shipment' && (
            <CreateShipmentView
              user={user}
              onOpenProfile={() => setCurrentTab('profile')}
              onBack={() => setCurrentTab('dashboard')}
              onCreated={(newShipment) => setSelectedShipment(newShipment)}
            />
          )}

          {/* VIEW 4: TRACKING & TRACKING2 LIVE JOURNEY */}
          {currentTab === 'track' && (
            <TrackingView
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            />
          )}

          {/* VIEW 5: DELIVERY CONFIRMATION SIGN-OFF */}
          {currentTab === 'delivery-confirm' && (
            <DeliveryConfirmView
              onConfirmed={() => setCurrentTab('dashboard')}
            />
          )}

          {/* VIEW 6: DISPUTE CLAIMS CENTER */}
          {currentTab === 'claims' && (
            <ClaimsView
              user={user}
              onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            />
          )}

          {/* VIEW 7: ESCROW WALLET */}
          {currentTab === 'wallet' && (
            <WalletModal
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}

          {/* VIEW 8: NOTIFICATIONS CENTER */}
          {currentTab === 'notifications' && (
            <NotificationsView />
          )}

          {/* VIEW 9: PROFILE & BANK PAYOUT DETAILS */}
          {currentTab === 'profile' && (
            <ProfileView
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}

          {/* VIEW 10: HELP & SUPPORT CENTER */}
          {currentTab === 'support' && (
            <SupportView />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CreateShipmentModal
        user={user}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newShipment) => {
          setSelectedShipment(newShipment);
          window.location.reload();
        }}
      />

      <ShipmentDetailsModal
        shipment={selectedShipment}
        isOpen={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onRefresh={() => window.location.reload()}
      />

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR (FOR MOBILE SMARTPHONE SCREENS) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around z-50 shadow-lg select-none">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            currentTab === 'dashboard' ? 'text-[#1E56E3]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('track')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            currentTab === 'track' ? 'text-[#1E56E3]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span>Tracking</span>
        </button>

        <button
          onClick={() => setCurrentTab('create-shipment')}
          className="flex flex-col items-center gap-1 p-2 bg-[#1E56E3] text-white rounded-2xl text-[10px] font-bold shadow-md shadow-blue-500/30 -mt-5 transition active:scale-95"
        >
          <PlusCircle className="w-6 h-6" />
          <span>Ship</span>
        </button>

        <button
          onClick={() => setCurrentTab('delivery-confirm')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            currentTab === 'delivery-confirm' ? 'text-[#1E56E3]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Confirm</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition ${
            currentTab === 'profile' ? 'text-[#1E56E3]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>

      {/* SIGN OUT ANIMATED LOADING OVERLAY */}
      {isSigningOut && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 select-none">
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

      {/* FIRST TIME GOOGLE ONBOARDING ROLE SELECTION MODAL */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        user={user}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setIsRoleModalOpen(false);
        }}
      />
    </div>
  );
}
