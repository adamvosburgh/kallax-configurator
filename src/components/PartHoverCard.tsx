import type { Part } from '../geometry/types';
import { formatDimensionsWithUnit } from '../geometry/format';
import { useMobileAwarePosition } from '../lib/useMobileAwarePosition';
import { useDesignStore } from '../state/useDesignStore';

interface PartHoverCardProps {
  part: Part;
  position: { x: number; y: number };
}

export function PartHoverCard({ part, position }: PartHoverCardProps) {
  const { params } = useDesignStore();
  const { adjustedPosition, isMobile } = useMobileAwarePosition(position, {
    cardWidth: 280,
    cardHeight: 120,
    mobileTopOffset: 80
  });

  return (
    <div
      className={`hover-card ${isMobile ? 'hover-card-mobile' : ''}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      <div className="text-mono text-xs font-semibold text-black">{part.id}</div>
      <div className={`mt-2 space-y-0.5 ${isMobile ? 'text-xs' : ''}`}>
        <div className={`text-mono ${isMobile ? 'text-xs' : 'text-xs'} text-black break-words`}>
          {formatDimensionsWithUnit(part.lengthIn, part.widthIn, part.thicknessIn, params.unitSystem)}
        </div>
        {part.qty > 1 && <div className={`text-mono ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}>Qty: {part.qty}</div>}
      </div>
      {part.notes && (
        <div className={`mt-2 text-mono text-gray-600 ${isMobile ? 'text-xs break-words' : 'text-xs max-w-xs'}`}>
          {part.notes}
        </div>
      )}
    </div>
  );
}