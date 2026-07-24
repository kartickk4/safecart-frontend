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

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CreateShipmentModal from './components/CreateShipmentModal';
import ShipmentDetailsModal from './components/ShipmentDetailsModal';
import WalletModal from './components/WalletModal';
import { profileAPI } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('safecart_token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (token === 'demo_jwt_token_123') {
      setUser({
        _id: 'demo-user-123',
        fullName: 'Kartick Das',
        email: 'kartick@safecart.in',
        phone: '+91 98765 43210',
        role: 'User',
        activeRole: 'Supplier',
        escrowBalance: 142380.00
      });
      setLoading(false);
      return;
    }

    try {
      const res = await profileAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      console.warn('Backend profile API offline or token invalid, loading demo profile:', err);
      setUser({
        _id: 'demo-user-123',
        fullName: 'Kartick Das',
        email: 'kartick@safecart.in',
        phone: '+91 98765 43210',
        role: 'User',
        activeRole: 'Supplier',
        escrowBalance: 142380.00
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('safecart_token');
    setUser(null);
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
    return <AuthView onAuthSuccess={(userData) => setUser(userData)} />;
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
    </div>
  );
}
