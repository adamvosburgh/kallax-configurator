import type { DesignParams, MergeSpec, LayoutInfo, DerivedDimensions } from './types';

// Re-export for convenience
export type { DerivedDimensions } from './types';

// Helper function removed - was not being used

/**
 * Check if two adjacent cells are merged together
 */
function areCellsMerged(
  row1: number, col1: number, 
  row2: number, col2: number, 
  merges: MergeSpec[]
): boolean {
  return merges.some(merge => 
    row1 >= merge.r0 && row1 <= merge.r1 && col1 >= merge.c0 && col1 <= merge.c1 &&
    row2 >= merge.r0 && row2 <= merge.r1 && col2 >= merge.c0 && col2 <= merge.c1
  );
}

/**
 * Determine which vertical dividers are present
 * A vertical at column boundary c is omitted if ALL rows merge across that boundary
 */
function calculatePresentVerticals(rows: number, cols: number, merges: MergeSpec[]): Set<number> {
  const presentVerticals = new Set<number>();
  
  // Always include sides (column 0 and cols)
  presentVerticals.add(0);
  presentVerticals.add(cols);
  
  // Check interior verticals (columns 1 to cols-1)
  for (let c = 1; c < cols; c++) {
    let shouldIncludeVertical = false;
    
    // Check each row to see if there's a merge across this column boundary
    for (let r = 0; r < rows; r++) {
      const leftCol = c - 1;
      const rightCol = c;
      
      // If these adjacent cells are NOT merged, we need the vertical
      if (!areCellsMerged(r, leftCol, r, rightCol, merges)) {
        shouldIncludeVertical = true;
        break;
      }
    }
    
    if (shouldIncludeVertical) {
      presentVerticals.add(c);
    }
  }
  
  return presentVerticals;
}

/**
 * Calculate horizontal shelf segments between present verticals
 */
function calculateHorizontalSegments(
  rows: number, 
  merges: MergeSpec[], 
  presentVerticals: Set<number>
): Array<{ row: number; colStart: number; colEnd: number }> {
  const segments: Array<{ row: number; colStart: number; colEnd: number }> = [];
  
  // For each row boundary (between rows)
  for (let r = 1; r < rows; r++) {
    const verticalCols = Array.from(presentVerticals).sort((a, b) => a - b);
    
    // Create segments between consecutive present verticals
    for (let i = 0; i < verticalCols.length - 1; i++) {
      const colStart = verticalCols[i];
      const colEnd = verticalCols[i + 1];
      
      // Check if there's a vertical merge across this row boundary for this bay
      let hasVerticalMerge = false;
      
      for (let c = colStart; c < colEnd; c++) {
        const upperRow = r - 1;
        const lowerRow = r;
        
        if (areCellsMerged(upperRow, c, lowerRow, c, merges)) {
          hasVerticalMerge = true;
          break;
        }
      }
      
      // Only add shelf segment if there's no vertical merge
      if (!hasVerticalMerge) {
        segments.push({
          row: r,
          colStart,
          colEnd,
        });
      }
    }
  }
  
  return segments;
}

/**
 * Calculate the layout info (which verticals and horizontals are present)
 */
export function calculateLayout(params: DesignParams): LayoutInfo {
  const presentVerticals = calculatePresentVerticals(params.rows, params.cols, params.merges);
  const horizontalSegments = calculateHorizontalSegments(
    params.rows, 
    params.merges, 
    presentVerticals
  );
  
  return {
    presentVerticals,
    horizontalSegments,
  };
}

/**
 * Calculate exterior dimensions
 */
export function calculateDimensions(params: DesignParams): DerivedDimensions {
  const { rows, cols, interiorClearanceInches, depthInches, hasBack, materials } = params;
  const frameThickness = materials.frame.actualInches;
  const backThickness = materials.back?.actualInches || 0;
  
  const extWidth = cols * interiorClearanceInches + (cols + 1) * frameThickness;
  const extHeight = rows * interiorClearanceInches + (rows + 1) * frameThickness;
  const extDepth = depthInches + (hasBack ? backThickness : 0);
  
  return {
    extWidth,
    extHeight,
    extDepth,
  };
}