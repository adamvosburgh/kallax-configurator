/**
 * Rip generator for optimizing cut layouts on 4'x8' plywood sheets
 * Based on specifications in src/instructions/rip-generator.md
 */

import type { Part } from './types';
import { toFraction32 } from './format';

// Constants
const SHEET_WIDTH = 48; // inches
const SHEET_HEIGHT = 96; // inches  
const CUT_MARGIN = 1; // inches between cuts
const MAX_RIP_LENGTH = 24; // threshold for rip orientation decision

export interface PlacedPart {
  partId: string;
  x: number; // position from left edge
  y: number; // position from bottom edge  
  width: number; // cross-cut dimension
  length: number; // rip dimension
  rotated: boolean; // if part was rotated per rip rules
  originalPart: Part;
}

export interface RipCut {
  position: number; // distance from left edge
  width: number; // rip width
  label: string; // dimension label for bottom
}

export interface SheetLayout {
  sheetId: string; // e.g., "3/4\" Sheet 1"
  thickness: number; // in inches
  parts: PlacedPart[];
  ripCuts: RipCut[];
  utilization: number; // percentage of sheet used
}

export interface OversizedPart {
  part: Part;
  reason: string; // why it doesn't fit
}

export interface SheetLayoutResult {
  sheets: SheetLayout[];
  oversizedParts: OversizedPart[];
}

interface ProcessedPart extends Part {
  ripWidth: number; // the dimension to rip along
  crossCutLength: number; // the dimension to cross-cut
  rotated: boolean; // if the part was rotated for optimal ripping
}

/**
 * Check if a part can fit on a standard 4'×8' sheet
 */
function canFitOnStandardSheet(part: Part): { fits: boolean; reason?: string } {
  const length = part.lengthIn;
  const width = part.widthIn;
  
  // Check if either dimension exceeds sheet dimensions
  if (length > SHEET_WIDTH && width > SHEET_HEIGHT) {
    return { fits: false, reason: `Part dimensions ${length.toFixed(2)}" × ${width.toFixed(2)}" exceed both sheet dimensions (48" × 96")` };
  }
  if (length > SHEET_HEIGHT && width > SHEET_WIDTH) {
    return { fits: false, reason: `Part dimensions ${length.toFixed(2)}" × ${width.toFixed(2)}" exceed sheet dimensions when rotated` };
  }
  if (Math.max(length, width) > SHEET_HEIGHT) {
    return { fits: false, reason: `Longest dimension ${Math.max(length, width).toFixed(2)}" exceeds sheet length (96")` };
  }
  if (Math.min(length, width) > SHEET_WIDTH) {
    return { fits: false, reason: `Shortest dimension ${Math.min(length, width).toFixed(2)}" exceeds sheet width (48")` };
  }
  
  return { fits: true };
}

/**
 * Determine rip orientation for a part based on size rules
 */
function determineRipOrientation(part: Part): { ripWidth: number; crossCutLength: number; rotated: boolean } {
  const length = part.lengthIn;
  const width = part.widthIn;
  
  // If both dimensions ≤ 24": rip along longest dimension
  if (length <= MAX_RIP_LENGTH && width <= MAX_RIP_LENGTH) {
    if (length >= width) {
      return { ripWidth: width, crossCutLength: length, rotated: false };
    } else {
      return { ripWidth: length, crossCutLength: width, rotated: true };
    }
  }
  // If any dimension > 24": rip along shortest dimension
  else {
    if (length <= width) {
      return { ripWidth: length, crossCutLength: width, rotated: true };
    } else {
      return { ripWidth: width, crossCutLength: length, rotated: false };
    }
  }
}

/**
 * Process parts to determine rip orientations and group by thickness
 * Also separates out parts that don't fit on standard sheets
 */
function processParts(parts: Part[]): { 
  partsByThickness: Map<number, ProcessedPart[]>;
  oversizedParts: OversizedPart[];
} {
  const partsByThickness = new Map<number, ProcessedPart[]>();
  const oversizedParts: OversizedPart[] = [];
  
  for (const part of parts) {
    // Check if part fits on standard sheet
    const fitCheck = canFitOnStandardSheet(part);
    if (!fitCheck.fits) {
      oversizedParts.push({
        part,
        reason: fitCheck.reason!
      });
      continue; // Skip processing this part
    }
    
    const thickness = part.thicknessIn;
    const ripInfo = determineRipOrientation(part);
    
    const processedPart: ProcessedPart = {
      ...part,
      ...ripInfo,
    };
    
    if (!partsByThickness.has(thickness)) {
      partsByThickness.set(thickness, []);
    }
    partsByThickness.get(thickness)!.push(processedPart);
  }
  
  return { partsByThickness, oversizedParts };
}

/**
 * Pack parts into a single sheet using first-fit decreasing algorithm
 */
function packSheet(parts: ProcessedPart[], sheetId: string, thickness: number): SheetLayout {
  // Sort parts by rip width (primary) then cross-cut length (secondary)
  const sortedParts = [...parts].sort((a, b) => {
    if (a.ripWidth !== b.ripWidth) {
      return b.ripWidth - a.ripWidth; // Descending by rip width
    }
    return b.crossCutLength - a.crossCutLength; // Descending by cross-cut length
  });
  
  const placedParts: PlacedPart[] = [];
  const ripCuts: RipCut[] = [];
  let currentX = CUT_MARGIN;
  
  // Track strips (rips) and their remaining space
  interface Strip {
    x: number;
    width: number;
    usedLength: number;
    parts: PlacedPart[];
  }
  const strips: Strip[] = [];
  
  for (const part of sortedParts) {
    let placed = false;
    
    // Try to fit in existing strips first
    for (const strip of strips) {
      const remainingLength = SHEET_HEIGHT - strip.usedLength;
      const neededLength = part.crossCutLength + CUT_MARGIN;
      
      if (Math.abs(strip.width - part.ripWidth) < 0.001 && remainingLength >= neededLength) {
        // Part fits in this strip
        const placedPart: PlacedPart = {
          partId: part.id,
          x: strip.x,
          y: strip.usedLength,
          width: part.ripWidth,
          length: part.crossCutLength,
          rotated: part.rotated,
          originalPart: part,
        };
        
        placedParts.push(placedPart);
        strip.parts.push(placedPart);
        strip.usedLength += part.crossCutLength + CUT_MARGIN;
        placed = true;
        break;
      }
    }
    
    // If not placed, create new strip
    if (!placed) {
      const neededWidth = part.ripWidth + CUT_MARGIN;
      
      // Check if new strip fits on sheet
      if (currentX + neededWidth <= SHEET_WIDTH) {
        const newStrip: Strip = {
          x: currentX,
          width: part.ripWidth,
          usedLength: CUT_MARGIN,
          parts: [],
        };
        
        const placedPart: PlacedPart = {
          partId: part.id,
          x: currentX,
          y: CUT_MARGIN,
          width: part.ripWidth,
          length: part.crossCutLength,
          rotated: part.rotated,
          originalPart: part,
        };
        
        placedParts.push(placedPart);
        newStrip.parts.push(placedPart);
        newStrip.usedLength += part.crossCutLength + CUT_MARGIN;
        strips.push(newStrip);
        
        // Add rip cut
        ripCuts.push({
          position: currentX,
          width: part.ripWidth,
          label: toFraction32(part.ripWidth),
        });
        
        currentX += part.ripWidth + CUT_MARGIN;
        placed = true;
      }
    }
    
    if (!placed) {
      // Part doesn't fit on this sheet - caller should handle overflow
      break;
    }
  }
  
  // Calculate utilization
  const usedArea = placedParts.reduce((sum, part) => sum + (part.width * part.length), 0);
  const totalArea = SHEET_WIDTH * SHEET_HEIGHT;
  const utilization = (usedArea / totalArea) * 100;
  
  return {
    sheetId,
    thickness,
    parts: placedParts,
    ripCuts,
    utilization,
  };
}

/**
 * Generate optimized sheet layouts for all parts
 */
export function generateSheetLayouts(parts: Part[]): SheetLayoutResult {
  const { partsByThickness, oversizedParts } = processParts(parts);
  const sheets: SheetLayout[] = [];
  
  for (const [thickness, thicknessParts] of partsByThickness) {
    let sheetNumber = 1;
    let remainingParts = [...thicknessParts];
    
    while (remainingParts.length > 0) {
      const thicknessLabel = toFraction32(thickness);
      const sheetId = `${thicknessLabel} Sheet ${sheetNumber}`;
      
      const sheet = packSheet(remainingParts, sheetId, thickness);
      sheets.push(sheet);
      
      // Remove placed parts from remaining parts
      const placedPartIds = new Set(sheet.parts.map(p => p.partId));
      remainingParts = remainingParts.filter(part => !placedPartIds.has(part.id));
      
      sheetNumber++;
    }
  }
  
  return { sheets, oversizedParts };
}

/**
 * Helper function to get just the sheets (for backward compatibility)
 */
export function getSheetLayouts(parts: Part[]): SheetLayout[] {
  return generateSheetLayouts(parts).sheets;
}