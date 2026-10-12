import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertTriangle, X, RefreshCw, Send, BarChart2,
  FileDown, Info, Zap, Package
} from 'lucide-react';

const getApiBase = () => {
  const raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
};

const getToken = () =>
  localStorage.getItem('securekaro_token') ||
  localStorage.getItem('skToken') ||
  localStorage.getItem('token') || '';

/* ── Column schema: Synchronized exactly to user specification ──
   1. receiver_name, 2. receiver_phone, 3. receiver_address, 4. pincode, 5. weight_kg,
   6. description, 7. amount, 8. height_cm, 9. width_cm, 10. length_cm, 11. payment_mode, 12. return_allowed
   followed by remaining columns: 13. seller_order_id, 14. receiver_email, 15. receiver_city,
   16. receiver_state, 17. category, 18. quantity, 19. cod_amount, 20. insurance_required,
   21. preferred_carrier, 22. special_instructions
── */

const REQUIRED_SCHEMA = [
  { col: 'receiver_name',        colLetter: 'A', label: 'Receiver Name',        required: true,  example: 'Priya Nair',                         tip: 'Full name of the buyer/receiver (min 2 characters)' },
  { col: 'receiver_phone',       colLetter: 'B', label: 'Receiver Phone',       required: true,  example: '9876543210',                         tip: '10-digit Indian mobile number. Payment link sent via WhatsApp & SMS' },
  { col: 'receiver_address',     colLetter: 'C', label: 'Receiver Address',     required: true,  example: '12 MG Road, Koramangala, Bengaluru',   tip: 'Full delivery address with street, area & city (min 8 chars)' },
  { col: 'pincode',              colLetter: 'D', label: 'Pincode',              required: true,  example: '560001',                             tip: '6-digit valid Indian delivery pincode' },
  { col: 'weight_kg',            colLetter: 'E', label: 'Weight (kg)',          required: true,  example: '1.2',                                tip: 'Parcel weight in kilograms (e.g. 0.5, 1.2, 5.0)' },
  { col: 'description',          colLetter: 'F', label: 'Item Description',     required: true,  example: 'Cotton Kurta Set',                   tip: 'Product/package description (min 3 characters)' },
  { col: 'amount',               colLetter: 'G', label: 'Declared Value (₹)',   required: true,  example: '1200',                               tip: 'Invoice / escrow value in ₹ (min ₹1)' },
];

const OPTIONAL_SCHEMA = [
  // ── Synchronized Primary 5 Dimensions & Policy Columns (Col H to L) ──
  { col: 'height_cm',            colLetter: 'H', label: 'Height (cm)',          required: false, example: '25',                     defaultVal: '15',      tip: 'Parcel height in cm' },
  { col: 'width_cm',             colLetter: 'I', label: 'Width (cm)',           required: false, example: '15',                     defaultVal: '15',      tip: 'Parcel width in cm' },
  { col: 'length_cm',            colLetter: 'J', label: 'Length (cm)',          required: false, example: '10',                     defaultVal: '15',      tip: 'Parcel length in cm' },
  { col: 'payment_mode',         colLetter: 'K', label: 'Payment Mode',         required: false, example: 'prepaid',                defaultVal: 'prepaid', tip: 'prepaid (online payment link) OR cod (cash on delivery)' },
  { col: 'return_allowed',       colLetter: 'L', label: 'Return Allowed',       required: false, example: 'yes',                    defaultVal: 'yes',     tip: 'yes / no — Permit 24h buyer verification return' },

  // ── Remaining Columns (Col M to V) ──
  { col: 'seller_order_id',      colLetter: 'M', label: 'Seller Order ID',      required: false, example: 'ORD-2024-001',           defaultVal: 'Auto',    tip: 'Your internal order/invoice reference number' },
  { col: 'receiver_email',       colLetter: 'N', label: 'Receiver Email',       required: false, example: 'priya@email.com',        defaultVal: 'None',    tip: 'Buyer email address for notifications' },
  { col: 'receiver_city',        colLetter: 'O', label: 'Receiver City',        required: false, example: 'Bengaluru',              defaultVal: 'Auto',    tip: 'Destination city name' },
  { col: 'receiver_state',       colLetter: 'P', label: 'Receiver State',       required: false, example: 'Karnataka',              defaultVal: 'Auto',    tip: 'Destination state name' },
  { col: 'category',             colLetter: 'Q', label: 'Category',             required: false, example: 'Clothing',               defaultVal: 'General', tip: 'Electronics / Clothing / Books / Furniture / Toys / Jewellery / Footwear / Beauty / Sports / Food / Automotive / Home Decor / Medical / Stationery / General' },
  { col: 'quantity',             colLetter: 'R', label: 'Quantity',             required: false, example: '1',                      defaultVal: '1',       tip: 'Total piece count in parcel' },
  { col: 'cod_amount',           colLetter: 'S', label: 'COD Amount (₹)',       required: false, example: '',                       defaultVal: 'amount',  tip: 'Cash amount to collect at doorstep (if COD)' },
  { col: 'insurance_required',   colLetter: 'T', label: 'Insurance',            required: false, example: 'no',                     defaultVal: 'no',      tip: 'yes / no — Opt into parcel loss/transit insurance' },
  { col: 'preferred_carrier',    colLetter: 'U', label: 'Preferred Carrier',    required: false, example: 'auto',                   defaultVal: 'auto',    tip: 'auto (cheapest) / delhivery / rapido / bluedart / dtdc / ekart / shadowfax / xpressbees' },
  { col: 'special_instructions', colLetter: 'V', label: 'Special Instructions', required: false, example: 'Fragile, handle with care', defaultVal: 'None', tip: 'Delivery notes or courier handling instructions' },
];

/* Combined Schema:
   Col A to L: 12 Synchronized Columns (receiver_name ... return_allowed)
   Col M to V: 10 Remaining Columns (seller_order_id ... special_instructions)
*/
const TEMPLATE_SCHEMA = [...REQUIRED_SCHEMA, ...OPTIONAL_SCHEMA];

/* ── Download the synchronized v2 template ────────────────────────────────── */
const downloadTemplate = () => {
  // Row 1: Column headers (Bold, cleanly synchronized)
  const headers = TEMPLATE_SCHEMA.map(s => s.col);
  // Row 2: Friendly labels & column letter indicator
  const labels  = TEMPLATE_SCHEMA.map(s =>
    s.required
      ? `[🔴 REQUIRED | Col ${s.colLetter}] ${s.label.toUpperCase()}`
      : `[⚪ OPTIONAL | Col ${s.colLetter}] ${s.label}`
  );
  // Row 3: Rule & Tips
  const tips    = TEMPLATE_SCHEMA.map(s => s.tip);

  // Row 4-6: Sample data rows matching exact synchronized order
  const sample1 = TEMPLATE_SCHEMA.map(s => s.example);
  const sample2 = [
    // 12 Synchronized Columns: 7 Required + 5 Key Package/Policy
    'Rahul Sharma', '9123456789', 'Flat 5B, Nehru Colony, New Delhi', '110005', '0.5', 'Mobile Phone Cover', '299',
    '10', '7', '14', 'prepaid', 'yes',
    // 10 Remaining Columns
    'ORD-2024-002', 'rahul@mail.com', 'New Delhi', 'Delhi', 'Electronics', '1', '', 'no', 'auto', 'Leave at door if absent'
  ];
  const sample3 = [
    // 12 Synchronized Columns: 7 Required + 5 Key Package/Policy
    'Divya Menon', '9988776655', '45 Anna Salai, Teynampet, Chennai', '600002', '2.0', 'Ceramic Dinner Set', '2499',
    '30', '25', '25', 'cod', 'no',
    // 10 Remaining Columns
    'ORD-2024-003', 'divya@shop.com', 'Chennai', 'Tamil Nadu', 'Home Decor', '1', '2499', 'yes', 'rapido', 'Call before delivery'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, labels, tips, sample1, sample2, sample3]);

  // Set comfortable column widths: matching the exact 22 synchronized columns
  ws['!cols'] = [
    // 12 Synchronized Columns (Col A to L)
    { wch: 22 }, // A: receiver_name
    { wch: 18 }, // B: receiver_phone
    { wch: 38 }, // C: receiver_address
    { wch: 14 }, // D: pincode
    { wch: 14 }, // E: weight_kg
    { wch: 28 }, // F: description
    { wch: 18 }, // G: amount
    { wch: 14 }, // H: height_cm
    { wch: 14 }, // I: width_cm
    { wch: 14 }, // J: length_cm
    { wch: 16 }, // K: payment_mode
    { wch: 16 }, // L: return_allowed
    // 10 Remaining Columns (Col M to V)
    { wch: 18 }, // M: seller_order_id
    { wch: 24 }, // N: receiver_email
    { wch: 16 }, // O: receiver_city
    { wch: 16 }, // P: receiver_state
    { wch: 18 }, // Q: category
    { wch: 12 }, // R: quantity
    { wch: 16 }, // S: cod_amount
    { wch: 18 }, // T: insurance_required
    { wch: 20 }, // U: preferred_carrier
    { wch: 35 }  // V: special_instructions
  ];

  // Set row heights for clear readability
  ws['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 28 }];

  // Bold column headers (Row 1) and subheaders (Row 2)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:V6');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const isRequired = C < REQUIRED_SCHEMA.length;
    const r0 = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[r0]) {
      ws[r0].s = {
        font: { bold: true, sz: 11, name: 'Calibri', color: { rgb: isRequired ? '991B1B' : '1E293B' } },
        alignment: { vertical: 'center', horizontal: 'center' }
      };
    }
    const r1 = XLSX.utils.encode_cell({ r: 1, c: C });
    if (ws[r1]) {
      ws[r1].s = {
        font: { bold: true, sz: 10, italic: true },
        alignment: { vertical: 'center' }
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bulk Shipments');

  // Schema Table Summary Sheet
  const schemaSummaryData = [
    ['SECUREKARO BULK SHIPMENT SCHEMA STRUCTURE (SYNCHRONIZED)'],
    [''],
    ['SYNCHRONIZED COLUMN ORDER (COL A TO V):'],
    ['Col #', 'Column Name', 'Status', 'Default / Rule', 'Example Value'],
    ...TEMPLATE_SCHEMA.map((s, i) => [
      `Col ${s.colLetter} (#${i + 1})`,
      s.col,
      s.required ? 'REQUIRED' : 'OPTIONAL',
      s.required ? s.tip : (s.defaultVal || 'Optional'),
      s.example
    ]),
    [''],
    ['🔴 REQUIRED FIELDS (Col A to G) — 7 Mandatory Columns'],
    ['Column Name', 'Col', 'Type / Validation Rule', 'Example Value'],
    ...REQUIRED_SCHEMA.map(r => [r.col, `Col ${r.colLetter}`, r.tip, r.example]),
    [''],
    ['⚪ OPTIONAL FIELDS (Col H to V) — 15 Optional Columns'],
    ['Column Name', 'Col', 'Default Value', 'Description & Options', 'Example Value'],
    ...OPTIONAL_SCHEMA.map(o => [o.col, `Col ${o.colLetter}`, o.defaultVal, o.tip, o.example]),
    [''],
    ['NOTES:'],
    ['1. Columns A to L follow the exact synchronized priority order.'],
    ['2. You can leave optional columns completely blank if not needed.'],
    ['3. Required columns (A-G) must be present and valid on every row.'],
    ['4. All popular carriers supported: auto, delhivery, rapido, bluedart, dtdc, ekart, shadowfax, xpressbees.'],
  ];
  const wsSchema = XLSX.utils.aoa_to_sheet(schemaSummaryData);
  wsSchema['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 16 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSchema, 'Schema Reference');

  // Instructions sheet
  const instrData = [
    ['SecureKaro Bulk Shipment Template — Synchronized Sequence'],
    [''],
    ['SYNCHRONIZED COLUMN ORDER (Col A to V):'],
    ['1. receiver_name (Col A)'],
    ['2. receiver_phone (Col B)'],
    ['3. receiver_address (Col C)'],
    ['4. pincode (Col D)'],
    ['5. weight_kg (Col E)'],
    ['6. description (Col F)'],
    ['7. amount (Col G)'],
    ['8. height_cm (Col H)'],
    ['9. width_cm (Col I)'],
    ['10. length_cm (Col J)'],
    ['11. payment_mode (Col K)'],
    ['12. return_allowed (Col L)'],
    ['--- Remaining Columns ---'],
    ['13. seller_order_id (Col M)'],
    ['14. receiver_email (Col N)'],
    ['15. receiver_city (Col O)'],
    ['16. receiver_state (Col P)'],
    ['17. category (Col Q)'],
    ['18. quantity (Col R)'],
    ['19. cod_amount (Col S)'],
    ['20. insurance_required (Col T)'],
    ['21. preferred_carrier (Col U)'],
    ['22. special_instructions (Col V)'],
    [''],
    ['INSTRUCTIONS & TIPS:'],
    ['• Fill your shipments starting from Row 4 (rows 1-3 are column headers and guides).'],
    ['• payment_mode: "prepaid" (buyer pays via link) OR "cod" (cash on delivery).'],
    ['• preferred_carrier: "auto" (cheapest via Shiprocket) OR delhivery, rapido, bluedart, dtdc, ekart, shadowfax, xpressbees.'],
    ['• weight_kg: Enter decimals e.g. 0.5 for 500g, 1.2 for 1.2kg.'],
    ['• Maximum 500 shipments per file. Split larger batches into multiple uploads.'],
    [''],
    ['For questions or support: support@securekaro.in'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  XLSX.writeFile(wb, 'securekaro_bulk_shipment_template_v2.xlsx');
};

/* ── Download only error rows for fixing (Synchronized structure) ─────────── */
const downloadErrorRows = (parsedRows) => {
  const bad = parsedRows.filter(r => !r.isValid);
  if (!bad.length) return;
  const data = bad.map(r => ({
    'Row #':              r.rowNumber,
    '⚠ ERRORS TO FIX':    r.errors?.join(' | ') || '',
    // ── 12 Synchronized Columns (Col A to L) ──
    receiver_name:        r.receiverName || '',
    receiver_phone:       r.receiverPhone || '',
    receiver_address:     r.receiverAddress || '',
    pincode:              r.pincode || '',
    weight_kg:            r.weightKg || '',
    description:          r.description || '',
    amount:               r.amount || '',
    height_cm:            r.heightCm || 15,
    width_cm:             r.widthCm || 15,
    length_cm:            r.lengthCm || 15,
    payment_mode:         r.paymentMode || 'prepaid',
    return_allowed:       r.returnAllowed ? 'yes' : 'no',
    // ── 10 Remaining Columns (Col M to V) ──
    seller_order_id:      r.sellerOrderId || '',
    receiver_email:       r.receiverEmail || '',
    receiver_city:        r.receiverCity || '',
    receiver_state:       r.receiverState || '',
    category:             r.category || '',
    quantity:             r.quantity || 1,
    cod_amount:           r.codAmount || '',
    insurance_required:   r.insuranceRequired ? 'yes' : 'no',
    preferred_carrier:    r.preferredCarrier || 'auto',
    special_instructions: r.specialInstructions || '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 8 }, { wch: 50 }, ...Array(22).fill({ wch: 22 })];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fix_Errors');
  XLSX.writeFile(wb, 'securekaro_error_rows_fix.xlsx');
};

/* ── Colour helpers ──────────────────────────────────────────────────────── */
const PALETTE = {
  indigo:  { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca', badge: '#818cf8' },
  green:   { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
  rose:    { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
  amber:   { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  slate:   { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
  violet:  { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
  sky:     { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
};

/* ══════════════════════════════════════════════════════════════════════════
   BulkUploadPanel — Full v2 component
══════════════════════════════════════════════════════════════════════════ */
const BulkUploadPanel = ({ onUpload, onClose }) => {
  const [isDragging,    setIsDragging]    = useState(false);
  const [isUploading,   setIsUploading]   = useState(false);
  const [uploadResult,  setUploadResult]  = useState(null);
  const [isConfirming,  setIsConfirming]  = useState(false);
  const [confirmResult, setConfirmResult] = useState(null); // { jobId, message }
  const [jobStatus,     setJobStatus]     = useState(null); // live-polled status
  const [activeTab,     setActiveTab]     = useState('all'); // 'all' | 'valid' | 'invalid'
  const [showSchema,    setShowSchema]    = useState(false);
  const fileInputRef = useRef();
  const pollRef      = useRef(null);

  /* Poll job status every 2.5s until completed/failed */
  const startPolling = useCallback((jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/v1/agent/bulk-status/${jobId}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        setJobStatus(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollRef.current);
        }
      } catch (_) { /* silent */ }
    }, 2500);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── File handler ────────────────────────────────────────────────────── */
  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      alert('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    setActiveTab('all');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${getApiBase()}/api/v1/agent/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadResult(data);
      setActiveTab(data.invalidRows > 0 ? 'invalid' : 'valid');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Confirm booking ─────────────────────────────────────────────────── */
  const handleConfirmBooking = async () => {
    if (!uploadResult?.jobId) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/agent/bulk-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ jobId: uploadResult.jobId, bookOnlyValid: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Confirm failed');
      setConfirmResult(data);
      if (onUpload) onUpload(data);
      startPolling(data.jobId || uploadResult.jobId);
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  /* ── Download booking report ─────────────────────────────────────────── */
  const handleDownloadReport = () => {
    const jid = confirmResult?.jobId || uploadResult?.jobId;
    if (!jid) return;
    window.open(
      `${getApiBase()}/api/v1/agent/bulk-report/${jid}?token=${getToken()}`,
      '_blank'
    );
  };

  /* ── Filtered rows ───────────────────────────────────────────────────── */
  const allRows = uploadResult?.parsedRows || [];
  const displayRows = activeTab === 'valid'
    ? allRows.filter(r => r.isValid)
    : activeTab === 'invalid'
    ? allRows.filter(r => !r.isValid)
    : allRows;

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '22px',
      width: '100%',
      fontFamily: "'Inter', system-ui, sans-serif",
      maxHeight: '92vh',
      overflowY: 'auto'
    }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: PALETTE.indigo.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: PALETTE.indigo.text, flexShrink: 0
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h3 style={{ color: '#1e293b', margin: 0, fontSize: '15px', fontWeight: '800' }}>
              Bulk Shipment Upload
            </h3>
            <p style={{ color: '#64748b', fontSize: '11.5px', margin: '2px 0 0' }}>
              Upload Excel → Validate → Book up to 500 shipments in one shot
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} type="button" style={{
            background: '#f1f5f9', border: 'none', borderRadius: '10px',
            color: '#64748b', cursor: 'pointer', width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* ══ POST-BOOKING STATUS TRACKER ══════════════════════════════════ */}
      {confirmResult && (
        <div>
          {/* Progress card */}
          <div style={{
            background: jobStatus?.status === 'completed' ? PALETTE.green.bg : PALETTE.sky.bg,
            border: `1.5px solid ${jobStatus?.status === 'completed' ? PALETTE.green.border : PALETTE.sky.border}`,
            borderRadius: '16px', padding: '18px', marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {jobStatus?.status === 'completed'
                  ? <CheckCircle2 size={18} color={PALETTE.green.text} />
                  : <RefreshCw size={16} color={PALETTE.sky.text} style={{ animation: 'spin 1.2s linear infinite' }} />
                }
                <span style={{ fontWeight: '800', fontSize: '13px', color: jobStatus?.status === 'completed' ? PALETTE.green.text : PALETTE.sky.text }}>
                  {jobStatus?.status === 'completed' ? 'All Done! Shipments Booked' : 'Booking In Progress…'}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                {jobStatus?.progress ?? 0}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{
                height: '100%',
                width: `${jobStatus?.progress ?? 0}%`,
                background: jobStatus?.status === 'completed'
                  ? 'linear-gradient(90deg, #059669, #34d399)'
                  : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                borderRadius: '10px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: 'Total',     value: jobStatus?.totalRows     ?? confirmResult.totalRows,  color: '#475569' },
                { label: 'Processed', value: jobStatus?.processedRows ?? 0,                         color: '#0369a1' },
                { label: 'Booked ✓', value: jobStatus?.successCount  ?? 0,                         color: '#059669' },
                { label: 'Failed ✗',  value: jobStatus?.failCount     ?? 0,                         color: '#be123c' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', background: '#fff', borderRadius: '10px', padding: '8px 4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color }}>{value}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Download report button (available once completed) */}
          {jobStatus?.status === 'completed' && (
            <button
              onClick={handleDownloadReport}
              type="button"
              style={{
                width: '100%', background: 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none', borderRadius: '12px', color: '#fff',
                padding: '11px', cursor: 'pointer', fontSize: '13px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(5,150,105,0.28)', marginBottom: '10px'
              }}
            >
              <FileDown size={16} /> Download Full Booking Report (.xlsx)
            </button>
          )}

          <button
            onClick={onClose}
            type="button"
            style={{
              width: '100%', background: PALETTE.indigo.bg,
              border: `1.5px solid ${PALETTE.indigo.border}`,
              borderRadius: '12px', color: PALETTE.indigo.text,
              padding: '10px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '700'
            }}
          >
            Close & View Shipments
          </button>
        </div>
      )}

      {/* ══ PRE-BOOKING FLOW ═════════════════════════════════════════════ */}
      {!confirmResult && (
        <>
          {/* ── Action row: Template download + schema toggle ──────────── */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={downloadTemplate}
              type="button"
              style={{
                flex: 3, background: PALETTE.violet.bg, border: `1.5px solid ${PALETTE.violet.border}`,
                borderRadius: '12px', color: PALETTE.violet.text,
                padding: '10px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
              }}
            >
              <Download size={14} /> Download Template (.xlsx)
            </button>
            <button
              onClick={() => setShowSchema(s => !s)}
              type="button"
              style={{
                flex: 1, background: PALETTE.sky.bg, border: `1.5px solid ${PALETTE.sky.border}`,
                borderRadius: '12px', color: PALETTE.sky.text,
                padding: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Info size={14} /> Schema
            </button>
          </div>

          {/* ── Schema reference card (Side-by-side Table: Required on left, Optional on right) ── */}
          {showSchema && (
            <div style={{
              border: '1.5px solid #e2e8f0', borderRadius: '16px',
              overflow: 'hidden', marginBottom: '16px', background: '#f8fafc',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)'
            }}>
              {/* Header bar */}
              <div style={{
                background: '#ffffff', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap', gap: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                      📋 Excel Schema Structure — 22 Columns (Synchronized)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '800', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '999px', border: '1px solid #fecdd3' }}>
                      🔴 7 Required (Cols A–G)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '800', background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
                      🟢 5 Dimensions & Policy (Cols H–L)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '800', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                      ⚪ 10 Remaining (Cols M–V)
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Required columns are kept on the <strong>Left side</strong>; Optional columns are kept on the <strong>Right side</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setShowSchema(false)}
                  type="button"
                  style={{
                    background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center'
                  }}
                  title="Close Schema"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Synchronized Sequence Bar */}
              <div style={{
                background: '#f8faff', padding: '8px 14px', borderBottom: '1.5px solid #e2e8f0',
                fontSize: '10.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap'
              }}>
                <span style={{ fontWeight: '900', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={13} /> Synchronized Sequence:
                </span>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '10px', color: '#475569' }}>
                  <strong style={{ color: '#b91c1c' }}>receiver_name</strong> (A) → <strong style={{ color: '#b91c1c' }}>receiver_phone</strong> (B) → <strong style={{ color: '#b91c1c' }}>receiver_address</strong> (C) → <strong style={{ color: '#b91c1c' }}>pincode</strong> (D) → <strong style={{ color: '#b91c1c' }}>weight_kg</strong> (E) → <strong style={{ color: '#b91c1c' }}>description</strong> (F) → <strong style={{ color: '#b91c1c' }}>amount</strong> (G) → <strong style={{ color: '#047857' }}>height_cm</strong> (H) → <strong style={{ color: '#047857' }}>width_cm</strong> (I) → <strong style={{ color: '#047857' }}>length_cm</strong> (J) → <strong style={{ color: '#047857' }}>payment_mode</strong> (K) → <strong style={{ color: '#047857' }}>return_allowed</strong> (L) → seller_order_id (M) → receiver_email (N) → receiver_city (O) → receiver_state (P) → category (Q) → quantity (R) → cod_amount (S) → insurance_required (T) → preferred_carrier (U) → special_instructions (V)
                </span>
              </div>

              {/* Side-by-side Structured Tables */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '12px',
                padding: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {/* ── LEFT SIDE: REQUIRED COLUMNS TABLE ── */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #fecdd3',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.04)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                    padding: '9px 12px',
                    borderBottom: '1.5px solid #fecdd3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#991b1b', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                      REQUIRED FIELDS (Col A to G)
                    </span>
                    <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ffffff', color: '#b91c1c', padding: '1px 6px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                      7 Mandatory
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#fff5f5' }}>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#7f1d1d', textAlign: 'left', borderBottom: '2px solid #fecdd3', fontSize: '10.5px' }}>
                          COLUMN HEADER
                        </th>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#7f1d1d', textAlign: 'left', borderBottom: '2px solid #fecdd3', fontSize: '10.5px' }}>
                          EXAMPLE
                        </th>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#7f1d1d', textAlign: 'left', borderBottom: '2px solid #fecdd3', fontSize: '10.5px' }}>
                          VALIDATION RULE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {REQUIRED_SCHEMA.map((s, idx) => (
                        <tr key={s.col} style={{ borderBottom: '1px solid #fef2f2', background: idx % 2 === 0 ? '#ffffff' : '#fffafb' }}>
                          <td style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: '900', color: '#991b1b', fontSize: '11px' }}>
                                {s.col}
                              </span>
                              <span style={{ fontSize: '9px', fontWeight: '800', background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                                Col {s.colLetter}
                              </span>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
                          </td>
                          <td style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                            <code style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
                              {s.example}
                            </code>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#475569', fontSize: '10px', lineHeight: '1.4', verticalAlign: 'top' }}>
                            {s.tip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── RIGHT SIDE: OPTIONAL COLUMNS TABLE ── */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(100, 116, 139, 0.04)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    padding: '9px 12px',
                    borderBottom: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#334155', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                      OPTIONAL FIELDS (Col H to V)
                    </span>
                    <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ffffff', color: '#64748b', padding: '1px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      15 Optional
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#334155', textAlign: 'left', borderBottom: '2px solid #cbd5e1', fontSize: '10.5px' }}>
                          COLUMN HEADER
                        </th>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#334155', textAlign: 'left', borderBottom: '2px solid #cbd5e1', fontSize: '10.5px' }}>
                          DEFAULT
                        </th>
                        <th style={{ padding: '8px 10px', fontWeight: '900', color: '#334155', textAlign: 'left', borderBottom: '2px solid #cbd5e1', fontSize: '10.5px' }}>
                          DESCRIPTION & OPTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {OPTIONAL_SCHEMA.map((s, idx) => (
                        <tr key={s.col} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                          <td style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: '900', color: '#1e293b', fontSize: '11px' }}>
                                {s.col}
                              </span>
                              <span style={{ fontSize: '9px', fontWeight: '800', background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                Col {s.colLetter}
                              </span>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
                          </td>
                          <td style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                            <code style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
                              {s.defaultVal || '—'}
                            </code>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#475569', fontSize: '10px', lineHeight: '1.4', verticalAlign: 'top' }}>
                            {s.tip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Drop zone ─────────────────────────────────────────────── */}
          {!uploadResult && (
            <div
              style={{
                border: `2px dashed ${isDragging ? '#818cf8' : '#cbd5e1'}`,
                borderRadius: '16px', padding: '38px 20px', textAlign: 'center',
                cursor: 'pointer', background: isDragging ? PALETTE.indigo.bg : '#f8faff',
                transition: 'all 0.2s ease'
              }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls,.csv"
                onChange={e => handleFile(e.target.files[0])} />
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={26} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: PALETTE.indigo.text, fontSize: '13px', margin: 0, fontWeight: '700' }}>
                    Parsing & validating all rows…
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px', background: '#e0e7ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: PALETTE.indigo.text, margin: '0 auto 12px'
                  }}>
                    <Upload size={24} />
                  </div>
                  <p style={{ color: '#1e293b', fontSize: '13.5px', margin: '0 0 5px', fontWeight: '800' }}>
                    Click to browse or drag &amp; drop your Excel file
                  </p>
                  <p style={{ color: '#64748b', fontSize: '11.5px', margin: 0 }}>
                    Supports .xlsx, .xls, .csv · Max 10 MB · Up to 500 rows
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Validation result ─────────────────────────────────────── */}
          {uploadResult && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Total',   value: uploadResult.totalRows,   bg: PALETTE.slate.bg,  border: PALETTE.slate.border,  text: '#334155' },
                  { label: 'Valid ✓', value: uploadResult.validRows,   bg: PALETTE.green.bg,  border: PALETTE.green.border,  text: PALETTE.green.text },
                  { label: 'Errors ✗',value: uploadResult.invalidRows, bg: uploadResult.invalidRows > 0 ? PALETTE.rose.bg : PALETTE.slate.bg, border: uploadResult.invalidRows > 0 ? PALETTE.rose.border : PALETTE.slate.border, text: uploadResult.invalidRows > 0 ? PALETTE.rose.text : '#94a3b8' },
                  { label: 'COD',     value: (uploadResult.parsedRows || []).filter(r => r.paymentMode === 'cod').length, bg: PALETTE.amber.bg, border: PALETTE.amber.border, text: PALETTE.amber.text },
                ].map(({ label, value, bg, border, text }) => (
                  <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: '11px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>{value}</div>
                    <div style={{ fontSize: '10px', color: text, fontWeight: '600', opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Status banner */}
              <div style={{
                background: uploadResult.invalidRows > 0 ? PALETTE.amber.bg : PALETTE.green.bg,
                border: `1.5px solid ${uploadResult.invalidRows > 0 ? PALETTE.amber.border : PALETTE.green.border}`,
                borderRadius: '11px', padding: '10px 13px', marginBottom: '12px',
                fontSize: '12px', color: uploadResult.invalidRows > 0 ? PALETTE.amber.text : PALETTE.green.text,
                display: 'flex', alignItems: 'center', gap: '7px'
              }}>
                {uploadResult.invalidRows > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                <span style={{ fontWeight: '600' }}>{uploadResult.message}</span>
              </div>

              {/* Tab filter */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[
                  { key: 'all',     label: `All (${uploadResult.totalRows})` },
                  { key: 'valid',   label: `Valid (${uploadResult.validRows})` },
                  { key: 'invalid', label: `Errors (${uploadResult.invalidRows})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    type="button"
                    style={{
                      padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer', border: '1.5px solid',
                      background: activeTab === key ? PALETTE.indigo.bg : '#fff',
                      borderColor: activeTab === key ? PALETTE.indigo.badge : '#e2e8f0',
                      color: activeTab === key ? PALETTE.indigo.text : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    {label}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  {uploadResult.invalidRows > 0 && (
                    <button
                      onClick={() => downloadErrorRows(uploadResult.parsedRows)}
                      type="button"
                      style={{
                        padding: '5px 10px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '700',
                        cursor: 'pointer', border: `1px solid ${PALETTE.rose.border}`,
                        background: '#fff', color: PALETTE.rose.text
                      }}
                    >
                      Export Errors (.xlsx)
                    </button>
                  )}
                </div>
              </div>

              {/* Data preview table */}
              <div style={{
                maxHeight: '200px', overflowY: 'auto', overflowX: 'auto',
                borderRadius: '11px', border: `1.5px solid #e2e8f0`, marginBottom: '14px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                      {['#', 'Order ID', 'Receiver', 'Phone', 'Pincode', 'Wt', 'Amount', 'Mode', 'Carrier', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', color: '#0f172a', fontWeight: '900', borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(row => (
                      <tr key={row.rowNumber} style={{
                        background: row.isValid ? '#fff' : '#fff8f8',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <td style={{ padding: '6px 9px', color: '#94a3b8' }}>#{row.rowNumber}</td>
                        <td style={{ padding: '6px 9px', color: '#64748b', fontFamily: 'monospace', fontSize: '10px' }}>
                          {row.sellerOrderId || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ padding: '6px 9px', color: '#1e293b', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.receiverName || '—'}
                        </td>
                        <td style={{ padding: '6px 9px', color: '#475569' }}>{row.receiverPhone || '—'}</td>
                        <td style={{ padding: '6px 9px', color: '#475569' }}>{row.pincode || '—'}</td>
                        <td style={{ padding: '6px 9px', color: '#475569' }}>{row.weightKg ? `${row.weightKg}kg` : '—'}</td>
                        <td style={{ padding: '6px 9px', color: '#1e293b', fontWeight: '700' }}>
                          {row.amount ? `₹${row.amount}` : '—'}
                        </td>
                        <td style={{ padding: '6px 9px' }}>
                          <span style={{
                            background: row.paymentMode === 'cod' ? PALETTE.amber.bg : PALETTE.green.bg,
                            color: row.paymentMode === 'cod' ? PALETTE.amber.text : PALETTE.green.text,
                            fontSize: '9.5px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px'
                          }}>
                            {(row.paymentMode || 'prepaid').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '6px 9px', color: '#64748b', fontSize: '10px' }}>
                          {row.preferredCarrier && row.preferredCarrier !== 'auto'
                            ? row.preferredCarrier
                            : <span style={{ color: '#94a3b8' }}>auto</span>
                          }
                        </td>
                        <td style={{ padding: '6px 9px' }}>
                          {row.isValid ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px' }}>
                              Ready
                            </span>
                          ) : (
                            <span
                              style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '9.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '8px', cursor: 'help' }}
                              title={row.errors?.join('\n')}
                            >
                              {row.errors?.length} error{row.errors?.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {displayRows.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                          No rows in this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Error detail for invalid rows */}
              {activeTab === 'invalid' && uploadResult.invalidRows > 0 && (
                <div style={{
                  background: PALETTE.rose.bg, border: `1.5px solid ${PALETTE.rose.border}`,
                  borderRadius: '12px', padding: '11px 14px', marginBottom: '12px',
                  maxHeight: '120px', overflowY: 'auto'
                }}>
                  <div style={{ color: PALETTE.rose.text, fontWeight: '800', fontSize: '11.5px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={13} /> Error Details
                  </div>
                  {uploadResult.parsedRows.filter(r => !r.isValid).map(r => (
                    <div key={r.rowNumber} style={{ fontSize: '11px', color: '#9f1239', marginBottom: '4px' }}>
                      <strong>Row #{r.rowNumber}</strong>
                      {r.sellerOrderId && <span style={{ color: '#94a3b8' }}> ({r.sellerOrderId})</span>}
                      : {r.errors?.join(' · ')}
                    </div>
                  ))}
                </div>
              )}

              {/* COD summary if any */}
              {(uploadResult.parsedRows || []).some(r => r.paymentMode === 'cod' && r.isValid) && (
                <div style={{
                  background: PALETTE.amber.bg, border: `1.5px solid ${PALETTE.amber.border}`,
                  borderRadius: '11px', padding: '9px 13px', marginBottom: '12px',
                  fontSize: '11.5px', color: PALETTE.amber.text, display: 'flex', alignItems: 'center', gap: '7px'
                }}>
                  <Package size={14} />
                  <span>
                    <strong>{(uploadResult.parsedRows || []).filter(r => r.paymentMode === 'cod' && r.isValid).length} COD shipments</strong>
                    {' '}— Receiver SMS notifications will be sent. No payment link generated for COD rows.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setUploadResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{
                    flex: 1, background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                    borderRadius: '12px', color: '#475569', padding: '11px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <RefreshCw size={13} /> Upload New File
                </button>

                {uploadResult.validRows > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isConfirming}
                    style={{
                      flex: 2,
                      background: isConfirming ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      border: 'none', borderRadius: '12px', color: '#fff', padding: '11px',
                      cursor: isConfirming ? 'not-allowed' : 'pointer', fontSize: '12.5px', fontWeight: '800',
                      boxShadow: isConfirming ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {isConfirming ? (
                      <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Booking…</>
                    ) : (
                      <><Zap size={14} /> Book {uploadResult.validRows} Valid Shipment{uploadResult.validRows !== 1 ? 's' : ''}</>
                    )}
                  </button>
                )}
              </div>

              {/* Disclaimer */}
              <p style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', margin: '10px 0 0' }}>
                Only the <strong style={{ color: '#64748b' }}>{uploadResult.validRows} valid rows</strong> will be booked.
                {uploadResult.invalidRows > 0 && ` ${uploadResult.invalidRows} error row(s) will be skipped — fix & re-upload them separately.`}
              </p>
            </div>
          )}
        </>
      )}

      {/* Spin keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BulkUploadPanel;
