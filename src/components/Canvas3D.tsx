import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useDesignStore } from '../state/useDesignStore';
import type { Part } from '../geometry/types';
import { PartHoverCard } from './PartHoverCard';
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

  // Color based on part role
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // blue
    if (isHovered) return '#10b981'; // green
    
    switch (part.role) {
      case 'Top':
      case 'Bottom':
        return '#8b5cf6'; // purple
      case 'Side':
      case 'VerticalDivider':
        return '#f59e0b'; // amber
      case 'BayShelf':
        return '#ef4444'; // red
      case 'Back':
        return '#6b7280'; // gray
      case 'Door':
        return '#06b6d4'; // cyan
      default:
        return '#9ca3af'; // gray
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

function Scene() {
  const { analysis, dimensions } = useDesignStore();
  const [hoveredPart, setHoveredPart] = useState<Part | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const handleHover = (part: Part | null, event?: THREE.Event) => {
    setHoveredPart(part);
    useDesignStore.getState().setHoveredPartId(part?.id || null);
    
    if (event && part) {
      // Get screen coordinates for hover card
      const mouseEvent = event as any; // Three.js event doesn't have proper typing for mouse events
      if (mouseEvent.clientX && mouseEvent.clientY) {
        const canvas = event.target as HTMLElement;
        const rect = canvas.getBoundingClientRect();
        setMousePos({
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top,
        });
      }
    }
  };
  
  // Position parts in 3D space
  const getPartPosition = (part: Part): [number, number, number] => {
    const scaleX = 0.1;
    const scaleY = 0.1;
    const scaleZ = 0.1;
    
    switch (part.role) {
      case 'Bottom':
        return [0, -dimensions.extHeight * scaleY / 2, 0];
      case 'Top':
        return [0, dimensions.extHeight * scaleY / 2, 0];
      case 'Side':
        if (part.id.includes('L')) {
          return [-dimensions.extWidth * scaleX / 2, 0, 0];
        } else {
          return [dimensions.extWidth * scaleX / 2, 0, 0];
        }
      case 'Back':
        return [0, 0, -dimensions.extDepth * scaleZ / 2];
      default:
        // For other parts, position them roughly in the center for now
        // In a more sophisticated implementation, we'd calculate exact positions
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
      
      {hoveredPart && (
        <Html>
          <PartHoverCard part={hoveredPart} position={mousePos} />
        </Html>
      )}
      
      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
}

export function Canvas3D() {
  return (
    <div className="w-full h-full bg-gray-100 relative">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <h3 className="font-semibold mb-2">Parts Legend</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
            <span>Top/Bottom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <span>Sides/Verticals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span>Shelves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
            <span>Back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-sm opacity-70"></div>
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