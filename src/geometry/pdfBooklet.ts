import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Part, DesignParams } from './types';
import { generateAssemblySteps } from './svgDiagrams';
import { toFraction32, formatDimensions } from './format';
import { calculateDimensions } from './layout';

export async function generatePDFBooklet(
  parts: Part[], 
  params: DesignParams
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const dimensions = calculateDimensions(params);
  
  // Page dimensions (US Letter)
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  
  // Helper function to add a page
  const addPage = () => pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Cover Page
  const coverPage = addPage();
  let yPos = pageHeight - margin;
  
  coverPage.drawText('Modular Shelving Assembly Instructions', {
    x: margin,
    y: yPos,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 40;
  
  coverPage.drawText(`${params.rows}×${params.cols} Configuration`, {
    x: margin,
    y: yPos,
    size: 18,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 60;
  
  // Dimensions box
  const dimBoxHeight = 120;
  coverPage.drawRectangle({
    x: margin,
    y: yPos - dimBoxHeight,
    width: contentWidth,
    height: dimBoxHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  yPos -= 20;
  coverPage.drawText('Exterior Dimensions:', {
    x: margin + 10,
    y: yPos,
    size: 14,
    font: helveticaBoldFont,
  });
  
  yPos -= 25;
  const dimText = [
    `Width: ${toFraction32(dimensions.extWidth)}`,
    `Height: ${toFraction32(dimensions.extHeight)}`,
    `Depth: ${toFraction32(dimensions.extDepth)}`,
  ];
  
  for (const dim of dimText) {
    coverPage.drawText(dim, {
      x: margin + 20,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });
    yPos -= 20;
  }
  
  // Parts Inventory Page
  const inventoryPage = addPage();
  yPos = pageHeight - margin;
  
  inventoryPage.drawText('Parts Inventory', {
    x: margin,
    y: yPos,
    size: 20,
    font: helveticaBoldFont,
  });
  yPos -= 40;
  
  // Group parts by role (currently unused but may be needed for future enhancements)
  // const partsByRole = parts.reduce((acc, part) => {
  //   if (!acc[part.role]) acc[part.role] = [];
  //   acc[part.role].push(part);
  //   return acc;
  // }, {} as Record<string, Part[]>);
  
  // Table header
  inventoryPage.drawText('Part ID', { x: margin, y: yPos, size: 10, font: helveticaBoldFont });
  inventoryPage.drawText('Role', { x: margin + 80, y: yPos, size: 10, font: helveticaBoldFont });
  inventoryPage.drawText('Qty', { x: margin + 160, y: yPos, size: 10, font: helveticaBoldFont });
  inventoryPage.drawText('Dimensions', { x: margin + 200, y: yPos, size: 10, font: helveticaBoldFont });
  inventoryPage.drawText('Notes', { x: margin + 320, y: yPos, size: 10, font: helveticaBoldFont });
  
  yPos -= 15;
  inventoryPage.drawLine({
    start: { x: margin, y: yPos },
    end: { x: pageWidth - margin, y: yPos },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPos -= 10;
  
  // List all parts
  for (const part of parts) {
    if (yPos < margin + 50) {
      // Start new page if needed
      // const newPage = addPage();
      yPos = pageHeight - margin;
    }
    
    inventoryPage.drawText(part.id, { 
      x: margin, y: yPos, size: 9, font: helveticaFont 
    });
    inventoryPage.drawText(part.role, { 
      x: margin + 80, y: yPos, size: 9, font: helveticaFont 
    });
    inventoryPage.drawText(part.qty.toString(), { 
      x: margin + 160, y: yPos, size: 9, font: helveticaFont 
    });
    inventoryPage.drawText(formatDimensions(part.lengthIn, part.widthIn, part.thicknessIn), { 
      x: margin + 200, y: yPos, size: 9, font: helveticaFont 
    });
    
    if (part.notes) {
      const notes = part.notes.length > 30 ? part.notes.substring(0, 27) + '...' : part.notes;
      inventoryPage.drawText(notes, { 
        x: margin + 320, y: yPos, size: 8, font: helveticaFont, color: rgb(0.4, 0.4, 0.4)
      });
    }
    
    yPos -= 15;
  }
  
  // Assembly Steps Pages
  const assemblySteps = generateAssemblySteps(parts);
  
  for (const step of assemblySteps) {
    const stepPage = addPage();
    yPos = pageHeight - margin;
    
    // Step title
    stepPage.drawText(`Step ${step.stepNumber}: ${step.title}`, {
      x: margin,
      y: yPos,
      size: 18,
      font: helveticaBoldFont,
    });
    yPos -= 40;
    
    // Description
    stepPage.drawText(step.description, {
      x: margin,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });
    yPos -= 40;
    
    // Parts for this step
    stepPage.drawText('Parts needed:', {
      x: margin,
      y: yPos,
      size: 12,
      font: helveticaBoldFont,
    });
    yPos -= 20;
    
    for (const part of step.parts) {
      stepPage.drawText(`• ${part.id} (${part.role})`, {
        x: margin + 10,
        y: yPos,
        size: 10,
        font: helveticaFont,
      });
      yPos -= 15;
    }
    
    // Note: In a full implementation, we would embed the SVG as an image
    // For now, we'll just add a placeholder box
    yPos -= 20;
    stepPage.drawRectangle({
      x: margin,
      y: yPos - 200,
      width: contentWidth,
      height: 200,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    stepPage.drawText('[Assembly Diagram]', {
      x: margin + contentWidth/2 - 60,
      y: yPos - 100,
      size: 14,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6),
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}