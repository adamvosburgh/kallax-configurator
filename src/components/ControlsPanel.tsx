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