import { describe, it, expect } from 'vitest';
import { generateParts } from './parts';
import { DEFAULT_DESIGN } from './constants';
import type { DesignParams } from './types';

describe('Parts Generation', () => {
  it('should generate correct parts for 2x2 default configuration', () => {
    const params = DEFAULT_DESIGN; // 2x2, no back, no doors
    const parts = generateParts(params);
    
    // Count parts by role
    const partsByRole = parts.reduce((acc, part) => {
      acc[part.role] = (acc[part.role] || 0) + part.qty;
      return acc;
    }, {} as Record<string, number>);
    
    expect(partsByRole['Top']).toBe(1);
    expect(partsByRole['Bottom']).toBe(1);
    expect(partsByRole['Side']).toBe(2);
    expect(partsByRole['VerticalDivider']).toBe(1); // One middle vertical
    expect(partsByRole['BayShelf']).toBe(2); // Two shelf segments for middle row
    expect(partsByRole['Back']).toBeUndefined();
    expect(partsByRole['Door']).toBeUndefined();
  });
  
  it('should include back when enabled', () => {
    const params: DesignParams = {
      ...DEFAULT_DESIGN,
      hasBack: true,
    };
    
    const parts = generateParts(params);
    const backParts = parts.filter(p => p.role === 'Back');
    
    expect(backParts).toHaveLength(1);
    
    const backPart = backParts[0];
    expect(backPart.qty).toBe(1);
    expect(backPart.notes).toContain('Surface-mounted');
  });
  
  it('should include doors when enabled', () => {
    const params: DesignParams = {
      ...DEFAULT_DESIGN,
      hasDoors: true,
    };
    
    const parts = generateParts(params);
    const doorParts = parts.filter(p => p.role === 'Door');
    
    // 2x2 = 4 openings = 4 doors
    expect(doorParts).toHaveLength(4);
    
    for (const door of doorParts) {
      expect(door.qty).toBe(1);
      expect(door.notes).toContain('door');
    }
  });
  
  it('should calculate correct part dimensions', () => {
    const params = DEFAULT_DESIGN;
    const parts = generateParts(params);
    
    const topPart = parts.find(p => p.role === 'Top');
    expect(topPart).toBeDefined();
    
    if (topPart) {
      // Top should be full exterior width
      const L = 13.25;
      const t = 23/32; // 3/4" actual
      const expectedWidth = 2 * L + 3 * t; // 2 modules + 3 frame pieces
      
      expect(topPart.lengthIn).toBeCloseTo(expectedWidth, 4);
      expect(topPart.widthIn).toBe(15.375); // depth
      expect(topPart.thicknessIn).toBe(t);
    }
  });
  
  it('should reduce parts when cells are merged', () => {
    const paramsNoMerge = DEFAULT_DESIGN;
    const partsNoMerge = generateParts(paramsNoMerge);
    
    const paramsMerge: DesignParams = {
      ...DEFAULT_DESIGN,
      merges: [
        { r0: 0, c0: 0, r1: 1, c1: 1 }, // Merge all cells
      ],
    };
    const partsMerge = generateParts(paramsMerge);
    
    // With full merge, should have fewer interior pieces
    const noMergeVerticals = partsNoMerge.filter(p => p.role === 'VerticalDivider').length;
    const mergeVerticals = partsMerge.filter(p => p.role === 'VerticalDivider').length;
    
    const noMergeShelves = partsNoMerge.filter(p => p.role === 'BayShelf').length;
    const mergeShelves = partsMerge.filter(p => p.role === 'BayShelf').length;
    
    expect(mergeVerticals).toBeLessThan(noMergeVerticals);
    expect(mergeShelves).toBeLessThan(noMergeShelves);
  });
  
  it('should generate stable part IDs', () => {
    const params = DEFAULT_DESIGN;
    const parts1 = generateParts(params);
    const parts2 = generateParts(params);
    
    // Same configuration should produce same IDs
    const ids1 = parts1.map(p => p.id).sort();
    const ids2 = parts2.map(p => p.id).sort();
    
    expect(ids1).toEqual(ids2);
    
    // All IDs should be unique
    const uniqueIds = new Set(ids1);
    expect(uniqueIds.size).toBe(ids1.length);
  });
});