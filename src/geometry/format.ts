/**
 * Convert decimal inches to nearest 1/32" fraction format
 * e.g., 28.65625 -> "28 21/32""
 */
export function toFraction32(valueInches: number): string {
  const wholeInches = Math.floor(valueInches);
  const fractionalPart = valueInches - wholeInches;
  
  // Round to nearest 1/32"
  const thirtySeconds = Math.round(fractionalPart * 32);
  
  if (thirtySeconds === 0) {
    return `${wholeInches}"`;
  }
  
  if (thirtySeconds === 32) {
    return `${wholeInches + 1}"`;
  }
  
  // Simplify the fraction
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };
  const divisor = gcd(thirtySeconds, 32);
  const numerator = thirtySeconds / divisor;
  const denominator = 32 / divisor;
  
  if (wholeInches === 0) {
    return `${numerator}/${denominator}"`;
  }
  
  return `${wholeInches} ${numerator}/${denominator}"`;
}

/**
 * Format dimensions as L×W×T with fractions
 */
export function formatDimensions(length: number, width: number, thickness: number): string {
  return `${toFraction32(length)} × ${toFraction32(width)} × ${toFraction32(thickness)}`;
}

/**
 * Calculate board feet from dimensions
 */
export function calculateBoardFeet(lengthIn: number, widthIn: number, thicknessIn: number, qty: number = 1): number {
  return (lengthIn * widthIn * thicknessIn * qty) / 144; // 144 cubic inches per board foot
}