import { describe, it, expect } from 'vitest';
import { toFraction32, formatDimensions, calculateBoardFeet } from './format';

describe('Format Utilities', () => {
  describe('toFraction32', () => {
    it('should format whole inches correctly', () => {
      expect(toFraction32(5)).toBe('5"');
      expect(toFraction32(12)).toBe('12"');
    });
    
    it('should format common fractions correctly', () => {
      expect(toFraction32(0.5)).toBe('1/2"');
      expect(toFraction32(0.25)).toBe('1/4"');
      expect(toFraction32(0.75)).toBe('3/4"');
    });
    
    it('should format mixed numbers correctly', () => {
      expect(toFraction32(1.5)).toBe('1 1/2"');
      expect(toFraction32(5.25)).toBe('5 1/4"');
      expect(toFraction32(12.75)).toBe('12 3/4"');
    });
    
    it('should handle 32nd fractions', () => {
      expect(toFraction32(1/32)).toBe('1/32"');
      expect(toFraction32(3/32)).toBe('3/32"');
      expect(toFraction32(5/32)).toBe('5/32"');
    });
    
    it('should simplify fractions', () => {
      expect(toFraction32(16/32)).toBe('1/2"');
      expect(toFraction32(8/32)).toBe('1/4"');
      expect(toFraction32(24/32)).toBe('3/4"');
    });
    
    it('should round to nearest 32nd', () => {
      // Test edge case rounding
      const almostHalf = 0.5 - 1/64; // Slightly less than 1/2"
      const result = toFraction32(almostHalf);
      expect(result).toBe('1/2"'); // Should round to nearest, which is 1/2"
    });
    
    it('should handle typical Kallax dimensions', () => {
      const L = 13.25;
      const t = 23/32; // 0.71875
      const extWidth = 2 * L + 3 * t; // 28.65625"
      
      expect(toFraction32(extWidth)).toBe('28 21/32"');
    });
  });
  
  describe('formatDimensions', () => {
    it('should format L×W×T correctly', () => {
      const result = formatDimensions(12, 6, 0.75);
      expect(result).toBe('12" × 6" × 3/4"');
    });
    
    it('should handle fractional dimensions', () => {
      const result = formatDimensions(13.25, 15.375, 23/32);
      expect(result).toBe('13 1/4" × 15 3/8" × 23/32"');
    });
  });
  
  describe('calculateBoardFeet', () => {
    it('should calculate board feet correctly', () => {
      // 1" × 12" × 12" = 144 cubic inches = 1 board foot
      expect(calculateBoardFeet(12, 12, 1)).toBe(1);
      
      // 2" × 6" × 12" = 144 cubic inches = 1 board foot  
      expect(calculateBoardFeet(12, 6, 2)).toBe(1);
    });
    
    it('should handle quantity correctly', () => {
      expect(calculateBoardFeet(12, 6, 1, 4)).toBe(2); // 4 pieces, 0.5 bf each
    });
    
    it('should handle typical plywood dimensions', () => {
      // 3/4" × 24" × 48" plywood sheet
      const bf = calculateBoardFeet(48, 24, 0.75);
      expect(bf).toBe(6); // 864 / 144 = 6 board feet
    });
  });
});