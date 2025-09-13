import { useEffect } from 'react';
import { Canvas3D } from '../components/Canvas3D';
import { GridEditor } from '../components/GridEditor';
import { ControlsPanel } from '../components/ControlsPanel';
import { ExportPanel } from '../components/ExportPanel';
import { useDesignStore } from '../state/useDesignStore';

export function App() {
  const store = useDesignStore();
  const { importDesign, _hasHydrated } = store;

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
    <div className="flex h-screen bg-gray-100">
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kallax Configurator</h1>
              <p className="text-sm text-gray-600">Design modular shelving with IKEA-style instructions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                Open source • MIT License
              </div>
            </div>
          </div>
        </header>
        
        {/* Main workspace */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Grid Editor */}
          <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg mb-1">Grid Layout</h2>
              <p className="text-sm text-gray-600">Design your shelf configuration</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <GridEditor />
            </div>
            {/* Export Panel at bottom of left panel */}
            <ExportPanel />
          </div>
          
          {/* Center - 3D Preview */}
          <div className="flex-1 min-w-0 relative">
            {_hasHydrated ? (
              <Canvas3D />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-sm text-gray-500">Loading configuration...</div>
                </div>
              </div>
            )}
            
            {/* Floating overlay with basic info */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg">
              <div className="font-medium mb-2">Current Design</div>
              <div className="space-y-1 text-gray-600">
                <div>Configuration: {useDesignStore.getState().params.rows}×{useDesignStore.getState().params.cols}</div>
                <div>Merges: {useDesignStore.getState().params.merges.length}</div>
                <div>Back: {useDesignStore.getState().params.hasBack ? 'Yes' : 'No'}</div>
                <div>Doors: {useDesignStore.getState().params.hasDoors ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Controls */}
      <div className="w-80 bg-white">
        <ControlsPanel />
      </div>
    </div>
  );
}