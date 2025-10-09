import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/analytics';
import type { DesignParams, DerivedDimensions } from '../geometry/types';
import type { DesignAnalysis } from '../geometry/estimate';

// Initialize Firebase (only once)
let firebaseApp: any = null;
let db: any = null;

function initializeFirebase() {
  if (!firebaseApp && FIREBASE_CONFIG.apiKey) {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(firebaseApp);
  }
  return db;
}

interface DesignExportData {
  timestamp: Date;
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
  // Skip if Firebase not configured
  if (!FIREBASE_CONFIG.apiKey) {
    return;
  }

  try {
    const db = initializeFirebase();
    if (!db) {
      return;
    }

    // Calculate door percentage
    const totalCells = params.rows * params.cols;
    const doorPercentage = params.hasDoors ? (analysis.estimate.totalDoors / totalCells) * 100 : 0;

    // Prepare document data
    const docData: DesignExportData = {
      timestamp: new Date(),
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
      doorPercentage: Math.round(doorPercentage * 10) / 10,
    };

    // Add document to 'design-exports' collection
    await addDoc(collection(db, 'design-exports'), docData);
  } catch (error) {
    // Silently fail - don't interrupt user experience
  }
}
