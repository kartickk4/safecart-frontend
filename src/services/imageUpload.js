/**
 * imageUpload.js
 * Uploads a File/Blob to ImgBB (free CDN) and returns a permanent public URL.
 * Falls back to a base64 URL (in-memory only) if ImgBB upload fails.
 *
 * ImgBB free API: https://api.imgbb.com/
 * - No account required for testing; use the free API key below.
 * - 32MB file size limit, no expiry by default.
 */

// Free ImgBB API key — set VITE_IMGBB_API_KEY in your .env.local
// Get yours free at: https://api.imgbb.com/ (requires free account)
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

/**
 * Converts a File or Blob to a base64 string (without the data: prefix).
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) return reject(new Error('FileReader returned empty'));
      // Remove the "data:image/...;base64," prefix
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
const compressImageFile = (file, maxWidth = 1600, quality = 0.85) => {
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
 * Upload an image file to ImgBB and return the permanent URL.
 * Falls back to an optimized base64 data URL on failure (works for display and backend storage).
 *
 * @param {File} file - The image file to upload
 * @param {string} [name] - Optional name for the image
 * @returns {Promise<{ url: string, isHosted: boolean }>}
 */
export const uploadImageToHost = async (file, name = 'parcel-photo') => {
  // No API key configured — fall back to compressed base64 immediately
  if (!IMGBB_API_KEY) {
    try {
      const dataUrl = await compressImageFile(file);
      return { url: dataUrl, isHosted: false };
    } catch {
      return { url: '', isHosted: false };
    }
  }

  try {
    const base64 = await fileToBase64(file);

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    formData.append('name', name);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data?.url) {
      return { url: data.data.display_url || data.data.url, isHosted: true };
    }

    throw new Error('ImgBB upload succeeded but no URL in response');
  } catch (err) {
    console.warn('[imageUpload] ImgBB upload failed, falling back to base64:', err.message);
    // Fallback: return base64 data URL (for in-session display only)
    try {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, isHosted: false };
    } catch {
      return { url: '', isHosted: false };
    }
  }
};
