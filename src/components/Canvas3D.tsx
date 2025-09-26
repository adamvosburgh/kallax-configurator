import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useDesignStore } from '../state/useDesignStore';
import type { Part } from '../geometry/types';
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
  const { selectedPartId, hoveredPartId } = useDesignStore();
  
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

  // Color based on part role - brown wood shades
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // blue for selection
    if (isHovered) return '#10b981'; // green for hover

    switch (part.role) {
      case 'Top':
      case 'Bottom':
        return '#a0522d'; // sienna
      case 'Side':
      case 'VerticalDivider':
        return '#8b4513'; // saddle brown
      case 'BayShelf':
        return '#d2691e'; // chocolate
      case 'Back':
        return '#654321'; // dark brown
      case 'Door':
        return '#cd853f'; // peru
      default:
        return '#deb887'; // burlywood
    }
  };
  
  return (
    <mesh
      position={position}
      rotation={getRotation()}
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
        opacity={part.role === 'Door' ? 0.7 : 0.9}
      />
    </mesh>
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
    const frameThickness = params.materials.frame.actualInches;
    
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
            params.interiorClearanceInches,
            frameThickness,
            dimensions.extWidth,
            dimensions.extHeight
          );
        }
        return [0, 0, 0];
      case 'Door':
        if (part.bay) {
          const doorThickness = params.materials.door?.actualInches || 0.75;
          return calculateDoorPosition(
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
            params.interiorClearanceInches,
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
            params.interiorClearanceInches,
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
      const mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Store mouse position globally for the Scene component to use
      (window as any).canvasMousePos = mousePos;
      setMousePos(mousePos);
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