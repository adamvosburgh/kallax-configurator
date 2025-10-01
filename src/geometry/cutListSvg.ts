/**
 * SVG generation for cut list sheet layouts
 * Creates technical drawings showing part placement and rip cuts
 */

import type { SheetLayout, OversizedPart } from './ripGenerator';
import type { DesignParams } from './types';

// SVG dimensions and styling - tight around content
const MARGIN = 40; // Minimal margin
const TITLE_SPACE = 10; // Space for sheet title at top
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
export function generateSheetSvg(sheet: SheetLayout, params: DesignParams): string {
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
        .door-hardware { fill: none; stroke: #333; stroke-width: 1; }
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
    
    // Part label with text wrapping
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Wrap text if needed
    const maxCharsPerLine = Math.floor(width / 6); // Approximate character width
    const partId = part.partId;
    
    if (partId.length <= maxCharsPerLine) {
      // Single line
      elements.push(`<text x="${centerX}" y="${centerY}" class="part-text">${partId}</text>`);
    } else {
      // Multi-line text
      const words = partId.split(/[-_]/); // Split on common separators
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? '-' : '') + word;
        if (testLine.length <= maxCharsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // If we still have long lines, force break them
      const finalLines: string[] = [];
      for (const line of lines) {
        if (line.length <= maxCharsPerLine) {
          finalLines.push(line);
        } else {
          // Force break long lines
          for (let i = 0; i < line.length; i += maxCharsPerLine) {
            finalLines.push(line.substr(i, maxCharsPerLine));
          }
        }
      }
      
      // Center the multi-line text
      const lineHeight = 12;
      const totalHeight = finalLines.length * lineHeight;
      const startY = centerY - (totalHeight / 2) + (lineHeight / 2);
      
      finalLines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        elements.push(`<text x="${centerX}" y="${lineY}" class="part-text">${line}</text>`);
      });
    }

    // Add door hardware circle if this is a door part
    if (part.originalPart && part.originalPart.role === 'Door' && params.doorHardware) {
      const { position: hwPosition, type, insetInches } = params.doorHardware;

      // Calculate hardware position relative to part rectangle
      let hardwareX = 0;
      let hardwareY = 0;

      // Horizontal position (based on part width)
      if (hwPosition.includes('left')) {
        hardwareX = x + (insetInches * SCALE_X);
      } else if (hwPosition.includes('right')) {
        hardwareX = x + width - (insetInches * SCALE_X);
      } else {
        hardwareX = centerX; // center
      }

      // Vertical position (based on part length)
      if (hwPosition.includes('top')) {
        hardwareY = y + (insetInches * SCALE_Y);
      } else if (hwPosition.includes('bottom')) {
        hardwareY = y + height - (insetInches * SCALE_Y);
      } else {
        hardwareY = centerY; // middle
      }

      // Draw circle (diameter depends on type)
      const diameter = type === 'pull-hole' ? 1 : 0.125; // in inches
      const radius = (diameter / 2) * Math.min(SCALE_X, SCALE_Y); // Use average scale

      elements.push(`<circle cx="${hardwareX}" cy="${hardwareY}" r="${radius}" class="door-hardware" />`);
    }
  }
  
  // Rip cut lines and dimensions
  for (const rip of sheet.ripCuts) {
    const x = inchesToSvgX(rip.position);
    const y1 = sheetY;
    const y2 = sheetY + SHEET_DISPLAY_HEIGHT + 30; // Extend slightly below sheet for dimension text
    
    // Rip line
    elements.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="rip-line" />`);
    
    // Dimension text at bottom
    const dimY = sheetY + SHEET_DISPLAY_HEIGHT + 20;
    const dimX = x +20;
    elements.push(`<text x="${dimX}" y="${dimY}" class="dimension-text">${rip.label}</text>`);
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
export function generateAllSheetSvgs(sheets: SheetLayout[], params: DesignParams): string[] {
  return sheets.map(sheet => generateSheetSvg(sheet, params));
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

  // Use minimal test params (doors won't have hardware in test)
  const testParams: DesignParams = {} as any;

  return generateSheetSvg(testSheet, testParams);
}

/**
 * Generate simplified SVG for oversized parts (just the part rectangle, no text)
 */
export function generateOversizedPartSvg(oversizedPart: OversizedPart, params: DesignParams): string {
  const part = oversizedPart.part;

  // Calculate dimensions for the part rectangle with proportional scaling
  const maxDisplayWidth = 200; // Maximum display width
  const maxDisplayHeight = 200; // Reduced height since we're removing text

  // Calculate scale to fit within display bounds while maintaining aspect ratio
  const scaleX = maxDisplayWidth / part.widthIn;
  const scaleY = maxDisplayHeight / part.lengthIn;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  const partWidth = part.widthIn * scale;
  const partLength = part.lengthIn * scale;

  // SVG dimensions based on content (minimal margins, no text space)
  const svgWidth = partWidth + 2 * 20; // Smaller margins
  const svgHeight = partLength + 2 * 20; // Smaller margins

  const elements: string[] = [];

  // SVG header
  elements.push(`<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`);

  // Add styles
  elements.push(`
    <defs>
      <style>
        .part-rect { fill: #f0f0f0; stroke: #000; stroke-width: 1; }
        .part-text { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; dominant-baseline: middle; }
        .door-hardware { fill: none; stroke: #333; stroke-width: 1; }
      </style>
    </defs>
  `);

  // Part outline
  const partX = 20;
  const partY = 20;
  elements.push(`<rect x="${partX}" y="${partY}" width="${partWidth}" height="${partLength}" class="part-rect" />`);

  // Part label in center (just the part ID)
  const centerX = partX + partWidth / 2;
  const centerY = partY + partLength / 2;
  elements.push(`<text x="${centerX}" y="${centerY}" class="part-text">${part.id}</text>`);

  // Add door hardware circle if this is a door part
  if (part.role === 'Door' && params.doorHardware) {
    const { position: hwPosition, type, insetInches } = params.doorHardware;

    // Calculate hardware position relative to part rectangle
    let hardwareX = 0;
    let hardwareY = 0;

    // Horizontal position (based on part width)
    if (hwPosition.includes('left')) {
      hardwareX = partX + (insetInches * scale);
    } else if (hwPosition.includes('right')) {
      hardwareX = partX + partWidth - (insetInches * scale);
    } else {
      hardwareX = centerX; // center
    }

    // Vertical position (based on part length)
    if (hwPosition.includes('top')) {
      hardwareY = partY + (insetInches * scale);
    } else if (hwPosition.includes('bottom')) {
      hardwareY = partY + partLength - (insetInches * scale);
    } else {
      hardwareY = centerY; // middle
    }

    // Draw circle (diameter depends on type)
    const diameter = type === 'pull-hole' ? 1 : 0.125; // in inches
    const radius = (diameter / 2) * scale;

    elements.push(`<circle cx="${hardwareX}" cy="${hardwareY}" r="${radius}" class="door-hardware" />`);
  }

  // Close SVG
  elements.push('</svg>');

  return elements.join('\n');
}

/**
 * Generate SVGs for all oversized parts
 */
export function generateOversizedPartSvgs(oversizedParts: OversizedPart[], params: DesignParams): string[] {
  return oversizedParts.map(part => generateOversizedPartSvg(part, params));
}