import React, { useState, useRef, useEffect } from 'react';
import { useFloatingWindowStore } from '../state/useFloatingWindowStore';

interface FloatingWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  collapsedPreview?: string;
}

export function FloatingWindow({ 
  id, 
  title, 
  children, 
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 320, height: 400 },
  collapsedPreview
}: FloatingWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const { windows, updateWindow, toggleCollapse } = useFloatingWindowStore();
  const windowState = windows[id] || {
    position: defaultPosition,
    size: defaultSize,
    isCollapsed: false,
    isVisible: true
  };


  useEffect(() => {
    if (!windows[id]) {
      updateWindow(id, {
        position: defaultPosition,
        size: defaultSize,
        isCollapsed: false,
        isVisible: true
      });
    }
  }, [id, defaultPosition, defaultSize, windows, updateWindow]);

  // Auto-show windows on mount
  useEffect(() => {
    if (windows[id] && !windows[id].isVisible) {
      updateWindow(id, { ...windows[id], isVisible: true });
    }
  }, [id, windows, updateWindow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    
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

  if (!windowState.isVisible) return null;

  // Collapsed state - dock to left side
  if (windowState.isCollapsed) {
    return (
      <div 
        className="floating-window-collapsed"
        style={{ 
          top: `${Math.max(120, windowState.position.y)}px`,
          left: '16px' 
        }}
        onClick={handleToggleCollapse}
      >
        <h2 className="text-sm font-mono font-medium text-black">{title}</h2>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="floating-window"
      style={{
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
        className="cursor-move border-b border-gray-200 flex items-center justify-between bg-white mb-6"
        style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', padding: '24px 30px' }}
      >
        <h3 className="font-mono text-sm font-medium text-black">{title}</h3>
        <div className="flex items-center">
          <button
            onClick={handleToggleCollapse}
            className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors flex items-center justify-center"
            title="Minimize"
          >
            <span className="text-xs font-bold text-gray-700">−</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="overflow-auto" style={{ height: 'calc(100% - 110px)' }}>
        {children}
      </div>
      
    </div>
  );
}