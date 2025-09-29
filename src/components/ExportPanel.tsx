import { useState } from 'react';
import Papa from 'papaparse';
import { useDesignStore } from '../state/useDesignStore';
import { generatePDFBooklet } from '../geometry/pdfBooklet';
import { formatDimensions } from '../geometry/format';
import { downloadJSON, downloadCSV, downloadPDF } from '../lib/download';

export function ExportPanel() {
  const { params, analysis } = useDesignStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleExportJSON = () => {
    const exportData = {
      design: params,
      parts: analysis.parts,
      estimate: analysis.estimate,
      warnings: analysis.warnings,
    };
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJSON(exportData, `kallax-design-${timestamp}.json`);
  };
  
  const handleExportCSV = () => {
    const csvData = analysis.parts.map(part => ({
      'Part ID': part.id,
      'Role': part.role,
      'Quantity': part.qty,
      'Length (in)': part.lengthIn.toFixed(4),
      'Width (in)': part.widthIn.toFixed(4),
      'Thickness (in)': part.thicknessIn.toFixed(4),
      'Dimensions': formatDimensions(part.lengthIn, part.widthIn, part.thicknessIn),
      'Notes': part.notes || '',
    }));
    
    const csv = Papa.unparse(csvData);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `kallax-cut-list-${timestamp}.csv`);
  };
  
  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generatePDFBooklet(analysis.parts, params);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(pdfBytes, `kallax-instructions-${timestamp}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleShareLink = () => {
    const compressed = btoa(JSON.stringify(params));
    const shareUrl = `${window.location.origin}${window.location.pathname}?design=${compressed}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Kallax Configurator Design',
        text: 'Check out my modular shelving design!',
        url: shareUrl,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        prompt('Copy this link to share your design:', shareUrl);
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExportCSV}
          className="btn btn-success btn-sm"
        >
          Cut List (CSV)
        </button>

        <button
          onClick={handleExportJSON}
          className="btn btn-info btn-sm"
        >
          Design (JSON)
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="btn btn-danger btn-sm col-span-2"
        >
          {isGenerating ? 'Generating PDF...' : 'Instructions (PDF)'}
        </button>

        <button
          onClick={handleShareLink}
          className="btn btn-accent btn-sm col-span-2"
        >
          Share Design Link
        </button>
      </div>

      <div className="divider" />

      {/* Summary Info */}
      <div className="info-box">
        <div className="info-row">
          <span className="info-label">Total Parts:</span>
          <span className="info-value">{analysis.parts.length}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Frame Parts:</span>
          <span className="info-value">{analysis.estimate.totalFrameParts}</span>
        </div>
        {analysis.estimate.totalDoors > 0 && (
          <div className="info-row">
            <span className="info-label">Doors:</span>
            <span className="info-value">{analysis.estimate.totalDoors}</span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Warnings:</span>
          <span className={`info-value ${analysis.warnings.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {analysis.warnings.length}
          </span>
        </div>
      </div>

      <div className="divider" />

      {/* File format info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div><strong>CSV:</strong> Cut list with dimensions for fabrication</div>
        <div><strong>JSON:</strong> Complete design data for backup/import</div>
        <div><strong>PDF:</strong> IKEA-style assembly instructions</div>
      </div>
    </div>
  );
}