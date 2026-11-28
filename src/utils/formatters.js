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
  if (s.includes('indiapost') || s.includes('speed_post') || s.includes('india_post')) return 'India Post Speed Post';
  if (s.includes('smartr')) return 'Smartr Logistics';
  if (s.includes('trackon')) return 'Trackon Courier';
  if (s.includes('tpc') || s.includes('professional')) return 'The Professional Couriers';
  if (s === 'add_later') return 'Add Later';
  if (s === 'direct') return 'Direct Courier';

  // Strip prefix like nimbus_, shiprocket_, etc. and trailing hex/alphanumeric IDs like _6a0d96ef27ad772d357b22c3
  let cleaned = String(carrierStr)
    .replace(/^(nimbus|shiprocket|clickpost|pickrr|delhivery|bluedart)[_-]/i, '')
    .replace(/[_-][a-f0-9]{10,}$/i, '')
    .replace(/[_-]d+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const sub = cleaned.toLowerCase();
  if (sub.includes('bluedart') || sub.includes('blue dart')) return 'Blue Dart Express';
  if (sub.includes('delhivery')) return 'Delhivery Express';
  if (sub.includes('shadowfax')) return 'Shadowfax Technologies';
  if (sub.includes('ekart')) return 'Ekart Logistics';
  if (sub.includes('xpressbees')) return 'Xpressbees Logistics';
  if (sub.includes('dtdc')) return 'DTDC Express';

  if (!cleaned || cleaned.length < 2) return 'Courier Partner';
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

export function getCarrierBrandKey(quote) {
  const raw = `${quote?.courierPartner || ''} ${quote?.name || ''} ${quote?.baseSlug || ''} ${quote?.slug || ''}`.toLowerCase();
  if (raw.includes('delhivery')) return 'delhivery';
  if (raw.includes('shadowfax')) return 'shadowfax';
  if (raw.includes('xpressbees')) return 'xpressbees';
  if (raw.includes('ekart')) return 'ekart';
  if (raw.includes('dtdc')) return 'dtdc';
  if (raw.includes('bluedart') || raw.includes('blue dart') || raw.includes('blue_dart')) return 'bluedart';
  if (raw.includes('ecom')) return 'ecom';
  if (raw.includes('amazon') || raw.includes('ats')) return 'amazon';
  if (raw.includes('kerry') || raw.includes('indev')) return 'kerry';
  if (raw.includes('maruti')) return 'shreemaruti';
  if (raw.includes('indiapost') || raw.includes('speed post') || raw.includes('india post')) return 'indiapost';
  if (raw.includes('smartr')) return 'smartr';
  if (raw.includes('trackon')) return 'trackon';
  return (quote?.baseSlug || quote?.slug || quote?.name || 'other').toLowerCase().trim();
}

/**
 * Deduplicate courier quotes by brand, keeping only the lowest-rate option for each courier brand.
 */
export function dedupeQuotesByLowestBrand(quotes = []) {
  if (!Array.isArray(quotes) || quotes.length === 0) return [];
  const bestByBrand = new Map();
  for (const q of quotes) {
    const brand = getCarrierBrandKey(q);
    const price = Number(q?.exactRate ?? q?.price ?? Infinity);
    const existing = bestByBrand.get(brand);
    if (!existing) {
      bestByBrand.set(brand, q);
    } else {
      const existingPrice = Number(existing?.exactRate ?? existing?.price ?? Infinity);
      if (price < existingPrice) {
        bestByBrand.set(brand, q);
      }
    }
  }
  return Array.from(bestByBrand.values());
}
