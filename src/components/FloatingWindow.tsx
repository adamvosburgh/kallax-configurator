import React, { useState, useRef, useEffect } from 'react';
import { useFloatingWindowStore } from '../state/useFloatingWindowStore';

interface FloatingWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  collapsedPreview?: string;
  defaultDocked?: boolean;
  dockedPosition?: { side: 'left' | 'right'; order: number };
}

export function FloatingWindow({
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 320, height: 400 },
  collapsedPreview,
  defaultDocked = false,
  dockedPosition
}: FloatingWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { windows, updateWindow, toggleCollapse, toggleDocked } = useFloatingWindowStore();
  const windowState = windows[id] || {
    position: defaultPosition,
    size: defaultSize,
    isCollapsed: false,
    isVisible: true,
    isDocked: defaultDocked,
    dockedPosition
  };


  useEffect(() => {
    if (!windows[id]) {
      updateWindow(id, {
        position: defaultPosition,
        size: defaultSize,
        isCollapsed: false,
        isVisible: true,
        isDocked: defaultDocked,
        dockedPosition
      });
    }
  }, [id, defaultPosition, defaultSize, defaultDocked, dockedPosition, windows, updateWindow]);

  // Auto-show windows on mount
  useEffect(() => {
    if (windows[id] && !windows[id].isVisible) {
      updateWindow(id, { ...windows[id], isVisible: true });
    }
  }, [id, windows, updateWindow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    if (windowState.isDocked) return; // Don't allow dragging when docked

    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    updateWindow(id, {
      ...windowState,
      position: {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleToggleCollapse = () => {
    toggleCollapse(id);
  };

  const handleToggleDocked = () => {
    toggleDocked(id);
  };

  if (!windowState.isVisible) return null;

  // Floating collapsed state (only when undocked)
  if (windowState.isCollapsed && !windowState.isDocked) {
    return (
      <div
        className="floating-window-collapsed"
        style={{
          top: `${Math.max(120, windowState.position.y)}px`,
        }}
        onClick={handleToggleCollapse}
      >
        <h2 className="text-xs font-medium text-mono">{title}</h2>
      </div>
    );
  }

  const windowClasses = `floating-window ${windowState.isDocked ? 'docked' : ''} ${windowState.isCollapsed ? 'collapsed' : ''}`;

  return (
    <div
      ref={windowRef}
      className={windowClasses}
      style={windowState.isDocked ? {} : {
        left: `${windowState.position.x}px`,
        top: `${windowState.position.y}px`,
        width: `${windowState.size.width}px`,
        height: `${windowState.size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="floating-window-header"
      >
        <h3 className="text-xs font-medium text-mono">{title}</h3>
        <div className="floating-window-header-actions">
          {!windowState.isDocked && (
            <button
              onClick={handleToggleDocked}
              className="btn-icon"
              title="Dock"
            >
              <span className="text-xs">📌</span>
            </button>
          )}
          <button
            onClick={handleToggleCollapse}
            className="btn-icon"
            title={windowState.isCollapsed ? "Expand" : "Collapse"}
          >
            <span className="text-xs font-bold">{windowState.isCollapsed ? '+' : '−'}</span>
          </button>
          {windowState.isDocked && (
            <button
              onClick={handleToggleDocked}
              className="btn-icon"
              title="Undock"
            >
              <span className="text-xs">↗</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="floating-window-content" style={windowState.isDocked ? {} : { height: 'calc(100% - 3.25rem)' }}>
        {children}
      </div>

    </div>
  );
}