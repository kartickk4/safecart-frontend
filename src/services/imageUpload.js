/**
 * imageUpload.js
 * Uploads a File/Blob directly to SecureKaro Backend (backed by Cloudflare R2 object storage).
 * Returns a permanent, fast CDN URL.
 * Falls back to an optimized base64 data URL if network/service is temporarily unavailable.
 */

import { uploadAPI } from './api';

/**
 * Converts a File or Blob to a base64 Data URL (data:image/...;base64,...)
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a File or Blob to a base64 string (without the data: prefix).
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) return reject(new Error('FileReader returned empty'));
      const base64 = result.toString().split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image file client-side to ensure fast uploads and manageable payload size.
 */
export const compressImageFile = (file, maxWidth = 1600, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type.includes('svg')) {
      fileToDataUrl(file).then(resolve).catch(() => resolve(''));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        resolve(e.target?.result || '');
      };
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Upload an image file to SecureKaro Cloudflare R2 and return the permanent URL.
 * Falls back to an optimized base64 data URL on failure.
 *
 * @param {File} file - The image file to upload
 * @param {string} [name] - Optional name / folder context for the image
 * @returns {Promise<{ url: string, isHosted: boolean }>}
 */
export const uploadImageToHost = async (file, name = 'parcel-photo') => {
  const folder = name.startsWith('defect') ? 'defects' : 'parcels';

  // 1. Primary: Direct upload to SecureKaro Cloudflare R2
  try {
    const res = await uploadAPI.uploadFile(file, folder);
    if (res?.data?.url) {
      return {
        url: res.data.url,
        isHosted: true
      };
    }
  } catch (err) {
    console.warn('[imageUpload] Cloudflare R2 direct upload unavailable, falling back to client compression:', err?.response?.data?.error || err.message);
  }

  // 2. Secondary Fallback: Compressed client-side base64
  try {
    const dataUrl = await compressImageFile(file);
    return { url: dataUrl, isHosted: false };
  } catch {
    return { url: '', isHosted: false };
  }
};
