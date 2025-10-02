import type { DesignParams, Part, Warning } from './types';
import { calculateBoardFeet } from './format';
import { generateParts } from './parts';

export interface MaterialEstimate {
  frameBoardFeet: number;
  backSquareFeet: number;
  doorSquareFeet: number;
  totalFrameParts: number;
  totalDoors: number;
  hasBack: boolean;
}

/**
 * Check if any merge spans are too large (3+ modules)
 */
function checkSpanWarnings(params: DesignParams): Warning[] {
  const warnings: Warning[] = [];

  for (let i = 0; i < params.merges.length; i++) {
    const merge = params.merges[i];
    const widthSpan = merge.c1 - merge.c0 + 1;
    const heightSpan = merge.r1 - merge.r0 + 1;

    if (widthSpan >= 3) {
      warnings.push({
        type: 'span_too_large',
        message: `Horizontal span of ${widthSpan} modules may require additional support`,
        severity: 'warning',
        mergeIndex: i,
      });
    }

    if (heightSpan >= 3) {
      warnings.push({
        type: 'span_too_large',
        message: `Vertical span of ${heightSpan} modules may require additional support`,
        severity: 'warning',
        mergeIndex: i,
      });
    }
  }

  return warnings;
}

/**
 * Calculate material usage estimates
 */
export function calculateMaterialEstimate(parts: Part[]): MaterialEstimate {
  let frameBoardFeet = 0;
  let backSquareFeet = 0;
  let doorSquareFeet = 0;
  let totalFrameParts = 0;
  let totalDoors = 0;
  let hasBack = false;
  
  for (const part of parts) {
    switch (part.role) {
      case 'Top':
      case 'Bottom':
      case 'Side':
      case 'VerticalDivider':
      case 'BayShelf':
        frameBoardFeet += calculateBoardFeet(
          part.lengthIn,
          part.widthIn,
          part.thicknessIn,
          part.qty
        );
        totalFrameParts += part.qty;
        break;
        
      case 'Back':
        backSquareFeet += (part.lengthIn * part.widthIn * part.qty) / 144;
        hasBack = true;
        break;
        
      case 'Door':
        doorSquareFeet += (part.lengthIn * part.widthIn * part.qty) / 144;
        totalDoors += part.qty;
        break;
    }
  }
  
  return {
    frameBoardFeet,
    backSquareFeet,
    doorSquareFeet,
    totalFrameParts,
    totalDoors,
    hasBack,
  };
}

/**
 * Generate warnings for the current design
 */
export function generateWarnings(params: DesignParams): Warning[] {
  const warnings: Warning[] = [];
  
  // Check span warnings
  warnings.push(...checkSpanWarnings(params));
  
  // Add other potential warnings
  if (params.rows > 4 || params.cols > 4) {
    warnings.push({
      type: 'span_too_large',
      message: 'Large shelving units may require additional bracing or assembly considerations',
      severity: 'info',
    });
  }
  
  return warnings;
}

/**
 * Get complete analysis of the design
 */
export interface DesignAnalysis {
  parts: Part[];
  estimate: MaterialEstimate;
  warnings: Warning[];
}

export function analyzeDesign(params: DesignParams): DesignAnalysis {
  const parts = generateParts(params);
  const estimate = calculateMaterialEstimate(parts);
  const warnings = generateWarnings(params);
  
  return {
    parts,
    estimate,
    warnings,
  };
}