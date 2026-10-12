/**
 * Image Clarity & Sharpness Analyzer
 * Uses HTML5 Canvas + Laplacian edge variance to detect blurry or poorly lit photos.
 * Rejects blurry, out-of-focus, or underexposed product photos in real time.
 */

export async function analyzeImageClarity(imageSource) {
  return new Promise((resolve) => {
    let srcUrl = '';
    let isObjectUrl = false;

    if (typeof imageSource === 'string') {
      srcUrl = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      srcUrl = URL.createObjectURL(imageSource);
      isObjectUrl = true;
    } else {
      return resolve({ isClear: false, score: 0, reason: 'Invalid image format provided.' });
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        if (isObjectUrl) URL.revokeObjectURL(srcUrl);

        // 1. Resolution Check
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        if (origWidth < 200 || origHeight < 200) {
          return resolve({
            isClear: false,
            score: 10,
            brightness: 0,
            reason: `Resolution is too low (${origWidth}x${origHeight}px). Please take a higher-resolution photo.`
          });
        }

        // Downscale to max 300x300 for fast, consistent Laplacian analysis
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let w = origWidth;
        let h = origHeight;

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve({ isClear: true, score: 80, brightness: 128 });
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // 2. Grayscale conversion and average brightness
        const gray = new Float32Array(w * h);
        let totalBrightness = 0;

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[j] = lum;
          totalBrightness += lum;
        }

        const avgBrightness = totalBrightness / (w * h);

        // Lighting checks
        if (avgBrightness < 30) {
          return resolve({
            isClear: false,
            score: Math.round(avgBrightness),
            brightness: Math.round(avgBrightness),
            reason: 'Photo is too dark. Please take photo under adequate lighting.'
          });
        }

        if (avgBrightness > 245) {
          return resolve({
            isClear: false,
            score: 20,
            brightness: Math.round(avgBrightness),
            reason: 'Photo is overexposed/too bright. Please ensure the product is clearly visible.'
          });
        }

        // 3. Laplacian filter calculation for sharpness / blur detection
        // Kernel:
        //  0  1  0
        //  1 -4  1
        //  0  1  0
        let laplacianSum = 0;
        let laplacianSqSum = 0;
        let count = 0;

        for (let y = 1; y < h - 1; y++) {
          const rowPrev = (y - 1) * w;
          const rowCurr = y * w;
          const rowNext = (y + 1) * w;

          for (let x = 1; x < w - 1; x++) {
            const center = gray[rowCurr + x];
            const top = gray[rowPrev + x];
            const bottom = gray[rowNext + x];
            const left = gray[rowCurr + x - 1];
            const right = gray[rowCurr + x + 1];

            const lapVal = top + bottom + left + right - 4 * center;
            laplacianSum += lapVal;
            laplacianSqSum += lapVal * lapVal;
            count++;
          }
        }

        const mean = laplacianSum / count;
        const variance = (laplacianSqSum / count) - (mean * mean);

        // Blur threshold: A blurry/out-of-focus image typically has variance < 70
        const BLUR_THRESHOLD = 70;
        const isSharp = variance >= BLUR_THRESHOLD;

        // Normalized score from 0 to 100
        const clarityScore = Math.min(100, Math.max(10, Math.round((variance / 180) * 100)));

        if (!isSharp) {
          return resolve({
            isClear: false,
            score: clarityScore,
            variance: Math.round(variance),
            brightness: Math.round(avgBrightness),
            reason: 'Photo is blurry or out of focus. Please hold the camera steady and take a clear, sharp photo of the product.'
          });
        }

        return resolve({
          isClear: true,
          score: clarityScore,
          variance: Math.round(variance),
          brightness: Math.round(avgBrightness)
        });
      } catch (err) {
        console.error('Image clarity check error:', err);
        resolve({ isClear: true, score: 75, brightness: 128 });
      }
    };

    img.onerror = () => {
      if (isObjectUrl) URL.revokeObjectURL(srcUrl);
      resolve({ isClear: false, score: 0, reason: 'Failed to read image file. Please upload a valid image.' });
    };

    img.src = srcUrl;
  });
}
