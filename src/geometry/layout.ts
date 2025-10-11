import type { DesignParams, MergeSpec, LayoutInfo, VerticalSegment, ExtendedShelf } from './types';
import { getThicknessInInches } from './types';
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

    // Find horizontal merges that affect this row boundary
    const horizontalMergesAtRow = merges.filter(merge =>
      merge.c1 > merge.c0 && // spans multiple columns (is horizontal)
      ((merge.r0 <= r - 1 && merge.r1 >= r - 1) || // merge in row above boundary
       (merge.r0 <= r && merge.r1 >= r)) // merge in row below boundary
    );

    // Track which areas are covered by extended shelves to avoid duplicates
    const coveredRanges: Array<{ start: number; end: number }> = [];

    if (horizontalMergesAtRow.length > 0) {
      // Find the union of all horizontal merges at this row
      let minMergeCol = Math.min(...horizontalMergesAtRow.map(m => m.c0));
      let maxMergeCol = Math.max(...horizontalMergesAtRow.map(m => m.c1));

      // Check which vertical dividers in the merged area are actually continuous
      const brokenVerticals = new Set<number>();

      for (let col = minMergeCol + 1; col <= maxMergeCol; col++) {
        if (presentVerticals.has(col)) {
          // Check if this vertical is broken by any horizontal merge
          const brokenInRowAbove = horizontalMergesAtRow.some(merge =>
            merge.r0 <= r - 1 && merge.r1 >= r - 1 && col > merge.c0 && col <= merge.c1
          );
          const brokenInRowBelow = horizontalMergesAtRow.some(merge =>
            merge.r0 <= r && merge.r1 >= r && col > merge.c0 && col <= merge.c1
          );

          if (brokenInRowAbove || brokenInRowBelow) {
            brokenVerticals.add(col);
          }
        }
      }

      // Group merges by their continuous spans (separated by unbroken verticals)
      const continuousSpans: Array<{ start: number; end: number }> = [];
      let spanStart = minMergeCol;

      for (let col = minMergeCol + 1; col <= maxMergeCol + 1; col++) {
        const isUnbrokenVertical = presentVerticals.has(col) && !brokenVerticals.has(col);
        const isEndOfMergeArea = col > maxMergeCol;

        if (isUnbrokenVertical || isEndOfMergeArea) {
          // End current span
          continuousSpans.push({ start: spanStart, end: col });
          spanStart = col;
        }
      }

      // Create shelf segments for each continuous span
      for (const span of continuousSpans) {
        // Check if there's a vertical merge that would eliminate the need for a shelf
        let hasVerticalMerge = false;
        for (let c = span.start; c < span.end; c++) {
          if (areCellsMerged(r - 1, c, r, c, merges)) {
            hasVerticalMerge = true;
            break;
          }
        }

        if (!hasVerticalMerge) {
          // Find the actual vertical boundaries for this span
          const startCol = verticalCols.filter(col => col <= span.start).pop() || 0;
          const endCol = verticalCols.find(col => col >= span.end) || cols;

          segments.push({
            row: r,
            colStart: startCol,
            colEnd: endCol,
          });
          coveredRanges.push({ start: startCol, end: endCol });
        }
      }
    }

    // Then, handle normal segments between verticals that aren't covered by extended shelves
    for (let i = 0; i < verticalCols.length - 1; i++) {
      const colStart = verticalCols[i];
      const colEnd = verticalCols[i + 1];

      // Check if this segment is already covered by an extended shelf
      const alreadyCovered = coveredRanges.some(range =>
        colStart >= range.start && colEnd <= range.end
      );

      if (!alreadyCovered) {
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
  interiorClearance: number
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
        rows * interiorClearance + (rows + 1) * frameThickness,
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
            const segmentHeight = (r - segmentStart) * interiorClearance +
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

  const frameThickness = getThicknessInInches(params.materials.frame);
  // Convert to inches for calculations
  const interiorClearanceInches = params.unitSystem === 'metric' ? params.interiorClearance / 25.4 : params.interiorClearance;

  const verticalSegments = calculateVerticalSegments(
    params.rows,
    params.cols,
    params.merges,
    presentVerticals,
    frameThickness,
    interiorClearanceInches
  );
  
  const extendedShelves: ExtendedShelf[] = [];
  
  return {
    presentVerticals,
    horizontalSegments,
    verticalSegments,
    extendedShelves,
  };
}

