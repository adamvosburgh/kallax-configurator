import { useState, useCallback } from 'react';
import { useDesignStore } from '../state/useDesignStore';
import type { MergeSpec } from '../geometry/types';
import { MAX_GRID_SIZE } from '../geometry/constants';

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
  
  // Check if a cell is part of a merge
  const getCellMerge = (row: number, col: number): MergeSpec | null => {
    return params.merges.find(merge =>
      row >= merge.r0 && row <= merge.r1 && col >= merge.c0 && col <= merge.c1
    ) || null;
  };
  
  // Check if a cell is the top-left of a merge (for rendering)
  const _isMergeOrigin = (row: number, col: number, merge: MergeSpec): boolean => {
    return row === merge.r0 && col === merge.c0;
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
      const existingMergeIndex = params.merges.findIndex(merge =>
        row >= merge.r0 && row <= merge.r1 && col >= merge.c0 && col <= merge.c1
      );
      
      if (existingMergeIndex >= 0) {
        removeMerge(existingMergeIndex);
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
            value={params.rows}
            onChange={(e) => setRows(parseInt(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cols:</label>
          <input
            type="number"
            min="1"
            max={MAX_GRID_SIZE}
            value={params.cols}
            onChange={(e) => setCols(parseInt(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <button
          onClick={clearMerges}
          disabled={params.merges.length === 0}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Merges
        </button>
      </div>
      
      {/* Instructions */}
      <div className="text-xs text-gray-600">
        Drag to select multiple cells to merge. Double-click merged areas to unmerge.
      </div>
      
      {/* Grid */}
      <div 
        className="inline-block border-2 border-gray-400 bg-white select-none relative"
        style={{ 
          width: params.cols * 40, 
          height: params.rows * 40 
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render all individual cells first */}
        {Array.from({ length: params.rows }, (_, row) =>
          Array.from({ length: params.cols }, (_, col) => {
            const merge = getCellMerge(row, col);
            const isInDrag = isInDragSelection(row, col);
            
            // Skip cells that are part of a merge
            if (merge) return null;
            
            return (
              <div
                key={`cell-${row}-${col}`}
                className={`
                  absolute grid-cell
                  ${isInDrag ? 'grid-cell-drag' : ''}
                `}
                style={{
                  left: col * 40,
                  top: row * 40,
                  width: 40,
                  height: 40,
                }}
                onMouseDown={() => handleMouseDown(row, col)}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onClick={(e) => handleCellClick(row, col, e)}
              >
                <span className="text-gray-400">
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
          
          return (
            <div
              key={`merge-${mergeIndex}`}
              className={`
                absolute grid-cell grid-cell-merged
                ${isInDrag ? 'grid-cell-drag' : ''}
              `}
              style={{
                left: merge.c0 * 40,
                top: merge.r0 * 40,
                width: (merge.c1 - merge.c0 + 1) * 40,
                height: (merge.r1 - merge.r0 + 1) * 40,
                zIndex: 1,
              }}
              onClick={(e) => handleCellClick(merge.r0, merge.c0, e)}
            >
              <span className="text-green-700">
                {merge.c1 - merge.c0 + 1}×{merge.r1 - merge.r0 + 1}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="space-y-2">
          {analysis.warnings.map((warning, index) => (
            <div
              key={index}
              className={`
                p-2 rounded text-sm
                ${warning.severity === 'error' ? 'bg-red-100 text-red-800' : ''}
                ${warning.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${warning.severity === 'info' ? 'bg-blue-100 text-blue-800' : ''}
              `}
            >
              {warning.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Current merges list */}
      {params.merges.length > 0 && (
        <div className="text-xs">
          <div className="font-medium mb-1">Active Merges:</div>
          <div className="space-y-1">
            {params.merges.map((merge, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                <span>
                  ({merge.r0},{merge.c0}) to ({merge.r1},{merge.c1}) - 
                  {merge.c1 - merge.c0 + 1}×{merge.r1 - merge.r0 + 1}
                </span>
                <button
                  onClick={() => removeMerge(index)}
                  className="text-red-600 hover:text-red-800 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}