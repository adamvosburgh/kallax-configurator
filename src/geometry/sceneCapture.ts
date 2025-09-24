import * as THREE from 'three';
import type { DesignParams, Part } from './types';
import { generateParts } from './parts';
import { calculateAllDimensions } from './measurements';
import {
  calculateBottomPosition,
  calculateTopPosition,
  calculateLeftSidePosition,
  calculateRightSidePosition,
  calculateBackPosition,
  calculateBayShelfPosition,
  calculateDoorPosition,
  calculateVerticalDividerPosition,
  calculateVerticalDividerSegmentPosition
} from './measurements';

/**
 * Create a part mesh with outline for rendering
 */
function createPartMesh(part: Part, params: DesignParams, dimensions: { extWidth: number; extHeight: number; extDepth: number }): THREE.Group {
  // Convert dimensions from inches to scene units (scale down for better viewing)
  const scaleX = part.lengthIn * 0.1;
  const scaleY = part.thicknessIn * 0.1;
  const scaleZ = part.widthIn * 0.1;
  
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  
  // White fill with black outline for schematic look
  const material = new THREE.MeshBasicMaterial({ 
    color: '#ffffff', // White fill
    transparent: false
  });
  
  // Add black outline using edges geometry
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#000000', linewidth: 1 });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position the mesh
  const frameThickness = params.materials.frame.actualInches;
  let position: [number, number, number] = [0, 0, 0];
  
  switch (part.role) {
    case 'Bottom':
      position = calculateBottomPosition(dimensions.extHeight, frameThickness);
      break;
    case 'Top':
      position = calculateTopPosition(dimensions.extHeight, frameThickness);
      break;
    case 'Side':
      if (part.id.includes('L')) {
        position = calculateLeftSidePosition(dimensions.extWidth, frameThickness);
      } else {
        position = calculateRightSidePosition(dimensions.extWidth, frameThickness);
      }
      break;
    case 'Back':
      position = calculateBackPosition(dimensions.extDepth);
      break;
    case 'BayShelf':
      if (part.bay) {
        position = calculateBayShelfPosition(
          part.bay,
          params.rows,
          params.cols,
          params.interiorClearanceInches,
          frameThickness,
          dimensions.extWidth,
          dimensions.extHeight
        );
      }
      break;
    case 'Door':
      if (part.bay) {
        const doorThickness = params.materials.door?.actualInches || 0.75;
        position = calculateDoorPosition(
          part.bay,
          params.rows,
          params.cols,
          params.interiorClearanceInches,
          frameThickness,
          dimensions.extWidth,
          dimensions.extHeight,
          params.doorMode,
          doorThickness,
          params.depthInches
        );
      }
      break;
    case 'VerticalDivider':
      if (part.bay && part.bay.rowEnd !== undefined) {
        // Segmented vertical divider
        const columnIndex = part.bay.colStart;
        position = calculateVerticalDividerSegmentPosition(
          columnIndex,
          part.bay.row,
          part.bay.rowEnd,
          part.lengthIn,
          params.cols,
          params.rows,
          params.interiorClearanceInches,
          frameThickness,
          dimensions.extWidth,
          dimensions.extHeight
        );
      } else {
        // Extract column index from notes (fallback)
        const columnMatch = part.notes?.match(/column (\d+)/);
        const columnIndex = columnMatch ? parseInt(columnMatch[1], 10) : 1;
        position = calculateVerticalDividerPosition(
          columnIndex,
          params.cols,
          params.interiorClearanceInches,
          frameThickness,
          dimensions.extWidth
        );
      }
      break;
  }
  
  // Apply same transformations to both mesh and line segments
  const applyTransforms = (object: THREE.Object3D) => {
    object.position.set(position[0], position[1], position[2]);
    object.scale.set(scaleX, scaleY, scaleZ);
    
    // Rotation for parts that need to be oriented differently
    if (part.role === 'Side' || part.role === 'VerticalDivider') {
      object.rotation.z = Math.PI / 2; // 90 degrees around Z-axis
    } else if (part.role === 'Back' || part.role === 'Door') {
      object.rotation.x = Math.PI / 2; // 90 degrees around X-axis to make height vertical
    }
  };
  
  applyTransforms(mesh);
  applyTransforms(lineSegments);
  
  // Create a group to hold both the mesh and its edges
  const group = new THREE.Group();
  group.add(mesh);
  group.add(lineSegments);
  
  return group;
}

/**
 * Capture the 3D scene as an image from an axonometric/isometric angle
 */
export async function captureAxonometricView(
  params: DesignParams,
  width: number = 1024,
  height: number = 1024
): Promise<Blob> {
  // Generate parts and dimensions
  const parts = generateParts(params);
  const dimensions = calculateAllDimensions(params);
  
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // White background for line drawing
  
  // Simple lighting for wireframe rendering
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  
  // Add all part meshes to the scene
  for (const part of parts) {
    const partGroup = createPartMesh(part, params, dimensions);
    scene.add(partGroup);
  }
  
  // Create camera with long lens to minimize distortion
  const camera = new THREE.PerspectiveCamera(15, width / height, 0.1, 1000);
  
  // Position camera mostly from front, slightly to the left
  // This gives a view of the left side with symmetrical top/bottom perspective
  const distance = Math.max(dimensions.extWidth, dimensions.extHeight, dimensions.extDepth) * 0.1 * 4;
  camera.position.set(-distance * 0.3, distance * 0.15, distance);
  camera.lookAt(0, 0, 0);
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false 
  });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Render the scene
  renderer.render(scene, camera);
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    renderer.domElement.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob from canvas'));
      }
    }, 'image/png');
  });
}

/**
 * Capture the 3D scene as a base64 data URL
 */
export async function captureAxonometricViewAsDataURL(
  params: DesignParams,
  width: number = 1024,
  height: number = 1024
): Promise<string> {
  const blob = await captureAxonometricView(params, width, height);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}