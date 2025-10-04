import type { Part, DesignParams } from './types';
import { calculateLayout } from './layout';
import { toFraction32 } from './format';

/**
 * Information about where parts intersect with other parts
 */
interface IntersectionInfo {
  partId: string;
  role: string;
  lengthIn: number;
  widthIn: number;
  thicknessIn: number;
  intersections: Array<{
    position: number; // Distance from left edge (for horizontal pieces) or top edge (for vertical pieces)
    label: string;
  }>;
}

/**
 * Calculate intersection positions for all frame parts
 * Returns a map of part ID to intersection information
 */
export function calculateIntersections(
  parts: Part[],
  params: DesignParams
): Map<string, IntersectionInfo> {
  const layout = calculateLayout(params);
  const intersectionMap = new Map<IntersectionInfo['partId'], IntersectionInfo>();

  const frameThickness = params.materials.frame.actualInches;
  const interiorClearance = params.interiorClearanceInches;

  // Module width (interior + one frame thickness)
  const moduleWidth = interiorClearance + frameThickness;

  // Get frame parts only (exclude doors and back)
  const frameParts = parts.filter(p =>
    p.role === 'Top' || p.role === 'Bottom' || p.role === 'Side' ||
    p.role === 'VerticalDivider' || p.role === 'BayShelf'
  );

  // Calculate intersections for Top piece
  const topPart = frameParts.find(p => p.role === 'Top');
  if (topPart) {
    const intersections: Array<{ position: number; label: string }> = [];

    // Add vertical dividers
    const presentVerticals = Array.from(layout.presentVerticals).sort((a, b) => a - b);
    for (const col of presentVerticals) {
      if (col === 0 || col === params.cols) continue; // Skip sides

      // Position from left edge to centerline of divider
      // = frameThickness (left side) + col * (interiorClearance + frameThickness) + frameThickness/2 (to center of divider)
      const position = frameThickness + col * (interiorClearance + frameThickness) - frameThickness / 2;
      intersections.push({ position, label: `VDiv-${col}` });
    }

    intersectionMap.set(topPart.id, {
      partId: topPart.id,
      role: topPart.role,
      lengthIn: topPart.lengthIn,
      widthIn: topPart.widthIn,
      thicknessIn: topPart.thicknessIn,
      intersections: intersections.sort((a, b) => a.position - b.position),
    });
  }

  // Calculate intersections for Bottom piece (same as top)
  const bottomPart = frameParts.find(p => p.role === 'Bottom');
  if (bottomPart && topPart) {
    const topInfo = intersectionMap.get(topPart.id);
    if (topInfo) {
      intersectionMap.set(bottomPart.id, {
        partId: bottomPart.id,
        role: bottomPart.role,
        lengthIn: bottomPart.lengthIn,
        widthIn: bottomPart.widthIn,
        thicknessIn: bottomPart.thicknessIn,
        intersections: topInfo.intersections.map(i => ({ ...i })),
      });
    }
  }

  // Calculate intersections for Side pieces
  const sideParts = frameParts.filter(p => p.role === 'Side');
  for (const sidePart of sideParts) {
    const intersections: Array<{ position: number; label: string }> = [];

    // Sides only have shelves intersecting them
    // Position from top edge of side (which sits between top and bottom) to where each shelf centerline is
    for (const segment of layout.horizontalSegments) {
      // Check if this shelf touches this side
      if (segment.colStart === 0 || segment.colEnd === params.cols) {
        // Position from top edge of the side piece to center of shelf
        // Side piece starts at frameThickness below the top
        // Shelf is at: segment.row * (interiorClearance + frameThickness) - frameThickness/2
        const position = segment.row * (interiorClearance + frameThickness) - frameThickness / 2;
        intersections.push({
          position,
          label: `Bay-${segment.row}-Col${segment.colStart}to${segment.colEnd}`
        });
      }
    }

    intersectionMap.set(sidePart.id, {
      partId: sidePart.id,
      role: sidePart.role,
      lengthIn: sidePart.lengthIn,
      widthIn: sidePart.widthIn,
      thicknessIn: sidePart.thicknessIn,
      intersections: intersections.sort((a, b) => a.position - b.position),
    });
  }

  // Calculate intersections for Vertical Dividers
  const verticalParts = frameParts.filter(p => p.role === 'VerticalDivider');
  for (const vertPart of verticalParts) {
    const intersections: Array<{ position: number; label: string }> = [];

    // Find which shelves intersect this vertical divider
    // Parse the column from the part ID (e.g., "VDiv-2-R0to3" -> column 2)
    const colMatch = vertPart.id.match(/VDiv-(\d+)/);
    if (!colMatch) continue;

    const col = parseInt(colMatch[1]);
    const rowMatch = vertPart.id.match(/R(\d+)to(\d+)/);
    if (!rowMatch) continue;

    const rowStart = parseInt(rowMatch[1]);
    const rowEnd = parseInt(rowMatch[2]);

    // Find shelves that intersect this vertical segment
    for (const segment of layout.horizontalSegments) {
      // Check if shelf crosses this column and is within the vertical's row range
      if (segment.colStart <= col && segment.colEnd >= col &&
          segment.row >= rowStart && segment.row <= rowEnd) {
        // Position from top of this vertical segment to centerline of shelf
        const position = (segment.row - rowStart) * (interiorClearance + frameThickness) - frameThickness / 2;
        intersections.push({
          position,
          label: `Bay-${segment.row}-Col${segment.colStart}to${segment.colEnd}`
        });
      }
    }

    intersectionMap.set(vertPart.id, {
      partId: vertPart.id,
      role: vertPart.role,
      lengthIn: vertPart.lengthIn,
      widthIn: vertPart.widthIn,
      thicknessIn: vertPart.thicknessIn,
      intersections: intersections.sort((a, b) => a.position - b.position),
    });
  }

  // Bay shelves don't get intersection marks (as per user request)
  // Because the marks would need to be on the butt ends

  return intersectionMap;
}

/**
 * Generate an SVG diagram for a single part showing intersection positions
 */
export function generatePartAssemblySvg(
  info: IntersectionInfo,
  scale: number = 1
): string {
  const { partId, lengthIn, widthIn, intersections } = info;

  // Determine orientation (horizontal vs vertical piece)
  const isHorizontal = lengthIn > widthIn;

  // SVG dimensions with margin for labels
  const margin = 60; // Space for labels
  const topMargin = 40; // Space for part ID

  // Scale the part dimensions to fit nicely in the SVG
  const scaledLength = lengthIn * scale;
  const scaledWidth = widthIn * scale;

  const svgWidth = scaledLength + 2 * margin;
  const svgHeight = scaledWidth + margin + topMargin;

  // Rectangle position
  const rectX = margin;
  const rectY = topMargin;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

  // Background
  svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="white"/>`;

  // Part rectangle
  svg += `<rect x="${rectX}" y="${rectY}" width="${scaledLength}" height="${scaledWidth}" `;
  svg += `fill="#f9fafb" stroke="#111827" stroke-width="2"/>`;

  // Part ID label (centered above rectangle)
  svg += `<text x="${svgWidth / 2}" y="${topMargin - 15}" `;
  svg += `font-family="monospace" font-size="14" font-weight="bold" fill="#111827" text-anchor="middle">`;
  svg += partId;
  svg += `</text>`;

  // Outer dimensions
  if (isHorizontal) {
    // Length dimension (top)
    svg += `<text x="${svgWidth / 2}" y="${topMargin - 5}" `;
    svg += `font-family="monospace" font-size="10" fill="#6b7280" text-anchor="middle">`;
    svg += `${toFraction32(lengthIn)} × ${toFraction32(widthIn)}`;
    svg += `</text>`;
  } else {
    // Vertical piece
    svg += `<text x="${svgWidth / 2}" y="${topMargin - 5}" `;
    svg += `font-family="monospace" font-size="10" fill="#6b7280" text-anchor="middle">`;
    svg += `${toFraction32(widthIn)} × ${toFraction32(lengthIn)}`;
    svg += `</text>`;
  }

  // Intersection lines and dimensions
  if (isHorizontal) {
    // For horizontal pieces (Top, Bottom), intersections are vertical lines
    let prevPosition = 0;

    for (let i = 0; i <= intersections.length; i++) {
      // Draw intersection line (skip on last iteration which handles final edge dimension)
      if (i < intersections.length) {
        const intersection = intersections[i];
        const scaledPos = intersection.position * scale;
        const x = rectX + scaledPos;

        // Draw dotted line
        svg += `<line x1="${x}" y1="${rectY}" x2="${x}" y2="${rectY + scaledWidth}" `;
        svg += `stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,4"/>`;
      }

      // Dimension from previous position to current (or to end edge)
      const dimStart = rectX + prevPosition * scale;
      const dimEnd = i < intersections.length
        ? rectX + intersections[i].position * scale
        : rectX + scaledLength;
      const dimY = rectY + scaledWidth / 2;

      // Dimension line
      svg += `<line x1="${dimStart}" y1="${dimY}" x2="${dimEnd}" y2="${dimY}" `;
      svg += `stroke="#059669" stroke-width="1"/>`;

      // Dimension text
      const distance = i < intersections.length
        ? intersections[i].position - prevPosition
        : lengthIn - prevPosition;
      const dimText = toFraction32(distance);
      svg += `<text x="${(dimStart + dimEnd) / 2}" y="${dimY - 5}" `;
      svg += `font-family="monospace" font-size="9" fill="#059669" text-anchor="middle">`;
      svg += dimText;
      svg += `</text>`;

      if (i < intersections.length) {
        prevPosition = intersections[i].position;
      }
    }
  } else {
    // For vertical pieces (Sides, VerticalDividers), intersections are horizontal lines
    let prevPosition = 0;

    for (let i = 0; i <= intersections.length; i++) {
      // Draw intersection line (skip on last iteration which handles final edge dimension)
      if (i < intersections.length) {
        const intersection = intersections[i];
        const scaledPos = intersection.position * scale;
        const y = rectY + scaledPos;

        // Draw dotted line
        svg += `<line x1="${rectX}" y1="${y}" x2="${rectX + scaledLength}" y2="${y}" `;
        svg += `stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,4"/>`;
      }

      // Dimension from previous position to current (or to end edge)
      const dimStart = rectY + prevPosition * scale;
      const dimEnd = i < intersections.length
        ? rectY + intersections[i].position * scale
        : rectY + scaledWidth;
      const dimX = rectX + scaledLength / 2;

      // Dimension line
      svg += `<line x1="${dimX}" y1="${dimStart}" x2="${dimX}" y2="${dimEnd}" `;
      svg += `stroke="#059669" stroke-width="1"/>`;

      // Dimension text
      const distance = i < intersections.length
        ? intersections[i].position - prevPosition
        : lengthIn - prevPosition;
      const dimText = toFraction32(distance);
      svg += `<text x="${dimX + 5}" y="${(dimStart + dimEnd) / 2 + 3}" `;
      svg += `font-family="monospace" font-size="9" fill="#059669" text-anchor="start">`;
      svg += dimText;
      svg += `</text>`;

      if (i < intersections.length) {
        prevPosition = intersections[i].position;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Group parts by role and generate SVGs for each
 */
export function generateAllAssemblyGuideSvgs(
  parts: Part[],
  params: DesignParams
): { role: string; partId: string; svg: string }[] {
  const intersectionMap = calculateIntersections(parts, params);
  const results: { role: string; partId: string; svg: string }[] = [];

  // Filter to only frame parts
  const frameParts = parts.filter(p =>
    p.role === 'Top' || p.role === 'Bottom' || p.role === 'Side' ||
    p.role === 'VerticalDivider' || p.role === 'BayShelf'
  );

  // Find the longest part to determine base scale
  const maxDimension = Math.max(...frameParts.map(p => Math.max(p.lengthIn, p.widthIn)));
  const baseScale = 400 / maxDimension; // Target 400px for longest dimension

  for (const part of frameParts) {
    const info = intersectionMap.get(part.id);
    if (!info || (part.role === 'BayShelf' && info.intersections.length === 0)) {
      // Skip bay shelves since they don't show intersections
      continue;
    }

    const svg = generatePartAssemblySvg(info, baseScale);
    results.push({
      role: part.role,
      partId: part.id,
      svg,
    });
  }

  return results;
}
