import { describe, it, expect } from 'vitest';
import { calculateLayout, calculateDimensions } from './layout';
import { DEFAULT_DESIGN } from './constants';
import type { DesignParams } from './types';

describe('Layout Calculation', () => {
  it('should calculate correct layout for 2x2 with no merges', () => {
    const params = DEFAULT_DESIGN;
    const layout = calculateLayout(params);
    
    // Should have verticals at columns 0, 1, 2 (left side, middle, right side)
    expect(layout.presentVerticals.has(0)).toBe(true);
    expect(layout.presentVerticals.has(1)).toBe(true);
    expect(layout.presentVerticals.has(2)).toBe(true);
    expect(layout.presentVerticals.size).toBe(3);
    
    // Should have horizontal segments at row 1 (between rows 0 and 1)
    expect(layout.horizontalSegments).toHaveLength(2);
    expect(layout.horizontalSegments[0]).toEqual({
      row: 1,
      colStart: 0,
      colEnd: 1,
    });
    expect(layout.horizontalSegments[1]).toEqual({
      row: 1,
      colStart: 1,
      colEnd: 2,
    });
  });
  
  it('should omit vertical when all rows are merged across a boundary', () => {
    const params: DesignParams = {
      ...DEFAULT_DESIGN,
      rows: 2,
      cols: 2,
      merges: [
        { r0: 0, c0: 0, r1: 1, c1: 1 }, // Merge all 4 cells into one
      ],
    };
    
    const layout = calculateLayout(params);
    
    // Should only have side verticals (0, 2), no middle vertical (1)
    expect(layout.presentVerticals.has(0)).toBe(true);
    expect(layout.presentVerticals.has(1)).toBe(false);
    expect(layout.presentVerticals.has(2)).toBe(true);
    expect(layout.presentVerticals.size).toBe(2);
    
    // Should have no horizontal segments due to vertical merge
    expect(layout.horizontalSegments).toHaveLength(0);
  });
  
  it('should calculate correct exterior dimensions', () => {
    const params = DEFAULT_DESIGN; // 2x2, no back
    const dims = calculateDimensions(params);
    
    const L = 13.25;
    const t = 23/32; // 3/4" actual thickness
    
    const expectedWidth = 2 * L + 3 * t; // 2 modules + 3 frame pieces
    const expectedHeight = 2 * L + 3 * t;
    const expectedDepth = 15.375; // No back
    
    expect(dims.extWidth).toBeCloseTo(expectedWidth, 4);
    expect(dims.extHeight).toBeCloseTo(expectedHeight, 4);
    expect(dims.extDepth).toBeCloseTo(expectedDepth, 4);
  });
  
  it('should include back thickness in depth when back is enabled', () => {
    const params: DesignParams = {
      ...DEFAULT_DESIGN,
      hasBack: true,
    };
    
    const dims = calculateDimensions(params);
    const backThickness = params.materials.back?.actualInches || 0;
    
    expect(dims.extDepth).toBeCloseTo(15.375 + backThickness, 4);
  });
  
  it('should handle 3x1 configuration with middle merge', () => {
    const params: DesignParams = {
      ...DEFAULT_DESIGN,
      rows: 1,
      cols: 3,
      merges: [
        { r0: 0, c0: 1, r1: 0, c1: 2 }, // Merge middle and right cells
      ],
    };
    
    const layout = calculateLayout(params);
    
    // Should have verticals at 0, 1, 3 (left, after first cell, right)
    // Middle vertical (2) should be omitted due to merge
    expect(layout.presentVerticals.has(0)).toBe(true);
    expect(layout.presentVerticals.has(1)).toBe(true);
    expect(layout.presentVerticals.has(2)).toBe(false);
    expect(layout.presentVerticals.has(3)).toBe(true);
    
    // No horizontal segments in 1-row configuration
    expect(layout.horizontalSegments).toHaveLength(0);
  });
});