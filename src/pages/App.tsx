import { useEffect } from 'react';
import { Canvas3D } from '../components/Canvas3D';
import { GridEditor } from '../components/GridEditor';
import { ControlsPanel } from '../components/ControlsPanel';
import { ExportPanel } from '../components/ExportPanel';
import { FloatingWindow } from '../components/FloatingWindow';
import { useDesignStore } from '../state/useDesignStore';
import { useFloatingWindowStore } from '../state/useFloatingWindowStore';

export function App() {
  const store = useDesignStore();
  const { importDesign, _hasHydrated, params } = store;
  const { showWindow } = useFloatingWindowStore();

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
            {/* <p className="text-xs font-mono text-gray-600 mt-0.5">Design modular shelving with IKEA-style instructions</p> */}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/adamvosburgh/kallax-configurator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors"
            >
              GitHub
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="mailto:your.email@example.com"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors"
            >
              Email
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="https://yourwebsite.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-600 hover:text-black transition-colors"
            >
              Website
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

      {/* Left Docked Panel */}
      <div className="docked-container left">
        <FloatingWindow
          id="grid-layout"
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
          id="key"
          title="Parts Key"
          defaultPosition={{ x: 1070, y: 120 }}
          defaultSize={{ width: 280, height: 450 }}
          collapsedPreview="3D Parts Legend"
          defaultDocked={true}
          dockedPosition={{ side: 'left', order: 1 }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="color-swatch swatch-top-bottom"></div>
              <span className="text-xs text-mono">Top/Bottom</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="color-swatch swatch-sides"></div>
              <span className="text-xs text-mono">Sides</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="color-swatch swatch-sides"></div>
              <span className="text-xs text-mono">Vertical Dividers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="color-swatch swatch-doors"></div>
              <span className="text-xs text-mono">Doors</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="color-swatch swatch-back"></div>
              <span className="text-xs text-mono">Back Panels</span>
            </div>
          </div>
        </FloatingWindow>
      </div>

      {/* Right Docked Panel */}
      <div className="docked-container right">
        <FloatingWindow
          id="controls"
          title="Controls"
          defaultPosition={{ x: 570, y: 120 }}
          defaultSize={{ width: 480, height: 850 }}
          collapsedPreview={params.hasBack ? 'with back' : 'no back'}
          defaultDocked={true}
          dockedPosition={{ side: 'right', order: 0 }}
        >
          <ControlsPanel />
        </FloatingWindow>

        <FloatingWindow
          id="export"
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
    </div>
  );
}