import { clearApiCache } from '../services/api';

export function getShipmentCacheKey(userScope, isSupplier = true) {
  const scope = typeof userScope === 'object' && userScope !== null
    ? (userScope._id || userScope.id || userScope.email || 'anon')
    : (userScope || 'anon');
  return `securekaro_shipments_${scope}_${isSupplier ? 'supplier' : 'receiver'}`;
}

export function addShipmentToCache(newShipment, userScope, isSupplier = true) {
  if (!newShipment || !newShipment.shipmentId) return;

  const resolvedScope = typeof userScope === 'object' && userScope !== null
    ? (userScope._id || userScope.id || userScope.email || 'anon')
    : (userScope || 'anon');

  const targetSuffix = isSupplier ? '_supplier' : '_receiver';
  const primaryKey = getShipmentCacheKey(resolvedScope, isSupplier);

  const updateListInStorage = (storage, key) => {
    try {
      const raw = storage.getItem(key);
      let list = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      const updated = [newShipment, ...list.filter(s => s && s.shipmentId !== newShipment.shipmentId)];
      storage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn(`[ShipmentCache] Warning writing to ${key}:`, err);
    }
  };

  // 1. Update primary designated key in both localStorage & sessionStorage
  if (typeof localStorage !== 'undefined') updateListInStorage(localStorage, primaryKey);
  if (typeof sessionStorage !== 'undefined') updateListInStorage(sessionStorage, primaryKey);

  // 2. Scan and synchronize ALL role-matching shipment cache keys (handles scope mismatches like _id vs email)
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('securekaro_shipments_') && k.endsWith(targetSuffix) && k !== primaryKey) {
          updateListInStorage(localStorage, k);
        }
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('securekaro_shipments_') && k.endsWith(targetSuffix) && k !== primaryKey) {
          updateListInStorage(sessionStorage, k);
        }
      }
    }
  } catch (_) {}

  // 3. Update dashboard cache if supplier
  if (isSupplier) {
    if (typeof localStorage !== 'undefined') updateListInStorage(localStorage, 'securekaro_dashboard_shipments_Supplier');
    if (typeof sessionStorage !== 'undefined') {
      updateListInStorage(sessionStorage, 'securekaro_dashboard_shipments_Supplier');
      updateListInStorage(sessionStorage, 'securekaro_dashboard_shipments');
    }
  }

  // 4. Invalidate memory GET cache so future API requests bypass stale SWR responses
  try {
    clearApiCache('/shipments');
  } catch (_) {}

  // 5. Broadcast real-time custom event to all mounted React views
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('securekaro_shipments_updated', {
        detail: { newShipment }
      }));
      window.dispatchEvent(new CustomEvent('securekaro_refresh_shipments', {
        detail: { newShipment }
      }));
    }
  } catch (_) {}
}

export function clearShipmentCache(userScope) {
  try {
    const keys = [];
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('securekaro_shipments')) keys.push(k);
      }
      keys.forEach(k => {
        localStorage.removeItem(k);
      });
    }
    if (typeof sessionStorage !== 'undefined') {
      const sKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith('securekaro_shipments') || k.startsWith('securekaro_dashboard_shipments'))) sKeys.push(k);
      }
      sKeys.forEach(k => {
        sessionStorage.removeItem(k);
      });
    }
  } catch (_) {}
}
