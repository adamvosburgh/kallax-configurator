import { ANALYTICS_CONFIG } from '../config/analytics';
import type { DesignParams, DerivedDimensions } from '../geometry/types';
import type { DesignAnalysis } from '../geometry/estimate';

interface DesignExportData {
  timestamp: string;
  rows: number;
  cols: number;
  interiorClearance: number;
  depth: number;
  hasBack: boolean;
  hasDoors: boolean;
  doorMode: string;
  frameThickness: string;
  backThickness: string;
  doorThickness: string;
  mergeCount: number;
  colorScheme: string;
  extWidth: number;
  extHeight: number;
  extDepth: number;
  frameBoardFeet: number;
  backSquareFeet: number;
  doorSquareFeet: number;
  totalFrameParts: number;
  totalDoors: number;
  doorPercentage: number;
}

export async function logDesignExport(
  params: DesignParams,
  dimensions: DerivedDimensions,
  analysis: DesignAnalysis
): Promise<void> {
  // Skip if API key not configured
  if (ANALYTICS_CONFIG.GOOGLE_SHEETS_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('Analytics not configured - skipping design export logging');
    return;
  }

  try {
    // Calculate door percentage
    const totalCells = params.rows * params.cols;
    const doorPercentage = params.hasDoors ? (analysis.estimate.totalDoors / totalCells) * 100 : 0;

    // Prepare row data
    const rowData: DesignExportData = {
      timestamp: new Date().toISOString(),
      rows: params.rows,
      cols: params.cols,
      interiorClearance: params.interiorClearanceInches,
      depth: params.depthInches,
      hasBack: params.hasBack,
      hasDoors: params.hasDoors,
      doorMode: params.doorMode.type,
      frameThickness: params.materials.frame.nominal,
      backThickness: params.materials.back?.nominal || 'N/A',
      doorThickness: params.materials.door?.nominal || 'N/A',
      mergeCount: params.merges.length,
      colorScheme: params.colorScheme,
      extWidth: dimensions.extWidth,
      extHeight: dimensions.extHeight,
      extDepth: dimensions.extDepth,
      frameBoardFeet: analysis.estimate.frameBoardFeet,
      backSquareFeet: analysis.estimate.backSquareFeet,
      doorSquareFeet: analysis.estimate.doorSquareFeet,
      totalFrameParts: analysis.estimate.totalFrameParts,
      totalDoors: analysis.estimate.totalDoors,
      doorPercentage: Math.round(doorPercentage * 10) / 10, // Round to 1 decimal
    };

    // Convert to array of values in order
    const values = [
      rowData.timestamp,
      rowData.rows,
      rowData.cols,
      rowData.interiorClearance,
      rowData.depth,
      rowData.hasBack,
      rowData.hasDoors,
      rowData.doorMode,
      rowData.frameThickness,
      rowData.backThickness,
      rowData.doorThickness,
      rowData.mergeCount,
      rowData.colorScheme,
      rowData.extWidth,
      rowData.extHeight,
      rowData.extDepth,
      rowData.frameBoardFeet,
      rowData.backSquareFeet,
      rowData.doorSquareFeet,
      rowData.totalFrameParts,
      rowData.totalDoors,
      rowData.doorPercentage,
    ];

    // Append to Google Sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${ANALYTICS_CONFIG.SHEET_ID}/values/${ANALYTICS_CONFIG.SHEET_NAME}:append?valueInputOption=RAW&key=${ANALYTICS_CONFIG.GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to log design export:', error);
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('Error logging design export:', error);
  }
}

// Helper function to get column headers for setting up the sheet
export function getSheetHeaders(): string[] {
  return [
    'Timestamp',
    'Rows',
    'Cols',
    'Interior Clearance (in)',
    'Depth (in)',
    'Has Back',
    'Has Doors',
    'Door Mode',
    'Frame Thickness',
    'Back Thickness',
    'Door Thickness',
    'Merge Count',
    'Color Scheme',
    'Ext Width (in)',
    'Ext Height (in)',
    'Ext Depth (in)',
    'Frame Board Feet',
    'Back Sq Ft',
    'Door Sq Ft',
    'Total Frame Parts',
    'Total Doors',
    'Door Percentage',
  ];
}
