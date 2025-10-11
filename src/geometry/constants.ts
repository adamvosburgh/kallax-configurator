import type { NominalThickness, ThicknessMap, DesignParams, MetricThickness } from './types';
import { THICKNESS_MAP as THICKNESS_VALUES } from './measurements';

// ===== IMPERIAL DEFAULTS =====

// Default Kallax dimensions (inches) - these are user-configurable defaults
export const DEFAULT_INTERIOR_CLEARANCE_IMPERIAL = 13.25;
export const DEFAULT_DEPTH_IMPERIAL = 15.375;
export const DEFAULT_REVEAL_IMPERIAL = 1/16; // 0.0625"
export const DEFAULT_OVERLAY_IMPERIAL = 0.25; // 1/4"
export const DEFAULT_HARDWARE_INSET_IMPERIAL = 1; // 1"

// Nominal to actual thickness mapping (standard plywood) - imported from measurements
export const THICKNESS_MAP: Record<NominalThickness, number> = THICKNESS_VALUES;

export const createThicknessMap = (nominal: NominalThickness): ThicknessMap => ({
  nominal,
  actualInches: THICKNESS_MAP[nominal],
});

// Default material recommendations (imperial)
export const RECOMMENDED_MATERIALS_IMPERIAL = {
  frame: createThicknessMap('3/4"'),
  back: createThicknessMap('1/4"'),
  door: createThicknessMap('3/4"'),
};

// ===== METRIC DEFAULTS =====

// Default Kallax dimensions (mm)
export const DEFAULT_INTERIOR_CLEARANCE_METRIC = 335;
export const DEFAULT_DEPTH_METRIC = 390;
export const DEFAULT_REVEAL_METRIC = 2; // 2mm
export const DEFAULT_OVERLAY_METRIC = 6; // 6mm
export const DEFAULT_HARDWARE_INSET_METRIC = 25; // 25mm

export const createMetricThickness = (thicknessMm: number): MetricThickness => ({
  thicknessMm,
});

// Default material recommendations (metric)
export const RECOMMENDED_MATERIALS_METRIC = {
  frame: createMetricThickness(18),
  back: createMetricThickness(6),
  door: createMetricThickness(18),
};

// ===== DEFAULT DESIGNS =====

// Default design parameters for a simple 2x2 shelf (imperial)
export const DEFAULT_DESIGN_IMPERIAL: DesignParams = {
  unitSystem: 'imperial',
  rows: 2,
  cols: 2,
  interiorClearance: DEFAULT_INTERIOR_CLEARANCE_IMPERIAL,
  depth: DEFAULT_DEPTH_IMPERIAL,
  hasBack: false,
  hasDoors: false,
  doorMode: {
    type: 'inset',
    reveal: DEFAULT_REVEAL_IMPERIAL,
    overlay: DEFAULT_OVERLAY_IMPERIAL,
  },
  materials: {
    frame: RECOMMENDED_MATERIALS_IMPERIAL.frame,
  },
  merges: [],
  colorScheme: 'blues',
  opacity: 0.9,
};

// Default design parameters for a simple 2x2 shelf (metric)
export const DEFAULT_DESIGN_METRIC: DesignParams = {
  unitSystem: 'metric',
  rows: 2,
  cols: 2,
  interiorClearance: DEFAULT_INTERIOR_CLEARANCE_METRIC,
  depth: DEFAULT_DEPTH_METRIC,
  hasBack: false,
  hasDoors: false,
  doorMode: {
    type: 'inset',
    reveal: DEFAULT_REVEAL_METRIC,
    overlay: DEFAULT_OVERLAY_METRIC,
  },
  materials: {
    frame: RECOMMENDED_MATERIALS_METRIC.frame,
  },
  merges: [],
  colorScheme: 'blues',
  opacity: 0.9,
};

// Default to imperial for backwards compatibility
export const DEFAULT_DESIGN = DEFAULT_DESIGN_IMPERIAL;

// For backwards compatibility
export const DEFAULT_INTERIOR_CLEARANCE = DEFAULT_INTERIOR_CLEARANCE_IMPERIAL;
export const DEFAULT_DEPTH = DEFAULT_DEPTH_IMPERIAL;
export const RECOMMENDED_MATERIALS = RECOMMENDED_MATERIALS_IMPERIAL;

// Grid constraints
export const MAX_GRID_SIZE = 10;