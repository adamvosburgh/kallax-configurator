import { useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseMobileAwarePositionOptions {
  cardWidth?: number;
  cardHeight?: number;
  offset?: number;
  mobileTopOffset?: number;
}

export function useMobileAwarePosition(
  position: Position,
  options: UseMobileAwarePositionOptions = {}
) {
  const {
    cardWidth = 200,
    cardHeight = 100,
    offset = 15,
    mobileTopOffset = 80
  } = options;

  const [isMobile, setIsMobile] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adjust position
  useEffect(() => {
    if (isMobile) {
      // Mobile: center horizontally, fixed vertical position
      const viewportWidth = window.innerWidth;
      setAdjustedPosition({
        x: viewportWidth / 2 - cardWidth / 2,
        y: mobileTopOffset
      });
    } else {
      // Desktop: offset from cursor with viewport bounds checking
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x + offset;
      let y = position.y + offset;

      // Keep within viewport
      if (x + cardWidth > viewportWidth) {
        x = position.x - cardWidth - offset;
      }
      if (y + cardHeight > viewportHeight) {
        y = position.y - cardHeight - offset;
      }
      if (x < 0) x = offset;
      if (y < 0) y = offset;

      setAdjustedPosition({ x, y });
    }
  }, [position, isMobile, cardWidth, cardHeight, offset, mobileTopOffset]);

  return { adjustedPosition, isMobile };
}
