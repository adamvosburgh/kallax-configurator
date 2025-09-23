/**
 * Axonometric view generation for 3D visualization
 * Creates a clear isometric projection of the shelving unit
 */

import type { DesignParams } from './types';

// Local copy of dimension calculation to avoid interfering with core geometry
function calculateLocalDimensions(params: DesignParams) {
  const { rows, cols, interiorClearanceInches, depthInches } = params;
  const frameThickness = params.materials.frame.actualInches;
  
  const extWidth = cols * (interiorClearanceInches + frameThickness) + frameThickness;
  const extHeight = rows * (interiorClearanceInches + frameThickness) + frameThickness;
  const extDepth = depthInches;
  
  return { extWidth, extHeight, extDepth };
}

// Simple isometric projection (30° angles)
const SCALE = 3; // Make it bigger for clarity
const ISO_ANGLE = Math.PI / 6; // 30 degrees

// Project 3D point to 2D isometric view
function toIso(x: number, y: number, z: number): [number, number] {
  // Standard isometric projection
  const isoX = (x - z) * Math.cos(ISO_ANGLE);
  const isoY = (x + z) * Math.sin(ISO_ANGLE) + y;
  return [isoX * SCALE, -isoY * SCALE]; // Flip Y for SVG coordinates
}

/**
 * Generate axonometric SVG view of the modular shelving unit
 */
export function generateAxonometricSvg(params: DesignParams): string {
  const { rows, cols, hasBack } = params;
  const dimensions = calculateLocalDimensions(params);
  const { extWidth, extHeight, extDepth } = dimensions;
  
  // Grid cell dimensions
  const cellWidth = params.interiorClearanceInches;
  const cellHeight = params.interiorClearanceInches;
  const thickness = params.materials.frame.actualInches;
  
  // SVG setup
  const padding = 80;
  const projectedWidth = extWidth * SCALE + extDepth * SCALE * Math.cos(ISO_ANGLE);
  const projectedHeight = extHeight * SCALE + extDepth * SCALE * Math.sin(ISO_ANGLE);
  const canvasWidth = projectedWidth + padding * 2;
  const canvasHeight = projectedHeight + padding * 2;
  
  const elements: string[] = [];
  
  // SVG header
  elements.push(`<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Simpler, clearer styles
  elements.push(`
    <defs>
      <style>
        .outer-frame { fill: #ddd; stroke: #333; stroke-width: 2; }
        .shelf-top { fill: #f0f0f0; stroke: #666; stroke-width: 1; }
        .shelf-front { fill: #e0e0e0; stroke: #666; stroke-width: 1; }
        .shelf-side { fill: #ccc; stroke: #666; stroke-width: 1; }
        .divider-front { fill: #e8e8e8; stroke: #666; stroke-width: 1; }
        .divider-side { fill: #d0d0d0; stroke: #666; stroke-width: 1; }
        .back-panel { fill: #f5f5f5; stroke: #999; stroke-width: 1; }
      </style>
    </defs>
  `);
  
  // Center the drawing
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Helper to convert 3D to SVG coordinates (centered)
  function coord(x: number, y: number, z: number): [number, number] {
    const [isoX, isoY] = toIso(x, y, z);
    return [centerX + isoX, centerY + isoY];
  }
  
  // Helper to create a path from points
  function path(points: [number, number][]): string {
    const [start, ...rest] = points;
    return `M ${start[0]},${start[1]} ${rest.map(p => `L ${p[0]},${p[1]}`).join(' ')} Z`;
  }
  
  // Draw from back to front for proper layering
  
  // 1. BACK PANEL (if present)
  if (hasBack) {
    const backTL = coord(0, extHeight, extDepth);
    const backTR = coord(extWidth, extHeight, extDepth);
    const backBL = coord(0, 0, extDepth);
    const backBR = coord(extWidth, 0, extDepth);
    
    elements.push(`<path d="${path([backBL, backBR, backTR, backTL])}" class="back-panel" />`);
  }
  
  // 2. MAIN OUTER FRAME
  // Top face
  const topTL = coord(0, extHeight, 0);
  const topTR = coord(extWidth, extHeight, 0);
  const topBL = coord(0, extHeight, extDepth);
  const topBR = coord(extWidth, extHeight, extDepth);
  elements.push(`<path d="${path([topTL, topTR, topBR, topBL])}" class="outer-frame" />`);
  
  // Front face
  const frontTL = coord(0, extHeight, 0);
  const frontTR = coord(extWidth, extHeight, 0);
  const frontBL = coord(0, 0, 0);
  const frontBR = coord(extWidth, 0, 0);
  elements.push(`<path d="${path([frontBL, frontBR, frontTR, frontTL])}" class="outer-frame" />`);
  
  // Right face
  const rightTF = coord(extWidth, extHeight, 0);
  const rightTB = coord(extWidth, extHeight, extDepth);
  const rightBF = coord(extWidth, 0, 0);
  const rightBB = coord(extWidth, 0, extDepth);
  elements.push(`<path d="${path([rightBF, rightBB, rightTB, rightTF])}" class="outer-frame" />`);
  
  // 3. HORIZONTAL SHELVES (each row)
  for (let row = 1; row < rows; row++) {
    const shelfY = row * (cellHeight + thickness);
    
    for (let col = 0; col < cols; col++) {
      const shelfXStart = col * (cellWidth + thickness) + thickness;
      const shelfXEnd = shelfXStart + cellWidth;
      
      // Shelf top face
      const shelfTL = coord(shelfXStart, shelfY, thickness);
      const shelfTR = coord(shelfXEnd, shelfY, thickness);
      const shelfBL = coord(shelfXStart, shelfY, extDepth - thickness);
      const shelfBR = coord(shelfXEnd, shelfY, extDepth - thickness);
      elements.push(`<path d="${path([shelfTL, shelfTR, shelfBR, shelfBL])}" class="shelf-top" />`);
      
      // Shelf front edge
      const frontTL2 = coord(shelfXStart, shelfY, thickness);
      const frontTR2 = coord(shelfXEnd, shelfY, thickness);
      const frontBL2 = coord(shelfXStart, shelfY - thickness, thickness);
      const frontBR2 = coord(shelfXEnd, shelfY - thickness, thickness);
      elements.push(`<path d="${path([frontBL2, frontBR2, frontTR2, frontTL2])}" class="shelf-front" />`);
    }
  }
  
  // 4. VERTICAL DIVIDERS (each column)
  for (let col = 1; col < cols; col++) {
    const dividerX = col * (cellWidth + thickness);
    
    // Divider front face
    const divFrontTL = coord(dividerX, extHeight - thickness, thickness);
    const divFrontTR = coord(dividerX + thickness, extHeight - thickness, thickness);
    const divFrontBL = coord(dividerX, thickness, thickness);
    const divFrontBR = coord(dividerX + thickness, thickness, thickness);
    elements.push(`<path d="${path([divFrontBL, divFrontBR, divFrontTR, divFrontTL])}" class="divider-front" />`);
    
    // Divider right side
    const divSideTF = coord(dividerX + thickness, extHeight - thickness, thickness);
    const divSideTB = coord(dividerX + thickness, extHeight - thickness, extDepth - thickness);
    const divSideBF = coord(dividerX + thickness, thickness, thickness);
    const divSideBB = coord(dividerX + thickness, thickness, extDepth - thickness);
    elements.push(`<path d="${path([divSideBF, divSideBB, divSideTB, divSideTF])}" class="divider-side" />`);
  }
  
  elements.push('</svg>');
  return elements.join('\n');
}

/**
 * Generate a test axonometric view for development
 */
export function generateTestAxonometricSvg(): string {
  const testParams: DesignParams = {
    rows: 3,
    cols: 3,
    merges: [
      { r0: 0, c0: 1, r1: 1, c1: 2 }, // 2×2 merge in top-right
    ],
    interiorClearanceInches: 13.25,
    depthInches: 15.375,
    hasBack: true,
    hasDoors: false,
    doorMode: { type: 'inset' },
    materials: {
      frame: { nominal: '3/4"', actualInches: 0.75 },
      back: { nominal: '1/4"', actualInches: 0.25 },
    },
  };
  
  return generateAxonometricSvg(testParams);
}