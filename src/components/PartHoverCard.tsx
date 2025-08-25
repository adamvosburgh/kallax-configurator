import type { Part } from '../geometry/types';
import { formatDimensions } from '../geometry/format';

interface PartHoverCardProps {
  part: Part;
  position: { x: number; y: number };
}

export function PartHoverCard({ part, position }: PartHoverCardProps) {
  return (
    <div 
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none min-w-48"
      style={{ 
        left: position.x + 10, 
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="font-semibold text-sm text-gray-900">{part.id}</div>
      <div className="text-xs text-gray-600 capitalize">{part.role.replace(/([A-Z])/g, ' $1').trim()}</div>
      <div className="mt-1 text-xs">
        <div className="font-mono">{formatDimensions(part.lengthIn, part.widthIn, part.thicknessIn)}</div>
        {part.qty > 1 && <div className="text-gray-600">Qty: {part.qty}</div>}
      </div>
      {part.notes && (
        <div className="mt-1 text-xs text-gray-500 max-w-xs">
          {part.notes}
        </div>
      )}
    </div>
  );
}