/**
 * SVG generation for cut list sheet layouts
 * Creates technical drawings showing part placement and rip cuts
 */

import type { SheetLayout, OversizedPart } from './ripGenerator';

// SVG dimensions and styling - tight around content
const MARGIN = 40; // Minimal margin
const TITLE_SPACE = 20; // Space for sheet title at top
const DIMENSION_SPACE = 20; // Space for dimension text at bottom
const SHEET_RATIO = 48 / 96; // 4' x 8' sheet (width/height)

// Calculate sheet dimensions - make SVG tight around actual content
const SHEET_DISPLAY_HEIGHT = 400; // Fixed height for sheet
const SHEET_DISPLAY_WIDTH = SHEET_DISPLAY_HEIGHT * SHEET_RATIO;

const SVG_WIDTH = SHEET_DISPLAY_WIDTH + 2 * MARGIN;
const SVG_HEIGHT = SHEET_DISPLAY_HEIGHT + 2 * MARGIN + TITLE_SPACE + DIMENSION_SPACE;

// Scaling factors
const SCALE_X = SHEET_DISPLAY_WIDTH / 48; // 48" sheet width
const SCALE_Y = SHEET_DISPLAY_HEIGHT / 96; // 96" sheet height

/**
 * Convert inches to SVG coordinates
 */
function inchesToSvgX(inches: number): number {
  return MARGIN + inches * SCALE_X;
}

function inchesToSvgY(inches: number): number {
  // Y coordinate is flipped (SVG origin at top, our origin at bottom)
  return MARGIN + TITLE_SPACE + SHEET_DISPLAY_HEIGHT - inches * SCALE_Y;
}

/**
 * Generate SVG for a single sheet layout
 */
export function generateSheetSvg(sheet: SheetLayout): string {
  const elements: string[] = [];
  
  // SVG header
  elements.push(`<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Add styles
  elements.push(`
    <defs>
      <style>
        .sheet-outline { fill: none; stroke: #000; stroke-width: 2; }
        .part-rect { fill: #f0f0f0; stroke: #000; stroke-width: 1; }
        .part-text { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; dominant-baseline: middle; }
        .rip-line { stroke: #000; stroke-width: 1; stroke-dasharray: 5,5; }
        .dimension-text { font-family: Arial, sans-serif; font-size: 9px; text-anchor: middle; }
        .sheet-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
      </style>
    </defs>
  `);
  
  // Sheet outline
  const sheetX = MARGIN;
  const sheetY = MARGIN + TITLE_SPACE;
  elements.push(`<rect x="${sheetX}" y="${sheetY}" width="${SHEET_DISPLAY_WIDTH}" height="${SHEET_DISPLAY_HEIGHT}" class="sheet-outline" />`);
  
  // Sheet label
  elements.push(`<text x="${sheetX}" y="${sheetY - 10}" class="sheet-label">${sheet.sheetId}</text>`);
  
  // Utilization info
  elements.push(`<text x="${sheetX + SHEET_DISPLAY_WIDTH}" y="${sheetY - 10}" class="dimension-text" text-anchor="end">Utilization: ${sheet.utilization.toFixed(1)}%</text>`);
  
  // Part rectangles
  for (const part of sheet.parts) {
    const x = inchesToSvgX(part.x);
    const y = inchesToSvgY(part.y + part.length); // Adjust for flipped Y
    const width = part.width * SCALE_X;
    const height = part.length * SCALE_Y;
    
    // Part rectangle
    elements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" class="part-rect" />`);
    
    // Part label
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    elements.push(`<text x="${centerX}" y="${centerY}" class="part-text">${part.partId}</text>`);
  }
  
  // Rip cut lines and dimensions
  for (const rip of sheet.ripCuts) {
    const x = inchesToSvgX(rip.position);
    const y1 = sheetY;
    const y2 = sheetY + SHEET_DISPLAY_HEIGHT;
    
    // Rip line
    elements.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="rip-line" />`);
    
    // Dimension text at bottom
    const dimY = sheetY + SHEET_DISPLAY_HEIGHT + 20;
    elements.push(`<text x="${x}" y="${dimY}" class="dimension-text">${rip.label}</text>`);
  }
  
  // Add final rip line at the right edge if there are rips
  if (sheet.ripCuts.length > 0) {
    const lastRip = sheet.ripCuts[sheet.ripCuts.length - 1];
    const finalX = inchesToSvgX(lastRip.position + lastRip.width);
    const y1 = sheetY;
    const y2 = sheetY + SHEET_DISPLAY_HEIGHT;
    
    elements.push(`<line x1="${finalX}" y1="${y1}" x2="${finalX}" y2="${y2}" class="rip-line" />`);
  }
  
  // Close SVG
  elements.push('</svg>');
  
  return elements.join('\n');
}

/**
 * Generate SVGs for all sheet layouts
 */
export function generateAllSheetSvgs(sheets: SheetLayout[]): string[] {
  return sheets.map(sheet => generateSheetSvg(sheet));
}

/**
 * Generate a simple test SVG for development
 */
export function generateTestSheetSvg(): string {
  const testSheet: SheetLayout = {
    sheetId: '3/4" Sheet 1',
    thickness: 0.75,
    utilization: 65.4,
    parts: [
      {
        partId: 'Top-0',
        x: 1,
        y: 1,
        width: 15.375,
        length: 56.5938,
        rotated: false,
        originalPart: {} as any,
      },
      {
        partId: 'Bottom-0',
        x: 17.375,
        y: 1,
        width: 15.375,
        length: 56.5938,
        rotated: false,
        originalPart: {} as any,
      },
    ],
    ripCuts: [
      {
        position: 1,
        width: 15.375,
        label: '15 3/8"',
      },
      {
        position: 17.375,
        width: 15.375,
        label: '15 3/8"',
      },
    ],
  };
  
  return generateSheetSvg(testSheet);
}

/**
 * Generate SVG for oversized parts that don't fit standard sheets
 */
export function generateOversizedPartSvg(oversizedPart: OversizedPart): string {
  const part = oversizedPart.part;
  
  // Calculate dimensions for the part rectangle
  const partWidth = Math.min(part.widthIn, 48) * 4; // Scale down for display
  const partLength = Math.min(part.lengthIn, 96) * 2; // Scale down for display
  
  // SVG dimensions based on content
  const svgWidth = partWidth + 2 * MARGIN;
  const svgHeight = partLength + 2 * MARGIN + TITLE_SPACE + DIMENSION_SPACE;
  
  const elements: string[] = [];
  
  // SVG header
  elements.push(`<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Add styles
  elements.push(`
    <defs>
      <style>
        .oversized-outline { fill: #fee; stroke: #f00; stroke-width: 2; stroke-dasharray: 10,5; }
        .oversized-text { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; dominant-baseline: middle; fill: #c00; font-weight: bold; }
        .oversized-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #c00; }
        .dimension-text { font-family: Arial, sans-serif; font-size: 9px; text-anchor: middle; fill: #666; }
      </style>
    </defs>
  `);
  
  // Part outline
  const partX = MARGIN;
  const partY = MARGIN + TITLE_SPACE;
  elements.push(`<rect x="${partX}" y="${partY}" width="${partWidth}" height="${partLength}" class="oversized-outline" />`);
  
  // Title
  elements.push(`<text x="${partX}" y="${partY - 10}" class="oversized-label">Does Not Fit</text>`);
  
  // Part label in center
  const centerX = partX + partWidth / 2;
  const centerY = partY + partLength / 2;
  elements.push(`<text x="${centerX}" y="${centerY - 10}" class="oversized-text">${part.id}</text>`);
  elements.push(`<text x="${centerX}" y="${centerY + 10}" class="oversized-text">${part.lengthIn.toFixed(2)}" × ${part.widthIn.toFixed(2)}"</text>`);
  
  // Dimensions at bottom
  const dimY = partY + partLength + 15;
  elements.push(`<text x="${centerX}" y="${dimY}" class="dimension-text">Actual: ${part.lengthIn.toFixed(2)}" × ${part.widthIn.toFixed(2)}" × ${part.thicknessIn.toFixed(2)}"</text>`);
  elements.push(`<text x="${centerX}" y="${dimY + 12}" class="dimension-text">${oversizedPart.reason}</text>`);
  
  // Close SVG
  elements.push('</svg>');
  
  return elements.join('\n');
}

/**
 * Generate SVGs for all oversized parts
 */
export function generateOversizedPartSvgs(oversizedParts: OversizedPart[]): string[] {
  return oversizedParts.map(part => generateOversizedPartSvg(part));
}