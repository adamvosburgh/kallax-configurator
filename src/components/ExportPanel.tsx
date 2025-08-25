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
    <div className="space-y-4 p-4 bg-white border-t border-gray-200">
      <h3 className="font-medium text-sm text-gray-700">Export & Share</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Cut List (CSV)
        </button>
        
        <button
          onClick={handleExportJSON}
          className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Design (JSON)
        </button>
        
        <button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="col-span-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating PDF...' : 'Instructions (PDF)'}
        </button>
        
        <button
          onClick={handleShareLink}
          className="col-span-2 px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Share Design Link
        </button>
      </div>
      
      {/* Summary Info */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Total Parts:</span>
          <span>{analysis.parts.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Frame Parts:</span>
          <span>{analysis.estimate.totalFrameParts}</span>
        </div>
        {analysis.estimate.totalDoors > 0 && (
          <div className="flex justify-between">
            <span>Doors:</span>
            <span>{analysis.estimate.totalDoors}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Warnings:</span>
          <span className={analysis.warnings.length > 0 ? 'text-yellow-600' : 'text-green-600'}>
            {analysis.warnings.length}
          </span>
        </div>
      </div>
      
      {/* File format info */}
      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
        <div><strong>CSV:</strong> Cut list with dimensions for fabrication</div>
        <div><strong>JSON:</strong> Complete design data for backup/import</div>
        <div><strong>PDF:</strong> IKEA-style assembly instructions</div>
      </div>
    </div>
  );
}