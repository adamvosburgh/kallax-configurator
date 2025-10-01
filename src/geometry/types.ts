export type NominalThickness = '1/4"' | '1/2"' | '3/4"';

export interface ThicknessMap {
  nominal: NominalThickness;
  actualInches: number;
}

export interface MaterialOptions {
  frame: ThicknessMap;
  back?: ThicknessMap;
  door?: ThicknessMap;
}

export interface DoorMode {
  type: 'inset' | 'overlay';
  revealInches?: number;
  overlayInches?: number;
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
  insetInches: number;
}

export interface MergeSpec {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
}

export type ColorScheme = 'greys' | 'browns' | 'blues' | 'random';

export interface DesignParams {
  rows: number;
  cols: number;
  interiorClearanceInches: number;
  depthInches: number;
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
}