import { useEffect, useState } from 'react';
import { Canvas3D } from '../components/Canvas3D';
import { GridEditor } from '../components/GridEditor';
import { ControlsPanel } from '../components/ControlsPanel';
import { OptionsPanel } from '../components/OptionsPanel';
import { ExportPanel } from '../components/ExportPanel';
import { KeyPanel } from '../components/KeyPanel';
import { FloatingWindow } from '../components/FloatingWindow';
import { AboutModal } from '../components/AboutModal';
import { useDesignStore } from '../state/useDesignStore';

export function App() {
  const store = useDesignStore();
  const { importDesign, _hasHydrated, params, setUnitSystem } = store;
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [showMetricTooltip, setShowMetricTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Handle first-time users and ensure hydration is complete
  useEffect(() => {
    // Set a timeout to handle cases where onRehydrateStorage never fires
    // (happens when there's no persisted data for new users)
    const timeout = setTimeout(() => {
      if (!useDesignStore.getState()._hasHydrated) {
        useDesignStore.setState({ _hasHydrated: true });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  // Handle URL-based design sharing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const designData = urlParams.get('design');
    
    if (designData) {
      try {
        const decodedData = atob(designData);
        importDesign(decodedData);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to load design from URL:', error);
      }
    }
  }, [importDesign]);



  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0" style={{ backgroundColor: '#fafafa', height: '3.5rem', display: 'flex', alignItems: 'center', paddingLeft: '1.0rem', paddingRight: '1.0rem', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-lg font-mono font-semibold text-black">Kallax Configurator</h1>
          </div>

          {/* Unit System Toggle - Centered */}
          <div className="unit-toggle-container">
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`btn btn-sm ${params.unitSystem === 'imperial' ? 'btn-info' : 'btn-secondary'}`}
            >
              Imperial
            </button>
            <button
              onClick={() => setUnitSystem('metric')}
              className={`btn btn-sm ${params.unitSystem === 'metric' ? 'btn-info' : 'btn-secondary'}`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPosition({ x: rect.left, y: rect.bottom + 8 });
                setShowMetricTooltip(true);
              }}
              onMouseLeave={() => setShowMetricTooltip(false)}
            >
              ⚠️ Metric
            </button>
          </div>

          {/* Metric Tooltip */}
          {showMetricTooltip && (
            <div
              className="hover-card"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                maxWidth: '300px',
              }}
            >
              <div className="text-xs text-gray-800">
                <strong>Note:</strong> I have not personally built a shelving unit with metric sheet goods. Exercise caution, and please let me know if you run into errors.
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-gray-400">•</span>
            <a
              onClick={(e) => {
                e.preventDefault();
                setIsAboutOpen(true);
              }}
              href="#about"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors flex items-center gap-1"
              style={{ cursor: 'pointer' }}
            >
              About
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="https://github.com/adamvosburgh/kallax-configurator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors flex items-center gap-1"
            >
              GitHub
              <span style={{ fontSize: '10px' }}>↗</span>
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="https://adamvosburgh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors flex items-center gap-1"
            >
              Website
              <span style={{ fontSize: '10px' }}>↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main 3D View - Full screen background */}
      <div className="flex-1 relative bg-white min-h-0">
        {_hasHydrated ? (
          <Canvas3D />
        ) : (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <div className="text-sm font-mono text-gray-500">Loading configuration...</div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Single container with all panels */}
      <div className="docked-container mobile-all-panels" style={{ display: 'none' }}>
        <FloatingWindow
          id="grid-layout"
          title="Grid"
          defaultPosition={{ x: 50, y: 120 }}
          defaultSize={{ width: 300, height: 800 }}
          collapsedPreview={`${params.rows}×${params.cols} • ${params.merges.length} merges`}
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 0 }}
        >
          <GridEditor />
        </FloatingWindow>

        <FloatingWindow
          id="key"
          title="Key"
          defaultPosition={{ x: 1070, y: 120 }}
          defaultSize={{ width: 280, height: 450 }}
          collapsedPreview="3D Parts Legend"
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 2 }}
        >
          <KeyPanel />
        </FloatingWindow>

        <FloatingWindow
          id="options"
          title="Options"
          defaultPosition={{ x: 570, y: 300 }}
          defaultSize={{ width: 400, height: 600 }}
          collapsedPreview={params.hasDoors ? 'Doors enabled' : 'Basic config'}
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 1 }}
        >
          <OptionsPanel />
        </FloatingWindow>

        <FloatingWindow
          id="controls"
          title="Controls"
          defaultPosition={{ x: 570, y: 120 }}
          defaultSize={{ width: 450, height: 850 }}
          collapsedPreview="Materials & Dimensions"
          defaultDocked={true}
          dockedPosition={{ side: 'right', order: 0 }}
        >
          <ControlsPanel />
        </FloatingWindow>

        <FloatingWindow
          id="export"
          title="Export"
          defaultPosition={{ x: 50, y: 500 }}
          defaultSize={{ width: 400, height: 350 }}
          collapsedPreview="PDF Export"
          defaultDocked={true}
          dockedPosition={{ side: 'right', order: 1 }}
        >
          <ExportPanel />
        </FloatingWindow>
      </div>

      {/* Desktop: Left Docked Panel */}
      <div className="docked-container left desktop-only">
        <FloatingWindow
          id="grid-layout-desktop"
          title="Grid Layout"
          defaultPosition={{ x: 50, y: 120 }}
          defaultSize={{ width: 500, height: 800 }}
          collapsedPreview={`${params.rows}×${params.cols} • ${params.merges.length} merges`}
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 0 }}
        >
          <GridEditor />
        </FloatingWindow>

        <FloatingWindow
          id="key-desktop"
          title="Key"
          defaultPosition={{ x: 1070, y: 120 }}
          defaultSize={{ width: 280, height: 450 }}
          collapsedPreview="3D Parts Legend"
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 2 }}
        >
          <KeyPanel />
        </FloatingWindow>

        <FloatingWindow
          id="options-desktop"
          title="Options"
          defaultPosition={{ x: 570, y: 300 }}
          defaultSize={{ width: 420, height: 600 }}
          collapsedPreview={params.hasDoors ? 'Doors enabled' : 'Basic config'}
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 1 }}
        >
          <OptionsPanel />
        </FloatingWindow>
      </div>

      {/* Desktop: Right Docked Panel */}
      <div className="docked-container right desktop-only">
        <FloatingWindow
          id="controls-desktop"
          title="Controls"
          defaultPosition={{ x: 570, y: 120 }}
          defaultSize={{ width: 480, height: 850 }}
          collapsedPreview="Materials & Dimensions"
          defaultDocked={true}
          dockedPosition={{ side: 'right', order: 0 }}
        >
          <ControlsPanel />
        </FloatingWindow>

        <FloatingWindow
          id="export-desktop"
          title="Export"
          defaultPosition={{ x: 50, y: 500 }}
          defaultSize={{ width: 420, height: 350 }}
          collapsedPreview="PDF Export"
          defaultDocked={true}
          dockedPosition={{ side: 'right', order: 1 }}
        >
          <ExportPanel />
        </FloatingWindow>
      </div>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}