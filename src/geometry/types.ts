export type UnitSystem = 'imperial' | 'metric';

export type NominalThickness = '1/4"' | '1/2"' | '3/4"';

export interface ThicknessMap {
  nominal: NominalThickness;
  actualInches: number;
}

// For metric, we just store the thickness in mm
export interface MetricThickness {
  thicknessMm: number;
}

// Material can be either imperial (nominal/actual) or metric (just mm value)
export type Material = ThicknessMap | MetricThickness;

export interface MaterialOptions {
  frame: Material;
  back?: Material;
  door?: Material;
}

export interface DoorMode {
  type: 'inset' | 'overlay';
  reveal: number;  // inches or mm depending on unitSystem
  overlay: number; // inches or mm depending on unitSystem
}

export type DoorHardwarePosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type DoorHardwareType = 'drill-guide' | 'pull-hole';

export interface DoorHardware {
  position: DoorHardwarePosition;
  type: DoorHardwareType;
  inset: number; // inches or mm depending on unitSystem
}

export interface MergeSpec {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
}

export type ColorScheme = 'greys' | 'browns' | 'blues' | 'random';

export interface DesignParams {
  unitSystem: UnitSystem;
  rows: number;
  cols: number;
  interiorClearance: number; // inches or mm depending on unitSystem
  depth: number;              // inches or mm depending on unitSystem
  hasBack: boolean;
  hasDoors: boolean;
  doorMode: DoorMode;
  doorHardware?: DoorHardware;
  materials: MaterialOptions;
  merges: MergeSpec[];
  colorScheme: ColorScheme;
  opacity: number;
}

export type PartRole =
  | 'Top'
  | 'Bottom'
  | 'Side'
  | 'VerticalDivider'
  | 'BayShelf'
  | 'Back'
  | 'Door';

export interface Part {
  id: string;
  role: PartRole;
  qty: number;
  lengthIn: number;
  widthIn: number;
  thicknessIn: number;
  notes?: string;
  bay?: { row: number; colStart: number; colEnd: number; rowEnd?: number };
}

export interface VerticalSegment {
  column: number;
  rowStart: number;
  rowEnd: number;
  lengthIn: number;
}

export interface ExtendedShelf {
  row: number;
  colStart: number;
  colEnd: number;
  lengthIn: number;
}

export interface LayoutInfo {
  presentVerticals: Set<number>;
  horizontalSegments: Array<{
    row: number;
    colStart: number;
    colEnd: number;
  }>;
  verticalSegments: VerticalSegment[];
  extendedShelves: ExtendedShelf[];
}

export interface DerivedDimensions {
  extWidth: number;
  extHeight: number;
  extDepth: number;
}

export interface Warning {
  type: 'span_too_large';
  message: string;
  severity: 'info' | 'warning' | 'error';
  mergeIndex?: number; // Optional: links warning to specific merge
}

// Type guards and helpers
export function isImperialMaterial(material: Material): material is ThicknessMap {
  return 'nominal' in material && 'actualInches' in material;
}

export function isMetricMaterial(material: Material): material is MetricThickness {
  return 'thicknessMm' in material;
}

// Get thickness in inches regardless of unit system
export function getThicknessInInches(material: Material): number {
  if (isImperialMaterial(material)) {
    return material.actualInches;
  } else {
    return material.thicknessMm / 25.4; // Convert mm to inches
  }
}

// Get thickness in mm regardless of unit system
export function getThicknessInMm(material: Material): number {
  if (isMetricMaterial(material)) {
    return material.thicknessMm;
  } else {
    return material.actualInches * 25.4; // Convert inches to mm
  }
}