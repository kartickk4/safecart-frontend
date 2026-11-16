/**
 * Universal Carrier & Tracking Formatter Utilities
 * Formats raw courier slugs, internal aggregator IDs, and messy AWBs into clean, branded text.
 */

export function formatCarrierName(carrierStr) {
  if (!carrierStr) return 'Courier Partner';
  const s = String(carrierStr).trim().toLowerCase();

  if (s.includes('bluedart') || s.includes('blue_dart')) return 'Blue Dart Express';
  if (s.includes('shadowfax')) {
    if (s.includes('direct')) return 'Shadowfax Direct';
    return 'Shadowfax Technologies';
  }
  if (s.includes('delhivery')) {
    if (s.includes('direct')) return 'Delhivery Direct';
    return 'Delhivery Express';
  }
  if (s.includes('ekart')) return 'Ekart Logistics';
  if (s.includes('xpressbees')) return 'Xpressbees Logistics';
  if (s.includes('dtdc')) return 'DTDC Express';
  if (s.includes('ecom_express') || s.includes('ecom')) return 'Ecom Express';
  if (s.includes('amazon') || s.includes('ats')) return 'Amazon Shipping';
  if (s.includes('rapido')) return 'Rapido Parcel';
  if (s.includes('indiapost') || s.includes('speed_post')) return 'India Post Speed Post';
  if (s.includes('smartr')) return 'Smartr Logistics';
  if (s.includes('trackon')) return 'Trackon Courier';
  if (s.includes('tpc') || s.includes('professional')) return 'The Professional Couriers';
  if (s === 'add_later') return 'Add Later';

  // Strip prefix like nimbus_ and suffix hex IDs like _6a0d96ef27ad772d357b22c3
  const cleaned = String(carrierStr)
    .replace(/^nimbus_/i, '')
    .replace(/_[a-f0-9]{16,}$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatAwbCode(awb) {
  if (!awb) return '';
  const str = String(awb).trim();

  // If it's a raw test tracking code like TC-nimbus_bluedart_6a0d96ef27ad772d357b22c3-7060174830
  if (str.startsWith('TC-') && str.includes('-')) {
    const parts = str.split('-');
    const suffix = parts[parts.length - 1]; // e.g. 7060174830
    if (/bluedart/i.test(str)) return `BD${suffix}`;
    if (/delhivery/i.test(str)) return `143${suffix}`;
    if (/shadowfax/i.test(str)) return `SFX${suffix}`;
    if (/ekart/i.test(str)) return `EKT${suffix}`;
    if (/xpressbees/i.test(str)) return `XPB${suffix}`;
    if (/dtdc/i.test(str)) return `DTC${suffix}`;
    if (/ecom/i.test(str)) return `ECM${suffix}`;
    if (/rapido/i.test(str)) return `RPD${suffix}`;
    if (/post/i.test(str)) return `POST${suffix}`;
    return `TC-${suffix}`;
  }
  return str;
}

export function formatPickupToken(token) {
  if (!token) return '';
  let str = String(token).trim();
  // Clean duplicate prefixes like NP-NP_ or SR-SR-
  str = str.replace(/^NP-NP_/i, 'NP-').replace(/^NP-NP-/i, 'NP-').replace(/^SR-SR-/i, 'SR-');
  return str;
}
