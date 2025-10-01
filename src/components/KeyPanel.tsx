import { useDesignStore } from '../state/useDesignStore';
import type { ColorScheme, PartRole } from '../geometry/types';

// Helper function to get color for a part role based on color scheme
function getColorForRole(role: PartRole, colorScheme: ColorScheme): string {
  if (colorScheme === 'random') {
    const hash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137.508) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  }

  const colorSchemes: Record<'greys' | 'browns' | 'blues', Record<string, string>> = {
    greys: {
      'Top': '#6b7280',
      'Bottom': '#6b7280',
      'Side': '#4b5563',
      'VerticalDivider': '#4b5563',
      'BayShelf': '#9ca3af',
      'Back': '#374151',
      'Door': '#d1d5db',
    },
    browns: {
      'Top': '#a0522d',
      'Bottom': '#a0522d',
      'Side': '#8b4513',
      'VerticalDivider': '#8b4513',
      'BayShelf': '#d2691e',
      'Back': '#654321',
      'Door': '#cd853f',
    },
    blues: {
      'Top': '#60a5fa',
      'Bottom': '#60a5fa',
      'Side': '#3b82f6',
      'VerticalDivider': '#3b82f6',
      'BayShelf': '#93c5fd',
      'Back': '#1e40af',
      'Door': '#bfdbfe',
    },
  };

  if (colorScheme === 'greys' || colorScheme === 'browns' || colorScheme === 'blues') {
    return colorSchemes[colorScheme]?.[role] || '#deb887';
  }
  return '#deb887';
}

export function KeyPanel() {
  const { params, setColorScheme, setOpacity } = useDesignStore();

  return (
    <div className="space-y-4">
      {/* Color Scheme Selector */}
      <div>
        <label className="form-label">Color scheme:</label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setColorScheme('greys')}
            className="rounded border-2 transition-all"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#6b7280',
              borderColor: params.colorScheme === 'greys' ? '#3b82f6' : '#d1d5db',
            }}
            title="Greys"
          />
          <button
            onClick={() => setColorScheme('browns')}
            className="rounded border-2 transition-all"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#8b4513',
              borderColor: params.colorScheme === 'browns' ? '#3b82f6' : '#d1d5db',
            }}
            title="Browns"
          />
          <button
            onClick={() => setColorScheme('blues')}
            className="rounded border-2 transition-all"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#3b82f6',
              borderColor: params.colorScheme === 'blues' ? '#3b82f6' : '#d1d5db',
            }}
            title="Blues"
          />
          <button
            onClick={() => setColorScheme('random')}
            className="rounded border-2 transition-all"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #eab308 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)',
              borderColor: params.colorScheme === 'random' ? '#3b82f6' : '#d1d5db',
            }}
            title="Random"
          />
        </div>
      </div>

      <div className="divider" />

      {/* Transparency Slider */}
      <div>
        <label className="form-label">Transparency:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={params.opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-center mt-1">
          {Math.round(params.opacity * 100)}%
        </div>
      </div>

      <div className="divider" />

      {/* Part Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div
            className="rounded border border-gray-300 flex-shrink-0"
            style={{
              width: '0.875rem',
              height: '0.875rem',
              backgroundColor: getColorForRole('Top', params.colorScheme)
            }}
          ></div>
          <span className="text-xs text-mono">Top/Bottom</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded border border-gray-300 flex-shrink-0"
            style={{
              width: '0.875rem',
              height: '0.875rem',
              backgroundColor: getColorForRole('Side', params.colorScheme)
            }}
          ></div>
          <span className="text-xs text-mono">Sides</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded border border-gray-300 flex-shrink-0"
            style={{
              width: '0.875rem',
              height: '0.875rem',
              backgroundColor: getColorForRole('VerticalDivider', params.colorScheme)
            }}
          ></div>
          <span className="text-xs text-mono">Vertical Dividers</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded border border-gray-300 flex-shrink-0"
            style={{
              width: '0.875rem',
              height: '0.875rem',
              backgroundColor: getColorForRole('Door', params.colorScheme)
            }}
          ></div>
          <span className="text-xs text-mono">Doors</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded border border-gray-300 flex-shrink-0"
            style={{
              width: '0.875rem',
              height: '0.875rem',
              backgroundColor: getColorForRole('Back', params.colorScheme)
            }}
          ></div>
          <span className="text-xs text-mono">Back Panels</span>
        </div>
      </div>
    </div>
  );
}
