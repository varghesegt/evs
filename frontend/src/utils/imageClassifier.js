/**
 * Client-Side Real-Time Computer Vision Image Pre-Processor
 * Analyzes RGB color distribution, spectral warmth, edge gradients, and estimated container fill
 */
export function analyzeFoodImageClientSide(imageSource) {
  return new Promise((resolve) => {
    if (!imageSource || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 120; // Fast downsampled matrix
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        let totalR = 0, totalG = 0, totalB = 0;
        let counted = 0;
        const colorBins = {};
        const luminances = [];

        let foodPixels = 0;
        let interiorPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip pure black/white background
          if ((r > 245 && g > 245 && b > 245) || (r < 15 && g < 15 && b < 15)) {
            continue;
          }

          totalR += r;
          totalG += g;
          totalB += b;
          counted++;

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          luminances.push(lum);

          // 32-level quantization for palette extraction
          const qR = Math.min(255, Math.floor(r / 32) * 32 + 16);
          const qG = Math.min(255, Math.floor(g / 32) * 32 + 16);
          const qB = Math.min(255, Math.floor(b / 32) * 32 + 16);
          const hex = `#${((1 << 24) + (qR << 16) + (qG << 8) + qB).toString(16).slice(1).toUpperCase()}`;
          colorBins[hex] = (colorBins[hex] || 0) + 1;

          // Check if pixel is within 70% inner container circle
          const pxIdx = i / 4;
          const x = pxIdx % size;
          const y = Math.floor(pxIdx / size);
          const distFromCenter = Math.sqrt(Math.pow(x - size / 2, 2) + Math.pow(y - size / 2, 2));

          if (distFromCenter < size * 0.42) {
            interiorPixels++;
            // Color differentiation from metallic gray
            const delta = Math.max(Math.abs(r - g), Math.abs(g - b));
            if (delta > 14 || (lum > 40 && lum < 220)) {
              foodPixels++;
            }
          }
        }

        if (counted === 0) {
          resolve(null);
          return;
        }

        const avgR = Math.round(totalR / counted);
        const avgG = Math.round(totalG / counted);
        const avgB = Math.round(totalB / counted);

        // Warmth Ratio: (R - B) / (R + B + 1)
        const warmthRatio = (avgR - avgB) / (avgR + avgB + 1);
        const greenRatio = avgG / (avgR + avgB + 1);

        // Texture variance
        const meanLum = luminances.reduce((a, b) => a + b, 0) / (luminances.length || 1);
        const variance = Math.sqrt(luminances.reduce((sum, val) => sum + Math.pow(val - meanLum, 2), 0) / (luminances.length || 1));

        // Top 3 dominant hex colors
        const dominantColors = Object.entries(colorBins)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hex]) => hex);

        // Optical fill estimate
        const opticalFill = interiorPixels > 0
          ? Math.min(100, Math.max(25, Math.round((foodPixels / interiorPixels) * 100)))
          : 75;

        // Classification Heuristic
        let suggestedCategory = 'MIXED_MEAL';
        let suggestedName = 'Banquet Feast Meal';

        if (greenRatio > 0.65 && avgG > avgR) {
          suggestedCategory = 'COOKED_VEGETABLES';
          suggestedName = 'Vegetable Medley & Poriyal';
        } else if (warmthRatio > 0.45 && variance > 30) {
          suggestedCategory = 'COOKED_RICE';
          suggestedName = 'Spiced Biryani / Cooked Pilaf';
        } else if (warmthRatio > 0.35 && variance <= 30) {
          suggestedCategory = 'COOKED_CURRY';
          suggestedName = 'Rich Sambar & Dal Curry';
        } else if (warmthRatio > 0.20 && variance > 20 && avgR > 160 && avgG > 130) {
          suggestedCategory = 'BREAD_BAKERY';
          suggestedName = 'Tandoori Rotis & Naan Breads';
        } else if (meanLum > 200 && Math.abs(avgR - avgG) < 15) {
          suggestedCategory = 'DAIRY';
          suggestedName = 'Fresh Milk & Dairy Preparation';
        }

        resolve({
          avgR,
          avgG,
          avgB,
          warmthRatio: Math.round(warmthRatio * 100) / 100,
          textureVariance: Math.round(variance * 10) / 10,
          dominantColors: dominantColors.length ? dominantColors : ['#D97706', '#B45309'],
          opticalFillPercentage: opticalFill,
          suggestedCategory,
          suggestedName,
        });
      } catch (e) {
        console.warn('Client-side vision analysis fallback', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSource;
  });
}
