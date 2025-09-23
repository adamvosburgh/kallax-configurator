import { useState, useEffect } from 'react';
import { generateParts } from '../geometry/parts';
import { generatePDFBooklet } from '../geometry/pdfBooklet';
import type { DesignParams } from '../geometry/types';

// Test configuration: 3x3, doors and back, frame and doors 3/4", back 1/4"
const TEST_CONFIG: DesignParams = {
  rows: 6,
  cols: 6,
  merges: [], // No merges for simple test
  interiorClearanceInches: 13.25,
  depthInches: 15.375,
  hasBack: true,
  hasDoors: true,
  doorMode: { type: 'inset' },
  materials: {
    frame: { nominal: '3/4"', actualInches: 0.75 },
    back: { nominal: '1/4"', actualInches: 0.25 },
    door: { nominal: '3/4"', actualInches: 0.75 },
  },
};

export function PDFPreview() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate parts from test configuration
      const parts = generateParts(TEST_CONFIG);
      
      // Generate PDF
      const pdfBytes = await generatePDFBooklet(parts, TEST_CONFIG, 'Test Modular Shelving Unit');
      
      // Create blob URL for display
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount
  useEffect(() => {
    generatePDF();
    
    // Cleanup on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={navigateBack}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                ← Back to App
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PDF Preview - Live Development</h1>
                <p className="text-gray-600 mt-1">
                  Test Configuration: 3×3 grid, doors + back, 3/4" frame/doors, 1/4" back
                </p>
              </div>
            </div>
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Regenerate PDF'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generating PDF...</span>
            </div>
          )}

          {pdfUrl && !isGenerating && (
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={`${pdfUrl}#view=FitH`}
                width="100%"
                height="800"
                style={{ border: 'none' }}
                title="PDF Preview"
              />
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Development Notes:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This page automatically generates a PDF with the test configuration</li>
              <li>• Click "Regenerate PDF" after making changes to the PDF generation code</li>
              <li>• The PDF will update in real-time without page refresh</li>
              <li>• Remember to remove this route before production deployment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}