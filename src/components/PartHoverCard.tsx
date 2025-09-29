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
      className="hover-card"
      style={{
        left: position.x + 15,
        top: position.y + 15
      }}
    >
      <div className="text-mono text-xs font-semibold text-black">{part.id}</div>
      <div className="mt-2 space-y-0.5">
        <div className="text-mono text-xs text-black">{formatDimensions(part.lengthIn, part.widthIn, part.thicknessIn)}</div>
        {part.qty > 1 && <div className="text-mono text-xs text-gray-600">Qty: {part.qty}</div>}
      </div>
      {part.notes && (
        <div className="mt-2 text-xs text-mono text-gray-600 max-w-xs">
          {part.notes}
        </div>
      )}
    </div>
  );
}