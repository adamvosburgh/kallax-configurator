import type { DesignParams, Part } from './types';
import { calculateLayout, calculateDimensions } from './layout';
import { calculateBayWidth as calculateBayWidthFromMeasurements, calculateSideHeight } from './measurements';

/**
 * Generate a stable part ID based on role and parameters
 */
function generatePartId(role: string, index?: number, suffix?: string): string {
  const parts = [role];
  if (index !== undefined) parts.push(index.toString());
  if (suffix) parts.push(suffix);
  return parts.join('-');
}

/**
 * Calculate bay width for a span of modules
 * @deprecated - Use calculateBayWidthFromMeasurements
 */
function calculateBayWidth(
  colStart: number, 
  colEnd: number, 
  interiorClearance: number, 
  frameThickness: number
): number {
  const moduleCount = colEnd - colStart;
  return calculateBayWidthFromMeasurements(moduleCount, interiorClearance, frameThickness);
}

/**
 * Check if two cells are merged together
 */

/**
 * Get all unique openings (merged cells are treated as single openings)
 */
function getOpenings(params: DesignParams): Array<{ row: number; col: number; width: number; height: number }> {
  const { rows, cols, merges } = params;
  const openings: Array<{ row: number; col: number; width: number; height: number }> = [];
  const processed = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellKey = `${r},${c}`;
      if (processed.has(cellKey)) continue;

      // Find the merge that contains this cell, if any
      const merge = merges.find(m => 
        r >= m.r0 && r <= m.r1 && c >= m.c0 && c <= m.c1
      );

      if (merge) {
        // This is part of a merged area
        const width = (merge.c1 - merge.c0 + 1);
        const height = (merge.r1 - merge.r0 + 1);
        
        openings.push({
          row: merge.r0,
          col: merge.c0,
          width,
          height,
        });

        // Mark all cells in this merge as processed
        for (let mr = merge.r0; mr <= merge.r1; mr++) {
          for (let mc = merge.c0; mc <= merge.c1; mc++) {
            processed.add(`${mr},${mc}`);
          }
        }
      } else {
        // Single cell opening
        openings.push({
          row: r,
          col: c,
          width: 1,
          height: 1,
        });
        processed.add(cellKey);
      }
    }
  }

  return openings;
}

/**
 * Generate all parts for the design
 */
export function generateParts(params: DesignParams): Part[] {
  const parts: Part[] = [];
  const layout = calculateLayout(params);
  const dimensions = calculateDimensions(params);
  
  const {
    cols,
    interiorClearanceInches,
    depthInches,
    hasBack,
    hasDoors,
    doorMode,
    materials,
  } = params;
  
  const frameThickness = materials.frame.actualInches;
  const backThickness = materials.back?.actualInches || 0;
  const doorThickness = materials.door?.actualInches || 0;

  // Top and Bottom pieces
  parts.push({
    id: generatePartId('Top', 0),
    role: 'Top',
    qty: 1,
    lengthIn: dimensions.extWidth,
    widthIn: depthInches,
    thicknessIn: frameThickness,
    notes: 'Full-width top cap',
  });

  parts.push({
    id: generatePartId('Bottom', 0),
    role: 'Bottom',
    qty: 1,
    lengthIn: dimensions.extWidth,
    widthIn: depthInches,
    thicknessIn: frameThickness,
    notes: 'Full-width bottom cap',
  });

  // Side pieces (left and right)
  const sideHeight = calculateSideHeight(dimensions.extHeight, frameThickness);
  parts.push({
    id: generatePartId('Side', 0, 'L'),
    role: 'Side',
    qty: 1,
    lengthIn: sideHeight,
    widthIn: depthInches,
    thicknessIn: frameThickness,
    notes: 'Left side, runs between top/bottom',
  });

  parts.push({
    id: generatePartId('Side', 1, 'R'),
    role: 'Side',
    qty: 1,
    lengthIn: sideHeight,
    widthIn: depthInches,
    thicknessIn: frameThickness,
    notes: 'Right side, runs between top/bottom',
  });

  // Interior vertical divider segments
  for (const segment of layout.verticalSegments) {
    parts.push({
      id: generatePartId('VDiv', segment.column, `R${segment.rowStart}to${segment.rowEnd}`),
      role: 'VerticalDivider',
      qty: 1,
      lengthIn: segment.lengthIn,
      widthIn: depthInches,
      thicknessIn: frameThickness,
      notes: `Vertical segment at column ${segment.column}, rows ${segment.rowStart}-${segment.rowEnd}`,
      bay: {
        row: segment.rowStart,
        colStart: segment.column,
        colEnd: segment.column,
        rowEnd: segment.rowEnd,
      },
    });
  }

  // Bay shelves (interior horizontals)
  for (const segment of layout.horizontalSegments) {
    const bayWidth = calculateBayWidth(
      segment.colStart,
      segment.colEnd,
      interiorClearanceInches,
      frameThickness
    );
    
    parts.push({
      id: generatePartId('Bay', segment.row, `Col${segment.colStart}to${segment.colEnd}`),
      role: 'BayShelf',
      qty: 1,
      lengthIn: bayWidth,
      widthIn: depthInches,
      thicknessIn: frameThickness,
      notes: `Shelf segment at row ${segment.row}, runs between verticals`,
      bay: {
        row: segment.row,
        colStart: segment.colStart,
        colEnd: segment.colEnd,
      },
    });
  }

  // Extended shelves are no longer needed - regular bay shelves now automatically 
  // span horizontal merges since interior verticals were removed

  // Back panel
  if (hasBack && materials.back) {
    parts.push({
      id: generatePartId('Back', 0),
      role: 'Back',
      qty: 1,
      lengthIn: dimensions.extWidth,
      widthIn: dimensions.extHeight,
      thicknessIn: backThickness,
      notes: 'Surface-mounted back panel',
    });
  }

  // Doors
  if (hasDoors && materials.door) {
    const openings = getOpenings(params);
    let doorIndex = 0;
    
    for (const opening of openings) {
      const openingWidth = opening.width * interiorClearanceInches + (opening.width - 1) * frameThickness;
      const openingHeight = opening.height * interiorClearanceInches + (opening.height - 1) * frameThickness;
      
      let doorWidth: number;
      let doorHeight: number;
      let doorNotes: string;
      
      if (doorMode.type === 'inset') {
        const reveal = doorMode.revealInches || 1/16;
        doorWidth = openingWidth - 2 * reveal;
        doorHeight = openingHeight - 2 * reveal;
        doorNotes = `Inset door with ${reveal}" reveal`;
      } else {
        const overlay = doorMode.overlayInches || 0.25;
        doorWidth = openingWidth + 2 * overlay;
        doorHeight = openingHeight + 2 * overlay;
        doorNotes = `Overlay door with ${overlay}" overlay`;
      }
      
      parts.push({
        id: generatePartId('Door', doorIndex),
        role: 'Door',
        qty: 1,
        lengthIn: doorWidth,
        widthIn: doorHeight,
        thicknessIn: doorThickness,
        notes: doorNotes,
        bay: {
          row: opening.row,
          colStart: opening.col,
          colEnd: opening.col + opening.width,
          rowEnd: opening.row + opening.height,
        },
      });
      doorIndex++;
    }
  }

  return parts;
}