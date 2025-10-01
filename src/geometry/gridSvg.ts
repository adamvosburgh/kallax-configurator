/**
 * SVG generation for grid layout visualization
 * Creates a visual representation of the grid configuration with merges
 */

import type { DesignParams, MergeSpec } from './types';

const CELL_SIZE = 40;
const STROKE_WIDTH = 1;
const BORDER_WIDTH = 2;

/**
 * Check if a cell is part of a merge
 */
function getCellMerge(row: number, col: number, merges: MergeSpec[]): MergeSpec | null {
  return merges.find(merge =>
    row >= merge.r0 && row <= merge.r1 && col >= merge.c0 && col <= merge.c1
  ) || null;
}

/**
 * Check if a cell is the top-left origin of a merge (for rendering)
 */
function isMergeOrigin(row: number, col: number, merge: MergeSpec): boolean {
  return row === merge.r0 && col === merge.c0;
}

/**
 * Generate SVG representation of the grid layout
 */
export function generateGridSvg(params: DesignParams): string {
  const { rows, cols, merges } = params;
  const totalWidth = cols * CELL_SIZE + BORDER_WIDTH * 2;
  const totalHeight = rows * CELL_SIZE + BORDER_WIDTH * 2;
  
  const elements: string[] = [];
  
  // SVG header
  elements.push(`<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Add styles
  elements.push(`
    <defs>
      <style>
        .grid-border { fill: white; stroke: #6b7280; stroke-width: ${BORDER_WIDTH}; }
        .cell-border { fill: #f9fafb; stroke: #d1d5db; stroke-width: ${STROKE_WIDTH}; }
        .cell-merged { fill: #dcfce7; stroke: #22c55e; stroke-width: ${STROKE_WIDTH}; }
        .cell-text { font-family: monospace; font-size: 10px; text-anchor: middle; dominant-baseline: middle; fill: #9ca3af; }
        .merge-text { font-family: monospace; font-size: 10px; text-anchor: middle; dominant-baseline: middle; fill: #166534; font-weight: bold; }
      </style>
    </defs>
  `);
  
  // Outer border
  elements.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" class="grid-border" />`);
  
  // Generate cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const merge = getCellMerge(row, col, merges);
      const isOrigin = merge && isMergeOrigin(row, col, merge);
      const isInMerge = merge && !isOrigin;
      
      // Don't render cells that are covered by a merge (except origin)
      if (isInMerge) continue;
      
      const x = BORDER_WIDTH + col * CELL_SIZE;
      const y = BORDER_WIDTH + row * CELL_SIZE;
      
      let cellWidth = CELL_SIZE;
      let cellHeight = CELL_SIZE;
      let cssClass = 'cell-border';
      let textContent = `${row},${col}`;
      let textClass = 'cell-text';
      
      // Handle merged cells
      if (merge) {
        cellWidth = (merge.c1 - merge.c0 + 1) * CELL_SIZE;
        cellHeight = (merge.r1 - merge.r0 + 1) * CELL_SIZE;
        cssClass = 'cell-merged';
        textContent = `${merge.c1 - merge.c0 + 1}×${merge.r1 - merge.r0 + 1}`;
        textClass = 'merge-text';
      }
      
      // Cell rectangle
      elements.push(`<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" class="${cssClass}" />`);
      
      // Cell text
      const textX = x + cellWidth / 2;
      const textY = y + cellHeight / 2;
      elements.push(`<text x="${textX}" y="${textY}" class="${textClass}">${textContent}</text>`);
    }
  }
  
  // Close SVG
  elements.push('</svg>');
  
  return elements.join('\n');
}

/**
 * Generate a simple test grid SVG
 */
export function generateTestGridSvg(): string {
  const testParams: DesignParams = {
    rows: 3,
    cols: 4,
    merges: [
      { r0: 0, c0: 0, r1: 0, c1: 1 }, // 2×1 horizontal merge
      { r0: 1, c0: 2, r1: 2, c1: 2 }, // 1×2 vertical merge
    ],
    interiorClearanceInches: 13.25,
    depthInches: 15.375,
    hasBack: false,
    hasDoors: false,
    doorMode: { type: 'inset' },
    materials: {
      frame: { nominal: '3/4"', actualInches: 0.75 },
    },
    colorScheme: 'blues',
    opacity: 1.0,
  };
  
  return generateGridSvg(testParams);
}