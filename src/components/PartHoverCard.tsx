import { useState } from 'react';
import type { Part } from '../geometry/types';
import { formatDimensions } from '../geometry/format';

interface PartHoverCardProps {
  part: Part;
  position: { x: number; y: number };
}

export function PartHoverCard({ part, position }: PartHoverCardProps) {
  return (
    <div
      className="hover-card min-w-52"
      style={{
        left: position.x + 15,
        top: position.y + 15 
      }}
    >
      <div className="p-6">
        <div className="font-mono font-semibold text-sm text-black">{part.id}</div>
        <div className="mt-3 text-xs space-y-1">
          <div className="font-mono text-black">{formatDimensions(part.lengthIn, part.widthIn, part.thicknessIn)}</div>
          {part.qty > 1 && <div className="font-mono text-gray-600">Qty: {part.qty}</div>}
        </div>
        {part.notes && (
          <div className="mt-3 text-xs font-mono text-gray-600 max-w-xs">
            {part.notes}
          </div>
        )}
      </div>
    </div>
  );
}