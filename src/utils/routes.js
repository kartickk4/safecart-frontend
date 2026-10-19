export const TAB_ROUTES = {
  'dashboard': '/dashboard',
  'shipments-list': '/orders',
  'create-shipment': '/create-shipment',
  'ai-agent': '/ai-agent',
  'track': '/track',
  'delivery-confirm': '/delivery-confirm',
  'wallet': '/wallet',
  'refer': '/refer',
  'notifications': '/notifications',
  'profile': '/profile',
  'support': '/support',
  'legal': '/legal',
  'roi-calculator': '/roi-calculator',
  'return-orders': '/return-orders',
  'return-tracking': '/return-tracking',
  'admin': '/admin'
};

export const ROUTE_TABS = {
  '': 'dashboard',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/orders': 'shipments-list',
  '/shipments': 'shipments-list',
  '/create-shipment': 'create-shipment',
  '/ship': 'create-shipment',
  '/ai-agent': 'ai-agent',
  '/track': 'track',
  '/tracking': 'track',
  '/delivery-confirm': 'delivery-confirm',
  '/sign-off': 'delivery-confirm',
  '/wallet': 'wallet',
  '/payouts': 'wallet',
  '/escrow': 'wallet',
  '/refer': 'refer',
  '/notifications': 'notifications',
  '/profile': 'profile',
  '/support': 'support',
  '/help': 'support',
  '/legal': 'legal',
  '/compliance': 'legal',
  '/roi-calculator': 'roi-calculator',
  '/calculator': 'roi-calculator',
  '/return-orders': 'return-orders',
  '/return-tracking': 'return-tracking',
  '/admin': 'admin'
};

export const TAB_TITLES = {
  'dashboard': 'Dashboard | SecureKaro — Logistics & Shipping Software',
  'shipments-list': 'Orders & Shipments | SecureKaro Courier Platform',
  'create-shipment': 'Book Courier Shipment | SecureKaro Shipping Software',
  'ai-agent': 'AI Shipping Agent | SecureKaro Automation',
  'track': 'Live Tracking & Journey | SecureKaro',
  'delivery-confirm': 'Delivery Sign-Off & Verification | SecureKaro',
  'wallet': 'Wallet History & Payouts | SecureKaro',
  'refer': 'Refer & Earn Ambassador Hub | SecureKaro',
  'notifications': 'Notification Center | SecureKaro',
  'profile': 'Profile & Bank Payout Settings | SecureKaro',
  'support': '24/7 Help & Support | SecureKaro',
  'legal': 'Legal & Merchant Compliance | SecureKaro',
  'roi-calculator': 'COD vs Shipping Savings Calculator | SecureKaro',
  'return-orders': 'Return Orders & Reverse Logistics | SecureKaro',
  'return-tracking': 'Return Package Tracking | SecureKaro',
  'admin': 'Executive Admin Console | SecureKaro'
};

export function getTabFromLocation() {
  if (typeof window === 'undefined') return 'dashboard';

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (ROUTE_TABS[pathname]) {
    return ROUTE_TABS[pathname];
  }

  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  if (tabParam && (TAB_ROUTES[tabParam] || ROUTE_TABS['/' + tabParam])) {
    return TAB_ROUTES[tabParam] ? tabParam : ROUTE_TABS['/' + tabParam];
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (hash && ROUTE_TABS['/' + hash]) {
    return ROUTE_TABS['/' + hash];
  }

  return 'dashboard';
}
