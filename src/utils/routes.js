export const TAB_ROUTES = {
  'login': '/login',
  'register': '/register',
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
  'contact': '/contact',
  'terms': '/terms',
  'privacy': '/privacy',
  'shipping': '/shipping',
  'refunds': '/refunds',
  'services': '/pricing',
  'rate-calculator': '/rate-calculator',
  'roi-calculator': '/roi-calculator',
  'return-orders': '/return-orders',
  'return-tracking': '/return-tracking',
  'admin': '/admin'
};

export const ROUTE_TABS = {
  '': 'dashboard',
  '/': 'dashboard',
  '/login': 'login',
  '/signin': 'login',
  '/sign-in': 'login',
  '/auth': 'login',
  '/signup': 'register',
  '/register': 'register',
  '/create-account': 'register',
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
  '/contact': 'contact',
  '/contact-us': 'contact',
  '/terms': 'terms',
  '/terms-and-conditions': 'terms',
  '/terms-conditions': 'terms',
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy',
  '/shipping': 'shipping',
  '/shipping-policy': 'shipping',
  '/shipping-and-delivery': 'shipping',
  '/refunds': 'refunds',
  '/refund-policy': 'refunds',
  '/cancellation': 'refunds',
  '/cancellation-and-refund': 'refunds',
  '/cancellation-policy': 'refunds',
  '/services': 'services',
  '/pricing': 'services',
  '/products-and-services': 'services',
  '/rate-calculator': 'rate-calculator',
  '/rates': 'rate-calculator',
  '/shipping-rate-calculator': 'rate-calculator',
  '/roi-calculator': 'roi-calculator',
  '/calculator': 'roi-calculator',
  '/return-orders': 'return-orders',
  '/return-tracking': 'return-tracking',
  '/admin': 'admin'
};

export const TAB_TITLES = {
  'login': 'Sign In | SecureKaro — Logistics & Shipping Software',
  'register': 'Create Account | SecureKaro — Logistics & Shipping Software',
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
  'contact': 'Contact Us | SecureKaro Logistics',
  'terms': 'Terms & Conditions of Service | SecureKaro',
  'privacy': 'Privacy Policy & Data Protection | SecureKaro',
  'shipping': 'Shipping & Delivery Policy | SecureKaro',
  'refunds': 'Refunds & Cancellation Policy | SecureKaro',
  'services': 'Products & Services (INR Pricing) | SecureKaro',
  'rate-calculator': 'Shipping Rate Calculator | SecureKaro — Courier Comparison',
  'roi-calculator': 'COD vs Shipping Savings Calculator | SecureKaro',
  'return-orders': 'Return Orders & Reverse Logistics | SecureKaro',
  'return-tracking': 'Return Package Tracking | SecureKaro',
  'admin': 'Executive Admin Console | SecureKaro'
};

const PUBLIC_TABS = [
  'login', 'register', 'track', 'delivery-confirm', 'support', 'legal', 'contact',
  'terms', 'privacy', 'shipping', 'refunds', 'services', 'rate-calculator', 'roi-calculator'
];

export function getTabFromLocation() {
  if (typeof window === 'undefined') return 'dashboard';

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const hasToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('securekaro_token')) : false;

  // If user visits root '/' or empty path
  if (pathname === '' || pathname === '/') {
    if (!hasToken) {
      return 'login';
    }
    try {
      const lastTab = localStorage.getItem('securekaro_last_tab');
      if (lastTab && lastTab !== 'login' && lastTab !== 'register' && TAB_ROUTES[lastTab]) {
        const savedRole = localStorage.getItem('securekaro_active_role');
        const isSupp = savedRole === 'Supplier';
        if (!isSupp && (lastTab === 'dashboard' || lastTab === 'create-shipment' || lastTab === 'return-orders' || lastTab === 'ai-agent')) {
          return 'shipments-list';
        }
        return lastTab;
      }
    } catch (_) {}
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('securekaro_active_role') : null;
    return savedRole === 'Receiver' ? 'shipments-list' : 'dashboard';
  }

  if (ROUTE_TABS[pathname]) {
    const matchedTab = ROUTE_TABS[pathname];
    if (!hasToken && !PUBLIC_TABS.includes(matchedTab)) {
      return 'login';
    }
    return matchedTab;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  if (tabParam && (TAB_ROUTES[tabParam] || ROUTE_TABS['/' + tabParam])) {
    const found = TAB_ROUTES[tabParam] ? tabParam : ROUTE_TABS['/' + tabParam];
    if (!hasToken && !PUBLIC_TABS.includes(found)) {
      return 'login';
    }
    return found;
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (hash && ROUTE_TABS['/' + hash]) {
    const found = ROUTE_TABS['/' + hash];
    if (!hasToken && !PUBLIC_TABS.includes(found)) {
      return 'login';
    }
    return found;
  }

  try {
    const lastTab = localStorage.getItem('securekaro_last_tab');
    if (lastTab && lastTab !== 'login' && lastTab !== 'register' && TAB_ROUTES[lastTab]) {
      if (!hasToken && !PUBLIC_TABS.includes(lastTab)) {
        return 'login';
      }
      return lastTab;
    }
  } catch (_) {}

  return hasToken ? 'dashboard' : 'login';
}
