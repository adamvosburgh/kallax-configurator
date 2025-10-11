/**
 * Centralized measurements and calculation formulas for the Kallax configurator
 * This file contains all measurement constants and calculation functions
 * Edit this file to adjust measurements used throughout the project
 *
 * NOTE: All calculations are performed in inches internally, regardless of unit system.
 * Metric values are converted to inches before calculations.
 */

import type { DesignParams, DerivedDimensions } from './types';
import { getThicknessInInches } from './types';

// ============================================================================
// FIXED MATERIAL CONSTANTS
// ============================================================================

/** Nominal to actual thickness mapping - these are fixed material properties */
export const THICKNESS_MAP = {
  '1/4"': 7/32,   // 0.21875 inches
  '1/2"': 15/32,  // 0.46875 inches
  '3/4"': 23/32,  // 0.71875 inches
} as const;

// ============================================================================
// UNIT CONVERSION HELPERS
// ============================================================================

const MM_TO_INCHES = 1 / 25.4;
const INCHES_TO_MM = 25.4;

/** Convert value to inches based on unit system */
export function toInches(value: number, unitSystem: 'imperial' | 'metric'): number {
  return unitSystem === 'metric' ? value * MM_TO_INCHES : value;
}

/** Convert value to mm based on unit system */
export function toMm(value: number, unitSystem: 'imperial' | 'metric'): number {
  return unitSystem === 'imperial' ? value * INCHES_TO_MM : value;
}

// ============================================================================
// CALCULATION FORMULAS
// ============================================================================

/**
 * Calculate exterior width based on grid and frame thickness
 */
export function calculateExteriorWidth(cols: number, interiorClearanceInches: number, frameThickness: number): number {
  return cols * interiorClearanceInches + (cols + 1) * frameThickness;
}

/**
 * Calculate exterior height based on grid and frame thickness
 */
export function calculateExteriorHeight(rows: number, interiorClearanceInches: number, frameThickness: number): number {
  return rows * interiorClearanceInches + (rows + 1) * frameThickness;
}

/**
 * Calculate exterior depth including back panel
 */
export function calculateExteriorDepth(depthInches: number, hasBack: boolean, backThickness: number): number {
  return depthInches + (hasBack ? backThickness : 0);
}

/**
 * Calculate bay width for a span of modules
 */
export function calculateBayWidth(moduleCount: number, interiorClearanceInches: number, frameThickness: number): number {
  return moduleCount * interiorClearanceInches + (moduleCount - 1) * frameThickness;
}

/**
 * Calculate side height (interior height between top and bottom)
 */
export function calculateSideHeight(extHeight: number, frameThickness: number): number {
  return extHeight - 2 * frameThickness;
}

/**
 * Calculate complete derived dimensions from design parameters
 * All calculations are done in inches internally, then results are returned in inches
 */
export function calculateAllDimensions(params: DesignParams): DerivedDimensions {
  const { rows, cols, interiorClearance, depth, hasBack, materials, unitSystem } = params;

  // Convert to inches for internal calculations
  const interiorClearanceInches = toInches(interiorClearance, unitSystem);
  const depthInches = toInches(depth, unitSystem);
  const frameThickness = getThicknessInInches(materials.frame);
  const backThickness = materials.back ? getThicknessInInches(materials.back) : 0;

  const extWidth = calculateExteriorWidth(cols, interiorClearanceInches, frameThickness);
  const extHeight = calculateExteriorHeight(rows, interiorClearanceInches, frameThickness);
  const extDepth = calculateExteriorDepth(depthInches, hasBack, backThickness);

  return {
    extWidth,
    extHeight,
    extDepth,
  };
}

// ============================================================================
// 3D POSITIONING FORMULAS
// ============================================================================

/** Scale factor to convert inches to 3D scene units */
export const SCENE_SCALE = 0.1;

/**
 * Calculate 3D position for Bottom part
 */
export function calculateBottomPosition(extHeight: number, frameThickness: number): [number, number, number] {
  return [0, ((-extHeight * SCENE_SCALE) / 2) + ((frameThickness * SCENE_SCALE) / 2), 0];
}

/**
 * Calculate 3D position for Top part
 */
export function calculateTopPosition(extHeight: number, frameThickness: number): [number, number, number] {
  return [0, ((extHeight * SCENE_SCALE) / 2) - ((frameThickness * SCENE_SCALE) / 2), 0];
}

/**
 * Calculate 3D position for Left Side part
 */
export function calculateLeftSidePosition(extWidth: number, frameThickness: number): [number, number, number] {
  return [((-extWidth * SCENE_SCALE) / 2) + ((frameThickness * SCENE_SCALE) / 2), 0, 0];
}

/**
 * Calculate 3D position for Right Side part
 */
export function calculateRightSidePosition(extWidth: number, frameThickness: number): [number, number, number] {
  return [((extWidth * SCENE_SCALE) / 2) - ((frameThickness * SCENE_SCALE) / 2), 0, 0];
}

/**
 * Calculate 3D position for Back part
 */
export function calculateBackPosition(extDepth: number): [number, number, number] {
  return [0, 0, -extDepth * SCENE_SCALE / 2];
}

/**
 * Calculate 3D position for BayShelf part based on bay information
 */
export function calculateBayShelfPosition(
  bay: { row: number; colStart: number; colEnd: number },
  _rows: number,
  _cols: number,
  interiorClearanceInches: number,
  frameThickness: number,
  extWidth: number,
  extHeight: number
): [number, number, number] {
  // Calculate X position based on bay center
  const bayWidthInches = calculateBayWidth(bay.colEnd - bay.colStart, interiorClearanceInches, frameThickness);
  
  // Position from left edge of shelf unit
  const leftEdgeOfBay = bay.colStart * (interiorClearanceInches + frameThickness) + frameThickness;
  const xOffset = (leftEdgeOfBay + bayWidthInches / 2) - (extWidth / 2);
  
  // Calculate Y position based on row (shelf sits between rows)
  const shelfYFromTop = bay.row * (interiorClearanceInches + frameThickness) + (frameThickness / 2);
  const yOffset = (extHeight / 2) - shelfYFromTop;
  
  return [xOffset * SCENE_SCALE, yOffset * SCENE_SCALE, 0];
}

/**
 * Calculate 3D position for VerticalDivider part
 */
export function calculateVerticalDividerPosition(
  columnIndex: number,
  _cols: number,
  interiorClearanceInches: number,
  frameThickness: number,
  extWidth: number
): [number, number, number] {
  // Calculate X position based on which column the divider is at
  const dividerXFromLeft = columnIndex * (interiorClearanceInches + frameThickness) + (frameThickness / 2);
  const xOffset = dividerXFromLeft - (extWidth / 2);
  
  return [xOffset * SCENE_SCALE, 0, 0];
}

/**
 * Calculate 3D position for segmented VerticalDivider part
 */
export function calculateVerticalDividerSegmentPosition(
  columnIndex: number,
  rowStart: number,
  rowEnd: number,
  _segmentHeight: number,
  _cols: number,
  _rows: number,
  interiorClearanceInches: number,
  frameThickness: number,
  extWidth: number,
  extHeight: number
): [number, number, number] {
  // Calculate X position based on which column the divider is at
  const dividerXFromLeft = columnIndex * (interiorClearanceInches + frameThickness) + (frameThickness / 2);
  const xOffset = dividerXFromLeft - (extWidth / 2);
  
  // Calculate Y position based on the segment center
  const segmentCenter = (rowStart + rowEnd) / 2;
  const segmentYFromTop = segmentCenter * (interiorClearanceInches + frameThickness) + (frameThickness /2);
  const yOffset = (extHeight / 2) - segmentYFromTop;
  
  return [xOffset * SCENE_SCALE, yOffset * SCENE_SCALE, 0];
}

/**
 * Calculate 3D position for Door part
 */
export function calculateDoorPosition(
  bay: { row: number; colStart: number; colEnd: number; rowEnd?: number },
  _rows: number,
  _cols: number,
  interiorClearanceInches: number,
  frameThickness: number,
  extWidth: number,
  extHeight: number,
  doorMode?: { type: 'inset' | 'overlay'; revealInches?: number; overlayInches?: number },
  doorThickness?: number,
  depthInches?: number
): [number, number, number] {
  // Calculate X position based on bay center (same as shelf)
  const bayWidthInches = calculateBayWidth(bay.colEnd - bay.colStart, interiorClearanceInches, frameThickness);
  
  // Position from left edge of shelf unit
  const leftEdgeOfBay = bay.colStart * (interiorClearanceInches + frameThickness) + frameThickness;
  const xOffset = (leftEdgeOfBay + bayWidthInches / 2) - (extWidth / 2);
  
  // Calculate Y position based on row and vertical span
  const rowStart = bay.row;
  const rowEnd = bay.rowEnd || (bay.row + 1);
  const verticalSpan = rowEnd - rowStart;
  
  // For vertical merges, center the door in the merged area
  const openingStartY = rowStart * (interiorClearanceInches + frameThickness) + frameThickness;
  const openingHeight = verticalSpan * interiorClearanceInches + (verticalSpan - 1) * frameThickness;
  const openingCenterY = openingStartY + (openingHeight / 2);
  const yOffset = (extHeight / 2) - openingCenterY;
  
  // Calculate Z position based on door mode
  let zOffset = 0;
  if (doorMode && doorThickness && depthInches) {
    if (doorMode.type === 'inset') {
      // Inset door: outside face is flush with end of shelves
      zOffset = (depthInches / 2) - (doorThickness / 2);
    } else if (doorMode.type === 'overlay') {
      // Overlay door: back face starts from end of shelf
      zOffset = (depthInches / 2) + (doorThickness / 2);
    }
  } else {
    // Default: position slightly in front of the shelf
    zOffset = (depthInches || 15.375) / 2 + 0.1;
  }
  
  return [xOffset * SCENE_SCALE, yOffset * SCENE_SCALE, zOffset * SCENE_SCALE];
}