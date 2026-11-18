/**
 * Centralized Smart Form Validation & Sanitization Engine
 * Tailored for Indian E-Commerce, Logistics, and Fintech workflows.
 * Adheres to WCAG 2.1 AA and Karpathy Surgical Execution principles.
 */

/**
 * Sanitizes phone number: strips non-digits and removes leading 91/+91 if 12 digits
 */
export function sanitizePhone(input = '') {
  if (typeof input !== 'string') input = String(input || '');
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/**
 * Smart phone validation (Indian mobile: 10 digits starting with 6, 7, 8, or 9)
 */
export function validatePhone(phone = '') {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) {
    return { isValid: false, error: 'Mobile number is required', sanitized };
  }
  if (sanitized.length < 10) {
    return { isValid: false, error: `Enter 10-digit mobile (${sanitized.length}/10 digits entered)`, sanitized };
  }
  if (!/^[6-9]\d{9}$/.test(sanitized)) {
    return { isValid: false, error: 'Indian mobile must start with 6, 7, 8, or 9', sanitized };
  }
  return { isValid: true, error: '', sanitized };
}

/**
 * Sanitizes Indian pincode: digits only, max 6 digits
 */
export function sanitizePincode(input = '') {
  if (typeof input !== 'string') input = String(input || '');
  return input.replace(/\D/g, '').slice(0, 6);
}

/**
 * Smart Indian Postal PIN Code validation (6 digits, non-zero first digit)
 */
export function validatePincode(pincode = '') {
  const sanitized = sanitizePincode(pincode);
  if (!sanitized) {
    return { isValid: false, error: 'Pincode is required', sanitized };
  }
  if (sanitized.length < 6) {
    return { isValid: false, error: `Pincode must be 6 digits (${sanitized.length}/6 entered)`, sanitized };
  }
  if (!/^[1-9][0-9]{5}$/.test(sanitized)) {
    return { isValid: false, error: 'Invalid Indian Pincode format (cannot start with 0)', sanitized };
  }
  return { isValid: true, error: '', sanitized };
}

/**
 * Sanitizes and validates standard RFC Email format
 */
export function validateEmail(email = '') {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required', sanitized: '' };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com)', sanitized: trimmed };
  }
  return { isValid: true, error: '', sanitized: trimmed };
}

/**
 * Validates UPI Virtual Private Address (VPA)
 * Example formats: mobile@upi, merchant@okaxis, user.name@paytm
 */
export function validateUpi(upiId = '') {
  const trimmed = (upiId || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'UPI ID is required', sanitized: '' };
  }
  // Standard NPCI UPI VPA format
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid UPI ID format (e.g. 9876543210@paytm or name@okaxis)', sanitized: trimmed };
  }
  return { isValid: true, error: '', sanitized: trimmed };
}

/**
 * Sanitizes bank account: digits only
 */
export function sanitizeBankAcc(acc = '') {
  if (typeof acc !== 'string') acc = String(acc || '');
  return acc.replace(/\D/g, '').slice(0, 18);
}

/**
 * Validates Indian Bank Account Number (between 9 and 18 digits)
 */
export function validateBankAcc(accNumber = '') {
  const sanitized = sanitizeBankAcc(accNumber);
  if (!sanitized) {
    return { isValid: false, error: 'Bank account number is required', sanitized };
  }
  if (sanitized.length < 9) {
    return { isValid: false, error: `Account number too short (${sanitized.length}/9-18 digits)`, sanitized };
  }
  if (!/^\d{9,18}$/.test(sanitized)) {
    return { isValid: false, error: 'Account number must contain 9 to 18 digits only', sanitized };
  }
  return { isValid: true, error: '', sanitized };
}

/**
 * Sanitizes and uppercases Indian IFSC Code (11 alphanumeric characters)
 */
export function sanitizeIfsc(ifsc = '') {
  if (typeof ifsc !== 'string') ifsc = String(ifsc || '');
  return ifsc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
}

/**
 * Validates RBI IFSC Code format:
 * 4 letters (Bank Code) + '0' (5th char reserved) + 6 alphanumeric characters
 * Example: SBIN0001234, HDFC0000001
 */
export function validateIfsc(ifsc = '') {
  const sanitized = sanitizeIfsc(ifsc);
  if (!sanitized) {
    return { isValid: false, error: 'IFSC Code is required', sanitized };
  }
  if (sanitized.length < 11) {
    return { isValid: false, error: `IFSC must be 11 characters (${sanitized.length}/11 entered)`, sanitized };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid IFSC format (e.g. HDFC0001234, 5th character must be 0)', sanitized };
  }
  return { isValid: true, error: '', sanitized };
}

/**
 * Validates positive financial amounts
 */
export function validateAmount(amount, { min = 1, max = 1000000, balance = Infinity } = {}) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return { isValid: false, error: 'Enter a valid amount', value: 0 };
  }
  if (num < min) {
    return { isValid: false, error: `Minimum amount is ₹${min.toLocaleString('en-IN')}`, value: num };
  }
  if (num > max) {
    return { isValid: false, error: `Maximum allowed is ₹${max.toLocaleString('en-IN')}`, value: num };
  }
  if (num > balance) {
    return { isValid: false, error: `Amount exceeds available balance (₹${balance.toLocaleString('en-IN')})`, value: num };
  }
  return { isValid: true, error: '', value: num };
}

/**
 * Validates courier parcel weight (kg)
 */
export function validateWeight(weight, { min = 0.05, max = 100 } = {}) {
  const num = typeof weight === 'number' ? weight : parseFloat(weight);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Enter valid parcel weight in kg', value: 0.5 };
  }
  if (num < min) {
    return { isValid: false, error: `Minimum weight is ${min} kg`, value: num };
  }
  if (num > max) {
    return { isValid: false, error: `Maximum courier weight is ${max} kg`, value: num };
  }
  return { isValid: true, error: '', value: num };
}
