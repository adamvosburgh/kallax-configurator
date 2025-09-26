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
    const verticalCols = Array.from(presentVerticals).sort((a, b) => a - b);

    // Find all cells that need shelf support at this row boundary
    // A cell needs shelf support if it's not vertically merged with the cell above/below
    const needsShelfSupport: boolean[] = new Array(cols).fill(false);

    for (let c = 0; c < cols; c++) {
      if (!areCellsMerged(r - 1, c, r, c, merges)) {
        needsShelfSupport[c] = true;
      }
    }

    // Group consecutive cells that need shelf support into shelf regions
    const shelfRegions: Array<{ start: number; end: number }> = [];
    let regionStart = -1;

    for (let c = 0; c <= cols; c++) { // go to cols+1 to handle end case
      if (c < cols && needsShelfSupport[c]) {
        if (regionStart === -1) {
          regionStart = c;
        }
      } else {
        if (regionStart !== -1) {
          shelfRegions.push({ start: regionStart, end: c });
          regionStart = -1;
        }
      }
    }

    // For each shelf region, create segments between the appropriate verticals
    for (const region of shelfRegions) {
      // Find the vertical boundaries that encompass this shelf region
      // We need to extend the shelf to the nearest verticals on either side

      // Find the vertical at or before the start of the region
      const startVertical = verticalCols.filter(col => col <= region.start).pop() || 0;

      // Find the vertical at or after the end of the region
      const endVertical = verticalCols.find(col => col >= region.end) || cols;

      // Only create a segment if we have a valid span
      if (startVertical < endVertical) {
        // Check if this exact segment already exists (to avoid duplicates)
        const exists = segments.some(seg =>
          seg.row === r && seg.colStart === startVertical && seg.colEnd === endVertical
        );

        if (!exists) {
          segments.push({
            row: r,
            colStart: startVertical,
            colEnd: endVertical,
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

