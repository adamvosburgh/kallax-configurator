import { useState, useEffect } from 'react';
import { useDesignStore } from '../state/useDesignStore';
import type { NominalThickness } from '../geometry/types';
import { createThicknessMap, THICKNESS_MAP, createMetricThickness } from '../geometry/constants';
import { formatDimension } from '../geometry/format';
import { useMobileAwarePosition } from '../lib/useMobileAwarePosition';
import { isImperialMaterial, isMetricMaterial } from '../geometry/types';

// Info text for tooltips
const INFO_TEXT = {
  interiorClearance: 'The Kallax module is roughly 13.25" wide and high. This likely does not need to be adjusted, as all Kallax inserts are slightly smaller than this, but if you plan on adding doors you may want to make the module larger depending on the hinges you choose.',
  depth: 'The Kallax module is 15.375" deep. You may want to consider increasing this if you plan to add inset doors.',
  frameThickness: '3/4" plywood is reommended for the frame for strength and stability, but 1/2" can be used for a lighter weight option, without merges and without heavily loaded shelves.',
  backThickness: '1/4" plywood is sufficient to add rigidity to the back.',
  doorThickness: '3/4" plywood is recommended for doors, because that is the standard depth required for euro-hinges. Structurally, 3/4" is overkill. The best solution would be a 1/2" door with another 1/4" frame glued to the back to bring it up to 3/4".',
};

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

  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [infoPosition, setInfoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile-aware positioning for info tooltip
  const { adjustedPosition: adjustedInfoPos, isMobile: isInfoMobile } = useMobileAwarePosition(infoPosition, {
    cardWidth: 300,
    cardHeight: 100,
    mobileTopOffset: 140
  });

  // Local state for input fields to allow empty strings
  const [interiorClearanceInput, setInteriorClearanceInput] = useState(String(params.interiorClearance));
  const [depthInput, setDepthInput] = useState(String(params.depth));

  const nominalOptions: NominalThickness[] = ['1/4"', '1/2"', '3/4"'];
  const frameOptions: NominalThickness[] = ['1/2"', '3/4"']; // No 1/4" for frame

  // Sync local state when params change (e.g., unit system switch)
  useEffect(() => {
    setInteriorClearanceInput(String(params.interiorClearance));
    setDepthInput(String(params.depth));
  }, [params.interiorClearance, params.depth]);

  // Listen for reset events to update local input state
  useEffect(() => {
    const handleReset = () => {
      setInteriorClearanceInput(String(params.interiorClearance));
      setDepthInput(String(params.depth));
    };
    window.addEventListener('design-reset', handleReset);
    return () => window.removeEventListener('design-reset', handleReset);
  }, [params.interiorClearance, params.depth]);

  const handleInfoHover = (text: string, event: React.MouseEvent) => {
    setHoveredInfo(text);

    // Check if tooltip would overflow on the right side
    const TOOLTIP_WIDTH = 300; // Approximate tooltip width
    const OFFSET = 15;
    const windowWidth = window.innerWidth;
    const mouseX = event.clientX;

    // If tooltip would overflow, position it to the left of the cursor
    const x = mouseX + TOOLTIP_WIDTH + OFFSET > windowWidth
      ? mouseX - TOOLTIP_WIDTH - OFFSET
      : mouseX + OFFSET;

    setInfoPosition({ x, y: event.clientY + OFFSET });
  };

  const handleInfoLeave = () => {
    setHoveredInfo(null);
  };

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="space-y-3">
        <h1 className="section-title">Dimensions</h1>
        <div className="space-y-3">
          <div className="field-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {params.unitSystem === 'metric' ? 'Interior Clearance (mm)' : 'Interior Clearance (inches)'}
              <span
                className="cursor-help"
                style={{ fontSize: '14px' }}
                onMouseEnter={(e) => handleInfoHover(INFO_TEXT.interiorClearance, e)}
                onMouseLeave={handleInfoLeave}
                title="Click for info"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              step={params.unitSystem === 'metric' ? '1' : '0.125'}
              value={interiorClearanceInput}
              onChange={(e) => {
                setInteriorClearanceInput(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  setInteriorClearance(val);
                }
              }}
              onBlur={() => {
                const val = parseFloat(interiorClearanceInput);
                const defaultValue = params.unitSystem === 'metric' ? 335 : 13.25;
                if (isNaN(val) || val <= 0 || interiorClearanceInput === '') {
                  setInteriorClearance(defaultValue);
                  setInteriorClearanceInput(String(defaultValue));
                }
              }}
              className="input-field"
            />
          </div>
          <div className="field-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {params.unitSystem === 'metric' ? 'Depth (mm)' : 'Depth (inches)'}
              <span
                className="cursor-help"
                style={{ fontSize: '14px' }}
                onMouseEnter={(e) => handleInfoHover(INFO_TEXT.depth, e)}
                onMouseLeave={handleInfoLeave}
                title="Click for info"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              step={params.unitSystem === 'metric' ? '1' : '0.125'}
              value={depthInput}
              onChange={(e) => {
                setDepthInput(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  setDepth(val);
                }
              }}
              onBlur={() => {
                const val = parseFloat(depthInput);
                const defaultValue = params.unitSystem === 'metric' ? 390 : 15.375;
                if (isNaN(val) || val <= 0 || depthInput === '') {
                  setDepth(defaultValue);
                  setDepthInput(String(defaultValue));
                }
              }}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Material Thicknesses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="section-title">Materials</h1>
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
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {params.unitSystem === 'metric' ? 'Frame Thickness (mm)' : 'Frame Thickness (nominal / actual)'}
              <span
                className="cursor-help"
                style={{ fontSize: '14px' }}
                onMouseEnter={(e) => handleInfoHover(INFO_TEXT.frameThickness, e)}
                onMouseLeave={handleInfoLeave}
                title="Click for info"
              >
                ℹ️
              </span>
            </label>
            {params.unitSystem === 'metric' ? (
              <input
                type="number"
                step="1"
                value={isMetricMaterial(params.materials.frame) ? params.materials.frame.thicknessMm : 18}
                onChange={(e) => setFrameThickness(createMetricThickness(parseFloat(e.target.value) || 18))}
                className="input-field"
              />
            ) : (
              <div className="field-row-split">
                <select
                  value={isImperialMaterial(params.materials.frame) ? params.materials.frame.nominal : '3/4"'}
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
                  value={isImperialMaterial(params.materials.frame) ? params.materials.frame.actualInches : 0.75}
                  onChange={(e) => {
                    if (isImperialMaterial(params.materials.frame)) {
                      setFrameThickness({
                        ...params.materials.frame,
                        actualInches: parseFloat(e.target.value) || THICKNESS_MAP[params.materials.frame.nominal]
                      });
                    }
                  }}
                  className="input-field"
                  style={{ maxWidth: '5rem' }}
                />
              </div>
            )}
          </div>

          {/* Back Material */}
          {params.hasBack && (
            <div className="field-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {params.unitSystem === 'metric' ? 'Back Thickness (mm)' : 'Back Thickness (nominal / actual)'}
                <span
                  className="cursor-help"
                  style={{ fontSize: '14px' }}
                  onMouseEnter={(e) => handleInfoHover(INFO_TEXT.backThickness, e)}
                  onMouseLeave={handleInfoLeave}
                  title="Click for info"
                >
                  ℹ️
                </span>
              </label>
              {params.unitSystem === 'metric' ? (
                <input
                  type="number"
                  step="1"
                  value={params.materials.back && isMetricMaterial(params.materials.back) ? params.materials.back.thicknessMm : 6}
                  onChange={(e) => setBackThickness(createMetricThickness(parseFloat(e.target.value) || 6))}
                  className="input-field"
                />
              ) : (
                <div className="field-row-split">
                  <select
                    value={params.materials.back && isImperialMaterial(params.materials.back) ? params.materials.back.nominal : '1/4"'}
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
                    value={params.materials.back && isImperialMaterial(params.materials.back) ? params.materials.back.actualInches : THICKNESS_MAP['1/4"']}
                    onChange={(e) => {
                      if (params.materials.back && isImperialMaterial(params.materials.back)) {
                        setBackThickness({
                          nominal: params.materials.back.nominal,
                          actualInches: parseFloat(e.target.value) || THICKNESS_MAP['1/4"']
                        });
                      }
                    }}
                    className="input-field"
                    style={{ maxWidth: '5rem' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Door Material */}
          {params.hasDoors && (
            <div className="field-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {params.unitSystem === 'metric' ? 'Door Thickness (mm)' : 'Door Thickness (nominal / actual)'}
                <span
                  className="cursor-help"
                  style={{ fontSize: '14px' }}
                  onMouseEnter={(e) => handleInfoHover(INFO_TEXT.doorThickness, e)}
                  onMouseLeave={handleInfoLeave}
                  title="Click for info"
                >
                  ℹ️
                </span>
              </label>
              {params.unitSystem === 'metric' ? (
                <input
                  type="number"
                  step="1"
                  value={params.materials.door && isMetricMaterial(params.materials.door) ? params.materials.door.thicknessMm : 18}
                  onChange={(e) => setDoorThickness(createMetricThickness(parseFloat(e.target.value) || 18))}
                  className="input-field"
                />
              ) : (
                <div className="field-row-split">
                  <select
                    value={params.materials.door && isImperialMaterial(params.materials.door) ? params.materials.door.nominal : '3/4"'}
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
                    value={params.materials.door && isImperialMaterial(params.materials.door) ? params.materials.door.actualInches : THICKNESS_MAP['3/4"']}
                    onChange={(e) => {
                      if (params.materials.door && isImperialMaterial(params.materials.door)) {
                        setDoorThickness({
                          nominal: params.materials.door.nominal,
                          actualInches: parseFloat(e.target.value) || THICKNESS_MAP['3/4"']
                        });
                      }
                    }}
                    className="input-field"
                    style={{ maxWidth: '5rem' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Exterior Dimensions */}
      <div className="space-y-2">
        <h1 className="section-title">Exterior Dimensions</h1>
        <div className="info-box space-y-1">
          <div className="info-row">
            <span className="info-label">Width:</span>
            <span className="info-value">{formatDimension(dimensions.extWidth, params.unitSystem)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Height:</span>
            <span className="info-value">{formatDimension(dimensions.extHeight, params.unitSystem)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Depth:</span>
            <span className="info-value">{formatDimension(dimensions.extDepth, params.unitSystem)}</span>
          </div>
        </div>
      </div>

      {/* Material Estimate */}
      <div className="space-y-2">
        <h1 className="section-title">Material Estimate</h1>
        <div className="info-box space-y-1">
          <div className="info-row">
            <span className="info-label">Frame:</span>
            <span className="info-value">
              {params.unitSystem === 'metric'
                ? `${(analysis.estimate.frameBoardFeet * 0.002359737).toFixed(3)} m³`
                : `${analysis.estimate.frameBoardFeet.toFixed(1)} bd ft`}
            </span>
          </div>
          {analysis.estimate.hasBack && (
            <div className="info-row">
              <span className="info-label">Back:</span>
              <span className="info-value">
                {params.unitSystem === 'metric'
                  ? `${(analysis.estimate.backSquareFeet * 0.09290304).toFixed(2)} m²`
                  : `${analysis.estimate.backSquareFeet.toFixed(1)} sq ft`}
              </span>
            </div>
          )}
          {analysis.estimate.totalDoors > 0 && (
            <div className="info-row">
              <span className="info-label">Doors:</span>
              <span className="info-value">
                {params.unitSystem === 'metric'
                  ? `${(analysis.estimate.doorSquareFeet * 0.09290304).toFixed(2)} m²`
                  : `${analysis.estimate.doorSquareFeet.toFixed(1)} sq ft`}
              </span>
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

      {/* Info hover tooltip */}
      {hoveredInfo && (
        <div
          className={`hover-card ${isInfoMobile ? 'hover-card-mobile' : ''}`}
          style={{
            position: 'fixed',
            left: adjustedInfoPos.x,
            top: adjustedInfoPos.y,
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '300px',
          }}
        >
          <div className="text-mono text-xs text-black">{hoveredInfo}</div>
        </div>
      )}
    </div>
  );
}