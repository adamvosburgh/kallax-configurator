import type { Part } from './types';

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  description: string;
  parts: Part[];
  svg: string;
}

/**
 * Generate exploded SVG diagram for an assembly step
 */
function generateStepSVG(parts: Part[], title: string): string {
  const width = 400;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Scale factor to fit parts in view
  const scale = 2;
  
  let svgElements = '';
  let partIndex = 0;
  
  for (const part of parts) {
    // Position parts in an exploded view
    const offsetX = (partIndex % 3 - 1) * 60;
    const offsetY = Math.floor(partIndex / 3) * 50 - 25;
    
    const rectWidth = Math.max(part.lengthIn * scale, 20);
    const rectHeight = Math.max(part.widthIn * scale, 10);
    
    const x = centerX + offsetX - rectWidth / 2;
    const y = centerY + offsetY - rectHeight / 2;
    
    // Color based on part role
    const color = getPartColor(part.role);
    
    svgElements += `
      <rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" 
            fill="${color}" stroke="#333" stroke-width="1" opacity="0.8"/>
      <text x="${x + rectWidth/2}" y="${y + rectHeight/2}" 
            text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial" font-size="10" fill="#333">
        ${part.id}
      </text>
    `;
    
    partIndex++;
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="${centerX}" y="20" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#333">
        ${title}
      </text>
      ${svgElements}
    </svg>
  `;
}

function getPartColor(role: string): string {
  switch (role) {
    case 'Top':
    case 'Bottom':
      return '#8b5cf6';
    case 'Side':
    case 'VerticalDivider':
      return '#f59e0b';
    case 'BayShelf':
      return '#ef4444';
    case 'Back':
      return '#6b7280';
    case 'Door':
      return '#06b6d4';
    default:
      return '#9ca3af';
  }
}

/**
 * Generate assembly steps with SVG diagrams
 */
export function generateAssemblySteps(parts: Part[]): AssemblyStep[] {
  const steps: AssemblyStep[] = [];
  
  // Step 1: Bottom and Sides
  const bottomAndSides = parts.filter(p => 
    p.role === 'Bottom' || p.role === 'Side'
  );
  if (bottomAndSides.length > 0) {
    steps.push({
      stepNumber: 1,
      title: 'Attach Sides to Bottom',
      description: 'Connect the left and right side pieces to the bottom piece using wood screws.',
      parts: bottomAndSides,
      svg: generateStepSVG(bottomAndSides, 'Step 1: Bottom + Sides'),
    });
  }
  
  // Step 2: Vertical Dividers
  const verticals = parts.filter(p => p.role === 'VerticalDivider');
  if (verticals.length > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Install Vertical Dividers',
      description: 'Attach interior vertical dividers between the bottom and where the top will go.',
      parts: verticals,
      svg: generateStepSVG(verticals, 'Step 2: Vertical Dividers'),
    });
  }
  
  // Step 3: Top
  const top = parts.filter(p => p.role === 'Top');
  if (top.length > 0) {
    steps.push({
      stepNumber: 3,
      title: 'Attach Top',
      description: 'Secure the top piece to complete the main frame structure.',
      parts: top,
      svg: generateStepSVG(top, 'Step 3: Top'),
    });
  }
  
  // Step 4: Interior Shelves
  const shelves = parts.filter(p => p.role === 'BayShelf');
  if (shelves.length > 0) {
    steps.push({
      stepNumber: 4,
      title: 'Install Interior Shelves',
      description: 'Add horizontal shelf segments between vertical dividers.',
      parts: shelves,
      svg: generateStepSVG(shelves, 'Step 4: Interior Shelves'),
    });
  }
  
  // Step 5: Back Panel
  const back = parts.filter(p => p.role === 'Back');
  if (back.length > 0) {
    steps.push({
      stepNumber: 5,
      title: 'Attach Back Panel',
      description: 'Mount the back panel to the rear of the assembled frame.',
      parts: back,
      svg: generateStepSVG(back, 'Step 5: Back Panel'),
    });
  }
  
  // Step 6: Doors
  const doors = parts.filter(p => p.role === 'Door');
  if (doors.length > 0) {
    steps.push({
      stepNumber: 6,
      title: 'Install Doors',
      description: 'Mount doors with hinges to the appropriate openings.',
      parts: doors,
      svg: generateStepSVG(doors, 'Step 6: Doors'),
    });
  }
  
  return steps;
}