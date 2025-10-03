import { useState } from 'react';
import { useDesignStore } from '../state/useDesignStore';
import type { DoorHardwarePosition } from '../geometry/types';

export function OptionsPanel() {
  const {
    params,
    setHasBack,
    setHasDoors,
    setDoorMode,
    setDoorReveal,
    setDoorOverlay,
    setDoorHardwarePosition,
    setDoorHardwareType,
    setDoorHardwareInset,
  } = useDesignStore();

  const doorHardware = params.doorHardware || {
    position: 'top-center',
    type: 'pull-hole',
    insetInches: 1,
  };

  // Local state for input fields to allow empty strings
  const [revealInput, setRevealInput] = useState(String(params.doorMode.revealInches || 0.0625));
  const [overlayInput, setOverlayInput] = useState(String(params.doorMode.overlayInches || 0.25));
  const [hardwareInsetInput, setHardwareInsetInput] = useState(String(doorHardware.insetInches));

  const handlePositionClick = (position: DoorHardwarePosition) => {
    setDoorHardwarePosition(position);
  };

  return (
    <div className="space-y-4">
      {/* Back and Doors */}
      <div className="space-y-3">
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
          <div className="pl-4 space-y-3 border-gray-200">
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
                  value={revealInput}
                  onChange={(e) => {
                    setRevealInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setDoorReveal(val);
                    }
                  }}
                  onBlur={() => {
                    const val = parseFloat(revealInput);
                    if (isNaN(val) || val < 0 || revealInput === '') {
                      setDoorReveal(0.0625);
                      setRevealInput('0.0625');
                    }
                  }}
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
                  value={overlayInput}
                  onChange={(e) => {
                    setOverlayInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setDoorOverlay(val);
                    }
                  }}
                  onBlur={() => {
                    const val = parseFloat(overlayInput);
                    if (isNaN(val) || val < 0 || overlayInput === '') {
                      setDoorOverlay(0.25);
                      setOverlayInput('0.25');
                    }
                  }}
                  className="input-field"
                />
              </div>
            )}

            <div className="divider" />

            {/* Door Hardware Section */}
            <div className="field-group">
              <label className="form-label">Hardware Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDoorHardwareType('drill-guide')}
                  className={`btn btn-sm flex-1 ${doorHardware.type === 'drill-guide' ? 'btn-info' : 'btn-secondary'}`}
                >
                  Drill Guide (1/8")
                </button>
                <button
                  onClick={() => setDoorHardwareType('pull-hole')}
                  className={`btn btn-sm flex-1 ${doorHardware.type === 'pull-hole' ? 'btn-info' : 'btn-secondary'}`}
                >
                  Pull Hole (1")
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="form-label">
                Inset from Edge (inches)
              </label>
              <input
                type="number"
                step="0.125"
                value={hardwareInsetInput}
                onChange={(e) => {
                  setHardwareInsetInput(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    setDoorHardwareInset(val);
                  }
                }}
                onBlur={() => {
                  const val = parseFloat(hardwareInsetInput);
                  if (isNaN(val) || val < 0 || hardwareInsetInput === '') {
                    setDoorHardwareInset(1);
                    setHardwareInsetInput('1');
                  }
                }}
                className="input-field"
              />
            </div>

            <div className="field-group">
              <label className="form-label">Hardware Position</label>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(3, 1fr)',
                    gap: '0.25rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    padding: '0.5rem',
                    backgroundColor: '#fafafa',
                    width: '150px',
                    height: '150px',
                  }}
                >
                {/* Row 1 - Top */}
                <button
                  onClick={() => handlePositionClick('top-left')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'top-left' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'top-left' ? 'white' : '#6b7280',
                  }}
                  title="Top Left"
                >
                  <div className="hardware-dot"></div>
                </button>
                <button
                  onClick={() => handlePositionClick('top-center')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'top-center' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'top-center' ? 'white' : '#6b7280',
                  }}
                  title="Top Center"
                >
                  <div className="hardware-dot"></div>
                </button>
                <button
                  onClick={() => handlePositionClick('top-right')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'top-right' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'top-right' ? 'white' : '#6b7280',
                  }}
                  title="Top Right"
                >
                  <div className="hardware-dot"></div>
                </button>

                {/* Row 2 - Middle */}
                <button
                  onClick={() => handlePositionClick('middle-left')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'middle-left' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'middle-left' ? 'white' : '#6b7280',
                  }}
                  title="Middle Left"
                >
                  <div className="hardware-dot"></div>
                </button>
                <div style={{ border: '1px dashed #d1d5db', borderRadius: '0.25rem' }}></div>
                <button
                  onClick={() => handlePositionClick('middle-right')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'middle-right' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'middle-right' ? 'white' : '#6b7280',
                  }}
                  title="Middle Right"
                >
                  <div className="hardware-dot"></div>
                </button>

                {/* Row 3 - Bottom */}
                <button
                  onClick={() => handlePositionClick('bottom-left')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'bottom-left' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'bottom-left' ? 'white' : '#6b7280',
                  }}
                  title="Bottom Left"
                >
                  <div className="hardware-dot"></div>
                </button>
                <button
                  onClick={() => handlePositionClick('bottom-center')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'bottom-center' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'bottom-center' ? 'white' : '#6b7280',
                  }}
                  title="Bottom Center"
                >
                  <div className="hardware-dot"></div>
                </button>
                <button
                  onClick={() => handlePositionClick('bottom-right')}
                  className="door-hardware-btn"
                  style={{
                    backgroundColor: doorHardware.position === 'bottom-right' ? '#2563eb' : 'white',
                    color: doorHardware.position === 'bottom-right' ? 'white' : '#6b7280',
                  }}
                  title="Bottom Right"
                >
                  <div className="hardware-dot"></div>
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
