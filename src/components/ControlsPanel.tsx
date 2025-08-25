import { useDesignStore } from '../state/useDesignStore';
import type { NominalThickness } from '../geometry/types';
import { createThicknessMap, THICKNESS_MAP } from '../geometry/constants';
import { toFraction32 } from '../geometry/format';

export function ControlsPanel() {
  const {
    params,
    dimensions,
    analysis,
    setInteriorClearance,
    setDepth,
    setHasBack,
    setHasDoors,
    setDoorMode,
    setDoorReveal,
    setDoorOverlay,
    setFrameThickness,
    setBackThickness,
    setDoorThickness,
    useRecommendedMaterials,
    reset,
  } = useDesignStore();

  const nominalOptions: NominalThickness[] = ['1/4"', '1/2"', '3/4"'];
  const frameOptions: NominalThickness[] = ['1/2"', '3/4"']; // No 1/4" for frame

  return (
    <div className="space-y-6 p-4 bg-white border-l border-gray-200 overflow-y-auto">
      <h2 className="text-lg font-semibold">Configuration</h2>
      
      {/* Dimensions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-700">Dimensions</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Interior Clearance (inches)
            </label>
            <input
              type="number"
              step="0.125"
              value={params.interiorClearanceInches}
              onChange={(e) => setInteriorClearance(parseFloat(e.target.value) || 13.25)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Depth (inches)
            </label>
            <input
              type="number"
              step="0.125"
              value={params.depthInches}
              onChange={(e) => setDepth(parseFloat(e.target.value) || 15.375)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Material Thicknesses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-gray-700">Materials</h3>
          <button
            onClick={useRecommendedMaterials}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Use Recommended
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Frame Material */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Frame Thickness
            </label>
            <div className="flex gap-2">
              <select
                value={params.materials.frame.nominal}
                onChange={(e) => setFrameThickness(createThicknessMap(e.target.value as NominalThickness))}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {frameOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.001"
                value={params.materials.frame.actualInches}
                onChange={(e) => setFrameThickness({
                  ...params.materials.frame,
                  actualInches: parseFloat(e.target.value) || THICKNESS_MAP[params.materials.frame.nominal]
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Back Material */}
          {params.hasBack && (
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Back Thickness
              </label>
              <div className="flex gap-2">
                <select
                  value={params.materials.back?.nominal || '1/4"'}
                  onChange={(e) => setBackThickness(createThicknessMap(e.target.value as NominalThickness))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {nominalOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  value={params.materials.back?.actualInches || THICKNESS_MAP['1/4"']}
                  onChange={(e) => setBackThickness({
                    nominal: params.materials.back?.nominal || '1/4"',
                    actualInches: parseFloat(e.target.value) || THICKNESS_MAP['1/4"']
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}

          {/* Door Material */}
          {params.hasDoors && (
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Door Thickness
              </label>
              <div className="flex gap-2">
                <select
                  value={params.materials.door?.nominal || '3/4"'}
                  onChange={(e) => setDoorThickness(createThicknessMap(e.target.value as NominalThickness))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {nominalOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  value={params.materials.door?.actualInches || THICKNESS_MAP['3/4"']}
                  onChange={(e) => setDoorThickness({
                    nominal: params.materials.door?.nominal || '3/4"',
                    actualInches: parseFloat(e.target.value) || THICKNESS_MAP['3/4"']
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back and Doors */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-700">Options</h3>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.hasBack}
              onChange={(e) => setHasBack(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Add back panel</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.hasDoors}
              onChange={(e) => setHasDoors(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Add doors</span>
          </label>
        </div>

        {/* Door Options */}
        {params.hasDoors && (
          <div className="pl-4 space-y-2 border-l-2 border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Door Style
              </label>
              <select
                value={params.doorMode.type}
                onChange={(e) => setDoorMode(e.target.value as 'inset' | 'overlay')}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="inset">Inset</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            
            {params.doorMode.type === 'inset' && (
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Reveal (inches)
                </label>
                <input
                  type="number"
                  step="0.0625"
                  value={params.doorMode.revealInches || 0.0625}
                  onChange={(e) => setDoorReveal(parseFloat(e.target.value) || 0.0625)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
            
            {params.doorMode.type === 'overlay' && (
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Overlay (inches)
                </label>
                <input
                  type="number"
                  step="0.125"
                  value={params.doorMode.overlayInches || 0.5}
                  onChange={(e) => setDoorOverlay(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exterior Dimensions */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-700">Exterior Dimensions</h3>
        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
          <div>Width: {toFraction32(dimensions.extWidth)}</div>
          <div>Height: {toFraction32(dimensions.extHeight)}</div>
          <div>Depth: {toFraction32(dimensions.extDepth)}</div>
        </div>
      </div>

      {/* Material Estimate */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-700">Material Estimate</h3>
        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
          <div>Frame: {analysis.estimate.frameBoardFeet.toFixed(1)} board feet</div>
          {analysis.estimate.hasBack && (
            <div>Back: {analysis.estimate.backSquareFeet.toFixed(1)} sq ft</div>
          )}
          {analysis.estimate.totalDoors > 0 && (
            <div>Doors: {analysis.estimate.doorSquareFeet.toFixed(1)} sq ft</div>
          )}
          <div className="text-gray-600">
            {analysis.estimate.totalFrameParts} frame parts, {analysis.estimate.totalDoors} doors
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={reset}
        className="w-full px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset to Default
      </button>
    </div>
  );
}