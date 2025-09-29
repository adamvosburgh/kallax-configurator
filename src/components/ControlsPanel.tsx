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
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="space-y-3">
        <h3 className="section-title">Dimensions</h3>
        <div className="space-y-3">
          <div className="field-group">
            <label className="form-label">
              Interior Clearance (inches)
            </label>
            <input
              type="number"
              step="0.125"
              value={params.interiorClearanceInches}
              onChange={(e) => setInteriorClearance(parseFloat(e.target.value) || 13.25)}
              className="input-field"
            />
          </div>
          <div className="field-group">
            <label className="form-label">
              Depth (inches)
            </label>
            <input
              type="number"
              step="0.125"
              value={params.depthInches}
              onChange={(e) => setDepth(parseFloat(e.target.value) || 15.375)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Material Thicknesses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Materials</h3>
          <button
            onClick={useRecommendedMaterials}
            className="btn btn-info btn-xs"
          >
            Use Recommended
          </button>
        </div>

        <div className="space-y-3">
          {/* Frame Material */}
          <div className="field-group">
            <label className="form-label">
              Frame Thickness
            </label>
            <div className="field-row-split">
              <select
                value={params.materials.frame.nominal}
                onChange={(e) => setFrameThickness(createThicknessMap(e.target.value as NominalThickness))}
                className="select-field"
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
                className="input-field"
                style={{ maxWidth: '5rem' }}
              />
            </div>
          </div>

          {/* Back Material */}
          {params.hasBack && (
            <div className="field-group">
              <label className="form-label">
                Back Thickness
              </label>
              <div className="field-row-split">
                <select
                  value={params.materials.back?.nominal || '1/4"'}
                  onChange={(e) => setBackThickness(createThicknessMap(e.target.value as NominalThickness))}
                  className="select-field"
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
                  className="input-field"
                  style={{ maxWidth: '5rem' }}
                />
              </div>
            </div>
          )}

          {/* Door Material */}
          {params.hasDoors && (
            <div className="field-group">
              <label className="form-label">
                Door Thickness
              </label>
              <div className="field-row-split">
                <select
                  value={params.materials.door?.nominal || '3/4"'}
                  onChange={(e) => setDoorThickness(createThicknessMap(e.target.value as NominalThickness))}
                  className="select-field"
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
                  className="input-field"
                  style={{ maxWidth: '5rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Back and Doors */}
      <div className="space-y-3">
        <h3 className="section-title">Options</h3>

        <div className="space-y-2">
          <label className="field-row" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.hasBack}
              onChange={(e) => setHasBack(e.target.checked)}
              className="checkbox-field"
            />
            <span className="text-sm">Add back panel</span>
          </label>

          <label className="field-row" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.hasDoors}
              onChange={(e) => setHasDoors(e.target.checked)}
              className="checkbox-field"
            />
            <span className="text-sm">Add doors</span>
          </label>
        </div>

        {/* Door Options */}
        {params.hasDoors && (
          <div className="pl-4 space-y-3 border-l-2 border-gray-200">
            <div className="field-group">
              <label className="form-label">
                Door Style
              </label>
              <select
                value={params.doorMode.type}
                onChange={(e) => setDoorMode(e.target.value as 'inset' | 'overlay')}
                className="select-field"
              >
                <option value="inset">Inset</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>

            {params.doorMode.type === 'inset' && (
              <div className="field-group">
                <label className="form-label">
                  Reveal (inches)
                </label>
                <input
                  type="number"
                  step="0.0625"
                  value={params.doorMode.revealInches || 0.0625}
                  onChange={(e) => setDoorReveal(parseFloat(e.target.value) || 0.0625)}
                  className="input-field"
                />
              </div>
            )}

            {params.doorMode.type === 'overlay' && (
              <div className="field-group">
                <label className="form-label">
                  Overlay (inches)
                </label>
                <input
                  type="number"
                  step="0.125"
                  value={params.doorMode.overlayInches || 0.25}
                  onChange={(e) => setDoorOverlay(parseFloat(e.target.value) || 0.25)}
                  className="input-field"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Exterior Dimensions */}
      <div className="space-y-2">
        <h3 className="section-title">Exterior Dimensions</h3>
        <div className="info-box space-y-1">
          <div className="info-row">
            <span className="info-label">Width:</span>
            <span className="info-value">{toFraction32(dimensions.extWidth)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Height:</span>
            <span className="info-value">{toFraction32(dimensions.extHeight)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Depth:</span>
            <span className="info-value">{toFraction32(dimensions.extDepth)}</span>
          </div>
        </div>
      </div>

      {/* Material Estimate */}
      <div className="space-y-2">
        <h3 className="section-title">Material Estimate</h3>
        <div className="info-box space-y-1">
          <div className="info-row">
            <span className="info-label">Frame:</span>
            <span className="info-value">{analysis.estimate.frameBoardFeet.toFixed(1)} bd ft</span>
          </div>
          {analysis.estimate.hasBack && (
            <div className="info-row">
              <span className="info-label">Back:</span>
              <span className="info-value">{analysis.estimate.backSquareFeet.toFixed(1)} sq ft</span>
            </div>
          )}
          {analysis.estimate.totalDoors > 0 && (
            <div className="info-row">
              <span className="info-label">Doors:</span>
              <span className="info-value">{analysis.estimate.doorSquareFeet.toFixed(1)} sq ft</span>
            </div>
          )}
          <div className="divider" style={{ margin: '0.5rem 0' }} />
          <div className="text-xs text-gray-600">
            {analysis.estimate.totalFrameParts} frame parts, {analysis.estimate.totalDoors} doors
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Reset Button */}
      <button
        onClick={reset}
        className="btn btn-neutral w-full"
      >
        Reset to Default
      </button>
    </div>
  );
}