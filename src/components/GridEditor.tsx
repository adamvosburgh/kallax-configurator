import { useState, useCallback, useEffect } from 'react';
import { useDesignStore } from '../state/useDesignStore';
import type { MergeSpec } from '../geometry/types';
import { MAX_GRID_SIZE } from '../geometry/constants';
import { useMobileAwarePosition } from '../lib/useMobileAwarePosition';

export function GridEditor() {
  const {
    params,
    analysis,
    setRows,
    setCols,
    addMerge,
    removeMerge,
    clearMerges
  } = useDesignStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  const [hoveredWarning, setHoveredWarning] = useState<string | null>(null);
  const [warningPosition, setWarningPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile-aware positioning for warning tooltip
  const { adjustedPosition: adjustedWarningPos, isMobile: isWarningMobile } = useMobileAwarePosition(warningPosition, {
    cardWidth: 250,
    cardHeight: 60,
    mobileTopOffset: 120
  });

  // Local state for input fields to allow empty strings
  const [rowsInput, setRowsInput] = useState(String(params.rows));
  const [colsInput, setColsInput] = useState(String(params.cols));

  // Listen for reset events to update local input state
  useEffect(() => {
    const handleReset = () => {
      setRowsInput('2');
      setColsInput('2');
    };
    window.addEventListener('design-reset', handleReset);
    return () => window.removeEventListener('design-reset', handleReset);
  }, []);

  // Check if a cell is part of a merge
  const getCellMerge = (row: number, col: number): { merge: MergeSpec; index: number } | null => {
    const index = params.merges.findIndex(merge =>
      row >= merge.r0 && row <= merge.r1 && col >= merge.c0 && col <= merge.c1
    );
    return index >= 0 ? { merge: params.merges[index], index } : null;
  };

  // Handle mouse down to start drag selection
  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true);
    setDragStart({ row, col });
    setDragEnd({ row, col });
  };

  // Handle mouse enter during drag
  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ row, col });
    }
  };

  // Handle mouse up to complete merge
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      const r0 = Math.min(dragStart.row, dragEnd.row);
      const r1 = Math.max(dragStart.row, dragEnd.row);
      const c0 = Math.min(dragStart.col, dragEnd.col);
      const c1 = Math.max(dragStart.col, dragEnd.col);

      // Only create merge if it spans multiple cells
      if (r0 !== r1 || c0 !== c1) {
        addMerge({ r0, c0, r1, c1 });
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, addMerge]);

  // Handle click on existing merge to remove it
  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (event.detail === 2) { // Double click
      const cellMerge = getCellMerge(row, col);
      if (cellMerge) {
        removeMerge(cellMerge.index);
      }
    }
  };

  // Get current drag selection bounds
  const getDragBounds = () => {
    if (!isDragging || !dragStart || !dragEnd) return null;

    return {
      r0: Math.min(dragStart.row, dragEnd.row),
      r1: Math.max(dragStart.row, dragEnd.row),
      c0: Math.min(dragStart.col, dragEnd.col),
      c1: Math.max(dragStart.col, dragEnd.col),
    };
  };

  // Check if cell is in current drag selection
  const isInDragSelection = (row: number, col: number): boolean => {
    const bounds = getDragBounds();
    if (!bounds) return false;

    return row >= bounds.r0 && row <= bounds.r1 && col >= bounds.c0 && col <= bounds.c1;
  };

  // Calculate grid scaling to fit in fixed container
  const CONTAINER_SIZE = 250; // Fixed container size
  const BASE_CELL_SIZE = 40; // Base cell size for scaling reference

  // Calculate the cell size to fit grid in container
  const gridWidth = params.cols * BASE_CELL_SIZE;
  const gridHeight = params.rows * BASE_CELL_SIZE;
  const maxDimension = Math.max(gridWidth, gridHeight);

  // Scale down if needed to fit in container
  const scale = maxDimension > CONTAINER_SIZE ? CONTAINER_SIZE / maxDimension : 1;
  const cellSize = BASE_CELL_SIZE * scale;

  // Calculate offset to center grid
  const actualWidth = params.cols * cellSize;
  const actualHeight = params.rows * cellSize;
  const offsetX = (CONTAINER_SIZE - actualWidth) / 2;
  const offsetY = (CONTAINER_SIZE - actualHeight) / 2;

  // Get warnings for specific merge
  const getWarningsForMerge = (mergeIndex: number) => {
    return analysis.warnings.filter(w => w.mergeIndex === mergeIndex);
  };

  // Get general warnings (not merge-specific)
  const generalWarnings = analysis.warnings.filter(w => w.mergeIndex === undefined);

  const handleWarningHover = (message: string, event: React.MouseEvent) => {
    setHoveredWarning(message);
    setWarningPosition({ x: event.clientX, y: event.clientY });
  };

  const handleWarningLeave = () => {
    setHoveredWarning(null);
  };

  return (
    <div className="space-y-4">
      {/* Grid size controls */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Rows:</label>
          <input
            type="number"
            min="1"
            max={MAX_GRID_SIZE}
            value={rowsInput}
            onChange={(e) => {
              setRowsInput(e.target.value);
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1) {
                setRows(val);
              }
            }}
            onBlur={() => {
              const val = parseInt(rowsInput);
              if (isNaN(val) || val < 1 || rowsInput === '') {
                setRows(1);
                setRowsInput('1');
              }
            }}
            className="input-field"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cols:</label>
          <input
            type="number"
            min="1"
            max={MAX_GRID_SIZE}
            value={colsInput}
            onChange={(e) => {
              setColsInput(e.target.value);
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1) {
                setCols(val);
              }
            }}
            onBlur={() => {
              const val = parseInt(colsInput);
              if (isNaN(val) || val < 1 || colsInput === '') {
                setCols(1);
                setColsInput('1');
              }
            }}
            className="input-field"
          />
        </div>
      </div>
      <br />
      {/* Instructions */}
      <div className="text-sm text-gray-600">
        Drag to select multiple cells to merge.
      </div>
      <br />
      {/* Fixed-size grid container */}
      <div
        className="relative bg-white select-none"
        style={{
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid content - centered and scaled */}
        <div
          className="absolute"
          style={{
            left: offsetX,
            top: offsetY,
            width: actualWidth,
            height: actualHeight,
          }}
        >
          {/* Render all individual cells first */}
          {Array.from({ length: params.rows }, (_, row) =>
            Array.from({ length: params.cols }, (_, col) => {
              const cellMerge = getCellMerge(row, col);
              const isInDrag = isInDragSelection(row, col);

              // Skip cells that are part of a merge
              if (cellMerge) return null;

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className={`
                    absolute grid-cell
                    ${isInDrag ? 'grid-cell-drag' : ''}
                  `}
                  style={{
                    left: col * cellSize,
                    top: row * cellSize,
                    width: cellSize,
                    height: cellSize,
                  }}
                  onMouseDown={() => handleMouseDown(row, col)}
                  onMouseEnter={() => handleMouseEnter(row, col)}
                  onClick={(e) => handleCellClick(row, col, e)}
                >
                  <span className="text-gray-400" style={{ fontSize: `${Math.max(8, cellSize / 4)}px` }}>
                    {row},{col}
                  </span>
                </div>
              );
            })
          )}

          {/* Render merged cells on top */}
          {params.merges.map((merge, mergeIndex) => {
            const isInDrag = Array.from({ length: merge.r1 - merge.r0 + 1 }, (_, dr) =>
              Array.from({ length: merge.c1 - merge.c0 + 1 }, (_, dc) =>
                isInDragSelection(merge.r0 + dr, merge.c0 + dc)
              )
            ).some(row => row.some(cell => cell));

            const mergeWarnings = getWarningsForMerge(mergeIndex);

            return (
              <div
                key={`merge-${mergeIndex}`}
                className={`
                  absolute grid-cell grid-cell-merged
                  ${isInDrag ? 'grid-cell-drag' : ''}
                `}
                style={{
                  left: merge.c0 * cellSize,
                  top: merge.r0 * cellSize,
                  width: (merge.c1 - merge.c0 + 1) * cellSize,
                  height: (merge.r1 - merge.r0 + 1) * cellSize,
                  zIndex: 1,
                }}
                onClick={(e) => handleCellClick(merge.r0, merge.c0, e)}
              >
                <span className="text-green-700" style={{ fontSize: `${Math.max(10, cellSize / 3)}px` }}>
                  {merge.c1 - merge.c0 + 1}×{merge.r1 - merge.r0 + 1}
                </span>

                {/* X button to remove merge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMerge(mergeIndex);
                  }}
                  className="absolute bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  style={{
                    top: 2,
                    right: 2,
                    width: Math.max(16, cellSize / 5),
                    height: Math.max(16, cellSize / 5),
                    fontSize: `${Math.max(10, cellSize / 4)}px`,
                    lineHeight: 1,
                  }}
                  title="Remove merge"
                >
                  ×
                </button>

                {/* Warning icon if merge has warnings */}
                {mergeWarnings.length > 0 && (
                  <div
                    className="absolute cursor-help"
                    style={{
                      top: 2,
                      left: 2,
                      fontSize: `${Math.max(12, cellSize / 3)}px`,
                    }}
                    onMouseEnter={(e) => handleWarningHover(mergeWarnings.map(w => w.message).join(', '), e)}
                    onMouseLeave={handleWarningLeave}
                    title={mergeWarnings.map(w => w.message).join(', ')}
                  >
                    ⚠️
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* General warning icon in corner if any exist */}
        {generalWarnings.length > 0 && (
          <div
            className="absolute cursor-help"
            style={{
              bottom: 8,
              right: 8,
              fontSize: '20px',
            }}
            onMouseEnter={(e) => handleWarningHover(generalWarnings.map(w => w.message).join(', '), e)}
            onMouseLeave={handleWarningLeave}
            title={generalWarnings.map(w => w.message).join(', ')}
          >
            ℹ️
          </div>
        )}
      </div>

      {/* Warning hover tooltip */}
      {hoveredWarning && (
        <div
          className={`hover-card ${isWarningMobile ? 'hover-card-mobile' : ''}`}
          style={{
            position: 'fixed',
            left: adjustedWarningPos.x,
            top: adjustedWarningPos.y,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div className="text-mono text-xs text-black">{hoveredWarning}</div>
        </div>
      )}
    </div>
  );
}
