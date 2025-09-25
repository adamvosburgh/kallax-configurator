import type { DesignParams, MergeSpec, LayoutInfo, VerticalSegment, ExtendedShelf } from './types';
import { calculateSideHeight } from './measurements';

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
 * Calculate horizontal shelf segments, considering both vertical merges (delete shelves) 
 * and horizontal merges (extend shelves across merged areas)
 */
function calculateHorizontalSegments(
  rows: number, 
  cols: number,
  merges: MergeSpec[], 
  presentVerticals: Set<number>
): Array<{ row: number; colStart: number; colEnd: number }> {
  const segments: Array<{ row: number; colStart: number; colEnd: number }> = [];
  
  // For each row boundary (between rows)
  for (let r = 1; r < rows; r++) {
    // Find horizontal merges that affect this row boundary
    // A horizontal merge affects a row boundary if it's either:
    // 1. In the row above the boundary (merge.r0 <= r-1 && merge.r1 >= r-1)
    // 2. In the row below the boundary (merge.r0 <= r && merge.r1 >= r)
    const horizontalMergesAtRow = merges.filter(merge => 
      merge.c1 > merge.c0 && // spans multiple columns (is horizontal)
      ((merge.r0 <= r - 1 && merge.r1 >= r - 1) || // merge in row above boundary
       (merge.r0 <= r && merge.r1 >= r)) // merge in row below boundary
    );
    
    // For each horizontal merge at this row, create an extended shelf segment
    for (const merge of horizontalMergesAtRow) {
      // Check if there's a vertical merge that would eliminate this shelf
      let hasVerticalMerge = false;
      for (let c = merge.c0; c <= merge.c1; c++) {
        if (areCellsMerged(r - 1, c, r, c, merges)) {
          hasVerticalMerge = true;
          break;
        }
      }
      
      if (!hasVerticalMerge) {
        // Create a shelf segment that spans exactly the merged area
        // Find the nearest present verticals that bracket this merge
        const verticalCols = Array.from(presentVerticals).sort((a, b) => a - b);
        const startCol = verticalCols.filter(col => col <= merge.c0).pop() || 0;
        const endCol = verticalCols.find(col => col > merge.c1) || cols;
        
        segments.push({
          row: r,
          colStart: startCol,
          colEnd: endCol,
        });
      }
    }
    
    // For areas without horizontal merges, create normal segments between verticals
    const verticalCols = Array.from(presentVerticals).sort((a, b) => a - b);
    for (let i = 0; i < verticalCols.length - 1; i++) {
      const colStart = verticalCols[i];
      const colEnd = verticalCols[i + 1];
      
      // Check if this area overlaps with any horizontal merge shelf
      // If there's any overlap, skip this normal segment to avoid duplicates
      const overlapsWithMerge = horizontalMergesAtRow.some(merge => {
        // Find the shelf boundaries for this merge
        const mergeStartCol = verticalCols.filter(col => col <= merge.c0).pop() || 0;
        const mergeEndCol = verticalCols.find(col => col > merge.c1) || cols;
        
        // Check if this normal segment overlaps with the merge shelf
        return !(colEnd <= mergeStartCol || colStart >= mergeEndCol);
      });
      
      if (!overlapsWithMerge) {
        // Check if there's a vertical merge across this row boundary
        let hasVerticalMerge = false;
        for (let c = colStart; c < colEnd; c++) {
          if (areCellsMerged(r - 1, c, r, c, merges)) {
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
  }
  
  return segments;
}

/**
 * Calculate vertical divider segments based on horizontal merges
 */
function calculateVerticalSegments(
  rows: number, 
  cols: number, 
  merges: MergeSpec[], 
  presentVerticals: Set<number>,
  frameThickness: number,
  interiorClearanceInches: number
): VerticalSegment[] {
  const segments: VerticalSegment[] = [];
  
  for (const col of presentVerticals) {
    if (col === 0 || col === cols) continue; // Skip sides - they're handled separately
    
    // Find all horizontal merges that cross this column boundary
    const crossingMerges = merges.filter(merge => 
      merge.c0 < col && merge.c1 >= col
    );
    
    if (crossingMerges.length === 0) {
      // No horizontal merges cross this column - full height divider
      const fullHeight = calculateSideHeight(
        rows * interiorClearanceInches + (rows + 1) * frameThickness,
        frameThickness
      );
      segments.push({
        column: col,
        rowStart: 0,
        rowEnd: rows,
        lengthIn: fullHeight
      });
    } else {
      // Create segments around horizontal merges
      const mergeRows = new Set<number>();
      crossingMerges.forEach(merge => {
        for (let r = merge.r0; r <= merge.r1; r++) {
          mergeRows.add(r);
        }
      });
      
      // Create segments for non-merged rows
      let segmentStart = 0;
      for (let r = 0; r <= rows; r++) {
        if (mergeRows.has(r) || r === rows) {
          if (r > segmentStart) {
            const segmentHeight = (r - segmentStart) * interiorClearanceInches + 
                                 (r - segmentStart - 1) * frameThickness;
            if (segmentHeight > 0) {
              segments.push({
                column: col,
                rowStart: segmentStart,
                rowEnd: r,
                lengthIn: segmentHeight
              });
            }
          }
          segmentStart = r + 1;
        }
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
    params.cols,
    params.merges, 
    presentVerticals
  );
  
  const frameThickness = params.materials.frame.actualInches;
  const verticalSegments = calculateVerticalSegments(
    params.rows,
    params.cols,
    params.merges,
    presentVerticals,
    frameThickness,
    params.interiorClearanceInches
  );
  
  const extendedShelves: ExtendedShelf[] = [];
  
  return {
    presentVerticals,
    horizontalSegments,
    verticalSegments,
    extendedShelves,
  };
}

