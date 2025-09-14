/**
 * Utility for converting SVG strings to PNG images for PDF embedding
 */

export interface SvgToImageOptions {
  width?: number;
  height?: number;
  scale?: number;
}

/**
 * Convert an SVG string to a PNG image as Uint8Array
 * This uses the browser's Canvas API to render the SVG and extract image data
 */
export async function svgToPng(
  svgString: string,
  options: SvgToImageOptions = {}
): Promise<Uint8Array> {
  const { width = 400, height = 300, scale = 2 } = options;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  // Set canvas size with scale for better quality
  canvas.width = width * scale;
  canvas.height = height * scale;

  // Scale the context to maintain the desired output size
  ctx.scale(scale, scale);

  // Create an image from the SVG
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw the SVG image onto the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to PNG blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'));
            return;
          }

          // Convert blob to Uint8Array
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsArrayBuffer(blob);
        }, 'image/png');

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load SVG image'));

    // Create data URL from SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;

    // Clean up the object URL after the image loads
    const originalOnLoad = img.onload;
    img.onload = (event) => {
      URL.revokeObjectURL(url);
      if (originalOnLoad) {
        originalOnLoad.call(img, event);
      }
    };
  });
}

/**
 * Convert multiple SVG strings to PNG images in parallel
 */
export async function svgsToPngs(
  svgStrings: string[],
  options: SvgToImageOptions = {}
): Promise<Uint8Array[]> {
  const promises = svgStrings.map(svg => svgToPng(svg, options));
  return Promise.all(promises);
}

/**
 * Extract dimensions from SVG string
 */
export function getSvgDimensions(svgString: string): { width: number; height: number } {
  const widthMatch = svgString.match(/width="(\d+)"/);
  const heightMatch = svgString.match(/height="(\d+)"/);

  const width = widthMatch ? parseInt(widthMatch[1], 10) : 400;
  const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;

  return { width, height };
}