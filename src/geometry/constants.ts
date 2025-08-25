import type { NominalThickness, ThicknessMap, DesignParams } from './types';

// Default Kallax dimensions (inches)
export const DEFAULT_INTERIOR_CLEARANCE = 13.25;
export const DEFAULT_DEPTH = 15.375;

// Nominal to actual thickness mapping (standard plywood)
export const THICKNESS_MAP: Record<NominalThickness, number> = {
  '1/4"': 7/32,    // 0.21875
  '1/2"': 15/32,   // 0.46875
  '3/4"': 23/32,   // 0.71875
};

export const createThicknessMap = (nominal: NominalThickness): ThicknessMap => ({
  nominal,
  actualInches: THICKNESS_MAP[nominal],
});

// Default material recommendations
export const RECOMMENDED_MATERIALS = {
  frame: createThicknessMap('3/4"'),
  back: createThicknessMap('1/4"'),
  door: createThicknessMap('3/4"'),
};

// Default design parameters for a simple 2x2 shelf
export const DEFAULT_DESIGN: DesignParams = {
  rows: 2,
  cols: 2,
  interiorClearanceInches: DEFAULT_INTERIOR_CLEARANCE,
  depthInches: DEFAULT_DEPTH,
  hasBack: false,
  hasDoors: false,
  doorMode: {
    type: 'inset',
    revealInches: 1/16, // 0.0625"
    overlayInches: 0.5,
  },
  materials: {
    frame: RECOMMENDED_MATERIALS.frame,
    back: RECOMMENDED_MATERIALS.back,
    door: RECOMMENDED_MATERIALS.door,
  },
  merges: [],
};

// Grid constraints
export const MAX_GRID_SIZE = 10;