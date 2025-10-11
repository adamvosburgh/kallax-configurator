import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useDesignStore } from '../state/useDesignStore';
import type { Part } from '../geometry/types';
import { getThicknessInInches } from '../geometry/types';
import { PartHoverCard } from './PartHoverCard';
import { MergeTargetOverlay } from './MergeTargetOverlay';
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
} from '../geometry/measurements';
import * as THREE from 'three';

interface PartMeshProps {
  part: Part;
  position: [number, number, number];
  onHover: (part: Part | null, event?: THREE.Event) => void;
}

function PartMesh({ part, position, onHover }: PartMeshProps) {
  const [, setHovered] = useState(false);
  const { selectedPartId, hoveredPartId, params } = useDesignStore();

  const isSelected = selectedPartId === part.id;
  const isHovered = hoveredPartId === part.id;
  
  // Convert dimensions from inches to scene units (scale down for better viewing)
  const scaleX = part.lengthIn * 0.1;
  const scaleY = part.thicknessIn * 0.1;
  const scaleZ = part.widthIn * 0.1;
  
  // Rotation for parts that need to be oriented differently
  const getRotation = (): [number, number, number] => {
    if (part.role === 'Side' || part.role === 'VerticalDivider') {
      return [0, 0, Math.PI / 2]; // 90 degrees around Z-axis
    }
    if (part.role === 'Back' || part.role === 'Door') {
      return [Math.PI / 2, 0, 0]; // 90 degrees around X-axis to make height vertical
    }
    return [0, 0, 0];
  };

  // Color based on part role and color scheme
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // blue for selection
    if (isHovered) return '#10b981'; // green for hover

    const { colorScheme } = params;

    // Random color scheme - generate a consistent color per part ROLE
    if (colorScheme === 'random') {
      const hash = part.role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = (hash * 137.508) % 360; // Golden angle approximation for better distribution
      return `hsl(${hue}, 65%, 55%)`;
    }

    // Color schemes by role
    const colorSchemes: Record<'greys' | 'browns' | 'blues', Record<string, string>> = {
      greys: {
        'Top': '#6b7280',
        'Bottom': '#6b7280',
        'Side': '#4b5563',
        'VerticalDivider': '#4b5563',
        'BayShelf': '#9ca3af',
        'Back': '#374151',
        'Door': '#d1d5db',
      },
      browns: {
        'Top': '#a0522d',
        'Bottom': '#a0522d',
        'Side': '#8b4513',
        'VerticalDivider': '#8b4513',
        'BayShelf': '#d2691e',
        'Back': '#654321',
        'Door': '#cd853f',
      },
      blues: {
        'Top': '#60a5fa',
        'Bottom': '#60a5fa',
        'Side': '#3b82f6',
        'VerticalDivider': '#3b82f6',
        'BayShelf': '#93c5fd',
        'Back': '#1e40af',
        'Door': '#bfdbfe',
      },
    };

    if (colorScheme === 'greys' || colorScheme === 'browns' || colorScheme === 'blues') {
      return colorSchemes[colorScheme]?.[part.role] || '#deb887';
    }
    return '#deb887';
  };

  // Calculate hardware position for doors
  const getHardwarePosition = (): [number, number, number] | null => {
    if (part.role !== 'Door' || !params.doorHardware) return null;

    const { position: hwPosition, inset: insetValue } = params.doorHardware;
    // Convert to inches if metric, then to scene units
    const insetInches = params.unitSystem === 'metric' ? insetValue / 25.4 : insetValue;
    const inset = insetInches * 0.1; // Convert to scene units

    // Door dimensions in scene units
    const width = part.lengthIn * 0.1;
    const height = part.widthIn * 0.1;

    // Calculate position relative to door center
    let x = 0;
    let z = 0;

    // Horizontal position
    if (hwPosition.includes('left')) {
      x = -width / 2 + inset;
    } else if (hwPosition.includes('right')) {
      x = width / 2 - inset;
    } else {
      x = 0; // center
    }

    // Vertical position
    if (hwPosition.includes('top')) {
      z = -height / 2 + inset;
    } else if (hwPosition.includes('bottom')) {
      z = height / 2 - inset;
    } else {
      z = 0; // middle
    }

    // y position is slightly in front of the door surface
    const y = part.thicknessIn * 0.1 / 2 + 0.01;

    return [x, y, z];
  };

  const hardwarePos = getHardwarePosition();
  const hardwareDiameter = params.doorHardware?.type === 'pull-hole' ? 1 : 0.125; // in inches
  const hardwareRadius = (hardwareDiameter * 0.1) / 2; // Convert to scene units

  return (
    <group position={position} rotation={getRotation()}>
      <mesh
        scale={[scaleX, scaleY, scaleZ]}
        onPointerEnter={(e) => {
          setHovered(true);
          onHover(part, e);
          e.stopPropagation();
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={getColor()}
          transparent
          opacity={params.opacity}
        />
      </mesh>

      {/* Door hardware circle */}
      {hardwarePos && (
        <mesh position={hardwarePos} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[hardwareRadius, 32]} />
          <meshStandardMaterial
            color="#333333"
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Enable/disable 3D merge functionality
const ENABLE_3D_MERGE_TARGETS = false;

function Scene() {
  const { analysis, dimensions, params } = useDesignStore();
  const [hoveredPart, setHoveredPart] = useState<Part | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Update mouse position from global storage when parts are hovered
  useEffect(() => {
    if ((window as any).canvasMousePos) {
      setMousePos((window as any).canvasMousePos);
    }
  }, [hoveredPart]);

  const handleHover = (part: Part | null) => {
    setHoveredPart(part);
    useDesignStore.getState().setHoveredPartId(part?.id || null);
  };
  
  // Position parts in 3D space
  const getPartPosition = (part: Part): [number, number, number] => {
    const frameThickness = getThicknessInInches(params.materials.frame);

    // Convert to inches for calculations
    const interiorClearanceInches = params.unitSystem === 'metric'
      ? params.interiorClearance / 25.4
      : params.interiorClearance;
    const depthInches = params.unitSystem === 'metric'
      ? params.depth / 25.4
      : params.depth;
    const revealInches = params.unitSystem === 'metric'
      ? params.doorMode.reveal / 25.4
      : params.doorMode.reveal;
    const overlayInches = params.unitSystem === 'metric'
      ? params.doorMode.overlay / 25.4
      : params.doorMode.overlay;

    // Create converted door mode for position calculations
    const doorModeInches = {
      type: params.doorMode.type,
      revealInches,
      overlayInches,
    };

    switch (part.role) {
      case 'Bottom':
        return calculateBottomPosition(dimensions.extHeight, frameThickness);
      case 'Top':
        return calculateTopPosition(dimensions.extHeight, frameThickness);
      case 'Side':
        if (part.id.includes('L')) {
          return calculateLeftSidePosition(dimensions.extWidth, frameThickness);
        } else {
          return calculateRightSidePosition(dimensions.extWidth, frameThickness);
        }
      case 'Back':
        return calculateBackPosition(dimensions.extDepth);
      case 'BayShelf':
        if (part.bay) {
          return calculateBayShelfPosition(
            part.bay,
            params.rows,
            params.cols,
            interiorClearanceInches,
            frameThickness,
            dimensions.extWidth,
            dimensions.extHeight
          );
        }
        return [0, 0, 0];
      case 'Door':
        if (part.bay) {
          const doorThickness = params.materials.door ? getThicknessInInches(params.materials.door) : 0.75;
          return calculateDoorPosition(
            part.bay,
            params.rows,
            params.cols,
            interiorClearanceInches,
            frameThickness,
            dimensions.extWidth,
            dimensions.extHeight,
            doorModeInches,
            doorThickness,
            depthInches
          );
        }
        return [0, 0, 0];
      case 'VerticalDivider':
        if (part.bay && part.bay.rowEnd !== undefined) {
          // Segmented vertical divider
          const columnIndex = part.bay.colStart;
          return calculateVerticalDividerSegmentPosition(
            columnIndex,
            part.bay.row,
            part.bay.rowEnd,
            part.lengthIn,
            params.cols,
            params.rows,
            interiorClearanceInches,
            frameThickness,
            dimensions.extWidth,
            dimensions.extHeight
          );
        } else {
          // Extract column index from notes (fallback)
          const columnMatch = part.notes?.match(/column (\d+)/);
          const columnIndex = columnMatch ? parseInt(columnMatch[1], 10) : 1;
          return calculateVerticalDividerPosition(
            columnIndex,
            params.cols,
            interiorClearanceInches,
            frameThickness,
            dimensions.extWidth
          );
        }
      default:
        return [0, 0, 0];
    }
  };
  
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      
      {analysis.parts.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          position={getPartPosition(part)}
          onHover={handleHover}
        />
      ))}

      {/* 3D Merge Target Overlay - toggleable functionality */}
      <MergeTargetOverlay enabled={ENABLE_3D_MERGE_TARGETS} />

      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
}

export function Canvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hoveredPartId } = useDesignStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newMousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Store mouse position globally for the Scene component to use
      (window as any).canvasMousePos = newMousePos;
      setMousePos(newMousePos);
    }
  }, []);

  // Get the hovered part from the analysis
  const { analysis } = useDesignStore();
  const hoveredPart = hoveredPartId ? analysis.parts.find(p => p.id === hoveredPartId) : null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full canvas-3d-bg relative"
      onMouseMove={handleMouseMove}
    >
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Hover card - outside of Canvas for proper positioning */}
      {hoveredPart && (
        <PartHoverCard part={hoveredPart} position={mousePos} />
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <h3 className="font-semibold mb-2">Parts Legend</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#a0522d' }}></div>
            <span>Top/Bottom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#8b4513' }}></div>
            <span>Sides/Verticals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#d2691e' }}></div>
            <span>Shelves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#654321' }}></div>
            <span>Back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#cd853f' }}></div>
            <span>Doors</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
          Hover parts for details
        </div>
      </div>
    </div>
  );
}