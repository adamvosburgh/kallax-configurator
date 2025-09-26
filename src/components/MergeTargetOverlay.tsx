import { useState, useRef, useEffect } from 'react';
import { useDesignStore } from '../state/useDesignStore';
import * as THREE from 'three';

// Interface for potential merge positions
interface MergeTarget {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  position: [number, number, number];
  direction: 'horizontal' | 'vertical';
}

// Component for rendering merge target plus sign
interface MergeTargetMeshProps {
  target: MergeTarget;
  isHovered: boolean;
  onHover: (target: MergeTarget | null) => void;
  onClick: (target: MergeTarget) => void;
}

function MergeTargetMesh({ target, isHovered, onHover, onClick }: MergeTargetMeshProps) {
  const [isNearMouse, setIsNearMouse] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Animate scale on hover
  useEffect(() => {
    if (groupRef.current) {
      const targetScale = isNearMouse ? 2 : 1;
      // Simple lerp animation
      const animate = () => {
        if (groupRef.current) {
          const currentScale = groupRef.current.scale.x;
          const newScale = currentScale + (targetScale - currentScale) * 0.15;
          groupRef.current.scale.setScalar(newScale);

          if (Math.abs(newScale - targetScale) > 0.01) {
            requestAnimationFrame(animate);
          }
        }
      };
      animate();
    }
  }, [isNearMouse]);

  // Log only when state changes to avoid spam
  useEffect(() => {
    if (isNearMouse) {
      console.log('Plus icon hover state changed:', { position: target.position, isNearMouse });
    }
  }, [isNearMouse]);

  return (
    <group position={target.position}>
      {/* Invisible larger hit area for hover detection */}
      <mesh
        onClick={(e) => {
          console.log('Plus icon clicked:', target);
          e.stopPropagation();
          onClick(target);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setIsNearMouse(true);
          onHover(target);
        }}
        onPointerLeave={() => {
          setIsNearMouse(false);
          onHover(null);
        }}
      >
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Always visible plus icon with hover animation */}
      <group ref={groupRef}>
        {/* Plus sign horizontal bar */}
        <mesh>
          <boxGeometry args={[0.08, 0.015, 0.05]} />
          <meshStandardMaterial
            color={isNearMouse ? '#10b981' : '#3b82f6'}
            transparent
            opacity={isNearMouse ? 0.9 : 0.2}
          />
        </mesh>

        {/* Plus sign vertical bar */}
        <mesh>
          <boxGeometry args={[0.015, 0.08, 0.05]} />
          <meshStandardMaterial
            color={isNearMouse ? '#10b981' : '#3b82f6'}
            transparent
            opacity={isNearMouse ? 0.9 : 0.2}
          />
        </mesh>

        {/* Background circle for better visibility - MOVED FURTHER BACK */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.06, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={isNearMouse ? 0.8 : 0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

interface MergeTargetOverlayProps {
  enabled: boolean;
}

export function MergeTargetOverlay({ enabled }: MergeTargetOverlayProps) {
  const { analysis, dimensions, params, addMerge } = useDesignStore();
  const [hoveredMergeTarget, setHoveredMergeTarget] = useState<MergeTarget | null>(null);

  const handleMergeTargetHover = (target: MergeTarget | null) => {
    setHoveredMergeTarget(target);
  };

  const handleMergeClick = (target: MergeTarget) => {
    const { row1, col1, row2, col2 } = target;

    // Find existing merges that include either cell
    const existingMerge1 = params.merges.find(merge =>
      row1 >= merge.r0 && row1 <= merge.r1 && col1 >= merge.c0 && col1 <= merge.c1
    );
    const existingMerge2 = params.merges.find(merge =>
      row2 >= merge.r0 && row2 <= merge.r1 && col2 >= merge.c0 && col2 <= merge.c1
    );

    let r0, r1, c0, c1;

    if (existingMerge1 && existingMerge2 && existingMerge1 !== existingMerge2) {
      // Merge two existing merges
      r0 = Math.min(existingMerge1.r0, existingMerge2.r0);
      r1 = Math.max(existingMerge1.r1, existingMerge2.r1);
      c0 = Math.min(existingMerge1.c0, existingMerge2.c0);
      c1 = Math.max(existingMerge1.c1, existingMerge2.c1);
    } else if (existingMerge1) {
      // Extend existing merge to include the second cell
      r0 = Math.min(existingMerge1.r0, row2);
      r1 = Math.max(existingMerge1.r1, row2);
      c0 = Math.min(existingMerge1.c0, col2);
      c1 = Math.max(existingMerge1.c1, col2);
    } else if (existingMerge2) {
      // Extend existing merge to include the first cell
      r0 = Math.min(existingMerge2.r0, row1);
      r1 = Math.max(existingMerge2.r1, row1);
      c0 = Math.min(existingMerge2.c0, col1);
      c1 = Math.max(existingMerge2.c1, col1);
    } else {
      // Create new merge between the two cells
      r0 = Math.min(row1, row2);
      r1 = Math.max(row1, row2);
      c0 = Math.min(col1, col2);
      c1 = Math.max(col1, col2);
    }

    // Use the same addMerge logic as the 2D grid system
    addMerge({ r0, c0, r1, c1 });
  };

  // Calculate potential merge targets between adjacent cells
  const calculateMergeTargets = (): MergeTarget[] => {
    if (!enabled) return [];

    const targets: MergeTarget[] = [];
    const frameThickness = params.materials.frame.actualInches;
    const bayWidth = params.interiorClearanceInches;
    const bayHeight = params.interiorClearanceInches;

    // Scale factor to match the 3D parts
    const scale = 0.1;

    // Check if two cells are already merged
    const areCellsMerged = (r1: number, c1: number, r2: number, c2: number): boolean => {
      return params.merges.some(merge =>
        r1 >= merge.r0 && r1 <= merge.r1 && c1 >= merge.c0 && c1 <= merge.c1 &&
        r2 >= merge.r0 && r2 <= merge.r1 && c2 >= merge.c0 && c2 <= merge.c1
      );
    };

    // Horizontal merge targets (between columns)
    for (let row = 0; row < params.rows; row++) {
      for (let col = 0; col < params.cols - 1; col++) {
        if (!areCellsMerged(row, col, row, col + 1)) {
          // Position at the boundary between two cells, scaled to match 3D view
          const x = ((-dimensions.extWidth / 2) + frameThickness + ((col + 1) * bayWidth) + (col * frameThickness)) * scale;
          const y = ((dimensions.extHeight / 2) - frameThickness - ((row + 0.5) * bayHeight) - (row * frameThickness)) * scale;
          // Move in front of shelving by half depth plus buffer
          const z = (dimensions.extDepth / 2 + 1) * scale;

          targets.push({
            row1: row,
            col1: col,
            row2: row,
            col2: col + 1,
            position: [x, y, z],
            direction: 'horizontal'
          });
        }
      }
    }

    // Vertical merge targets (between rows)
    for (let row = 0; row < params.rows - 1; row++) {
      for (let col = 0; col < params.cols; col++) {
        if (!areCellsMerged(row, col, row + 1, col)) {
          // Position at the boundary between two cells, scaled to match 3D view
          const x = ((-dimensions.extWidth / 2) + frameThickness + ((col + 0.5) * bayWidth) + (col * frameThickness)) * scale;
          const y = ((dimensions.extHeight / 2) - frameThickness - ((row + 1) * bayHeight) - (row * frameThickness)) * scale;
          // Move in front of shelving by half depth plus buffer
          const z = (dimensions.extDepth / 2+ 1) * scale;

          targets.push({
            row1: row,
            col1: col,
            row2: row + 1,
            col2: col,
            position: [x, y, z],
            direction: 'vertical'
          });
        }
      }
    }

    return targets;
  };

  const mergeTargets = calculateMergeTargets();

  // One-time log on mount to confirm targets exist
  useEffect(() => {
    if (enabled) {
      console.log('Merge targets on mount:', mergeTargets.length);
      if (mergeTargets.length > 0) {
        console.log('First target position:', mergeTargets[0].position);
        console.log('First target opacity should be 0.2');
      }
    }
  }, [enabled, mergeTargets.length]);

  if (!enabled) return null;

  return (
    <>
      {/* Render merge targets */}
      {mergeTargets.map((target, index) => (
        <MergeTargetMesh
          key={`merge-target-${index}`}
          target={target}
          isHovered={hoveredMergeTarget === target}
          onHover={handleMergeTargetHover}
          onClick={handleMergeClick}
        />
      ))}
    </>
  );
}